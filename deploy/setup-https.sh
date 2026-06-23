#!/usr/bin/env bash
# Configura HTTPS para https://sga.sgebr.net.br no servidor 186.233.89.56
#
# Pré-requisitos:
#   - DNS A: sga.sgebr.net.br → 186.233.89.56
#   - Container SGA rodando (curl http://127.0.0.1:13080/health)
#   - Nginx instalado no host
#
# Uso:
#   cd /var/sga/deploy
#   chmod +x setup-https.sh
#   sudo ./setup-https.sh
set -euo pipefail

DEPLOY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_NAME="sga"
SITE_AVAILABLE="/etc/nginx/sites-available/${SITE_NAME}.conf"
SITE_ENABLED="/etc/nginx/sites-enabled/${SITE_NAME}.conf"
DOMAIN="sga.sgebr.net.br"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
WEBROOT="/var/www/certbot"
HTTP_PORT="${SGA_HTTP_PORT:-13080}"

log() { printf '\n[setup-https] %s\n' "$*"; }

if [[ $EUID -ne 0 ]]; then
  echo "Execute com sudo: sudo $0"
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "ERRO: Nginx não instalado. Instale: apt install nginx"
  exit 1
fi

if ! curl -sf "http://127.0.0.1:${HTTP_PORT}/health" >/dev/null 2>&1; then
  log "AVISO: http://127.0.0.1:${HTTP_PORT}/health não respondeu."
  log "Suba o container antes: cd ${DEPLOY} && ./deploy.sh main"
  read -r -p "Continuar mesmo assim? [s/N] " ans
  [[ "${ans,,}" == "s" ]] || exit 1
fi

mkdir -p "$WEBROOT"
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

if [[ -f "$CERT_DIR/fullchain.pem" ]]; then
  log "Certificado já existe em $CERT_DIR"
else
  log "Emitindo certificado Let's Encrypt para ${DOMAIN}..."

  # HTTP temporário com webroot para validação ACME
  sed "s/127.0.0.1:13080/127.0.0.1:${HTTP_PORT}/g" \
    "${DEPLOY}/nginx-host-acme.conf" > "$SITE_AVAILABLE"
  ln -sf "$SITE_AVAILABLE" "$SITE_ENABLED"
  nginx -t
  systemctl reload nginx

  if ! command -v certbot >/dev/null 2>&1; then
    log "Instalando certbot..."
    apt-get update -qq
    apt-get install -y certbot
  fi

  certbot certonly --webroot -w "$WEBROOT" -d "$DOMAIN" \
    --non-interactive --agree-tos --register-unsafely-without-email \
    || certbot certonly --webroot -w "$WEBROOT" -d "$DOMAIN"

  if [[ ! -f "$CERT_DIR/fullchain.pem" ]]; then
    echo "ERRO: certificado não foi criado. Tente manualmente:"
    echo "  certbot certonly --webroot -w $WEBROOT -d $DOMAIN"
    exit 1
  fi
  log "Certificado OK."
fi

log "Instalando virtual host HTTPS..."
sed "s/127.0.0.1:13080/127.0.0.1:${HTTP_PORT}/g" \
  "${DEPLOY}/nginx-host-https.conf" > "$SITE_AVAILABLE"
ln -sf "$SITE_AVAILABLE" "$SITE_ENABLED"

if [[ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]]; then
  log "Baixando opções SSL recomendadas..."
  mkdir -p /etc/letsencrypt
  curl -fsSL https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o /etc/letsencrypt/options-ssl-nginx.conf || true
  curl -fsSL https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    -o /etc/letsencrypt/ssl-dhparams.pem || true
fi

nginx -t
systemctl reload nginx

log "Concluído."
log "Teste: curl -I https://${DOMAIN}/health"
log "Browser: https://${DOMAIN}"
