import { config } from './config.js';
import { CoinGeckoClient }   from './api/coingecko-client.js';
import { PolymarketClient }  from './api/polymarket-client.js';
import { MarketScanner }     from './agents/market-scanner.js';
import { SignalEngine }      from './agents/signal-engine.js';
import { RiskManager }       from './agents/risk-manager.js';
import { ExecutionAgent }    from './agents/execution-agent.js';
import { createDashboard }   from './dashboard/server.js';
import { PriceSimulator }    from './simulation/price-simulator.js';
import { MarketSimulator }   from './simulation/market-simulator.js';

const useSimulation = process.argv.includes('--demo') || process.env.DEMO_MODE === 'true';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' Polymarket Quantitative Trading Bot');
console.log(` Mode:            ${config.trading.paperMode ? 'PAPER TRADING' : '⚠  LIVE TRADING'}`);
console.log(` Data source:     ${useSimulation ? 'SIMULATION (--demo)' : 'Live APIs (CoinGecko + Polymarket)'}`);
console.log(` Capital:         $${config.trading.initialCapital.toLocaleString()}`);
console.log(` Scan interval:   ${config.trading.scanIntervalMs / 1000}s`);
console.log(` Signal threshold:${(config.trading.signalThreshold * 100).toFixed(0)}% edge`);
console.log(` Kelly fraction:  ${config.risk.kellyFraction}x  |  Max pos: ${(config.risk.maxPositionPct * 100).toFixed(0)}%  |  DD stop: ${(config.risk.maxDrawdownPct * 100).toFixed(0)}%`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Instantiate API clients
const coingecko  = new CoinGeckoClient();
const polymarket = new PolymarketClient();

// Probe live APIs; attach simulator if unavailable or --demo requested
async function setupDataSources(): Promise<void> {
  if (useSimulation) {
    attachSimulators();
    return;
  }
  // Quick connectivity probe
  try {
    const prices = await coingecko.getSpotPrices();
    if (prices.length === 0) throw new Error('empty response');
    console.log(`[init] CoinGecko ✓  BTC=$${prices.find(p => p.asset === 'bitcoin')?.price.toFixed(0)}`);
  } catch {
    console.warn('[init] CoinGecko API unavailable — activating price simulator');
    attachSimulators();
  }
}

let priceSim: PriceSimulator | null = null;
function attachSimulators(): void {
  priceSim = new PriceSimulator();
  const mktSim = new MarketSimulator(priceSim);
  coingecko.attachSimulator(priceSim);
  polymarket.attachSimulator(mktSim);
  console.log(`[init] Simulator active — BTC≈$${priceSim.getPrice('bitcoin').toFixed(0)}  ETH≈$${priceSim.getPrice('ethereum').toFixed(0)}`);
}

await setupDataSources();

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
await scanner.start();
dashboard.start();

console.log(`\n[Bot] all agents running — dashboard at http://localhost:${config.dashboard.port}`);
if (priceSim) {
  console.log('[Bot] time compression: 1 real-second = 1 simulated hour (positions resolve faster)');
}

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
