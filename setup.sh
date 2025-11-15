#!/bin/bash

# Cria o nginx.conf
cat > nginx.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Cria o Dockerfile
cat > Dockerfile << 'EOF'
# Etapa 1: Build dos arquivos estáticos
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Servir arquivos estáticos com Nginx
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# Cria o docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3'
services:
  commandcrafter:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
EOF

echo "Arquivos criados com sucesso!"
echo "Execute 'docker-compose up -d' para iniciar o deploy."
