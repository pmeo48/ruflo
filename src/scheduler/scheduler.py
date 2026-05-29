"""
APScheduler-based daily pipeline runner.
Schedules:
  - Daily analysis at 8:00 AM EST  (13:00 UTC)
  - Performance grading at 11:00 PM EST (04:00 UTC next day)
"""

import asyncio
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Any

import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from rich.console import Console

from config.settings import settings

logger = logging.getLogger(__name__)
console = Console()
EST = pytz.timezone("US/Eastern")

SUPPORTED_SPORTS = [
    "americanfootball_nfl",
    "basketball_nba",
    "baseball_mlb",
    "icehockey_nhl",
    "americanfootball_ncaaf",
    "basketball_ncaab",
    "soccer_usa_mls",
    "mma_mixed_martial_arts",
]


class BettingScheduler:
    """Orchestrates the full daily betting intelligence pipeline."""

    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler(timezone=EST)
        self._setup_jobs()

    def _setup_jobs(self) -> None:
        # Daily analysis: 8:00 AM EST
        self.scheduler.add_job(
            self.run_daily_analysis,
            CronTrigger(hour=8, minute=0, timezone=EST),
            id="daily_analysis",
            name="Daily Betting Analysis",
            misfire_grace_time=300,
        )
        # Performance grading: 11:00 PM EST
        self.scheduler.add_job(
            self.run_performance_grading,
            CronTrigger(hour=23, minute=0, timezone=EST),
            id="performance_grading",
            name="Performance Grading",
            misfire_grace_time=300,
        )
        logger.info("Scheduler jobs configured")

    def start(self) -> None:
        """Start the scheduler and block."""
        self.scheduler.start()
        console.print("[green]Scheduler started. Daily analysis at 8:00 AM EST.[/green]")
        console.print("[dim]Press Ctrl+C to stop.[/dim]")
        try:
            asyncio.get_event_loop().run_forever()
        except (KeyboardInterrupt, SystemExit):
            self.stop()

    def stop(self) -> None:
        self.scheduler.shutdown(wait=False)
        console.print("[yellow]Scheduler stopped.[/yellow]")

    async def run_daily_analysis(self) -> None:
        """Execute the full daily pipeline."""
        session_id = str(uuid.uuid4())[:8]
        date_str = datetime.now(EST).strftime("%Y-%m-%d")
        logger.info("=== Daily Analysis Starting | session=%s | date=%s ===", session_id, date_str)
        console.rule(f"[bold green]Daily Analysis — {date_str}[/bold green]")

        # --- Step 1: Database ---
        from src.database.db_manager import DBManager
        db = DBManager(db_path=settings.DB_PATH)
        await db.initialize()

        # --- Step 2: Load model weights ---
        from src.learning.model_reweighter import weights_from_db_row
        weights_row = await db.get_model_weights()
        model_weights = weights_from_db_row(weights_row)
        logger.info("Loaded model weights (sample=%d)", model_weights.sample_size)

        # --- Step 3: Initialise fetchers ---
        from src.data.odds_fetcher import OddsFetcher
        from src.data.injury_fetcher import InjuryFetcher
        from src.data.weather_fetcher import WeatherFetcher
        from src.data.stats_fetcher import StatsFetcher
        from src.data.data_aggregator import DataAggregator

        odds_fetcher = OddsFetcher(api_key=settings.ODDS_API_KEY)
        injury_fetcher = InjuryFetcher()
        weather_fetcher = WeatherFetcher(api_key=settings.OPENWEATHER_API_KEY)
        stats_fetcher = StatsFetcher()
        aggregator = DataAggregator(odds_fetcher, injury_fetcher, weather_fetcher, stats_fetcher)

        # --- Step 4: Fetch data for all sports concurrently ---
        console.print("[cyan]Fetching game data for all sports...[/cyan]")
        dossier_tasks = [aggregator.aggregate_game_data(sport) for sport in SUPPORTED_SPORTS]
        sport_dossiers = await asyncio.gather(*dossier_tasks, return_exceptions=True)

        all_dossiers = []
        for sport, result in zip(SUPPORTED_SPORTS, sport_dossiers):
            if isinstance(result, Exception):
                logger.error("Data fetch failed for %s: %s", sport, result)
            else:
                all_dossiers.extend(result)

        logger.info("Total dossiers built: %d", len(all_dossiers))
        console.print(f"[green]Data collected: {len(all_dossiers)} games[/green]")

        if not all_dossiers:
            logger.warning("No game data available — aborting analysis")
            await db.close()
            return

        # --- Step 5: Research Agent ---
        from src.agents.research_agent import ResearchAgentRunner
        console.print("[cyan]Research Agent analyzing dossiers...[/cyan]")
        research_runner = ResearchAgentRunner(
            api_key=settings.ANTHROPIC_API_KEY, model=settings.CLAUDE_MODEL
        )
        research_dicts = [d.__dict__ for d in all_dossiers]
        research_reports = await research_runner.research_all_games(research_dicts)
        logger.info("Research complete: %d reports", len(research_reports))

        # Build lookup maps
        game_data_map: Dict[str, Any] = {d.game_id: d.__dict__ for d in all_dossiers}
        research_map = {r.game_id: r for r in research_reports}

        # --- Step 6: Quant Agent ---
        from src.agents.quant_agent import QuantAgentRunner
        console.print("[cyan]Quant Agent running mathematical analysis...[/cyan]")
        quant_runner = QuantAgentRunner(
            api_key=settings.ANTHROPIC_API_KEY,
            model=settings.CLAUDE_MODEL,
            model_weights=model_weights.as_dict(),
        )

        # Analyze per report
        all_analyses = []
        for report in research_reports:
            game_raw = game_data_map.get(report.game_id, {})
            odds_data = game_raw.get("odds_data", game_raw)
            # Get the first bookmaker's markets
            bookmakers = odds_data.get("bookmakers", [])
            if bookmakers:
                first_bk_markets = bookmakers[0].get("markets", [])
                game_odds = {"markets": first_bk_markets, **odds_data}
            else:
                game_odds = odds_data
            analyses = await quant_runner.analyze_opportunity(report, game_odds, settings.BANKROLL)
            if isinstance(analyses, list):
                all_analyses.extend(analyses)
            else:
                all_analyses.append(analyses)

        logger.info("Quant analysis complete: %d opportunities", len(all_analyses))

        # --- Step 7: Player Props ---
        props_by_sport: Dict[str, List] = {}
        for dossier in all_dossiers:
            if dossier.player_props:
                sport = dossier.sport
                report = research_map.get(dossier.game_id)
                if report:
                    props = await quant_runner.analyze_player_props(
                        sport, dossier.game_id, dossier.player_props, report
                    )
                    props_by_sport.setdefault(sport, [])
                    props_by_sport[sport].extend(props)

        # --- Step 8: Portfolio Manager ---
        from src.agents.portfolio_manager import PortfolioManagerRunner
        console.print("[cyan]Portfolio Manager constructing portfolio...[/cyan]")
        pm_runner = PortfolioManagerRunner(
            api_key=settings.ANTHROPIC_API_KEY,
            model=settings.CLAUDE_MODEL,
            model_weights=model_weights.as_dict(),
        )
        portfolio = await pm_runner.construct_portfolio(
            all_analyses, props_by_sport, settings.BANKROLL, date_str
        )

        # --- Step 9: Devil's Advocate ---
        from src.agents.devils_advocate import DevilsAdvocateRunner
        console.print("[cyan]Devil's Advocate reviewing strong bets...[/cyan]")
        da_runner = DevilsAdvocateRunner(
            api_key=settings.ANTHROPIC_API_KEY, model=settings.CLAUDE_MODEL
        )
        portfolio = await da_runner.review_portfolio(portfolio, research_map)

        # --- Step 10: Report Generator ---
        from src.report.report_generator import ReportGenerator
        console.print("[cyan]Generating daily report...[/cyan]")
        report_gen = ReportGenerator(
            api_key=settings.ANTHROPIC_API_KEY, model=settings.CLAUDE_MODEL
        )
        daily_report = await report_gen.generate_report(portfolio, date_str, settings.BANKROLL)

        # --- Step 11: Save bets to DB ---
        all_bets = portfolio.all_strong + portfolio.all_lean + portfolio.all_pass
        for bet in all_bets:
            bet_data = {
                "date": date_str,
                "sport": bet.sport,
                "league": "",
                "game": bet.game,
                "market": bet.market,
                "selection": bet.selection,
                "odds": float(bet.american_odds),
                "opening_odds": float(bet.american_odds),
                "closing_odds": None,
                "model_probability": bet.model_prob,
                "market_probability": 1.0 / (1.0 + abs(bet.american_odds) / 100.0),
                "expected_value": bet.ev,
                "edge": bet.edge,
                "risk_score": bet.risk_score,
                "confidence_score": bet.confidence_score,
                "stake_pct": bet.stake_pct,
                "classification": bet.classification,
                "result": None,
                "profit_loss": None,
                "roi": None,
                "closing_line_value": None,
                "session_id": session_id,
            }
            try:
                await db.save_bet(bet_data)
            except Exception as exc:
                logger.error("Failed to save bet %s: %s", bet.selection, exc)

        # --- Step 12: Telegram Delivery ---
        if settings.TELEGRAM_ENABLED:
            from src.telegram.bot import send_report
            console.print("[cyan]Sending report via Telegram...[/cyan]")
            telegram_chunks = report_gen.format_report_telegram(daily_report)
            await send_report(
                telegram_chunks,
                bot_token=settings.TELEGRAM_BOT_TOKEN,
                chat_id=settings.TELEGRAM_CHAT_ID,
                date=date_str,
            )
        else:
            logger.info("Telegram not configured — printing report to console")
            md_report = report_gen.format_report_markdown(daily_report)
            console.print(md_report[:3000] + "...[truncated]" if len(md_report) > 3000 else md_report)

        # Cleanup
        await odds_fetcher.close()
        await injury_fetcher.close()
        await weather_fetcher.close()
        await stats_fetcher.close()
        await db.close()

        console.rule(
            f"[bold green]Analysis Complete | "
            f"STRONG: {len(portfolio.all_strong)} | "
            f"LEAN: {len(portfolio.all_lean)} | "
            f"Exposure: {portfolio.total_exposure_pct*100:.2f}%[/bold green]"
        )
        logger.info("=== Daily Analysis Complete | session=%s ===", session_id)

    async def run_performance_grading(self) -> None:
        """Grade yesterday's bets and update model weights."""
        logger.info("=== Performance Grading Starting ===")
        from src.database.db_manager import DBManager
        from src.learning.performance_tracker import PerformanceTracker
        from src.learning.model_reweighter import ModelReweighter, weights_from_db_row

        db = DBManager(db_path=settings.DB_PATH)
        await db.initialize()

        tracker = PerformanceTracker(
            api_key=settings.ANTHROPIC_API_KEY, model=settings.CLAUDE_MODEL
        )
        reweighter = ModelReweighter()

        # Grade any completed bets
        await tracker.grade_completed_bets(db)

        # Calculate metrics
        metrics = await tracker.calculate_performance_metrics(db)

        if metrics.total_bets > 0:
            summary = await tracker.generate_performance_summary(metrics)
            logger.info("Performance summary generated (%d chars)", len(summary))

            # Reweight models
            weights_row = await db.get_model_weights()
            current_weights = weights_from_db_row(weights_row)
            new_weights = await reweighter.reweight_models(metrics, db, current_weights)

            if settings.TELEGRAM_ENABLED:
                from src.telegram.bot import send_alert
                alert = (
                    f"📊 <b>Performance Grading Complete</b>\n\n"
                    f"Bets: {metrics.total_bets} | ROI: {metrics.roi:.2f}% | "
                    f"Win Rate: {metrics.win_rate:.1%}\n"
                    f"Avg CLV: {metrics.avg_clv:.4f}\n\n"
                    f"<i>{summary[:300]}...</i>"
                )
                await send_alert(alert, settings.TELEGRAM_BOT_TOKEN, settings.TELEGRAM_CHAT_ID)

        await db.close()
        logger.info("=== Performance Grading Complete ===")
