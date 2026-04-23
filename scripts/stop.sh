#!/bin/bash
# Linux CommandCrafter — Stop Containers
# Usage: bash scripts/stop.sh

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   Linux CommandCrafter — Stop              ${NC}"
echo -e "${BLUE}=============================================${NC}"

# ── Script must be run from the repo root ─────────────────────────────────────
if [[ ! -f docker-compose.yml ]]; then
    echo -e "${RED}Error: docker-compose.yml not found. Run this script from the repository root.${NC}"
    exit 1
fi

# ── Detect compose command ────────────────────────────────────────────────────
if docker compose version &>/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}Error: Docker Compose not found.${NC}"
    exit 1
fi

# ── Docker daemon check ───────────────────────────────────────────────────────
if ! docker info &>/dev/null; then
    echo -e "${RED}Error: Docker daemon is not running. Try: sudo systemctl start docker${NC}"
    exit 1
fi

# ── Stop containers (keep them, do not remove) ────────────────────────────────
echo -e "${GREEN}Stopping containers...${NC}"
$COMPOSE_CMD stop

echo -e ""
echo -e "${GREEN}Container status:${NC}"
$COMPOSE_CMD ps

echo -e ""
echo -e "  Containers stopped. Data and config preserved."
echo -e "  Restart with: bash scripts/start.sh"
