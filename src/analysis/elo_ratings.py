"""
ELO rating system for sports teams with SQLite persistence.
"""

import json
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

DEFAULT_RATING = 1500.0
HOME_FIELD_ADVANTAGE = 64.0  # in ELO points

SPORT_K_FACTORS: Dict[str, float] = {
    "nfl": 32.0,
    "nba": 20.0,
    "mlb": 10.0,
    "nhl": 20.0,
    "ncaaf": 28.0,
    "ncaab": 20.0,
    "mma": 32.0,
    "ufc": 32.0,
    "soccer": 20.0,
    "tennis": 32.0,
}


class EloRatings:
    """In-memory ELO ratings with optional DB persistence."""

    def __init__(self, sport: str, db_manager=None):
        self.sport = sport.lower()
        self.k = SPORT_K_FACTORS.get(self.sport, 20.0)
        self._ratings: Dict[str, float] = {}
        self._games: Dict[str, int] = {}
        self.db = db_manager

    def get_rating(self, team: str) -> float:
        return self._ratings.get(team, DEFAULT_RATING)

    def get_games(self, team: str) -> int:
        return self._games.get(team, 0)

    def win_probability(
        self,
        team_a: str,
        team_b: str,
        home_field_advantage: float = HOME_FIELD_ADVANTAGE,
    ) -> float:
        """P(A beats B) with home-field advantage applied to A."""
        ra = self.get_rating(team_a) + home_field_advantage
        rb = self.get_rating(team_b)
        return 1.0 / (1.0 + 10.0 ** ((rb - ra) / 400.0))

    def update_rating(
        self,
        winner: str,
        loser: str,
        score_diff: float = 1.0,
        home_team: Optional[str] = None,
    ) -> None:
        """
        Update ELO ratings after a game result.
        score_diff: margin-adjusted multiplier (1.0 = no margin adjustment).
        """
        hfa = HOME_FIELD_ADVANTAGE if home_team == winner else 0.0
        exp_winner = self.win_probability(winner, loser, hfa)
        exp_loser = 1.0 - exp_winner

        margin_mult = 1.0 + min(score_diff / 20.0, 1.0)
        k_adj = self.k * margin_mult

        r_winner = self.get_rating(winner)
        r_loser = self.get_rating(loser)

        self._ratings[winner] = r_winner + k_adj * (1.0 - exp_winner)
        self._ratings[loser] = r_loser + k_adj * (0.0 - exp_loser)
        self._games[winner] = self.get_games(winner) + 1
        self._games[loser] = self.get_games(loser) + 1

    async def load_from_db(self) -> None:
        """Load ratings from database."""
        if not self.db:
            return
        try:
            rows = await self.db.get_elo_ratings(self.sport)
            for row in rows:
                self._ratings[row["team"]] = row["rating"]
                self._games[row["team"]] = row["games"]
        except Exception as e:
            logger.warning("Could not load ELO ratings from DB: %s", e)

    async def save_to_db(self) -> None:
        """Persist current ratings to database."""
        if not self.db:
            return
        try:
            for team, rating in self._ratings.items():
                await self.db.upsert_elo_rating(
                    self.sport, team, rating, self._games.get(team, 0)
                )
        except Exception as e:
            logger.warning("Could not save ELO ratings to DB: %s", e)

    def ratings_summary(self) -> Dict[str, float]:
        return dict(sorted(self._ratings.items(), key=lambda x: x[1], reverse=True))
