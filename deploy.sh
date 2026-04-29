#!/bin/bash

# Linux CommandCrafter - Bare-metal Deployment Script
# Supports: Ubuntu, Debian, RHEL, CentOS, Fedora

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PORT=7256
APP_DIR="/var/www/commandcrafter"

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}   Linux CommandCrafter Deployment Engine     ${NC}"
echo -e "${BLUE}==============================================${NC}"

# ── Root check ────────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (sudo)${NC}"
   exit 1
fi

# ── Run from the script's own directory (must contain package.json) ──────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
if [[ ! -f package.json ]]; then
    echo -e "${RED}Error: package.json not found in ${SCRIPT_DIR}.${NC}"
    echo -e "${RED}deploy.sh must live in the repository root.${NC}"
    exit 1
fi

# ── OS detection ──────────────────────────────────────────────────────────────
if [[ -f /etc/debian_version ]]; then
    OS="debian"
    PKG_MANAGER="apt-get"
    NGINX_CONF_DIR="/etc/nginx/sites-available"
    NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
    NGINX_CONF_FILE="$NGINX_CONF_DIR/commandcrafter"
    WEB_USER="www-data"
elif [[ -f /etc/redhat-release ]] || [[ -f /etc/fedora-release ]]; then
    OS="rhel"
    NGINX_CONF_DIR="/etc/nginx/conf.d"
    NGINX_CONF_FILE="$NGINX_CONF_DIR/commandcrafter.conf"
    WEB_USER="nginx"
    if command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
    else
        PKG_MANAGER="yum"
    fi
else
    echo -e "${RED}Unsupported OS. Please install manually.${NC}"
    exit 1
fi

echo -e "${GREEN}[1/6] Detected ${OS} system. Using ${PKG_MANAGER}.${NC}"

# ── Install dependencies ──────────────────────────────────────────────────────
$PKG_MANAGER update -y
if [[ "$OS" == "rhel" ]]; then
    # nginx lives in EPEL on RHEL/CentOS
    $PKG_MANAGER install -y epel-release || true
fi
$PKG_MANAGER install -y git curl nginx

# ── Install Node.js 20.x ──────────────────────────────────────────────────────
echo -e "${GREEN}[2/6] Installing Node.js 20.x...${NC}"
if ! command -v node &> /dev/null || ! node -v | grep -qE '^v(20|21|22)\.'; then
    if [[ "$OS" == "debian" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        $PKG_MANAGER install -y nodejs
    fi
else
    echo -e "      Found: $(node -v)"
fi

# ── Build application ────────────────────────────────────────────────────────
echo -e "${GREEN}[3/6] Building application...${NC}"
npm install
VITE_GEMINI_API_KEY="${VITE_GEMINI_API_KEY:-}" npm run build

if [[ ! -f dist/index.html ]]; then
    echo -e "${RED}Error: build did not produce dist/index.html.${NC}"
    exit 1
fi

# ── Deploy static files (clean target first) ─────────────────────────────────
echo -e "${GREEN}[4/6] Deploying static files to ${APP_DIR}...${NC}"
mkdir -p "$APP_DIR"
# Wipe previous deploy so old hashed bundles don't linger
rm -rf "${APP_DIR:?}/"*
cp -r dist/. "$APP_DIR/"
chown -R "$WEB_USER:$WEB_USER" "$APP_DIR"
find "$APP_DIR" -type d -exec chmod 755 {} \;
find "$APP_DIR" -type f -exec chmod 644 {} \;

# ── Write Nginx config ───────────────────────────────────────────────────────
echo -e "${GREEN}[5/6] Configuring Nginx on port ${PORT}...${NC}"

cat > "$NGINX_CONF_FILE" <<EOF
server {
    listen ${PORT};
    server_name _;

    root ${APP_DIR};
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache hashed static assets
    location ~* \.(js|css|woff2?|ttf|eot|ico|svg|png|jpg|jpeg|gif)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Don't cache the entry HTML
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    error_log  /var/log/nginx/commandcrafter_error.log;
    access_log /var/log/nginx/commandcrafter_access.log;
}
EOF

if [[ "$OS" == "debian" ]]; then
    ln -sf "$NGINX_CONF_FILE" "$NGINX_ENABLED_DIR/commandcrafter"
    rm -f "$NGINX_ENABLED_DIR/default"
fi

# ── SELinux: allow nginx to bind to non-standard port and read APP_DIR ───────
if [[ "$OS" == "rhel" ]] && command -v getenforce &> /dev/null && [[ "$(getenforce)" != "Disabled" ]]; then
    echo -e "      Configuring SELinux for port ${PORT}..."
    $PKG_MANAGER install -y policycoreutils-python-utils &> /dev/null || \
        $PKG_MANAGER install -y policycoreutils-python &> /dev/null || true
    if command -v semanage &> /dev/null; then
        semanage port -a -t http_port_t -p tcp "${PORT}" 2>/dev/null || \
            semanage port -m -t http_port_t -p tcp "${PORT}" 2>/dev/null || true
    fi
    if command -v restorecon &> /dev/null; then
        restorecon -Rv "$APP_DIR" &> /dev/null || true
    fi
fi

# ── Validate config and (re)start nginx ──────────────────────────────────────
echo -e "${GREEN}[6/6] Validating Nginx config and restarting...${NC}"
if ! nginx -t; then
    echo -e "${RED}Error: nginx configuration test failed. See output above.${NC}"
    exit 1
fi
systemctl enable nginx
systemctl restart nginx

# Verify the service actually came up
sleep 1
if ! systemctl is-active --quiet nginx; then
    echo -e "${RED}Error: nginx failed to start. Check 'journalctl -u nginx' for details.${NC}"
    exit 1
fi

# ── Firewall ──────────────────────────────────────────────────────────────────
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    ufw allow "${PORT}/tcp" || true
elif command -v firewall-cmd &> /dev/null && systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-port="${PORT}/tcp" || true
    firewall-cmd --reload || true
fi

# ── Success message ──────────────────────────────────────────────────────────
LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}SUCCESS: CommandCrafter is live!${NC}"
echo -e "  Local:   http://localhost:${PORT}"
[[ -n "$LAN_IP" ]] && echo -e "  Network: http://${LAN_IP}:${PORT}"
echo -e ""
echo -e "  Logs:"
echo -e "    Access: /var/log/nginx/commandcrafter_access.log"
echo -e "    Error:  /var/log/nginx/commandcrafter_error.log"
echo -e "${BLUE}==============================================${NC}"
