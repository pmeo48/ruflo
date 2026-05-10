//! Pane-as-agent implementations: Quote, Chart, Watchlist, Oracle.
//!
//! Each pane backs onto `aperture_data::StubDataSource` for Phase B; Phase C
//! swaps in the real provider mux for `pane.quote` / `pane.chart` and routes
//! `pane.oracle` to `plugins/ruflo-neural-trader` via the swarm bus.

use aperture_data::{DataSource, StubDataSource};
use aperture_swarm::{reply, Agent, Envelope};
use serde_json::{json, Value};

use super::{render_ascii_chart, symbol_of, verb};

// ---------------------------------------------------------------------------
// Quote pane
// ---------------------------------------------------------------------------

pub struct QuotePane {
    id: String,
    focus: Option<String>,
    source: StubDataSource,
}

impl QuotePane {
    pub fn new() -> Self {
        Self {
            id: "aperture:pane.quote".into(),
            focus: None,
            source: StubDataSource,
        }
    }
}

impl Agent for QuotePane {
    fn id(&self) -> &str {
        &self.id
    }

    async fn handle(&mut self, env: Envelope) -> Vec<Envelope> {
        match verb(&env) {
            Some("DESC") => {
                let Some(sym) = symbol_of(&env) else {
                    return vec![reply(
                        &env,
                        json!({"verb": "QUOTE.RESULT", "error": "missing symbol"}),
                    )];
                };
                self.focus = Some(sym.clone());
                match self.source.quote(&sym).await {
                    Ok(q) => vec![reply(
                        &env,
                        json!({
                            "verb": "QUOTE.RESULT",
                            "symbol": q.symbol,
                            "last": q.last,
                            "changePct": q.change_pct,
                            "bid": q.bid,
                            "ask": q.ask,
                            "timestamp": q.timestamp,
                        }),
                    )],
                    Err(e) => vec![reply(
                        &env,
                        json!({"verb": "QUOTE.RESULT", "symbol": sym, "error": e.to_string()}),
                    )],
                }
            }
            Some("FOCUS") => {
                self.focus = symbol_of(&env);
                if env.requires_ack {
                    vec![reply(
                        &env,
                        json!({"verb": "FOCUS.ACK", "symbol": self.focus.clone()}),
                    )]
                } else {
                    vec![]
                }
            }
            _ => vec![],
        }
    }
}

// ---------------------------------------------------------------------------
// Chart pane
// ---------------------------------------------------------------------------

pub struct ChartPane {
    id: String,
    focus: Option<String>,
    source: StubDataSource,
}

impl ChartPane {
    pub fn new() -> Self {
        Self {
            id: "aperture:pane.chart".into(),
            focus: None,
            source: StubDataSource,
        }
    }
}

impl Agent for ChartPane {
    fn id(&self) -> &str {
        &self.id
    }

    async fn handle(&mut self, env: Envelope) -> Vec<Envelope> {
        match verb(&env) {
            Some("CHART") => {
                let Some(sym) = symbol_of(&env) else {
                    return vec![reply(
                        &env,
                        json!({"verb": "CHART.RESULT", "error": "missing symbol"}),
                    )];
                };
                let range = env
                    .payload
                    .get("range")
                    .and_then(Value::as_str)
                    .unwrap_or("1M");
                self.focus = Some(sym.clone());
                match self.source.ohlcv(&sym, range).await {
                    Ok(candles) => {
                        let lines = render_ascii_chart(&candles);
                        vec![reply(
                            &env,
                            json!({
                                "verb": "CHART.RESULT",
                                "symbol": sym,
                                "range": range,
                                "lines": lines,
                                "candleCount": candles.len(),
                            }),
                        )]
                    }
                    Err(e) => vec![reply(
                        &env,
                        json!({"verb": "CHART.RESULT", "symbol": sym, "error": e.to_string()}),
                    )],
                }
            }
            Some("FOCUS") => {
                self.focus = symbol_of(&env);
                if env.requires_ack {
                    vec![reply(
                        &env,
                        json!({"verb": "FOCUS.ACK", "symbol": self.focus.clone()}),
                    )]
                } else {
                    vec![]
                }
            }
            _ => vec![],
        }
    }
}

// ---------------------------------------------------------------------------
// Watchlist pane
// ---------------------------------------------------------------------------

pub struct WatchlistPane {
    id: String,
    items: Vec<String>,
}

impl WatchlistPane {
    pub fn new() -> Self {
        Self {
            id: "aperture:pane.watchlist".into(),
            items: Vec::new(),
        }
    }
}

impl Agent for WatchlistPane {
    fn id(&self) -> &str {
        &self.id
    }

