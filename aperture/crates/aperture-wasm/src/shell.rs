//! Browser shell. Mounts a minimal four-pane workspace and exposes `App` to JS.
//!
//! The host (SvelteKit) is responsible for the `postMessage` relay to ruflo's
//! `message-bus.ts`. The shell only:
//!   1. parses command lines via [`aperture_core::parse`],
//!   2. produces an outbound [`Envelope`] for the host to forward,
//!   3. accepts inbound envelopes and turns them into per-pane `View` lines.

use aperture_core::{parse, Arg, Command, Verb};
use aperture_swarm::envelope::{Envelope, MessageType, Priority};
use serde::Serialize;
use serde_json::json;
use wasm_bindgen::prelude::*;

/// Stable pane ids used in the v0.1 four-pane layout.
const PANE_QUOTE: &str = "aperture:pane.quote#1";
const PANE_CHART: &str = "aperture:pane.chart#1";
const PANE_WATCH: &str = "aperture:pane.watch#1";
const PANE_ORACLE: &str = "aperture:pane.oracle#1";

/// Logical pane the host can render to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Pane {
    Quote,
    Chart,
    Watch,
    Oracle,
    /// Catch-all for log lines / parse errors that don't belong to a pane.
    System,
}

/// One line of rendered output for a pane. The host decides how to display it.
#[derive(Debug, Clone, Serialize)]
pub struct ViewLine {
    pub pane: Pane,
    pub text: String,
}

/// Result of [`App::execute`] — designed for `serde_wasm_bindgen::to_value`.
#[derive(Debug, Serialize)]
struct ExecuteOk {
    ast: Command,
    /// Outbound envelope for the host to forward to the swarm bus, if any.
    /// `None` for purely-local verbs like HELP / CLS.
    outbound: Option<Envelope>,
    /// Per-pane lines to render immediately (e.g. echo, HELP body).
    views: Vec<ViewLine>,
}

#[derive(Debug, Serialize)]
struct ExecuteErr {
    err: String,
}

/// Mount the shell into a host element. Phase A keeps this minimal — the
/// SvelteKit page already lays out four boxes; this entry point exists so the
/// host can still call `start("aperture-mount")` to confirm the binding loaded.
#[wasm_bindgen]
pub fn start(_mount_id: &str) -> Result<(), JsValue> {
    // Phase B: real DOM mounting (ratzilla) lives here. v0.1 leaves DOM to
    // SvelteKit and this crate stays a pure logic core.
    Ok(())
}

/// Browser-side App. Holds the command-bar buffer and the focused symbol.
#[wasm_bindgen]
pub struct App {
    /// Last symbol broadcast via FOCUS, so panes can re-anchor.
    last_symbol: Option<String>,
    /// Monotonic counter for envelope ids until we add a real ULID dep.
    seq: u64,
}

#[wasm_bindgen]
impl App {
    #[wasm_bindgen(constructor)]
    pub fn new() -> App {
        App { last_symbol: None, seq: 0 }
    }

    /// Parse `line` and produce the host-facing result. Shape:
    /// ```ignore
    /// // success
    /// { ok: { ast, outbound: Envelope|null, views: ViewLine[] } }
    /// // failure
    /// { err: string }
    /// ```
    pub fn execute(&mut self, line: &str) -> JsValue {
        match parse(line) {
            Ok(cmd) => {
                let mut views = vec![ViewLine {
                    pane: Pane::System,
                    text: format!("> {}", line.trim()),
                }];
                if let Some(s) = cmd.symbol.clone() {
                    self.last_symbol = Some(s);
                }
                let outbound = self.envelope_for(&cmd);
                if let Some(local) = local_render(&cmd) {
                    views.extend(local);
                }
                let payload = ExecuteOk { ast: cmd, outbound, views };
                serde_wasm_bindgen::to_value(&serde_json::json!({ "ok": payload }))
                    .unwrap_or(JsValue::NULL)
            }
            Err(e) => {
                let payload = ExecuteErr { err: e.to_string() };
                serde_wasm_bindgen::to_value(&payload).unwrap_or(JsValue::NULL)
            }
        }
    }

    /// Accept a JSON-encoded inbound [`Envelope`] from the host and return
    /// per-pane `ViewLine`s. The host got the envelope from
    /// `message-bus.ts` over `window.postMessage`.
    pub fn handle_inbound(&mut self, envelope_json: &str) -> JsValue {
        let env: Envelope = match serde_json::from_str(envelope_json) {
            Ok(e) => e,
            Err(e) => {
                let v = vec![ViewLine {
                    pane: Pane::System,
                    text: format!("inbound parse error: {e}"),
                }];
                return serde_wasm_bindgen::to_value(&v).unwrap_or(JsValue::NULL);
            }
        };
        let lines = render_inbound(&env);
        serde_wasm_bindgen::to_value(&lines).unwrap_or(JsValue::NULL)
    }
}

impl Default for App {
    fn default() -> Self {
        Self::new()
    }
}

