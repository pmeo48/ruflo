export function formatBetLabel(pick) {
  if (!pick) return 'PASS';
  const { market, label, odds } = pick;
  const oddsStr = odds ? (parseFloat(odds) > 0 ? `+${odds}` : odds) : '';
  if (market === 'spread') return `${label} ${oddsStr}`;
  if (market === 'ml') return `${label} ${oddsStr}`;
  if (market === 'total') return `${label} ${oddsStr}`;
  return `${label} ${oddsStr}`;
}

export function formatOdds(american) {
  const n = parseFloat(american);
  if (isNaN(n)) return american || 'N/A';
  return n > 0 ? `+${n}` : String(n);
}

export function formatPct(n, dec = 1) {
  if (n == null || isNaN(n)) return 'N/A';
  return `${(n * 100).toFixed(dec)}%`;
}

export function formatEV(n) {
  if (n == null || isNaN(n)) return 'N/A';
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

export function formatDollar(n) {
  if (n == null || isNaN(n)) return '$0.00';
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export function formatDate(isoStr) {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return isoStr; }
}
