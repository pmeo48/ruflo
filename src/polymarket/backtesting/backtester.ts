import type { BacktestConfig, BacktestResult, Trade, PnlSnapshot, FairValue } from '../types.js';
import type { CoinGeckoClient } from '../api/coingecko-client.js';

// Standard normal CDF
function normCdf(x: number): number {
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return 0.5 * (1 + sign * y);
}

function binaryCallProb(spot: number, strike: number, T: number, vol: number, r: number): number {
  if (T <= 0) return spot > strike ? 1 : 0;
  const d2 = (Math.log(spot / strike) + (r - 0.5 * vol ** 2) * T) / (vol * Math.sqrt(T));
  return normCdf(d2);
}

interface SyntheticMarket {
  id: string;
  asset: string;          // 'BTC' | 'ETH'
  strikePrice: number;
  direction: 'above' | 'below';
  expiryDays: number;
  expiryTs: number;
  openTs: number;
  question: string;
}

function generateSyntheticMarkets(spotPrice: number, asset: string, ts: number): SyntheticMarket[] {
  const markets: SyntheticMarket[] = [];
  // Generate strikes at ±5%, ±10%, ±20% of current spot
  const offsets = [0.95, 0.90, 1.05, 1.10, 1.20, 0.80];
  const expiries = [7, 14, 30];
  for (const off of offsets) {
    for (const days of expiries) {
      const strike = Math.round(spotPrice * off);
      const dir = off > 1 ? 'above' : 'below';
      markets.push({
        id:          `${asset}-${strike}-${days}d-${ts}`,
        asset,
        strikePrice: strike,
        direction:   dir as 'above' | 'below',
        expiryDays:  days,
        expiryTs:    ts + days * 86_400_000,
        openTs:      ts,
        question:    `Will ${asset} be ${dir} $${strike} in ${days} days?`,
      });
    }
  }
  return markets;
}

function kellySize(
  fairProb: number, mktProb: number, kellyFraction: number, maxPositionPct: number, cash: number
): number {
  const p = fairProb;
  const entryPrice = mktProb;
  if (entryPrice <= 0 || entryPrice >= 1) return 0;
  const b = (1 - entryPrice) / entryPrice;
  const raw = (p * (b + 1) - 1) / b;
  if (raw <= 0) return 0;
  const frac = Math.min(raw * kellyFraction, maxPositionPct);
  return frac * cash;
}

function addNoise(prob: number, noiseSd: number = 0.05): number {
  const noise = (Math.random() - 0.5) * 2 * noiseSd;
  return Math.max(0.01, Math.min(0.99, prob + noise));
}

export class Backtester {
  constructor(private readonly coingecko: CoinGeckoClient) {}

