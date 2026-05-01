# Linux CommandCrafter

A dark-themed Flask web app for visually constructing, analyzing, and managing
Linux commands. 14 specialised builders, 4 generic flag/value commands, an
AI-powered analyzer, browser-local history/favorites/aliases, and 19 in-app
tutorials.

This is the **Python rewrite** of the original React/Vite SPA. Server-rendered
templates plus HTMX swaps eliminate the build step, runtime API-key handling,
and the "blank-page" failure mode of the previous frontend.

## Quick start

```bash
git clone <this-repo>
cd linux-commandcrafter
cp .env.example .env             # set GEMINI_API_KEY if you want the analyzer
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m commandcrafter           # serves http://localhost:7256
```

The default port is **7256**. Point a browser at `http://localhost:7256`.

## Production deployment

### Docker (recommended)

```bash
cp .env.example .env
docker compose up -d --build
```

### Bare-metal Linux (Debian/Ubuntu/RHEL/CentOS/Fedora)

```bash
sudo ./deploy.sh                 # installs python3, gunicorn, nginx (proxy)
# To skip nginx and run gunicorn directly on :7256, pass --no-nginx
sudo ./deploy.sh --no-nginx
```

`deploy.sh` installs the app to `/opt/commandcrafter`, writes a systemd unit,
and (by default) sets up nginx as a reverse proxy on port 7256. Edit
`/etc/commandcrafter.env` to change settings, then `systemctl restart
commandcrafter`.

## Configuration

All settings come from environment variables, loaded once at startup
(no rebuild required to rotate keys):

| Variable                  | Default            | Purpose |
|---------------------------|--------------------|---------|
| `GEMINI_API_KEY`          | *(empty)*          | Enables the Command Analyzer. Get one at https://aistudio.google.com/app/apikey |
| `GEMINI_MODEL`            | `gemini-2.0-flash` | Model used by the analyzer |
| `HOST`                    | `0.0.0.0`          | Bind address for `python -m commandcrafter` |
| `PORT`                    | `7256`             | Bind port |
| `DEBUG`                   | `false`            | Set to `true` only in development |
| `ANALYZE_COOLDOWN_SECONDS`| `10`               | Per-IP minimum interval between analyzer calls |

When `GEMINI_API_KEY` is empty, the analyzer is disabled and the rest of the
app continues to work normally — you'll see a one-line notice on the Analyze
tab instead of a blank page.

## Features

- **14 specialised builders**: ansible-playbook, bash, chmod, crontab, ffmpeg,
  find, git, grep, ip, lxc, rsync, scp, sed, ssh, ufw.
- **4 generic builders**: mv, cp, tar, gzip.
- **AI Analyzer** (Gemini): pastes a command, returns a JSON report with
  `safetyLevel`, an `explanation`, and `errorDetails`.
- **Tutorials**: 19 in-app guides covering every command above.
- **History / Favorites / Aliases**: stored in browser `localStorage` under the
  same keys as the original React app — your existing data is preserved.
- **Live preview**: forms update the generated command via HTMX swaps as you
  type (no page reload).

## Project layout

```
commandcrafter/         Flask package
  __init__.py           App factory
  __main__.py           python -m commandcrafter
  config.py             Env-var-driven config
  routes.py             HTTP routes
  shell.py              shell_quote helper
  sanitize.py           cron / dangerous-command validators
  analyzer.py           Server-side Gemini call
  tutorials.py          Tutorial content
  commands.py           Generic command definitions (mv/cp/tar/gzip)
  builders/             One module per builder + registry
  templates/            Jinja2 templates
static/
  css/app.css           Hand-rolled dark/teal theme (no Tailwind)
  js/                   storage.js, ui.js, app.js (Alpine components)
  vendor/               Optional self-hosted htmx + alpine
tests/                  pytest suite
```

## Testing

```bash
pip install -r requirements.txt
pytest -v
```

The suite covers each builder's command-generation contract, the validation
helpers, and HTTP smoke tests for every view and every `POST /build/<id>`.

## Adding a new builder

1. Create `commandcrafter/builders/<name>.py` exporting `build(form: dict) -> str`.
2. Create `commandcrafter/templates/builders/<name>.html` for its form fields.
3. Append a `BuilderSpec(...)` entry to `BUILTIN_SPECS` in
   `commandcrafter/builders/__init__.py`.
4. Add a fixture in `tests/test_builders.py`.

No build step. Restart the server and the new tab appears.

## License

MIT.
