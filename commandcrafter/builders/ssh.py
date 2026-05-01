"""SSH manager builder. Port of components/SshBuilder.tsx.

This builder produces three (or four) commands at once rather than a single
generated string, matching the original UI. The route renders all of them.
"""
from __future__ import annotations

from ..shell import shell_quote
from .base import FormData, to_bool


def build_keygen(form: FormData) -> str:
    filename = (form.get("key_filename") or "id_rsa_server").strip() or "id_rsa_server"
    comment = (form.get("key_comment") or "").strip()
    return f"ssh-keygen -t rsa -b 4096 -f ~/.ssh/{filename} -C {shell_quote(comment)}"


def build_copy_id(form: FormData) -> str:
    user = (form.get("remote_user") or "root").strip() or "root"
    host = (form.get("remote_host") or "your-server").strip() or "your-server"
    pubkey = (form.get("public_key_path") or "~/.ssh/id_rsa.pub").strip() or "~/.ssh/id_rsa.pub"
    return f"ssh-copy-id -i {shell_quote(pubkey)} {user}@{host}"


def build_manual_copy(form: FormData) -> str:
    user = (form.get("remote_user") or "root").strip() or "root"
    host = (form.get("remote_host") or "your-server").strip() or "your-server"
    pubkey = (form.get("public_key_path") or "~/.ssh/id_rsa.pub").strip() or "~/.ssh/id_rsa.pub"
    return (
        f'cat {shell_quote(pubkey)} | ssh {user}@{host} '
        f'"mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys '
        f'&& chmod 600 ~/.ssh/authorized_keys"'
    )


def build_password_toggle(form: FormData) -> str:
    allow = to_bool(form.get("allow_password"))
    value = "yes" if allow else "no"
    return (
        f"sudo sed -i 's/^#\\?PasswordAuthentication.*/PasswordAuthentication {value}/' "
        f"/etc/ssh/sshd_config && sudo systemctl restart ssh"
    )


def build_all(form: FormData) -> dict[str, str]:
    return {
        "keygen": build_keygen(form),
        "copy_id": build_copy_id(form),
        "manual_copy": build_manual_copy(form),
        "password_toggle": build_password_toggle(form),
    }


def build(form: FormData) -> str:
    """Concatenate the four commands so the registry's single-string contract holds."""
    cmds = build_all(form)
    return "\n\n".join([cmds["keygen"], cmds["copy_id"], cmds["manual_copy"], cmds["password_toggle"]])
