"""
Fetches team stats, player props data, and historical matchups from ESPN.
"""

import logging
import random
from typing import Any, Dict, List

import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

ESPN_TEAMS_URL = "https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams/{team_id}"
ESPN_STANDINGS_URL = "https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/standings"
ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard"
ESPN_SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/summary"

SPORT_LEAGUE_MAP = {
    "americanfootball_nfl": ("football", "nfl"),
    "americanfootball_ncaaf": ("football", "college-football"),
    "basketball_nba": ("basketball", "nba"),
    "basketball_ncaab": ("basketball", "mens-college-basketball"),
    "baseball_mlb": ("baseball", "mlb"),
    "icehockey_nhl": ("hockey", "nhl"),
    "soccer_usa_mls": ("soccer", "usa.1"),
    "mma_mixed_martial_arts": ("mma", "ufc"),
}


def _generate_demo_team_stats(sport_key: str, team: str) -> Dict[str, Any]:
    """Generate plausible synthetic team stats for demo/fallback mode."""
    rng = random.Random(hash(team) % 10000)
    base = {
        "team": team,
        "sport": sport_key,
        "record": f"{rng.randint(5, 14)}-{rng.randint(3, 10)}",
        "offensive_rating": round(rng.uniform(95.0, 120.0), 1),
        "defensive_rating": round(rng.uniform(95.0, 120.0), 1),
        "pace": round(rng.uniform(90.0, 105.0), 1),
        "points_per_game": round(rng.uniform(95.0, 120.0) if "basketball" in sport_key else rng.uniform(18.0, 32.0), 1),
        "points_allowed_per_game": round(rng.uniform(95.0, 120.0) if "basketball" in sport_key else rng.uniform(18.0, 32.0), 1),
        "home_record": f"{rng.randint(4, 8)}-{rng.randint(1, 5)}",
        "away_record": f"{rng.randint(2, 7)}-{rng.randint(2, 6)}",
        "last_5": [rng.choice(["W", "L"]) for _ in range(5)],
        "last_10": [rng.choice(["W", "L"]) for _ in range(10)],
        "ats_record": f"{rng.randint(5, 12)}-{rng.randint(4, 11)}",
        "over_under_record": f"{rng.randint(4, 11)}-{rng.randint(4, 11)}",
        "streak": f"{rng.choice(['W', 'L'])}{rng.randint(1, 5)}",
        "source": "demo",
    }
    return base


def _generate_demo_props(sport_key: str, game_id: str) -> List[Dict[str, Any]]:
    """Generate synthetic player props for demo mode."""
    rng = random.Random(hash(game_id) % 10000)
    props = []
    if "basketball" in sport_key:
        players = ["Star Guard A", "Star Forward B", "Center C", "Sixth Man D"]
        for p in players:
            line = round(rng.uniform(14.5, 32.5), 1)
            props.append({
                "player": p,
                "prop_type": "points",
                "line": line,
                "over_odds": rng.choice([-115, -110, -105]),
                "under_odds": rng.choice([-115, -110, -105]),
                "season_avg": round(line + rng.uniform(-3, 3), 1),
                "last_5_avg": round(line + rng.uniform(-4, 4), 1),
                "source": "demo",
            })
    elif "football" in sport_key:
        qb_yds = round(rng.uniform(219.5, 289.5), 1)
        props.append({
            "player": "Starting QB",
            "prop_type": "passing_yards",
            "line": qb_yds,
            "over_odds": -110,
            "under_odds": -110,
            "season_avg": round(qb_yds + rng.uniform(-15, 15), 1),
            "last_5_avg": round(qb_yds + rng.uniform(-20, 20), 1),
            "source": "demo",
        })
    elif "baseball" in sport_key:
        k_line = round(rng.uniform(4.5, 8.5), 1)
        props.append({
            "player": "Starting Pitcher",
            "prop_type": "strikeouts",
            "line": k_line,
            "over_odds": rng.choice([-130, -120, -115]),
            "under_odds": rng.choice([110, 100, -105]),
            "season_avg": round(k_line + rng.uniform(-1.5, 1.5), 1),
            "last_5_avg": round(k_line + rng.uniform(-2, 2), 1),
            "source": "demo",
        })
    return props


