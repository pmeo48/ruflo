"""
Report Generator — produces the full 12-section daily betting intelligence report.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

import anthropic

from src.agents.base_agent import BaseAgent
from src.agents.portfolio_manager import Portfolio, BetRecommendation, Parlay

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the lead analyst for a professional sports betting intelligence service.

You write clear, data-driven betting reports for sophisticated clients. Your writing style:
- Concise and precise — no filler language
- Data first, narrative second
- Acknowledge uncertainty honestly
- Never oversell a pick
- Use professional sports betting terminology

Your reports are acted upon immediately by clients with real money."""

TELEGRAM_CHUNK_SIZE = 4000  # stay under 4096 with some margin


@dataclass
class DailyReport:
    date: str
    bankroll: float
    portfolio: Portfolio

    # Sections
    executive_summary: str = ""
    top_4_bets_narrative: str = ""
    bets_by_sport_narrative: str = ""
    props_by_sport_narrative: str = ""
    parlays_narrative: str = ""
    all_strong_narrative: str = ""
    all_lean_narrative: str = ""
    pass_report_narrative: str = ""
    portfolio_allocation_narrative: str = ""
    risk_analysis_narrative: str = ""
    capital_allocation_narrative: str = ""
    final_recommendations: str = ""

    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


def _fmt_odds(american_odds: int) -> str:
    return f"+{american_odds}" if american_odds > 0 else str(american_odds)


def _fmt_pct(val: float) -> str:
    return f"{val * 100:.2f}%"


def _bet_summary_line(bet: BetRecommendation, bankroll: float) -> str:
    da_note = f" [DA: {bet.devils_advocate_notes[:60]}...]" if bet.devils_advocate_notes else ""
    downgrade = f" (downgraded from {bet.downgraded_from})" if bet.downgraded_from else ""
    return (
        f"• {bet.selection} | {bet.game} | {bet.market.upper()} | "
        f"Odds: {_fmt_odds(bet.american_odds)} | "
        f"EV: {_fmt_pct(bet.ev)} | Edge: {_fmt_pct(bet.edge)} | "
        f"Conf: {_fmt_pct(bet.confidence_score)} | "
        f"Stake: ${bet.stake_amount:.2f} ({_fmt_pct(bet.stake_pct)})"
        f"{downgrade}{da_note}"
    )


def _parlay_summary(parlay: Parlay, idx: int) -> str:
    legs_text = "\n".join(
        f"  Leg {i+1}: {l['selection']} ({l['game']}) {_fmt_odds(l['american_odds'])}"
        for i, l in enumerate(parlay.legs)
    )
    return (
        f"Parlay #{idx+1} | Combined Odds: {_fmt_odds(parlay.combined_odds)} | "
        f"Win Prob: {_fmt_pct(parlay.projected_probability)} | "
        f"EV: {parlay.projected_ev:.4f} | Stake: {_fmt_pct(parlay.stake_pct)}\n"
        f"{legs_text}"
    )


