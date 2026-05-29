"""
Portfolio Manager Agent — constructs the optimal daily betting portfolio.
"""

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import anthropic

from src.agents.base_agent import BaseAgent
from src.agents.quant_agent import QuantAnalysis
from src.analysis.kelly_criterion import enforce_portfolio_limits
from src.analysis.monte_carlo import simulate_parlay

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a professional sports betting portfolio manager.

Your job is to construct the highest expected-value betting portfolio from a ranked list of opportunities.

Rules you MUST follow:
- Never force picks — only include bets that genuinely qualify
- Prioritize singles over parlays
- Parlays are supplemental only; every parlay leg must independently be positive EV
- Maximum daily exposure: 5% of bankroll
- Maximum single bet: 1.5% of bankroll
- Use composite scoring (40% EV, 30% win prob, 20% confidence, 10% CLV) for ranking
- Avoid correlated parlay legs

Your output must be structured JSON."""


@dataclass
class BetRecommendation:
    rank: int
    game_id: str
    sport: str
    game: str
    market: str
    selection: str
    american_odds: int
    model_prob: float
    ev: float
    edge: float
    confidence_score: float
    risk_score: float
    classification: str
    stake_pct: float
    stake_amount: float
    reasoning: str = ""
    devils_advocate_notes: str = ""
    downgraded_from: str = ""


@dataclass
class Parlay:
    legs: List[Dict] = field(default_factory=list)
    projected_probability: float = 0.0
    projected_ev: float = 0.0
    combined_odds: int = 0
    risk_rating: str = "MEDIUM"
    confidence: float = 0.0
    stake_pct: float = 0.005


@dataclass
class Portfolio:
    date: str
    bankroll: float
    top_4_bets: List[BetRecommendation] = field(default_factory=list)
    bets_by_sport: Dict[str, List[BetRecommendation]] = field(default_factory=dict)
    props_by_sport: Dict[str, List[Dict]] = field(default_factory=dict)
    parlays: List[Parlay] = field(default_factory=list)
    all_strong: List[BetRecommendation] = field(default_factory=list)
    all_lean: List[BetRecommendation] = field(default_factory=list)
    all_pass: List[BetRecommendation] = field(default_factory=list)
    total_exposure_pct: float = 0.0
    expected_portfolio_ev: float = 0.0
    risk_summary: str = ""


class PortfolioManagerRunner:
    def __init__(self, api_key: str, model: str, model_weights: Dict = None) -> None:
        self.client = anthropic.Anthropic(api_key=api_key)
        self.agent = BaseAgent(
            name="PortfolioManager",
            system_prompt=SYSTEM_PROMPT,
            model=model,
            client=self.client,
            max_tokens=3000,
        )
        self.weights = model_weights or {"ev": 0.40, "win_prob": 0.30, "confidence": 0.20, "clv": 0.10}

    async def construct_portfolio(
        self,
        analyses: List[QuantAnalysis],
        props_by_sport: Dict[str, List[Dict]],
        bankroll: float,
        date: str,
    ) -> Portfolio:
        """Build the full daily portfolio from all quant analyses."""
        portfolio = Portfolio(date=date, bankroll=bankroll, props_by_sport=props_by_sport)

        strong = [a for a in analyses if a.classification == "STRONG"]
        lean = [a for a in analyses if a.classification == "LEAN"]
        pass_bets = [a for a in analyses if a.classification == "PASS"]

        all_bets_sorted = sorted(
            strong + lean, key=lambda x: x.composite_score_val, reverse=True
        )

        # Assign stakes and enforce limits
        bet_dicts = []
        for a in all_bets_sorted:
            bet_dicts.append({
                "analysis": a,
                "stake_pct": a.kelly_result.get("stake_pct", 0.005),
            })

        if bet_dicts:
            stake_list = enforce_portfolio_limits(
                [{"stake_pct": b["stake_pct"]} for b in bet_dicts],
                bankroll,
            )
            for b, s in zip(bet_dicts, stake_list):
                b["stake_pct"] = s["stake_pct"]

        # Build ranked recommendations
        recs = []
        for rank, b in enumerate(bet_dicts, 1):
            a = b["analysis"]
            recs.append(BetRecommendation(
                rank=rank,
                game_id=a.game_id,
                sport=a.sport,
                game=f"{a.away_team} @ {a.home_team}",
                market=a.market,
                selection=a.selection,
                american_odds=a.american_odds,
                model_prob=a.model_prob,
                ev=a.ev,
                edge=a.edge,
                confidence_score=a.confidence_score,
                risk_score=a.risk_score,
                classification=a.classification,
                stake_pct=b["stake_pct"],
                stake_amount=round(bankroll * b["stake_pct"], 2),
            ))

        portfolio.top_4_bets = recs[:4]
        portfolio.all_strong = [r for r in recs if r.classification == "STRONG"]
        portfolio.all_lean = [r for r in recs if r.classification == "LEAN"]
        portfolio.all_pass = self._build_pass_list(pass_bets, bankroll)

        # Bets by sport
        for rec in recs:
            portfolio.bets_by_sport.setdefault(rec.sport, [])
            if len(portfolio.bets_by_sport[rec.sport]) < 3:
                portfolio.bets_by_sport[rec.sport].append(rec)

        # Build parlays from positive EV legs
        portfolio.parlays = self._build_parlays(strong[:8], bankroll)

        portfolio.total_exposure_pct = sum(r.stake_pct for r in recs)
        portfolio.expected_portfolio_ev = sum(r.ev * r.stake_pct for r in recs)

        return portfolio

    def _build_pass_list(self, pass_analyses: List[QuantAnalysis], bankroll: float) -> List[BetRecommendation]:
        return [
            BetRecommendation(
                rank=0,
                game_id=a.game_id,
                sport=a.sport,
                game=f"{a.away_team} @ {a.home_team}",
                market=a.market,
                selection=a.selection,
                american_odds=a.american_odds,
                model_prob=a.model_prob,
                ev=a.ev,
                edge=a.edge,
                confidence_score=a.confidence_score,
                risk_score=a.risk_score,
                classification="PASS",
                stake_pct=0.0,
                stake_amount=0.0,
            )
            for a in pass_analyses[:20]
        ]

    def _build_parlays(self, strong_analyses: List[QuantAnalysis], bankroll: float) -> List[Parlay]:
        """Build up to 3 four-leg parlays from strong positive-EV bets."""
        parlays = []
        if len(strong_analyses) < 4:
            return parlays

        # Dedup: avoid same game in one parlay
        def unique_games(candidates: List[QuantAnalysis], n: int = 4) -> List[QuantAnalysis]:
            seen = set()
            out = []
            for a in candidates:
                if a.game_id not in seen and len(out) < n:
                    seen.add(a.game_id)
                    out.append(a)
            return out

        sets = [
            unique_games(strong_analyses, 4),
            unique_games(strong_analyses[1:] + strong_analyses[:1], 4),
            unique_games(strong_analyses[2:] + strong_analyses[:2], 4),
        ]

        for leg_set in sets:
            if len(leg_set) < 4:
                continue
            legs = [
                {
                    "game": f"{a.away_team} @ {a.home_team}",
                    "selection": a.selection,
                    "american_odds": a.american_odds,
                    "model_prob": a.model_prob,
                    "ev": a.ev,
                }
                for a in leg_set[:4]
            ]
            sim = simulate_parlay(
                [{"model_prob": l["model_prob"], "american_odds": l["american_odds"]} for l in legs]
            )
            if sim.mean_ev <= 0:
                continue

            combined_decimal = 1.0
            for l in legs:
                from src.analysis.probability_engine import american_to_decimal
                combined_decimal *= american_to_decimal(l["american_odds"])
            from src.analysis.probability_engine import decimal_to_american
            combined_american = decimal_to_american(combined_decimal)

            parlays.append(Parlay(
                legs=legs,
                projected_probability=sim.win_rate,
                projected_ev=sim.mean_ev,
                combined_odds=combined_american,
                risk_rating="HIGH" if sim.win_rate < 0.10 else "MEDIUM",
                confidence=sum(a.confidence_score for a in leg_set[:4]) / 4,
                stake_pct=0.005,
            ))
            if len(parlays) == 3:
                break

        return parlays
