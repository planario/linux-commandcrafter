# Deployment

The Python rewrite has two deployment paths. Both serve on port **7256** by
default, both read configuration from `.env` (or `/etc/commandcrafter.env`)
at runtime — there is no build step and no need to rebuild when keys change.

## A. Docker / Compose

```bash
cp .env.example .env       # optional: set GEMINI_API_KEY
docker compose up -d --build
docker compose logs -f
```

The healthcheck polls `GET /healthz`. If the container reports unhealthy:

```bash
docker compose logs commandcrafter
docker compose exec commandcrafter curl -fsS http://127.0.0.1:7256/healthz
```

To rotate the Gemini key: edit `.env`, then `docker compose up -d`.

## B. Bare metal (`deploy.sh`)

Supports Ubuntu, Debian, RHEL, CentOS, Fedora.

```bash
sudo ./deploy.sh                  # installs python3, gunicorn, nginx
sudo ./deploy.sh --no-nginx       # gunicorn binds :7256 directly
sudo ./deploy.sh --port=8080      # use a different external port
```

What it does:

1. Installs `python3`, `python3-venv`, `pip`, and (unless `--no-nginx`) `nginx`.
2. Copies the package to `/opt/commandcrafter`.
3. Creates a virtualenv, installs `requirements.txt`.
4. Adds a `commandcrafter` system user.
5. Writes `/etc/commandcrafter.env` (default values, `GEMINI_API_KEY=` blank).
6. Writes `/etc/systemd/system/commandcrafter.service` running gunicorn on
   `127.0.0.1:8000` with 2 workers.
7. (Default) Writes an nginx site that proxies `:7256 -> 127.0.0.1:8000`.
8. Configures SELinux on RHEL.
9. Opens port 7256 with `ufw` or `firewalld` if active.

After install:

```bash
sudo nano /etc/commandcrafter.env       # set GEMINI_API_KEY
sudo systemctl restart commandcrafter
journalctl -u commandcrafter -f
curl -fsS http://localhost:7256/healthz
```

## Why this is more reliable than the previous setup

The original React app failed in three reproducible ways: silent build
failures (empty `dist/` served as a blank page), build-time env-var
embedding (rotating the API key required a rebuild *and* rebroadcast the key
to the bundle), and uncaught render errors blanking the SPA. The Python
rewrite removes all three:

- **No build step** — the server renders HTML; failures show a 500 page with
  a useful traceback in `journalctl`/`docker logs` instead of a blank page.
- **Runtime config** — `GEMINI_API_KEY` is read at process start. Restart,
  not rebuild.
- **Per-page error isolation** — an exception in one builder's `build()`
  function returns a red inline error in that builder's "Generated"
  card; the rest of the page keeps working.

## Health & observability

- `GET /healthz` returns `200 ok` for liveness/readiness probes.
- gunicorn access log writes to stdout (captured by Docker / journald).
- Nginx logs at `/var/log/nginx/commandcrafter_{access,error}.log`.

## Security notes

- `GEMINI_API_KEY` is **server-side only**. The browser never sees it.
- The analyzer route enforces a per-IP cooldown (default 10 s) to discourage
  abuse.
- `ANALYZE_COOLDOWN_SECONDS` and `GEMINI_MODEL` are tunable without code
  changes.
- The unit file uses `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem=full`,
  and `ProtectHome=true` for systemd hardening.
