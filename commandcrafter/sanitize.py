"""Input validation utilities. Port of utils/sanitize.ts."""
from __future__ import annotations

import re

MAX_ANALYZER_INPUT_LENGTH = 2000
MAX_CRON_COMMAND_LENGTH = 1000

_SPECIAL_CRON = re.compile(r"^@(reboot|yearly|annually|monthly|weekly|daily|midnight|hourly)$")
_PLAIN_CRON = re.compile(r"^[\d*,\-/]+$")

_DANGEROUS_PATTERNS = [
    re.compile(r"rm\s+-[a-zA-Z]*r[a-zA-Z]*f?\s+/(?!\w)"),
    re.compile(r"rm\s+-[a-zA-Z]*f[a-zA-Z]*r?\s+/(?!\w)"),
    re.compile(r":\s*\(\s*\)\s*\{.*\|.*:.*\}"),
    re.compile(r"\bmkfs\b"),
    re.compile(r"dd\s+.*of=/dev/(sd|hd|nvme|vd)"),
    re.compile(r"chmod\s+-R\s+777\s+/"),
    re.compile(r">\s*/dev/(sd|hd|nvme|vd)"),
    re.compile(r"(curl|wget)\s+.*\|\s*(ba|da|z|fi)?sh"),
    re.compile(r"mv\s+/dev/null\s+"),
]


def is_valid_cron_field(value: str) -> bool:
    if not value:
        return False
    if _SPECIAL_CRON.match(value):
        return True
    return bool(_PLAIN_CRON.match(value))


def is_dangerous_command(cmd: str) -> bool:
    return any(pat.search(cmd) for pat in _DANGEROUS_PATTERNS)


def truncate(value: str, max_length: int) -> str:
    return value[:max_length] if len(value) > max_length else value
