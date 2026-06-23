# SGA — Alimentação Escolar
# Repositório: https://github.com/viziv-git/sga

# --- Build frontend (Vite/React) ---
FROM node:20-alpine AS web-build
WORKDIR /build
COPY VERSION scripts/generate-version.mjs ./
COPY sga-web/package.json sga-web/package-lock.json ./sga-web/
RUN cd sga-web && npm ci
COPY sga-web ./sga-web
RUN mkdir -p sga-api/src/generated
RUN node generate-version.mjs
WORKDIR /build/sga-web
# Mesma origem: nginx faz proxy de /api para a API interna
ENV VITE_API_URL=
RUN npm run build

# --- Dependências da API ---
FROM node:20-alpine AS api-deps
WORKDIR /build/api
COPY sga-api/package.json sga-api/package-lock.json ./
RUN npm ci --omit=dev

# --- Imagem final: Nginx + Node ---
FROM node:20-alpine AS runtime
LABEL org.opencontainers.image.title="SGA — Alimentação Escolar" \
  org.opencontainers.image.source="https://github.com/viziv-git/sga" \
  org.opencontainers.image.vendor="Viziv"
RUN apk add --no-cache nginx tini wget \
  && mkdir -p /var/log/nginx /var/lib/nginx /run/nginx /usr/share/nginx/html

WORKDIR /app/api
COPY --from=api-deps /build/api/node_modules ./node_modules
COPY sga-api/package.json ./
COPY sga-api/src ./src
COPY sga-api/scripts ./scripts
COPY sga-api/migrations ./migrations
COPY --from=web-build /build/sga-api/src/generated ./src/generated

COPY --from=web-build /build/sga-web/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/entrypoint.sh"]