impl App {
    /// Build the outbound envelope for a parsed command. Returns `None` for
    /// purely-local verbs.
    fn envelope_for(&mut self, cmd: &Command) -> Option<Envelope> {
        let (msg_type, to, payload) = match cmd.verb {
            Verb::Help | Verb::Cls | Verb::Exit | Verb::List => return None,
            Verb::Desc | Verb::Watch | Verb::Unwatch => {
                let symbol = cmd.symbol.clone()?;
                let to = match cmd.verb {
                    Verb::Desc => "aperture:agent.quote",
                    Verb::Watch | Verb::Unwatch => "aperture:agent.watch",
                    _ => unreachable!(),
                };
                (
                    MessageType::Direct,
                    to.to_string(),
                    json!({
                        "verb": verb_str(cmd.verb),
                        "symbol": symbol,
                        "args": args_to_json(&cmd.args),
                    }),
                )
            }
            Verb::Chart => {
                let symbol = cmd.symbol.clone()?;
                (
                    MessageType::Direct,
                    "aperture:agent.data".to_string(),
                    json!({
                        "verb": "OHLCV",
                        "symbol": symbol,
                        "period": first_arg(&cmd.args).unwrap_or_else(|| "6M".into()),
                    }),
                )
            }
            Verb::Crypto => {
                let symbol = cmd.symbol.clone()?;
                (
                    MessageType::Direct,
                    "aperture:agent.data".to_string(),
                    json!({
                        "verb": "CRYPTO",
                        "symbol": symbol,
                    }),
                )
            }
            Verb::Ask => {
                let prompt = cmd
                    .args
                    .iter()
                    .find_map(|a| match a {
                        Arg::Quoted(s) => Some(s.clone()),
                        _ => None,
                    })
                    .unwrap_or_default();
                (
                    MessageType::Direct,
                    "aperture:agent.oracle".to_string(),
                    json!({
                        "verb": "ASK",
                        "prompt": prompt,
                        "symbol": cmd.symbol.clone().or_else(|| self.last_symbol.clone()),
                    }),
                )
            }
        };

        self.seq = self.seq.wrapping_add(1);
        Some(Envelope {
            id: format!("aperture-{:08x}", self.seq),
            message_type: msg_type,
            from: "aperture:cmdbar".into(),
            to,
            payload,
            // TODO: real ISO-8601 from `js_sys::Date` when we add a transport.
            timestamp: "1970-01-01T00:00:00.000Z".into(),
            priority: Priority::Normal,
            requires_ack: false,
            ttl_ms: 5000,
            correlation_id: None,
        })
    }
}

/// Local renderer for verbs that don't need to leave the WASM module.
fn local_render(cmd: &Command) -> Option<Vec<ViewLine>> {
    match cmd.verb {
        Verb::Help => Some(vec![
            line(Pane::System, "verbs: HELP CLS EXIT LIST DESC CHART WATCH UNWATCH ASK CRYPTO"),
            line(Pane::System, "form: SYMBOL VERB [ARGS] GO   (e.g. AAPL CHART 6M GO)"),
        ]),
        Verb::Cls => Some(vec![line(Pane::System, "[clear]")]),
        Verb::List => Some(vec![line(Pane::Watch, "(watchlist not yet wired — Phase C)")]),
        Verb::Exit => Some(vec![line(Pane::System, "(exit ignored in browser)")]),
        _ => None,
    }
}

/// Decide which pane an inbound envelope belongs to and produce a line for it.
fn render_inbound(env: &Envelope) -> Vec<ViewLine> {
    let pane = pane_from_address(&env.from);
    let payload_str = serde_json::to_string(&env.payload).unwrap_or_default();
    let verb = env
        .payload
        .get("verb")
        .and_then(|v| v.as_str())
        .unwrap_or("?");
    vec![ViewLine {
        pane,
        text: format!("{verb}  {payload_str}"),
    }]
}

fn pane_from_address(addr: &str) -> Pane {
    // `aperture:agent.<role>` or `aperture:pane.<role>#N`
    let lower = addr.to_ascii_lowercase();
    if lower.contains("quote") {
        Pane::Quote
    } else if lower.contains("chart") || lower.contains("data") {
        Pane::Chart
    } else if lower.contains("watch") {
        Pane::Watch
    } else if lower.contains("oracle") {
        Pane::Oracle
    } else {
        Pane::System
    }
}

fn line(pane: Pane, text: &str) -> ViewLine {
    ViewLine { pane, text: text.into() }
}

fn first_arg(args: &[Arg]) -> Option<String> {
    args.first().map(|a| a.as_str().to_string())
}

fn args_to_json(args: &[Arg]) -> serde_json::Value {
    serde_json::Value::Array(args.iter().map(|a| json!(a.as_str())).collect())
}

fn verb_str(v: Verb) -> &'static str {
    match v {
        Verb::Help => "HELP",
        Verb::Cls => "CLS",
        Verb::Exit => "EXIT",
        Verb::List => "LIST",
        Verb::Desc => "DESC",
        Verb::Chart => "CHART",
        Verb::Watch => "WATCH",
        Verb::Unwatch => "UNWATCH",
        Verb::Ask => "ASK",
        Verb::Crypto => "CRYPTO",
    }
}

// Silence unused-import warnings on the `use crate::keymap_web` / fetch_bridge
// glue; those are exercised through `App` once Phase B wires real DOM events.
#[allow(unused_imports)]
use crate::{fetch_bridge, keymap_web};
