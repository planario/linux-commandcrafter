"""git builder. Port of components/GitBuilder.tsx."""
from __future__ import annotations

from urllib.parse import quote, urlsplit, urlunsplit

from ..shell import shell_quote
from .base import FormData, to_bool


def _inject_token(url: str, token: str) -> str:
    if not token or not url.startswith("https://"):
        return url
    try:
        parts = urlsplit(url)
        netloc = parts.netloc.split("@", 1)[-1]
        new_netloc = f"{quote(token, safe='')}@{netloc}"
        return urlunsplit((parts.scheme, new_netloc, parts.path, parts.query, parts.fragment))
    except ValueError:
        return url


def build(form: FormData) -> str:
    sub = (form.get("subcommand") or "clone").strip()
    parts = ["git", sub]

    if sub == "clone":
        repo = (form.get("clone_repo") or "").strip()
        token = (form.get("api_key") or "").strip()
        repo = _inject_token(repo, token) if token else repo
        if repo:
            parts.append(repo)
        clone_dir = (form.get("clone_dir") or "").strip()
        if clone_dir:
            parts.append(shell_quote(clone_dir))
    elif sub == "add":
        path = (form.get("add_path") or ".").strip() or "."
        parts.append(shell_quote(path))
    elif sub == "commit":
        if to_bool(form.get("commit_amend")):
            parts.append("--amend")
        msg = (form.get("commit_msg") or "").strip()
        if msg:
            parts.append(f"-m {shell_quote(msg)}")
    elif sub == "push":
        if to_bool(form.get("push_force")):
            parts.append("--force")
        remote = (form.get("push_remote") or "origin").strip() or "origin"
        branch = (form.get("push_branch") or "main").strip() or "main"
        parts.append(remote)
        parts.append(branch)
    elif sub == "pull":
        remote = (form.get("pull_remote") or "origin").strip() or "origin"
        branch = (form.get("pull_branch") or "main").strip() or "main"
        parts.append(remote)
        parts.append(branch)
    elif sub == "branch":
        name = (form.get("branch_name") or "").strip()
        if name:
            parts.append(name)
    elif sub == "checkout":
        if to_bool(form.get("checkout_new")):
            parts.append("-b")
        name = (form.get("checkout_name") or "").strip()
        if name:
            parts.append(name)

    return " ".join(parts).strip()
