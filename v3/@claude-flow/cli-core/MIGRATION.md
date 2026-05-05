# Migration Guide — switching plugin scripts to `@claude-flow/cli-core`

> **Status:** alpha (3.7.0-alpha.2). This is an opt-in migration for plugin authors who want the cold-cache speedup today and accept the storage-format trade-off documented below.

## TL;DR

Each `npx @claude-flow/cli@latest memory <subcommand> ...` in a plugin script can be swapped for `npx @claude-flow/cli-core@alpha memory <subcommand> ...`. Cold-cache wall-time drops from ~25s to ~2s.

What you trade for it:
- **Storage file changes** from `.swarm/memory.db` (SQLite + HNSW) to `.swarm/memory.json` (plain JSON). Existing data stays in the SQLite file; the cli-core backend doesn't read from it. Treat the migration as a soft-break for any namespace you care about.
- **Search degrades** from semantic vector similarity to substring match. If your skill needs "find all memories about authentication patterns" semantic queries, stay on `cli` for that call site.
- **`hooks` commands aren't migrated yet.** alpha.2 ships definitions only. Handler dispatch lands in alpha.3+. For `hooks_*` calls, keep `cli@latest`.

## What's safe to migrate today

| Call shape | Cold-cache before | Cold-cache after | Backend change |
|---|---:|---:|---|
| `memory store` | ~25 s | ~2 s | SQLite → JSON |
| `memory retrieve` | ~25 s | ~2 s | SQLite → JSON |
| `memory list` | ~25 s | ~2 s | SQLite → JSON |
| `memory delete` | ~25 s | ~2 s | SQLite → JSON |
| `memory stats` | ~25 s | ~2 s | SQLite → JSON |
| `memory search` (substring OK) | ~25 s | ~2 s | SQLite → JSON, semantic → substring |

## What's NOT migrable yet

| Call shape | Why deferred | Tracked by |
|---|---|---|
| `memory search` with smart=true / threshold | needs ONNX + HNSW | alpha.3+ unified backend |
| `hooks route` / `hooks model-outcome` / etc. | handlers stay in cli | alpha.3 handler dispatch |
| `agent spawn` / `swarm init` / `task create` | extras, not in cli-core | not planned (heavy by design) |
| `neural train` / `embeddings batch` | ML-heavy | not planned |

## Concrete diff for a plugin Bash block

Before:

```js
const r = spawnSync('npx', [
  '@claude-flow/cli@latest', 'memory', 'store',
  '--namespace', 'cost-tracking',
  '--key', `session-${id}`,
  '--value', JSON.stringify(summary),
], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' });
```

After:

```js
const cliPkg = process.env.CLI_CORE === '1'
  ? '@claude-flow/cli-core@alpha'  // lite path — JSON backend, fast cold cache
  : '@claude-flow/cli@latest';     // heavy path — SQLite/HNSW, slow cold cache
const r = spawnSync('npx', [
  cliPkg, 'memory', 'store',
  '--namespace', 'cost-tracking',
  '--key', `session-${id}`,
  '--value', JSON.stringify(summary),
], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' });
```

Setting `CLI_CORE=1` opts into the lite path. Leaving it unset preserves the existing behavior. This pattern lets you A/B test before committing.

## Recommended adoption sequence

1. **Pick one plugin script** (e.g. cost-tracker's `track.mjs`) and apply the env-flag pattern above.
2. **Run with both flags** in your dev workflow for a few days. Observe whether the JSON backend's substring-search regression bites you.
3. **If yes**, fall back to `cli@latest` for the affected call sites and document the gap; ping us on issue [#1760](https://github.com/ruvnet/ruflo/issues/1760) so we can prioritize.
4. **If no**, flip the default in your plugin's package.json by setting `CLI_CORE=1` in your scripts' env — done.

## Storage backend coexistence

Today, cli-core's `JsonMemoryBackend` writes `.swarm/memory.json`; cli's `SqliteHnswMemoryBackend` writes `.swarm/memory.db`. They DON'T share data.

Plans to converge:

- **alpha.3 or later**: cli-core's backend will optionally read `.swarm/memory.db` via a shared schema (still no semantic search, but the data is visible).
- **alpha.4 or later**: cli-core ships an opt-in HNSW build (small bundle if loaded lazy) so semantic search works without pulling cli's full surface.
- Until then: be explicit in your plugin's docs that switching to cli-core changes which file holds your data.

## Reverting

If a switch breaks you:

```bash
# Revert: just delete the env override or remove the conditional.
unset CLI_CORE
```

Or replace the conditional with the bare `'@claude-flow/cli@latest'` and re-run. cli-core left no permanent footprint other than the JSON file (which you can delete: `rm .swarm/memory.json`).

## Reporting issues

cli-core is alpha — please file feedback at https://github.com/ruvnet/ruflo/issues with the label `cli-core-alpha`. Specifically helpful:

- Cold-cache wall-time on your network (run `rm -rf ~/.npm/_npx; time npx -y @claude-flow/cli-core@alpha --version`)
- Substring-search false negatives (cases where you expected semantic match)
- Operations you want migrated but are blocked on (will help prioritize alpha.3)

## Cross-references

- [ADR-100](../../docs/adr/ADR-100-cli-core-split-lazy-load.md) — design rationale
- [Issue #1748 #3](https://github.com/ruvnet/ruflo/issues/1748) — the cold-cache problem this addresses
- [Issue #1760](https://github.com/ruvnet/ruflo/issues/1760) — alpha tracking
- Branch [`feat/cli-core-split`](https://github.com/ruvnet/ruflo/tree/feat/cli-core-split) — work in progress