class StatsFetcher:
    """Fetches team stats and player prop data from ESPN."""

    def __init__(self) -> None:
        self._session: aiohttp.ClientSession | None = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=20),
                headers={"User-Agent": "Mozilla/5.0 (compatible; BettingBot/1.0)"},
            )
        return self._session

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=5))
    async def _safe_get(self, url: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        session = await self._get_session()
        async with session.get(url, params=params or {}) as resp:
            if resp.status != 200:
                return {}
            return await resp.json()

    async def fetch_team_stats(self, sport: str, league: str, team: str) -> Dict[str, Any]:
        """
        Fetch team stats from ESPN. Falls back to demo data on error.
        Returns dict with offensive/defensive ratings, pace, record, recent form.
        """
        espn_sport, espn_league = SPORT_LEAGUE_MAP.get(
            f"{sport}_{league}", (sport, league)
        )

        # Try standings for record data
        standings_url = ESPN_STANDINGS_URL.format(sport=espn_sport, league=espn_league)
        try:
            data = await self._safe_get(standings_url)
            children = data.get("children", [])
            for division in children:
                for entry in division.get("standings", {}).get("entries", []):
                    team_info = entry.get("team", {})
                    if team.lower() in team_info.get("displayName", "").lower():
                        stats = entry.get("stats", [])
                        stats_dict = {s["name"]: s.get("value") for s in stats if "name" in s}
                        return {
                            "team": team_info.get("displayName", team),
                            "sport": sport,
                            "wins": stats_dict.get("wins", 0),
                            "losses": stats_dict.get("losses", 0),
                            "win_pct": stats_dict.get("winPercent", 0.0),
                            "points_per_game": stats_dict.get("pointsPerGame", 0.0),
                            "points_allowed_per_game": stats_dict.get("opponentPointsPerGame", 0.0),
                            "last_5": [],
                            "last_10": [],
                            "source": "espn_standings",
                        }
        except Exception as exc:
            logger.debug("ESPN standings fetch failed for %s: %s", team, exc)

        # Fallback
        return _generate_demo_team_stats(sport, team)

    async def fetch_player_props_data(self, sport: str, league: str, game_id: str) -> List[Dict[str, Any]]:
        """
        Fetch player props-relevant statistics for a game.
        Returns list of player prop dicts.
        """
        espn_sport, espn_league = SPORT_LEAGUE_MAP.get(
            f"{sport}_{league}", (sport, league)
        )
        url = ESPN_SUMMARY_URL.format(sport=espn_sport, league=espn_league)
        try:
            data = await self._safe_get(url, params={"event": game_id})
            # ESPN summary has boxscore leaders
            leaders = data.get("leaders", [])
            props = []
            for leader_cat in leaders:
                cat_name = leader_cat.get("name", "")
                for leader in leader_cat.get("leaders", []):
                    athlete = leader.get("athlete", {})
                    props.append({
                        "player": athlete.get("displayName", "Unknown"),
                        "prop_type": cat_name,
                        "season_avg": leader.get("value", 0.0),
                        "line": 0.0,
                        "over_odds": -110,
                        "under_odds": -110,
                        "last_5_avg": leader.get("value", 0.0),
                        "source": "espn_leaders",
                    })
            if props:
                return props
        except Exception as exc:
            logger.debug("ESPN summary failed for game %s: %s", game_id, exc)

        return _generate_demo_props(sport, game_id)

    async def fetch_historical_matchups(self, team1: str, team2: str, sport: str) -> List[Dict[str, Any]]:
        """
        Fetch recent head-to-head matchup history.
        Returns list of historical game dicts.
        """
        # ESPN doesn't provide a clean H2H endpoint via unofficial API.
        # Return synthetic historical matchup data for now.
        rng = random.Random(hash(team1 + team2) % 10000)
        matchups = []
        for i in range(5):
            t1_score = rng.randint(17, 38) if "football" in sport else rng.randint(90, 130)
            t2_score = rng.randint(17, 38) if "football" in sport else rng.randint(90, 130)
            matchups.append({
                "date": f"2024-{rng.randint(1,12):02d}-{rng.randint(1,28):02d}",
                "home_team": team1 if i % 2 == 0 else team2,
                "away_team": team2 if i % 2 == 0 else team1,
                "home_score": t1_score if i % 2 == 0 else t2_score,
                "away_score": t2_score if i % 2 == 0 else t1_score,
                "winner": team1 if t1_score > t2_score else team2,
                "total": t1_score + t2_score,
                "source": "demo",
            })
        return matchups
