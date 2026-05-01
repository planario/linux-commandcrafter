"""ufw builder. Port of components/UfwBuilder.tsx."""
from __future__ import annotations

from .base import FormData


def build(form: FormData) -> str:
    quick = (form.get("quick") or "").strip()
    if quick:
        return quick

    action = (form.get("action") or "allow").strip() or "allow"
    direction = (form.get("direction") or "in").strip() or "in"
    protocol = (form.get("protocol") or "tcp").strip() or "tcp"
    port = (form.get("port") or "").strip()
    from_ip = (form.get("from_ip") or "").strip()
    to_ip = (form.get("to_ip") or "").strip()

    parts = [f"ufw {action}"]
    if direction != "none":
        parts.append(direction)
    if from_ip:
        parts.append(f"from {from_ip}")
    if to_ip:
        parts.append(f"to {to_ip}")
    if port:
        parts.append(f"port {port}")
        if protocol != "none":
            parts.append(f"proto {protocol}")
    return " ".join(parts).strip()
