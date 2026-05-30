import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import SportBadge from '../components/SportBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import { BetLog } from '../lib/db.js';
import { toDec } from '../lib/bettingMath.js';
import { checkBetResult } from '../lib/llm.js';
import { formatDollar, formatDate } from '../lib/formatters.js';

const SPORTS = ['NBA', 'NFL', 'NHL', 'MLB', 'NCAAB', 'NCAAF', 'Soccer'];
const MARKETS = ['spread', 'ml', 'total', 'parlay', 'prop', 'other'];
const OUTCOMES = ['Pending', 'Win', 'Loss', 'Push'];
const OUTCOME_COLOR = { Win: '#00FFA8', Loss: '#f87171', Push: '#94a3b8', Pending: '#fbbf24' };

function calcPL(stake, odds, outcome) {
  if (!stake || outcome === 'Pending') return null;
  if (outcome === 'Push') return 0;
  if (outcome === 'Loss') return -Math.abs(parseFloat(stake));
  return parseFloat((parseFloat(stake) * (toDec(odds) - 1)).toFixed(2));
}

const EMPTY_FORM = {
  sport: 'NBA', game: '', game_date: new Date().toLocaleDateString('en-CA'),
  market: 'spread', pick: '', odds: '-110', stake: '', outcome: 'Pending', notes: '',
};

