# sga-web

Frontend React do **SGA — Alimentação Escolar**, usando o design system do protótipo `designer/`.

## Pré-requisitos

A API `sga-api` deve estar rodando (proxy Vite encaminha `/api` → `http://localhost:3001`).

```bash
# terminal 1
cd ../sga-api
npm run dev

# terminal 2
cd sga-web
npm install
npm run dev
```

Abra http://localhost:5173 → **Cadastros** → **Produtos / Alimentos**

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API (vazio = proxy Vite em dev) |

## Estrutura

```
src/
├── api/produtos.js      # fetch GET /api/produtos
├── components/
│   ├── Icon.jsx         # ícones SVG (port do designer)
│   └── shell/           # Rail, Sidebar, Topbar, CommandPalette
├── data/modules.js      # módulos e navegação
├── pages/
│   ├── Dashboard.jsx
│   ├── ProdutosPage.jsx   # lista real paginada
│   └── ProdutoFormPage.jsx # edição em abas
└── styles/              # tokens + components do designer
```
