const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const MODEL = 'claude-haiku-4-5';

async function callClaude(prompt, system = '', maxTokens = 1024) {
  if (!API_KEY) return null; // Demo mode
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-client-side-api-key-flag': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await resp.json();
  return data.content?.[0]?.text || '';
}

export async function getLiveIntel(awayTeam, homeTeam, sport) {
  if (!API_KEY) return getMockIntel(awayTeam, homeTeam, sport);
  const prompt = `Sharp betting analyst. Game: ${awayTeam} @ ${homeTeam} (${sport}).
Based on your knowledge, provide: known injury concerns, recent ATS record (last 5),
home/away performance trends, any notable situational factors (back-to-back, rivalry, etc).
Keep it under 400 words. Be specific and factual.`;
  try {
    return await callClaude(prompt, 'You are a sharp sports betting analyst with deep knowledge of all major sports.');
  } catch {
    return getMockIntel(awayTeam, homeTeam, sport);
  }
}

export async function getQuantModel(awayTeam, homeTeam, sport, spreadFavored, spreadVal, totalVal, mlHome, mlAway, liveIntel) {
  if (!API_KEY) return getMockQuantModel(awayTeam, homeTeam, sport, spreadVal, totalVal, mlHome, mlAway);
  const prompt = buildModelPrompt(awayTeam, homeTeam, sport, spreadFavored, spreadVal, totalVal, mlHome, mlAway, liveIntel);
  try {
    const raw = await callClaude(prompt, 'You are a quantitative sports betting model. Return ONLY valid JSON.', 2048);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return getMockQuantModel(awayTeam, homeTeam, sport, spreadVal, totalVal, mlHome, mlAway);
  }
}

export async function checkBetResult(bet) {
  if (!API_KEY) return { status: 'Pending', final_score: '' };
  const prompt = `Grade this bet. Today: ${new Date().toLocaleDateString('en-CA')}.
GAME: ${bet.game}, DATE: ${bet.game_date}, SPORT: ${bet.sport}, MARKET: ${bet.market}, PICK: ${bet.pick}, ODDS: ${bet.odds}
Based on your knowledge of recent sports results, determine: Win, Loss, Push, or Pending (if game hasn't happened yet).
Return JSON: {"status": "Win"|"Loss"|"Push"|"Pending", "final_score": "string or null"}`;
  try {
    const raw = await callClaude(prompt, 'You are a sports results checker.', 256);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const json = JSON.parse(cleaned);
    return { status: json.status || 'Pending', final_score: json.final_score || '' };
  } catch {
    return { status: 'Pending', final_score: '' };
  }
}

function buildModelPrompt(awayTeam, homeTeam, sport, spreadFavored, spreadVal, totalVal, mlHome, mlAway, liveIntel) {
  const SIGMA = {
    NBA: 'sigma_margin=11.5, sigma_total=18',
    NFL: 'sigma_margin=13.5, sigma_total=22',
    MLB: 'sigma_margin=2.2, sigma_total=4.5',
    NHL: 'sigma_margin=1.4, sigma_total=1.8',
    NCAAB: 'sigma_margin=14.0, sigma_total=20',
    NCAAF: 'sigma_margin=16.0, sigma_total=24',
    Soccer: 'sigma_margin=1.0, sigma_total=1.4',
  };
  return `You are a sharp sports betting quantitative analyst.
GAME: ${awayTeam} @ ${homeTeam} | SPORT: ${sport}
LINES: Spread ${spreadFavored} -${spreadVal} | ML Home ${mlHome} / Away ${mlAway} | Total ${totalVal}
SIGMA DEFAULTS FOR ${sport}: ${SIGMA[sport] || 'sigma_margin=12, sigma_total=18'}
LIVE INTEL: ${liveIntel}

Return ONLY this JSON (no markdown):
{"mu_margin":float,"sigma_margin":float,"mu_total":float,"sigma_total":float,"model_confidence":"high"|"medium"|"low","injury_uncertainty":int,"b2b_home":bool,"b2b_away":bool,"is_rivalry":bool,"is_conf_tournament":bool,"is_cross_conference":bool,"line_movement":"confirming"|"against"|"neutral","market_note":"string","key_factors":["str","str","str"],"analysis_summary":"string","risk_factors":["str","str"],"alt_lines":[{"label":"str","line":float,"dir":"home"|"away"|"over"|"under","price":"str","ev_pct":float}],"parlay_eligible":bool,"parlay_note":"string","grade":"A+"|"A"|"B"|"Lean"|"Fade","optimal_line_note":"string"}`;
}

