"""
Fetches odds from The Odds API v4.
Falls back to a realistic demo dataset when ODDS_API_KEY is not set.
"""

import asyncio
import logging
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List

import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

ODDS_API_BASE = "https://api.the-odds-api.com/v4"

SUPPORTED_SPORTS = [
    "americanfootball_nfl",
    "americanfootball_ncaaf",
    "basketball_nba",
    "basketball_ncaab",
    "baseball_mlb",
    "icehockey_nhl",
    "soccer_usa_mls",
    "tennis_atp_french_open",
    "mma_mixed_martial_arts",
]

# Demo teams for mock data
_DEMO_TEAMS: Dict[str, List[tuple]] = {
    "americanfootball_nfl": [
        ("Kansas City Chiefs", "Buffalo Bills"),
        ("San Francisco 49ers", "Philadelphia Eagles"),
        ("Dallas Cowboys", "New York Giants"),
    ],
    "basketball_nba": [
        ("Boston Celtics", "Miami Heat"),
        ("Golden State Warriors", "Los Angeles Lakers"),
        ("Denver Nuggets", "Phoenix Suns"),
    ],
    "baseball_mlb": [
        ("New York Yankees", "Boston Red Sox"),
        ("Los Angeles Dodgers", "San Francisco Giants"),
        ("Houston Astros", "Atlanta Braves"),
    ],
    "icehockey_nhl": [
        ("Colorado Avalanche", "Tampa Bay Lightning"),
        ("Vegas Golden Knights", "Toronto Maple Leafs"),
        ("Boston Bruins", "New York Rangers"),
    ],
    "americanfootball_ncaaf": [
        ("Alabama Crimson Tide", "Georgia Bulldogs"),
        ("Ohio State Buckeyes", "Michigan Wolverines"),
    ],
    "basketball_ncaab": [
        ("Duke Blue Devils", "North Carolina Tar Heels"),
        ("Kansas Jayhawks", "Kentucky Wildcats"),
    ],
    "soccer_usa_mls": [
        ("LA Galaxy", "LAFC"),
        ("Seattle Sounders", "Portland Timbers"),
    ],
    "mma_mixed_martial_arts": [
        ("Jon Jones", "Stipe Miocic"),
        ("Islam Makhachev", "Dustin Poirier"),
    ],
    "tennis_atp_french_open": [
        ("Carlos Alcaraz", "Novak Djokovic"),
        ("Jannik Sinner", "Casper Ruud"),
    ],
}


def _make_american_odds(home_prob: float) -> tuple:
    """Convert probability to American odds for both sides."""
    away_prob = 1.0 - home_prob
    # Add ~4% vig
    home_vig_prob = home_prob * 1.04
    away_vig_prob = away_prob * 1.04

    def prob_to_american(p: float) -> int:
        if p >= 0.5:
            return -round((p / (1 - p)) * 100 / 5) * 5
        else:
            return round(((1 - p) / p) * 100 / 5) * 5

    return prob_to_american(home_vig_prob), prob_to_american(away_vig_prob)


