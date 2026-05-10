//! Hand-written `window.fetch` wrapper. We deliberately avoid `gloo-net` /
//! `reqwest` to keep this crate's dep count low. All requests are routed via
//! the SvelteKit `/api/aperture/fetch?u=...` proxy so API keys stay in
//! `.env` server-side and never reach the WASM bundle.

use js_sys::{Object, Promise, Reflect};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = window, js_name = fetch)]
    fn window_fetch(input: &JsValue, init: &JsValue) -> Promise;
}

/// Path of the SvelteKit CORS proxy. Always relative — the WASM bundle is
/// served from the same origin as ruvocal.
const PROXY_PATH: &str = "/api/aperture/fetch";

/// Fetch JSON from `upstream_url` via the proxy. Returns the response body as
/// a UTF-8 string; the caller decides how to parse it.
///
/// TODO: add response-content-type validation and a 30s timeout (the proxy
/// already enforces upstream timeouts; this would be belt-and-braces).
pub async fn fetch_json(upstream_url: &str) -> Result<String, JsValue> {
    let proxied = format!("{PROXY_PATH}?u={}", encode_uri_component(upstream_url));
    let init = Object::new();
    Reflect::set(&init, &JsValue::from_str("method"), &JsValue::from_str("GET"))?;
    let promise = window_fetch(&JsValue::from_str(&proxied), &init);
    let resp_val = JsFuture::from(promise).await?;
    let resp: web_sys::Response = resp_val.dyn_into()?;
    if !resp.ok() {
        return Err(JsValue::from_str(&format!(
            "aperture fetch: upstream returned {}",
            resp.status()
        )));
    }
    let text_promise = resp.text()?;
    let text_val = JsFuture::from(text_promise).await?;
    text_val
        .as_string()
        .ok_or_else(|| JsValue::from_str("aperture fetch: response body was not a string"))
}

/// Browser `encodeURIComponent` shim (sufficient for the URL slot only).
fn encode_uri_component(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char);
            }
            _ => out.push_str(&format!("%{:02X}", b)),
        }
    }
    out
}

// NB: unit tests live in `keymap_web` (target-agnostic logic). `fetch_bridge`
// is wasm32-only because it depends on `web_sys::Response`; we exercise it via
// the `wasm-pack test --headless --chrome` suite added in Phase B.

