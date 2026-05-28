import type { FairValue, Signal, AgentState } from '../types.js';
import type { MarketScanner } from './market-scanner.js';
import { eventBus } from '../event-bus.js';
import { config } from '../config.js';
import type { BotEvent } from '../types.js';

export class SignalEngine {
  private state: AgentState = {
    name: 'SignalEngine',
    status: 'idle',
    lastActivity: 0,
    metrics: { signalsGenerated: 0, signalsFiltered: 0 },
    errors: [],
  };
  private recentSignals: Signal[] = [];
  private readonly cooldownMs = 5 * 60_000;     // no duplicate signals within 5 min
  private readonly maxSignalHistory = 100;
  private signalCount = 0;

  constructor(private readonly scanner: MarketScanner) {}

  start(): void {
    this.state.status = 'running';
    console.log('[SignalEngine] starting — listening for scan events');
    eventBus.on('market_scanned', (event: BotEvent) => this.onMarketScanned(event));
  }

  stop(): void {
    this.state.status = 'stopped';
  }

  getState(): AgentState { return { ...this.state }; }
  getRecentSignals(): Signal[] { return [...this.recentSignals]; }

  private onMarketScanned(event: BotEvent): void {
    const fairValues = (event.data as { fairValues?: FairValue[] })?.fairValues ?? [];
    this.generateSignals(fairValues);
  }

  generateSignals(fairValues: FairValue[]): Signal[] {
    this.state.lastActivity = Date.now();
    const threshold = config.trading.signalThreshold;
    const newSignals: Signal[] = [];

    for (const fv of fairValues) {
      if (Math.abs(fv.edge) < threshold) continue;
      if (this.isDuplicate(fv.marketId)) continue;

      const market = this.scanner.getMarkets().find(m => m.id === fv.marketId);
      if (!market) continue;

      // Positive edge: our fair value > market price → BUY YES token
      // Negative edge: our fair value < market price → SELL YES token (or BUY NO)
      const direction: 'BUY' | 'SELL' = fv.edge > 0 ? 'BUY' : 'SELL';

      const signal: Signal = {
        id:          `sig-${++this.signalCount}-${Date.now()}`,
        timestamp:   Date.now(),
        marketId:    fv.marketId,
        tokenId:     fv.tokenId,
        question:    market.question,
        direction,
        edge:        fv.edge,
        fairValue:   fv.fairProbability,
        marketPrice: fv.marketProbability,
        confidence:  fv.confidence,
        asset:       fv.asset,
        strikePrice: fv.strikePrice,
        expiryDate:  fv.expiryDate,
      };

      newSignals.push(signal);
      this.recentSignals.unshift(signal);
      if (this.recentSignals.length > this.maxSignalHistory) {
        this.recentSignals.pop();
      }

      eventBus.publish({
        type: 'signal_generated',
        timestamp: Date.now(),
        data: signal,
      });

      console.log(
        `[SignalEngine] ${direction} signal — ${fv.asset} $${fv.strikePrice} ` +
        `edge=${(fv.edge * 100).toFixed(1)}% fair=${(fv.fairProbability * 100).toFixed(1)}% ` +
        `mkt=${(fv.marketProbability * 100).toFixed(1)}%`
      );
    }

    this.state.metrics['signalsGenerated'] = (this.state.metrics['signalsGenerated'] as number) + newSignals.length;
    this.state.metrics['totalActive'] = this.recentSignals.filter(s =>
      Date.now() - s.timestamp < this.cooldownMs
    ).length;

    return newSignals;
  }

  private isDuplicate(marketId: string): boolean {
    return this.recentSignals.some(
      s => s.marketId === marketId && Date.now() - s.timestamp < this.cooldownMs
    );
  }

  // Expose for backtesting
  generateSignalFromFairValue(fv: FairValue, market: { question: string }): Signal | null {
    if (Math.abs(fv.edge) < config.trading.signalThreshold) return null;
    const direction: 'BUY' | 'SELL' = fv.edge > 0 ? 'BUY' : 'SELL';
    return {
      id:          `bt-${++this.signalCount}-${Date.now()}`,
      timestamp:   Date.now(),
      marketId:    fv.marketId,
      tokenId:     fv.tokenId,
      question:    market.question,
      direction,
      edge:        fv.edge,
      fairValue:   fv.fairProbability,
      marketPrice: fv.marketProbability,
      confidence:  fv.confidence,
      asset:       fv.asset,
      strikePrice: fv.strikePrice,
      expiryDate:  fv.expiryDate,
    };
  }
}
