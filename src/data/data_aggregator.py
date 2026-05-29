"""
Orchestrates all data fetchers and assembles GameDossier objects.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from src.data.injury_fetcher import InjuryFetcher
from src.data.odds_fetcher import OddsFetcher
from src.data.stats_fetcher import StatsFetcher
from src.data.weather_fetcher import WeatherFetcher, OUTDOOR_SPORTS

logger = logging.getLogger(__name__)

SPORT_LEAGUE_PARTS = {
    "americanfootball_nfl": ("football", "nfl"),
    "americanfootball_ncaaf": ("football", "college-football"),
    "basketball_nba": ("basketball", "nba"),
    "basketball_ncaab": ("basketball", "mens-college-basketball"),
    "baseball_mlb": ("baseball", "mlb"),
    "icehockey_nhl": ("hockey", "nhl"),
    "soccer_usa_mls": ("soccer", "usa.1"),
    "mma_mixed_martial_arts": ("mma", "ufc"),
    "tennis_atp_french_open": ("tennis", "atp"),
}

# Venue city lookup for outdoor sports
TEAM_CITY: Dict[str, str] = {
    "Kansas City Chiefs": "Kansas City",
    "Buffalo Bills": "Buffalo",
    "San Francisco 49ers": "San Francisco",
    "Philadelphia Eagles": "Philadelphia",
    "Dallas Cowboys": "Dallas",
    "New York Giants": "New York",
    "New York Jets": "New York",
    "New England Patriots": "Boston",
    "Chicago Bears": "Chicago",
    "Denver Broncos": "Denver",
    "Seattle Seahawks": "Seattle",
    "Pittsburgh Steelers": "Pittsburgh",
    "Green Bay Packers": "Green Bay",
    "Cleveland Browns": "Cleveland",
    "Baltimore Ravens": "Baltimore",
    "Minnesota Vikings": "Minnesota",
    "Detroit Lions": "Detroit",
    "Cincinnati Bengals": "Cincinnati",
    "Indianapolis Colts": "Indianapolis",
    "Tennessee Titans": "Tennessee",
    "Jacksonville Jaguars": "Jacksonville",
    "Houston Texans": "Houston",
    "Los Angeles Rams": "Los Angeles",
    "Los Angeles Chargers": "Los Angeles",
    "Miami Dolphins": "Miami",
    "Tampa Bay Buccaneers": "Tampa Bay",
    "New Orleans Saints": "New Orleans",
    "Carolina Panthers": "Carolina",
    "Atlanta Falcons": "Atlanta",
    "Washington Commanders": "Washington",
    "Arizona Cardinals": "Arizona",
    "Las Vegas Raiders": "Las Vegas",
    "New York Yankees": "New York",
    "Boston Red Sox": "Boston",
    "Los Angeles Dodgers": "Los Angeles",
    "Chicago Cubs": "Chicago",
    "Houston Astros": "Houston",
    "Atlanta Braves": "Atlanta",
}


@dataclass
class GameDossier:
    """All aggregated data for a single game, ready for agent analysis."""

    game_id: str
    sport: str
    league: str
    home_team: str
    away_team: str
    commence_time: str

    # Raw odds
    odds_data: Dict[str, Any] = field(default_factory=dict)
    consensus_line: Dict[str, float] = field(default_factory=dict)

    # Team stats
    home_team_stats: Dict[str, Any] = field(default_factory=dict)
    away_team_stats: Dict[str, Any] = field(default_factory=dict)

    # Injuries
    home_injuries: List[Dict[str, Any]] = field(default_factory=list)
    away_injuries: List[Dict[str, Any]] = field(default_factory=list)

    # Weather (outdoor sports only)
    weather: Optional[Dict[str, Any]] = None

    # Historical context
    historical_matchups: List[Dict[str, Any]] = field(default_factory=list)

    # Player props
    player_props: List[Dict[str, Any]] = field(default_factory=list)

    # Quality
    data_quality_score: float = 0.0
    missing_data_flags: List[str] = field(default_factory=list)
    data_conflicts: List[str] = field(default_factory=list)

    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


def _score_dossier(dossier: GameDossier) -> float:
    """Compute a 0-100 data quality score based on completeness."""
    score = 0.0
    max_score = 100.0

    # Odds data (30 pts)
    if dossier.odds_data:
        score += 20.0
        if len(dossier.odds_data.get("bookmakers", [])) >= 3:
            score += 10.0

    # Team stats (20 pts each = 40 pts)
    if dossier.home_team_stats and dossier.home_team_stats.get("source") != "demo":
        score += 20.0
    elif dossier.home_team_stats:
        score += 10.0

    if dossier.away_team_stats and dossier.away_team_stats.get("source") != "demo":
        score += 20.0
    elif dossier.away_team_stats:
        score += 10.0

    # Injuries (10 pts)
    if dossier.home_injuries or dossier.away_injuries:
        score += 10.0

    # Weather for outdoor sports (10 pts)
    if dossier.weather is not None:
        if dossier.weather.get("source") != "demo":
            score += 10.0
        else:
            score += 5.0

    # Historical matchups (10 pts)
    if dossier.historical_matchups:
        score += 10.0

    # Player props (10 pts)
    if dossier.player_props:
        score += 10.0

    return min(score, max_score)


class DataAggregator:
    """Orchestrates all data fetchers to build GameDossier objects."""

    def __init__(
        self,
        odds_fetcher: OddsFetcher,
        injury_fetcher: InjuryFetcher,
        weather_fetcher: WeatherFetcher,
        stats_fetcher: StatsFetcher,
    ) -> None:
        self.odds = odds_fetcher
        self.injuries = injury_fetcher
        self.weather = weather_fetcher
        self.stats = stats_fetcher

    async def _build_dossier(
        self,
        game: Dict[str, Any],
        sport: str,
        all_injuries: List[Dict[str, Any]],
    ) -> GameDossier:
        """Build a single GameDossier from pre-fetched data + per-game calls."""
        espn_sport, espn_league = SPORT_LEAGUE_PARTS.get(sport, (sport, sport))

        home = game.get("home_team", "")
        away = game.get("away_team", "")
        game_id = game.get("id", f"{home}_vs_{away}")

        # Filter injuries by team name
        home_inj = [i for i in all_injuries if home.lower() in i.get("team", "").lower()]
        away_inj = [i for i in all_injuries if away.lower() in i.get("team", "").lower()]

        # Build consensus line
        from src.data.odds_fetcher import OddsFetcher as OF
        consensus = OF.consensus_line(game)

        # Concurrent: stats + props + weather + h2h
        home_stats_coro = self.stats.fetch_team_stats(espn_sport, espn_league, home)
        away_stats_coro = self.stats.fetch_team_stats(espn_sport, espn_league, away)
        props_coro = self.stats.fetch_player_props_data(espn_sport, espn_league, game_id)
        h2h_coro = self.stats.fetch_historical_matchups(home, away, sport)

        weather_result = None
        if sport in OUTDOOR_SPORTS:
            venue_city = TEAM_CITY.get(home, home.split()[-1])
            weather_coro = self.weather.fetch_weather(venue_city)
            home_stats, away_stats, props, h2h, weather_result = await asyncio.gather(
                home_stats_coro, away_stats_coro, props_coro, h2h_coro, weather_coro,
                return_exceptions=True,
            )
        else:
            home_stats, away_stats, props, h2h = await asyncio.gather(
                home_stats_coro, away_stats_coro, props_coro, h2h_coro,
                return_exceptions=True,
            )

        def safe(val, default):
            return default if isinstance(val, Exception) else val

        dossier = GameDossier(
            game_id=game_id,
            sport=sport,
            league=espn_league,
            home_team=home,
            away_team=away,
            commence_time=game.get("commence_time", ""),
            odds_data=game,
            consensus_line=consensus,
            home_team_stats=safe(home_stats, {}),
            away_team_stats=safe(away_stats, {}),
            home_injuries=home_inj,
            away_injuries=away_inj,
            weather=safe(weather_result, None),
            historical_matchups=safe(h2h, []),
            player_props=safe(props, []),
        )

        # Missing data flags
        if not dossier.home_team_stats:
            dossier.missing_data_flags.append(f"Missing stats for {home}")
        if not dossier.away_team_stats:
            dossier.missing_data_flags.append(f"Missing stats for {away}")
        if not dossier.player_props:
            dossier.missing_data_flags.append("No player props data")
        if sport in OUTDOOR_SPORTS and dossier.weather is None:
            dossier.missing_data_flags.append("No weather data for outdoor game")

        dossier.data_quality_score = _score_dossier(dossier)
        return dossier

    async def aggregate_game_data(self, sport: str) -> List[GameDossier]:
        """
        Fetch all data for a sport and return a list of GameDossier objects.
        Concurrent fetching at the sport level.
        """
        logger.info("Aggregating data for sport: %s", sport)
        espn_sport, espn_league = SPORT_LEAGUE_PARTS.get(sport, (sport, sport))

        # Fetch odds + injuries concurrently
        odds_coro = self.odds.fetch_odds(sport)
        injuries_coro = self.injuries.fetch_injuries(espn_sport, espn_league)

        games_raw, all_injuries = await asyncio.gather(
            odds_coro, injuries_coro, return_exceptions=True
        )

        if isinstance(games_raw, Exception):
            logger.error("Odds fetch failed for %s: %s", sport, games_raw)
            games_raw = []
        if isinstance(all_injuries, Exception):
            logger.warning("Injury fetch failed for %s: %s", sport, all_injuries)
            all_injuries = []

        # Build dossiers concurrently for each game
        dossier_tasks = [
            self._build_dossier(game, sport, all_injuries)
            for game in games_raw
        ]
        dossiers = await asyncio.gather(*dossier_tasks, return_exceptions=True)

        result = []
        for d in dossiers:
            if isinstance(d, Exception):
                logger.error("Dossier build failed: %s", d)
            else:
                result.append(d)

        logger.info(
            "Built %d dossiers for %s (avg quality: %.1f)",
            len(result),
            sport,
            sum(d.data_quality_score for d in result) / max(len(result), 1),
        )
        return result
