#!/bin/bash
# Linux CommandCrafter — Start Containers
# Usage: bash scripts/start.sh

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PORT=7256

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   Linux CommandCrafter — Start             ${NC}"
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
    echo -e "${RED}Error: Docker Compose not found. Run scripts/install.sh first.${NC}"
    exit 1
fi

# ── Docker daemon check ───────────────────────────────────────────────────────
if ! docker info &>/dev/null; then
    echo -e "${RED}Error: Docker daemon is not running. Try: sudo systemctl start docker${NC}"
    exit 1
fi

# ── Start or bring up containers ──────────────────────────────────────────────
CONTAINER_NAME="linux-command-crafter"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${GREEN}Starting existing container...${NC}"
    $COMPOSE_CMD start
else
    echo -e "${YELLOW}No existing container found — running 'compose up' instead.${NC}"
    echo -e "${YELLOW}Tip: run 'bash scripts/install.sh' for a full first-time setup.${NC}"
    $COMPOSE_CMD up -d
fi

echo -e ""
echo -e "${GREEN}Container status:${NC}"
$COMPOSE_CMD ps

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
echo -e ""
echo -e "  App available at: http://localhost:${PORT}  |  http://${LOCAL_IP}:${PORT}"
