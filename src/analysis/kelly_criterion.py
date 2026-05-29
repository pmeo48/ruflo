"""
Kelly Criterion stake sizing calculations.
"""

import logging
from typing import Dict

logger = logging.getLogger(__name__)

DEFAULT_KELLY_FRACTION = 0.25
MAX_STAKE_PCT = 0.015
MAX_DAILY_EXPOSURE = 0.05


def american_to_decimal(american_odds: int) -> float:
    if american_odds > 0:
        return (american_odds / 100.0) + 1.0
    return (100.0 / abs(american_odds)) + 1.0


def full_kelly(prob: float, odds_decimal: float) -> float:
    """
    Full Kelly criterion: f* = (bp - q) / b
    b = decimal_odds - 1, p = win prob, q = 1 - p
    Returns fraction of bankroll to wager. Clipped to [0, 1].
    """
    b = odds_decimal - 1.0
    q = 1.0 - prob
    if b <= 0:
        return 0.0
    f = (b * prob - q) / b
    return max(0.0, min(1.0, f))


def fractional_kelly(
    prob: float,
    odds_decimal: float,
    fraction: float = DEFAULT_KELLY_FRACTION,
) -> float:
    """Fractional Kelly — safer than full Kelly, default quarter Kelly."""
    return full_kelly(prob, odds_decimal) * fraction


def kelly_stake(
    prob: float,
    american_odds: int,
    bankroll: float,
    fraction: float = DEFAULT_KELLY_FRACTION,
    max_pct: float = MAX_STAKE_PCT,
) -> Dict:
    """
    Compute recommended stake using fractional Kelly with a hard cap.
    Returns dict with stake_pct, stake_amount, kelly_full, kelly_fractional.
    """
    odds_decimal = american_to_decimal(american_odds)
    kelly_f = full_kelly(prob, odds_decimal)
    kelly_frac = kelly_f * fraction
    stake_pct = min(kelly_frac, max_pct)
    stake_pct = max(0.0, stake_pct)
    stake_amount = round(bankroll * stake_pct, 2)

    return {
        "stake_pct": round(stake_pct, 6),
        "stake_amount": stake_amount,
        "stake_pct_display": f"{stake_pct * 100:.2f}%",
        "kelly_full": round(kelly_f, 6),
        "kelly_fractional": round(kelly_frac, 6),
        "kelly_fraction_used": fraction,
    }


def enforce_portfolio_limits(
    bets: list,
    bankroll: float,
    max_daily_pct: float = MAX_DAILY_EXPOSURE,
    max_single_pct: float = MAX_STAKE_PCT,
) -> list:
    """
    Scale down stakes so total daily exposure does not exceed max_daily_pct.
    Also enforces max_single_pct per bet.
    """
    for bet in bets:
        bet["stake_pct"] = min(bet.get("stake_pct", 0), max_single_pct)

    total = sum(b.get("stake_pct", 0) for b in bets)
    if total > max_daily_pct:
        scale = max_daily_pct / total
        for bet in bets:
            bet["stake_pct"] = round(bet["stake_pct"] * scale, 6)
            bet["stake_amount"] = round(bankroll * bet["stake_pct"], 2)

    return bets
