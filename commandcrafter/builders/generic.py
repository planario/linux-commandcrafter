"""Generic flag/value builder. Port of components/CommandBuilder.tsx."""
from __future__ import annotations

from ..commands import COMMANDS, OptionType, find_command
from ..shell import shell_quote
from .base import BuilderSpec, FormData, to_bool


def _first_flag(flag_spec: str) -> str:
    """Pick the canonical flag from "-i, --interactive"."""
    return flag_spec.split(",")[0].strip()


def build_for(name: str, form: FormData) -> str:
    cmd = find_command(name)
    if cmd is None:
        return ""
    parts: list[str] = [cmd.base_command]
    option_parts: list[str] = []
    for opt in cmd.options:
        if not to_bool(form.get(f"opt:{opt.name}")):
            continue
        flag = _first_flag(opt.flag)
        if opt.type == OptionType.VALUE:
            value = (form.get(f"val:{opt.name}") or "").strip()
            if value:
                option_parts.append(f"{flag} {shell_quote(value)}")
        else:
            option_parts.append(flag)
    if option_parts:
        parts.append(" ".join(option_parts))

    arg_parts: list[str] = []
    for arg in cmd.args:
        value = (form.get(f"arg:{arg.name}") or "").strip()
        if value:
            arg_parts.append(shell_quote(value))
    if arg_parts:
        parts.append(" ".join(arg_parts))

    return " ".join(parts).strip()


def make_specs() -> list[BuilderSpec]:
    """One BuilderSpec per generic command in COMMANDS."""
    specs: list[BuilderSpec] = []
    for cmd in COMMANDS:
        specs.append(
            BuilderSpec(
                id=cmd.name,
                label=cmd.name,
                title=cmd.name,
                description=cmd.description,
                template="builders/_generic.html",
                build=lambda form, _name=cmd.name: build_for(_name, form),
            )
        )
    return specs
