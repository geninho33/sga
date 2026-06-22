/**
 * Constantes extraídas de trnsprodutosWW (GeneXus Work With Plus).
 * Fonte: sga-kb_paralela/ObjetosDaKbEmXml/WebPanel/trnsprodutosWW.xml
 */

export const PRODUTOS_WW_TITLE = "Listagem de Alimentos";

/** Colunas visíveis no grid (InitializeColumnsSelector). */
export const PRODUTOS_WW_COLUMNS = [
  { key: "prodCodigo", label: "Código", sortKey: "prodCodigo" },
  { key: "prodDescricao", label: "Descrição", sortKey: "prodDescricao", defaultSort: true },
  { key: "prodPesoConsumo", label: "Consumo", sortKey: "prodPesoConsumo", format: "decimal" },
  { key: "prodPesoEstocagem", label: "Estocagem", sortKey: "prodPesoEstocagem", format: "decimal" },
  { key: "prodTipo", label: "Tipo", sortKey: "prodTipo", format: "grupo" },
  { key: "prodOrigem", label: "Origem", sortKey: "prodOrigem", format: "origem" },
  { key: "prodClassificacao", label: "Classificação", sortKey: "prodClassificacao", format: "classificacao" },
  { key: "prodCodigoTipoRemessa", label: "Tipo de Remessa", sortKey: "prodCodigoTipoRemessa", format: "remessa" },
  { key: "prodStatus", label: "Situação", sortKey: "prodStatus", format: "status" },
];

/** Combo prodClassificacao no GeneXus. */
export const PRODUTO_CLASSIFICACAO = {
  2: "Perecíveis",
  3: "Não Perecíveis",
  4: "Semiperecíveis",
};

export const PRODUTO_CLASSIFICACAO_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "3", label: "Não Perecíveis" },
  { value: "2", label: "Perecíveis" },
  { value: "4", label: "Semiperecíveis" },
];

/** Filtros dinâmicos (DynamicFiltersSelector). */
export const PRODUTO_FILTER_FIELDS = [
  { key: "prodCodigo", label: "Código", input: "number", placeholder: "Ex.: 42" },
  { key: "prodDescricao", label: "Descrição", input: "text", placeholder: "Contém…" },
  { key: "prodTipo", label: "Tipo", input: "grupo" },
  { key: "prodOrigem", label: "Origem", input: "origem" },
  { key: "prodCodigoTipoRemessa", label: "Tipo de Remessa", input: "remessa" },
  { key: "prodClassificacao", label: "Classificação", input: "classificacao" },
  { key: "prodStatus", label: "Situação", input: "status" },
];

/** Paginação WWP (RowsPerPageOptions). */
export const PRODUTOS_PAGE_SIZES = [5, 10, 20, 50];

export const PRODUTOS_WW_ACTIONS = {
  insert: { label: "Inserir", icon: "fa-plus", geneXus: "GXM_insert / BtnInsert" },
  export: { label: "Exportar dados", icon: "fa-download", geneXus: "WWP_ExportCaption" },
  exportReport: { label: "Exportar relatório", icon: "fa-file-lines", geneXus: "WWP_ExportReportCaption" },
  update: { label: "Alterar", icon: "fa-pen", geneXus: "GXM_update" },
};

export function formatProdutoClassificacao(value) {
  if (value === null || value === undefined || value === "") return "—";
  return PRODUTO_CLASSIFICACAO[Number(value)] ?? String(value);
}

export function formatProdutoDecimal(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return value ?? "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export function formatProdutoCell(column, row, statusMap) {
  const raw = row[column.key];
  if (column.format === "classificacao") return formatProdutoClassificacao(raw);
  if (column.format === "decimal") return formatProdutoDecimal(raw);
  if (column.format === "grupo") {
    if (row.prodGrupDescricao) return row.prodGrupDescricao;
    if (raw === null || raw === undefined || raw === "") return "—";
    return String(raw);
  }
  if (column.format === "origem") {
    if (row.prodOrigAbreviatura) return row.prodOrigAbreviatura;
    if (raw === null || raw === undefined || raw === "") return "—";
    return String(raw);
  }
  if (column.format === "remessa") {
    if (row.disTipDescricao) return row.disTipDescricao;
    if (raw === null || raw === undefined || raw === "") return "—";
    return String(raw);
  }
  if (column.format === "status") {
    const st = statusMap[raw] || statusMap.I;
    return st;
  }
  if (raw === null || raw === undefined || raw === "") return "—";
  return raw;
}
