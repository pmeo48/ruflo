export interface Market {
  id: string;
  conditionId: string;
  question: string;
  description: string;
  endDate: string;
  asset: string;          // 'BTC' | 'ETH'
  strikePrice: number;    // price target in USD
  direction: 'above' | 'below';
  tokens: Token[];
  liquidity: number;
  volume24h: number;
  active: boolean;
}

export interface Token {
  tokenId: string;
  outcome: string;        // 'Yes' | 'No'
  price: number;          // 0–1 (implied probability)
}

export interface SpotPrice {
  asset: string;          // 'bitcoin' | 'ethereum'
  price: number;
  timestamp: number;
}

export interface FairValue {
  marketId: string;
  tokenId: string;
  outcome: string;
  fairProbability: number;
  marketProbability: number;
  edge: number;           // fairProbability - marketProbability
  confidence: number;
  asset: string;
  strikePrice: number;
  expiryDate: string;
  spotPrice: number;
}

export interface Signal {
  id: string;
  timestamp: number;
  marketId: string;
  tokenId: string;       // YES token id
  noTokenId: string;     // NO token id (used when direction === 'SELL')
  question: string;
  direction: 'BUY' | 'SELL';
  edge: number;          // fairValue - marketPrice  (positive → BUY YES, negative → BUY NO)
  fairValue: number;     // our estimated YES probability
  marketPrice: number;   // market's YES price
  noFairValue: number;   // 1 - fairValue
  noMarketPrice: number; // 1 - marketPrice
  confidence: number;
  asset: string;
  strikePrice: number;
  expiryDate: string;
}

export interface Position {
  id: string;
  marketId: string;
  tokenId: string;
  question: string;
  asset: string;
  side: 'LONG' | 'SHORT';
  sizeUsd: number;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  openedAt: number;
  closedAt?: number;
  status: 'open' | 'closed';
}

export interface Trade {
  id: string;
  timestamp: number;
  marketId: string;
  tokenId: string;
  question: string;
  side: 'BUY' | 'SELL';
  sizeUsd: number;
  shares: number;
  price: number;
  fee: number;
  mode: 'paper' | 'live';
  status: 'pending' | 'filled' | 'cancelled' | 'failed';
  pnl?: number;
}

export interface PnlSnapshot {
  timestamp: number;
  portfolioValue: number;
  cash: number;
  positionsValue: number;
  pnl: number;
  pnlPct: number;
  drawdown: number;
}

export interface PortfolioState {
  initialCapital: number;
  cash: number;
  totalValue: number;
  positions: Map<string, Position>;
  trades: Trade[];
  pnlHistory: PnlSnapshot[];
  peakValue: number;
  currentDrawdown: number;
  totalPnl: number;
  totalPnlPct: number;
  winCount: number;
  lossCount: number;
}

export interface RiskParams {
  kellyFraction: number;          // partial Kelly multiplier, e.g. 0.25
  maxPositionPct: number;         // max fraction of portfolio per position
  maxDrawdownPct: number;         // halt trading if drawdown exceeds this
  minEdge: number;                // minimum edge required to trade
  maxConcurrentPositions: number;
  slippagePct: number;            // simulated slippage
  feePct: number;                 // maker/taker fee
}

export interface KellySizing {
  kellyFraction: number;
  cappedFraction: number;
  positionSizeUsd: number;
  shares: number;
  rationale: string;
}

export interface OrderBookEntry {
  price: number;
  size: number;
}

export interface OrderBook {
  tokenId: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  bestBid: number;
  bestAsk: number;
  spread: number;
  midPrice: number;
}

export interface BacktestConfig {
  startDate: string;
  endDate: string;
  initialCapital: number;
  assets: string[];
  signalThreshold: number;
  kellyFraction: number;
  maxPositionPct: number;
  maxDrawdownPct: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  totalReturnPct: number;
  annualizedReturnPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  pnlHistory: PnlSnapshot[];
  trades: Trade[];
  durationDays: number;
}

export type AgentStatus = 'idle' | 'running' | 'stopped' | 'error';

export interface AgentState {
  name: string;
  status: AgentStatus;
  lastActivity: number;
  metrics: Record<string, number | string>;
  errors: string[];
}

export interface BotEvent {
  type: 'market_scanned' | 'signal_generated' | 'order_placed' | 'position_opened'
      | 'position_closed' | 'risk_halt' | 'price_update' | 'agent_status' | 'pnl_update';
  timestamp: number;
  data: unknown;
}
