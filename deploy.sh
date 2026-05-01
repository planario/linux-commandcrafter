#!/usr/bin/env bash
# Linux CommandCrafter — bare-metal Python deployment.
# Installs the Flask app under /opt/commandcrafter, runs it via gunicorn under
# systemd, and (optionally) puts an nginx reverse proxy in front on port 7256.
#
# Supports: Ubuntu, Debian, RHEL, CentOS, Fedora.

set -euo pipefail

PORT="${PORT:-7256}"
APP_DIR="/opt/commandcrafter"
ENV_FILE="/etc/commandcrafter.env"
SERVICE_FILE="/etc/systemd/system/commandcrafter.service"
APP_PORT="8000"  # gunicorn listens locally; nginx proxies $PORT -> $APP_PORT
NO_NGINX=0

for arg in "$@"; do
    case "$arg" in
        --no-nginx) NO_NGINX=1 ;;
        --port=*)   PORT="${arg#--port=}" ;;
        -h|--help)
            echo "Usage: sudo $0 [--no-nginx] [--port=N]"
            exit 0
            ;;
        *) echo "Unknown arg: $arg" >&2; exit 2 ;;
    esac
done

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
say() { echo -e "${BLUE}==>${NC} $*"; }
ok()  { echo -e "${GREEN}OK${NC} $*"; }
die() { echo -e "${RED}ERR${NC} $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Must run as root (sudo)."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
[[ -f pyproject.toml ]] || die "pyproject.toml not found in $SCRIPT_DIR"

# ── OS detection ─────────────────────────────────────────────────────────────
if [[ -f /etc/debian_version ]]; then
    OS="debian"; PKG="apt-get"
    PYTHON_PKG="python3 python3-venv python3-pip"
    NGINX_DIR="/etc/nginx/sites-available"
    NGINX_LINK="/etc/nginx/sites-enabled/commandcrafter"
    NGINX_CONF="$NGINX_DIR/commandcrafter"
elif [[ -f /etc/redhat-release || -f /etc/fedora-release ]]; then
    OS="rhel"
    PKG="$(command -v dnf || command -v yum)"
    PYTHON_PKG="python3 python3-pip"
    NGINX_DIR="/etc/nginx/conf.d"
    NGINX_LINK=""
    NGINX_CONF="$NGINX_DIR/commandcrafter.conf"
else
    die "Unsupported OS."
fi

say "Detected $OS"

# ── Install system deps ──────────────────────────────────────────────────────
say "Installing system packages"
$PKG update -y
if [[ "$OS" == "rhel" ]]; then
    $PKG install -y epel-release || true
fi
EXTRA=""
[[ "$NO_NGINX" -eq 0 ]] && EXTRA="nginx"
# shellcheck disable=SC2086
$PKG install -y curl $PYTHON_PKG $EXTRA

# ── App layout ───────────────────────────────────────────────────────────────
say "Syncing app to $APP_DIR"
mkdir -p "$APP_DIR"
cp -r commandcrafter static pyproject.toml requirements.txt "$APP_DIR/"

# ── Virtualenv ───────────────────────────────────────────────────────────────
say "Creating virtualenv"
python3 -m venv "$APP_DIR/.venv"
"$APP_DIR/.venv/bin/pip" install --upgrade pip
"$APP_DIR/.venv/bin/pip" install -r "$APP_DIR/requirements.txt"

# ── Service user ─────────────────────────────────────────────────────────────
if ! id -u commandcrafter >/dev/null 2>&1; then
    say "Creating service user 'commandcrafter'"
    useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin commandcrafter
fi
chown -R commandcrafter:commandcrafter "$APP_DIR"

# ── EnvironmentFile ──────────────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
    say "Writing default $ENV_FILE (edit to set GEMINI_API_KEY)"
    cat > "$ENV_FILE" <<EOF
# Linux CommandCrafter — runtime environment
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
HOST=127.0.0.1
PORT=$APP_PORT
DEBUG=false
ANALYZE_COOLDOWN_SECONDS=10
EOF
    chmod 640 "$ENV_FILE"
    chown root:commandcrafter "$ENV_FILE"
fi

# ── systemd unit ─────────────────────────────────────────────────────────────
say "Writing systemd unit"
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Linux CommandCrafter (Flask + gunicorn)
After=network.target

[Service]
Type=simple
User=commandcrafter
Group=commandcrafter
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$APP_DIR/.venv/bin/gunicorn --workers 2 --bind 127.0.0.1:$APP_PORT --access-logfile - 'commandcrafter:create_app()'
Restart=on-failure
RestartSec=2
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable commandcrafter
systemctl restart commandcrafter
sleep 1
systemctl is-active --quiet commandcrafter || die "commandcrafter failed to start. journalctl -u commandcrafter"
ok "commandcrafter is running on 127.0.0.1:$APP_PORT"

# ── Nginx reverse proxy ──────────────────────────────────────────────────────
if [[ "$NO_NGINX" -eq 0 ]]; then
    say "Configuring Nginx on port $PORT"
    cat > "$NGINX_CONF" <<EOF
server {
    listen $PORT;
    server_name _;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    error_log  /var/log/nginx/commandcrafter_error.log;
    access_log /var/log/nginx/commandcrafter_access.log;
}
EOF
    [[ -n "$NGINX_LINK" ]] && ln -sf "$NGINX_CONF" "$NGINX_LINK" && rm -f "/etc/nginx/sites-enabled/default"

    if [[ "$OS" == "rhel" ]] && command -v getenforce >/dev/null && [[ "$(getenforce)" != "Disabled" ]]; then
        say "Adjusting SELinux"
        setsebool -P httpd_can_network_connect 1 || true
        if command -v semanage >/dev/null; then
            semanage port -a -t http_port_t -p tcp "$PORT" 2>/dev/null || \
                semanage port -m -t http_port_t -p tcp "$PORT" 2>/dev/null || true
        fi
    fi

    nginx -t || die "nginx -t failed"
    systemctl enable nginx
    systemctl restart nginx
    ok "Nginx reverse proxy live on :$PORT"
else
    say "Skipping nginx (--no-nginx). Edit $ENV_FILE to set HOST=0.0.0.0 PORT=$PORT"
fi

# ── Firewall ─────────────────────────────────────────────────────────────────
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
    ufw allow "${PORT}/tcp" || true
elif command -v firewall-cmd >/dev/null && systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-port="${PORT}/tcp" || true
    firewall-cmd --reload || true
fi

LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo
echo -e "${GREEN}SUCCESS:${NC} Linux CommandCrafter is live."
echo "  Local:   http://localhost:${PORT}"
[[ -n "$LAN_IP" ]] && echo "  Network: http://${LAN_IP}:${PORT}"
echo "  Edit:    $ENV_FILE   (then: systemctl restart commandcrafter)"
echo "  Logs:    journalctl -u commandcrafter -f"
