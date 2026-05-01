"""Linux CommandCrafter — Flask app factory."""
from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv
from flask import Flask

from .config import Config

PACKAGE_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = PACKAGE_ROOT.parent
STATIC_DIR = PROJECT_ROOT / "static"


def create_app(config: Config | None = None) -> Flask:
    """Build and return the Flask application."""
    load_dotenv(PROJECT_ROOT / ".env", override=False)
    cfg = config or Config.from_env()

    app = Flask(
        __name__,
        static_folder=str(STATIC_DIR),
        static_url_path="/static",
        template_folder=str(PACKAGE_ROOT / "templates"),
    )
    app.config["APP_CONFIG"] = cfg
    app.config["JSON_SORT_KEYS"] = False

    from . import routes  # noqa: WPS433 — circular-safe local import

    routes.register(app)
    return app


__all__ = ["create_app", "Config"]
