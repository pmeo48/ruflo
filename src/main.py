"""
Entry point for the sports betting intelligence platform.

Usage:
    python -m src.main              # start the APScheduler daemon
    python -m src.main --run-now    # execute the full pipeline immediately
"""

import argparse
import asyncio
import logging
import sys

from rich.console import Console
from rich.logging import RichHandler

from config.settings import settings

console = Console()


def _setup_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
        format="%(message)s",
        datefmt="[%X]",
        handlers=[RichHandler(console=console, rich_tracebacks=True)],
    )


async def _run_now() -> None:
    """Execute the full daily analysis pipeline immediately."""
    from src.scheduler.scheduler import BettingScheduler

    scheduler = BettingScheduler()
    console.rule("[bold green]Running analysis pipeline NOW[/bold green]")
    await scheduler.run_daily_analysis()
    console.rule("[bold green]Pipeline complete[/bold green]")


def main() -> None:
    _setup_logging()

    parser = argparse.ArgumentParser(description="Sports Betting Intelligence Platform")
    parser.add_argument(
        "--run-now",
        action="store_true",
        help="Execute the full pipeline immediately instead of scheduling",
    )
    args = parser.parse_args()

    try:
        settings.validate()
    except ValueError as exc:
        console.print(f"[bold red]Configuration error:[/bold red] {exc}")
        sys.exit(1)

    if args.run_now:
        asyncio.run(_run_now())
    else:
        from src.scheduler.scheduler import BettingScheduler

        console.rule("[bold blue]Sports Betting Intelligence Platform[/bold blue]")
        console.print(f"  Model       : {settings.CLAUDE_MODEL}")
        console.print(f"  Bankroll    : ${settings.BANKROLL:,.2f}")
        console.print(f"  Demo mode   : {settings.DEMO_MODE}")
        console.print(f"  Telegram    : {settings.TELEGRAM_ENABLED}")
        console.print(f"  DB path     : {settings.DB_PATH}")
        console.rule()

        scheduler = BettingScheduler()
        scheduler.start()


if __name__ == "__main__":
    main()
