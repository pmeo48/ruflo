import axios from 'axios';
import type { SpotPrice } from '../types.js';
import { config } from '../config.js';
import type { PriceSimulator } from '../simulation/price-simulator.js';

const ASSET_IDS = ['bitcoin', 'ethereum'];

interface CoinGeckoSimplePrice {
  [coinId: string]: { usd: number };
}

interface CoinGeckoMarketChart {
  prices: [number, number][];
}

export class CoinGeckoClient {
  private readonly baseUrl: string;
  private lastFetch = 0;
  private cache = new Map<string, SpotPrice>();
  private readonly minIntervalMs = 10_000;
  private simulator: PriceSimulator | null = null;
  private simulatorTick = Date.now();  // init to now so first elapsed = 0

  constructor() {
    this.baseUrl = config.coingecko.baseUrl;
  }

  // Attach a simulator to use when the real API is unavailable
  attachSimulator(sim: PriceSimulator): void {
    this.simulator = sim;
    console.log('[CoinGecko] price simulator attached — will use when API unavailable');
  }

  async getSpotPrices(): Promise<SpotPrice[]> {
    const now = Date.now();
    if (now - this.lastFetch < this.minIntervalMs && this.cache.size > 0) {
      // If using simulator, always advance and return fresh sim prices
      if (this.simulator) return this.getSimPrices(now - this.lastFetch);
      return Array.from(this.cache.values());
    }

    if (!this.simulator) {
      try {
        return await this.fetchLive();
      } catch {
        // Fall through to empty — will log once below
      }
    }

    const elapsed = Math.min(now - this.simulatorTick, 60_000);  // cap at 60 s real-time
  return this.getSimPrices(elapsed || 5_000);
  }

  async getSpotPrice(asset: string): Promise<SpotPrice | null> {
    const prices = await this.getSpotPrices();
    return prices.find(p => p.asset === asset) ?? null;
  }

  async getHistoricalPrices(asset: string, days: number): Promise<Array<{ timestamp: number; price: number }>> {
    const simRef = this.simulator;
    if (simRef !== null) return simRef.generateHistorical(asset, days);
    try {
      const url = `${this.baseUrl}/coins/${asset}/market_chart`;
      const params: Record<string, string | number> = { vs_currency: 'usd', days, interval: 'daily' };
      if (config.coingecko.apiKey) params['x_cg_pro_api_key'] = config.coingecko.apiKey;
      const { data } = await axios.get<CoinGeckoMarketChart>(url, { params, timeout: 15_000 });
      return data.prices.map(([ts, price]) => ({ timestamp: ts, price }));
    } catch (err) {
      console.error('[CoinGecko] historical fetch failed:', (err as Error).message);
      // Simulator may have been attached after function entry (race-safe read)
      const lateRef = this.simulator;
      if (lateRef !== null) return (lateRef as NonNullable<typeof lateRef>).generateHistorical(asset, days);
      return [];
    }
  }

  computeAnnualizedVol(prices: number[]): number {
    if (prices.length < 2) return 0.8;
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance) * Math.sqrt(252);
  }

  private async fetchLive(): Promise<SpotPrice[]> {
    const now    = Date.now();
    const url    = `${this.baseUrl}/simple/price`;
    const params: Record<string, string> = { ids: ASSET_IDS.join(','), vs_currencies: 'usd' };
    if (config.coingecko.apiKey)     params['x_cg_pro_api_key']  = config.coingecko.apiKey;
    else if (config.coingecko.demoApiKey) params['x_cg_demo_api_key'] = config.coingecko.demoApiKey;

    const { data } = await axios.get<CoinGeckoSimplePrice>(url, { params, timeout: 10_000 });
    const prices: SpotPrice[] = [];
    for (const id of ASSET_IDS) {
      if (data[id]) {
        const spot: SpotPrice = { asset: id, price: data[id].usd, timestamp: now };
        this.cache.set(id, spot);
        prices.push(spot);
      }
    }
    this.lastFetch = now;
    return prices;
  }

  private getSimPrices(elapsedMs: number): SpotPrice[] {
    if (!this.simulator) return [];
    const raw       = this.simulator.tick(elapsedMs);
    const timestamp = Date.now();
    this.simulatorTick = timestamp;
    this.lastFetch     = timestamp;
    const prices: SpotPrice[] = [];
    for (const id of ASSET_IDS) {
      if (raw[id] !== undefined) {
        const spot: SpotPrice = { asset: id, price: raw[id], timestamp };
        this.cache.set(id, spot);
        prices.push(spot);
      }
    }
    return prices;
  }
}
