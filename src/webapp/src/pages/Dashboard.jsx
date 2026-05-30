import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, Target, Clock, ArrowRight, Zap } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import SportBadge from '../components/SportBadge.jsx';
import { BetLog } from '../lib/db.js';
import { toDec } from '../lib/bettingMath.js';
import { formatDollar, formatDate } from '../lib/formatters.js';
import { useBankroll } from '../lib/useBankroll.js';

const TIPS = [
  'Bet with your head, not over it. Flat stakes protect bankroll long term.',
  'Track every bet. Data beats memory.',
  'Sharp money moves lines. Watch for early moves before the public arrives.',
  'The edge is small. Volume and discipline compound it.',
  'Fade public sentiment on primetime games — the market overweights popularity.',
  'No parlay should exceed 3 legs unless EV on each leg exceeds +5%.',
  'Home underdogs in divisional games historically outperform their price.',
];

function calcPL(stake, odds, outcome) {
  if (!stake || outcome === 'Pending') return null;
  if (outcome === 'Push') return 0;
  if (outcome === 'Loss') return -Math.abs(stake);
  return parseFloat((stake * (toDec(odds) - 1)).toFixed(2));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [bankroll] = useBankroll();
  const bets = BetLog.filter({}, '-created_date', 50);
  const recent = bets.slice(0, 5);

  const resolved = bets.filter(b => b.outcome !== 'Pending');
  const wins = resolved.filter(b => b.outcome === 'Win').length;
  const winRate = resolved.length > 0 ? (wins / resolved.length * 100).toFixed(0) : 0;
  const totalPL = bets.reduce((sum, b) => {
    const pl = calcPL(b.stake, b.odds, b.outcome);
    return pl != null ? sum + pl : sum;
  }, 0);
  const roi = bets.filter(b => b.stake).reduce((s, b) => s + Math.abs(b.stake || 0), 0);
  const roiPct = roi > 0 ? (totalPL / roi * 100).toFixed(1) : '0.0';
  const pending = bets.filter(b => b.outcome === 'Pending').length;
  const dayIdx = new Date().getDay();
  const tip = TIPS[dayIdx % TIPS.length];

  const OUTCOME_COLOR = { Win: '#00FFA8', Loss: '#f87171', Push: '#94a3b8', Pending: '#fbbf24' };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="glass p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-white">Welcome to EDGE AI</h2>
            <p className="text-sm text-white/40 mt-1">Sharp betting analytics powered by quantitative models and AI.</p>
          </div>
          <button
            onClick={() => navigate('/picks')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, #00FFA8, #00cc85)', color: '#0a0f0d' }}
          >
            <Zap size={15} />
            Run Today's Analysis
            <ArrowRight size={15} />
          </button>
        </div>
        {/* Tip of the day */}
        <div className="mt-4 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
          <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Tip of the Day</div>
          <p className="text-sm text-white/60 italic">{tip}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Win Rate" value={`${winRate}%`} sub={`${wins}/${resolved.length} resolved`} color="#00FFA8" icon={Target} />
        <StatCard label="Total P&L" value={formatDollar(totalPL)} sub={`ROI: ${roiPct}%`} color={totalPL >= 0 ? '#00FFA8' : '#f87171'} icon={DollarSign} />
        <StatCard label="Pending Bets" value={pending} sub="awaiting result" color="#fbbf24" icon={Clock} />
        <StatCard label="Bankroll" value={`$${bankroll.toLocaleString()}`} sub="current" color="rgba(255,255,255,0.8)" icon={TrendingUp} />
      </div>

      {/* Recent bets */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Recent Bets</h3>
          <button onClick={() => navigate('/history')} className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1">
            View all <ArrowRight size={12} />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-8 text-white/25 text-sm">
            No bets logged yet. Run analysis and log your first bet!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-white/30 border-b border-white/5">
                  {['Date', 'Game', 'Sport', 'Pick', 'Odds', 'Stake', 'Result'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 font-semibold last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(b => {
                  const pl = calcPL(b.stake, b.odds, b.outcome);
                  return (
                    <tr key={b.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-4 text-white/40">{formatDate(b.game_date || b.created_date)}</td>
                      <td className="py-2.5 pr-4 text-white/70 max-w-[140px] truncate">{b.game}</td>
                      <td className="py-2.5 pr-4"><SportBadge sport={b.sport} size="xs" /></td>
                      <td className="py-2.5 pr-4 text-white/70">{b.pick}</td>
                      <td className="py-2.5 pr-4 font-mono text-white/50">{b.odds}</td>
                      <td className="py-2.5 pr-4 text-white/50">{b.stake ? `$${b.stake}` : '—'}</td>
                      <td className="py-2.5">
                        <span style={{ color: OUTCOME_COLOR[b.outcome] || '#888' }} className="font-semibold">
                          {b.outcome}
                          {pl != null && pl !== 0 && (
                            <span className="ml-1.5 font-normal opacity-70">({pl > 0 ? '+' : ''}{formatDollar(pl)})</span>
                          )}
                        </span>
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
