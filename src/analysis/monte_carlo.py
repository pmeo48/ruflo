"""
Monte Carlo simulation engine for betting opportunity analysis.
"""

import logging
from dataclasses import dataclass, field
from typing import List, Dict

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class SimulationResult:
    n_simulations: int
    mean_ev: float
    std_ev: float
    percentile_5: float
    percentile_95: float
    win_rate: float
    profit_probability: float
    expected_profit_per_unit: float
    sharpe_ratio: float
    ev_distribution: List[float] = field(default_factory=list)


def run_simulation(
    model_prob: float,
    american_odds: int,
    n_simulations: int = 10000,
    stake: float = 1.0,
) -> SimulationResult:
    """
    Monte Carlo simulation for a single betting opportunity.
    Returns distribution of outcomes over n_simulations trials.
    """
    from src.analysis.probability_engine import american_to_decimal

    model_prob = max(0.001, min(0.999, model_prob))
    decimal_odds = american_to_decimal(american_odds)
    profit_on_win = stake * (decimal_odds - 1.0)
    loss_on_lose = -stake

    rng = np.random.default_rng()
    outcomes = rng.random(n_simulations) < model_prob
    pnl = np.where(outcomes, profit_on_win, loss_on_lose)

    win_rate = float(np.mean(outcomes))
    mean_ev = float(np.mean(pnl))
    std_ev = float(np.std(pnl))
    p5 = float(np.percentile(pnl, 5))
    p95 = float(np.percentile(pnl, 95))
    profit_prob = float(np.mean(pnl > 0))
    sharpe = mean_ev / std_ev if std_ev > 0 else 0.0

    ev_dist = pnl.tolist() if n_simulations <= 1000 else pnl[::10].tolist()

    return SimulationResult(
        n_simulations=n_simulations,
        mean_ev=mean_ev,
        std_ev=std_ev,
        percentile_5=p5,
        percentile_95=p95,
        win_rate=win_rate,
        profit_probability=profit_prob,
        expected_profit_per_unit=mean_ev / stake,
        sharpe_ratio=sharpe,
        ev_distribution=ev_dist,
    )


def simulate_parlay(legs: List[Dict], n_simulations: int = 10000) -> SimulationResult:
    """
    Monte Carlo simulation for a multi-leg parlay.
    legs: list of {"model_prob": float, "american_odds": int}
    """
    from src.analysis.probability_engine import american_to_decimal

    if not legs:
        return SimulationResult(0, 0, 0, 0, 0, 0, 0, 0, 0)

    rng = np.random.default_rng()
    n = n_simulations

    combined_prob = np.ones(n, dtype=float)
    combined_decimal = 1.0

    for leg in legs:
        prob = max(0.001, min(0.999, leg["model_prob"]))
        dec = american_to_decimal(leg["american_odds"])
        combined_decimal *= dec
        win_mask = rng.random(n) < prob
        combined_prob *= win_mask.astype(float)

    profit_on_win = combined_decimal - 1.0
    pnl = np.where(combined_prob > 0, profit_on_win, -1.0)

    win_rate = float(np.mean(combined_prob > 0))
    mean_ev = float(np.mean(pnl))
    std_ev = float(np.std(pnl))

    return SimulationResult(
        n_simulations=n_simulations,
        mean_ev=mean_ev,
        std_ev=std_ev,
        percentile_5=float(np.percentile(pnl, 5)),
        percentile_95=float(np.percentile(pnl, 95)),
        win_rate=win_rate,
        profit_probability=float(np.mean(pnl > 0)),
        expected_profit_per_unit=mean_ev,
        sharpe_ratio=mean_ev / std_ev if std_ev > 0 else 0.0,
    )


def simulate_season(bets: List[Dict], bankroll: float, n_simulations: int = 1000) -> Dict:
    """
    Simulate bankroll trajectory over a list of bets.
    Each bet: {"model_prob": float, "american_odds": int, "stake_pct": float}
    """
    from src.analysis.probability_engine import american_to_decimal

    if not bets:
        return {"final_bankroll_mean": bankroll, "ruin_probability": 0.0, "trajectories": []}

    rng = np.random.default_rng()
    n = n_simulations
    bankrolls = np.full(n, bankroll, dtype=float)

    for bet in bets:
        prob = max(0.001, min(0.999, bet["model_prob"]))
        dec = american_to_decimal(bet["american_odds"])
        stake_pct = min(bet.get("stake_pct", 0.01), 0.05)
        stakes = bankrolls * stake_pct
        wins = rng.random(n) < prob
        bankrolls += np.where(wins, stakes * (dec - 1.0), -stakes)
        bankrolls = np.maximum(bankrolls, 0)

    ruin_prob = float(np.mean(bankrolls <= 0))
    return {
        "final_bankroll_mean": float(np.mean(bankrolls)),
        "final_bankroll_median": float(np.median(bankrolls)),
        "final_bankroll_p5": float(np.percentile(bankrolls, 5)),
        "final_bankroll_p95": float(np.percentile(bankrolls, 95)),
        "ruin_probability": ruin_prob,
        "growth_factor_mean": float(np.mean(bankrolls) / bankroll),
    }
