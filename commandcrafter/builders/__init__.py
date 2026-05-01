"""Built-in builders: registry + plugin discovery.

To add a new builder, append to BUILTIN_SPECS below or call `register()`
before the first request.
"""
from __future__ import annotations

from . import (
    ansible,
    bash,
    chmod,
    cron,
    ffmpeg,
    find,
    git,
    grep,
    ip,
    lxc,
    rsync,
    scp,
    sed,
    ssh,
    ufw,
)
from .base import BuilderSpec, FormData
from .generic import make_specs as make_generic_specs

REGISTRY: dict[str, BuilderSpec] = {}


def register(spec: BuilderSpec) -> None:
    if spec.id in REGISTRY:
        return
    REGISTRY[spec.id] = spec


def all_builders() -> list[BuilderSpec]:
    return sorted(REGISTRY.values(), key=lambda s: s.id)


def get(builder_id: str) -> BuilderSpec | None:
    return REGISTRY.get(builder_id)


BUILTIN_SPECS: list[BuilderSpec] = [
    BuilderSpec(
        id="ssh",
        label="ssh",
        title="SSH Manager",
        description="Tools for key generation, distribution, and server hardening.",
        template="builders/ssh.html",
        build=ssh.build,
        multiline=False,
    ),
    BuilderSpec(
        id="ansible-playbook",
        label="ansible-playbook",
        title="Ansible Playbook Builder",
        description="Visually create automation playbooks for any distribution.",
        template="builders/ansible.html",
        build=ansible.build,
        multiline=True,
    ),
    BuilderSpec(
        id="bash",
        label="bash",
        title="Bash Script Builder",
        description="Visually construct scripts with interactive blocks.",
        template="builders/bash.html",
        build=bash.build,
        multiline=True,
    ),
    BuilderSpec(
        id="chmod",
        label="chmod",
        title="Chmod Builder",
        description="Change file and directory permissions.",
        template="builders/chmod.html",
        build=chmod.build,
    ),
    BuilderSpec(
        id="crontab",
        label="crontab",
        title="Crontab Generator",
        description="Create a schedule for your automated tasks.",
        template="builders/cron.html",
        build=cron.build,
    ),
    BuilderSpec(
        id="ffmpeg",
        label="ffmpeg",
        title="FFmpeg Builder",
        description="Craft commands for video and audio manipulation.",
        template="builders/ffmpeg.html",
        build=ffmpeg.build,
    ),
    BuilderSpec(
        id="find",
        label="find",
        title="Find Builder",
        description="Search for files and directories in a hierarchy.",
        template="builders/find.html",
        build=find.build,
    ),
    BuilderSpec(
        id="git",
        label="git",
        title="Git Command Builder",
        description="Construct commands for version control with Git.",
        template="builders/git.html",
        build=git.build,
    ),
    BuilderSpec(
        id="grep",
        label="grep",
        title="Grep Builder",
        description="Find text patterns within files.",
        template="builders/grep.html",
        build=grep.build,
    ),
    BuilderSpec(
        id="ip",
        label="ip",
        title="IP Command Builder",
        description="Manage network addresses, interfaces, and routes.",
        template="builders/ip.html",
        build=ip.build,
    ),
    BuilderSpec(
        id="lxc",
        label="lxc",
        title="LXC Container Builder",
        description="Create and launch customized system containers.",
        template="builders/lxc.html",
        build=lxc.build,
    ),
    BuilderSpec(
        id="rsync",
        label="rsync",
        title="Rsync Builder",
        description="Synchronize files efficiently across systems.",
        template="builders/rsync.html",
        build=rsync.build,
    ),
    BuilderSpec(
        id="scp",
        label="scp",
        title="Scp Builder",
        description="Securely copy files over SSH.",
        template="builders/scp.html",
        build=scp.build,
    ),
    BuilderSpec(
        id="sed",
        label="sed",
        title="Sed Builder",
        description="Craft stream editor commands for find & replace.",
        template="builders/sed.html",
        build=sed.build,
    ),
    BuilderSpec(
        id="ufw",
        label="ufw",
        title="UFW Manager",
        description="Visually manage rules for the Uncomplicated Firewall.",
        template="builders/ufw.html",
        build=ufw.build,
    ),
]


for _spec in BUILTIN_SPECS:
    register(_spec)
for _generic in make_generic_specs():
    register(_generic)


__all__ = [
    "BuilderSpec",
    "FormData",
    "REGISTRY",
    "all_builders",
    "get",
    "register",
    "ssh",
    "cron",
    "ansible",
]
