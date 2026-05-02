/**
 * Widget config persistence — backed by the AgentDB browser client.
 *
 * R-2.3 (ADR-095): migrated from RVF-only to AgentDB-backed (via
 * `src/integrations/agentdb/client.ts`). The public API (`get` /
 * `save` / `clear`) is unchanged — Index.tsx callers don't need to
 * know storage flipped.
 *
 * Migration story for existing users: on first read in a session, if
 * AgentDB has no entry but the legacy RVF store does, the value is
 * copied over and returned. This is a one-shot per session — repeat
 * gets read from AgentDB only.
 *
 * RVF on-disk format remains the export/import wire format (handled
 * by `src/integrations/rvf/format.ts`); the AgentDB client is the
 * runtime storage. For widgetConfig (no vector, plain JSON) this
 * distinction is moot but matters once R-2.4's HNSW recall lands.
 */

import { getAgentDbClient } from '../agentdb/client';
import { getRvfClient } from './client';

const NAMESPACE = 'widget';
const KEY = 'default';
const ID = `${NAMESPACE}:${KEY}`;

let legacyChecked = false;

/**
 * One-shot RVF→AgentDB migration. If AgentDB has the row, no-op.
 * Otherwise, look in the legacy RVF store and copy across. Errors
 * are swallowed — a fresh install with no RVF data should not throw.
 */
async function migrateLegacyIfNeeded<T>(): Promise<T | undefined> {
  if (legacyChecked) return undefined;
  legacyChecked = true;
  const client = getAgentDbClient();
  const existing = await client.get<T>(ID);
  if (existing) return undefined;
  try {
    const rvf = getRvfClient();
    const legacy = await rvf.get(KEY, { namespace: NAMESPACE });
    if (legacy) {
      await client.put(ID, NAMESPACE, legacy.value);
      return legacy.value as T;
    }
  } catch {
    /* RVF unavailable on fresh installs — silently OK */
  }
  return undefined;
}

/** Read the persisted widget config or `undefined` if none. */
export async function getWidgetConfig<T>(): Promise<T | undefined> {
  const migrated = await migrateLegacyIfNeeded<T>();
  if (migrated !== undefined) return migrated;
  const client = getAgentDbClient();
  const entry = await client.get<T>(ID);
  return entry?.data;
}

/** Persist the widget config. Upserts the single row. */
export async function saveWidgetConfig<T>(cfg: T): Promise<void> {
  const client = getAgentDbClient();
  await client.put(ID, NAMESPACE, cfg);
}

/** Drop the persisted widget config (returns to in-code defaults on reload). */
export async function clearWidgetConfig(): Promise<void> {
  const client = getAgentDbClient();
  await client.delete(ID);
}
