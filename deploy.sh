#!/bin/bash

# Linux CommandCrafter - Resolute Deployment Script
# Supports: Ubuntu, Debian, RHEL, CentOS, Fedora

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PORT=7256

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}   Linux CommandCrafter Deployment Engine     ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Check for root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (sudo)${NC}" 
   exit 1
fi

# Detect OS
if [ -f /etc/debian_version ]; then
    OS="debian"
    PKG_MANAGER="apt-get"
    NGINX_CONF_DIR="/etc/nginx/sites-available"
    NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
    WEB_USER="www-data"
elif [ -f /etc/redhat-release ]; then
    OS="rhel"
    PKG_MANAGER="dnf"
    NGINX_CONF_DIR="/etc/nginx/conf.d"
    WEB_USER="nginx"
    # Check if dnf is available, fallback to yum
    if ! command -v dnf &> /dev/null; then
        PKG_MANAGER="yum"
    fi
else
    echo -e "${RED}Unsupported OS. Please install manually.${NC}"
    exit 1
fi

echo -e "${GREEN}[1/5] Detected ${OS} system. Using ${PKG_MANAGER}...${NC}"

# Install basic dependencies
$PKG_MANAGER update -y
$PKG_MANAGER install -y git curl nginx

# Install Node.js 20.x
echo -e "${GREEN}[2/5] Installing Node.js 20.x...${NC}"
if [ "$OS" == "debian" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y nodejs
fi

# Prepare Application
echo -e "${GREEN}[3/5] Building application...${NC}"
# Assume we are in the repo root
npm install
npm run build

# Configure Nginx
echo -e "${GREEN}[4/5] Configuring Nginx on port ${PORT}...${NC}"
mkdir -p /var/www/commandcrafter
cp -r dist/* /var/www/commandcrafter/
chown -R $WEB_USER:$WEB_USER /var/www/commandcrafter

# Create Nginx Config
NGINX_CONFIG="
server {
    listen ${PORT};
    server_name _;

    root /var/www/commandcrafter;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    error_log  /var/log/nginx/commandcrafter_error.log;
    access_log /var/log/nginx/commandcrafter_access.log;
}
"

if [ "$OS" == "debian" ]; then
    echo "$NGINX_CONFIG" > "$NGINX_CONF_DIR/commandcrafter"
    ln -sf "$NGINX_CONF_DIR/commandcrafter" "$NGINX_ENABLED_DIR/"
    rm -f "$NGINX_ENABLED_DIR/default"
else
    echo "$NGINX_CONFIG" > "$NGINX_CONF_DIR/commandcrafter.conf"
fi

# Restart Services
echo -e "${GREEN}[5/5] Finalizing services...${NC}"
systemctl enable nginx
systemctl restart nginx

# Firewall Setup
if command -v ufw &> /dev/null; then
    ufw allow ${PORT}/tcp
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=${PORT}/tcp
    firewall-cmd --reload
fi

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}SUCCESS: CommandCrafter is live!${NC}"
echo -e "Access it at: http://$(curl -s ifconfig.me):${PORT}"
echo -e "${BLUE}==============================================${NC}"