/**
 * ADR-091 Phase 2 -- Stateless Loop Worker Runner
 *
 * Designed for /loop execution: runs a single worker iteration and returns
 * metadata that the caller can use with ScheduleWakeup.
 */

import { execSync } from 'child_process';
import { getCacheWarmDelay } from './runtime-capabilities.js';

export interface LoopWorkerResult {
  workerType: string;
  success: boolean;
  suggestedDelay: number;
  reason: string;
  loopPrompt: string;
  metrics?: Record<string, unknown>;
}

export async function runLoopWorker(workerType: string): Promise<LoopWorkerResult> {
  const startMs = Date.now();
  let success = false;
  let reason = '';

  try {
    const safeWorkerType = workerType.replace(/[^a-zA-Z0-9_-]/g, '');
    const stdout = execSync(
      `npx @claude-flow/cli hooks worker dispatch --trigger ${safeWorkerType}`,
      { encoding: 'utf-8', timeout: 120_000, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    success = true;
    reason = stdout.trim().slice(0, 200) || `${workerType} completed`;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    reason = `${workerType} failed: ${msg.slice(0, 200)}`;
  }

  const durationMs = Date.now() - startMs;
  const suggestedDelay = getCacheWarmDelay();

  return {
    workerType,
    success,
    suggestedDelay,
    reason,
    loopPrompt: `Run ${workerType} worker and report results`,
    metrics: { durationMs, timestamp: new Date().toISOString() },
  };
}
