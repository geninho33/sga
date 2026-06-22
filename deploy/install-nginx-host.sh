#!/usr/bin/env bash
# Instala o virtual host HTTPS no Nginx do servidor (host).
# Executar com sudo no servidor 186.233.89.56 (/var/alimentacao-escolar).
set -euo pipefail

DEPLOY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_NAME="sga-alimentacao-escolar"
SOURCE="${DEPLOY}/nginx-host-https.conf"
TARGET="/etc/nginx/sites-available/${SITE_NAME}.conf"

if [[ $EUID -ne 0 ]]; then
  echo "Execute com sudo: sudo $0"
  exit 1
fi

cp "$SOURCE" "$TARGET"
ln -sf "$TARGET" "/etc/nginx/sites-enabled/${SITE_NAME}.conf"

if [[ ! -f /etc/letsencrypt/live/sga.sgebr.net.br/fullchain.pem ]]; then
  echo "Certificado ainda não existe. Rode:"
  echo "  certbot certonly --nginx -d sga.sgebr.net.br"
fi

nginx -t
systemctl reload nginx
echo "Nginx recarregado — https://sga.sgebr.net.br"