// --- Mock data for demo mode (no API key) ---

function getMockIntel(awayTeam, homeTeam, sport) {
  return `[Demo Mode] ${awayTeam} @ ${homeTeam} (${sport}): Both teams entering in solid form. No significant injury concerns reported. Home team has covered the spread in 4 of last 5 home games. Away team 3-2 ATS in last 5 road games. Line has moved slightly toward the home favorite since open, suggesting sharp action. Weather is not a factor for indoor games.`;
}

const MOCK_GRADES = ['A+', 'A', 'B', 'Lean', 'Lean', 'Fade'];
const MOCK_CONFIDENCES = ['high', 'medium', 'medium', 'low'];

export function getMockQuantModel(awayTeam, homeTeam, sport, spreadVal, totalVal, mlHome, mlAway) {
  // Seed random values off team name chars for determinism
  const seed = (awayTeam + homeTeam).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (lo, hi) => lo + ((seed * 9301 + 49297) % 233280 / 233280) * (hi - lo);
  const SIGMA_MAP = { NBA: [11.5, 18], NFL: [13.5, 22], MLB: [2.2, 4.5], NHL: [1.4, 1.8], NCAAB: [14, 20], NCAAF: [16, 24], Soccer: [1.0, 1.4] };
  const [defSigmaM, defSigmaT] = SIGMA_MAP[sport] || [12, 18];
  const mu_margin = parseFloat((rng(-8, 10)).toFixed(1));
  const mu_total = parseFloat((totalVal || 220) + rng(-12, 12)).toFixed(1);
  const gradeIdx = Math.floor(rng(0, MOCK_GRADES.length));
  const confIdx = Math.floor(rng(0, MOCK_CONFIDENCES.length));
  return {
    mu_margin,
    sigma_margin: parseFloat((defSigmaM + rng(-1, 2)).toFixed(1)),
    mu_total: parseFloat(mu_total),
    sigma_total: parseFloat((defSigmaT + rng(-1, 2)).toFixed(1)),
    model_confidence: MOCK_CONFIDENCES[confIdx],
    injury_uncertainty: Math.round(rng(2, 15)),
    b2b_home: rng(0, 1) > 0.8,
    b2b_away: rng(0, 1) > 0.85,
    is_rivalry: rng(0, 1) > 0.75,
    is_conf_tournament: false,
    is_cross_conference: rng(0, 1) > 0.7,
    line_movement: ['confirming', 'against', 'neutral'][Math.floor(rng(0, 3))],
    market_note: 'Demo mode — model using simulated market data.',
    key_factors: [
      `${homeTeam} home record is above average this season`,
      `${awayTeam} ranks top-10 in offensive efficiency`,
      'Sharp action confirmed on the spread side',
    ],
    analysis_summary: `[Demo Mode] Quantitative model projects ${homeTeam} as slight favorite. Edge detected on spread market. Model confidence: ${MOCK_CONFIDENCES[confIdx]}. Risk factors manageable.`,
    risk_factors: ['Line movement partially against model', 'Injury uncertainty moderate'],
    alt_lines: [
      { label: 'Alt spread -1.5', line: 1.5, dir: 'home', price: '-135', ev_pct: 2.1 },
      { label: 'Alt total O215', line: 215, dir: 'over', price: '-108', ev_pct: 1.4 },
    ],
    parlay_eligible: rng(0, 1) > 0.4,
    parlay_note: 'Pairs well with other strong spread picks tonight.',
    grade: MOCK_GRADES[gradeIdx],
    optimal_line_note: `Best value at current spread. Consider alternate lines if spread moves more than 1 point.`,
  };
}
