import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import SportBadge from './SportBadge.jsx';
import { TierBadge, GradeBadge } from './ClassificationBadge.jsx';
import { formatBetLabel, formatOdds, formatPct, formatEV, formatDollar } from '../lib/formatters.js';
import { getRiskVerdict, kellyF, toDec } from '../lib/bettingMath.js';
import { BetLog } from '../lib/db.js';

function ConfBadge({ conf }) {
  const colors = { high: '#00FFA8', medium: '#c9a84c', low: '#f87171' };
  return (
    <span style={{ color: colors[conf] || '#888', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
      {conf || 'N/A'} confidence
    </span>
  );
}

function SignalBar({ label, value }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-white/40">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#00FFA8' }} />
      </div>
    </div>
  );
}

export default function BetCard({ result, bankroll = 1000, highlight = false }) {
  const [expanded, setExpanded] = useState(false);
  const [logged, setLogged] = useState(false);

  if (!result) return null;

  const {
    game, home_team, away_team, sport, game_time, best, tier, risk,
    candidates, isBet, grade, projectedHome, projectedAway, kellyStake,
    key_factors, analysis_summary, risk_factors, line_movement,
    market_note, optimal_line_note, parlay_eligible, parlay_note,
    _modelData,
  } = result;

  const riskVerdict = getRiskVerdict(risk || 30);
  const kellyDollars = best
    ? (kellyF(best.prob, best.dec || toDec(best.odds)) * 0.25 * bankroll).toFixed(2)
    : '0.00';

  const modelConfidence = _modelData?.model_confidence || 'medium';
  const signals = {
    BAY: Math.round((best?.prob || 0.5) * 100),
    MC: Math.round(60 + ((best?.ev || 0) * 2)),
    SIT: Math.round(70 - (risk || 30) * 0.4),
    MKT: line_movement === 'confirming' ? 78 : line_movement === 'against' ? 32 : 55,
  };

  function handleLogBet() {
    if (!best || logged) return;
    BetLog.create({
      game,
      sport,
      game_date: new Date().toLocaleDateString('en-CA'),
      market: best.market,
      pick: best.label,
      odds: best.odds,
      stake: parseFloat(kellyDollars),
      outcome: 'Pending',
      notes: `${tier} — EV ${formatEV(best.ev)}`,
    });
    setLogged(true);
  }

  const cardBorder = highlight
    ? '1px solid rgba(201,168,76,0.35)'
    : isBet
    ? '1px solid rgba(0,255,168,0.15)'
    : '1px solid rgba(255,255,255,0.06)';

  return (
    <div className="glass fade-in" style={{ border: cardBorder }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3 border-b border-white/5 flex-wrap gap-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <SportBadge sport={sport} />
          {best && <span className="text-xs text-white/40 font-medium uppercase tracking-wide">{best.market?.toUpperCase()}</span>}
          <GradeBadge grade={grade} />
          {tier && <TierBadge tier={tier} />}
        </div>
        {highlight && (
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c9a84c', letterSpacing: '0.06em' }}>GLOBAL TOP PICK</span>
        )}
      </div>

      {/* Teams */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-base font-bold text-white/90">{away_team}</div>
            <div className="text-xs text-white/40 my-0.5">@</div>
            <div className="text-base font-bold text-white/90">{home_team}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-white/40">{game_time || 'TBD'}</div>
            <div className="mt-1"><ConfBadge conf={modelConfidence} /></div>
          </div>
        </div>
      </div>

      {/* Pick box */}
      <div className="px-4 pb-3">
        {isBet && best ? (
          <div className="rounded-lg px-4 py-3 border" style={{
            background: 'rgba(0,255,168,0.06)',
            borderColor: 'rgba(0,255,168,0.25)',
          }}>
            <div className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-1">Model Pick</div>
            <div className="font-bold text-lg" style={{ color: '#00FFA8' }}>
              {formatBetLabel(best)}
            </div>
          </div>
        ) : (
          <div className="rounded-lg px-4 py-3 border" style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.07)',
          }}>
            <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-1">No Qualifying Bet</div>
            <div className="text-white/50 text-sm">No edge detected above threshold — track only.</div>
          </div>
        )}
      </div>

      {/* Stats row */}
      {best && (
        <div className="grid grid-cols-4 gap-0 px-4 pb-3">
          {[
            { label: 'MODEL PROB', value: formatPct(best.prob), color: '#00FFA8' },
            { label: 'MARKET PROB', value: formatPct(best.mktP), color: 'rgba(255,255,255,0.7)' },
            { label: 'EDGE', value: formatEV(best.edge), color: best.edge > 0 ? '#00FFA8' : '#f87171' },
            { label: 'EV', value: formatEV(best.ev), color: best.ev >= 3 ? '#c9a84c' : best.ev >= 0 ? '#00FFA8' : '#f87171' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center py-2 border-r border-white/5 last:border-r-0">
              <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-0.5" style={{ fontSize: '0.6rem' }}>{label}</div>
              <div className="font-bold text-sm" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Risk row */}
      <div className="px-4 pb-3">
        <div className="glass-sm px-3 py-2.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-2xl font-black" style={{ color: riskVerdict.color }}>{risk || 0}</span>
              <span className="text-white/30 text-sm">/100</span>
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: riskVerdict.color }}>{riskVerdict.label} RISK</div>
              <div className="text-xs text-white/40">{riskVerdict.recommendation}</div>
            </div>
          </div>
          {isBet && (
            <div className="text-right">
              <div className="text-xs text-white/30">Kelly Stake (¼)</div>
              <div className="font-bold" style={{ color: '#00FFA8' }}>{formatDollar(parseFloat(kellyDollars))}</div>
            </div>
          )}
        </div>
      </div>

      {/* Line movement */}
      {line_movement && (
        <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-white/30">Line:</span>
          <span className="text-xs font-semibold" style={{
            color: line_movement === 'confirming' ? '#00FFA8' : line_movement === 'against' ? '#f87171' : '#c9a84c',
          }}>
            {line_movement === 'confirming' ? '▲ Sharp confirming' : line_movement === 'against' ? '▼ Sharp against' : '→ Neutral'}
          </span>
          {market_note && <span className="text-xs text-white/30">— {market_note}</span>}
        </div>
      )}

      {/* Analysis summary */}
      {analysis_summary && (
        <div className="px-4 pb-3">
          <p className="text-xs text-white/50 leading-relaxed">{analysis_summary}</p>
        </div>
      )}

      {/* Signal bars */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {Object.entries(signals).map(([k, v]) => (
          <SignalBar key={k} label={k} value={Math.min(100, Math.max(0, v))} />
        ))}
      </div>

      {/* Expand toggle */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all border border-white/5"
        >
          {expanded ? <><ChevronUp size={13} /> Less detail</> : <><ChevronDown size={13} /> More detail</>}
        </button>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3">
              {/* Projected score */}
              <div>
                <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-1">Projected Score</div>
                <div className="text-white/70 text-sm font-mono">
                  {away_team}: <strong>{projectedAway ?? '—'}</strong> | {home_team}: <strong>{projectedHome ?? '—'}</strong>
                </div>
              </div>

              {/* Key factors */}
              {key_factors?.length > 0 && (
                <div>
                  <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-1.5">Key Factors</div>
                  <ul className="space-y-1">
                    {key_factors.map((f, i) => (
                      <li key={i} className="text-xs text-white/55 flex gap-2">
                        <span style={{ color: '#00FFA8' }}>▸</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk factors */}
              {risk_factors?.length > 0 && (
                <div>
                  <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-1.5">Risk Factors</div>
                  <ul className="space-y-1">
                    {risk_factors.map((f, i) => (
                      <li key={i} className="text-xs text-white/55 flex gap-2">
                        <span style={{ color: '#f87171' }}>⚠</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {optimal_line_note && (
                <div>
                  <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-1">Optimal Line</div>
                  <p className="text-xs text-white/50">{optimal_line_note}</p>
                </div>
              )}
              {parlay_eligible && parlay_note && (
                <div>
                  <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-1">Parlay Note</div>
                  <p className="text-xs text-white/50">{parlay_note}</p>
                </div>
              )}

              {/* All candidates table */}
              {candidates?.length > 0 && (
                <div>
                  <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-2">All Markets</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ borderCollapse: 'separate', borderSpacing: '0 2px' }}>
                      <thead>
                        <tr className="text-white/25">
                          <th className="text-left pb-1 font-semibold">Market</th>
                          <th className="text-right pb-1 font-semibold">Prob</th>
                          <th className="text-right pb-1 font-semibold">Edge</th>
                          <th className="text-right pb-1 font-semibold">EV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.slice(0, 6).map((c, i) => (
                          <tr key={i} className={c === best ? 'font-bold' : ''}>
                            <td className="py-0.5 text-white/60" style={{ color: c === best ? '#00FFA8' : undefined }}>
                              {c.label} {formatOdds(c.odds)}
                            </td>
                            <td className="text-right text-white/50">{formatPct(c.prob)}</td>
                            <td className="text-right" style={{ color: c.edge > 0 ? '#00FFA8' : '#f87171' }}>{formatEV(c.edge)}</td>
                            <td className="text-right" style={{ color: c.ev >= 1 ? '#00FFA8' : c.ev >= 0 ? '#c9a84c' : '#f87171' }}>{formatEV(c.ev)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Log bet button */}
              {isBet && (
                <button
                  onClick={handleLogBet}
                  disabled={logged}
                  className="w-full py-2.5 rounded-lg text-sm font-bold transition-all border"
                  style={{
                    background: logged ? 'rgba(0,255,168,0.06)' : 'rgba(0,255,168,0.12)',
                    color: logged ? 'rgba(0,255,168,0.5)' : '#00FFA8',
                    borderColor: logged ? 'rgba(0,255,168,0.15)' : 'rgba(0,255,168,0.3)',
                    cursor: logged ? 'default' : 'pointer',
                  }}
                >
                  {logged ? '✓ Logged to History' : `Log Bet — ${formatBetLabel(best)}`}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
