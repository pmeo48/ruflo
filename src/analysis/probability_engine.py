"""
Core probability calculations for sports betting analysis.
"""

import math
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)


def implied_probability(american_odds: int) -> float:
    """Convert American odds to implied probability (includes vig)."""
    if american_odds > 0:
        return 100.0 / (american_odds + 100.0)
    else:
        return abs(american_odds) / (abs(american_odds) + 100.0)


def decimal_to_american(decimal_odds: float) -> int:
    """Convert decimal odds to American odds."""
    if decimal_odds >= 2.0:
        return int((decimal_odds - 1) * 100)
    else:
        return int(-100 / (decimal_odds - 1))


def american_to_decimal(american_odds: int) -> float:
    """Convert American odds to decimal odds."""
    if american_odds > 0:
        return (american_odds / 100.0) + 1.0
    else:
        return (100.0 / abs(american_odds)) + 1.0


def no_vig_probability(home_odds: int, away_odds: int) -> Tuple[float, float]:
    """Remove bookmaker margin to get true implied probabilities."""
    p_home = implied_probability(home_odds)
    p_away = implied_probability(away_odds)
    total = p_home + p_away
    return p_home / total, p_away / total


def no_vig_probability_3way(odds_1: int, odds_2: int, odds_draw: int) -> Tuple[float, float, float]:
    """Remove vig from 3-way markets (soccer)."""
    p1 = implied_probability(odds_1)
    p2 = implied_probability(odds_2)
    pd = implied_probability(odds_draw)
    total = p1 + p2 + pd
    return p1 / total, p2 / total, pd / total


def consensus_probability(probs: List[float], weights: List[float] = None) -> float:
    """Weighted average of probability estimates."""
    if not probs:
        return 0.5
    if weights is None:
        weights = [1.0] * len(probs)
    total_weight = sum(weights)
    if total_weight == 0:
        return sum(probs) / len(probs)
    return sum(p * w for p, w in zip(probs, weights)) / total_weight


def power_rating_to_probability(
    home_rating: float,
    away_rating: float,
    home_field: float = 3.0,
    std_dev: float = 14.0,
) -> float:
    """
    Convert power ratings to win probability using normal distribution.
    home_field: points of home-field advantage (varies by sport).
    std_dev: standard deviation of point spreads.
    """
    from scipy.stats import norm  # type: ignore
    spread = (home_rating + home_field) - away_rating
    prob = norm.cdf(spread / std_dev)
    return float(prob)


def elo_win_probability(elo_a: float, elo_b: float) -> float:
    """Standard ELO win probability using 400-point scale."""
    return 1.0 / (1.0 + 10.0 ** ((elo_b - elo_a) / 400.0))


def bayesian_update(prior: float, likelihood_given_true: float, likelihood_given_false: float) -> float:
    """
    Update prior probability given new evidence using Bayes theorem.
    P(H|E) = P(E|H)*P(H) / [P(E|H)*P(H) + P(E|~H)*P(~H)]
    """
    prior = max(0.001, min(0.999, prior))
    numerator = likelihood_given_true * prior
    denominator = numerator + likelihood_given_false * (1.0 - prior)
    if denominator == 0:
        return prior
    return numerator / denominator


def poisson_probability(lambda_: float, k: int) -> float:
    """Poisson probability for sports totals modeling."""
    return math.exp(-lambda_) * (lambda_ ** k) / math.factorial(k)


def calculate_market_efficiency(opening_odds: int, closing_odds: int) -> float:
    """
    Measure how much the market moved. Returns 0-1 efficiency score.
    Large moves = less efficient opening line.
    """
    open_prob = implied_probability(opening_odds)
    close_prob = implied_probability(closing_odds)
    movement = abs(close_prob - open_prob)
    # Normalize: 10% movement = 0 efficiency, 0% = 1.0 efficiency
    return max(0.0, 1.0 - (movement / 0.10))


def kelly_edge(model_prob: float, market_prob: float) -> float:
    """Simple edge calculation: model prob minus market implied prob."""
    return model_prob - market_prob


def variance_from_odds(american_odds: int, model_prob: float) -> float:
    """Betting variance for a given wager."""
    decimal = american_to_decimal(american_odds)
    win_var = (decimal - 1) ** 2 * model_prob
    lose_var = 1.0 ** 2 * (1.0 - model_prob)
    return win_var + lose_var
