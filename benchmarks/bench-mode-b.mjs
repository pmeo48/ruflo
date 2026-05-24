#!/usr/bin/env node
/**
 * M5 — Mode B end-to-end real model timing
 *
 * Measures single-turn wall-clock latency with a real Anthropic API call
 * using claude-haiku-4-5-20251001 (cheapest model, max_tokens=200, temperature=0).
 *
 * Workload (apples-to-apples with comparators):
 *   - 1 tool schema passed as available_tools (tool_00 = search tool)
 *   - System: "You are a test agent."
 *   - User: "Use tool_00_search to look up 'hello'. Return the tool name you used."
 *   - max_tokens=200, temperature=0
 *
 * Budget discipline:
 *   - TRIALS default is 3 (cost cap ~$0.002 total)
 *   - Pre-flight cost estimate printed before first call
 *   - Abort if estimated cost > $0.10
 *
 * Usage:
 *   ANTHROPIC_API_KEY=<key> node benchmarks/bench-mode-b.mjs [--trials=3] [--dry-run]
 *   OR
 *   ANTHROPIC_API_KEY=$(gcloud secrets versions access latest --secret=ANTHROPIC_API_KEY --project=ruv-dev) \
 *     node benchmarks/bench-mode-b.mjs
 *
 * Output: docs/benchmarks/mode-b.json
 */

import { performance } from 'node:perf_hooks';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(REPO_ROOT, 'docs', 'benchmarks');

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const TRIALS = Math.max(1, parseInt(args.trials || '3', 10));
const DRY_RUN = args['dry-run'] === true || args['dry-run'] === 'true';
const OUT_FILE = args.out || resolve(OUT_DIR, 'mode-b.json');

// ---------------------------------------------------------------------------
// API key — transient only, never persisted
// ---------------------------------------------------------------------------
const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('[mode-b] ANTHROPIC_API_KEY not set. Aborting.');
  console.error('  Use: ANTHROPIC_API_KEY=$(gcloud secrets versions access latest --secret=ANTHROPIC_API_KEY --project=ruv-dev) \\');
  console.error('    node benchmarks/bench-mode-b.mjs');
  process.exit(1);
}
// Safety: echo only prefix + length, never full key
console.error(`[mode-b] API key present: ${API_KEY.slice(0, 12)}... (len=${API_KEY.length})`);

// ---------------------------------------------------------------------------
// Model + workload spec
// ---------------------------------------------------------------------------
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 200;
const TEMPERATURE = 0;

// Same tool schema used by all comparators (single tool for Mode B simplicity)
const TOOLS = [
  {
    name: 'tool_00_search',
    description: 'Search for items by query string.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
];

const SYSTEM_PROMPT = 'You are a test agent. You have access to search tools. Always use a tool when asked.';
const USER_MESSAGE = "Use tool_00_search to look up 'hello'. Return the tool name you used.";

// ---------------------------------------------------------------------------
// Cost estimation (pre-flight)
// ---------------------------------------------------------------------------
// Haiku pricing (2025): ~$0.00025/1k input tokens, ~$0.00125/1k output tokens
const EST_INPUT_TOKENS = 120; // system + user + tool schema
const EST_OUTPUT_TOKENS = 60; // short response
const COST_PER_CALL_USD = (EST_INPUT_TOKENS * 0.00025 + EST_OUTPUT_TOKENS * 0.00125) / 1000;
const TOTAL_COST_USD = COST_PER_CALL_USD * TRIALS;

console.error(`[mode-b] Cost estimate: ~$${COST_PER_CALL_USD.toFixed(5)}/call × ${TRIALS} trials = ~$${TOTAL_COST_USD.toFixed(4)} total`);

if (TOTAL_COST_USD > 0.10) {
  console.error(`[mode-b] ABORT: estimated cost $${TOTAL_COST_USD.toFixed(4)} exceeds $0.10 budget cap.`);
  console.error(`[mode-b] Reduce --trials or use --dry-run.`);
  process.exit(1);
}

if (DRY_RUN) {
  console.error('[mode-b] DRY RUN — skipping actual API calls. Writing dry-run result.');
  const dryResult = {
    tag: 'mode-b',
    dry_run: true,
    capturedAt: new Date().toISOString(),
    model: MODEL,
    trials: TRIALS,
    estimated_cost_usd: TOTAL_COST_USD,
    measurements: null,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(dryResult, null, 2));
  console.error(`[mode-b] Wrote ${OUT_FILE}`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Anthropic SDK
// ---------------------------------------------------------------------------
let Anthropic;
try {
  const mod = await import('@anthropic-ai/sdk');
  Anthropic = mod.default ?? mod.Anthropic;
} catch (e) {
  console.error(`[mode-b] @anthropic-ai/sdk not available: ${e.message}`);
  process.exit(1);
}

const client = new Anthropic({ apiKey: API_KEY });

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------
async function measureOneTurn() {
  const t0 = performance.now();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_MESSAGE }],
    tools: TOOLS,
  });
  const elapsed = performance.now() - t0;
  return {
    elapsed_ms: Math.round(elapsed * 10) / 10,
    stop_reason: msg.stop_reason,
    input_tokens: msg.usage?.input_tokens ?? 0,
    output_tokens: msg.usage?.output_tokens ?? 0,
    first_content_type: msg.content?.[0]?.type ?? 'unknown',
  };
}

