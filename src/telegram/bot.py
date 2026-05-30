"""
Telegram bot delivery for the daily betting report.
"""

import asyncio
import logging
from typing import List

logger = logging.getLogger(__name__)


async def send_report(
    report_chunks: List[str],
    bot_token: str,
    chat_id: str,
    date: str = "",
) -> bool:
    """
    Send the daily report to Telegram as multiple messages.
    Returns True if all messages sent successfully.

    Args:
        report_chunks: List of pre-formatted HTML message strings
        bot_token: Telegram Bot API token
        chat_id: Target chat/channel ID
        date: Report date string for the header message
    """
    if not bot_token or not chat_id:
        logger.warning("Telegram not configured — skipping delivery")
        return False

    try:
        from telegram import Bot
        from telegram.constants import ParseMode
    except ImportError:
        logger.error("python-telegram-bot not installed. Run: pip install python-telegram-bot>=21.0")
        return False

    # Normalize chat_id — Telegram accepts string or int
    chat_id_norm = str(chat_id).strip()

    bot = Bot(token=bot_token)
    success_count = 0

    try:
        # Test connection
        me = await bot.get_me()
        logger.info("Telegram bot connected: @%s", me.username)
    except Exception as exc:
        logger.error("Telegram connection failed: %s", exc)
        return False

    # Always send at least a fallback header so the user knows the bot is alive
    if not report_chunks:
        report_chunks = ["⚠️ <b>Betting Platform</b>\n\nNo qualifying bets found today. Markets analyzed — no positive EV opportunities met thresholds."]

    for i, chunk in enumerate(report_chunks):
        try:
            await bot.send_message(
                chat_id=chat_id_norm,
                text=chunk,
                parse_mode=ParseMode.HTML,
                disable_web_page_preview=True,
            )
            success_count += 1
            logger.debug("Sent Telegram chunk %d/%d", i + 1, len(report_chunks))
            # Respect Telegram rate limits (30 messages/second per bot)
            if i < len(report_chunks) - 1:
                await asyncio.sleep(1.0)
        except Exception as exc:
            logger.error("Failed to send Telegram chunk %d: %s", i + 1, exc)
            # Continue sending remaining chunks
            await asyncio.sleep(2.0)

    logger.info(
        "Telegram delivery complete: %d/%d chunks sent",
        success_count, len(report_chunks),
    )
    return success_count == len(report_chunks)


async def send_alert(message: str, bot_token: str, chat_id: str) -> bool:
    """
    Send a plain-text alert message to Telegram.
    Used for error notifications and system status.
    """
    if not bot_token or not chat_id:
        logger.debug("Telegram not configured — skipping alert")
        return False

    try:
        from telegram import Bot
    except ImportError:
        logger.error("python-telegram-bot not installed")
        return False

    try:
        bot = Bot(token=bot_token)
        await bot.send_message(
            chat_id=str(chat_id).strip(),
            text=f"⚠️ <b>Betting Platform Alert</b>\n\n{message}",
            parse_mode="HTML",
        )
        return True
    except Exception as exc:
        logger.error("Failed to send Telegram alert: %s", exc)
        return False
