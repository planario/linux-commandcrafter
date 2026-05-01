"""ip command builder. Port of components/IpBuilder.tsx."""
from __future__ import annotations

import re

from .base import FormData

_WS = re.compile(r"\s+")


def build(form: FormData) -> str:
    mode = (form.get("mode") or "addr").strip() or "addr"
    sub = (form.get("subcommand") or "show").strip() or "show"
    device = (form.get("device") or "").strip()
    address = (form.get("address") or "").strip()
    link_state = (form.get("link_state") or "up").strip() or "up"
    gateway = (form.get("gateway") or "").strip()
    route_dest = (form.get("route_dest") or "default").strip() or "default"

    parts = [f"ip {mode}", sub]

    if mode == "addr":
        if sub in {"add", "del"}:
            parts.append(address)
            parts.append(f"dev {device}")
        elif sub == "show" and device:
            parts.append(f"dev {device}")
    elif mode == "link":
        if sub == "set":
            parts.append(f"dev {device}")
            parts.append(link_state)
        elif sub == "show" and device:
            parts.append(f"dev {device}")
    elif mode == "route":
        if sub == "add":
            parts.append(route_dest)
            parts.append(f"via {gateway}")
            if device:
                parts.append(f"dev {device}")
        elif sub == "del":
            parts.append(route_dest)

    return _WS.sub(" ", " ".join(parts)).strip()
