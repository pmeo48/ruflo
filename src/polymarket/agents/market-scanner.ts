import type { Market, SpotPrice, FairValue, AgentState } from '../types.js';
import type { PolymarketClient } from '../api/polymarket-client.js';
import type { CoinGeckoClient } from '../api/coingecko-client.js';
import { eventBus } from '../event-bus.js';
import { config } from '../config.js';

// Standard normal CDF approximation (Horner's method)
function normCdf(x: number): number {
  const a1 =  0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 =  1.061405429, p  =  0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5*t + a4)*t + a3)*t + a2)*t + a1) * t * Math.exp(-x*x);
  return 0.5 * (1 + sign * y);
}

// Black-Scholes probability for binary "price above K at T" contract
function binaryCallProbability(
  spot: number,
  strike: number,
  timeYears: number,
  annualVol: number,
  riskFreeRate: number
): number {
  if (timeYears <= 0 || spot <= 0 || strike <= 0 || annualVol <= 0) return 0.5;
  const d2 = (Math.log(spot / strike) + (riskFreeRate - 0.5 * annualVol ** 2) * timeYears)
             / (annualVol * Math.sqrt(timeYears));
  return normCdf(d2);
}

function getVolForAsset(asset: string): number {
  if (asset === 'BTC') return config.trading.volatilityBtc;
  if (asset === 'ETH') return config.trading.volatilityEth;
  return 0.9;
}

function yearsUntil(endDate: string): number {
  const ms = new Date(endDate).getTime() - Date.now();
  return Math.max(ms / (365.25 * 24 * 3600 * 1000), 1 / 365);
}

export class MarketScanner {
  private state: AgentState = {
    name: 'MarketScanner',
    status: 'idle',
    lastActivity: 0,
    metrics: {},
    errors: [],
  };
  private intervalId?: ReturnType<typeof setInterval>;
  private markets: Market[] = [];
  private latestFairValues: FairValue[] = [];

  constructor(
    private readonly polymarket: PolymarketClient,
    private readonly coingecko: CoinGeckoClient
  ) {}

  async start(): Promise<void> {
    this.state.status = 'running';
    console.log('[MarketScanner] starting');
    await this.scan();
    this.intervalId = setInterval(() => this.scan(), config.trading.scanIntervalMs);
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.state.status = 'stopped';
    console.log('[MarketScanner] stopped');
  }

  getState(): AgentState { return { ...this.state }; }
  getMarkets(): Market[] { return this.markets; }
  getLatestFairValues(): FairValue[] { return this.latestFairValues; }

  private async scan(): Promise<void> {
    try {
      this.state.lastActivity = Date.now();
      const [markets, spotPrices] = await Promise.all([
        this.polymarket.getBtcEthMarkets(),
        this.coingecko.getSpotPrices(),
      ]);

      this.markets = markets;
      const spotMap = new Map<string, number>(spotPrices.map(s => [
        s.asset === 'bitcoin' ? 'BTC' : s.asset === 'ethereum' ? 'ETH' : s.asset,
        s.price,
      ]));

      const fairValues: FairValue[] = [];
      for (const market of markets) {
        const spot = spotMap.get(market.asset);
        if (spot == null || spot <= 0) continue;
        const vol = getVolForAsset(market.asset);
        const T   = yearsUntil(market.endDate);
        const fairProb = market.direction === 'above'
          ? binaryCallProbability(spot, market.strikePrice, T, vol, config.trading.riskFreeRate)
          : 1 - binaryCallProbability(spot, market.strikePrice, T, vol, config.trading.riskFreeRate);

        // YES token is index 0 by convention
        const yesToken = market.tokens.find(t => t.outcome.toLowerCase() === 'yes') ?? market.tokens[0];
        if (!yesToken) continue;

        const mktProb = yesToken.price;
        const edge    = fairProb - mktProb;

        fairValues.push({
          marketId:          market.id,
          tokenId:           yesToken.tokenId,
          outcome:           yesToken.outcome,
          fairProbability:   fairProb,
          marketProbability: mktProb,
          edge,
          confidence:        Math.min(Math.abs(edge) / 0.2, 1), // scales up to confidence=1 at 20% edge
          asset:             market.asset,
          strikePrice:       market.strikePrice,
          expiryDate:        market.endDate,
          spotPrice:         spot,
        });
      }

      this.latestFairValues = fairValues;
      const mispricings = fairValues.filter(fv => Math.abs(fv.edge) >= config.trading.signalThreshold);

      this.state.metrics = {
        marketsScanned:  markets.length,
        mispricingsFound: mispricings.length,
        lastScan:        new Date().toISOString(),
      };

      // Build tokenId → currentPrice map for position mark-to-market
      const tokenPriceMap = new Map<string, number>();
      for (const mkt of markets) {
        for (const tok of mkt.tokens) tokenPriceMap.set(tok.tokenId, tok.price);
      }

      eventBus.publish({
        type: 'market_scanned',
        timestamp: Date.now(),
        data: {
          marketsCount:    markets.length,
          mispricingsCount: mispricings.length,
          fairValues:      fairValues.slice(0, 20),
          spotPrices:      Object.fromEntries(spotMap),
          tokenPrices:     Object.fromEntries(tokenPriceMap),
        },
      });

      eventBus.publish({
        type: 'price_update',
        timestamp: Date.now(),
        data: { spotPrices: Object.fromEntries(spotMap), tokenPrices: Object.fromEntries(tokenPriceMap) },
      });

      const scanMsg = markets.length > 0
        ? `[MarketScanner] ${markets.length} markets — ${mispricings.length} mispricing(s)`
        : '[MarketScanner] no markets returned (API or simulator not ready)';
      if (markets.length > 0 || mispricings.length > 0) console.log(scanMsg);
    } catch (err) {
      const msg = (err as Error).message;
      this.state.errors.push(msg);
      this.state.status = 'error';
      console.error('[MarketScanner] scan error:', msg);
    }
  }
}
