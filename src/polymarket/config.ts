import type { RiskParams } from './types.js';

export interface BotConfig {
  polymarket: {
    apiKey: string;
    privateKey: string;
    baseUrl: string;
    clobBaseUrl: string;
  };
  coingecko: {
    baseUrl: string;
    apiKey: string;
    demoApiKey: string;
  };
  trading: {
    paperMode: boolean;
    initialCapital: number;
    assets: string[];
    scanIntervalMs: number;
    signalThreshold: number;   // minimum edge to generate a signal
    volatilityBtc: number;     // annualized vol for Black-Scholes
    volatilityEth: number;
    riskFreeRate: number;
  };
  risk: RiskParams;
  dashboard: {
    port: number;
    updateIntervalMs: number;
  };
}

export const config: BotConfig = {
  polymarket: {
    apiKey:     process.env.POLYMARKET_API_KEY     ?? '',
    privateKey: process.env.POLYMARKET_PRIVATE_KEY ?? '',
    baseUrl:    'https://gamma-api.polymarket.com',
    clobBaseUrl:'https://clob.polymarket.com',
  },
  coingecko: {
    baseUrl:    'https://api.coingecko.com/api/v3',
    apiKey:     process.env.COINGECKO_API_KEY ?? '',
    demoApiKey: process.env.COINGECKO_DEMO_KEY ?? '',
  },
  trading: {
    paperMode:        process.env.PAPER_MODE !== 'false',
    initialCapital:   parseFloat(process.env.INITIAL_CAPITAL ?? '10000'),
    assets:           ['bitcoin', 'ethereum'],
    scanIntervalMs:   parseInt(process.env.SCAN_INTERVAL_MS ?? '60000'),
    signalThreshold:  parseFloat(process.env.SIGNAL_THRESHOLD ?? '0.05'),
    volatilityBtc:    parseFloat(process.env.VOL_BTC ?? '0.80'),  // 80% annualized
    volatilityEth:    parseFloat(process.env.VOL_ETH ?? '1.00'),  // 100% annualized
    riskFreeRate:     parseFloat(process.env.RISK_FREE_RATE ?? '0.05'),
  },
  risk: {
    kellyFraction:            parseFloat(process.env.KELLY_FRACTION ?? '0.25'),
    maxPositionPct:           parseFloat(process.env.MAX_POSITION_PCT ?? '0.10'),
    maxDrawdownPct:           parseFloat(process.env.MAX_DRAWDOWN_PCT ?? '0.20'),
    minEdge:                  parseFloat(process.env.MIN_EDGE ?? '0.05'),
    maxConcurrentPositions:   parseInt(process.env.MAX_POSITIONS ?? '5'),
    slippagePct:              parseFloat(process.env.SLIPPAGE_PCT ?? '0.005'),
    feePct:                   parseFloat(process.env.FEE_PCT ?? '0.002'),
  },
  dashboard: {
    port:            parseInt(process.env.DASHBOARD_PORT ?? '3456'),
    updateIntervalMs:parseInt(process.env.DASHBOARD_UPDATE_MS ?? '5000'),
  },
};
