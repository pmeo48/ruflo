/**
 * NDJSON Event Stream for CLI --stream mode
 *
 * Emits newline-delimited JSON events to stdout for consumption
 * by Claude Code's Monitor tool. Each event includes schema versioning.
 *
 * @see ADR-091: NDJSON event streaming infrastructure
 */

import { randomBytes } from 'crypto';

export interface StreamEvent {
  schema: 'ruflo.event.v1';
  event: string;
  runId: string;
  agentId?: string;
  ts: string;
  [key: string]: unknown;
}

/** Generate a short unique run ID (e.g. run_m1abc_3f2a1b) */
export function createRunId(): string {
  return `run_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`;
}

/** Write one NDJSON line to stdout with schema and timestamp auto-populated */
export function emitEvent(event: Omit<StreamEvent, 'schema' | 'ts'>): void {
  const full: StreamEvent = Object.assign(
    { schema: 'ruflo.event.v1' as const, ts: new Date().toISOString() },
    event,
  ) as StreamEvent;
  process.stdout.write(JSON.stringify(full) + '\n');
}

/** Convenience wrapper that binds a runId to an emitter */
export function createEventEmitter(runId: string): {
  emit(event: string, data?: Record<string, unknown>): void;
} {
  return {
    emit(event: string, data?: Record<string, unknown>): void {
      emitEvent({ runId, event, ...data });
    },
  };
}
