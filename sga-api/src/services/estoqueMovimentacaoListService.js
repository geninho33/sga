import { pool } from "../db.js";
import { paginatedList } from "./listQuery.js";

const SALDO_ATUAL_SQL = `CASE
  WHEN e.estoTipo IN ('S','T','F') THEN e.estoSaldo - e.estoQuantidade
  WHEN e.estoTipo IN ('R','G','E','M') THEN e.estoSaldo + e.estoQuantidade
  ELSE e.estoSaldo
END`;

const LANCAMENTO_SQL = `CASE
  WHEN e.estoAjusCodigo <> 0 THEN CONCAT('Ajuste n. ', e.estoAjusCodigo)
  WHEN e.estoRomanCodigo <> 0 THEN CONCAT('Romaneio n. ', e.estoRomanCodigo)
  WHEN e.estoDistCodigo <> 0 THEN CONCAT('Distribuição n. ', e.estoDistCodigo)
  WHEN e.estoNfCodigo <> 0 THEN CONCAT('Compra n. ', e.estoNfCodigo)
  ELSE ''
END`;

const SORT_MAP = {
  estoCodigo: "e.estoCodigo",
  estoAlteracao: "e.estoAlteracao",
  estoProduto: "e.estoProduto",
  estoProdutoDescricao: "e.estoProdutoDescricao",
  estoUnidadeSigla: "e.estoUnidadeSigla",
  estoSaldo: "e.estoSaldo",
  estoQuantidade: "e.estoQuantidade",
  estoSaldoAtual: SALDO_ATUAL_SQL,
  estoLancamento: LANCAMENTO_SQL,
  estoObservacao: "e.estoObservacao",
};

function parseSort(query) {
  const orderBy = SORT_MAP[query.orderBy] || SORT_MAP.estoCodigo;
  const orderDir = String(query.orderDir || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
  return { orderBy, orderDir };
}

function buildFilters(query) {
  const where = [];
  const params = {};

  const prod = String(query.estoProduto ?? "").trim();
  if (prod) {
    where.push("e.estoProduto = :estoProduto");
    params.estoProduto = Number(prod);
  }

  const desc = String(query.estoProdutoDescricao ?? query.q ?? "").trim();
  if (desc) {
    where.push("e.estoProdutoDescricao LIKE :estoProdutoDescricao");
    params.estoProdutoDescricao = `%${desc}%`;
  }

  const qtd = String(query.estoQuantidade ?? "").trim();
  if (qtd) {
    where.push("e.estoQuantidade = :estoQuantidade");
    params.estoQuantidade = Number(qtd.replace(",", "."));
  }

  const tipo = String(query.estoTipo ?? "").trim();
  if (tipo) {
    where.push("e.estoTipo = :estoTipo");
    params.estoTipo = tipo;
  }

  const local = String(query.estoLocal ?? "").trim();
  if (local) {
    where.push("e.estoLocal = :estoLocal");
    params.estoLocal = Number(local);
  }

  const cadFrom = String(query.estoCadastroFrom ?? "").trim();
  if (cadFrom) {
    where.push("e.estoCadastro >= :estoCadastroFrom");
    params.estoCadastroFrom = cadFrom;
  }
  const cadTo = String(query.estoCadastroTo ?? "").trim();
  if (cadTo) {
    where.push("e.estoCadastro <= :estoCadastroTo");
    params.estoCadastroTo = `${cadTo.slice(0, 10)} 23:59:59`;
  }

  const altFrom = String(query.estoAlteracaoFrom ?? "").trim();
  if (altFrom) {
    where.push("e.estoAlteracao >= :estoAlteracaoFrom");
    params.estoAlteracaoFrom = altFrom;
  }
  const altTo = String(query.estoAlteracaoTo ?? "").trim();
  if (altTo) {
    where.push("e.estoAlteracao <= :estoAlteracaoTo");
    params.estoAlteracaoTo = `${altTo.slice(0, 10)} 23:59:59`;
  }

  const hasRangeFilter =
    prod ||
    desc ||
    qtd ||
    tipo ||
    local ||
    cadFrom ||
    cadTo ||
    altFrom ||
    altTo;

  if (!hasRangeFilter && query.recentOnly !== "0") {
    where.push("e.estoAlteracao >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)");
  }

  return { where, params, hasRangeFilter };
}

/**
 * Listagem paginada de movimentações de estoque (TRNSEstoqueWW).
 * Consulta apenas trnsestoque (campos desnormalizados) para evitar JOINs.
 */
export async function listEstoqueMovimentacao(prefCodigo, query = {}) {
  const { where, params } = buildFilters(query);
  const sort = parseSort(query);
  const safeLimit = Math.min(50, Math.max(1, Number(query.limit) || 20));

  return paginatedList(pool, {
    select: `e.estoCodigo, e.estoAlteracao, e.estoProduto, e.estoProdutoDescricao,
             e.estoUnidadeSigla, e.estoSaldo, e.estoQuantidade, e.estoTipo,
             e.estoObservacao, e.estoLocal, e.estoLocalDescricao,
             ${SALDO_ATUAL_SQL} AS estoSaldoAtual,
             ${LANCAMENTO_SQL} AS estoLancamento`,
    from: "FROM trnsestoque e",
    alias: "e",
    where,
    params,
    prefCodigo,
    prefColumn: "prefCodigo",
    orderBy: sort.orderBy,
    orderDir: sort.orderDir,
    page: query.page,
    limit: safeLimit,
  });
}
