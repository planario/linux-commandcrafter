"""Shell quoting helper. Port of utils/shell.ts."""
from __future__ import annotations


def shell_quote(value: str) -> str:
    """Wrap a value in single quotes, escaping any embedded ones.

    Equivalent to the JS `shellQuote` helper:
        `'${s.replace(/'/g, "'\\''")}'`
    """
    return "'" + value.replace("'", "'\\''") + "'"
