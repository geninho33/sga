# Deploy — SGA Alimentação Escolar

Repositório oficial: **https://github.com/viziv-git/sga**

## Instalação no servidor (Ubuntu)

```bash
sudo mkdir -p /var/sga
sudo chown "$USER:$USER" /var/sga
git clone https://github.com/viziv-git/sga.git /var/sga
cd /var/sga/deploy
cp .env.example .env
# edite .env (MYSQL_PASSWORD, JWT_SECRET)
chmod +x deploy.sh
./deploy.sh main
```

Produção: **https://sga.sgebr.net.br**

## Migração de `/var/alimentacao-escolar`

Se o servidor já usa o caminho antigo:

```bash
cd /var/alimentacao-escolar
git remote set-url origin https://github.com/viziv-git/sga.git
git fetch origin
git checkout main
git pull origin main
cd deploy
./deploy.sh main
```

O script remove automaticamente o container legado `sga-alimentacao-escolar` e sobe o novo `sga`.

Opcional — renomear a pasta:

```bash
cd /var
docker rm -f sga-alimentacao-escolar 2>/dev/null || true
mv alimentacao-escolar sga
```

## Docker

| Item | Valor |
|------|--------|
| Imagem | `viziv-git/sga:latest` |
| Container | `sga` |
| Porta host | `127.0.0.1:13080` (configurável em `deploy/.env`) |

## Scripts úteis

| Script | Uso |
|--------|-----|
| `deploy.sh [branch]` | Build + sobe container (padrão: `main`) |
| `diagnose.sh` | Status, logs, teste GAM e admin |
| `setup-https.sh` | Certificado Let's Encrypt + Nginx HTTPS |
| `reset-password.sh` | Redefine senha de login |
| `seed-super-usuario.sh` | Cria perfil super_usuario |

## Nginx no host

Site: `/etc/nginx/sites-available/sga.conf` (gerado por `setup-https.sh` ou `install-nginx-host.sh`).

Se existir config antiga `sga-alimentacao-escolar.conf`, remova após migrar:

```bash
sudo rm -f /etc/nginx/sites-enabled/sga-alimentacao-escolar.conf
sudo nginx -t && sudo systemctl reload nginx
```
