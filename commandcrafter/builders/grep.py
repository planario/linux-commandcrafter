"""grep — text search builder. Port of components/GrepBuilder.tsx."""
from __future__ import annotations

from ..shell import shell_quote
from .base import FormData, to_bool


def build(form: FormData) -> str:
    pattern = (form.get("pattern") or "").strip()
    path = (form.get("path") or "").strip()

    flags = ""
    if to_bool(form.get("recursive")):
        flags += "r"
    if to_bool(form.get("ignore_case")):
        flags += "i"
    if to_bool(form.get("invert")):
        flags += "v"
    if to_bool(form.get("files_only")):
        flags += "l"
    if to_bool(form.get("line_numbers")):
        flags += "n"
    if to_bool(form.get("whole_word")):
        flags += "w"

    parts = ["grep"]
    if flags:
        parts.append(f"-{flags}")
    parts.append(shell_quote(pattern))
    if path:
        parts.append(shell_quote(path))
    return " ".join(parts).strip()
