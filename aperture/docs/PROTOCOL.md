# Aperture wire protocol (v0.1)

Each pane and the data agent run as a headless process invoked with
`--agent=<id>`. Inbound and outbound traffic is **newline-delimited JSON**,
one `Envelope` per line, on stdin / stdout. EOF on stdin terminates the
agent cleanly.

The envelope is field-identical to `v3/@claude-flow/swarm/src/types.ts`
`Message`, so JSON round-trips between TypeScript and Rust without any
field remap.

## Envelope

```json
{
  "id": "01HXY...K5",
  "type": "direct",
  "from": "aperture:cmdbar",
  "to":   "aperture:pane.chart",
  "payload": { "verb": "CHART", "symbol": "AAPL", "range": "6M" },
  "timestamp": "2026-05-10T15:04:05.123Z",
  "priority": "high",
  "requiresAck": false,
  "ttlMs": 5000,
  "correlationId": "chart-load-7"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | Sortable, process-unique. The Rust runtime's `make_id()` is `<unix-millis-base36>-<pid-base36>-<counter-base36>`; ids minted on the TS side stay ULID. |
| `type` | enum | `direct`, `broadcast`, `task_assign`, `task_complete`, `task_fail`, `heartbeat`, `status_update`, `consensus_propose`, `consensus_vote`, `consensus_commit`, `topology_update`, `agent_join`, `agent_leave`. |
| `from` / `to` | string | Stable agent ids. Aperture uses `aperture:<role>` (e.g. `aperture:pane.quote`, `aperture:agent.data`, `aperture:cmdbar`); broadcasts target the literal `broadcast`. |
| `payload` | object | Verb-specific. `payload.verb` is mandatory for Aperture traffic. |
| `timestamp` | string | ISO-8601 UTC, millisecond precision, trailing `Z`. |
| `priority` | enum | `urgent`, `high`, `normal`, `low`. Replies inherit the request's priority. |
| `requiresAck` | bool | If `true`, recipients must reply (even with an empty `*.ACK` payload). |
| `ttlMs` | number | Soft deadline in milliseconds. Replies inherit the inbound `ttlMs`. |
| `correlationId` | string? | Set on the request; copied verbatim to the reply. Omitted when none is set. |

A reply is built with `aperture_swarm::reply(&req, payload)` which swaps
`from`/`to`, copies `correlationId` (falling back to `req.id` when none is
set), mints a fresh `id`/`timestamp`, and inherits `priority`/`ttlMs`.

## Verb table

`payload.verb` selects the operation. Replies always end in `.RESULT`
(or `.ACK` when the inbound was a `requiresAck` broadcast).

| Verb | From → To | Payload (in) | Reply verb | Owner |
|---|---|---|---|---|
| `DESC` | cmdbar → `pane.quote` | `{symbol}` | `QUOTE.RESULT` | quote pane |
| `CHART` | cmdbar → `pane.chart` | `{symbol, range?}` | `CHART.RESULT` | chart pane |
| `WATCH` | cmdbar → `pane.watchlist` | `{symbol}` | `WATCH.RESULT` | watchlist pane |
| `UNWATCH` | cmdbar → `pane.watchlist` | `{symbol}` | `UNWATCH.RESULT` | watchlist pane |
| `LIST` | cmdbar → `pane.watchlist` | `{}` | `LIST.RESULT` | watchlist pane |
| `ASK` | cmdbar → `pane.oracle` | `{prompt}` | `ASK.RESULT` | oracle pane |
| `QUOTE` | (any) → `agent.data` | `{symbol}` | `QUOTE.RESULT` | data agent |
| `OHLCV` | `pane.chart` → `agent.data` | `{symbol, range?}` | `OHLCV.RESULT` | data agent |
| `FOCUS` | cmdbar → `broadcast` | `{symbol}` | `FOCUS.ACK` (only if `requiresAck`) | every pane |

### Reply payload shapes

| Reply verb | Fields |
|---|---|
| `QUOTE.RESULT` | `{symbol, last, changePct, bid?, ask?, timestamp}` or `{symbol, error}` |
| `CHART.RESULT` | `{symbol, range, lines: string[], candleCount}` or `{symbol, error}` |
| `WATCH.RESULT` | `{symbol, items: string[]}` |
| `UNWATCH.RESULT` | `{symbol, items: string[]}` |
| `LIST.RESULT` | `{items: string[]}` |
| `ASK.RESULT` | `{prompt, answer, focus?}` |
| `OHLCV.RESULT` | `{symbol, range, candles: [{t,o,h,l,c,v}]}` or `{symbol, error}` |
| `FOCUS.ACK` | `{symbol}` |

## Agent ids

| Id | Process invocation | Verbs handled |
|---|---|---|
| `aperture:pane.quote` | `aperture --agent=pane.quote` | `DESC`, `FOCUS` |
| `aperture:pane.chart` | `aperture --agent=pane.chart` | `CHART`, `FOCUS` |
| `aperture:pane.watchlist` | `aperture --agent=pane.watchlist` | `WATCH`, `UNWATCH`, `LIST` |
| `aperture:pane.oracle` | `aperture --agent=pane.oracle` | `ASK`, `FOCUS` |
| `aperture:agent.data` | `aperture --agent=agent.data` | `QUOTE`, `OHLCV` |

## Topology (v0.1)

Centralised. The command bar (`aperture:cmdbar`) parses `SYMBOL VERB GO`,
routes the resulting `Envelope` to the owning pane, and broadcasts
`FOCUS <symbol>` on every successful command. Mesh peer-to-pane traffic
(e.g. chart pane querying the data agent directly) lands in v0.2.

## Phase boundaries

- **Phase B (current).** All five agents back onto `aperture_data::StubDataSource`
  (deterministic, offline) so the round-trip integration test in
  `crates/aperture-tui/tests/roundtrip_stdio.rs` is reproducible.
- **Phase C.** `pane.oracle` forwards `ASK` to `plugins/ruflo-neural-trader`
  via the swarm bus; `agent.data` swaps `StubDataSource` for the real
  provider mux (yahoo / fred / coingecko / sec / alphavantage).
