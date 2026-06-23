#!/usr/bin/env bash
# Deploy / atualização do SGA Alimentação Escolar (Docker)
#
# Repositório: https://github.com/viziv-git/sga
# Servidor:    186.233.89.56
# DNS:         sga.sgebr.net.br
# Caminho:     /var/sga
#
# Uso no servidor:
#   cd /var/sga/deploy
#   cp .env.example .env   # primeira vez — edite senhas
#   chmod +x deploy.sh && ./deploy.sh [branch]
set -euo pipefail

DEPLOY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DEPLOY/.." && pwd)"
cd "$DEPLOY"

BRANCH="${1:-main}"
CONTAINER="${SGA_CONTAINER_NAME:-sga}"
LEGACY_CONTAINER="sga-alimentacao-escolar"
COMPOSE="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE="docker-compose"
fi

log() { printf '\n[deploy] %s\n' "$*"; }

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    log "Arquivo deploy/.env não encontrado — copiando de .env.example"
    cp .env.example .env
    log "Edite deploy/.env (MYSQL_PASSWORD, JWT_SECRET) antes de continuar."
    exit 1
  fi
  log "ERRO: crie o arquivo deploy/.env (veja deploy/.env.example)"
  exit 1
fi

# shellcheck disable=SC1091
source .env 2>/dev/null || true
HTTP_PORT="${SGA_HTTP_PORT:-13080}"

if [[ -z "${JWT_SECRET:-}" || "${JWT_SECRET}" == "altere-este-segredo-em-producao" ]]; then
  log "AVISO: defina JWT_SECRET forte no deploy/.env"
fi
if [[ -z "${MYSQL_PASSWORD:-}" ]]; then
  log "AVISO: MYSQL_PASSWORD vazio no deploy/.env"
fi

port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -tln | grep -q ":${HTTP_PORT} "
    return $?
  fi
  if command -v netstat >/dev/null 2>&1; then
    netstat -tln 2>/dev/null | grep -q ":${HTTP_PORT} "
    return $?
  fi
  return 1
}

port_owner() {
  docker ps --format '{{.Names}}\t{{.Ports}}' 2>/dev/null | grep -E ":${HTTP_PORT}->" || true
}

if port_in_use; then
  if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    log "Porta ${HTTP_PORT} em uso — recriando container SGA..."
    $COMPOSE down || true
  elif docker ps -a --format '{{.Names}}' | grep -qx "$LEGACY_CONTAINER"; then
    log "Porta ${HTTP_PORT} em uso — removendo container legado ${LEGACY_CONTAINER}..."
    docker rm -f "$LEGACY_CONTAINER" 2>/dev/null || true
  else
    log "ERRO: porta ${HTTP_PORT} já está em uso por outro processo:"
    port_owner
    log "Altere SGA_HTTP_PORT no deploy/.env (ex.: 13081) e atualize deploy/nginx-host-https.conf"
    exit 1
  fi
fi

if command -v git >/dev/null 2>&1 && [[ -d "$ROOT/.git" ]]; then
  log "Atualizando código em ${ROOT} (git pull origin ${BRANCH})..."
  git -C "$ROOT" remote set-url origin https://github.com/viziv-git/sga.git 2>/dev/null || true
  git -C "$ROOT" fetch origin "$BRANCH"
  git -C "$ROOT" checkout "$BRANCH"
  git -C "$ROOT" pull origin "$BRANCH"
else
  log "Git não disponível ou não é repositório — usando código local."
fi

log "Gerando metadados de versão..."
node "$ROOT/scripts/generate-version.mjs" || log "AVISO: não foi possível gerar versão (node/script ausente)"

log "Construindo imagem Docker..."
$COMPOSE build --pull

log "Subindo container..."
if docker ps -a --format '{{.Names}}' | grep -qx "$LEGACY_CONTAINER"; then
  log "Removendo container legado ${LEGACY_CONTAINER}..."
  docker rm -f "$LEGACY_CONTAINER" 2>/dev/null || true
fi
$COMPOSE up -d --remove-orphans

log "Aguardando healthcheck..."
sleep 8
$COMPOSE ps

CONTAINER_STATUS="$(docker inspect -f '{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo missing)"
if [[ "$CONTAINER_STATUS" == "running" ]] && $COMPOSE exec -T sga wget -qO- http://127.0.0.1/health >/dev/null 2>&1; then
  log "Sistema OK — healthcheck respondeu."
else
  log "Container com problema (status: ${CONTAINER_STATUS}). Últimos logs:"
  docker logs "$CONTAINER" --tail 100 2>&1 || true
  log ""
  log "Causas comuns:"
  log "  1) MYSQL_PASSWORD vazio ou errado no deploy/.env"
  log "  2) MYSQL_HOST inacessível — tente MYSQL_HOST=172.17.0.1 ou MYSQL_HOST=mysql-aliesc (rede Docker)"
  log "  3) Banco ${MYSQL_DATABASE:-sgealiesc_2023} não existe no MySQL"
  log "  4) Migration falhou — veja mensagem nos logs acima"
fi

log "Container HTTP: http://127.0.0.1:${HTTP_PORT}"
log "Produção HTTPS: https://sga.sgebr.net.br (nginx-host-https.conf → :${HTTP_PORT})"
log "Deploy concluído."
