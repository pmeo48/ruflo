import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from '../config.js';
import { eventBus } from '../event-bus.js';
import type { BotEvent, AgentState, PortfolioState } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

interface DashboardState {
  portfolio:    PortfolioState | null;
  agents:       AgentState[];
  recentEvents: BotEvent[];
  started:      string;
}

export function createDashboard(
  getPortfolio: () => PortfolioState,
  getAgentStates: () => AgentState[]
): { start: () => void; stop: () => void } {
  const app    = express();
  const server = createServer(app);
  const wss    = new WebSocketServer({ server });

  const state: DashboardState = {
    portfolio:    null,
    agents:       [],
    recentEvents: [],
    started:      new Date().toISOString(),
  };

  app.use(express.static(join(__dirname, 'public')));

  app.get('/api/state', (_req, res) => {
    res.json({
      portfolio: serializePortfolio(getPortfolio()),
      agents:    getAgentStates(),
      events:    state.recentEvents.slice(-50),
      started:   state.started,
    });
  });

  app.get('/api/portfolio', (_req, res) => {
    res.json(serializePortfolio(getPortfolio()));
  });

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Broadcast all bot events to connected WebSocket clients
  eventBus.on('*', (event: BotEvent) => {
    state.recentEvents.push(event);
    if (state.recentEvents.length > 200) state.recentEvents.shift();

    const msg = JSON.stringify({ type: 'event', data: serializeEvent(event) });
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(msg);
    }
  });

  // Periodic full-state push
  setInterval(() => {
    const payload = JSON.stringify({
      type: 'state',
      data: {
        portfolio: serializePortfolio(getPortfolio()),
        agents:    getAgentStates(),
      },
    });
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(payload);
    }
  }, config.dashboard.updateIntervalMs);

  wss.on('connection', (ws) => {
    // Send current state on connect
    ws.send(JSON.stringify({
      type: 'state',
      data: {
        portfolio: serializePortfolio(getPortfolio()),
        agents:    getAgentStates(),
        events:    state.recentEvents.slice(-50),
      },
    }));
  });

  return {
    start: () => {
      server.listen(config.dashboard.port, () => {
        console.log(`[Dashboard] http://localhost:${config.dashboard.port}`);
      });
    },
    stop: () => server.close(),
  };
}

function serializePortfolio(p: PortfolioState): Record<string, unknown> {
  return {
    initialCapital: p.initialCapital,
    cash:           p.cash,
    totalValue:     p.totalValue,
    totalPnl:       p.totalPnl,
    totalPnlPct:    p.totalPnlPct,
    peakValue:      p.peakValue,
    currentDrawdown: p.currentDrawdown,
    winCount:       p.winCount,
    lossCount:      p.lossCount,
    positions: Array.from(p.positions.values()).map(pos => ({
      id:            pos.id,
      question:      pos.question,
      asset:         pos.asset,
      side:          pos.side,
      sizeUsd:       pos.sizeUsd,
      shares:        pos.shares,
      entryPrice:    pos.entryPrice,
      currentPrice:  pos.currentPrice,
      unrealizedPnl: pos.unrealizedPnl,
      realizedPnl:   pos.realizedPnl,
      openedAt:      pos.openedAt,
      status:        pos.status,
    })),
    trades:     p.trades.slice(-50),
    pnlHistory: p.pnlHistory.slice(-500).map(s => ({
      timestamp:      s.timestamp,
      portfolioValue: s.portfolioValue,
      pnl:            s.pnl,
      pnlPct:         s.pnlPct,
      drawdown:       s.drawdown,
    })),
  };
}

function serializeEvent(e: BotEvent): Record<string, unknown> {
  return { type: e.type, timestamp: e.timestamp, data: e.data };
}
