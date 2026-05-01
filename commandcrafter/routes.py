"""HTTP routes."""
from __future__ import annotations

import logging
from typing import Any

from flask import Flask, abort, jsonify, render_template, request

from . import analyzer
from .builders import REGISTRY, all_builders, get
from .builders.cron import validate as cron_validate
from .builders.ssh import build_all as ssh_build_all
from .commands import COMMANDS, find_command
from .tutorials import TUTORIALS

log = logging.getLogger(__name__)

VIEWS = ("builders", "analyze", "ssh", "aliases", "tutorials", "history", "favorites")


def _client_ip() -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def register(app: Flask) -> None:  # noqa: C901 - cohesive route file
    cfg = app.config["APP_CONFIG"]

    @app.context_processor
    def _inject() -> dict[str, Any]:
        # SSH has its own dedicated top-level view, hide it from builder tabs.
        all_specs = all_builders()
        visible = [b for b in all_specs if b.id != "ssh"]
        ssh_spec = next((b for b in all_specs if b.id == "ssh"), None)
        return {
            "views": VIEWS,
            "builders": visible,
            "ssh_spec": ssh_spec,
            "analyzer_enabled": cfg.analyzer_enabled,
        }

    @app.get("/healthz")
    def healthz() -> tuple[str, int]:
        return "ok", 200

    @app.get("/")
    def index() -> str:
        return render_template(
            "index.html",
            active_view="builders",
            initial_builder=_default_builder(),
            tutorials=TUTORIALS,
        )

    @app.get("/view/<name>")
    def view(name: str) -> str:
        if name not in VIEWS:
            abort(404)
        return render_template(
            "index.html",
            active_view=name,
            initial_builder=_default_builder(),
            tutorials=TUTORIALS,
        )

    @app.get("/builder/<builder_id>")
    def builder_form(builder_id: str) -> str:
        spec = get(builder_id)
        if not spec:
            abort(404)
        return render_template(
            "partials/builder_pane.html",
            spec=spec,
            cmd=find_command(builder_id),
            ctx=_initial_context(builder_id),
            generated="",
            extra=None,
        )

    @app.post("/build/<builder_id>")
    def build(builder_id: str) -> str:
        spec = get(builder_id)
        if not spec:
            abort(404)
        form = request.form.to_dict(flat=True)
        try:
            generated = spec.build(form)
            error = ""
        except Exception as exc:  # noqa: BLE001 - we want broad protection
            log.exception("Builder %s failed", builder_id)
            generated = ""
            error = f"{type(exc).__name__}: {exc}"

        extra = _extra_context(builder_id, form)
        return render_template(
            "partials/generated.html",
            spec=spec,
            generated=generated,
            error=error,
            extra=extra,
        )

    @app.post("/api/analyze")
    def api_analyze():  # type: ignore[no-untyped-def]
        if not cfg.analyzer_enabled:
            return jsonify(error="Analyzer disabled — set GEMINI_API_KEY to enable."), 503
        payload = request.get_json(silent=True) or {}
        command = (payload.get("command") or "").strip()
        try:
            result = analyzer.analyze(command, cfg, _client_ip())
        except analyzer.AnalysisError as err:
            return jsonify(error=str(err)), err.status_code
        return jsonify(result)

    @app.errorhandler(404)
    def not_found(_err):  # type: ignore[no-untyped-def]
        return render_template("index.html", active_view="builders", initial_builder=_default_builder(), missing=True), 404


def _default_builder() -> str:
    """Return the first visible builder id alphabetically."""
    visible = [b for b in all_builders() if b.id != "ssh"]
    return visible[0].id if visible else "mv"


def _initial_context(builder_id: str) -> dict[str, Any]:
    """Provide template-friendly default values per builder."""
    if builder_id == "ansible-playbook":
        return {"playbook_name": "My Automation Playbook", "hosts": "all", "become": True}
    if builder_id == "bash":
        return {}
    if builder_id == "chmod":
        return {"path": "file.txt", "mode": "symbolic", "octal": "755", "action": "+",
                "who_user": True, "perm_read": True, "perm_execute": True}
    if builder_id == "crontab":
        return {"minute": "*", "hour": "*", "dom": "*", "month": "*", "dow": "*", "command": "/path/to/command"}
    if builder_id == "ffmpeg":
        return {"mode": "convert", "input_file": "input.mp4", "output_file": "output.mkv",
                "video_codec": "copy", "audio_codec": "copy", "start_time": "00:00:10",
                "duration": "5", "fps": "15", "width": "480", "hwaccel": "none", "scale": "3840:2160"}
    if builder_id == "find":
        return {"path": ".", "type": "any", "name_pattern": ""}
    if builder_id == "git":
        return {"subcommand": "clone", "clone_repo": "https://github.com/user/repo.git",
                "push_remote": "origin", "push_branch": "main", "pull_remote": "origin",
                "pull_branch": "main", "checkout_name": "main", "add_path": "."}
    if builder_id == "grep":
        return {"pattern": "error", "path": "/var/log/syslog"}
    if builder_id == "ip":
        return {"mode": "addr", "subcommand": "show", "device": "eth0",
                "address": "192.168.1.100/24", "link_state": "up", "gateway": "192.168.1.1",
                "route_dest": "default"}
    if builder_id == "lxc":
        return {"image": "ubuntu:22.04", "container_name": "my-container"}
    if builder_id == "rsync":
        return {"source": "/home/user/src/", "destination": "user@remote:/backup/src/",
                "archive": True, "verbose": True, "compress": True, "progress": True,
                "exclude": "node_modules"}
    if builder_id == "scp":
        return {"source": "/path/to/local/file.txt", "destination": "user@remote:/path/to/remote/",
                "compress": True}
    if builder_id == "sed":
        return {"search": "find_this", "replace": "replace_with_this", "file": "input.txt",
                "is_global": True}
    if builder_id == "ssh":
        return {"key_filename": "id_rsa_server", "key_comment": "user@email.com",
                "remote_user": "root", "remote_host": "your-server-ip",
                "public_key_path": "~/.ssh/id_rsa.pub", "allow_password": False}
    if builder_id == "ufw":
        return {"action": "allow", "direction": "in", "protocol": "tcp", "port": "22"}
    return {}


def _extra_context(builder_id: str, form) -> dict[str, Any]:
    """Builder-specific extras returned alongside the generated command."""
    if builder_id == "crontab":
        return {"validation": cron_validate(form)}
    if builder_id == "ssh":
        return {"ssh_commands": ssh_build_all(form)}
    return {}
