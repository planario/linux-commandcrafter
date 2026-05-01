"""Runtime configuration loaded from environment variables.

All settings here are read once at app start and are runtime-tunable
(unlike the React build where the API key was baked into the bundle).
"""
from __future__ import annotations

import os
from dataclasses import dataclass


def _bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Config:
    gemini_api_key: str
    gemini_model: str
    host: str
    port: int
    debug: bool
    analyze_cooldown_seconds: int

    @classmethod
    def from_env(cls) -> "Config":
        return cls(
            gemini_api_key=os.environ.get("GEMINI_API_KEY", "").strip(),
            gemini_model=os.environ.get("GEMINI_MODEL", "gemini-2.0-flash").strip(),
            host=os.environ.get("HOST", "0.0.0.0").strip(),
            port=int(os.environ.get("PORT", "7256")),
            debug=_bool(os.environ.get("DEBUG"), default=False),
            analyze_cooldown_seconds=int(os.environ.get("ANALYZE_COOLDOWN_SECONDS", "10")),
        )

    @property
    def analyzer_enabled(self) -> bool:
        return bool(self.gemini_api_key)
