import type {
  Signal, KellySizing, Trade, Position, PortfolioState, AgentState, PnlSnapshot
} from '../types.js';
import type { PolymarketClient } from '../api/polymarket-client.js';
import type { RiskManager } from './risk-manager.js';
import { eventBus } from '../event-bus.js';
import { config } from '../config.js';
import type { BotEvent } from '../types.js';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ExecutionAgent {
  readonly portfolio: PortfolioState;
  private state: AgentState = {
    name: 'ExecutionAgent',
    status: 'idle',
    lastActivity: 0,
    metrics: {},
    errors: [],
  };

  constructor(
    private readonly polymarket: PolymarketClient,
    private readonly riskManager: RiskManager,
    initialCapital: number = config.trading.initialCapital
  ) {
    this.portfolio = {
      initialCapital,
      cash:           initialCapital,
      totalValue:     initialCapital,
      positions:      new Map(),
      trades:         [],
      pnlHistory:     [],
      peakValue:      initialCapital,
      currentDrawdown: 0,
      totalPnl:       0,
      totalPnlPct:    0,
      winCount:       0,
      lossCount:      0,
    };
  }

  private expiryIntervalId?: ReturnType<typeof setInterval>;

  start(): void {
    this.state.status = 'running';
    console.log(`[ExecutionAgent] starting in ${config.trading.paperMode ? 'PAPER' : 'LIVE'} mode — capital: $${this.portfolio.initialCapital}`);
    eventBus.on('signal_generated', (event: BotEvent) => this.onSignal(event));
    eventBus.on('price_update',     (event: BotEvent) => this.onPriceUpdate(event));
    // Check for expired positions every 30 seconds
    this.expiryIntervalId = setInterval(() => this.settleExpiredPositions(), 30_000);
  }

  stop(): void {
    if (this.expiryIntervalId) clearInterval(this.expiryIntervalId);
    this.state.status = 'stopped';
  }

  getState(): AgentState  { return { ...this.state }; }
  getPortfolio(): PortfolioState { return this.portfolio; }

  private async onSignal(event: BotEvent): Promise<void> {
    const signal = event.data as Signal;
    await this.executeSignal(signal);
  }

  private onPriceUpdate(event: BotEvent): void {
    const { tokenPrices } = event.data as { tokenPrices?: Record<string, number> };
    if (!tokenPrices) return;
    this.updatePositionPrices(new Map(Object.entries(tokenPrices)));
  }

  async executeSignal(signal: Signal): Promise<Trade | null> {
    this.state.lastActivity = Date.now();
    const sizing = this.riskManager.approveTrade(signal);
    if (!sizing || sizing.positionSizeUsd <= 0) return null;

    return config.trading.paperMode
      ? this.executePaperTrade(signal, sizing)
      : this.executeLiveTrade(signal, sizing);
  }

  private async executePaperTrade(signal: Signal, sizing: KellySizing): Promise<Trade | null> {
    // BUY YES for positive edge; BUY NO for negative edge (SELL signal)
    const isSell      = signal.direction === 'SELL';
    const tokenId     = isSell ? signal.noTokenId    : signal.tokenId;
    const rawPrice    = isSell ? signal.noMarketPrice : signal.marketPrice;
    const outcome     = isSell ? 'NO' : 'YES';
    const entryPrice  = rawPrice * (1 + config.risk.slippagePct);
    const fee         = sizing.positionSizeUsd * config.risk.feePct;
    const effectiveCost = sizing.positionSizeUsd + fee;

    if (effectiveCost > this.portfolio.cash) {
      console.info('[ExecutionAgent] insufficient paper cash');
      return null;
    }

    const trade: Trade = {
      id:        generateId('paper'),
      timestamp: Date.now(),
      marketId:  signal.marketId,
      tokenId,
      question:  `${signal.question} [${outcome}]`,
      side:      'BUY',  // always BUY the chosen token
      sizeUsd:   sizing.positionSizeUsd,
      shares:    sizing.shares,
      price:     entryPrice,
      fee,
      mode:      'paper',
      status:    'filled',
    };

    this.portfolio.cash -= effectiveCost;
    this.portfolio.trades.push(trade);

    const position: Position = {
      id:            generateId('pos'),
      marketId:      signal.marketId,
      tokenId,
      question:      `${signal.question} [${outcome}]`,
      asset:         signal.asset,
      side:          'LONG',
      sizeUsd:       sizing.positionSizeUsd,
      shares:        sizing.shares,
      entryPrice,
      currentPrice:  entryPrice,
      unrealizedPnl: 0,
      realizedPnl:   0,
      openedAt:      Date.now(),
      status:        'open',
    };

    this.portfolio.positions.set(position.id, position);
    this.refreshPortfolioMetrics();

    eventBus.publish({ type: 'position_opened', timestamp: Date.now(), data: { trade, position } });
    console.log(
      `[ExecutionAgent] PAPER BUY ${outcome} ${signal.asset} $${signal.strikePrice} ` +
      `size=$${sizing.positionSizeUsd.toFixed(2)} price=${entryPrice.toFixed(4)} ${sizing.rationale}`
    );

    return trade;
  }

  private async executeLiveTrade(_signal: Signal, _sizing: KellySizing): Promise<Trade | null> {
    // Real execution requires EIP-712 signed orders — not implemented for safety.
    console.warn('[ExecutionAgent] live trading requires POLYMARKET_PRIVATE_KEY and is not enabled');
    return null;
  }

  // Auto-close positions whose markets have expired (called on interval)
  private settleExpiredPositions(): void {
    const expiredIds = this.polymarket.getExpiredMarketIds();
    if (expiredIds.length === 0) return;

    for (const pos of this.portfolio.positions.values()) {
      if (pos.status !== 'open') continue;
      if (!expiredIds.includes(pos.marketId)) continue;

      const yesSettlement = this.polymarket.settleMarket(pos.marketId);
      if (yesSettlement === null) continue;

      // Determine if position holds YES or NO token
      const isNoToken  = pos.tokenId.endsWith('-no');
      const settlement = isNoToken ? 1 - yesSettlement : yesSettlement;
      const outcome    = isNoToken ? 'NO' : 'YES';

      this.closePosition(pos.id, settlement);
      console.log(
        `[ExecutionAgent] settled ${outcome} ${pos.asset} ` +
        `→ ${settlement === 1 ? 'WON' : 'LOST'} PnL=$${pos.realizedPnl.toFixed(2)}`
      );
    }
  }

  // Update current prices of open positions and compute P&L
  updatePositionPrices(priceMap: Map<string, number>): void {
    let positionsValue = 0;
    for (const pos of this.portfolio.positions.values()) {
      if (pos.status !== 'open') continue;
      const latest = priceMap.get(pos.tokenId);
      if (latest !== undefined) {
        pos.currentPrice = latest;
        pos.unrealizedPnl = this.riskManager.computeUnrealizedPnl(pos, latest);
      }
      positionsValue += pos.shares * pos.currentPrice;
    }
    this.portfolio.totalValue = this.portfolio.cash + positionsValue;
    this.refreshPortfolioMetrics();
  }

  // Close a position (e.g. at expiry)
  closePosition(positionId: string, exitPrice: number): Trade | null {
    const pos = this.portfolio.positions.get(positionId);
    if (!pos || pos.status !== 'open') return null;

    const proceeds = pos.shares * exitPrice;
    const fee      = proceeds * config.risk.feePct;
    const netProceeds = proceeds - fee;
    const pnl = netProceeds - pos.sizeUsd;

    pos.realizedPnl = pnl;
    pos.status = 'closed';
    pos.closedAt = Date.now();
    this.portfolio.cash += netProceeds;

    if (pnl > 0) this.portfolio.winCount++;
    else         this.portfolio.lossCount++;

    const trade: Trade = {
      id:        generateId('close'),
      timestamp: Date.now(),
      marketId:  pos.marketId,
      tokenId:   pos.tokenId,
      question:  pos.question,
      side:      'SELL',
      sizeUsd:   proceeds,
      shares:    pos.shares,
      price:     exitPrice,
      fee,
      mode:      config.trading.paperMode ? 'paper' : 'live',
      status:    'filled',
      pnl,
    };
    this.portfolio.trades.push(trade);
    this.refreshPortfolioMetrics();

    eventBus.publish({ type: 'position_closed', timestamp: Date.now(), data: { trade, position: pos, pnl } });
    console.log(`[ExecutionAgent] closed position ${positionId} PnL=$${pnl.toFixed(2)}`);
    return trade;
  }

  private refreshPortfolioMetrics(): void {
    const { initialCapital, cash, positions } = this.portfolio;
    let positionsValue = 0;
    for (const p of positions.values()) {
      if (p.status === 'open') positionsValue += p.shares * p.currentPrice;
    }
    this.portfolio.totalValue    = cash + positionsValue;
    this.portfolio.totalPnl      = this.portfolio.totalValue - initialCapital;
    this.portfolio.totalPnlPct   = this.portfolio.totalPnl / initialCapital;
    this.portfolio.peakValue     = Math.max(this.portfolio.peakValue, this.portfolio.totalValue);
    this.portfolio.currentDrawdown = this.riskManager.computeDrawdown(
      this.portfolio.totalValue, this.portfolio.peakValue
    );

    const snap: PnlSnapshot = {
      timestamp:      Date.now(),
      portfolioValue: this.portfolio.totalValue,
      cash,
      positionsValue,
      pnl:            this.portfolio.totalPnl,
      pnlPct:         this.portfolio.totalPnlPct,
      drawdown:       this.portfolio.currentDrawdown,
    };
    this.portfolio.pnlHistory.push(snap);
    if (this.portfolio.pnlHistory.length > 10_000) this.portfolio.pnlHistory.shift();

    this.riskManager.updatePortfolio(this.portfolio);
    this.state.metrics = {
      totalValue:    this.portfolio.totalValue.toFixed(2),
      cash:          cash.toFixed(2),
      openPositions: Array.from(positions.values()).filter(p => p.status === 'open').length,
      totalPnl:      this.portfolio.totalPnl.toFixed(2),
      totalPnlPct:   (this.portfolio.totalPnlPct * 100).toFixed(2) + '%',
      drawdown:      (this.portfolio.currentDrawdown * 100).toFixed(2) + '%',
      winRate:       this.portfolio.winCount + this.portfolio.lossCount > 0
        ? ((this.portfolio.winCount / (this.portfolio.winCount + this.portfolio.lossCount)) * 100).toFixed(1) + '%'
        : 'N/A',
    };

    eventBus.publish({ type: 'pnl_update', timestamp: Date.now(), data: snap });
  }
}
