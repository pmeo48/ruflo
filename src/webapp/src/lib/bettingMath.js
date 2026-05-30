// Normal CDF (Abramowitz & Stegun approximation)
export function normCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const poly = t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  const p = 1 - d * poly;
  return z >= 0 ? p : 1 - p;
}

export function pWin(mu, sigma) { return normCDF(mu / Math.max(sigma, 0.01)); }
export function pCov(mu, sigma, S) { return normCDF((mu - S) / Math.max(sigma, 0.01)); }
export function pOvr(mu, sigma, T) { return normCDF((mu - T) / Math.max(sigma, 0.01)); }

export function toDec(american) {
  const n = parseFloat(american);
  if (!n || isNaN(n)) return 1.909;
  return n > 0 ? n / 100 + 1 : 100 / Math.abs(n) + 1;
}

export function impliedProb(american) {
  const n = parseFloat(american);
  if (!n || isNaN(n)) return 0.524;
  return n < 0 ? Math.abs(n) / (Math.abs(n) + 100) : 100 / (n + 100);
}

export function noVig(mlHome, mlAway) {
  const r1 = impliedProb(mlHome), r2 = impliedProb(mlAway);
  const t = r1 + r2;
  return { p1: r1 / t, p2: r2 / t };
}

export function noVigSingle(american) {
  const p = impliedProb(american);
  return p / (p + (1 - p) * 1.04);
}

export function evCalc(prob, dec) { return (prob * dec - 1) * 100; }
export function calcEdge(modelP, mktP) { return (modelP - mktP) * 100; }

export function kellyF(prob, dec) {
  const q = 1 - prob, b = dec - 1;
  return Math.max(0, (prob * b - q) / b);
}

export function wilsonCI(p, n = 100) {
  const z = 1.96, denom = 1 + z * z / n;
  const center = (p + z * z / (2 * n)) / denom;
  const spread = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom;
  return { lo: Math.max(0, center - spread), hi: Math.min(1, center + spread) };
}

export function calcRisk(d, sport, spreadVal) {
  const BASE = { NBA: 12, NFL: 15, MLB: 8, NHL: 10, NCAAB: 18, NCAAF: 20, Soccer: 10 };
  let risk = BASE[sport] || 12;
  risk += Math.min(30, d.injury_uncertainty || 0);
  if (d.b2b_home || d.b2b_away) risk += 10;
  if (d.model_confidence === 'low') risk += 10;
  else if (d.model_confidence === 'medium') risk += 5;
  if (d.is_rivalry) risk += 5;
  if (d.is_conf_tournament) risk += 5;
  if (d.is_cross_conference) risk += 5;
  if ((d.sigma_margin || 11.5) > 14) risk += 5;
  return Math.min(100, risk);
}

export function getRiskVerdict(risk) {
  if (risk <= 25) return { label: 'LOW', color: '#22c55e', recommendation: 'Full 1/4 Kelly stake' };
  if (risk <= 40) return { label: 'MEDIUM', color: '#c9a84c', recommendation: '1/2 of normal stake' };
  if (risk <= 55) return { label: 'HIGH', color: '#f97316', recommendation: '1/4 of normal stake or skip' };
  return { label: 'VERY HIGH', color: '#ef4444', recommendation: 'Avoid or micro-stake only' };
}

export function computeFinalScore(ev, prob, risk, dataQuality) {
  const qb = { high: 5, medium: 0, low: -8 }[dataQuality] || 0;
  const probEdge = (prob - 0.5) * 100;
  const riskPenalty = Math.max(0, risk - 30) * 0.2;
  return ev * 0.6 + probEdge * 0.3 - riskPenalty + qb;
}

export function assignBetTier(ev, prob, risk, modelConfidence) {
  if (ev >= 5 && prob >= 0.50 && risk <= 50) return 'ELITE';
  if (ev >= 3 && prob >= 0.47 && risk <= 55) return 'STRONG BET';
  if (ev >= 1 && risk <= 60) return 'VALUE BET';
  if (ev >= 0) return 'LEAN / TRACK';
  return null;
}

