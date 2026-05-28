import { Backtester } from './backtester.js';
import { CoinGeckoClient } from '../api/coingecko-client.js';
import { PriceSimulator } from '../simulation/price-simulator.js';
import type { BacktestConfig } from '../types.js';

const coingecko = new CoinGeckoClient();

// Probe live API; fall back to simulator
try {
  const prices = await coingecko.getSpotPrices();
  if (prices.length === 0) throw new Error('empty');
  console.log('[init] using live CoinGecko data');
} catch {
  console.log('[init] CoinGecko unavailable — using price simulator for historical data');
  coingecko.attachSimulator(new PriceSimulator());
}

const backtester = new Backtester(coingecko);

const cfg: BacktestConfig = {
  startDate:       process.env.BT_START     ?? '2024-01-01',
  endDate:         process.env.BT_END       ?? '2024-12-31',
  initialCapital:  parseFloat(process.env.BT_CAPITAL   ?? '10000'),
  assets:          ['BTC', 'ETH'],
  signalThreshold: parseFloat(process.env.BT_THRESHOLD ?? '0.04'),
  kellyFraction:   parseFloat(process.env.BT_KELLY     ?? '0.25'),
  maxPositionPct:  parseFloat(process.env.BT_MAX_POS   ?? '0.10'),
  maxDrawdownPct:  parseFloat(process.env.BT_MAX_DD    ?? '0.20'),
};

console.log('\n=== Polymarket Backtest Config ===');
console.log(JSON.stringify(cfg, null, 2));

const result = await backtester.run(cfg);

console.log('\n=== Results ===');
console.log(`Total Return:      ${result.totalReturnPct.toFixed(2)}%`);
console.log(`Annualized Return: ${result.annualizedReturnPct.toFixed(2)}%`);
console.log(`Sharpe Ratio:      ${result.sharpeRatio.toFixed(2)}`);
console.log(`Max Drawdown:      ${result.maxDrawdownPct.toFixed(2)}%`);
console.log(`Win Rate:          ${result.winRate.toFixed(1)}%`);
console.log(`Total Trades:      ${result.totalTrades}`);
console.log(`Profit Factor:     ${result.profitFactor.toFixed(2)}`);
console.log(`Avg Win:           $${result.avgWin.toFixed(2)}`);
console.log(`Avg Loss:          $${result.avgLoss.toFixed(2)}`);
console.log(`Duration:          ${result.durationDays.toFixed(0)} days`);
