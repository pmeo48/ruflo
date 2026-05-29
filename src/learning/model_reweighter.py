"""
Dynamic model weight adjustment based on long-term performance.
Uses a Bayesian approach with conservative updates to prevent overfitting.
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Dict

from src.learning.performance_tracker import PerformanceMetrics

logger = logging.getLogger(__name__)

# Default weights
DEFAULT_EV_WEIGHT = 0.40
DEFAULT_WIN_PROB_WEIGHT = 0.30
DEFAULT_CONFIDENCE_WEIGHT = 0.20
DEFAULT_CLV_WEIGHT = 0.10

# Bayesian update parameters
MIN_SAMPLE_SIZE = 50       # Minimum bets before adjusting weights
MAX_CHANGE_PER_CYCLE = 0.05  # Max 5% change per reweighting cycle
LEARNING_RATE = 0.1        # How aggressively to move toward new evidence


@dataclass
class ModelWeights:
    ev_weight: float = DEFAULT_EV_WEIGHT
    win_prob_weight: float = DEFAULT_WIN_PROB_WEIGHT
    confidence_weight: float = DEFAULT_CONFIDENCE_WEIGHT
    clv_weight: float = DEFAULT_CLV_WEIGHT
    sport_modifiers: Dict[str, float] = field(default_factory=dict)
    sample_size: int = 0
    notes: str = ""

    def as_dict(self) -> Dict[str, Any]:
        return {
            "ev_weight": self.ev_weight,
            "win_prob_weight": self.win_prob_weight,
            "confidence_weight": self.confidence_weight,
            "clv_weight": self.clv_weight,
            "sport_modifiers": self.sport_modifiers,
            "sample_size": self.sample_size,
            "notes": self.notes,
        }

    def normalise(self) -> "ModelWeights":
        """Ensure weights sum to 1.0."""
        total = self.ev_weight + self.win_prob_weight + self.confidence_weight + self.clv_weight
        if total > 0 and abs(total - 1.0) > 0.001:
            self.ev_weight /= total
            self.win_prob_weight /= total
            self.confidence_weight /= total
            self.clv_weight /= total
        return self


def _clamp_change(old: float, new: float, max_delta: float = MAX_CHANGE_PER_CYCLE) -> float:
    """Clamp weight change to at most max_delta per cycle."""
    delta = new - old
    delta = max(-max_delta, min(max_delta, delta))
    return max(0.05, min(0.70, old + delta))


class ModelReweighter:
    """Adjusts composite scoring weights based on long-term bet performance."""

    async def reweight_models(
        self,
        metrics: PerformanceMetrics,
        db,
        current_weights: ModelWeights = None,
    ) -> ModelWeights:
        """
        Recompute model weights based on performance data.
        Uses Bayesian updating with conservative adjustments.

        Args:
            metrics: Aggregated performance metrics (90-day window)
            db: DBManager instance for persistence
            current_weights: Current weights (loaded from DB or defaults)

        Returns:
            Updated ModelWeights instance
        """
        if current_weights is None:
            current_weights = ModelWeights()

        if not metrics.sample_size_sufficient:
            logger.info(
                "Insufficient sample (%d bets, need %d) — keeping current weights",
                metrics.total_bets, MIN_SAMPLE_SIZE,
            )
            current_weights.notes = f"No update: insufficient sample ({metrics.total_bets} bets)"
            return current_weights

        logger.info("Reweighting models based on %d bets", metrics.total_bets)

        # --- Determine which signal is predictive ---
        # CLV is the best predictor of long-term profitability
        # If CLV is positive, the CLV signal deserves more weight
        # If actual ROI exceeds predicted EV, EV signal deserves more weight
        # These adjustments are small and conservative

        roi_ratio = metrics.roi / max(metrics.avg_ev * 100, 0.001)  # how well EV predicted ROI
        clv_positive = metrics.avg_clv > 0.001

        # Target weights based on observed performance
        target_ev = DEFAULT_EV_WEIGHT
        target_wp = DEFAULT_WIN_PROB_WEIGHT
        target_conf = DEFAULT_CONFIDENCE_WEIGHT
        target_clv = DEFAULT_CLV_WEIGHT

        if clv_positive and metrics.avg_clv > 0.005:
            # CLV is strongly positive — CLV signal is working well, increase its weight
            target_clv = min(0.20, DEFAULT_CLV_WEIGHT + 0.05)
            target_ev = max(0.30, DEFAULT_EV_WEIGHT - 0.025)
            target_conf = max(0.15, DEFAULT_CONFIDENCE_WEIGHT - 0.025)

        if roi_ratio > 1.2:
            # EV is undershooting actual ROI — EV signal is conservative, reduce slightly
            target_ev = max(0.30, target_ev - 0.02)
            target_wp = min(0.40, target_wp + 0.02)
        elif roi_ratio < 0.8:
            # EV is overshooting actual ROI — reduce EV weight
            target_ev = max(0.25, target_ev - 0.05)
            target_conf = min(0.30, target_conf + 0.05)

        # Bayesian interpolation between current and target
        def bayesian_blend(current: float, target: float) -> float:
            blended = current + LEARNING_RATE * (target - current)
            return _clamp_change(current, blended)

        new_weights = ModelWeights(
            ev_weight=bayesian_blend(current_weights.ev_weight, target_ev),
            win_prob_weight=bayesian_blend(current_weights.win_prob_weight, target_wp),
            confidence_weight=bayesian_blend(current_weights.confidence_weight, target_conf),
            clv_weight=bayesian_blend(current_weights.clv_weight, target_clv),
            sport_modifiers=self._compute_sport_modifiers(metrics),
            sample_size=metrics.total_bets,
            notes=(
                f"Reweighted from {metrics.total_bets} bets | "
                f"ROI: {metrics.roi:.2f}% | CLV: {metrics.avg_clv:.4f} | "
                f"ROI/EV ratio: {roi_ratio:.2f}"
            ),
        )
        new_weights.normalise()

        # Persist to DB
        try:
            await db.save_model_weights(new_weights.as_dict())
            logger.info(
                "Model weights updated: EV=%.3f WP=%.3f Conf=%.3f CLV=%.3f",
                new_weights.ev_weight, new_weights.win_prob_weight,
                new_weights.confidence_weight, new_weights.clv_weight,
            )
        except Exception as exc:
            logger.error("Failed to persist model weights: %s", exc)

        return new_weights

    def _compute_sport_modifiers(self, metrics: PerformanceMetrics) -> Dict[str, float]:
        """
        Compute per-sport multipliers based on historical ROI.
        Sports with positive ROI get a slight boost; negative ROI get slight reduction.
        Changes are capped at ±0.10 from 1.0 baseline.
        """
        modifiers: Dict[str, float] = {}
        for sport, stats in metrics.by_sport.items():
            bets = stats.get("bets", 0)
            roi = stats.get("roi", 0.0)
            if bets < 20:
                # Too small to draw conclusions
                continue
            # Map ROI to modifier: +10% ROI → 1.05 modifier, -10% ROI → 0.95
            raw_modifier = 1.0 + (roi / 200.0)
            modifiers[sport] = round(max(0.90, min(1.10, raw_modifier)), 3)
        return modifiers


def weights_from_db_row(row: Dict[str, Any]) -> ModelWeights:
    """Convert a DB row dict to a ModelWeights instance."""
    return ModelWeights(
        ev_weight=float(row.get("ev_weight", DEFAULT_EV_WEIGHT)),
        win_prob_weight=float(row.get("win_prob_weight", DEFAULT_WIN_PROB_WEIGHT)),
        confidence_weight=float(row.get("confidence_weight", DEFAULT_CONFIDENCE_WEIGHT)),
        clv_weight=float(row.get("clv_weight", DEFAULT_CLV_WEIGHT)),
        sport_modifiers=row.get("sport_modifiers", {}),
        sample_size=int(row.get("sample_size", 0)),
        notes=row.get("notes", ""),
    )
