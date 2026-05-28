import type { Market, Token, OrderBook, OrderBookEntry } from '../types.js';
import type { PriceSimulator } from './price-simulator.js';

function normCdf(x: number): number {
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return 0.5 * (1 + sign * y);
}

export function binaryCallProb(spot: number, strike: number, T: number, vol: number, r = 0.05): number {
  if (T <= 0) return spot > strike ? 1 : 0;
  const d2 = (Math.log(spot / strike) + (r - 0.5 * vol * vol) * T) / (vol * Math.sqrt(T));
  return normCdf(d2);
}

const STRIKE_OFFSETS = [0.80, 0.90, 0.95, 1.00, 1.05, 1.10, 1.20, 1.30];
const EXPIRY_DAYS    = [7, 14, 30, 60];
export const VOL: Record<string, number> = { BTC: 0.80, ETH: 1.00 };

// Market price is frozen for this long before re-sampling a new fair-value + noise.
// 30 s real ≈ 30 h simulated at 3600× compression — gives substantial lag-based edge.
const PRICE_TTL_MS  = 30_000;
// Bias magnitude: market prices can deviate ±15% from fair value
const BIAS_MAX      = 0.15;

interface SimMarketMeta {
  id: string;
  asset: string;
  strike: number;
  direction: 'above' | 'below';
  expiryDays: number;
  expiryAt: number;   // simulated timestamp
}

interface CachedPrice {
  yesPrice: number;  // frozen market price (fair + bias at snapshot time)
  bias: number;      // the bias value, stored for debugging
  snapAt: number;    // real wall-clock time of last snapshot
}

export class MarketSimulator {
  private markets:     SimMarketMeta[]           = [];
  private marketMap  = new Map<string, SimMarketMeta>();
  private priceCache = new Map<string, CachedPrice>();
  private lastRebuild = 0;

  constructor(private readonly priceSim: PriceSimulator) {}

  getMarkets(): Market[] {
    this.maybeRebuild();
    const result: Market[] = [];

    for (const meta of this.markets) {
      const spot    = this.priceSim.getPrice(meta.asset === 'BTC' ? 'bitcoin' : 'ethereum');
      const T       = Math.max((meta.expiryAt - this.priceSim.getSimTime()) / (365.25 * 24 * 3600 * 1000), 0);
      const fairP   = binaryCallProb(spot, meta.strike, T, VOL[meta.asset] ?? 0.8);
      const mktProb = this.getCachedPrice(meta, fairP);

      const yesToken: Token = { tokenId: `${meta.id}-yes`, outcome: 'Yes', price: mktProb };
      const noToken:  Token = { tokenId: `${meta.id}-no`,  outcome: 'No',  price: Math.max(0.01, 1 - mktProb) };

      result.push({
        id:          meta.id,
        conditionId: meta.id,
        question:    `Will ${meta.asset} be ${meta.direction} $${meta.strike.toLocaleString()} by ${new Date(meta.expiryAt).toLocaleDateString()}?`,
        description: `Simulated ${meta.asset} price prediction market`,
        endDate:     new Date(meta.expiryAt).toISOString(),
        asset:       meta.asset,
        strikePrice: meta.strike,
        direction:   meta.direction,
        tokens:      [yesToken, noToken],
        liquidity:   10_000 + Math.random() * 90_000,
        volume24h:   1_000  + Math.random() * 20_000,
        active:      true,
      });
    }
    return result;
  }

  getOrderBook(tokenId: string): OrderBook | null {
    const marketId = tokenId.replace(/-yes$|-no$/, '');
    const meta     = this.marketMap.get(marketId);
    if (!meta) return null;

    const isYes  = tokenId.endsWith('-yes');
    const spot   = this.priceSim.getPrice(meta.asset === 'BTC' ? 'bitcoin' : 'ethereum');
    const T      = Math.max((meta.expiryAt - this.priceSim.getSimTime()) / (365.25 * 24 * 3600 * 1000), 0);
    const fairP  = binaryCallProb(spot, meta.strike, T, VOL[meta.asset] ?? 0.8);
    const cached = this.getCachedPrice(meta, fairP);
    const mid    = Math.max(0.02, Math.min(0.98, isYes ? cached : 1 - cached));
    const spread = 0.01 + Math.random() * 0.015;

    const bids: OrderBookEntry[] = [
      { price: Math.max(0.01, mid - spread / 2), size: 500 + Math.random() * 1000 },
      { price: Math.max(0.01, mid - spread),     size: 200 + Math.random() * 500  },
    ];
    const asks: OrderBookEntry[] = [
      { price: Math.min(0.99, mid + spread / 2), size: 500 + Math.random() * 1000 },
      { price: Math.min(0.99, mid + spread),     size: 200 + Math.random() * 500  },
    ];
    return { tokenId, bids, asks, bestBid: bids[0].price, bestAsk: asks[0].price, spread, midPrice: mid };
  }

  settle(marketId: string): number | null {
    const meta = this.marketMap.get(marketId);
    if (!meta) return null;
    const spot = this.priceSim.getPrice(meta.asset === 'BTC' ? 'bitcoin' : 'ethereum');
    return spot > meta.strike ? 1.0 : 0.0;
  }

  getExpiredMarketIds(): string[] {
    const simNow = this.priceSim.getSimTime();
    return this.markets.filter(m => m.expiryAt <= simNow).map(m => m.id);
  }

  private getCachedPrice(meta: SimMarketMeta, currentFairProb: number): number {
    const now    = Date.now();
    const cached = this.priceCache.get(meta.id);

    if (cached && now - cached.snapAt < PRICE_TTL_MS) {
      return cached.yesPrice;  // price is frozen — creates lag vs moving spot
    }

    // Generate a new biased price. Bias is uniformly random in [-BIAS_MAX, +BIAS_MAX].
    // This guarantees ~BIAS_MAX-threshold / BIAS_MAX ≈ 67% of markets have |edge| > threshold.
    const bias     = (Math.random() - 0.5) * 2 * BIAS_MAX;
    const newPrice = Math.max(0.02, Math.min(0.98, currentFairProb + bias));
    this.priceCache.set(meta.id, { yesPrice: newPrice, bias, snapAt: now });
    return newPrice;
  }

  private maybeRebuild(): void {
    const now = Date.now();
    if (now - this.lastRebuild < 60_000 && this.markets.length > 0) return;
    this.rebuild();
    this.lastRebuild = now;
  }

  private rebuild(): void {
    const simNow = this.priceSim.getSimTime();
    this.markets = this.markets.filter(m => m.expiryAt > simNow);

    for (const [coinId, asset] of [['bitcoin', 'BTC'], ['ethereum', 'ETH']] as const) {
      const spot = this.priceSim.getPrice(coinId);
      for (const offset of STRIKE_OFFSETS) {
        for (const days of EXPIRY_DAYS) {
          const strike    = Math.round(spot * offset / 100) * 100;
          const direction = offset >= 1 ? 'above' : 'below';
          const id        = `sim-${asset}-${strike}-${days}d`;
          if (this.marketMap.has(id)) continue;
          const meta: SimMarketMeta = {
            id, asset, strike,
            direction: direction as 'above' | 'below',
            expiryDays: days,
            expiryAt:   simNow + days * 24 * 3600 * 1000,
          };
          this.markets.push(meta);
          this.marketMap.set(id, meta);
        }
      }
    }
  }
}