    async fn handle(&mut self, env: Envelope) -> Vec<Envelope> {
        match verb(&env) {
            Some("WATCH") => {
                let Some(sym) = symbol_of(&env) else {
                    return vec![reply(
                        &env,
                        json!({"verb": "WATCH.RESULT", "error": "missing symbol"}),
                    )];
                };
                if !self.items.contains(&sym) {
                    self.items.push(sym.clone());
                }
                vec![reply(
                    &env,
                    json!({"verb": "WATCH.RESULT", "symbol": sym, "items": self.items}),
                )]
            }
            Some("UNWATCH") => {
                let Some(sym) = symbol_of(&env) else {
                    return vec![reply(
                        &env,
                        json!({"verb": "UNWATCH.RESULT", "error": "missing symbol"}),
                    )];
                };
                self.items.retain(|x| x != &sym);
                vec![reply(
                    &env,
                    json!({"verb": "UNWATCH.RESULT", "symbol": sym, "items": self.items}),
                )]
            }
            Some("LIST") => vec![reply(
                &env,
                json!({"verb": "LIST.RESULT", "items": self.items}),
            )],
            Some("FOCUS") => vec![],
            _ => vec![],
        }
    }
}

// ---------------------------------------------------------------------------
// Oracle pane
// ---------------------------------------------------------------------------

pub struct OraclePane {
    id: String,
    focus: Option<String>,
}

impl OraclePane {
    pub fn new() -> Self {
        Self {
            id: "aperture:pane.oracle".into(),
            focus: None,
        }
    }
}

impl Agent for OraclePane {
    fn id(&self) -> &str {
        &self.id
    }

    async fn handle(&mut self, env: Envelope) -> Vec<Envelope> {
        match verb(&env) {
            Some("ASK") => {
                let prompt = env
                    .payload
                    .get("prompt")
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .to_string();
                // TODO(phase-c): forward prompt to ruflo-neural-trader via
                // the swarm bus instead of returning a stub response.
                let answer = format!(
                    "(stub) received prompt of {} chars; will route to ruflo-neural-trader in Phase C",
                    prompt.len()
                );
                vec![reply(
                    &env,
                    json!({
                        "verb": "ASK.RESULT",
                        "prompt": prompt,
                        "answer": answer,
                        "focus": self.focus,
                    }),
                )]
            }
            Some("FOCUS") => {
                self.focus = symbol_of(&env);
                vec![]
            }
            _ => vec![],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use aperture_swarm::{MessageType, Priority};

    fn req(verb_s: &str, extra: Value) -> Envelope {
        let mut payload = json!({"verb": verb_s});
        if let (Some(p), Some(extra_obj)) = (payload.as_object_mut(), extra.as_object()) {
            for (k, v) in extra_obj {
                p.insert(k.clone(), v.clone());
            }
        }
        Envelope {
            id: "test-1".into(),
            message_type: MessageType::Direct,
            from: "aperture:cmdbar".into(),
            to: "aperture:pane.x".into(),
            payload,
            timestamp: "2026-05-10T15:04:05.000Z".into(),
            priority: Priority::Normal,
            requires_ack: false,
            ttl_ms: 5000,
            correlation_id: Some("corr-1".into()),
        }
    }

    #[tokio::test]
    async fn quote_pane_handles_desc() {
        let mut p = QuotePane::new();
        let env = req("DESC", json!({"symbol": "AAPL"}));
        let outs = p.handle(env).await;
        assert_eq!(outs.len(), 1);
        assert_eq!(outs[0].payload["verb"], "QUOTE.RESULT");
        assert_eq!(outs[0].payload["symbol"], "AAPL");
        assert_eq!(outs[0].correlation_id.as_deref(), Some("corr-1"));
    }

    #[tokio::test]
    async fn watchlist_pane_add_remove_list() {
        let mut p = WatchlistPane::new();
        let _ = p.handle(req("WATCH", json!({"symbol": "AAPL"}))).await;
        let _ = p.handle(req("WATCH", json!({"symbol": "TSLA"}))).await;
        let outs = p.handle(req("LIST", json!({}))).await;
        let items = outs[0].payload["items"].as_array().unwrap();
        assert_eq!(items.len(), 2);
        let _ = p.handle(req("UNWATCH", json!({"symbol": "AAPL"}))).await;
        let outs = p.handle(req("LIST", json!({}))).await;
        let items = outs[0].payload["items"].as_array().unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(items[0], "TSLA");
    }

    #[tokio::test]
    async fn chart_pane_returns_lines() {
        let mut p = ChartPane::new();
        let outs = p
            .handle(req("CHART", json!({"symbol": "AAPL", "range": "1M"})))
            .await;
        assert_eq!(outs.len(), 1);
        assert_eq!(outs[0].payload["verb"], "CHART.RESULT");
        let lines = outs[0].payload["lines"].as_array().unwrap();
        assert!(!lines.is_empty());
    }

    #[tokio::test]
    async fn oracle_pane_echoes_ask() {
        let mut p = OraclePane::new();
        let outs = p
            .handle(req("ASK", json!({"prompt": "what is going on?"})))
            .await;
        assert_eq!(outs.len(), 1);
        assert_eq!(outs[0].payload["verb"], "ASK.RESULT");
    }
}
