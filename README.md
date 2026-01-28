# 🛠️ Linux CommandCrafter

A professional, dark-themed utility for visually constructing, analyzing, and managing complex Linux commands.

---

## 🚀 Deployment Options

### 1. Docker (Recommended)
The fastest way to get CommandCrafter running on any platform with Docker installed.

```bash
# Build and start
docker-compose up -d
```
Access the app at `http://localhost:8080`.

---

### 2. Automated Linux Script
Deploy to a fresh server in seconds. This script handles OS detection, Node.js installation, Nginx configuration, and security headers.

**Supports:** Ubuntu, Debian, RHEL, CentOS, Fedora.

```bash
# Clone the repository
git clone https://github.com/your-repo/commandcrafter.git
cd commandcrafter

# Execute the deployment engine
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

---

### 3. Manual Installation

#### 📦 Phase A: System Dependencies

**For Debian / Ubuntu:**
```bash
sudo apt update
sudo apt install -y git curl nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**For RHEL / CentOS / Fedora:**
```bash
sudo dnf update -y
sudo dnf install -y git curl nginx
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

#### 🏗️ Phase B: Build & Serve
```bash
# Build the project
npm install
npm run build

# Prepare the web directory
sudo mkdir -p /var/www/commandcrafter
sudo cp -r dist/* /var/www/commandcrafter/

# Set Permissions
# (For Debian/Ubuntu)
sudo chown -R www-data:www-data /var/www/commandcrafter
# (For RHEL/CentOS)
sudo chown -R nginx:nginx /var/www/commandcrafter
```

#### 🌐 Phase C: Nginx Configuration
Create `/etc/nginx/sites-available/commandcrafter` (Debian) or `/etc/nginx/conf.d/commandcrafter.conf` (RHEL):

```nginx
server {
    listen 80;
    root /var/www/commandcrafter;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🛡️ Security & Hardening

### Firewall
Ensure port 80 is open:
- **UFW:** `sudo ufw allow 'Nginx Full'`
- **Firewalld:** `sudo firewall-cmd --permanent --add-service=http && sudo firewall-cmd --reload`

### SELinux (RHEL Based)
If you get a 403 Forbidden on RHEL, you may need to update the security context:
```bash
sudo chcon -Rt httpd_sys_content_t /var/www/commandcrafter
```

---

## 🧩 Features
- **Visual Builders:** Cron, UFW, FFmpeg, Ansible, and more.
- **AI Analyzer:** Explain any command using Gemini.
- **Script Studio:** Build Bash scripts using visual logic blocks.
- **SSH Manager:** Securely generate and distribute keys.
- **Alias Forge:** Create permanent Bash aliases with one click.
