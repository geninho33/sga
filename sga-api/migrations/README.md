# Migrations SGA (API)

Scripts SQL **versionados** para objetos **criados e mantidos pela API Node**, separados do schema GeneXus (`trns*`, `atendimento`, etc.).

## Regras

1. **Não altere** tabelas do GeneXus aqui sem alinhar com a KB/MySQL oficial.
2. Use prefixo `sga_` em tabelas novas da API.
3. Nome dos arquivos: `NNN_descricao.sql` (ordem lexicográfica).
4. Um arquivo = um conjunto de DDL relacionado; evite DML de dados de produção.

## Comandos

```bash
npm run migrate          # aplica pendentes
npm run migrate:status   # lista aplicadas e pendentes
```

### Base oficial (backup + preparação)

Com credenciais em variáveis de ambiente (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_GAM_DATABASE`):

```bash
node scripts/remote-db-prep.mjs   # backup das duas bases + migrations + triggers + croLocSeq
node scripts/remote-db-finish.mjs # apenas triggers/croLocSeq (se o prep falhar no meio)
```

Backups ficam em `backups/<timestamp>/` na raiz do repositório (não versionados).

Na subida da API (`npm run dev` / `start`), migrations pendentes são aplicadas automaticamente (mesmo comportamento anterior do `ensureAuthTables`).

## Controle

Registro em `sga_schema_migrations` (nome do arquivo + data de aplicação).
