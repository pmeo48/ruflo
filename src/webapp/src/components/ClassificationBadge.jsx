import React from 'react';

const TIER_STYLES = {
  'ELITE': { bg: 'rgba(201,168,76,0.18)', color: '#c9a84c', border: 'rgba(201,168,76,0.4)', label: '★ ELITE' },
  'STRONG BET': { bg: 'rgba(0,255,168,0.12)', color: '#00FFA8', border: 'rgba(0,255,168,0.3)', label: '✓ STRONG BET' },
  'VALUE BET': { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: 'rgba(96,165,250,0.3)', label: '◆ VALUE BET' },
  'LEAN / TRACK': { bg: 'rgba(250,204,21,0.10)', color: '#fbbf24', border: 'rgba(250,204,21,0.25)', label: '~ LEAN' },
};

const GRADE_STYLES = {
  'A+': { bg: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: 'rgba(201,168,76,0.3)' },
  'A':  { bg: 'rgba(0,255,168,0.10)', color: '#00FFA8', border: 'rgba(0,255,168,0.25)' },
  'B':  { bg: 'rgba(96,165,250,0.10)', color: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
  'Lean': { bg: 'rgba(250,204,21,0.08)', color: '#fbbf24', border: 'rgba(250,204,21,0.2)' },
  'Fade': { bg: 'rgba(239,68,68,0.10)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
};

export function TierBadge({ tier }) {
  if (!tier) return null;
  const s = TIER_STYLES[tier] || { bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)', label: tier };
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: '0.4rem', padding: '0.2rem 0.6rem',
      fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {s.label || tier}
    </span>
  );
}

export function GradeBadge({ grade }) {
  if (!grade) return null;
  const s = GRADE_STYLES[grade] || GRADE_STYLES['Lean'];
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: '0.4rem', padding: '0.2rem 0.55rem',
      fontSize: '0.7rem', fontWeight: 700,
    }}>
      {grade}
    </span>
  );
}
