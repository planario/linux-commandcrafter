# Linux CommandCrafter Deployment Guide

This guide provides step-by-step instructions for deploying the Linux CommandCrafter application on a Debian or Ubuntu server. We will use Nginx to serve the application, which is a high-performance web server ideal for static sites.

## Pre-requisites

Before you begin, ensure you have the following:

1.  **A Debian or Ubuntu Server**: A clean installation of a recent LTS version (e.g., Ubuntu 22.04, Debian 11/12).
2.  **Sudo Access**: You will need root privileges to install packages and configure the server.
3.  **Server Access**: You should be able to connect to your server via SSH.
4.  **A Domain Name (Optional)**: If you want to access your app via a domain name (e.g., `commands.yourdomain.com`), make sure you have one and can configure its DNS records. If not, you can use your server's IP address.

---

## Deployment Steps

### Step 1: Connect to Your Server

First, connect to your server using SSH. Replace `user` with your username and `your_server_ip` with your server's public IP address.

```bash
ssh user@your_server_ip
```

### Step 2: Install Dependencies (Node.js, npm, Git)

The application needs to be "built" on the server. This process compiles the code into static HTML, CSS, and JavaScript files. This requires Node.js and npm. We'll also install Git to clone the application's source code.

1.  **Update your package list:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Install Git:**
    ```bash
    sudo apt install git -y
    ```

3.  **Install Node.js and npm:**
    We recommend using the NodeSource repository for a recent version of Node.js.

    ```bash
    # Download and run the NodeSource setup script for Node.js v20.x
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

    # Install Node.js and npm
    sudo apt install -y nodejs
    ```

4.  **Verify the installation:**
    ```bash
    node -v  # Should show v20.x.x
    npm -v   # Should show a recent version
    ```

### Step 3: Clone the Application Repository

Clone the Linux CommandCrafter source code from its repository onto your server.

```bash
# Clone into a directory named 'commandcrafter'
git clone https://github.com/example/commandcrafter.git
```
*(Note: Replace the URL with the actual repository URL if different.)*

### Step 4: Build the Application

Now, navigate into the project directory, install its dependencies, and run the build script.

1.  **Navigate into the project directory:**
    ```bash
    cd commandcrafter
    ```

2.  **Install project dependencies:**
    This reads the `package.json` file and downloads the required libraries.
    ```bash
    npm install
    ```

3.  **Build the application:**
    This command compiles the React/TypeScript code into a `dist` directory.
    ```bash
    npm run build
    ```

After this step, you will have a `dist` directory inside your `commandcrafter` folder. This folder contains the static files we need to deploy.

### Step 5: Install and Configure Nginx

Nginx will act as our web server.

1.  **Install Nginx:**
    ```bash
    sudo apt install nginx -y
    ```

2.  **Create a new Nginx configuration file:**
    We will create a server block configuration for our application. Use a text editor like `nano`.

    ```bash
    sudo nano /etc/nginx/sites-available/commandcrafter
    ```

3.  **Paste the following configuration into the file:**

    This configuration tells Nginx to listen on port 80, serve files from `/var/www/commandcrafter`, and correctly handle routing for a single-page application (SPA).

    ```nginx
    server {
        listen 80;
        listen [::]:80;

        # Replace your_server_ip with your server's IP or domain name
        server_name your_server_ip;

        root /var/www/commandcrafter;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```
    - **Important**: Change `your_server_ip` to your server's actual IP address or your domain name.
    - Save the file and exit `nano` (press `Ctrl+X`, then `Y`, then `Enter`).

4.  **Enable the new configuration:**
    We do this by creating a symbolic link from `sites-available` to `sites-enabled`.

    ```bash
    sudo ln -s /etc/nginx/sites-available/commandcrafter /etc/nginx/sites-enabled/
    ```

5.  **Remove the default Nginx configuration (optional but recommended):**
    ```bash
    sudo rm /etc/nginx/sites-enabled/default
    ```

### Step 6: Deploy the Files

1.  **Create the web root directory:**
    This is the directory we specified in our Nginx configuration.
    ```bash
    sudo mkdir -p /var/www/commandcrafter
    ```

2.  **Copy the built files to the web root:**
    From inside your `commandcrafter` project directory (where the `dist` folder is):
    ```bash
    sudo cp -r dist/* /var/www/commandcrafter/
    ```

### Step 7: Finalize and Verify

1.  **Test the Nginx configuration for syntax errors:**
    ```bash
    sudo nginx -t
    ```
    If you see `syntax is ok` and `test is successful`, you are good to go.

2.  **Restart Nginx to apply all changes:**
    ```bash
    sudo systemctl restart nginx
    ```

3.  **(Recommended) Configure Firewall:**
    If you have a firewall like `ufw` enabled, allow HTTP traffic.
    ```bash
    sudo ufw allow 'Nginx HTTP'
    sudo ufw status
    ```

### Step 8: Access the Application

You're done! Open your web browser and navigate to your server's IP address:

```
http://your_server_ip
```

You should now see the Linux CommandCrafter application running live from your server.
