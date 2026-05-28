import * as fs from 'fs';
import * as path from 'path';
import type { EtsyBusinessState } from './types.js';

const DEFAULT_SESSION_PATH = '.hive-mind/sessions/state.json';

function makeEmptyState(sessionId: string): EtsyBusinessState {
  return {
    sessionId,
    products: [],
    listings: [],
    prices: [],
    metrics: [],
    updatedAt: new Date(),
  };
}

function reviveDates(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(reviveDates);

  const record = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      result[key] = new Date(value);
    } else {
      result[key] = reviveDates(value);
    }
  }
  return result;
}

export class SessionStore {
  private readonly sessionPath: string;

  constructor(sessionPath: string = DEFAULT_SESSION_PATH) {
    this.sessionPath = path.resolve(sessionPath);
  }

  load(): EtsyBusinessState {
    if (!fs.existsSync(this.sessionPath)) {
      return makeEmptyState(crypto.randomUUID());
    }

    const raw = fs.readFileSync(this.sessionPath, 'utf-8');
    const parsed = reviveDates(JSON.parse(raw)) as EtsyBusinessState;
    return parsed;
  }

  save(state: EtsyBusinessState): void {
    const dir = path.dirname(this.sessionPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.sessionPath, JSON.stringify(state, null, 2), 'utf-8');
  }

  update(patch: Partial<EtsyBusinessState>): EtsyBusinessState {
    const current = this.load();
    const next: EtsyBusinessState = {
      ...current,
      ...patch,
      updatedAt: new Date(),
    };
    this.save(next);
    return next;
  }
}
