"""
Async SQLite manager using aiosqlite.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiosqlite

from src.database.models import ALL_TABLES

logger = logging.getLogger(__name__)


class DBManager:
    """Manages async SQLite operations for the betting platform."""

    def __init__(self, db_path: str = "data/betting.db") -> None:
        self.db_path = db_path
        self._conn: Optional[aiosqlite.Connection] = None

    async def initialize(self) -> None:
        """Create tables and open persistent connection."""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = await aiosqlite.connect(self.db_path)
        self._conn.row_factory = aiosqlite.Row
        await self._conn.execute("PRAGMA journal_mode=WAL;")
        await self._conn.execute("PRAGMA foreign_keys=ON;")
        for ddl in ALL_TABLES:
            await self._conn.execute(ddl)
        await self._conn.commit()
        logger.info("Database initialised at %s", self.db_path)

    async def close(self) -> None:
        if self._conn:
            await self._conn.close()
            self._conn = None

    # ------------------------------------------------------------------
    # Bets
    # ------------------------------------------------------------------

    async def save_bet(self, bet_data: Dict[str, Any]) -> int:
        """Insert a bet record and return its row id."""
        cols = [
            "date", "sport", "league", "game", "market", "selection",
            "odds", "opening_odds", "closing_odds", "model_probability",
            "market_probability", "expected_value", "edge", "risk_score",
            "confidence_score", "stake_pct", "classification", "result",
            "profit_loss", "roi", "closing_line_value", "session_id",
        ]
        values = [bet_data.get(c) for c in cols]
        placeholders = ", ".join("?" * len(cols))
        col_names = ", ".join(cols)
        sql = f"INSERT INTO bets ({col_names}) VALUES ({placeholders})"
        async with self._conn.execute(sql, values) as cur:
            row_id = cur.lastrowid
        await self._conn.commit()
        logger.debug("Saved bet id=%s  game=%s  market=%s", row_id, bet_data.get("game"), bet_data.get("market"))
        return row_id

    async def get_bets(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Query bets with optional equality filters."""
        sql = "SELECT * FROM bets WHERE 1=1"
        params: List[Any] = []
        if filters:
            for col, val in filters.items():
                sql += f" AND {col} = ?"
                params.append(val)
        sql += " ORDER BY created_at DESC"
        async with self._conn.execute(sql, params) as cur:
            rows = await cur.fetchall()
        return [dict(r) for r in rows]

    async def update_result(
        self,
        bet_id: int,
        result: str,
        profit_loss: float,
        clv: Optional[float] = None,
    ) -> None:
        """Grade a bet once the game has concluded."""
        stake_pct_row = await self._conn.execute("SELECT stake_pct FROM bets WHERE id=?", (bet_id,))
        row = await stake_pct_row.fetchone()
        roi = (profit_loss / row["stake_pct"]) * 100.0 if row and row["stake_pct"] else None
        await self._conn.execute(
            "UPDATE bets SET result=?, profit_loss=?, roi=?, closing_line_value=? WHERE id=?",
            (result, profit_loss, roi, clv, bet_id),
        )
        await self._conn.commit()
        logger.debug("Updated bet id=%s  result=%s  pl=%.2f", bet_id, result, profit_loss)

    # ------------------------------------------------------------------
    # Performance stats
    # ------------------------------------------------------------------

    async def get_performance_stats(self, days: int = 90) -> List[Dict[str, Any]]:
        """Aggregate ROI, CLV, win rate grouped by sport and market."""
        sql = """
            SELECT
                sport,
                market,
                classification,
                COUNT(*)                                    AS total_bets,
                SUM(CASE WHEN result='WIN' THEN 1 ELSE 0 END) AS wins,
                SUM(CASE WHEN result='LOSS' THEN 1 ELSE 0 END) AS losses,
                SUM(CASE WHEN result='PUSH' THEN 1 ELSE 0 END) AS pushes,
                SUM(stake_pct)                              AS total_staked,
                SUM(COALESCE(profit_loss, 0))               AS total_profit,
                AVG(COALESCE(roi, 0))                       AS avg_roi,
                AVG(COALESCE(closing_line_value, 0))        AS avg_clv,
                AVG(expected_value)                         AS avg_ev,
                AVG(confidence_score)                       AS avg_confidence
            FROM bets
            WHERE result IS NOT NULL
              AND date >= date('now', ? || ' days')
            GROUP BY sport, market, classification
            ORDER BY avg_roi DESC
        """
        async with self._conn.execute(sql, (f"-{days}",)) as cur:
            rows = await cur.fetchall()
        return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # Model weights
    # ------------------------------------------------------------------

    async def save_model_weights(self, weights: Dict[str, Any]) -> None:
        """Insert a new model weights snapshot."""
        sql = """
            INSERT INTO model_weights
                (ev_weight, win_prob_weight, confidence_weight, clv_weight, sport_modifiers, sample_size, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        await self._conn.execute(
            sql,
            (
                weights.get("ev_weight", 0.40),
                weights.get("win_prob_weight", 0.30),
                weights.get("confidence_weight", 0.20),
                weights.get("clv_weight", 0.10),
                json.dumps(weights.get("sport_modifiers", {})),
                weights.get("sample_size", 0),
                weights.get("notes"),
            ),
        )
        await self._conn.commit()
        logger.info("Saved model weights snapshot")

    async def get_model_weights(self) -> Dict[str, Any]:
        """Return the most recent model weights row as a dict."""
        async with self._conn.execute(
            "SELECT * FROM model_weights ORDER BY updated_at DESC LIMIT 1"
        ) as cur:
            row = await cur.fetchone()
        if row is None:
            return {
                "ev_weight": 0.40,
                "win_prob_weight": 0.30,
                "confidence_weight": 0.20,
                "clv_weight": 0.10,
                "sport_modifiers": {},
                "sample_size": 0,
            }
        d = dict(row)
        d["sport_modifiers"] = json.loads(d.get("sport_modifiers", "{}"))
        return d

    # ------------------------------------------------------------------
    # ELO ratings
    # ------------------------------------------------------------------

    async def save_elo_rating(self, sport: str, team: str, rating: float, games: int) -> None:
        sql = """
            INSERT INTO elo_ratings (sport, team, rating, games)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(sport, team) DO UPDATE SET
                rating=excluded.rating,
                games=excluded.games,
                updated_at=datetime('now')
        """
        await self._conn.execute(sql, (sport, team, rating, games))
        await self._conn.commit()

    async def get_elo_ratings(self, sport: str) -> Dict[str, float]:
        async with self._conn.execute(
            "SELECT team, rating FROM elo_ratings WHERE sport=?", (sport,)
        ) as cur:
            rows = await cur.fetchall()
        return {r["team"]: r["rating"] for r in rows}
