import axios from 'axios';
import type { SpotPrice } from '../types.js';
import { config } from '../config.js';

const ASSET_IDS = ['bitcoin', 'ethereum'];

interface CoinGeckoSimplePrice {
  [coinId: string]: { usd: number };
}

interface CoinGeckoMarketChart {
  prices: [number, number][];   // [timestamp, price]
}

export class CoinGeckoClient {
  private readonly baseUrl: string;
  private lastFetch = 0;
  private cache = new Map<string, SpotPrice>();
  private readonly minIntervalMs = 10_000;  // free tier rate limit buffer

  constructor() {
    this.baseUrl = config.coingecko.baseUrl;
  }

  async getSpotPrices(): Promise<SpotPrice[]> {
    const now = Date.now();
    if (now - this.lastFetch < this.minIntervalMs && this.cache.size > 0) {
      return Array.from(this.cache.values());
    }

    try {
      const ids = ASSET_IDS.join(',');
      const url = `${this.baseUrl}/simple/price`;
      const params: Record<string, string> = { ids, vs_currencies: 'usd' };
      if (config.coingecko.apiKey) params['x_cg_pro_api_key'] = config.coingecko.apiKey;
      else if (config.coingecko.demoApiKey) params['x_cg_demo_api_key'] = config.coingecko.demoApiKey;

      const { data } = await axios.get<CoinGeckoSimplePrice>(url, {
        params,
        timeout: 10_000,
      });

      const timestamp = Date.now();
      const prices: SpotPrice[] = [];
      for (const id of ASSET_IDS) {
        if (data[id]) {
          const spot: SpotPrice = { asset: id, price: data[id].usd, timestamp };
          this.cache.set(id, spot);
          prices.push(spot);
        }
      }

      this.lastFetch = now;
      return prices;
    } catch (err) {
      console.error('[CoinGecko] price fetch failed:', (err as Error).message);
      // Return stale cache on error
      return Array.from(this.cache.values());
    }
  }

  async getSpotPrice(asset: string): Promise<SpotPrice | null> {
    const prices = await this.getSpotPrices();
    return prices.find(p => p.asset === asset) ?? null;
  }

  // Fetch daily OHLC for backtesting. Returns array of [timestamp, price] pairs.
  async getHistoricalPrices(asset: string, days: number): Promise<Array<{ timestamp: number; price: number }>> {
    try {
      const url = `${this.baseUrl}/coins/${asset}/market_chart`;
      const params: Record<string, string | number> = {
        vs_currency: 'usd',
        days,
        interval: 'daily',
      };
      if (config.coingecko.apiKey) params['x_cg_pro_api_key'] = config.coingecko.apiKey;

      const { data } = await axios.get<CoinGeckoMarketChart>(url, { params, timeout: 15_000 });
      return data.prices.map(([ts, price]) => ({ timestamp: ts, price }));
    } catch (err) {
      console.error('[CoinGecko] historical fetch failed:', (err as Error).message);
      return [];
    }
  }

  // Derive annualized volatility from recent daily prices
  computeAnnualizedVol(prices: number[]): number {
    if (prices.length < 2) return 0.8;
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance) * Math.sqrt(252);  // annualize daily vol
  }
}
