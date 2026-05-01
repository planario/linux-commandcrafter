"""chmod builder. Port of components/ChmodBuilder.tsx."""
from __future__ import annotations

from .base import FormData, to_bool


def build(form: FormData) -> str:
    mode = (form.get("mode") or "symbolic").strip()
    path = (form.get("path") or "").strip()
    recursive = to_bool(form.get("recursive"))

    parts = ["chmod"]
    if recursive:
        parts.append("-R")

    if mode == "octal":
        octal = (form.get("octal") or "000").strip() or "000"
        parts.append(octal)
    else:
        who = ""
        if to_bool(form.get("who_user")):
            who += "u"
        if to_bool(form.get("who_group")):
            who += "g"
        if to_bool(form.get("who_others")):
            who += "o"
        action = (form.get("action") or "+").strip() or "+"
        if action not in {"+", "-", "="}:
            action = "+"
        perms = ""
        if to_bool(form.get("perm_read")):
            perms += "r"
        if to_bool(form.get("perm_write")):
            perms += "w"
        if to_bool(form.get("perm_execute")):
            perms += "x"
        if who and perms:
            parts.append(f"{who}{action}{perms}")

    if path:
        parts.append(path)
    return " ".join(parts).strip()
