"""sed builder. Port of components/SedBuilder.tsx."""
from __future__ import annotations

from ..shell import shell_quote
from .base import FormData, to_bool


def build(form: FormData) -> str:
    search = form.get("search") or ""
    replace = form.get("replace") or ""
    file = (form.get("file") or "").strip()
    in_place = to_bool(form.get("in_place"))
    is_global = to_bool(form.get("is_global"))
    case_insensitive = to_bool(form.get("case_insensitive"))

    parts = ["sed"]
    if in_place:
        parts.append("-i")

    flags = ""
    if is_global:
        flags += "g"
    if case_insensitive:
        flags += "i"

    escaped_search = search.replace("/", r"\/")
    escaped_replace = replace.replace("\\", "\\\\").replace("&", r"\&").replace("/", r"\/")

    parts.append(f"'s/{escaped_search}/{escaped_replace}/{flags}'")
    if file:
        parts.append(shell_quote(file))
    return " ".join(parts).strip()
