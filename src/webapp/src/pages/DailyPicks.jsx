import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import BetCard from '../components/BetCard.jsx';
import SportBadge from '../components/SportBadge.jsx';
import { fetchGames, getMockGames } from '../lib/espnApi.js';
import { getLiveIntel, getQuantModel } from '../lib/llm.js';
import {
  calcRisk, buildCandidates, applyFilters, kellyF, toDec,
} from '../lib/bettingMath.js';
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
  const d = await getQuantModel(
    away_team, home_team, sport,
    spread_favored_team, spreadVal, totalVal,
    moneyline_home, moneyline_away, liveIntel
  );

  const mu = d.mu_margin || 0;
  const risk = calcRisk(d, sport, spreadVal);
  const candidates = buildCandidates(d, spreadVal, totalVal, moneyline_home, moneyline_away, sport);
  const filtered = applyFilters(candidates, risk, mu, spreadVal, home_team, away_team, d.model_confidence);

  const best = filtered?.bet || null;
  const tier = filtered?.tier || null;

  const muT = d.mu_total || totalVal || 200;
  const halfT = muT / 2;
  const projectedHome = parseFloat((halfT + mu / 2).toFixed(1));
  const projectedAway = parseFloat((halfT - mu / 2).toFixed(1));

  const kellyStake = best
    ? (kellyF(best.prob, best.dec || toDec(best.odds)) * 0.25 * bankroll).toFixed(2)
    : '0.00';

  return {
    game: `${away_team} @ ${home_team}`,
    home_team, away_team, sport,
    game_time: game.game_time,
    best, tier, risk, candidates,
    isBet: !!best,
    grade: d.grade,
    projectedHome, projectedAway,
    kellyStake,
    key_factors: d.key_factors || [],
    analysis_summary: d.analysis_summary || '',
    risk_factors: d.risk_factors || [],
    line_movement: d.line_movement || 'neutral',
    market_note: d.market_note || '',
    optimal_line_note: d.optimal_line_note || '',
    parlay_eligible: d.parlay_eligible || false,
    parlay_note: d.parlay_note || '',
    _modelData: d,
    _spreadVal: spreadVal,
  };
}

const TIER_ORDER = { 'ELITE': 0, 'STRONG BET': 1, 'VALUE BET': 2, 'LEAN / TRACK': 3 };
function byTierThenEV(a, b) {
  const ta = TIER_ORDER[a.tier] ?? 99, tb = TIER_ORDER[b.tier] ?? 99;
  if (ta !== tb) return ta - tb;
  return (b.best?.ev || 0) - (a.best?.ev || 0);
}

function Spinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin text-green-400" />;
}

function SportSection({ sport, status, picks, error }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <SportBadge sport={sport} />
        {status === 'fetching' && <div className="flex items-center gap-1.5 text-xs text-white/40"><Spinner size={13} /> Fetching games…</div>}
        {status === 'analyzing' && <div className="flex items-center gap-1.5 text-xs text-white/40"><Spinner size={13} /> Analyzing…</div>}
        {status === 'done' && <span className="text-xs text-white/30">{picks.length} qualifying bet{picks.length !== 1 ? 's' : ''}</span>}
        {status === 'error' && <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={12} />{error}</span>}
      </div>
      {status === 'done' && picks.length === 0 && (
        <div className="text-xs text-white/25 px-1">No qualifying bets for {sport} today.</div>
      )}
    </div>
  );
}

