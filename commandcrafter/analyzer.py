"""Server-side Gemini analyzer.

The Gemini key lives only on the server. The browser sends the raw command;
the server returns a JSON object: {isError, explanation, errorDetails?, safetyLevel}.

A simple in-memory cooldown per client IP keeps abuse in check without
requiring a key/value store.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass

from .config import Config
from .sanitize import MAX_ANALYZER_INPUT_LENGTH, truncate

SYSTEM_INSTRUCTION = """You are a world-class Linux systems administrator and shell script expert.
Analyze the provided command. Identify its components, flags, and arguments.
Determine if the syntax is valid (ignoring context-specific file existence unless it's a logical impossibility).
Assess the safety level of the command.

Return a JSON object with:
- isError: boolean (true if syntax is broken or command is logically invalid)
- explanation: string (A concise, step-by-step breakdown using bullet points)
- errorDetails: string (Optional. Explain why it might fail)
- safetyLevel: string (One of: 'Safe', 'Caution', 'Dangerous')
"""

RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "isError": {"type": "BOOLEAN"},
        "explanation": {"type": "STRING"},
        "errorDetails": {"type": "STRING"},
        "safetyLevel": {"type": "STRING", "enum": ["Safe", "Caution", "Dangerous"]},
    },
    "required": ["isError", "explanation", "safetyLevel"],
}


@dataclass
class AnalysisError(Exception):
    message: str
    status_code: int = 502

    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.message


class _Cooldown:
    """Per-IP last-seen-timestamp map."""

    def __init__(self) -> None:
        self._last: dict[str, float] = {}

    def remaining(self, key: str, window: int) -> int:
        last = self._last.get(key, 0.0)
        elapsed = time.monotonic() - last
        if elapsed >= window:
            return 0
        return int(window - elapsed) + 1

    def hit(self, key: str) -> None:
        self._last[key] = time.monotonic()


_cooldowns = _Cooldown()


def analyze(command: str, config: Config, client_ip: str) -> dict[str, object]:
    """Send `command` to Gemini and return a parsed result dict.

    Raises AnalysisError on failure with a human-readable message.
    """
    if not config.analyzer_enabled:
        raise AnalysisError(
            "Analyzer disabled — set GEMINI_API_KEY in your .env to enable.",
            status_code=503,
        )
    trimmed = truncate((command or "").strip(), MAX_ANALYZER_INPUT_LENGTH)
    if not trimmed:
        raise AnalysisError("Command is empty.", status_code=400)

    wait = _cooldowns.remaining(client_ip, config.analyze_cooldown_seconds)
    if wait > 0:
        raise AnalysisError(f"Cooldown active. Retry in {wait}s.", status_code=429)

    try:
        # Lazy import so the rest of the app works without the SDK installed
        from google import genai  # type: ignore[import-not-found]
        from google.genai import types  # type: ignore[import-not-found]
    except ImportError as exc:  # pragma: no cover - environment issue
        raise AnalysisError(f"google-genai SDK not available: {exc}") from exc

    try:
        client = genai.Client(api_key=config.gemini_api_key)
        response = client.models.generate_content(
            model=config.gemini_model,
            contents=f"Analyze this Linux command: `{trimmed}`",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=RESPONSE_SCHEMA,
            ),
        )
        text = getattr(response, "text", "") or "{}"
        result = json.loads(text)
    except AnalysisError:
        raise
    except Exception as exc:  # noqa: BLE001 - network/API failures
        raise AnalysisError(f"Analysis failed: {exc}") from exc

    _cooldowns.hit(client_ip)
    if not isinstance(result, dict):
        raise AnalysisError("Gemini returned an unexpected response shape.")
    # Normalise expected keys
    return {
        "isError": bool(result.get("isError", False)),
        "explanation": str(result.get("explanation", "")),
        "errorDetails": str(result.get("errorDetails", "")) if result.get("errorDetails") else "",
        "safetyLevel": str(result.get("safetyLevel", "Caution")),
    }
