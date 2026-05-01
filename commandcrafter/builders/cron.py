"""crontab builder. Port of components/CronBuilder.tsx."""
from __future__ import annotations

from ..sanitize import MAX_CRON_COMMAND_LENGTH, is_dangerous_command, is_valid_cron_field, truncate
from .base import FormData


def build(form: FormData) -> str:
    minute = (form.get("minute") or "*").strip() or "*"
    hour = (form.get("hour") or "*").strip() or "*"
    dom = (form.get("dom") or "*").strip() or "*"
    month = (form.get("month") or "*").strip() or "*"
    dow = (form.get("dow") or "*").strip() or "*"
    command = truncate((form.get("command") or "").strip(), MAX_CRON_COMMAND_LENGTH)
    return f"{minute} {hour} {dom} {month} {dow} {command}".rstrip()


def validate(form: FormData) -> dict[str, bool | list[str]]:
    """Return validation hints for the form: invalid fields and danger flag."""
    fields = {
        "minute": form.get("minute") or "*",
        "hour": form.get("hour") or "*",
        "dom": form.get("dom") or "*",
        "month": form.get("month") or "*",
        "dow": form.get("dow") or "*",
    }
    invalid = [name for name, value in fields.items() if not is_valid_cron_field(value)]
    return {
        "invalid": invalid,
        "dangerous": is_dangerous_command(form.get("command") or ""),
    }
