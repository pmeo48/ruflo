"""
Expected Value, edge, and bet classification calculations.
"""

import logging
from typing import Tuple

logger = logging.getLogger(__name__)

# Classification thresholds
STRONG_EV_MIN = 0.04
STRONG_EDGE_MIN = 0.03
STRONG_RISK_MAX = 40.0
STRONG_CONFIDENCE_MIN = 0.65

LEAN_EV_MIN = 0.015
LEAN_EDGE_MIN = 0.01
LEAN_CONFIDENCE_MIN = 0.50


def calculate_ev(model_prob: float, american_odds: int) -> float:
    """
    Expected value as a decimal fraction of stake.
    EV = (prob * profit_on_win) - (1 - prob) * stake
    Returns e.g. 0.05 for 5% EV.
    """
    from src.analysis.probability_engine import american_to_decimal
    decimal_odds = american_to_decimal(american_odds)
    profit_on_win = decimal_odds - 1.0
    ev = (model_prob * profit_on_win) - ((1.0 - model_prob) * 1.0)
    return round(ev, 6)


def calculate_edge(model_prob: float, market_prob: float) -> float:
    """Edge = model probability minus no-vig market probability."""
    return round(model_prob - market_prob, 6)


def calculate_clv_potential(
    current_odds: int,
    model_prob: float,
    market_efficiency: float = 0.95,
) -> float:
    """
    Estimate closing line value potential.
    Higher model edge on current line = higher CLV expectation.
    market_efficiency: how quickly the market corrects (0-1).
    """
    from src.analysis.probability_engine import implied_probability
    market_prob = implied_probability(current_odds)
    raw_clv = model_prob - market_prob
    adjusted_clv = raw_clv * market_efficiency
    return round(adjusted_clv, 6)


def calculate_risk_score(
    ev: float,
    edge: float,
    confidence: float,
    variance: float,
    data_quality: float,
) -> float:
    """
    Composite risk score 0-100 (lower = less risky / better bet).
    Components: EV quality, edge size, confidence, variance, data completeness.
    """
    ev_score = max(0.0, min(40.0, 40.0 - (ev * 500)))
    edge_score = max(0.0, min(30.0, 30.0 - (edge * 400)))
    confidence_score = max(0.0, min(20.0, (1.0 - confidence) * 20.0))
    data_score = max(0.0, min(10.0, (1.0 - data_quality / 100.0) * 10.0))
    risk = ev_score + edge_score + confidence_score + data_score
    return round(min(100.0, max(0.0, risk)), 2)


def classify_bet(ev: float, edge: float, risk_score: float, confidence: float) -> str:
    """
    Classify a betting opportunity as STRONG, LEAN, or PASS.
    """
    if (
        ev >= STRONG_EV_MIN
        and edge >= STRONG_EDGE_MIN
        and risk_score <= STRONG_RISK_MAX
        and confidence >= STRONG_CONFIDENCE_MIN
    ):
        return "STRONG"
    if ev >= LEAN_EV_MIN and edge >= LEAN_EDGE_MIN and confidence >= LEAN_CONFIDENCE_MIN:
        return "LEAN"
    return "PASS"


def composite_score(
    ev: float,
    win_prob: float,
    confidence: float,
    clv_potential: float,
    weights: Tuple[float, float, float, float] = (0.40, 0.30, 0.20, 0.10),
) -> float:
    """
    Portfolio Manager composite scoring formula.
    Default weights: 40% EV, 30% win_prob, 20% confidence, 10% CLV.
    """
    ev_norm = min(1.0, max(0.0, ev / 0.10))
    wp_norm = min(1.0, max(0.0, win_prob))
    conf_norm = min(1.0, max(0.0, confidence))
    clv_norm = min(1.0, max(0.0, clv_potential / 0.05))
    w_ev, w_wp, w_conf, w_clv = weights
    score = (w_ev * ev_norm) + (w_wp * wp_norm) + (w_conf * conf_norm) + (w_clv * clv_norm)
    return round(score, 6)
