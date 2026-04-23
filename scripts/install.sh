#!/bin/bash
# Linux CommandCrafter — Docker Installation Script
# Supports: Debian, Ubuntu, Fedora
# Usage: sudo bash scripts/install.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PORT=7256

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   Linux CommandCrafter — Docker Installer   ${NC}"
echo -e "${BLUE}=============================================${NC}"

# ── Root check ────────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}Error: this script must be run as root (sudo bash scripts/install.sh)${NC}"
    exit 1
fi

# ── Script must be run from the repo root ─────────────────────────────────────
if [[ ! -f docker-compose.yml ]]; then
    echo -e "${RED}Error: docker-compose.yml not found. Run this script from the repository root.${NC}"
    exit 1
fi

# ── OS detection ──────────────────────────────────────────────────────────────
if [[ -f /etc/debian_version ]]; then
    OS="debian"
    PKG_MANAGER="apt-get"
    . /etc/os-release 2>/dev/null || true
    OS_NAME="${NAME:-Debian}"
elif [[ -f /etc/fedora-release ]]; then
    OS="fedora"
    PKG_MANAGER="dnf"
    OS_NAME="Fedora"
else
    echo -e "${RED}Unsupported OS. Supported: Debian, Ubuntu, Fedora.${NC}"
    exit 1
fi

echo -e "${GREEN}[1/5] Detected: ${OS_NAME} (${OS}). Using ${PKG_MANAGER}.${NC}"

# ── Docker check / install ────────────────────────────────────────────────────
echo -e "${GREEN}[2/5] Checking Docker...${NC}"
if command -v docker &>/dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "      Found: ${DOCKER_VERSION}"
else
    echo -e "${YELLOW}      Docker not found — installing...${NC}"
    if [[ "$OS" == "debian" ]]; then
        $PKG_MANAGER update -y
        $PKG_MANAGER install -y docker.io
    else
        $PKG_MANAGER install -y docker
    fi
    systemctl enable --now docker
    echo -e "      Docker installed and started."
fi

# Verify the daemon is reachable
if ! docker info &>/dev/null; then
    echo -e "${RED}Error: Docker daemon is not running. Try: systemctl start docker${NC}"
    exit 1
fi

# ── Docker Compose check / install ───────────────────────────────────────────
echo -e "${GREEN}[3/5] Checking Docker Compose...${NC}"
COMPOSE_CMD=""

if docker compose version &>/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
    echo -e "      Found: Docker Compose plugin ($(docker compose version --short 2>/dev/null || true))"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
    echo -e "      Found: docker-compose standalone ($(docker-compose --version))"
else
    echo -e "${YELLOW}      Docker Compose not found — installing...${NC}"
    if [[ "$OS" == "debian" ]]; then
        $PKG_MANAGER update -y
        $PKG_MANAGER install -y docker-compose-plugin
        COMPOSE_CMD="docker compose"
    else
        $PKG_MANAGER install -y docker-compose
        COMPOSE_CMD="docker-compose"
    fi
    echo -e "      Docker Compose installed."
fi

# ── Firewall ──────────────────────────────────────────────────────────────────
echo -e "${GREEN}[4/5] Opening firewall port ${PORT}/tcp...${NC}"
if command -v ufw &>/dev/null; then
    ufw allow "${PORT}/tcp"
    ufw reload || true
    echo -e "      ufw: port ${PORT}/tcp allowed."
elif command -v firewall-cmd &>/dev/null; then
    firewall-cmd --permanent --add-port="${PORT}/tcp"
    firewall-cmd --reload
    echo -e "      firewalld: port ${PORT}/tcp allowed."
else
    echo -e "${YELLOW}      No recognised firewall found (ufw / firewalld). Open port ${PORT}/tcp manually if needed.${NC}"
fi

# ── Environment setup ─────────────────────────────────────────────────────────
if [[ ! -f .env ]]; then
    cp .env.example .env
    echo -e ""
    echo -e "${YELLOW}  .env file created from .env.example.${NC}"
    echo -e "  The Command Analyzer feature requires a Google Gemini API key."
    echo -e "  Leave blank to skip (Analyzer will be disabled)."
    echo -n "  Enter VITE_GEMINI_API_KEY (or press Enter to skip): "
    read -r -s GEMINI_KEY
    echo ""
    if [[ -n "$GEMINI_KEY" ]]; then
        sed -i "s|^VITE_GEMINI_API_KEY=.*|VITE_GEMINI_API_KEY=${GEMINI_KEY}|" .env
        echo -e "      API key saved to .env."
    fi
else
    echo -e "      .env already exists — skipping API key prompt."
fi

# Export key for docker compose build arg (reads from .env if set, env otherwise)
if [[ -z "${VITE_GEMINI_API_KEY:-}" ]]; then
    VITE_GEMINI_API_KEY=$(grep -E '^VITE_GEMINI_API_KEY=' .env 2>/dev/null | cut -d= -f2- || true)
fi
export VITE_GEMINI_API_KEY

# ── Build and start containers ────────────────────────────────────────────────
echo -e "${GREEN}[5/5] Building and starting containers...${NC}"
$COMPOSE_CMD up -d --build

# ── Success ───────────────────────────────────────────────────────────────────
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo -e ""
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}  Installation complete!${NC}"
echo -e ""
echo -e "  Local:   http://localhost:${PORT}"
echo -e "  Network: http://${LOCAL_IP}:${PORT}"
echo -e ""
echo -e "  Manage containers:"
echo -e "    Start:  bash scripts/start.sh"
echo -e "    Stop:   bash scripts/stop.sh"
echo -e "${BLUE}=============================================${NC}"
