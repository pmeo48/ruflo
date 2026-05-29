"""
Settings module — loads all configuration from environment variables via python-dotenv.
"""

import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the project root (two levels up from config/)
_project_root = Path(__file__).resolve().parent.parent
load_dotenv(_project_root / ".env", override=False)


class Settings:
    """Central configuration object. All values read from environment at instantiation."""

    def __init__(self) -> None:
        # --- API keys ---
        self.ANTHROPIC_API_KEY: str = os.environ.get("ANTHROPIC_API_KEY", "")
        self.ODDS_API_KEY: str = os.environ.get("ODDS_API_KEY", "")
        self.OPENWEATHER_API_KEY: str = os.environ.get("OPENWEATHER_API_KEY", "")
        self.TELEGRAM_BOT_TOKEN: str = os.environ.get("TELEGRAM_BOT_TOKEN", "")
        self.TELEGRAM_CHAT_ID: str = os.environ.get("TELEGRAM_CHAT_ID", "")

        # --- Betting ---
        self.BANKROLL: float = float(os.environ.get("BANKROLL", "1000.0"))

        # --- Storage ---
        self.DB_PATH: str = os.environ.get("DB_PATH", "data/betting.db")

        # --- Logging ---
        self.LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO").upper()

        # --- Claude model ---
        self.CLAUDE_MODEL: str = os.environ.get("CLAUDE_MODEL", "claude-opus-4-5")

        # --- Derived flags ---
        self.DEMO_MODE: bool = not bool(self.ODDS_API_KEY)
        self.TELEGRAM_ENABLED: bool = bool(self.TELEGRAM_BOT_TOKEN and self.TELEGRAM_CHAT_ID)

    def validate(self) -> None:
        """Raise ValueError for critical missing config."""
        if not self.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY is required but not set.")

    def configure_logging(self) -> None:
        """Apply log level to root logger."""
        numeric_level = getattr(logging, self.LOG_LEVEL, logging.INFO)
        logging.basicConfig(
            level=numeric_level,
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )


# Singleton instance
settings = Settings()
