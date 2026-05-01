"""scp builder. Port of components/ScpBuilder.tsx."""
from __future__ import annotations

from ..shell import shell_quote
from .base import FormData, to_bool


def build(form: FormData) -> str:
    source = (form.get("source") or "").strip()
    destination = (form.get("destination") or "").strip()
    port = (form.get("port") or "").strip()
    identity = (form.get("identity") or "").strip()
    auth_token = (form.get("auth_token") or "").strip()

    flags = ""
    if to_bool(form.get("recursive")):
        flags += "r"
    if to_bool(form.get("preserve")):
        flags += "p"
    if to_bool(form.get("compress")):
        flags += "C"
    if to_bool(form.get("verbose")):
        flags += "v"

    parts = ["scp"]
    if flags:
        parts.append(f"-{flags}")
    if port:
        parts.append(f"-P {port}")
    if identity:
        parts.append(f"-i {shell_quote(identity)}")
    parts.append(shell_quote(source))
    parts.append(shell_quote(destination))

    cmd = " ".join(parts).strip()
    if auth_token:
        return f"AUTH_TOKEN={shell_quote(auth_token)} {cmd}"
    return cmd