// ---------------------------------------------------------------------------
// Run trials
// ---------------------------------------------------------------------------
console.error(`[mode-b] Running ${TRIALS} trials against ${MODEL}...`);
const measurements = [];
let total_input_tokens = 0;
let total_output_tokens = 0;

for (let i = 0; i < TRIALS; i++) {
  process.stderr.write(`  trial ${i + 1}/${TRIALS}... `);
  try {
    const m = await measureOneTurn();
    measurements.push(m.elapsed_ms);
    total_input_tokens += m.input_tokens;
    total_output_tokens += m.output_tokens;
    process.stderr.write(`${m.elapsed_ms}ms (stop=${m.stop_reason}, in=${m.input_tokens}, out=${m.output_tokens})\n`);
  } catch (e) {
    process.stderr.write(`ERROR: ${e.message}\n`);
    measurements.push(null);
  }
}

const validMs = measurements.filter(x => x !== null);
validMs.sort((a, b) => a - b);
const medIdx = Math.floor(validMs.length / 2);

const actual_cost_usd = (total_input_tokens * 0.00025 + total_output_tokens * 0.00125) / 1000;
console.error(`[mode-b] Actual cost: ~$${actual_cost_usd.toFixed(5)} (in=${total_input_tokens}, out=${total_output_tokens})`);

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------
const result = {
  tag: 'mode-b',
  capturedAt: new Date().toISOString(),
  platform: `${process.platform}-${process.arch}`,
  node_version: process.version,
  model: MODEL,
  framework: 'ruflo',
  version: '3.8.0',
  trials: TRIALS,
  workload: {
    tools: 1,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system_prompt: SYSTEM_PROMPT,
    user_message: USER_MESSAGE,
  },
  measurements: {
    single_turn_ms: {
      all: measurements,
      valid_count: validMs.length,
      medianMs: validMs[medIdx] ?? null,
      minMs: validMs[0] ?? null,
      maxMs: validMs[validMs.length - 1] ?? null,
    },
  },
  token_usage: {
    total_input: total_input_tokens,
    total_output: total_output_tokens,
    actual_cost_usd: Math.round(actual_cost_usd * 100000) / 100000,
  },
  notes: 'Mode B: real Anthropic API call. Single tool (tool_00_search). Latency = wall-clock time for messages.create() to return. Network RTT included.',
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(result, null, 2));
console.error(`\n[mode-b] Results:`);
console.error(`  median single_turn_ms = ${result.measurements.single_turn_ms.medianMs}`);
console.error(`  min                   = ${result.measurements.single_turn_ms.minMs}`);
console.error(`  max                   = ${result.measurements.single_turn_ms.maxMs}`);
console.error(`\nWrote ${OUT_FILE}`);
