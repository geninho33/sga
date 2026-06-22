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

Na subida da API (`npm run dev` / `start`), migrations pendentes são aplicadas automaticamente (mesmo comportamento anterior do `ensureAuthTables`).

## Controle

Registro em `sga_schema_migrations` (nome do arquivo + data de aplicação).
