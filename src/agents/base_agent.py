"""
Base Claude agent class for all four specialized agents.
"""

import json
import logging
from typing import Any, Dict, Optional

import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class BaseAgent:
    """Wraps the Anthropic Claude API for structured agent reasoning."""

    def __init__(
        self,
        name: str,
        system_prompt: str,
        model: str,
        client: anthropic.Anthropic,
        max_tokens: int = 4096,
    ) -> None:
        self.name = name
        self.system_prompt = system_prompt
        self.model = model
        self.client = client
        self.max_tokens = max_tokens

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=30))
    async def think(self, user_message: str, context: Optional[Dict] = None) -> str:
        """Send a message and return the text response."""
        import asyncio

        full_message = user_message
        if context:
            context_str = self._build_context_message(context)
            full_message = f"{context_str}\n\n{user_message}"

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=self.system_prompt,
                messages=[{"role": "user", "content": full_message}],
            ),
        )
        text = response.content[0].text
        logger.debug("[%s] tokens in=%d out=%d", self.name, response.usage.input_tokens, response.usage.output_tokens)
        return text

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=30))
    async def think_json(self, user_message: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Same as think() but expects and parses JSON response."""
        text = await self.think(user_message + "\n\nRespond ONLY with valid JSON.", context)
        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
        start = text.find("[")
        end = text.rfind("]") + 1
        if start >= 0 and end > start:
            try:
                return {"items": json.loads(text[start:end])}
            except json.JSONDecodeError:
                pass
        logger.warning("[%s] Could not parse JSON response, returning raw text", self.name)
        return {"raw_text": text}

    def _build_context_message(self, context: Dict) -> str:
        lines = ["=== CONTEXT ==="]
        for key, value in context.items():
            if isinstance(value, (dict, list)):
                lines.append(f"{key}:\n{json.dumps(value, indent=2, default=str)}")
            else:
                lines.append(f"{key}: {value}")
        lines.append("=== END CONTEXT ===")
        return "\n".join(lines)
