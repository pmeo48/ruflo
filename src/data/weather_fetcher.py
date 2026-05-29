"""
Fetches weather data from OpenWeatherMap for outdoor sports venues.
Only relevant for NFL, MLB, and NCAAF outdoor games.
"""

import logging
from typing import Any, Dict

import aiohttp
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

OWM_BASE = "https://api.openweathermap.org/data/2.5/forecast"

OUTDOOR_SPORTS = {"americanfootball_nfl", "americanfootball_ncaaf", "baseball_mlb"}

# Approximate coordinates for major NFL/MLB cities (city -> (lat, lon))
CITY_COORDS: Dict[str, tuple] = {
    "Kansas City": (39.0997, -94.5786),
    "Buffalo": (42.8864, -78.8784),
    "San Francisco": (37.7749, -122.4194),
    "Philadelphia": (39.9526, -75.1652),
    "Dallas": (32.7767, -96.7970),
    "New York": (40.7128, -74.0060),
    "New England": (42.3601, -71.0589),
    "Boston": (42.3601, -71.0589),
    "Chicago": (41.8781, -87.6298),
    "Denver": (39.7392, -104.9903),
    "Seattle": (47.6062, -122.3321),
    "Pittsburgh": (40.4406, -79.9959),
    "Green Bay": (44.5133, -88.0133),
    "Cleveland": (41.4993, -81.6944),
    "Baltimore": (39.2904, -76.6122),
    "Minnesota": (44.9778, -93.2650),
    "Detroit": (42.3314, -83.0458),
    "Cincinnati": (39.1031, -84.5120),
    "Indianapolis": (39.7684, -86.1581),
    "Tennessee": (36.1627, -86.7816),
    "Jacksonville": (30.3322, -81.6557),
    "Houston": (29.7604, -95.3698),
    "Los Angeles": (34.0522, -118.2437),
    "Miami": (25.7617, -80.1918),
    "Tampa Bay": (27.9506, -82.4572),
    "New Orleans": (29.9511, -90.0715),
    "Carolina": (35.2271, -80.8431),
    "Atlanta": (33.7490, -84.3880),
    "Washington": (38.9072, -77.0369),
    "Arizona": (33.4484, -112.0740),
    "Las Vegas": (36.1699, -115.1398),
}


def _celsius_to_fahrenheit(c: float) -> float:
    return c * 9 / 5 + 32


def _mps_to_mph(mps: float) -> float:
    return mps * 2.23694


def _calculate_impact_score(temp_f: float, wind_mph: float, precip_chance: float, conditions: str) -> float:
    """
    Returns 0-10 weather impact score where higher = more disruptive to game play.
    Primarily relevant for passing/kicking in football and fielding in baseball.
    """
    score = 0.0
    conds_lower = conditions.lower()

    # Wind impact (most important for NFL/NCAAF kicking/passing)
    if wind_mph > 30:
        score += 5.0
    elif wind_mph > 20:
        score += 3.0
    elif wind_mph > 15:
        score += 1.5
    elif wind_mph > 10:
        score += 0.5

    # Precipitation
    if precip_chance > 70:
        score += 2.5
    elif precip_chance > 50:
        score += 2.0
    elif precip_chance > 30:
        score += 1.0

    # Temperature extremes
    if temp_f < 20:
        score += 2.0
    elif temp_f < 32:
        score += 1.5
    elif temp_f < 40:
        score += 0.5
    elif temp_f > 95:
        score += 1.0

    # Conditions keywords
    if any(kw in conds_lower for kw in ("snow", "blizzard", "freezing")):
        score += 2.0
    elif any(kw in conds_lower for kw in ("rain", "drizzle", "shower")):
        score += 1.0
    elif any(kw in conds_lower for kw in ("thunderstorm", "storm")):
        score += 3.0
    elif any(kw in conds_lower for kw in ("fog", "mist")):
        score += 0.5

    return min(score, 10.0)


class WeatherFetcher:
    """Fetches weather for outdoor sports venues via OpenWeatherMap."""

    def __init__(self, api_key: str = "") -> None:
        self.api_key = api_key
        self._session: aiohttp.ClientSession | None = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15))
        return self._session

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=5))
    async def _api_get(self, params: Dict[str, Any]) -> Dict[str, Any]:
        session = await self._get_session()
        async with session.get(OWM_BASE, params=params) as resp:
            resp.raise_for_status()
            return await resp.json()

    def _demo_weather(self, city: str) -> Dict[str, Any]:
        """Return benign demo weather when API key absent."""
        return {
            "city": city,
            "temp_f": 68.0,
            "wind_mph": 8.0,
            "wind_direction": "SW",
            "precipitation_chance": 10.0,
            "conditions": "Clear sky",
            "weather_impact_score": 0.5,
            "source": "demo",
        }

    async def fetch_weather(self, city: str, state: str = "") -> Dict[str, Any]:
        """
        Fetch weather for a city/state. Returns structured weather dict.
        Falls back gracefully when API key is not set.
        """
        if not self.api_key:
            logger.debug("No OPENWEATHER_API_KEY — returning demo weather for %s", city)
            return self._demo_weather(city)

        # Try to get coordinates from our lookup table, else use city name query
        coords = CITY_COORDS.get(city)
        params: Dict[str, Any] = {"appid": self.api_key, "units": "metric", "cnt": 3}

        if coords:
            params["lat"] = coords[0]
            params["lon"] = coords[1]
        else:
            query = f"{city},{state},US" if state else f"{city},US"
            params["q"] = query

        try:
            data = await self._api_get(params)
        except Exception as exc:
            logger.warning("Weather API failed for %s: %s", city, exc)
            return self._demo_weather(city)

        # Parse first forecast entry (closest to game time)
        items = data.get("list", [])
        if not items:
            return self._demo_weather(city)

        item = items[0]
        main = item.get("main", {})
        wind = item.get("wind", {})
        weather_list = item.get("weather", [{}])
        pop = item.get("pop", 0.0)  # probability of precipitation (0-1)

        temp_c = main.get("temp", 20.0)
        temp_f = _celsius_to_fahrenheit(temp_c)
        wind_mps = wind.get("speed", 0.0)
        wind_mph = _mps_to_mph(wind_mps)
        wind_deg = wind.get("deg", 0)
        conditions = weather_list[0].get("description", "Unknown")
        precip_pct = pop * 100.0

        # Wind direction cardinal
        directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        wind_direction = directions[round(wind_deg / 45) % 8]

        impact = _calculate_impact_score(temp_f, wind_mph, precip_pct, conditions)

        return {
            "city": city,
            "temp_f": round(temp_f, 1),
            "wind_mph": round(wind_mph, 1),
            "wind_direction": wind_direction,
            "precipitation_chance": round(precip_pct, 1),
            "conditions": conditions.title(),
            "weather_impact_score": round(impact, 2),
            "source": "openweathermap",
        }
