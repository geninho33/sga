/** Configuração das telas de relatório (filtros + endpoint PDF). */
export const RELATORIO_CONFIGS = {
  "rel-compras": {
    id: "rel-compras",
    title: "Relatório de Compras",
    geneXusPanel: "WPRelatorioCompras",
    pdfPath: "/api/relatorios/compras/pdf",
    fields: [
      { key: "dataInicial", label: "Data inicial", type: "date", required: true },
      { key: "dataFinal", label: "Data final", type: "date", required: true },
      { key: "prodCodigo", label: "Produto", type: "produto", optional: true },
      { key: "grupoCodigo", label: "Grupo", type: "grupo", optional: true },
      { key: "fornecedorCodigo", label: "Fornecedor", type: "fornecedor", optional: true },
      { key: "ordem", label: "Ordem", type: "select", options: [
        { value: "N", label: "Nome" },
        { value: "C", label: "Código" },
      ] },
    ],
  },
  "rel-dist-ue": {
    id: "rel-dist-ue",
    title: "Distribuição de Produtos por UE",
    geneXusPanel: "WPRelatorioDistribuicao",
    pdfPath: "/api/relatorios/distribuicao-ue/pdf",
    fields: [
      { key: "dataInicial", label: "Data inicial", type: "date", required: true },
      { key: "dataFinal", label: "Data final", type: "date", required: true },
      { key: "situacaoData", label: "Situação data", type: "select", options: [
        { value: "R", label: "Recepção" },
        { value: "E", label: "Envio" },
        { value: "T", label: "Todas" },
      ] },
      { key: "rotaCodigo", label: "Rota", type: "rota", optional: true },
      { key: "localDestino", label: "Destino", type: "local", optional: true },
      { key: "prodCodigo", label: "Produto", type: "produto", optional: true },
      { key: "grupoCodigo", label: "Grupo", type: "grupo", optional: true },
    ],
  },
  "rel-dist-rota": {
    id: "rel-dist-rota",
    title: "Distribuição de Produtos por Rota",
    geneXusPanel: "WPRelatorioDistribuicaoProduto",
    pdfPath: "/api/relatorios/distribuicao-rota/pdf",
    requiresProdutos: true,
    fields: [
      { key: "dataInicial", label: "Data inicial", type: "date", required: true },
      { key: "dataFinal", label: "Data final", type: "date", required: true },
      { key: "rotaCodigo", label: "Rota", type: "rota", optional: true },
    ],
  },
  "rel-entradas-saidas-ue": {
    id: "rel-entradas-saidas-ue",
    title: "Entradas e Saídas nas Unidades Educativas",
    geneXusPanel: "WPOpcaoImpressaoUE",
    pdfPath: "/api/relatorios/entradas-saidas-ue/pdf",
    requiresProdutos: true,
    fields: [
      { key: "dataInicial", label: "Data inicial", type: "date", required: true },
      { key: "dataFinal", label: "Data final", type: "date", required: true },
      { key: "locCodigo", label: "Unidade", type: "local", optional: true },
      { key: "tipo", label: "Tipo", type: "select", options: [
        { value: "T", label: "Todas" },
        { value: "E", label: "Entrada" },
        { value: "S", label: "Saída" },
      ] },
    ],
  },
};

export function getRelatorioConfig(id) {
  return RELATORIO_CONFIGS[id] ?? null;
}
