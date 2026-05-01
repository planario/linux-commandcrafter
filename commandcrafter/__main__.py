"""`python -m commandcrafter` — start the development server."""
from __future__ import annotations

from . import Config, create_app


def main() -> None:
    cfg = Config.from_env()
    app = create_app(cfg)
    app.run(host=cfg.host, port=cfg.port, debug=cfg.debug)


if __name__ == "__main__":
    main()
