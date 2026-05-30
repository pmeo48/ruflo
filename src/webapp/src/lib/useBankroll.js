import { useState } from 'react';
const KEY = 'edge_ai_bankroll';
export function useBankroll() {
  const [bankroll, setBankroll] = useState(() => {
    const v = parseFloat(localStorage.getItem(KEY));
    return (!v || isNaN(v) || v < 10) ? 1000 : v;
  });
  const set = val => {
    const n = Math.max(10, parseFloat(val) || 1000);
    setBankroll(n);
    localStorage.setItem(KEY, n);
  };
  return [bankroll, set];
}