class ReportGenerator:
    def __init__(self, api_key: str, model: str) -> None:
        self.client = anthropic.Anthropic(api_key=api_key)
        self.agent = BaseAgent(
            name="ReportGenerator",
            system_prompt=SYSTEM_PROMPT,
            model=model,
            client=self.client,
            max_tokens=4096,
        )

    async def generate_report(
        self, portfolio: Portfolio, date: str, bankroll: float
    ) -> DailyReport:
        """Generate the complete 12-section daily report."""
        report = DailyReport(date=date, bankroll=bankroll, portfolio=portfolio)

        strong_count = len(portfolio.all_strong)
        lean_count = len(portfolio.all_lean)
        pass_count = len(portfolio.all_pass)
        total_bets = strong_count + lean_count + pass_count
        total_exposure = portfolio.total_exposure_pct * 100
        portfolio_ev = portfolio.expected_portfolio_ev * 100

        # --- Section 1: Executive Summary (Claude-written) ---
        exec_prompt = f"""Write a 3-paragraph executive summary for today's betting intelligence report.

Date: {date}
Bankroll: ${bankroll:,.2f}
Total Opportunities Analyzed: {total_bets}
STRONG Bets: {strong_count}
LEAN Bets: {lean_count}
PASS: {pass_count}
Total Daily Exposure: {total_exposure:.2f}%
Expected Portfolio EV: {portfolio_ev:.3f}%
Top Bet: {portfolio.top_4_bets[0].selection if portfolio.top_4_bets else 'None'} — EV {_fmt_pct(portfolio.top_4_bets[0].ev) if portfolio.top_4_bets else 'N/A'}

Paragraphs: (1) market overview and data quality, (2) top opportunities summary, (3) risk posture for the day.
Be direct, professional, and data-driven."""
        report.executive_summary = await self.agent.think(exec_prompt)

        # --- Section 2: Top 4 Bets (narrative) ---
        top4_lines = [_bet_summary_line(b, bankroll) for b in portfolio.top_4_bets]
        top4_detail_prompt = f"""Write a brief professional summary for each of today's top 4 bets.

{chr(10).join(top4_lines)}

For each bet: 1-2 sentences explaining why it has edge, what the key thesis is, and what could go wrong.
Format as numbered list."""
        report.top_4_bets_narrative = (
            "\n".join(top4_lines) + "\n\n" + await self.agent.think(top4_detail_prompt)
            if portfolio.top_4_bets
            else "No qualifying bets today."
        )

        # --- Section 3: Top 3 Bets by Sport ---
        sport_lines = []
        for sport, bets in portfolio.bets_by_sport.items():
            sport_lines.append(f"\n[{sport.upper()}]")
            for b in bets[:3]:
                sport_lines.append(_bet_summary_line(b, bankroll))
        report.bets_by_sport_narrative = "\n".join(sport_lines) if sport_lines else "No sport-specific bets today."

        # --- Section 4: Player Props ---
        props_lines = []
        for sport, props in portfolio.props_by_sport.items():
            if not props:
                continue
            props_lines.append(f"\n[{sport.upper()} PROPS]")
            for p in props[:3]:
                props_lines.append(
                    f"• {p.get('player', 'N/A')} | {p.get('prop_type', 'N/A')} "
                    f"{p.get('recommendation', 'N/A')} {p.get('line', 'N/A')} | "
                    f"Odds: {_fmt_odds(int(p.get('american_odds', -115)))} | "
                    f"EV: {_fmt_pct(float(p.get('ev', 0)))} | "
                    f"Stake: {_fmt_pct(float(p.get('stake_pct', 0.005)))}"
                )
        report.props_by_sport_narrative = "\n".join(props_lines) if props_lines else "No player prop opportunities today."

        # --- Section 5: Parlays ---
        parlay_lines = []
        for i, parlay in enumerate(portfolio.parlays[:3]):
            parlay_lines.append(_parlay_summary(parlay, i))
        report.parlays_narrative = "\n\n".join(parlay_lines) if parlay_lines else "No qualifying parlays today."

        # --- Section 6: All Strong Bets ---
        strong_lines = [_bet_summary_line(b, bankroll) for b in portfolio.all_strong]
        report.all_strong_narrative = (
            f"STRONG BETS ({strong_count}):\n" + "\n".join(strong_lines)
            if strong_lines
            else "No STRONG bets today."
        )

        # --- Section 7: All Lean Bets ---
        lean_lines = [_bet_summary_line(b, bankroll) for b in portfolio.all_lean]
        report.all_lean_narrative = (
            f"LEAN BETS ({lean_count}):\n" + "\n".join(lean_lines)
            if lean_lines
            else "No LEAN bets today."
        )

        # --- Section 8: Pass Report ---
        pass_lines = []
        for b in portfolio.all_pass[:10]:
            reason = b.devils_advocate_notes or "Insufficient edge"
            pass_lines.append(
                f"• {b.selection} ({b.game}) | EV: {_fmt_pct(b.ev)} | Reason: {reason[:80]}"
            )
        report.pass_report_narrative = (
            f"PASS BETS (top {len(pass_lines)} shown):\n" + "\n".join(pass_lines)
            if pass_lines
            else "No notable pass bets today."
        )

        # --- Section 9: Portfolio Allocation ---
        alloc_lines = [
            f"Total Bets Recommended: {strong_count + lean_count}",
            f"  STRONG: {strong_count}",
            f"  LEAN:   {lean_count}",
            f"Total Daily Exposure: {total_exposure:.2f}% of bankroll (${bankroll * portfolio.total_exposure_pct:,.2f})",
            f"Expected Portfolio EV: {portfolio_ev:.3f}% per unit staked",
            "",
            "Stake Breakdown by Bet:",
        ]
        for b in (portfolio.all_strong + portfolio.all_lean)[:10]:
            alloc_lines.append(
                f"  {b.selection[:30]:30s} | {_fmt_pct(b.stake_pct):8s} | ${b.stake_amount:7.2f}"
            )
        report.portfolio_allocation_narrative = "\n".join(alloc_lines)

        # --- Section 10: Risk Analysis ---
        avg_confidence = (
            sum(b.confidence_score for b in portfolio.all_strong + portfolio.all_lean) /
            max(strong_count + lean_count, 1)
        )
        avg_ev = (
            sum(b.ev for b in portfolio.all_strong + portfolio.all_lean) /
            max(strong_count + lean_count, 1)
        )
        risk_prompt = f"""Write a 2-paragraph risk analysis for today's betting portfolio.

Portfolio stats:
- STRONG bets: {strong_count}, LEAN bets: {lean_count}
- Total exposure: {total_exposure:.2f}%
- Average confidence: {avg_confidence:.1%}
- Average EV: {avg_ev:.2%}
- Parlays included: {len(portfolio.parlays)}
- Expected portfolio EV: {portfolio_ev:.3f}%

Paragraph 1: Overall risk posture (conservative/moderate/aggressive and why).
Paragraph 2: Key risk factors and how to manage them today."""
        report.risk_analysis_narrative = await self.agent.think(risk_prompt)

        # --- Section 11: Capital Allocation ---
        total_recommended = bankroll * portfolio.total_exposure_pct
        report.capital_allocation_narrative = (
            f"Daily Capital Allocation\n"
            f"{'─' * 40}\n"
            f"Bankroll:              ${bankroll:>10,.2f}\n"
            f"Total Recommended:     ${total_recommended:>10,.2f} ({total_exposure:.2f}%)\n"
            f"In Reserve:            ${bankroll - total_recommended:>10,.2f} ({100 - total_exposure:.2f}%)\n"
            f"\nMax Single Bet:        1.50% = ${bankroll * 0.015:>8,.2f}\n"
            f"Max Daily Exposure:    5.00% = ${bankroll * 0.05:>8,.2f}\n"
        )

        # --- Section 12: Final Recommendations (Claude-written) ---
        final_prompt = f"""Write the final recommendations section for today's sports betting report.

Date: {date}
Strong Bets: {strong_count}
Total Exposure: {total_exposure:.2f}%

Top pick if any: {portfolio.top_4_bets[0].selection + ' ' + portfolio.top_4_bets[0].game if portfolio.top_4_bets else 'None'}

End with the phrase: "If I personally had to risk my own bankroll today..."
Then give your honest 2-3 sentence personal recommendation.

Be direct, acknowledge uncertainty, and conclude with actionable advice."""
        report.final_recommendations = await self.agent.think(final_prompt)

        logger.info("Report generated for %s — %d strong, %d lean bets", date, strong_count, lean_count)
        return report

    def format_report_markdown(self, report: DailyReport) -> str:
        """Format the full report as a Markdown string."""
        sections = [
            f"# 🎯 Sports Betting Intelligence Report — {report.date}",
            f"**Generated:** {report.generated_at}  |  **Bankroll:** ${report.bankroll:,.2f}",
            "",
            "---",
            "## 1. Executive Summary",
            report.executive_summary,
            "",
            "---",
            "## 2. Top 4 Bets of the Day",
            report.top_4_bets_narrative,
            "",
            "---",
            "## 3. Top 3 Bets by Sport",
            report.bets_by_sport_narrative,
            "",
            "---",
            "## 4. Top 3 Player Props by Sport",
            report.props_by_sport_narrative,
            "",
            "---",
            "## 5. Top 3 Quant-Certified Parlays",
            report.parlays_narrative,
            "",
            "---",
            "## 6. All Strong Bets",
            report.all_strong_narrative,
            "",
            "---",
            "## 7. All Lean Bets",
            report.all_lean_narrative,
            "",
            "---",
            "## 8. Pass Report",
            report.pass_report_narrative,
            "",
            "---",
            "## 9. Portfolio Allocation Summary",
            report.portfolio_allocation_narrative,
            "",
            "---",
            "## 10. Risk Analysis Summary",
            report.risk_analysis_narrative,
            "",
            "---",
            "## 11. Daily Capital Allocation",
            report.capital_allocation_narrative,
            "",
            "---",
            "## 12. Final Recommendations",
            report.final_recommendations,
        ]
        return "\n".join(sections)

    def format_report_telegram(self, report: DailyReport) -> List[str]:
        """
        Format the report for Telegram delivery.
        Returns list of message chunks (each ≤ TELEGRAM_CHUNK_SIZE chars) using HTML formatting.
        """
        def h(text: str) -> str:
            return f"<b>{text}</b>"

        def code(text: str) -> str:
            return f"<code>{text}</code>"

        def escape(text: str) -> str:
            return (
                text.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
            )

        sections = []

        # Header
        sections.append(
            f"🎯 {h('Daily Betting Intelligence Report')}\n"
            f"📅 {h(report.date)} | 💰 Bankroll: {h(f'${report.bankroll:,.2f}')}\n"
            f"─────────────────────────"
        )

        sections.append(f"{h('1. EXECUTIVE SUMMARY')}\n{escape(report.executive_summary[:800])}")

        # Top 4 bets
        top4_text = f"{h('2. TOP 4 BETS')}\n"
        for i, b in enumerate(report.portfolio.top_4_bets, 1):
            top4_text += (
                f"\n{h(f'#{i} {escape(b.selection)}')}\n"
                f"📌 {escape(b.game)} | {b.market.upper()}\n"
                f"💵 Odds: {code(_fmt_odds(b.american_odds))} | "
                f"EV: {code(_fmt_pct(b.ev))} | "
                f"Edge: {code(_fmt_pct(b.edge))}\n"
                f"💰 Stake: {code(f'${b.stake_amount:.2f}')} ({code(_fmt_pct(b.stake_pct))})\n"
                f"🏷 {escape(b.classification)}"
                + (f" ⬇️ from {b.downgraded_from}" if b.downgraded_from else "")
                + "\n"
            )
        sections.append(top4_text)

        # Props
        if any(report.portfolio.props_by_sport.values()):
            props_text = f"{h('4. PLAYER PROPS')}\n"
            for sport, props in report.portfolio.props_by_sport.items():
                if props:
                    props_text += f"\n{h(sport.upper())}\n"
                    for p in props[:3]:
                        props_text += (
                            f"• {escape(p.get('player', 'N/A'))} — "
                            f"{p.get('prop_type', '')} {p.get('recommendation', '')} "
                            f"{p.get('line', '')} | "
                            f"EV: {_fmt_pct(float(p.get('ev', 0)))}\n"
                        )
            sections.append(props_text)

        # Parlays
        if report.portfolio.parlays:
            parlay_text = f"{h('5. TOP PARLAYS')}\n"
            for i, pl in enumerate(report.portfolio.parlays[:3], 1):
                parlay_text += (
                    f"\n{h(f'Parlay #{i}')} | "
                    f"Odds: {code(_fmt_odds(pl.combined_odds))} | "
                    f"Win%: {code(_fmt_pct(pl.projected_probability))}\n"
                )
                for j, leg in enumerate(pl.legs, 1):
                    parlay_text += f"  L{j}: {escape(leg['selection'])} {_fmt_odds(leg['american_odds'])}\n"
            sections.append(parlay_text)

        # Strong + Lean summary
        strong_text = f"{h('6. ALL STRONG BETS')} ({len(report.portfolio.all_strong)})\n"
        for b in report.portfolio.all_strong[:10]:
            strong_text += f"• {escape(b.selection)} | {b.market} | {_fmt_odds(b.american_odds)} | EV: {_fmt_pct(b.ev)}\n"
        sections.append(strong_text)

        lean_text = f"{h('7. ALL LEAN BETS')} ({len(report.portfolio.all_lean)})\n"
        for b in report.portfolio.all_lean[:10]:
            lean_text += f"• {escape(b.selection)} | {b.market} | {_fmt_odds(b.american_odds)} | EV: {_fmt_pct(b.ev)}\n"
        sections.append(lean_text)

        # Risk + Final
        sections.append(
            f"{h('10. RISK ANALYSIS')}\n{escape(report.risk_analysis_narrative[:600])}"
        )
        sections.append(
            f"{h('11. CAPITAL ALLOCATION')}\n{code(report.capital_allocation_narrative)}"
        )
        sections.append(
            f"{h('12. FINAL RECOMMENDATIONS')}\n{escape(report.final_recommendations[:800])}"
        )

        # Chunk into Telegram-sized messages
        chunks = []
        current = ""
        for section in sections:
            if len(current) + len(section) + 2 > TELEGRAM_CHUNK_SIZE:
                if current:
                    chunks.append(current.strip())
                current = section
            else:
                current = (current + "\n\n" + section).strip()
        if current:
            chunks.append(current.strip())

        return chunks
