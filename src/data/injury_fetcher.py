"""
Fetches injury and roster news from the ESPN unofficial API.
"""

import logging
from typing import Any, Dict, List

import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

ESPN_NEWS_URL = "https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/news"
ESPN_INJURIES_URL = "https://site.web.api.espn.com/apis/site/v2/sports/{sport}/{league}/injuries"

# Keywords that suggest high-impact injury
_HIGH_IMPACT_KEYWORDS = {"out", "doubtful", "ir", "injured reserve", "season-ending", "surgery"}
_MEDIUM_IMPACT_KEYWORDS = {"questionable", "limited", "day-to-day", "probable"}

# High-value positions by sport
_HIGH_VALUE_POSITIONS: Dict[str, set] = {
    "football": {"QB", "RB", "WR1", "TE", "LT"},
    "basketball": {"PG", "SG", "SF", "C"},
    "baseball": {"SP", "CL", "SS", "1B", "CF"},
    "hockey": {"G", "C", "LW"},
    "soccer": {"GK", "CF", "CAM"},
}


def _classify_impact(status: str, position: str, sport: str) -> str:
    status_lower = status.lower()
    sport_key = sport.split("_")[0] if "_" in sport else sport

    if any(kw in status_lower for kw in _HIGH_IMPACT_KEYWORDS):
        level = "HIGH"
    elif any(kw in status_lower for kw in _MEDIUM_IMPACT_KEYWORDS):
        level = "MEDIUM"
    else:
        level = "LOW"

    # Upgrade to HIGH if it is a marquee position
    high_pos = _HIGH_VALUE_POSITIONS.get(sport_key, set())
    if position.upper() in high_pos and level == "MEDIUM":
        level = "HIGH"

    return level


def _parse_news_item(item: Dict[str, Any], sport: str) -> Dict[str, Any] | None:
    """Extract injury-relevant fields from an ESPN news item."""
    headline = item.get("headline", "")
    description = item.get("description", "")
    combined = (headline + " " + description).lower()

    injury_keywords = {"injur", "out", "doubtful", "questionable", "ir ", "inactive", "surgery", "miss"}
    if not any(kw in combined for kw in injury_keywords):
        return None

    categories = item.get("categories", [])
    athlete_name = ""
    team_name = ""
    for cat in categories:
        if cat.get("type") == "athlete":
            athlete_name = cat.get("description", "")
        elif cat.get("type") == "team":
            team_name = cat.get("description", "")

    if not athlete_name:
        return None

    return {
        "player": athlete_name,
        "team": team_name,
        "status": _infer_status(combined),
        "description": description or headline,
        "impact_level": _classify_impact(_infer_status(combined), "", sport),
        "source": "espn_news",
    }


def _infer_status(text: str) -> str:
    if "season-ending" in text or "injured reserve" in text or " ir " in text:
        return "Out (IR)"
    if " out " in text or "ruled out" in text:
        return "Out"
    if "doubtful" in text:
        return "Doubtful"
    if "questionable" in text:
        return "Questionable"
    if "probable" in text:
        return "Probable"
    if "limited" in text or "day-to-day" in text:
        return "Day-to-Day"
    return "Unknown"


def _parse_injury_entry(entry: Dict[str, Any], sport: str) -> Dict[str, Any]:
    """Parse a structured ESPN injuries endpoint entry."""
    athlete = entry.get("athlete", {})
    position = athlete.get("position", {}).get("abbreviation", "")
    status = entry.get("status", entry.get("type", {}).get("description", "Unknown"))
    return {
        "player": athlete.get("displayName", "Unknown"),
        "team": entry.get("team", {}).get("displayName", ""),
        "status": status,
        "description": entry.get("details", ""),
        "position": position,
        "impact_level": _classify_impact(status, position, sport),
        "source": "espn_injuries",
    }


class InjuryFetcher:
    """Fetches injuries and relevant roster news from ESPN unofficial APIs."""

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
    async def _safe_get(self, url: str) -> Any:
        session = await self._get_session()
        async with session.get(url) as resp:
            if resp.status != 200:
                logger.warning("ESPN API returned %s for %s", resp.status, url)
                return {}
            return await resp.json()

    async def fetch_injuries(self, sport: str, league: str) -> List[Dict[str, Any]]:
        """
        Fetch injury data for a sport/league combination.
        Returns list of injury dicts with player, team, status, description, impact_level.
        """
        injuries: List[Dict[str, Any]] = []

        # --- Attempt structured injuries endpoint ---
        inj_url = ESPN_INJURIES_URL.format(sport=sport, league=league)
        try:
            data = await self._safe_get(inj_url)
            entries = data.get("injuries", [])
            if not isinstance(entries, list):
                # Sometimes it's nested under a key
                for v in data.values():
                    if isinstance(v, list):
                        entries = v
                        break
            for entry in entries:
                injuries.append(_parse_injury_entry(entry, sport))
            logger.info("ESPN injuries endpoint: %d entries for %s/%s", len(injuries), sport, league)
        except Exception as exc:
            logger.warning("ESPN injuries endpoint failed for %s/%s: %s", sport, league, exc)

        # --- Also pull news feed for additional context ---
        news_url = ESPN_NEWS_URL.format(sport=sport, league=league)
        try:
            data = await self._safe_get(news_url)
            articles = data.get("articles", [])
            for article in articles[:30]:  # limit to latest 30
                parsed = _parse_news_item(article, sport)
                if parsed:
                    # Avoid duplicates
                    known_players = {i["player"] for i in injuries}
                    if parsed["player"] not in known_players:
                        injuries.append(parsed)
            logger.info("ESPN news feed: total injuries now %d for %s/%s", len(injuries), sport, league)
        except Exception as exc:
            logger.warning("ESPN news feed failed for %s/%s: %s", sport, league, exc)

        return injuries
