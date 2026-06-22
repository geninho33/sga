# sga-api

API Node.js do **SGA — Alimentação Escolar**, com acesso direto ao MySQL (`sgealiesc_2023`).

O schema GeneXus (`trns*`, etc.) **não** é gerenciado aqui. Migrations versionadas aplicam apenas objetos da API (prefixo `sga_`). Ver `migrations/README.md`.

## Setup

```bash
cd sga-api
npm install
cp .env.example .env
# edite .env com credenciais MySQL
npm run migrate        # opcional — também roda na subida da API
npm run dev
```

## Migrations

| Comando | Descrição |
|---------|-----------|
| `npm run migrate` | Aplica SQL pendentes em `migrations/` |
| `npm run migrate:status` | Lista aplicadas e pendentes |

Controle em `sga_schema_migrations`. Na subida (`npm run dev` / `start`), migrations pendentes são aplicadas automaticamente.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/api/produtos` | Lista paginada de produtos (`trnsprodutos`) |
| POST | `/api/produtos` | Cria produto (código gerado por prefeitura) |
| GET | `/api/produtos/:prodCodigo` | Detalhe de um produto |
| PUT | `/api/produtos/:prodCodigo` | Atualiza campos editáveis |
| PATCH | `/api/produtos/:prodCodigo/inativar` | Inativa produto (`prodStatus = I`) |
| PATCH | `/api/produtos/inativar` | Inativa em lote — body: `{ "prodCodigos": [1, 2] }` |
| PATCH | `/api/produtos/:prodCodigo/reativar` | Reativa produto (`prodStatus = A`) |
| PATCH | `/api/produtos/reativar` | Reativa em lote — body: `{ "prodCodigos": [1, 2] }` |

### Query params — `GET /api/produtos`

| Param | Descrição |
|-------|-----------|
| `prefCodigo` | Prefeitura (default: `DEFAULT_PREF_CODIGO` no `.env`) |
| `page` | Página (default: 1) |
| `limit` | Itens por página, máx. 100 (default: 20) |
| `status` | `A` (ativo) ou `I` (inativo) |
| `q` | Busca por descrição ou código |

### Exemplo

```bash
curl "http://localhost:3001/api/produtos?limit=5&status=A"
```

## Próximos passos

- Auth com sessão/JWT e `prefCodigo` do usuário logado
- `sga-web` consumindo esta API com o shell do designer
