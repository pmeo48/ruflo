import axios from 'axios';
import type { Market, Token, OrderBook, OrderBookEntry, Trade } from '../types.js';
import { config } from '../config.js';

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

// Keywords that indicate BTC/ETH price prediction markets
const ASSET_PATTERNS: Record<string, RegExp> = {
  BTC: /\b(btc|bitcoin)\b.*\b(\$[\d,]+|[\d,]+\s*k)\b/i,
  ETH: /\b(eth|ethereum)\b.*\b(\$[\d,]+|[\d,]+\s*k)\b/i,
};

// Extract strike price from question text like "Will BTC exceed $100,000 by..."
function parseStrikePrice(question: string): number {
  const match = question.match(/\$([\d,]+(?:\.\d+)?)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(/,/g, ''));
}

function parseDirection(question: string): 'above' | 'below' {
  const lower = question.toLowerCase();
  if (/above|over|exceed|higher|more than|surpass/i.test(lower)) return 'above';
  if (/below|under|less than|drop/i.test(lower)) return 'below';
  return 'above';
}

function parseAsset(question: string): string {
  if (/\b(btc|bitcoin)\b/i.test(question)) return 'BTC';
  if (/\b(eth|ethereum)\b/i.test(question)) return 'ETH';
  return '';
}

export class PolymarketClient {
  private readonly baseUrl: string;
  private readonly clobBaseUrl: string;

  constructor() {
    this.baseUrl    = config.polymarket.baseUrl;
    this.clobBaseUrl = config.polymarket.clobBaseUrl;
  }

  async getMarkets(params: Record<string, string | number | boolean> = {}): Promise<GammaMarket[]> {
    try {
      const { data } = await axios.get<GammaMarket[]>(`${this.baseUrl}/markets`, {
        params: { limit: 100, active: true, ...params },
        timeout: 15_000,
      });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('[Polymarket] markets fetch failed:', (err as Error).message);
      return [];
    }
  }

  // Filter raw markets down to BTC/ETH price prediction contracts
  async getBtcEthMarkets(): Promise<Market[]> {
    const raw = await this.getMarkets({ tag_slug: 'crypto' });
    const markets: Market[] = [];

    for (const m of raw) {
      const asset = parseAsset(m.question ?? '');
      if (!asset) continue;

      const strike = parseStrikePrice(m.question ?? '');
      if (strike === 0) continue;

      // Need tokens for prices
      const rawTokens = m.tokens ?? [];
      if (rawTokens.length < 2) continue;

      const tokens: Token[] = rawTokens.map(t => ({
        tokenId: t.token_id,
        outcome:  t.outcome,
        price:    parseFloat(String(t.price ?? '0.5')),
      }));

      markets.push({
        id:          m.id,
        conditionId: m.conditionId ?? m.id,
        question:    m.question,
        description: m.description ?? '',
        endDate:     m.endDateIso ?? m.endDate ?? '',
        asset,
        strikePrice: strike,
        direction:   parseDirection(m.question),
        tokens,
        liquidity:   m.liquidity ?? 0,
        volume24h:   m.volume24hr ?? m.volume ?? 0,
        active:      !m.closed && (m.active !== false),
      });
    }

    return markets;
  }

  async getOrderBook(tokenId: string): Promise<OrderBook | null> {
    try {
      const { data } = await axios.get<ClobOrderBook>(
        `${this.clobBaseUrl}/book`,
        { params: { token_id: tokenId }, timeout: 10_000 }
      );

      const bids: OrderBookEntry[] = (data.bids ?? [])
        .map(b => ({ price: parseFloat(b.price), size: parseFloat(b.size) }))
        .filter(b => !isNaN(b.price) && !isNaN(b.size))
        .sort((a, b) => b.price - a.price);

      const asks: OrderBookEntry[] = (data.asks ?? [])
        .map(a => ({ price: parseFloat(a.price), size: parseFloat(a.size) }))
        .filter(a => !isNaN(a.price) && !isNaN(a.size))
        .sort((a, b) => a.price - b.price);

      if (bids.length === 0 && asks.length === 0) return null;

      const bestBid = bids[0]?.price ?? 0;
      const bestAsk = asks[0]?.price ?? 1;
      return {
        tokenId,
        bids,
        asks,
        bestBid,
        bestAsk,
        spread:   bestAsk - bestBid,
        midPrice: (bestBid + bestAsk) / 2,
      };
    } catch {
      return null;
    }
  }

  // Paper trading only — real orders require private key + EIP-712 signing
  async placePaperOrder(
    tokenId: string,
    side: 'BUY' | 'SELL',
    sizeUsd: number,
    limitPrice: number
  ): Promise<Partial<Trade>> {
    const id = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      timestamp: Date.now(),
      tokenId,
      side,
      sizeUsd,
      shares: sizeUsd / limitPrice,
      price: limitPrice,
      fee:   sizeUsd * config.risk.feePct,
      mode: 'paper',
      status: 'filled',
    };
  }
}