export default function DailyPicks() {
  const [bankroll] = useBankroll();
  const [mode, setMode] = useState('best3');
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [sportStatuses, setSportStatuses] = useState({});
  const [sportErrors, setSportErrors] = useState({});
  const [top3BySport, setTop3BySport] = useState({});
  const [allBySport, setAllBySport] = useState({});
  const [globalTop3, setGlobalTop3] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [singleResults, setSingleResults] = useState([]);
  const [singleLoading, setSingleLoading] = useState(false);
  const runRef = useRef(false);

  const setStatus = (sport, s) => setSportStatuses(p => ({ ...p, [sport]: s }));
  const setError = (sport, e) => setSportErrors(p => ({ ...p, [sport]: e }));

  const runAllSports = useCallback(async () => {
    if (runRef.current) return;
    runRef.current = true;
    setIsRunning(true);
    setSportStatuses({});
    setTop3BySport({});
    setAllBySport({});
    setGlobalTop3([]);
    const today = todayET();
    const allBets = [];

    for (const sport of SPORTS) {
      setStatus(sport, 'fetching');
      try {
        let games = await fetchGames(sport, today);
        if (!games || games.length === 0) games = getMockGames(sport);

        setStatus(sport, 'analyzing');
        const results = [];
        for (let i = 0; i < games.length; i += 2) {
          const batch = games.slice(i, i + 2);
          try {
            const batchResults = await Promise.all(batch.map(g => analyzeGame(g, bankroll)));
            results.push(...batchResults);
          } catch (err) {
            console.warn(`Batch failed for ${sport}:`, err);
          }
          if (i + 2 < games.length) await new Promise(r => setTimeout(r, 300));
        }

        const bets = results.filter(r => r.isBet).sort(byTierThenEV);
        const all = results.sort(byTierThenEV);
        setTop3BySport(p => ({ ...p, [sport]: bets.slice(0, 3) }));
        setAllBySport(p => ({ ...p, [sport]: all }));
        allBets.push(...bets);
        setStatus(sport, 'done');
      } catch (err) {
        console.error(`Error for ${sport}:`, err);
        setStatus(sport, 'error');
        setError(sport, err.message || 'Failed');
      }
    }

    const sorted = allBets.sort(byTierThenEV);
    setGlobalTop3(sorted.slice(0, 3));
    setIsRunning(false);
    runRef.current = false;
  }, [bankroll]);

  useEffect(() => {
    if (mode === 'best3' && Object.keys(sportStatuses).length === 0) {
      runAllSports();
    }
  }, [mode]);

  async function runSingle(sport) {
    setSingleLoading(true);
    setSingleResults([]);
    const today = todayET();
    try {
      let games = await fetchGames(sport, today);
      if (!games || games.length === 0) games = getMockGames(sport);
      const results = [];
      for (let i = 0; i < games.length; i += 2) {
        const batch = games.slice(i, i + 2);
        const batchResults = await Promise.all(batch.map(g => analyzeGame(g, bankroll)));
        results.push(...batchResults);
        if (i + 2 < games.length) await new Promise(r => setTimeout(r, 300));
      }
      setSingleResults(results.sort(byTierThenEV));
    } catch (err) {
      console.error('Single sport error:', err);
    }
    setSingleLoading(false);
  }

  const anyRunning = isRunning || Object.values(sportStatuses).some(s => s === 'fetching' || s === 'analyzing');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title + controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white">Daily Picks</h2>
          <p className="text-sm text-white/40 mt-0.5">AI-powered best bets for today</p>
        </div>
        {mode === 'best3' && (
          <button
            onClick={runAllSports}
            disabled={anyRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all border"
            style={{
              background: anyRunning ? 'rgba(0,255,168,0.05)' : 'rgba(0,255,168,0.12)',
              color: anyRunning ? 'rgba(0,255,168,0.4)' : '#00FFA8',
              borderColor: 'rgba(0,255,168,0.25)',
              cursor: anyRunning ? 'not-allowed' : 'pointer',
            }}
          >
            {anyRunning ? <Spinner /> : <RefreshCw size={15} />}
            {anyRunning ? 'Analyzing…' : 'Refresh All'}
          </button>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/5 w-fit">
        {[['best3', 'Best 3 Per Sport'], ['single', 'Single Sport']].map(([val, label]) => (
          <button key={val} onClick={() => setMode(val)}
            className="px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
            style={{
              background: mode === val ? 'rgba(0,255,168,0.15)' : 'transparent',
              color: mode === val ? '#00FFA8' : 'rgba(255,255,255,0.4)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Best 3 mode */}
      {mode === 'best3' && (
        <div className="space-y-8">
          {/* Global top 3 */}
          {globalTop3.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full" style={{ background: '#c9a84c' }} />
                <h3 className="font-bold text-white">Global Top Picks</h3>
                <span className="text-xs text-white/30">Best bets across all sports</span>
              </div>
              <div className="space-y-4">
                {globalTop3.map((r, i) => (
                  <BetCard key={r.game + i} result={r} bankroll={bankroll} highlight={i === 0} />
                ))}
              </div>
            </div>
          )}

          {/* Per sport */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full" style={{ background: '#00FFA8' }} />
              <h3 className="font-bold text-white">By Sport</h3>
            </div>
            <div className="space-y-8">
              {SPORTS.map(sport => {
                const status = sportStatuses[sport] || 'idle';
                const picks = top3BySport[sport] || [];
                const error = sportErrors[sport];
                return (
                  <div key={sport}>
                    <SportSection sport={sport} status={status} picks={picks} error={error} />
                    {status === 'done' && picks.length > 0 && (
                      <div className="space-y-4 mt-3">
                        {picks.map((r, i) => (
                          <BetCard key={r.game + i} result={r} bankroll={bankroll} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Single sport mode */}
      {mode === 'single' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {SPORTS.map(s => (
              <button key={s} onClick={() => setSelectedSport(s)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all"
                style={{
                  background: selectedSport === s ? 'rgba(0,255,168,0.12)' : 'rgba(255,255,255,0.04)',
                  color: selectedSport === s ? '#00FFA8' : 'rgba(255,255,255,0.5)',
                  borderColor: selectedSport === s ? 'rgba(0,255,168,0.3)' : 'rgba(255,255,255,0.08)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => runSingle(selectedSport)}
            disabled={singleLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold border transition-all"
            style={{
              background: 'rgba(0,255,168,0.12)', color: '#00FFA8',
              borderColor: 'rgba(0,255,168,0.25)',
              opacity: singleLoading ? 0.5 : 1,
              cursor: singleLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {singleLoading ? <Spinner /> : <RefreshCw size={15} />}
            {singleLoading ? `Analyzing ${selectedSport}…` : `Analyze ${selectedSport}`}
          </button>
          {singleResults.length > 0 && (
            <div className="space-y-4 mt-2">
              {singleResults.map((r, i) => (
                <BetCard key={r.game + i} result={r} bankroll={bankroll} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
