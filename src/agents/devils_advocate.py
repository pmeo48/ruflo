"""
Devil's Advocate Agent — attempts to disprove every STRONG wager before publication.
"""

import logging
from typing import Dict, List

import anthropic

from src.agents.base_agent import BaseAgent
from src.agents.portfolio_manager import BetRecommendation, Portfolio
from src.agents.research_agent import ResearchReport

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Devil's Advocate for a professional sports betting syndicate.

Your ONLY job is to find reasons NOT to bet something.

For every STRONG wager you receive, you must aggressively challenge it:
- What injuries could invalidate this edge?
- Is the model missing something the market knows?
- Could there be lineup changes not yet reflected?
- Is this a trap set by sharp bookmakers?
- Is the edge based on stale or low-quality data?
- Could variance destroy this bet even if the model is correct?
- Why might the market be right and the model wrong?

You are NOT trying to be balanced. You are trying to BREAK the thesis.

Classification guidance:
- If concerns are minor: keep as STRONG (no downgrade)
- If concerns are material and reduce expected edge meaningfully: downgrade to LEAN
- If concerns are severe (major injury uncertainty, model clearly wrong, data quality issues): downgrade to PASS

Return structured JSON for each bet reviewed."""


class DevilsAdvocateRunner:
    def __init__(self, api_key: str, model: str) -> None:
        self.client = anthropic.Anthropic(api_key=api_key)
        self.agent = BaseAgent(
            name="DevilsAdvocate",
            system_prompt=SYSTEM_PROMPT,
            model=model,
            client=self.client,
            max_tokens=2048,
        )

    async def review_portfolio(
        self,
        portfolio: Portfolio,
        research_reports: Dict[str, ResearchReport],
    ) -> Portfolio:
        """Review all STRONG bets and apply downgrades where warranted."""
        import asyncio

        tasks = [
            self._review_bet(bet, research_reports.get(bet.game_id))
            for bet in portfolio.all_strong
        ]
        reviewed = await asyncio.gather(*tasks)

        downgraded_to_lean = []
        downgraded_to_pass = []
        still_strong = []

        for original_bet, verdict in zip(portfolio.all_strong, reviewed):
            new_class = verdict.get("classification", original_bet.classification)
            notes = verdict.get("concerns_summary", "")
            original_bet.devils_advocate_notes = notes

            if new_class == "LEAN" and original_bet.classification == "STRONG":
                original_bet.downgraded_from = "STRONG"
                original_bet.classification = "LEAN"
                original_bet.stake_pct = min(original_bet.stake_pct, 0.0075)
                original_bet.stake_amount = round(portfolio.bankroll * original_bet.stake_pct, 2)
                downgraded_to_lean.append(original_bet)
            elif new_class == "PASS" and original_bet.classification in ("STRONG", "LEAN"):
                original_bet.downgraded_from = original_bet.classification
                original_bet.classification = "PASS"
                original_bet.stake_pct = 0.0
                original_bet.stake_amount = 0.0
                downgraded_to_pass.append(original_bet)
            else:
                still_strong.append(original_bet)

        portfolio.all_strong = still_strong
        portfolio.all_lean = downgraded_to_lean + portfolio.all_lean
        portfolio.all_pass = downgraded_to_pass + portfolio.all_pass

        # Rebuild top 4 from survivors
        all_qualifying = sorted(
            portfolio.all_strong + portfolio.all_lean,
            key=lambda x: (0 if x.classification == "STRONG" else 1, -x.ev),
        )
        portfolio.top_4_bets = all_qualifying[:4]
        for rank, bet in enumerate(portfolio.top_4_bets, 1):
            bet.rank = rank

        if downgraded_to_lean or downgraded_to_pass:
            logger.info(
                "Devil's Advocate: %d downgraded to LEAN, %d downgraded to PASS",
                len(downgraded_to_lean),
                len(downgraded_to_pass),
            )

        return portfolio

    async def _review_bet(
        self, bet: BetRecommendation, report: ResearchReport = None
    ) -> Dict:
        """Review a single STRONG bet and return verdict."""
        report_context = ""
        if report:
            report_context = f"""
Research summary: {report.research_summary}
Concerns: {report.concerns}
Missing info: {report.missing_info}
Sharp indicators: {report.sharp_money_indicators}
Home injuries: {[f"{i.get('player')} ({i.get('status')})" for i in report.injury_impact_home]}
Away injuries: {[f"{i.get('player')} ({i.get('status')})" for i in report.injury_impact_away]}
Situational edges: {report.situational_edges}
"""

        prompt = f"""CHALLENGE this STRONG bet — find every reason it could be WRONG:

Bet: {bet.selection} ({bet.market})
Game: {bet.game}
Sport: {bet.sport}
Odds: {bet.american_odds:+d}
Model Probability: {bet.model_prob:.1%}
Expected Value: {bet.ev:.1%}
Edge: {bet.edge:.1%}
Risk Score: {bet.risk_score:.0f}/100
Confidence: {bet.confidence_score:.1%}
{report_context}

Aggressively challenge this bet. Return JSON:
{{
  "classification": "STRONG" | "LEAN" | "PASS",
  "severity": "LOW" | "MEDIUM" | "HIGH",
  "concerns": ["concern1", "concern2"],
  "concerns_summary": "2-3 sentence summary of key risks",
  "downgrade_reason": "reason if downgrading, else null"
}}"""

        return await self.agent.think_json(prompt)
