import React from 'react';

const SPORT_COLORS = {
  NBA: { bg: 'rgba(200,120,0,0.18)', color: '#fb923c', border: 'rgba(200,120,0,0.3)' },
  NFL: { bg: 'rgba(0,80,180,0.18)', color: '#60a5fa', border: 'rgba(0,80,180,0.3)' },
  MLB: { bg: 'rgba(180,0,0,0.18)', color: '#f87171', border: 'rgba(180,0,0,0.3)' },
  NHL: { bg: 'rgba(0,100,160,0.18)', color: '#38bdf8', border: 'rgba(0,100,160,0.3)' },
  NCAAB: { bg: 'rgba(100,0,180,0.18)', color: '#c084fc', border: 'rgba(100,0,180,0.3)' },
  NCAAF: { bg: 'rgba(0,120,80,0.18)', color: '#4ade80', border: 'rgba(0,120,80,0.3)' },
  Soccer: { bg: 'rgba(0,160,80,0.18)', color: '#34d399', border: 'rgba(0,160,80,0.3)' },
};

export default function SportBadge({ sport, size = 'sm' }) {
  const colors = SPORT_COLORS[sport] || { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'rgba(255,255,255,0.1)' };
  const px = size === 'xs' ? '0.4rem' : '0.65rem';
  const py = size === 'xs' ? '0.15rem' : '0.25rem';
  const fs = size === 'xs' ? '0.65rem' : '0.7rem';
  return (
    <span style={{
      background: colors.bg,
      color: colors.color,
      border: `1px solid ${colors.border}`,
      borderRadius: '0.35rem',
      padding: `${py} ${px}`,
      fontSize: fs,
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {sport}
    </span>
  );
}
