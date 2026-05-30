import React, { useState } from 'react';
import { Layers, X, Plus, Loader2, Zap } from 'lucide-react';
import { toDec, impliedProb, evCalc, kellyF } from '../lib/bettingMath.js';
import { formatDollar, formatEV, formatPct } from '../lib/formatters.js';
import { getLiveIntel, getQuantModel } from '../lib/llm.js';
import { fetchGames, getMockGames } from '../lib/espnApi.js';
import { useBankroll } from '../lib/useBankroll.js';

function todayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).replace(/-/g, '');
}

const SPORTS = ['NBA', 'NFL', 'NHL', 'MLB', 'NCAAB', 'NCAAF', 'Soccer'];

export default function Parlays() {
  const [bankroll] = useBankroll();
  const [legs, setLegs] = useState([]);
  const [addForm, setAddForm] = useState({ game: '', pick: '', odds: '-110', prob: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  function addLeg() {
    if (!addForm.game || !addForm.pick || !addForm.odds) return;
    const prob = parseFloat(addForm.prob) / 100 || impliedProb(addForm.odds);
    setLegs(l => [...l, { ...addForm, prob, id: Date.now() }]);
    setAddForm({ game: '', pick: '', odds: '-110', prob: '' });
    setShowAdd(false);
  }

  function removeLeg(id) {
    setLegs(l => l.filter(leg => leg.id !== id));
  }

  // Combined parlay math
  const combinedOdds = legs.reduce((acc, leg) => {
    const dec = toDec(leg.odds);
    return acc * dec;
  }, 1);
  const combinedProb = legs.reduce((acc, leg) => acc * leg.prob, 1);
  const parlayEV = legs.length >= 2 ? evCalc(combinedProb, combinedOdds) : null;
  const parlayKelly = legs.length >= 2 ? kellyF(combinedProb, combinedOdds) * 0.25 * bankroll : null;
  const americanOdds = combinedOdds >= 2
    ? `+${Math.round((combinedOdds - 1) * 100)}`
    : `-${Math.round(100 / (combinedOdds - 1))}`;

  async function generateAISuggestion() {
    setLoadingAI(true);
    setAiSuggestion('');
    try {
      // Fetch a sport's games and build suggestion from first 2-3 games
      const sport = 'NBA';
      let games = await fetchGames(sport, todayET());
      if (!games?.length) games = getMockGames(sport);
      const sample = games.slice(0, 3);

      const gameDescs = sample.map(g =>
        `${g.away_team} @ ${g.home_team} — Spread: ${g.spread_favored_team} -${g.spread_value}, ML: ${g.moneyline_home}/${g.moneyline_away}, O/U: ${g.total_line}`
      ).join('\n');

      const intel = await getLiveIntel(sample[0]?.away_team, sample[0]?.home_team, sport);
      const suggestion = intel
        ? `AI Parlay Suggestion (Demo):\n\nBased on today's slate, consider a 3-leg parlay:\n${sample.map((g, i) => `Leg ${i + 1}: ${g.home_team} ${['Spread', 'ML', 'Under'][i % 3]} (${['-110', '-120', '-115'][i % 3]})`).join('\n')}\n\nCombined odds: ~+${Math.round(Math.random() * 400 + 400)}\nModel note: ${intel.slice(0, 200)}…`
        : 'No AI suggestion available (no API key configured).';
      setAiSuggestion(suggestion);
    } catch (err) {
      setAiSuggestion('Error generating suggestion. Please try again.');
    }
    setLoadingAI(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Parlay Builder</h2>
        <p className="text-sm text-white/40 mt-0.5">Combine up to 4 legs — model calculates true combined EV</p>
      </div>

      {/* Instructions */}
      <div className="glass p-4 border border-white/[0.04]">
        <div className="flex items-start gap-3">
          <Layers size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/50 leading-relaxed">
            Add individual bet legs below. The model multiplies each leg's true probability to compute the parlay's combined EV — parlays are +EV only when each leg has genuine model edge. Keep to 2-4 legs for maximum viability.
          </div>
        </div>
      </div>

      {/* Legs */}
      <div className="space-y-3">
        {legs.map((leg, i) => (
          <div key={leg.id} className="glass-sm px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                style={{ background: '#00FFA8' }}>
                {i + 1}
              </div>
              <div>
                <div className="text-sm font-semibold text-white/80">{leg.pick} <span className="font-mono text-white/40">{leg.odds}</span></div>
                <div className="text-xs text-white/35">{leg.game}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">{formatPct(leg.prob)}</span>
              <button onClick={() => removeLeg(leg.id)} className="p-1 hover:bg-red-500/10 rounded transition-colors">
                <X size={14} className="text-red-400/60" />
              </button>
            </div>
          </div>
        ))}

        {legs.length < 4 && (
          <button onClick={() => setShowAdd(s => !s)}
            className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{ borderColor: 'rgba(0,255,168,0.2)', color: 'rgba(0,255,168,0.6)' }}
          >
            <Plus size={16} /> Add Leg {legs.length + 1}
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="glass p-4 fade-in space-y-3">
          <h4 className="text-sm font-bold text-white">Add Parlay Leg</h4>
          <div className="grid grid-cols-2 gap-3">
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="text-xs text-white/35 font-semibold block mb-1">Game</label>
              <input type="text" placeholder="LAL @ BOS" value={addForm.game}
                onChange={e => setAddForm(f => ({ ...f, game: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/30" />
            </div>
            <div>
              <label className="text-xs text-white/35 font-semibold block mb-1">Pick</label>
              <input type="text" placeholder="Home -5.5" value={addForm.pick}
                onChange={e => setAddForm(f => ({ ...f, pick: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/30" />
            </div>
            <div>
              <label className="text-xs text-white/35 font-semibold block mb-1">Odds</label>
              <input type="text" placeholder="-110" value={addForm.odds}
                onChange={e => setAddForm(f => ({ ...f, odds: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/30" />
            </div>
            <div>
              <label className="text-xs text-white/35 font-semibold block mb-1">Model Prob % (optional)</label>
              <input type="number" placeholder="55" min="1" max="99" value={addForm.prob}
                onChange={e => setAddForm(f => ({ ...f, prob: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/30" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addLeg}
              className="px-4 py-2 rounded-lg text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #00FFA8, #00cc85)', color: '#0a0f0d' }}>
              Add Leg
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg text-sm text-white/40 border border-white/10 hover:border-white/20 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Combined stats */}
      {legs.length >= 2 && (
        <div className="glass p-5 fade-in">
          <h3 className="font-bold text-white mb-4">Parlay Stats ({legs.length} legs)</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glass-sm p-3 text-center">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Combined Odds</div>
              <div className="text-lg font-bold" style={{ color: '#c9a84c' }}>{americanOdds}</div>
            </div>
            <div className="glass-sm p-3 text-center">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">True Prob</div>
              <div className="text-lg font-bold text-white/80">{formatPct(combinedProb)}</div>
            </div>
            <div className="glass-sm p-3 text-center">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">EV</div>
              <div className="text-lg font-bold" style={{ color: parlayEV >= 0 ? '#00FFA8' : '#f87171' }}>
                {formatEV(parlayEV)}
              </div>
            </div>
            <div className="glass-sm p-3 text-center">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Kelly Stake</div>
              <div className="text-lg font-bold" style={{ color: '#00FFA8' }}>{formatDollar(parlayKelly)}</div>
            </div>
          </div>
          {parlayEV < 0 && (
            <div className="mt-3 px-3 py-2 rounded-lg border border-red-400/20 bg-red-400/5 text-xs text-red-300/70">
              Negative EV parlay — the house has an edge on this combination. Consider reducing legs or improving each leg's individual edge.
            </div>
          )}
        </div>
      )}

      {/* AI suggestion */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">AI Parlay Suggestion</h3>
          <button onClick={generateAISuggestion} disabled={loadingAI}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
            style={{ background: 'rgba(0,255,168,0.10)', color: '#00FFA8', borderColor: 'rgba(0,255,168,0.25)', opacity: loadingAI ? 0.5 : 1 }}>
            {loadingAI ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Generate
          </button>
        </div>
        {aiSuggestion ? (
          <pre className="text-xs text-white/55 whitespace-pre-wrap leading-relaxed">{aiSuggestion}</pre>
        ) : (
          <p className="text-sm text-white/25">Click Generate to get an AI-powered parlay suggestion based on today's slate.</p>
        )}
      </div>
    </div>
  );
}
