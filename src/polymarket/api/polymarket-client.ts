import axios from 'axios';
import type { Market, Token, OrderBook, OrderBookEntry, Trade } from '../types.js';
import { config } from '../config.js';
import type { MarketSimulator } from '../simulation/market-simulator.js';

interface GammaMarket {
  id: string;
  conditionId?: string;
  question: string;
  description?: string;
  endDate?: string;
  endDateIso?: string;
  liquidity?: number;
  volume?: number;
  volume24hr?: number;
  active?: boolean;
  closed?: boolean;
  tokens?: Array<{ token_id: string; outcome: string; price?: number }>;
}

interface ClobOrderBook {
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

function parseStrikePrice(question: string): number {
  const match = question.match(/\$([\d,]+(?:\.\d+)?)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(/,/g, ''));
}

function parseDirection(question: string): 'above' | 'below' {
  if (/above|over|exceed|higher|more than|surpass/i.test(question)) return 'above';
  return 'below';
}

function parseAsset(question: string): string {
  if (/\b(btc|bitcoin)\b/i.test(question)) return 'BTC';
  if (/\b(eth|ethereum)\b/i.test(question)) return 'ETH';
  return '';
}

export class PolymarketClient {
  private readonly baseUrl: string;
  private readonly clobBaseUrl: string;
  private simulator: MarketSimulator | null = null;
  private liveAvailable: boolean | null = null;  // null = untested

  constructor() {
    this.baseUrl     = config.polymarket.baseUrl;
    this.clobBaseUrl = config.polymarket.clobBaseUrl;
  }

  attachSimulator(sim: MarketSimulator): void {
    this.simulator = sim;
    console.log('[Polymarket] market simulator attached — will use when API unavailable');
  }

  async getBtcEthMarkets(): Promise<Market[]> {
    // Try live API first (if not already known to be blocked)
    if (this.liveAvailable !== false && !this.simulator) {
      const live = await this.fetchLiveMarkets();
      if (live.length > 0) { this.liveAvailable = true; return live; }
      this.liveAvailable = false;
    }
    if (this.simulator) {
      return this.simulator.getMarkets();
    }
    return [];
  }

  async getOrderBook(tokenId: string): Promise<OrderBook | null> {
    if (this.simulator) return this.simulator.getOrderBook(tokenId);
    try {
      const { data } = await axios.get<ClobOrderBook>(
        `${this.clobBaseUrl}/book`,
        { params: { token_id: tokenId }, timeout: 10_000 }
      );
      const bids: OrderBookEntry[] = (data.bids ?? [])
        .map(b => ({ price: parseFloat(b.price), size: parseFloat(b.size) }))
        .filter(b => !isNaN(b.price)).sort((a, b) => b.price - a.price);
      const asks: OrderBookEntry[] = (data.asks ?? [])
        .map(a => ({ price: parseFloat(a.price), size: parseFloat(a.size) }))
        .filter(a => !isNaN(a.price)).sort((a, b) => a.price - b.price);
      if (!bids.length && !asks.length) return null;
      const bestBid = bids[0]?.price ?? 0;
      const bestAsk = asks[0]?.price ?? 1;
      return { tokenId, bids, asks, bestBid, bestAsk, spread: bestAsk - bestBid, midPrice: (bestBid + bestAsk) / 2 };
    } catch { return null; }
  }

  // Returns 1.0 / 0.0 settlement if the market has expired in simulation
  settleMarket(marketId: string): number | null {
    return this.simulator?.settle(marketId) ?? null;
  }

  getExpiredMarketIds(): string[] {
    return this.simulator?.getExpiredMarketIds() ?? [];
  }

  async placePaperOrder(
    tokenId: string, side: 'BUY' | 'SELL', sizeUsd: number, limitPrice: number
  ): Promise<Partial<Trade>> {
    const id = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return { id, timestamp: Date.now(), tokenId, side, sizeUsd, shares: sizeUsd / limitPrice,
             price: limitPrice, fee: sizeUsd * config.risk.feePct, mode: 'paper', status: 'filled' };
  }

  private async fetchLiveMarkets(): Promise<Market[]> {
    try {
      const { data } = await axios.get<GammaMarket[]>(`${this.baseUrl}/markets`, {
        params: { limit: 100, active: true }, timeout: 15_000,
      });
      const raw = Array.isArray(data) ? data : [];
      const markets: Market[] = [];
      for (const m of raw) {
        const asset  = parseAsset(m.question ?? '');
        const strike = parseStrikePrice(m.question ?? '');
        if (!asset || strike === 0) continue;
        const rawTokens = m.tokens ?? [];
        if (rawTokens.length < 2) continue;
        const tokens: Token[] = rawTokens.map(t => ({
          tokenId: t.token_id, outcome: t.outcome, price: parseFloat(String(t.price ?? '0.5')),
        }));
        markets.push({
          id: m.id, conditionId: m.conditionId ?? m.id, question: m.question,
          description: m.description ?? '', endDate: m.endDateIso ?? m.endDate ?? '',
          asset, strikePrice: strike, direction: parseDirection(m.question), tokens,
          liquidity: m.liquidity ?? 0, volume24h: m.volume24hr ?? m.volume ?? 0, active: !m.closed,
        });
      }
      return markets;
    } catch { return []; }
  }
}
