import React, { useState } from 'react';
import { Loader2, ChevronRight } from 'lucide-react';
import BetCard from '../components/BetCard.jsx';
import SportBadge from '../components/SportBadge.jsx';
import { fetchGames, getMockGames } from '../lib/espnApi.js';
import { getLiveIntel, getQuantModel } from '../lib/llm.js';
import { calcRisk, buildCandidates, applyFilters, kellyF, toDec } from '../lib/bettingMath.js';
import { useBankroll } from '../lib/useBankroll.js';

const SPORTS = ['NBA', 'NFL', 'NHL', 'MLB', 'NCAAB', 'NCAAF', 'Soccer'];

function todayET() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).replace(/-/g, '');
}

async function analyzeGame(game, bankroll) {
  const { sport, home_team, away_team, spread_favored_team, spread_value,
    moneyline_home, moneyline_away, total_line } = game;
  const spreadVal = parseFloat(spread_value) || 0;
  const totalVal = parseFloat(total_line) || 0;

  const liveIntel = await getLiveIntel(away_team, home_team, sport);
  const d = await getQuantModel(away_team, home_team, sport,
    spread_favored_team, spreadVal, totalVal, moneyline_home, moneyline_away, liveIntel);

  const mu = d.mu_margin || 0;
  const risk = calcRisk(d, sport, spreadVal);
  const candidates = buildCandidates(d, spreadVal, totalVal, moneyline_home, moneyline_away, sport);
  const filtered = applyFilters(candidates, risk, mu, spreadVal, home_team, away_team, d.model_confidence);

  const best = filtered?.bet || null;
  const tier = filtered?.tier || null;
  const muT = d.mu_total || totalVal || 200;
  const halfT = muT / 2;

  return {
    game: `${away_team} @ ${home_team}`,
    home_team, away_team, sport,
    game_time: game.game_time,
    best, tier, risk, candidates,
    isBet: !!best,
    grade: d.grade,
    projectedHome: parseFloat((halfT + mu / 2).toFixed(1)),
    projectedAway: parseFloat((halfT - mu / 2).toFixed(1)),
    kellyStake: best ? (kellyF(best.prob, best.dec || toDec(best.odds)) * 0.25 * bankroll).toFixed(2) : '0.00',
    key_factors: d.key_factors || [],
    analysis_summary: d.analysis_summary || '',
    risk_factors: d.risk_factors || [],
    line_movement: d.line_movement || 'neutral',
    market_note: d.market_note || '',
    optimal_line_note: d.optimal_line_note || '',
    parlay_eligible: d.parlay_eligible || false,
    parlay_note: d.parlay_note || '',
    _modelData: d,
  };
}

export default function GameAnalysis() {
  const [bankroll] = useBankroll();
  const [sport, setSport] = useState('NBA');
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  async function loadGames() {
    setLoadingGames(true);
    setGames([]);
    setSelectedGame(null);
    setResult(null);
    try {
      let g = await fetchGames(sport, todayET());
      if (!g || g.length === 0) g = getMockGames(sport);
      setGames(g);
    } catch {
      const g = getMockGames(sport);
      setGames(g);
    }
    setLoadingGames(false);
  }

  async function runAnalysis(game) {
    setSelectedGame(game);
    setAnalyzing(true);
    setResult(null);
    try {
      const r = await analyzeGame(game, bankroll);
      setResult(r);
    } catch (err) {
      console.error('Analysis error:', err);
    }
    setAnalyzing(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Game Analysis</h2>
        <p className="text-sm text-white/40 mt-0.5">Deep dive into any game with full quantitative breakdown</p>
      </div>

      {/* Controls */}
      <div className="glass p-4 flex items-center gap-3 flex-wrap">
        <div className="flex flex-wrap gap-2 flex-1">
          {SPORTS.map(s => (
            <button key={s} onClick={() => { setSport(s); setGames([]); setResult(null); }}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all"
              style={{
                background: sport === s ? 'rgba(0,255,168,0.12)' : 'rgba(255,255,255,0.04)',
                color: sport === s ? '#00FFA8' : 'rgba(255,255,255,0.5)',
                borderColor: sport === s ? 'rgba(0,255,168,0.3)' : 'rgba(255,255,255,0.08)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={loadGames}
          disabled={loadingGames}
          className="px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2"
          style={{
            background: 'rgba(0,255,168,0.12)', color: '#00FFA8',
            borderColor: 'rgba(0,255,168,0.25)',
            opacity: loadingGames ? 0.5 : 1,
          }}
        >
          {loadingGames && <Loader2 size={14} className="animate-spin" />}
          Load Games
        </button>
      </div>

      {/* Game list */}
      {games.length > 0 && (
        <div className="glass p-4 space-y-2">
          <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
            {games.length} games — click to analyze
          </div>
          {games.map(g => (
            <button
              key={g.id}
              onClick={() => runAnalysis(g)}
              className="w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between group"
              style={{
                background: selectedGame?.id === g.id ? 'rgba(0,255,168,0.08)' : 'rgba(255,255,255,0.03)',
                borderColor: selectedGame?.id === g.id ? 'rgba(0,255,168,0.25)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <div>
                <div className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                  {g.away_team} @ {g.home_team}
                </div>
                <div className="text-xs text-white/35 mt-0.5">{g.game_time || 'TBD'} · Spread: {g.spread_favored_team} -{g.spread_value} · O/U: {g.total_line}</div>
              </div>
              <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Analysis result */}
      {analyzing && (
        <div className="glass p-8 flex flex-col items-center gap-3 text-center">
          <Loader2 size={28} className="animate-spin text-green-400" />
          <div className="text-white/60 text-sm">Running quantitative analysis…</div>
          <div className="text-xs text-white/30">Fetching live intel + running model</div>
        </div>
      )}

      {result && !analyzing && (
        <div className="fade-in">
          <BetCard result={result} bankroll={bankroll} />
        </div>
      )}
    </div>
  );
}
