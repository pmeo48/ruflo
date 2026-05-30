import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import StatCard from '../components/StatCard.jsx';
import SportBadge from '../components/SportBadge.jsx';
import { BetLog } from '../lib/db.js';
import { toDec } from '../lib/bettingMath.js';
import { formatDollar } from '../lib/formatters.js';

function calcPL(stake, odds, outcome) {
  if (!stake || outcome === 'Pending') return null;
  if (outcome === 'Push') return 0;
  if (outcome === 'Loss') return -Math.abs(parseFloat(stake));
  return parseFloat((parseFloat(stake) * (toDec(odds) - 1)).toFixed(2));
}

const SPORTS = ['NBA', 'NFL', 'NHL', 'MLB', 'NCAAB', 'NCAAF', 'Soccer'];

export default function Analytics() {
  const bets = BetLog.filter({}, 'created_date', 500);

  const { cumulPL, sportStats, tierStats } = useMemo(() => {
    // Cumulative P&L curve
    let running = 0;
    const cumulPL = bets.map((b, i) => {
      const pl = calcPL(b.stake, b.odds, b.outcome);
      if (pl != null) running += pl;
      return { idx: i + 1, pl: parseFloat(running.toFixed(2)), date: b.game_date || b.created_date?.slice(0, 10) };
    });

    // Sport stats
    const sportMap = {};
    bets.forEach(b => {
      if (!sportMap[b.sport]) sportMap[b.sport] = { total: 0, wins: 0, staked: 0, pl: 0 };
      const pl = calcPL(b.stake, b.odds, b.outcome);
      sportMap[b.sport].total++;
      if (b.outcome === 'Win') sportMap[b.sport].wins++;
      if (b.stake) sportMap[b.sport].staked += Math.abs(parseFloat(b.stake));
      if (pl != null) sportMap[b.sport].pl += pl;
    });
    const sportStats = Object.entries(sportMap).map(([sport, d]) => ({
      sport,
      total: d.total,
      wins: d.wins,
      winRate: d.total > 0 ? parseFloat((d.wins / d.total * 100).toFixed(1)) : 0,
      roi: d.staked > 0 ? parseFloat((d.pl / d.staked * 100).toFixed(1)) : 0,
      pl: parseFloat(d.pl.toFixed(2)),
    }));

    // Tier stats (from notes field)
    const tierMap = {};
    bets.forEach(b => {
      const notes = b.notes || '';
      let tier = 'Unknown';
      if (notes.includes('ELITE')) tier = 'ELITE';
      else if (notes.includes('STRONG')) tier = 'STRONG BET';
      else if (notes.includes('VALUE')) tier = 'VALUE BET';
      else if (notes.includes('LEAN')) tier = 'LEAN';
      if (!tierMap[tier]) tierMap[tier] = { total: 0, wins: 0 };
      tierMap[tier].total++;
      if (b.outcome === 'Win') tierMap[tier].wins++;
    });
    const tierStats = Object.entries(tierMap).map(([tier, d]) => ({
      tier, total: d.total,
      winRate: d.total > 0 ? parseFloat((d.wins / d.total * 100).toFixed(1)) : 0,
    }));

    return { cumulPL, sportStats, tierStats };
  }, [bets]);

  const totalBets = bets.length;
  const resolved = bets.filter(b => b.outcome !== 'Pending');
  const wins = resolved.filter(b => b.outcome === 'Win').length;
  const totalPL = cumulPL.length > 0 ? cumulPL[cumulPL.length - 1]?.pl || 0 : 0;
  const totalStaked = bets.reduce((s, b) => b.stake && b.outcome !== 'Pending' ? s + Math.abs(b.stake) : s, 0);
  const roi = totalStaked > 0 ? (totalPL / totalStaked * 100).toFixed(1) : '0.0';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass px-3 py-2 text-xs">
        <div className="text-white/50 mb-1">Bet #{label}</div>
        <div style={{ color: payload[0].value >= 0 ? '#00FFA8' : '#f87171' }}>
          P&L: {payload[0].value >= 0 ? '+' : ''}{formatDollar(payload[0].value)}
        </div>
      </div>
    );
  };

  if (totalBets === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass p-10 text-center">
          <div className="text-white/25 text-sm">No bet history yet. Start logging bets in the History tab to see analytics.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Analytics</h2>
        <p className="text-sm text-white/40 mt-0.5">Performance metrics across {totalBets} bets</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Bets" value={totalBets} />
        <StatCard label="Win Rate" value={`${resolved.length > 0 ? (wins / resolved.length * 100).toFixed(1) : 0}%`} color="#00FFA8" />
        <StatCard label="Total P&L" value={formatDollar(totalPL)} color={totalPL >= 0 ? '#00FFA8' : '#f87171'} />
        <StatCard label="ROI" value={`${roi}%`} color={parseFloat(roi) >= 0 ? '#00FFA8' : '#f87171'} />
      </div>

      {/* P&L curve */}
      {cumulPL.length > 1 && (
        <div className="glass p-5">
          <h3 className="font-bold text-white mb-4">Bankroll Curve</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cumulPL} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="idx" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Bets', fill: 'rgba(255,255,255,0.2)', fontSize: 10, position: 'insideBottomRight', offset: -5 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="pl" stroke="#00FFA8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ROI by sport */}
      {sportStats.length > 0 && (
        <div className="glass p-5">
          <h3 className="font-bold text-white mb-4">ROI by Sport</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sportStats} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="sport" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: '#0d1610', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }} formatter={v => [`${v}%`, 'ROI']} />
              <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                {sportStats.map((s, i) => <Cell key={i} fill={s.roi >= 0 ? '#00FFA8' : '#f87171'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tier win rate */}
      {tierStats.length > 0 && (
        <div className="glass p-5">
          <h3 className="font-bold text-white mb-4">Win Rate by Tier</h3>
          <div className="space-y-3">
            {tierStats.sort((a, b) => b.winRate - a.winRate).map(t => (
              <div key={t.tier}>
                <div className="flex justify-between text-xs text-white/50 mb-1">
                  <span className="font-semibold">{t.tier}</span>
                  <span>{t.winRate}% ({t.total} bets)</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${t.winRate}%`, background: t.winRate >= 55 ? '#00FFA8' : t.winRate >= 45 ? '#c9a84c' : '#f87171' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sport table */}
      <div className="glass p-5">
        <h3 className="font-bold text-white mb-4">Sport Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/25 border-b border-white/5">
                {['Sport', 'Bets', 'Wins', 'Win Rate', 'ROI', 'P&L'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sportStats.sort((a, b) => b.pl - a.pl).map(s => (
                <tr key={s.sport} className="border-b border-white/[0.04]">
                  <td className="py-2.5 pr-4"><SportBadge sport={s.sport} size="xs" /></td>
                  <td className="py-2.5 pr-4 text-white/60">{s.total}</td>
                  <td className="py-2.5 pr-4 text-white/60">{s.wins}</td>
                  <td className="py-2.5 pr-4" style={{ color: s.winRate >= 55 ? '#00FFA8' : s.winRate >= 45 ? '#c9a84c' : '#f87171' }}>{s.winRate}%</td>
                  <td className="py-2.5 pr-4" style={{ color: s.roi >= 0 ? '#00FFA8' : '#f87171' }}>{s.roi}%</td>
                  <td className="py-2.5" style={{ color: s.pl >= 0 ? '#00FFA8' : '#f87171' }}>{formatDollar(s.pl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