export default function History() {
  const [bets, setBets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [checkingAll, setCheckingAll] = useState(false);

  const reload = () => setBets(BetLog.filter({}, '-created_date', 500));
  useEffect(() => { reload(); }, []);

  function handleAdd(e) {
    e.preventDefault();
    BetLog.create({ ...form, stake: parseFloat(form.stake) || 0 });
    setForm(EMPTY_FORM);
    setShowForm(false);
    reload();
  }

  function handleDelete(id) {
    if (!confirm('Delete this bet?')) return;
    BetLog.delete(id);
    reload();
  }

  async function checkAllPending() {
    setCheckingAll(true);
    const pending = bets.filter(b => b.outcome === 'Pending');
    for (const b of pending) {
      try {
        const { status, final_score } = await checkBetResult(b);
        BetLog.update(b.id, { outcome: status, final_score });
      } catch {}
    }
    reload();
    setCheckingAll(false);
  }

  // Stats
  const resolved = bets.filter(b => b.outcome !== 'Pending');
  const wins = resolved.filter(b => b.outcome === 'Win').length;
  const losses = resolved.filter(b => b.outcome === 'Loss').length;
  const winRate = resolved.length > 0 ? (wins / resolved.length * 100).toFixed(1) : '0.0';
  const totalPL = bets.reduce((s, b) => { const pl = calcPL(b.stake, b.odds, b.outcome); return pl != null ? s + pl : s; }, 0);
  const totalStaked = bets.filter(b => b.stake && b.outcome !== 'Pending').reduce((s, b) => s + Math.abs(b.stake || 0), 0);
  const roi = totalStaked > 0 ? (totalPL / totalStaked * 100).toFixed(1) : '0.0';

  // Chart: P&L by sport
  const sportPL = {};
  bets.forEach(b => {
    const pl = calcPL(b.stake, b.odds, b.outcome);
    if (pl != null) sportPL[b.sport] = (sportPL[b.sport] || 0) + pl;
  });
  const chartData = Object.entries(sportPL).map(([sport, pl]) => ({ sport, pl: parseFloat(pl.toFixed(2)) }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Bet History</h2>
          <p className="text-sm text-white/40 mt-0.5">{bets.length} bets recorded</p>
        </div>
        <div className="flex items-center gap-2">
          {bets.some(b => b.outcome === 'Pending') && (
            <button onClick={checkAllPending} disabled={checkingAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all"
              style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.2)' }}
            >
              {checkingAll ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Check Pending
            </button>
          )}
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
            style={{ background: 'rgba(0,255,168,0.12)', color: '#00FFA8', borderColor: 'rgba(0,255,168,0.25)' }}
          >
            <Plus size={15} /> Add Bet
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Bets" value={bets.length} sub={`${wins}W / ${losses}L`} />
        <StatCard label="Win Rate" value={`${winRate}%`} color="#00FFA8" />
        <StatCard label="Total P&L" value={formatDollar(totalPL)} color={totalPL >= 0 ? '#00FFA8' : '#f87171'} />
        <StatCard label="ROI" value={`${roi}%`} color={parseFloat(roi) >= 0 ? '#00FFA8' : '#f87171'} sub={`on $${totalStaked.toFixed(0)} staked`} />
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glass p-5 fade-in">
          <h3 className="font-bold text-white mb-4">Log a Bet</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Game', key: 'game', type: 'text', placeholder: 'LAL @ BOS', col: '1 / -1' },
            ].map(({ label, key, type, placeholder, col }) => (
              <div key={key} style={{ gridColumn: col }}>
                <label className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1 block">{label}</label>
                <input type={type} placeholder={placeholder} value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/40"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1 block">Sport</label>
              <select value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/40">
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1 block">Market</label>
              <select value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/40">
                {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1 block">Date</label>
              <input type="date" value={form.game_date} onChange={e => setForm(f => ({ ...f, game_date: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/40" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1 block">Pick</label>
              <input type="text" placeholder="Home -3.5" value={form.pick}
                onChange={e => setForm(f => ({ ...f, pick: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/40" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1 block">Odds</label>
              <input type="text" placeholder="-110" value={form.odds}
                onChange={e => setForm(f => ({ ...f, odds: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/40" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1 block">Stake ($)</label>
              <input type="number" placeholder="25.00" min="0" step="0.01" value={form.stake}
                onChange={e => setForm(f => ({ ...f, stake: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/40" />
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1 block">Outcome</label>
              <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/40">
                {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1 block">Notes</label>
              <input type="text" placeholder="Optional notes…" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/40" />
            </div>
            <div style={{ gridColumn: '1 / -1' }} className="flex gap-2">
              <button type="submit" className="px-5 py-2 rounded-lg text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #00FFA8, #00cc85)', color: '#0a0f0d' }}>
                Log Bet
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-white/50 border border-white/10 hover:border-white/20 transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* P&L chart */}
      {chartData.length > 0 && (
        <div className="glass p-5">
          <h3 className="font-bold text-white mb-4">P&L by Sport</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="sport" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1610', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.pl >= 0 ? '#00FFA8' : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bets table */}
      <div className="glass p-5">
        <h3 className="font-bold text-white mb-4">All Bets</h3>
        {bets.length === 0 ? (
          <div className="text-center py-10 text-white/25 text-sm">No bets logged yet. Use the "Add Bet" button to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: '0 2px' }}>
              <thead>
                <tr className="text-white/25 border-b border-white/5">
                  {['Date', 'Game', 'Sport', 'Market', 'Pick', 'Odds', 'Stake', 'Outcome', 'P&L', ''].map(h => (
                    <th key={h} className="text-left py-2 pr-3 font-semibold whitespace-nowrap last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bets.map(b => {
                  const pl = calcPL(b.stake, b.odds, b.outcome);
                  return (
                    <tr key={b.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] group">
                      <td className="py-2.5 pr-3 text-white/40 whitespace-nowrap">{formatDate(b.game_date || b.created_date)}</td>
                      <td className="py-2.5 pr-3 text-white/65 max-w-[120px] truncate">{b.game}</td>
                      <td className="py-2.5 pr-3"><SportBadge sport={b.sport} size="xs" /></td>
                      <td className="py-2.5 pr-3 text-white/40 capitalize">{b.market}</td>
                      <td className="py-2.5 pr-3 text-white/65 max-w-[100px] truncate">{b.pick}</td>
                      <td className="py-2.5 pr-3 font-mono text-white/50">{b.odds}</td>
                      <td className="py-2.5 pr-3 text-white/50">{b.stake ? `$${parseFloat(b.stake).toFixed(2)}` : '—'}</td>
                      <td className="py-2.5 pr-3">
                        <span className="font-semibold" style={{ color: OUTCOME_COLOR[b.outcome] || '#888' }}>{b.outcome}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        {pl != null ? (
                          <span style={{ color: pl > 0 ? '#00FFA8' : pl < 0 ? '#f87171' : '#94a3b8' }}>
                            {pl > 0 ? '+' : ''}{formatDollar(pl)}
                          </span>
                        ) : <span className="text-white/20">—</span>}
                      </td>
                      <td className="py-2.5">
                        <button onClick={() => handleDelete(b.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10">
                          <Trash2 size={12} className="text-red-400/60" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
