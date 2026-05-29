import type {
  Signal, KellySizing, PortfolioState, Position, AgentState
} from '../types.js';
import { eventBus } from '../event-bus.js';
import { config } from '../config.js';

export class RiskManager {
  private state: AgentState = {
    name: 'RiskManager',
    status: 'idle',
    lastActivity: 0,
    metrics: {},
    errors: [],
  };
  private halted = false;

  constructor(private readonly portfolio: PortfolioState) {}

  start(): void {
    this.state.status = 'running';
    console.log('[RiskManager] starting');
  }

  stop(): void {
    this.state.status = 'stopped';
  }

  getState(): AgentState { return { ...this.state }; }
  isHalted(): boolean    { return this.halted; }

  // Full gate check — returns null if trade should be blocked
  approveTrade(signal: Signal): KellySizing | null {
    this.state.lastActivity = Date.now();

    if (this.halted) {
      console.warn('[RiskManager] trading halted — drawdown limit hit');
      return null;
    }

    // Drawdown check
    const drawdown = this.portfolio.currentDrawdown;
    if (drawdown >= config.risk.maxDrawdownPct) {
      this.halted = true;
      eventBus.publish({ type: 'risk_halt', timestamp: Date.now(), data: { reason: 'drawdown', drawdown } });
      console.warn(`[RiskManager] HALT — drawdown ${(drawdown * 100).toFixed(1)}% >= limit ${(config.risk.maxDrawdownPct * 100).toFixed(0)}%`);
      return null;
    }

    // Open position count check
    const openPositions = Array.from(this.portfolio.positions.values()).filter(p => p.status === 'open');
    if (openPositions.length >= config.risk.maxConcurrentPositions) {
      console.info('[RiskManager] max concurrent positions reached');
      return null;
    }

    // Duplicate position check
    const alreadyOpen = openPositions.some(p => p.marketId === signal.marketId);
    if (alreadyOpen) return null;

    // Minimum edge filter
    if (Math.abs(signal.edge) < config.risk.minEdge) {
      return null;
    }

    const sizing = this.kellySize(signal);
    if (sizing.positionSizeUsd < 10) return null;  // too small to be worth it

    this.state.metrics = {
      drawdown:        (drawdown * 100).toFixed(2) + '%',
      openPositions:   openPositions.length,
      cash:            this.portfolio.cash.toFixed(2),
      halted:          String(this.halted),
    };

    return sizing;
  }

  // Kelly Criterion for binary bet:
  //   f* = (p*(b+1) - 1) / b   where b = (1-price)/price (net profit odds)
  //
  // For BUY YES: p = fairValue,       price = marketPrice
  // For SELL  (BUY NO): p = noFairValue, price = noMarketPrice
  kellySize(signal: Signal): KellySizing {
    const isSell = signal.direction === 'SELL';
    const p          = isSell ? signal.noFairValue   : signal.fairValue;
    const entryPrice = isSell ? signal.noMarketPrice : signal.marketPrice;

    if (entryPrice <= 0 || entryPrice >= 1) {
      return { kellyFraction: 0, cappedFraction: 0, positionSizeUsd: 0, shares: 0, rationale: 'invalid price' };
    }

    const b          = (1 - entryPrice) / entryPrice;
    const rawKelly   = (p * (b + 1) - 1) / b;
    const fracKelly  = Math.max(rawKelly * config.risk.kellyFraction, 0);
    const cappedFraction   = Math.min(fracKelly, config.risk.maxPositionPct);
    const positionSizeUsd  = cappedFraction * this.portfolio.cash;
    const effectiveEntry   = entryPrice * (1 + config.risk.slippagePct);
    const shares           = effectiveEntry > 0 ? positionSizeUsd / effectiveEntry : 0;

    const tokenLabel = isSell ? 'NO' : 'YES';
    return {
      kellyFraction:  fracKelly,
      cappedFraction,
      positionSizeUsd: Math.max(positionSizeUsd, 0),
      shares:          Math.max(shares, 0),
      rationale: `${tokenLabel} Kelly=${(fracKelly*100).toFixed(1)}% capped=${(cappedFraction*100).toFixed(1)}% edge=${(signal.edge*100).toFixed(1)}%`,
    };
  }

  updatePortfolio(portfolio: PortfolioState): void {
    Object.assign(this.portfolio, portfolio);
    if (this.halted && portfolio.currentDrawdown < config.risk.maxDrawdownPct * 0.75) {
      // Auto-resume if drawdown recovers to 75% of limit
      this.halted = false;
      console.info('[RiskManager] drawdown recovered — trading resumed');
    }
  }

  // Compute drawdown from peak
  computeDrawdown(currentValue: number, peakValue: number): number {
    if (peakValue <= 0) return 0;
    return Math.max((peakValue - currentValue) / peakValue, 0);
  }

  // Compute unrealised P&L for a position given latest price
  computeUnrealizedPnl(position: Position, currentPrice: number): number {
    if (position.side === 'LONG') {
      return (currentPrice - position.entryPrice) * position.shares;
    }
    return (position.entryPrice - currentPrice) * position.shares;
  }
}
