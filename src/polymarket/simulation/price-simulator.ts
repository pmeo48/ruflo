// Geometric Brownian Motion price simulator for BTC and ETH
// dS = S*(μ*dt + σ*√dt*Z)  where Z ~ N(0,1)

export interface SimConfig {
  btcStartPrice: number;
  ethStartPrice: number;
  btcAnnualVol: number;
  ethAnnualVol: number;
  btcAnnualDrift: number;
  ethAnnualDrift: number;
  // how much simulated real-world time passes per wall-clock second
  timeCompressionFactor: number;
}

export const defaultSimConfig: SimConfig = {
  btcStartPrice:         95_000,
  ethStartPrice:          3_500,
  btcAnnualVol:            0.80,
  ethAnnualVol:            1.00,
  btcAnnualDrift:          0.20,  // 20% annual drift (bullish bias)
  ethAnnualDrift:          0.25,
  timeCompressionFactor: 3_600,   // 1 wall-second = 1 simulated hour
};

// Box-Muller transform for N(0,1)
function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export class PriceSimulator {
  private prices: Record<string, number>;
  private simTimestampMs: number;  // simulated wall-clock time
  private readonly cfg: SimConfig;

  constructor(cfg: Partial<SimConfig> = {}) {
    this.cfg = { ...defaultSimConfig, ...cfg };
    this.prices = {
      bitcoin:  this.cfg.btcStartPrice,
      ethereum: this.cfg.ethStartPrice,
    };
    this.simTimestampMs = Date.now();
  }

  // Advance simulation by `realElapsedMs` wall-clock milliseconds
  tick(realElapsedMs: number): Record<string, number> {
    const dtYears = (realElapsedMs * this.cfg.timeCompressionFactor) / (365.25 * 24 * 3600 * 1_000);
    this.simTimestampMs += realElapsedMs * this.cfg.timeCompressionFactor;

    this.prices['bitcoin']  = this.stepGBM(this.prices['bitcoin'],  this.cfg.btcAnnualDrift, this.cfg.btcAnnualVol,  dtYears);
    this.prices['ethereum'] = this.stepGBM(this.prices['ethereum'], this.cfg.ethAnnualDrift, this.cfg.ethAnnualVol, dtYears);

    return { ...this.prices };
  }

  getPrice(asset: string): number { return this.prices[asset] ?? 0; }
  getAllPrices(): Record<string, number> { return { ...this.prices }; }
  getSimTime(): number { return this.simTimestampMs; }

  // Simulate `days` of historical data at daily resolution (for backtesting)
  generateHistorical(asset: string, days: number): Array<{ timestamp: number; price: number }> {
    const vol   = asset === 'bitcoin' ? this.cfg.btcAnnualVol  : this.cfg.ethAnnualVol;
    const drift = asset === 'bitcoin' ? this.cfg.btcAnnualDrift : this.cfg.ethAnnualDrift;
    const start = asset === 'bitcoin' ? this.cfg.btcStartPrice  : this.cfg.ethStartPrice;
    const dtYears = 1 / 365;
    const result: Array<{ timestamp: number; price: number }> = [];
    let price = start;
    const now  = Date.now();
    for (let i = days; i >= 0; i--) {
      result.push({ timestamp: now - i * 86_400_000, price });
      price = this.stepGBM(price, drift, vol, dtYears);
    }
    return result;
  }

  private stepGBM(S: number, mu: number, sigma: number, dt: number): number {
    const drift    = (mu - 0.5 * sigma * sigma) * dt;
    const diffusion = sigma * Math.sqrt(dt) * randn();
    return S * Math.exp(drift + diffusion);
  }
}
