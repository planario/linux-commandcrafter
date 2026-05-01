"""find — filesystem search builder. Port of components/FindBuilder.tsx."""
from __future__ import annotations

from ..shell import shell_quote
from .base import FormData, to_bool


def build(form: FormData) -> str:
    path = (form.get("path") or ".").strip() or "."
    name_pattern = (form.get("name_pattern") or "").strip()
    type_ = (form.get("type") or "any").strip()
    case_insensitive = to_bool(form.get("case_insensitive"))

    parts = ["find", shell_quote(path)]
    if type_ in {"f", "d", "l"}:
        parts.append(f"-type {type_}")
    if name_pattern:
        flag = "-iname" if case_insensitive else "-name"
        parts.append(f"{flag} {shell_quote(name_pattern)}")
    return " ".join(parts).strip()
