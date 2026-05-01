"""Ansible playbook builder. Port of components/AnsibleBuilder.tsx."""
from __future__ import annotations

import json
import re

from .base import FormData, to_bool

_BOOL_LIKE = re.compile(r"^(true|false|yes|no|on|off|null|~)$", re.IGNORECASE)
_OCTAL_LIKE = re.compile(r"^0[0-7]+$")
_SPECIAL = re.compile(r"[:#\[\]{}&*!|>'\"%@`]")
_LEAD_OR_TRAIL_WS = re.compile(r"(^\s|\s$)")

PRESETS: dict[str, dict[str, object]] = {
    "package": {
        "name": "Ensure package is installed",
        "module": "package",
        "args": {"name": "nginx", "state": "present"},
    },
    "apt": {
        "name": "Update cache and install via APT",
        "module": "apt",
        "args": {"name": "nginx", "state": "present", "update_cache": "yes"},
    },
    "dnf": {
        "name": "Update cache and install via DNF",
        "module": "dnf",
        "args": {"name": "nginx", "state": "present", "update_cache": "yes"},
    },
    "yum": {
        "name": "Update cache and install via YUM",
        "module": "yum",
        "args": {"name": "nginx", "state": "present", "update_cache": "yes"},
    },
    "service": {
        "name": "Ensure service is started",
        "module": "service",
        "args": {"name": "nginx", "state": "started", "enabled": "yes"},
    },
    "copy": {
        "name": "Copy local config to remote",
        "module": "copy",
        "args": {"src": "/local/path/file.conf", "dest": "/etc/file.conf", "mode": "0644"},
    },
    "command": {
        "name": "Execute shell command",
        "module": "command",
        "args": {"cmd": "uptime"},
    },
    "user": {
        "name": "Create deployment user",
        "module": "user",
        "args": {"name": "deploy", "state": "present", "shell": "/bin/bash"},
    },
}


def yaml_quote(value: str) -> str:
    if value == "":
        return '""'
    if (
        _BOOL_LIKE.match(value)
        or _OCTAL_LIKE.match(value)
        or _SPECIAL.search(value)
        or _LEAD_OR_TRAIL_WS.search(value)
    ):
        escaped = value.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return value


def _parse_tasks_payload(payload: str) -> list[dict[str, object]]:
    """Tasks come in as a JSON blob in a hidden form field."""
    if not payload:
        return []
    try:
        data = json.loads(payload)
        if not isinstance(data, list):
            return []
        return [t for t in data if isinstance(t, dict)]
    except (ValueError, TypeError):
        return []


def build(form: FormData) -> str:
    name = (form.get("playbook_name") or "My Automation Playbook").strip() or "My Automation Playbook"
    hosts = (form.get("hosts") or "all").strip() or "all"
    become = to_bool(form.get("become"))
    tasks = _parse_tasks_payload(form.get("tasks") or "")

    lines = [
        "---",
        f"- name: {name}",
        f"  hosts: {hosts}",
        f"  become: {'true' if become else 'false'}",
    ]

    if tasks:
        lines.append("")
        lines.append("  tasks:")
        for task in tasks:
            task_name = str(task.get("name", "")).strip() or "Unnamed task"
            module = str(task.get("module", "command")).strip() or "command"
            args = task.get("args") or {}
            if not isinstance(args, dict):
                args = {}
            lines.append(f"    - name: {task_name}")
            lines.append(f"      ansible.builtin.{module}:")
            for key, value in args.items():
                str_value = str(value).strip()
                if not str_value:
                    continue
                lines.append(f"        {key}: {yaml_quote(str_value)}")
            lines.append("")

    return "\n".join(lines).rstrip()
