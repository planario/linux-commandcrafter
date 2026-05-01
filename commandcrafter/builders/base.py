"""Builder registry and shared types."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Mapping


FormData = Mapping[str, str]
BuildFn = Callable[[FormData], str]


@dataclass(frozen=True)
class BuilderSpec:
    """Describes a registered builder.

    `id` is the URL slug and history `type` label. `template` is the Jinja
    partial under templates/builders/. `build` is a pure function that turns
    the form's flat string-to-string mapping into the generated command.
    """

    id: str
    label: str
    title: str
    description: str
    template: str
    build: BuildFn
    multiline: bool = False


def to_bool(value: str | None) -> bool:
    """Coerce a checkbox/text value to bool. HTML forms submit `on`/`true`/`1`."""
    if value is None:
        return False
    return value.strip().lower() in {"on", "true", "1", "yes"}


def get(form: FormData, key: str, default: str = "") -> str:
    return (form.get(key) or default).strip() if form.get(key) is not None else default
