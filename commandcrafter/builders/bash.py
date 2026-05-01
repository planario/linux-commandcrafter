"""Bash script builder. Port of components/BashBuilder.tsx (block-based scripts).

The browser keeps the block tree as a JSON value (using Alpine.js) and submits
it as a single hidden field. We render it server-side.
"""
from __future__ import annotations

import json
from typing import Any

from .base import FormData

VALID_TYPES = {"shebang", "comment", "variable", "echo", "read", "command", "if", "for"}


def _parse_blocks(payload: str) -> list[dict[str, Any]]:
    if not payload:
        return [{"type": "shebang", "data": {"interpreter": "/bin/bash"}}]
    try:
        data = json.loads(payload)
    except (ValueError, TypeError):
        return [{"type": "shebang", "data": {"interpreter": "/bin/bash"}}]
    if not isinstance(data, list):
        return [{"type": "shebang", "data": {"interpreter": "/bin/bash"}}]
    return [b for b in data if isinstance(b, dict) and b.get("type") in VALID_TYPES]


def _render(blocks: list[dict[str, Any]], indent: str = "") -> str:
    out: list[str] = []
    for block in blocks:
        btype = block.get("type")
        data = block.get("data") or {}
        if btype == "shebang":
            interpreter = str(data.get("interpreter") or "/bin/bash")
            out.append(f"#!{interpreter}\n")
        elif btype == "comment":
            text = str(data.get("text") or "")
            out.append(f"{indent}# {text}")
        elif btype == "variable":
            name = str(data.get("name") or "VAR")
            value = str(data.get("value") or "")
            out.append(f"{indent}{name}={value}")
        elif btype == "echo":
            text = str(data.get("text") or "")
            out.append(f"{indent}echo {text}")
        elif btype == "read":
            prompt = str(data.get("prompt") or "")
            variable = str(data.get("variable") or "INPUT")
            escaped_prompt = prompt.replace("'", "'\\''")
            out.append(f"{indent}read -p '{escaped_prompt}' {variable}")
        elif btype == "command":
            command = str(data.get("command") or "")
            out.append(f"{indent}{command}")
        elif btype == "if":
            condition = str(data.get("condition") or "true")
            main_blocks = data.get("mainBlocks") or []
            else_blocks = data.get("elseBlocks") or []
            out.append(f"{indent}if {condition}; then")
            inner = _render(main_blocks, indent + "  ")
            if inner:
                out.append(inner)
            if else_blocks:
                out.append(f"{indent}else")
                inner_else = _render(else_blocks, indent + "  ")
                if inner_else:
                    out.append(inner_else)
            out.append(f"{indent}fi")
        elif btype == "for":
            variable = str(data.get("variable") or "i")
            iterable = str(data.get("list") or "")
            main_blocks = data.get("mainBlocks") or []
            out.append(f"{indent}for {variable} in {iterable}; do")
            inner = _render(main_blocks, indent + "  ")
            if inner:
                out.append(inner)
            out.append(f"{indent}done")
    return "\n".join(out)


def build(form: FormData) -> str:
    blocks = _parse_blocks(form.get("blocks") or "")
    return _render(blocks).strip()
