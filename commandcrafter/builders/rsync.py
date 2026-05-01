"""rsync builder. Port of components/RsyncBuilder.tsx."""
from __future__ import annotations

from ..shell import shell_quote
from .base import FormData, to_bool


def build(form: FormData) -> str:
    source = (form.get("source") or "").strip()
    destination = (form.get("destination") or "").strip()
    archive = to_bool(form.get("archive"))
    verbose = to_bool(form.get("verbose"))
    compress = to_bool(form.get("compress"))
    progress = to_bool(form.get("progress"))
    delete = to_bool(form.get("delete"))
    dry_run = to_bool(form.get("dry_run"))
    identity = (form.get("identity") or "").strip()
    ssh_port = (form.get("ssh_port") or "").strip()
    exclude = (form.get("exclude") or "").strip()

    parts = ["rsync"]
    flags = ""
    if archive:
        flags += "a"
    if verbose:
        flags += "v"
    if compress:
        flags += "z"
    if dry_run:
        flags += "n"
    if flags:
        parts.append(f"-{flags}")
    if progress:
        parts.append("--progress")
    if delete:
        parts.append("--delete")
    if exclude:
        parts.append(f"--exclude={shell_quote(exclude)}")

    if ssh_port or identity:
        rsh_parts = ["ssh"]
        if ssh_port:
            rsh_parts.extend(["-p", ssh_port])
        if identity:
            rsh_parts.extend(["-i", shell_quote(identity)])
        parts.append(f"-e {shell_quote(' '.join(rsh_parts))}")

    parts.append(shell_quote(source))
    parts.append(shell_quote(destination))
    return " ".join(parts).strip()
