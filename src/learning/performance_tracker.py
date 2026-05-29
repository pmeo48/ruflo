"""
Post-game performance tracking and bet grading.
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import anthropic

from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a sports betting performance analyst.
Analyze historical betting performance data and provide actionable insights about:
- Which markets, sports, and bet types are generating the most value
- Where the model is systematically over/under-estimating probability
- Patterns in losing bets — are they concentrated in specific conditions?
- CLV (Closing Line Value) trends — are we consistently beating the close?

Be specific and quantitative. Avoid vague generalizations."""


@dataclass
class PerformanceMetrics:
    total_bets: int = 0
    wins: int = 0
    losses: int = 0
    pushes: int = 0
    win_rate: float = 0.0
    total_staked: float = 0.0
    total_profit: float = 0.0
    roi: float = 0.0
    avg_clv: float = 0.0
    avg_ev: float = 0.0
    avg_confidence: float = 0.0
    by_sport: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    by_market: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    by_classification: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    sample_size_sufficient: bool = False  # True if >= 50 bets
    days_analyzed: int = 90


class PerformanceTracker:
    def __init__(self, api_key: str, model: str) -> None:
        self.client = anthropic.Anthropic(api_key=api_key)
        self.agent = BaseAgent(
            name="PerformanceTracker",
            system_prompt=SYSTEM_PROMPT,
            model=model,
            client=self.client,
            max_tokens=2048,
        )

    async def grade_completed_bets(self, db) -> int:
        """
        Check for bets without results and attempt to grade them.
        Returns number of bets graded.

        In production, this would integrate with a results API.
        For now, we log the outstanding bets and leave them for manual grading.
        """
        ungraded = await db.get_bets({"result": None})
        logger.info("Found %d ungraded bets", len(ungraded))

        # TODO: Integrate with results API (e.g., The Odds API scores endpoint)
        # For now, log the open bets
        for bet in ungraded[:5]:
            logger.debug(
                "Ungraded: %s | %s | %s | created %s",
                bet.get("game"), bet.get("market"), bet.get("selection"), bet.get("created_at"),
            )

        return 0  # No automatic grading implemented yet

    async def calculate_performance_metrics(self, db, days: int = 90) -> PerformanceMetrics:
        """Aggregate performance metrics from the database."""
        rows = await db.get_performance_stats(days=days)

        metrics = PerformanceMetrics(days_analyzed=days)
        total_bets = 0
        total_wins = 0
        total_staked = 0.0
        total_profit = 0.0
        clv_sum = 0.0
        ev_sum = 0.0
        conf_sum = 0.0

        for row in rows:
            sport = row.get("sport", "unknown")
            market = row.get("market", "unknown")
            classification = row.get("classification", "PASS")
            bets = int(row.get("total_bets", 0))
            wins = int(row.get("wins", 0))
            staked = float(row.get("total_staked", 0))
            profit = float(row.get("total_profit", 0))
            roi = float(row.get("avg_roi", 0))
            clv = float(row.get("avg_clv", 0))
            ev = float(row.get("avg_ev", 0))
            conf = float(row.get("avg_confidence", 0))

            total_bets += bets
            total_wins += wins
            total_staked += staked
            total_profit += profit
            clv_sum += clv * bets
            ev_sum += ev * bets
            conf_sum += conf * bets

            # By sport
            if sport not in metrics.by_sport:
                metrics.by_sport[sport] = {"bets": 0, "wins": 0, "profit": 0.0, "roi": 0.0}
            metrics.by_sport[sport]["bets"] += bets
            metrics.by_sport[sport]["wins"] += wins
            metrics.by_sport[sport]["profit"] += profit
            metrics.by_sport[sport]["roi"] = roi

            # By market
            if market not in metrics.by_market:
                metrics.by_market[market] = {"bets": 0, "wins": 0, "profit": 0.0, "roi": 0.0}
            metrics.by_market[market]["bets"] += bets
            metrics.by_market[market]["wins"] += wins
            metrics.by_market[market]["profit"] += profit
            metrics.by_market[market]["roi"] = roi

            # By classification
            if classification not in metrics.by_classification:
                metrics.by_classification[classification] = {"bets": 0, "wins": 0, "profit": 0.0, "roi": 0.0}
            metrics.by_classification[classification]["bets"] += bets
            metrics.by_classification[classification]["wins"] += wins
            metrics.by_classification[classification]["profit"] += profit

        metrics.total_bets = total_bets
        metrics.wins = total_wins
        metrics.losses = total_bets - total_wins
        metrics.win_rate = total_wins / max(total_bets, 1)
        metrics.total_staked = total_staked
        metrics.total_profit = total_profit
        metrics.roi = (total_profit / total_staked * 100) if total_staked > 0 else 0.0
        metrics.avg_clv = clv_sum / max(total_bets, 1)
        metrics.avg_ev = ev_sum / max(total_bets, 1)
        metrics.avg_confidence = conf_sum / max(total_bets, 1)
        metrics.sample_size_sufficient = total_bets >= 50

        logger.info(
            "Performance metrics: %d bets, %.1f%% win rate, %.2f%% ROI, %.4f avg CLV",
            total_bets, metrics.win_rate * 100, metrics.roi, metrics.avg_clv,
        )
        return metrics

    async def generate_performance_summary(self, metrics: PerformanceMetrics) -> str:
        """Ask Claude to write a performance analysis narrative."""
        if metrics.total_bets == 0:
            return "No completed bets to analyze yet."

        top_sports = sorted(
            metrics.by_sport.items(), key=lambda x: x[1].get("roi", 0), reverse=True
        )[:3]
        top_markets = sorted(
            metrics.by_market.items(), key=lambda x: x[1].get("roi", 0), reverse=True
        )[:3]

        prompt = f"""Write a professional performance analysis for a sports betting operation over the last {metrics.days_analyzed} days.

OVERALL STATISTICS:
- Total Bets: {metrics.total_bets} (sufficient sample: {metrics.sample_size_sufficient})
- Win Rate: {metrics.win_rate:.1%}
- ROI: {metrics.roi:.2f}%
- Total Profit: ${metrics.total_profit:.2f}
- Avg CLV: {metrics.avg_clv:.4f}
- Avg Model EV: {metrics.avg_ev:.4f}
- Avg Confidence: {metrics.avg_confidence:.3f}

TOP SPORTS BY ROI: {top_sports}
TOP MARKETS BY ROI: {top_markets}
BY CLASSIFICATION: {metrics.by_classification}

Provide:
1. Overall performance assessment (3 sentences)
2. Key strengths — what is working
3. Key weaknesses — where we are underperforming
4. Actionable recommendations for next 30 days

Be specific and quantitative."""

        return await self.agent.think(prompt)
