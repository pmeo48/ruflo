import { config } from './config.js';
import { CoinGeckoClient }   from './api/coingecko-client.js';
import { PolymarketClient }  from './api/polymarket-client.js';
import { MarketScanner }     from './agents/market-scanner.js';
import { SignalEngine }      from './agents/signal-engine.js';
import { RiskManager }       from './agents/risk-manager.js';
import { ExecutionAgent }    from './agents/execution-agent.js';
import { createDashboard }   from './dashboard/server.js';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' Polymarket Quantitative Trading Bot');
console.log(` Mode: ${config.trading.paperMode ? 'PAPER TRADING' : '⚠  LIVE TRADING'}`);
console.log(` Capital: $${config.trading.initialCapital.toLocaleString()}`);
console.log(` Scan interval: ${config.trading.scanIntervalMs / 1000}s`);
console.log(` Signal threshold: ${(config.trading.signalThreshold * 100).toFixed(0)}% edge`);
console.log(` Kelly fraction: ${config.risk.kellyFraction}x`);
console.log(` Max position: ${(config.risk.maxPositionPct * 100).toFixed(0)}%`);
console.log(` Drawdown stop: ${(config.risk.maxDrawdownPct * 100).toFixed(0)}%`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Instantiate API clients
const coingecko  = new CoinGeckoClient();
const polymarket = new PolymarketClient();

// Instantiate agents
const scanner   = new MarketScanner(polymarket, coingecko);
const engine    = new SignalEngine(scanner);
const portfolio = {
  initialCapital:   config.trading.initialCapital,
  cash:             config.trading.initialCapital,
  totalValue:       config.trading.initialCapital,
  positions:        new Map(),
  trades:           [],
  pnlHistory:       [],
  peakValue:        config.trading.initialCapital,
  currentDrawdown:  0,
  totalPnl:         0,
  totalPnlPct:      0,
  winCount:         0,
  lossCount:        0,
};
const riskMgr   = new RiskManager(portfolio);
const executor  = new ExecutionAgent(polymarket, riskMgr, config.trading.initialCapital);

// Dashboard
const dashboard = createDashboard(
  () => executor.getPortfolio(),
  () => [scanner.getState(), engine.getState(), riskMgr.getState(), executor.getState()]
);

// Start all agents
engine.start();
riskMgr.start();
executor.start();
await scanner.start();     // kicks off first scan immediately
dashboard.start();

console.log('\n[Bot] all agents running — dashboard at http://localhost:' + config.dashboard.port);

// Graceful shutdown
const shutdown = (sig: string) => {
  console.log(`\n[Bot] received ${sig} — shutting down`);
  scanner.stop();
  engine.stop();
  riskMgr.stop();
  executor.stop();
  dashboard.stop();
  process.exit(0);
};
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Keep alive
await new Promise(() => {});