def _generate_demo_games(sport: str) -> List[Dict[str, Any]]:
    """Generate realistic demo game data when API key is absent."""
    teams = _DEMO_TEAMS.get(sport, [])
    games = []
    now = datetime.utcnow()
    for i, (home, away) in enumerate(teams):
        home_prob = random.uniform(0.40, 0.65)
        h_ml, a_ml = _make_american_odds(home_prob)
        spread = round(random.uniform(-7.5, -2.5), 1) if home_prob > 0.5 else round(random.uniform(2.5, 7.5), 1)
        total = round(random.uniform(38.5, 52.5), 1) if "football" in sport else round(random.uniform(210.5, 230.5), 1)

        commence = now + timedelta(hours=random.randint(6, 48))

        game = {
            "id": f"demo_{sport}_{i}",
            "sport_key": sport,
            "sport_title": sport.replace("_", " ").title(),
            "commence_time": commence.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "home_team": home,
            "away_team": away,
            "bookmakers": [
                {
                    "key": "draftkings",
                    "title": "DraftKings",
                    "last_update": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "markets": [
                        {
                            "key": "h2h",
                            "outcomes": [
                                {"name": home, "price": h_ml},
                                {"name": away, "price": a_ml},
                            ],
                        },
                        {
                            "key": "spreads",
                            "outcomes": [
                                {"name": home, "price": -110, "point": spread},
                                {"name": away, "price": -110, "point": -spread},
                            ],
                        },
                        {
                            "key": "totals",
                            "outcomes": [
                                {"name": "Over", "price": -110, "point": total},
                                {"name": "Under", "price": -110, "point": total},
                            ],
                        },
                    ],
                },
                {
                    "key": "fanduel",
                    "title": "FanDuel",
                    "last_update": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "markets": [
                        {
                            "key": "h2h",
                            "outcomes": [
                                {"name": home, "price": h_ml + random.randint(-5, 5)},
                                {"name": away, "price": a_ml + random.randint(-5, 5)},
                            ],
                        },
                    ],
                },
            ],
        }
        games.append(game)
    return games


class OddsFetcher:
    """Fetches odds from The Odds API v4, with demo fallback."""

    def __init__(self, api_key: str = "") -> None:
        self.api_key = api_key
        self.demo_mode = not bool(api_key)
        self._session: aiohttp.ClientSession | None = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30)
            )
        return self._session

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _api_get(self, url: str, params: Dict[str, Any]) -> Any:
        session = await self._get_session()
        async with session.get(url, params=params) as resp:
            remaining = resp.headers.get("x-requests-remaining", "?")
            logger.debug("Odds API  status=%s  remaining=%s  url=%s", resp.status, remaining, url)
            resp.raise_for_status()
            return await resp.json()

    async def fetch_odds(self, sport: str, markets: List[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch odds for a sport. Returns list of game dicts.
        Falls back to demo data if ODDS_API_KEY is not set.
        """
        if markets is None:
            markets = ["h2h", "spreads", "totals"]

        if self.demo_mode:
            logger.info("Demo mode — generating synthetic odds for %s", sport)
            return _generate_demo_games(sport)

        url = f"{ODDS_API_BASE}/sports/{sport}/odds"
        params = {
            "apiKey": self.api_key,
            "regions": "us",
            "markets": ",".join(markets),
            "oddsFormat": "american",
            "dateFormat": "iso",
        }
        try:
            data = await self._api_get(url, params)
            logger.info("Fetched %d games for %s", len(data), sport)
            return data
        except Exception as exc:
            logger.error("Failed to fetch odds for %s: %s — using demo data", sport, exc)
            return _generate_demo_games(sport)

    async def fetch_all_sports(self, markets: List[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """Fetch odds for all supported sports concurrently."""
        tasks = {sport: self.fetch_odds(sport, markets) for sport in SUPPORTED_SPORTS}
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        output: Dict[str, List[Dict[str, Any]]] = {}
        for sport, result in zip(tasks.keys(), results):
            if isinstance(result, Exception):
                logger.error("Error fetching %s: %s", sport, result)
                output[sport] = _generate_demo_games(sport)
            else:
                output[sport] = result
        return output

    @staticmethod
    def consensus_line(game: Dict[str, Any], market_key: str = "h2h") -> Dict[str, float]:
        """Calculate consensus (average) line across all bookmakers."""
        home = game.get("home_team", "")
        prices: Dict[str, List[float]] = {}
        for bk in game.get("bookmakers", []):
            for mkt in bk.get("markets", []):
                if mkt["key"] == market_key:
                    for outcome in mkt.get("outcomes", []):
                        name = outcome["name"]
                        if name not in prices:
                            prices[name] = []
                        prices[name].append(outcome["price"])
        if not prices:
            return {}
        return {name: sum(p) / len(p) for name, p in prices.items()}
