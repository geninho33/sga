#!/usr/bin/env bash
# Instala o virtual host HTTPS no Nginx do servidor (host).
# Preferível: sudo ./setup-https.sh (emite certificado + configura tudo)
#
# Este script só copia a config — exige certificado já emitido.
# Executar com sudo no servidor 186.233.89.56 (/var/sga).
set -euo pipefail

DEPLOY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_NAME="sga"
SOURCE="${DEPLOY}/nginx-host-https.conf"
TARGET="/etc/nginx/sites-available/${SITE_NAME}.conf"
DOMAIN="sga.sgebr.net.br"
CERT="${DOMAIN}/fullchain.pem"

if [[ $EUID -ne 0 ]]; then
  echo "Execute com sudo: sudo $0"
  exit 1
fi

if [[ ! -f "/etc/letsencrypt/live/${CERT}" ]]; then
  echo "Certificado não encontrado para ${DOMAIN}."
  echo "Use: sudo ${DEPLOY}/setup-https.sh"
  exit 1
fi

HTTP_PORT="${SGA_HTTP_PORT:-13080}"
if [[ -f "${DEPLOY}/.env" ]]; then
  # shellcheck disable=SC1091
  source "${DEPLOY}/.env" 2>/dev/null || true
  HTTP_PORT="${SGA_HTTP_PORT:-$HTTP_PORT}"
fi

sed "s/127.0.0.1:13080/127.0.0.1:${HTTP_PORT}/g" "$SOURCE" > "$TARGET"
ln -sf "$TARGET" "/etc/nginx/sites-enabled/${SITE_NAME}.conf"

nginx -t
systemctl reload nginx
echo "Nginx recarregado — https://${DOMAIN}"
