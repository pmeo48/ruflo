"""
Research Agent — gathers, validates and scores all betting-relevant information.
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import anthropic

from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an elite sports betting research analyst working for a professional betting syndicate.

Your job is to evaluate raw game data and produce a structured research dossier that will be used by a quantitative analyst to calculate expected value.

For every game you receive you must:
1. Assess data quality — flag missing or conflicting information
2. Evaluate line movement — identify if sharp money has moved the line
3. Grade injury impact — HIGH/MEDIUM/LOW per player
4. Assess situational factors — rest, travel, motivation, revenge spots
5. Identify market inefficiencies — public bias, overreactions, stale lines
6. Summarize key factors that the market may be mispricing

Be objective. Surface facts, not opinions. If data is missing, say so clearly.
Your output must be structured JSON matching the ResearchReport schema."""


@dataclass
class ResearchReport:
    game_id: str
    sport: str
    home_team: str
    away_team: str
    data_quality_score: float
    missing_info: List[str] = field(default_factory=list)
    concerns: List[str] = field(default_factory=list)
    line_movement_analysis: str = ""
    sharp_money_indicators: List[str] = field(default_factory=list)
    public_betting_bias: str = ""
    injury_impact_home: List[Dict] = field(default_factory=list)
    injury_impact_away: List[Dict] = field(default_factory=list)
    weather_impact: Optional[Dict] = None
    motivation_factors: List[str] = field(default_factory=list)
    situational_edges: List[str] = field(default_factory=list)
    key_matchup_factors: List[str] = field(default_factory=list)
    research_summary: str = ""
    recommended_markets: List[str] = field(default_factory=list)


class ResearchAgentRunner:
    def __init__(self, api_key: str, model: str) -> None:
        self.client = anthropic.Anthropic(api_key=api_key)
        self.agent = BaseAgent(
            name="ResearchAgent",
            system_prompt=SYSTEM_PROMPT,
            model=model,
            client=self.client,
            max_tokens=2048,
        )

    async def research_game(self, dossier: Dict[str, Any]) -> ResearchReport:
        """Analyze a game dossier and return a structured research report."""
        game_id = dossier.get("game_id", "unknown")
        sport = dossier.get("sport", "")
        home = dossier.get("home_team", "")
        away = dossier.get("away_team", "")

        prompt = f"""Analyze this game dossier and return a JSON ResearchReport.

Game: {away} @ {home}
Sport: {sport}

DOSSIER DATA:
{self.agent._build_context_message(dossier)}

Return JSON with these exact keys:
{{
  "data_quality_score": <0-100 float>,
  "missing_info": ["list of missing data"],
  "concerns": ["list of concerns"],
  "line_movement_analysis": "description of line movement",
  "sharp_money_indicators": ["indicator1", "indicator2"],
  "public_betting_bias": "description of public bias",
  "injury_impact_home": [{{"player": "", "status": "", "impact": ""}}],
  "injury_impact_away": [{{"player": "", "status": "", "impact": ""}}],
  "weather_impact": {{"description": "", "impact_level": "", "affected_markets": []}},
  "motivation_factors": ["factor1"],
  "situational_edges": ["edge1"],
  "key_matchup_factors": ["factor1"],
  "research_summary": "2-3 sentence summary of key findings",
  "recommended_markets": ["h2h", "spreads", "totals"]
}}"""

        result = await self.agent.think_json(prompt)

        injuries_home = [i for i in dossier.get("injuries", [])
                         if i.get("team", "").lower() in home.lower()]
        injuries_away = [i for i in dossier.get("injuries", [])
                         if i.get("team", "").lower() in away.lower()]

        dq = self._calculate_data_quality(dossier)

        return ResearchReport(
            game_id=game_id,
            sport=sport,
            home_team=home,
            away_team=away,
            data_quality_score=result.get("data_quality_score", dq),
            missing_info=result.get("missing_info", []),
            concerns=result.get("concerns", []),
            line_movement_analysis=result.get("line_movement_analysis", ""),
            sharp_money_indicators=result.get("sharp_money_indicators", []),
            public_betting_bias=result.get("public_betting_bias", ""),
            injury_impact_home=result.get("injury_impact_home", injuries_home),
            injury_impact_away=result.get("injury_impact_away", injuries_away),
            weather_impact=result.get("weather_impact"),
            motivation_factors=result.get("motivation_factors", []),
            situational_edges=result.get("situational_edges", []),
            key_matchup_factors=result.get("key_matchup_factors", []),
            research_summary=result.get("research_summary", ""),
            recommended_markets=result.get("recommended_markets", ["h2h", "spreads"]),
        )

    def _calculate_data_quality(self, dossier: Dict) -> float:
        score = 0.0
        checks = [
            ("odds", 25),
            ("injuries", 20),
            ("home_team", 10),
            ("away_team", 10),
            ("weather", 15),
            ("stats", 20),
        ]
        for key, weight in checks:
            val = dossier.get(key)
            if val and val != {} and val != []:
                score += weight
        return round(score, 1)

    async def research_all_games(self, dossiers: List[Dict]) -> List[ResearchReport]:
        """Research all games concurrently."""
        import asyncio
        tasks = [self.research_game(d) for d in dossiers]
        return await asyncio.gather(*tasks, return_exceptions=False)