export function buildCandidates(d, spreadVal, totalVal, mlHome, mlAway, sport) {
  const mu = d.mu_margin || 0;
  const sigma = d.sigma_margin || 11.5;
  const muT = d.mu_total || (totalVal || 210);
  const sigmaT = d.sigma_total || 18;
  const candidates = [];

  // Spread home (positive mu = home favored)
  if (spreadVal > 0) {
    const prob = pCov(mu, sigma, -spreadVal);
    const dec = toDec(-110);
    const mktP = impliedProb(-110);
    candidates.push({
      market: 'spread', pick: 'home_spread', label: `Home -${spreadVal}`,
      prob, dec, mktP, ev: evCalc(prob, dec),
      edge: calcEdge(prob, mktP), odds: '-110',
    });
    const awayProb = 1 - prob;
    candidates.push({
      market: 'spread', pick: 'away_spread', label: `Away +${spreadVal}`,
      prob: awayProb, dec: toDec(-110), mktP: impliedProb(-110),
      ev: evCalc(awayProb, toDec(-110)), edge: calcEdge(awayProb, impliedProb(-110)), odds: '-110',
    });
  }

  // Moneyline
  if (mlHome && mlAway) {
    const { p1: nvHome, p2: nvAway } = noVig(mlHome, mlAway);
    const modelProbHome = pWin(mu, sigma);
    const decHome = toDec(mlHome);
    const decAway = toDec(mlAway);
    candidates.push({
      market: 'ml', pick: 'home_ml', label: 'Home ML',
      prob: modelProbHome, dec: decHome, mktP: nvHome,
      ev: evCalc(modelProbHome, decHome), edge: calcEdge(modelProbHome, nvHome), odds: String(mlHome),
    });
    candidates.push({
      market: 'ml', pick: 'away_ml', label: 'Away ML',
      prob: 1 - modelProbHome, dec: decAway, mktP: nvAway,
      ev: evCalc(1 - modelProbHome, decAway), edge: calcEdge(1 - modelProbHome, nvAway), odds: String(mlAway),
    });
  }

  // Total
  if (totalVal > 0) {
    const probOver = pOvr(muT, sigmaT, totalVal);
    const probUnder = 1 - probOver;
    const decTotal = toDec(-110);
    const mktTotal = impliedProb(-110);
    candidates.push({
      market: 'total', pick: 'over', label: `Over ${totalVal}`,
      prob: probOver, dec: decTotal, mktP: mktTotal,
      ev: evCalc(probOver, decTotal), edge: calcEdge(probOver, mktTotal), odds: '-110',
    });
    candidates.push({
      market: 'total', pick: 'under', label: `Under ${totalVal}`,
      prob: probUnder, dec: decTotal, mktP: mktTotal,
      ev: evCalc(probUnder, decTotal), edge: calcEdge(probUnder, mktTotal), odds: '-110',
    });
  }

  return candidates.sort((a, b) => b.ev - a.ev);
}

export function applyFilters(candidates, risk, mu, spreadVal, home_team, away_team, modelConfidence) {
  if (!candidates || candidates.length === 0) return null;

  const MIN_EV = modelConfidence === 'high' ? 1.5 : modelConfidence === 'medium' ? 2.5 : 3.5;
  const MIN_PROB = 0.44;
  const MAX_RISK = 65;

  const qualified = candidates.filter(c =>
    c.ev >= MIN_EV && c.prob >= MIN_PROB && risk <= MAX_RISK
  );

  if (qualified.length === 0) return null;

  const best = qualified[0];
  const tier = assignBetTier(best.ev, best.prob, risk, modelConfidence);
  if (!tier) return null;

  return { bet: best, tier };
}
