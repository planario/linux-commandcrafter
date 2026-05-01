#!/usr/bin/env bash
# Build & launch via Docker Compose. Run from the repo root.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
    echo "Creating .env from .env.example"
    cp .env.example .env
    echo "Edit .env to set GEMINI_API_KEY before running, then re-run this script."
fi

if docker compose version >/dev/null 2>&1; then
    DC="docker compose"
elif command -v docker-compose >/dev/null; then
    DC="docker-compose"
else
    echo "Docker Compose not found. Install Docker Desktop or docker-compose-plugin." >&2
    exit 1
fi

$DC up -d --build
$DC ps
echo "App is live at http://localhost:7256"
