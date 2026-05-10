//! Browser keymap. F1–F12 and `/` are reserved by the host, so we use
//! `Ctrl+1..9` for pane focus and `:` to enter command mode (vim-ish), with
//! `Esc` to leave it and `Enter` to submit.
//!
//! On native builds, only the unit tests reach this code; the warnings would
//! otherwise be a distraction.
#![allow(dead_code)]

use serde::{Deserialize, Serialize};

/// High-level UI action produced by the keymap. The shell is free to ignore
/// or remap these; they're just a stable enum the host can talk to without
/// re-implementing browser-key parsing in TypeScript.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Action {
    /// Focus pane index 1..=9 (`Ctrl+<digit>`). 0 means "command bar".
    FocusPane(u8),
    /// Enter command mode (`:`).
    EnterCmd,
    /// Leave command mode (`Esc`).
    LeaveCmd,
    /// Submit the current input (`Enter`).
    Submit,
    /// Unrecognised key — the host can decide whether to insert it as text.
    Unknown,
}

/// Parsed key descriptor coming from a JS `KeyboardEvent`. The host fills this
/// in; we deliberately don't depend on `web-sys::KeyboardEvent` here so the
/// keymap is unit-testable on native.
#[derive(Debug, Clone, Copy)]
pub struct KeyEvent<'a> {
    pub key: &'a str,
    pub ctrl: bool,
    pub alt: bool,
    pub meta: bool,
}

/// Map a key event to a high-level [`Action`].
pub fn map(ev: KeyEvent<'_>) -> Action {
    match ev.key {
        ":" if !ev.ctrl && !ev.meta => Action::EnterCmd,
        "Escape" => Action::LeaveCmd,
        "Enter" => Action::Submit,
        k if ev.ctrl && !ev.alt && !ev.meta && k.len() == 1 => {
            // Ctrl+1..9
            let c = k.chars().next().unwrap();
            if let Some(d) = c.to_digit(10) {
                if (1..=9).contains(&d) {
                    return Action::FocusPane(d as u8);
                }
            }
            Action::Unknown
        }
        _ => Action::Unknown,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ev(key: &str, ctrl: bool) -> KeyEvent<'_> {
        KeyEvent { key, ctrl, alt: false, meta: false }
    }

    #[test]
    fn ctrl_digits_focus_panes() {
        for d in 1..=9 {
            let s = d.to_string();
            assert_eq!(map(ev(&s, true)), Action::FocusPane(d as u8));
        }
    }

    #[test]
    fn cmd_mode_keys() {
        assert_eq!(map(ev(":", false)), Action::EnterCmd);
        assert_eq!(map(ev("Escape", false)), Action::LeaveCmd);
        assert_eq!(map(ev("Enter", false)), Action::Submit);
    }

    #[test]
    fn ctrl_zero_is_unknown() {
        assert_eq!(map(ev("0", true)), Action::Unknown);
    }
}