  async run(cfg: BacktestConfig): Promise<BacktestResult> {
    console.log(`[Backtester] running ${cfg.startDate} → ${cfg.endDate}`);

    // Load historical price data
    const start = new Date(cfg.startDate).getTime();
    const end   = new Date(cfg.endDate).getTime();
    const days  = Math.ceil((end - start) / 86_400_000) + 30;

    const priceSeriesByAsset = new Map<string, Array<{timestamp: number; price: number}>>();
    for (const asset of cfg.assets) {
      const coinId = asset === 'BTC' ? 'bitcoin' : 'ethereum';
      const data = await this.coingecko.getHistoricalPrices(coinId, days);
      priceSeriesByAsset.set(asset, data.filter(d => d.timestamp >= start - 30*86_400_000 && d.timestamp <= end));
    }

    // State
    let cash         = cfg.initialCapital;
    let peakValue    = cfg.initialCapital;
    const trades:    Trade[] = [];
    const pnlHistory: PnlSnapshot[] = [];
    const openPositions: Map<string, { size: number; entryPrice: number; asset: string; strike: number; expiryTs: number; fairProb: number }> = new Map();

    const vol = { BTC: 0.80, ETH: 1.00 };
    const r   = 0.05;
    const threshold = cfg.signalThreshold;

    // Build a sorted timeline of all price points
    const timeline: Array<{ts: number; asset: string; price: number}> = [];
    for (const [asset, prices] of priceSeriesByAsset) {
      for (const p of prices) timeline.push({ ts: p.timestamp, asset, price: p.price });
    }
    timeline.sort((a, b) => a.ts - b.ts);

    // Track last known spot price per asset
    const spotMap = new Map<string, number>();
    let tradeId = 0;

    for (const tick of timeline) {
      if (tick.ts < start || tick.ts > end) continue;
      spotMap.set(tick.asset, tick.price);

      // Check expiries
      for (const [posId, pos] of openPositions) {
        if (tick.ts >= pos.expiryTs) {
          const spot = spotMap.get(pos.asset);
          if (spot === undefined) continue;
          // Binary settlement: YES pays $1 if condition met, $0 otherwise
          const won = spot > pos.strike;
          const exitPrice = won ? 1.0 : 0.0;
          const proceeds  = pos.size / pos.entryPrice * exitPrice;
          const pnl       = proceeds - pos.size;
          cash += proceeds;
          openPositions.delete(posId);
          trades.push({
            id: `bt-close-${++tradeId}`,
            timestamp: tick.ts,
            marketId: posId,
            tokenId:  posId,
            question: `${pos.asset} > $${pos.strike}`,
            side:     'SELL',
            sizeUsd:  proceeds,
            shares:   pos.size / pos.entryPrice,
            price:    exitPrice,
            fee:      0,
            mode:     'paper',
            status:   'filled',
            pnl,
          });
        }
      }

      // Drawdown stop
      const totalValue = cash + [...openPositions.values()].reduce((s, p) => {
        const spot = spotMap.get(p.asset) ?? p.entryPrice;
        const fair = binaryCallProb(spot, p.strike, Math.max((p.expiryTs - tick.ts) / (365*86_400_000), 0), vol[p.asset as keyof typeof vol] ?? 0.8, r);
        return s + (p.size / p.entryPrice) * fair;
      }, 0);

      peakValue = Math.max(peakValue, totalValue);
      const drawdown = peakValue > 0 ? (peakValue - totalValue) / peakValue : 0;
      if (drawdown >= cfg.maxDrawdownPct) {
        pnlHistory.push({ timestamp: tick.ts, portfolioValue: totalValue, cash, positionsValue: totalValue - cash, pnl: totalValue - cfg.initialCapital, pnlPct: (totalValue - cfg.initialCapital)/cfg.initialCapital, drawdown });
        break;
      }

      // Scan for new opportunities (once per day = first tick of asset per day)
      const dayKey = new Date(tick.ts).toDateString() + tick.asset;
      if ((tick.ts % 86_400_000) < 3_600_000) {  // first-ish tick of day
        const synMarkets = generateSyntheticMarkets(tick.price, tick.asset, tick.ts);
        for (const mkt of synMarkets) {
          if (openPositions.size >= 5) break;
          if (openPositions.has(mkt.id)) continue;
          const T        = mkt.expiryDays / 365;
          const fairProb = binaryCallProb(tick.price, mkt.strikePrice, T, vol[mkt.asset as keyof typeof vol] ?? 0.8, r);
          const mktProb  = addNoise(fairProb, 0.04);  // simulate market with noise
          const edge     = fairProb - mktProb;
          if (Math.abs(edge) < threshold) continue;

          const sizeUsd = kellySize(fairProb, mktProb, cfg.kellyFraction, cfg.maxPositionPct, cash);
          if (sizeUsd < 5 || sizeUsd > cash) continue;

          cash -= sizeUsd;
          openPositions.set(mkt.id, {
            size:       sizeUsd,
            entryPrice: mktProb,
            asset:      mkt.asset,
            strike:     mkt.strikePrice,
            expiryTs:   mkt.expiryTs,
            fairProb,
          });
          trades.push({
            id:        `bt-open-${++tradeId}`,
            timestamp: tick.ts,
            marketId:  mkt.id,
            tokenId:   mkt.id,
            question:  mkt.question,
            side:      edge > 0 ? 'BUY' : 'SELL',
            sizeUsd,
            shares:    sizeUsd / mktProb,
            price:     mktProb,
            fee:       sizeUsd * 0.002,
            mode:      'paper',
            status:    'filled',
          });
        }
      }

      // Record P&L snapshot every ~7 days
      if (tick.ts % (7 * 86_400_000) < 86_400_000) {
        pnlHistory.push({ timestamp: tick.ts, portfolioValue: totalValue, cash, positionsValue: totalValue - cash, pnl: totalValue - cfg.initialCapital, pnlPct: (totalValue - cfg.initialCapital)/cfg.initialCapital, drawdown });
      }
    }

    // Final snapshot
    const finalValue   = cash;
    const totalReturn  = (finalValue - cfg.initialCapital) / cfg.initialCapital;
    const durationDays = (end - start) / 86_400_000;
    const annualReturn = Math.pow(1 + totalReturn, 365 / durationDays) - 1;

    const closedTrades = trades.filter(t => t.side === 'SELL' && t.pnl !== undefined);
    const wins  = closedTrades.filter(t => (t.pnl ?? 0) > 0);
    const losses = closedTrades.filter(t => (t.pnl ?? 0) <= 0);
    const winRate = closedTrades.length > 0 ? wins.length / closedTrades.length : 0;
    const avgWin  = wins.length  > 0 ? wins.reduce((s, t)  => s + (t.pnl ?? 0), 0) / wins.length  : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;

    // Sharpe (approximate from P&L snapshots)
    const returns = pnlHistory.slice(1).map((s, i) => s.pnl - pnlHistory[i].pnl);
    const meanR = returns.length > 0 ? returns.reduce((a,b) => a+b, 0) / returns.length : 0;
    const stdR  = returns.length > 1 ? Math.sqrt(returns.reduce((s, r) => s + (r-meanR)**2, 0) / (returns.length-1)) : 1;
    const sharpe = stdR > 0 ? (meanR / stdR) * Math.sqrt(52) : 0;  // weekly periods

    const maxDD = pnlHistory.reduce((m, s) => Math.max(m, s.drawdown), 0);

    console.log(`[Backtester] done — return=${(totalReturn*100).toFixed(1)}% sharpe=${sharpe.toFixed(2)} maxDD=${(maxDD*100).toFixed(1)}% trades=${trades.length}`);

    return {
      config: cfg,
      totalReturnPct:    totalReturn * 100,
      annualizedReturnPct: annualReturn * 100,
      sharpeRatio:       sharpe,
      maxDrawdownPct:    maxDD * 100,
      winRate:           winRate * 100,
      totalTrades:       trades.length,
      profitFactor,
      avgWin,
      avgLoss,
      pnlHistory,
      trades,
      durationDays,
    };
  }
}
