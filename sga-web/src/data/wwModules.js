/**
 * Definições das listagens WW (GeneXus Web Panels).
 * Colunas extraídas de InitializeColumnsSelector / grid de cada WW.
 */

import { formatCurrencyBr, formatDateBr } from "../utils/formatBr";
import { formatLocTipoUnidade } from "./logisticaCatalog";

export const WW_PAGE_SIZES = [5, 10, 20, 50];

export const WW_ACTIONS = {
  insert: { label: "Inserir", icon: "fa-plus", geneXus: "GXM_insert / BtnInsert" },
  update: { label: "Alterar", icon: "fa-pen", geneXus: "GXM_update" },
  export: { label: "Exportar dados", icon: "fa-download", geneXus: "WWP_ExportCaption" },
  exportReport: { label: "Exportar relatório", icon: "fa-file-lines", geneXus: "WWP_ExportReportCaption" },
};

export const WW_MODULES = {
  unidades: {
    id: "unidades",
    screen: "ww:unidades",
    listScreen: "ww:unidades",
    title: "Listagem de Unidade de Medida",
    geneXusPanel: "trnsunidadesWW",
    geneXusParent: "WorkWithPlustrnsunidades",
    editTransaction: "trnsunidades",
    breadcrumbSection: "Cadastro",
    apiPath: "/api/cadastro/unidades",
    defaultSort: { orderBy: "uniDescricao", orderDir: "asc" },
    rowKey: (r) => String(r.uniCodigo),
    editId: (r) => String(r.uniCodigo),
    linkColumn: "uniDescricao",
    columns: [
      { key: "uniCodigo", label: "Código", sortKey: "uniCodigo", hidden: true },
      { key: "uniDescricao", label: "Descrição", sortKey: "uniDescricao", defaultSort: true },
      { key: "uniFracao", label: "Fração", sortKey: "uniFracao", format: "sn" },
      { key: "uniStatus", label: "Situação", sortKey: "uniStatus", format: "status" },
    ],
    filterFields: [
      { key: "uniDescricao", label: "Descrição", input: "text", placeholder: "Contém…" },
      { key: "uniStatus", label: "Situação", input: "status" },
    ],
    statusField: "uniStatus",
  },

  "conv-qtdes": {
    id: "conv-qtdes",
    screen: "ww:conv-qtdes",
    listScreen: "ww:conv-qtdes",
    title: "Conversão de Unidades",
    geneXusPanel: "trnsconvqtdeWW",
    geneXusParent: "WorkWithPlustrnsconvqtde",
    editTransaction: "trnsconvqtde",
    breadcrumbSection: "Cadastro",
    apiPath: "/api/cadastro/conv-qtdes",
    defaultSort: { orderBy: "uniConOrigemDescricao", orderDir: "asc" },
    rowKey: (r) => `${r.uniConvUnidadeOrigem ?? ""}-${r.uniConvUnidadeDestino ?? ""}`,
    editId: (r) => `${r.uniConvUnidadeOrigem}-${r.uniConvUnidadeDestino}`,
    linkColumn: "uniConOrigemDescricao",
    columns: [
      { key: "uniConOrigemDescricao", label: "Unidade Origem", sortKey: "uniConOrigemDescricao", defaultSort: true },
      { key: "uniConDestinoDescricao", label: "Unidade Destino", sortKey: "uniConDestinoDescricao" },
      { key: "uniConvQtdeGerar", label: "Qtde a Gerar", sortKey: "uniConvQtdeGerar", format: "decimal" },
      { key: "uniConvStatus", label: "Situação", sortKey: "uniConvStatus", format: "status" },
    ],
    filterFields: [{ key: "q", label: "Unidade", input: "text", placeholder: "Origem ou destino…" }],
    statusField: "uniConvStatus",
  },

  locais: {
    id: "locais",
    screen: "ww:locais",
    listScreen: "ww:locais",
    title: "Locais",
    geneXusPanel: "trnslocalWW",
    geneXusParent: "WorkWithPlustrnslocal",
    editTransaction: "trnslocal",
    breadcrumbSection: "Cadastro",
    apiPath: "/api/cadastro/locais",
    defaultSort: { orderBy: "locDescricao", orderDir: "asc" },
    rowKey: (r) => String(r.locCodigo),
    editId: (r) => String(r.locCodigo),
    linkColumn: "locDescricao",
    columns: [
      { key: "locCodigo", label: "Código", sortKey: "locCodigo" },
      { key: "locDescricao", label: "Descrição", sortKey: "locDescricao", defaultSort: true },
      { key: "locTipoUnidade", label: "Tipo Unidade", sortKey: "locTipoUnidade", format: "locTipoUnidade" },
      { key: "locTelefone", label: "Telefones", sortKey: "locTelefone" },
      { key: "locBairro", label: "Bairro", sortKey: "locBairro" },
      { key: "locUsuario", label: "Usuário (Código)", sortKey: "locUsuario" },
      { key: "locForno", label: "Tem Forno", sortKey: "locForno", format: "sn" },
      { key: "locNota", label: "Rota", sortKey: "locNota", format: "rotaDescricao" },
      { key: "locStatus", label: "Situação", sortKey: "locStatus", format: "status" },
      { key: "locUeCod", label: "SGE", sortKey: "locUeCod" },
    ],
    filterFields: [
      { key: "q", label: "Descrição / Código", input: "text", placeholder: "Contém…" },
      { key: "locStatus", label: "Situação", input: "status" },
    ],
    statusField: "locStatus",
  },

  doencas: {
    id: "doencas",
    screen: "ww:doencas",
    listScreen: "ww:doencas",
    title: "Doenças",
    geneXusPanel: "trnsdoencasWW",
    geneXusParent: "WorkWithPlustrnsdoencas",
    editTransaction: "trnsdoencas",
    breadcrumbSection: "Cadastro",
    apiPath: "/api/cadastro/doencas",
    defaultSort: { orderBy: "doenDescricao", orderDir: "asc" },
    rowKey: (r) => String(r.doenCodigo),
    editId: (r) => String(r.doenCodigo),
    linkColumn: "doenDescricao",
    columns: [
      { key: "doenCodigo", label: "Código", sortKey: "doenCodigo" },
      { key: "doenDescricao", label: "Descrição", sortKey: "doenDescricao", defaultSort: true },
      { key: "doenStatus", label: "Situação", sortKey: "doenStatus", format: "status" },
    ],
    filterFields: [
      { key: "q", label: "Descrição / Código", input: "text", placeholder: "Contém…" },
      { key: "doenStatus", label: "Situação", input: "status" },
    ],
    statusField: "doenStatus",
  },

  "tipos-ajuste": {
    id: "tipos-ajuste",
    screen: "ww:tipos-ajuste",
    listScreen: "ww:tipos-ajuste",
    title: "Tipo de Ajustes",
    geneXusPanel: "TipoAjusteWW",
    geneXusParent: "WorkWithPlusTipoAjuste",
    editTransaction: "TipoAjuste",
    breadcrumbSection: "Cadastro",
    apiPath: "/api/cadastro/tipos-ajuste",
    defaultSort: { orderBy: "tipajuNome", orderDir: "asc" },
    rowKey: (r) => String(r.tipajuCodigo),
    editId: (r) => String(r.tipajuCodigo),
    linkColumn: "tipajuNome",
    columns: [
      { key: "tipajuCodigo", label: "Ajuste", sortKey: "tipajuCodigo" },
      { key: "tipajuNome", label: "Nome", sortKey: "tipajuNome", defaultSort: true },
      { key: "tipajuSigla", label: "Sigla", sortKey: "tipajuSigla" },
      { key: "tipajuAcao", label: "Ação", sortKey: "tipajuAcao", format: "acaoAjuste" },
    ],
    filterFields: [{ key: "q", label: "Nome / Sigla", input: "text", placeholder: "Contém…" }],
  },

  pratos: {
    id: "pratos",
    screen: "ww:pratos",
    listScreen: "ww:pratos",
    title: "Refeições",
    geneXusPanel: "trnspratosWW",
    editTransaction: "trnspratos",
    breadcrumbSection: "Preparações",
    apiPath: "/api/preparacao/pratos",
    defaultSort: { orderBy: "pratoDscricao", orderDir: "asc" },
    rowKey: (r) => String(r.pratoCodigo),
    editId: (r) => String(r.pratoCodigo),
    linkColumn: "pratoDscricao",
    columns: [
      { key: "pratoCodigo", label: "Código", sortKey: "pratoCodigo" },
      { key: "pratoDscricao", label: "Descrição", sortKey: "pratoDscricao", defaultSort: true },
      { key: "pratoTipoRefeicaoDesc", label: "Turno", sortKey: "pratoTipoRefeicao" },
      { key: "pratoStatus", label: "Situação", sortKey: "pratoStatus", format: "status" },
    ],
    filterFields: [
      { key: "q", label: "Descrição / Código", input: "text", placeholder: "Contém…" },
      { key: "pratoStatus", label: "Situação", input: "status" },
    ],
    statusField: "pratoStatus",
    rowActions: [
      { id: "ingredientes", icon: "fa-clipboard-list", title: "Lançar ingredientes", geneXus: "trnspratosingredientesWW" },
      {
        id: "duplicar",
        icon: "fa-copy",
        title: "Duplicar refeição",
        geneXus: "PRCDDuplicarRefeicao",
        confirm: "Deseja duplicar esta refeição?",
      },
    ],
  },

  "tipos-refeicao": {
    id: "tipos-refeicao",
    screen: "ww:tipos-refeicao",
    listScreen: "ww:tipos-refeicao",
    title: "Tipo de Refeição",
    geneXusPanel: "trnsrefeicaotipoWW",
    editTransaction: "trnsrefeicaotipo",
    breadcrumbSection: "Preparações",
    apiPath: "/api/preparacao/tipos-refeicao",
    defaultSort: { orderBy: "refTipDescricao", orderDir: "asc" },
    rowKey: (r) => String(r.refTipCodigo),
    editId: (r) => String(r.refTipCodigo),
    linkColumn: "refTipDescricao",
    columns: [
      { key: "refTipCodigo", label: "Código", sortKey: "refTipCodigo" },
      { key: "refTipAbreviatura", label: "Abrev.", sortKey: "refTipAbreviatura" },
      { key: "refTipDescricao", label: "Descrição", sortKey: "refTipDescricao", defaultSort: true },
      { key: "refTipperiodo", label: "Período", sortKey: "refTipperiodo", format: "periodoRefeicao" },
      { key: "refTipstatus", label: "Situação", sortKey: "refTipstatus", format: "status" },
    ],
    filterFields: [{ key: "q", label: "Descrição", input: "text", placeholder: "Contém…" }],
    statusField: "refTipstatus",
  },

  cardapios: {
    id: "cardapios",
    screen: "ww:cardapios",
    listScreen: "ww:cardapios",
    title: "Cardápios",
    geneXusPanel: "trnscardapioWW",
    editTransaction: "trnscardapio",
    breadcrumbSection: "Preparações",
    apiPath: "/api/preparacao/cardapios",
    customForm: "cardapio",
    defaultSort: { orderBy: "carDapDescricao", orderDir: "asc" },
    rowKey: (r) => String(r.carDapCodigo),
    editId: (r) => String(r.carDapCodigo),
    linkColumn: "carDapDescricao",
    columns: [
      { key: "carDapCodigo", label: "Código", sortKey: "carDapCodigo" },
      { key: "carDapDescricao", label: "Descrição", sortKey: "carDapDescricao", defaultSort: true },
      { key: "carDapMesAno", label: "Mês/Ano", sortKey: "carDapMesAno", format: "date" },
      { key: "carGruDescricao", label: "Grupo", sortKey: "carGruDescricao" },
      { key: "carDapLiberarAcesso", label: "Liberar acesso", sortKey: "carDapLiberarAcesso", format: "sn" },
      { key: "carDapStatus", label: "Situação", sortKey: "carDapStatus", format: "status" },
    ],
    filterFields: [{ key: "q", label: "Descrição", input: "text", placeholder: "Contém…" }],
    statusField: "carDapStatus",
    rowActions: [
      { id: "refeicoes", icon: "fa-spoon", title: "Definir refeições", geneXus: "trnscardapiopratoww" },
      { id: "imprimir", icon: "fa-print", title: "Imprimir o cardápio", geneXus: "WPOpcaoImpressaoCardapio" },
      {
        id: "duplicar",
        icon: "fa-copy",
        title: "Duplicar este cardápio",
        geneXus: "PRCDDuplicarCardapio",
        confirm: "Deseja realmente duplicar o cardápio?",
      },
    ],
  },

  "cardapio-grupos": {
    id: "cardapio-grupos",
    screen: "ww:cardapio-grupos",
    listScreen: "ww:cardapio-grupos",
    title: "Grupo de Cardápios",
    geneXusPanel: "trnscardapiogrupoWW",
    editTransaction: "trnscardapiogrupo",
    breadcrumbSection: "Preparações",
    apiPath: "/api/preparacao/cardapio-grupos",
    defaultSort: { orderBy: "carGruDescricao", orderDir: "asc" },
    customForm: "cardapio-grupo",
    rowKey: (r) => String(r.carGruCodigo),
    editId: (r) => String(r.carGruCodigo),
    linkColumn: "carGruDescricao",
    columns: [
      { key: "carGruCodigo", label: "Código", sortKey: "carGruCodigo" },
      { key: "carGruDescricao", label: "Descrição", sortKey: "carGruDescricao", defaultSort: true },
      { key: "carDapDescricao", label: "Cardápio referência", sortKey: "carDapDescricao" },
      { key: "carGruCozinhaCentral", label: "Cozinha central", sortKey: "carGruCozinhaCentral", format: "sn" },
      { key: "carGruStatus", label: "Situação", sortKey: "carGruStatus", format: "status" },
    ],
    filterFields: [{ key: "q", label: "Descrição", input: "text", placeholder: "Contém…" }],
    statusField: "carGruStatus",
  },

  atendimentos: {
    id: "atendimentos",
    screen: "ww:atendimentos",
    listScreen: "ww:atendimentos",
    title: "Atendimento",
    geneXusPanel: "atendimentoWW",
    editTransaction: "Atendimento",
    breadcrumbSection: "Preparações",
    apiPath: "/api/preparacao/atendimentos",
    defaultSort: { orderBy: "locDescricao", orderDir: "asc" },
    rowKey: (r) => String(r.AtendimentoCodigo),
    editId: (r) => String(r.AtendimentoCodigo),
    linkColumn: "locDescricao",
    columns: [
      { key: "AtendimentoCodigo", label: "Código", sortKey: "AtendimentoCodigo" },
      { key: "locDescricao", label: "Unidade Escolar", sortKey: "locDescricao", defaultSort: true },
      { key: "AreEnsNome", label: "Área", sortKey: "AreEnsNome" },
      { key: "carGruDescricao", label: "Grupo Cardápio", sortKey: "carGruDescricao" },
      { key: "carDapDescricao", label: "Cardápio", sortKey: "carDapDescricao" },
      { key: "carDapMesAno", label: "Mês/Ano cardápio", sortKey: "carDapMesAno", format: "date" },
      { key: "AtendimentoTurnoDesc", label: "Turno", sortKey: "AtendimentoTurnoDesc" },
      { key: "AtendimentoTotalAlunos", label: "Total de Alunos", sortKey: "AtendimentoTotalAlunos", format: "decimal" },
      { key: "AtendimentoStatus", label: "Situação", sortKey: "AtendimentoStatus", format: "status" },
    ],
    filterFields: [
      { key: "q", label: "Unidade / Código", input: "text", placeholder: "Contém…" },
      { key: "carGruCodigo", label: "Grupo cardápio", input: "cardapioGrupo" },
    ],
    statusField: "AtendimentoStatus",
  },

  "calendario-letivo": {
    id: "calendario-letivo",
    screen: "ww:calendario-letivo",
    listScreen: "ww:calendario-letivo",
    title: "Calendário Letivo",
    geneXusPanel: "trnscalendarioletivoWW",
    editTransaction: "trnscalendarioletivo",
    breadcrumbSection: "Preparações",
    apiPath: "/api/preparacao/calendario-letivo",
    defaultSort: { orderBy: "calData", orderDir: "asc" },
    rowKey: (r) => String(r.calAno ?? "") + "|" + String(r.calData ?? "").slice(0, 10),
    editId: (r) => `${r.calAno}|${String(r.calData).slice(0, 10)}`,
    linkColumn: "calDescricao",
    columns: [
      { key: "calAno", label: "Ano", sortKey: "calAno" },
      { key: "calData", label: "Data", sortKey: "calData", format: "date" },
      { key: "calDescricao", label: "Descrição", sortKey: "calDescricao", defaultSort: true },
      { key: "calDiautil", label: "Dia útil", sortKey: "calDiautil", format: "sn" },
      { key: "calFeriado", label: "Feriado", sortKey: "calFeriado", format: "sn" },
      { key: "calStatus", label: "Situação", sortKey: "calStatus", format: "status" },
    ],
    filterFields: [{ key: "q", label: "Descrição / Ano", input: "text", placeholder: "Contém…" }],
    statusField: "calStatus",
    pageType: "custom",
    customPage: "calendario-letivo",
  },

  "mapa-estoque": {
    id: "mapa-estoque",
    screen: "ww:mapa-estoque",
    listScreen: "ww:mapa-estoque",
    title: "Acompanhamento da Unidade Escolar",
    geneXusPanel: "WPConsultaMapaEstoqueUnidade",
    breadcrumbSection: "Preparações",
    pageType: "custom",
    customPage: "mapa-estoque",
  },

  "qtde-fixa": {
    id: "qtde-fixa",
    screen: "ww:qtde-fixa",
    listScreen: "ww:qtde-fixa",
    title: "Lançar Quantidade Fixa",
    geneXusPanel: "WPLancarQtdeFixa",
    breadcrumbSection: "Preparações",
    pageType: "custom",
    customPage: "qtde-fixa",
  },

  movimentacao: {
    id: "movimentacao",
    screen: "ww:movimentacao",
    listScreen: "ww:movimentacao",
    title: "Movimentação de Estoque",
    geneXusPanel: "TRNSEstoqueWW",
    geneXusParent: "WorkWithPlusTRNSEstoque",
    breadcrumbSection: "Estoque",
    apiPath: "/api/estoque/movimentacao",
    pageType: "custom",
    customPage: "movimentacao",
    defaultSort: { orderBy: "estoCodigo", orderDir: "desc" },
    rowKey: (r) => String(r.estoCodigo),
    columns: [
      { key: "estoCodigo", label: "Código", sortKey: "estoCodigo", defaultSort: true },
      { key: "estoAlteracao", label: "Dt Movimentação", sortKey: "estoAlteracao", format: "date" },
      { key: "estoProduto", label: "Produto", sortKey: "estoProduto" },
      { key: "estoProdutoDescricao", label: "Descrição", sortKey: "estoProdutoDescricao" },
      { key: "estoUnidadeSigla", label: "UN", sortKey: "estoUnidadeSigla" },
      { key: "estoSaldo", label: "Saldo Anterior", sortKey: "estoSaldo", format: "decimal" },
      { key: "estoQuantidade", label: "Qtde Lançada", sortKey: "estoQuantidade", format: "decimal" },
      { key: "estoSaldoAtual", label: "Saldo Atual", sortKey: "estoSaldoAtual", format: "decimal" },
      { key: "estoLancamento", label: "Lançamento", sortKey: "estoLancamento" },
      { key: "estoObservacao", label: "Observação", sortKey: "estoObservacao" },
    ],
    filterFields: [
      { key: "estoProduto", label: "Produto", input: "number" },
      { key: "estoProdutoDescricao", label: "Descrição", input: "text", placeholder: "Contém…" },
      { key: "estoTipo", label: "Tipo movimentação", input: "estoTipo" },
      { key: "estoLocal", label: "Local", input: "local" },
    ],
  },

  ajuste: {
    id: "ajuste",
    screen: "ww:ajuste",
    listScreen: "ww:ajuste",
    title: "Ajuste de Estoque",
    geneXusPanel: "trnsajusteWW",
    geneXusParent: "WorkWithPlustrnsajuste",
    editTransaction: "trnsajuste",
    breadcrumbSection: "Estoque",
    apiPath: "/api/estoque/ajustes",
    defaultSort: { orderBy: "tipajuNome", orderDir: "asc" },
    rowKey: (r) => String(r.ajusCodigo),
    editId: (r) => String(r.ajusCodigo),
    linkColumn: "ajusCodigo",
    columns: [
      { key: "ajusCodigo", label: "Código", sortKey: "ajusCodigo", defaultSort: true },
      { key: "ajusData", label: "Data", sortKey: "ajusData", format: "date" },
      { key: "tipajuNome", label: "Tipo Ajuste", sortKey: "tipajuNome" },
      { key: "tipajuAcao", label: "Ação", sortKey: "tipajuAcao", format: "acaoAjuste" },
      { key: "ajusLocaDescricao", label: "Local", sortKey: "locDescricao" },
    ],
    filterFields: [{ key: "q", label: "Tipo / Local / Código", input: "text", placeholder: "Contém…" }],
    statusField: "ajusStatus",
    rowActions: [
      { id: "ajus-cancelar", icon: "fa-ban", title: "Cancelar ajuste", when: (r) => r.ajusStatus !== "C" },
    ],
  },

  inventario: {
    id: "inventario",
    screen: "ww:inventario",
    listScreen: "ww:inventario",
    title: "Inventário",
    geneXusPanel: "WPInventario",
    breadcrumbSection: "Estoque",
    pageType: "custom",
    customPage: "inventario",
  },

  posicao: {
    id: "posicao",
    screen: "ww:posicao",
    listScreen: "ww:posicao",
    title: "Posição de Estoque",
    geneXusPanel: "trnsprodutosposicaoWW",
    breadcrumbSection: "Estoque",
    apiPath: "/api/estoque/posicao",
    listOnly: true,
    defaultSort: { orderBy: "prodDescricao", orderDir: "asc" },
    rowKey: (r) => String(r.prodCodigo),
    linkColumn: "prodDescricao",
    columns: [
      { key: "prodQtdeMinimo", label: "Mínimo", sortKey: "prodQtdeMinimo", format: "decimal" },
      { key: "prodSaldo", label: "Saldo", sortKey: "prodSaldo", format: "prodSaldoPosicao" },
      { key: "prodQtdeMaximo", label: "Máximo", sortKey: "prodQtdeMaximo", format: "decimal" },
      { key: "prodCodigo", label: "Código", sortKey: "prodCodigo" },
      { key: "prodDescricao", label: "Descrição", sortKey: "prodDescricao", defaultSort: true },
      { key: "uniDescricao", label: "Unidade (Compra)", sortKey: "uniDescricao" },
      { key: "prodGrupdescricao", label: "Tipo", sortKey: "prodGrupdescricao" },
    ],
    filterFields: [{ key: "q", label: "Descrição / Código", input: "text", placeholder: "Contém…" }],
  },

  saldo: {
    id: "saldo",
    screen: "ww:saldo",
    listScreen: "ww:saldo",
    title: "Saldo de Estoque",
    geneXusPanel: "trnsprodutosSaldoWW",
    breadcrumbSection: "Estoque",
    apiPath: "/api/estoque/saldo",
    listOnly: true,
    defaultSort: { orderBy: "prodDescricao", orderDir: "asc" },
    rowKey: (r) => String(r.prodCodigo),
    linkColumn: "prodDescricao",
    columns: [
      { key: "prodCodigo", label: "Código", sortKey: "prodCodigo" },
      { key: "prodGrupdescricao", label: "Tipo", sortKey: "prodGrupdescricao" },
      { key: "prodDescricao", label: "Descrição", sortKey: "prodDescricao", defaultSort: true },
      { key: "uniDescricao", label: "Unidade (Compra)", sortKey: "uniDescricao" },
      { key: "prodSaldo", label: "Saldo", sortKey: "prodSaldo", format: "decimal" },
    ],
    filterFields: [{ key: "q", label: "Descrição / Código", input: "text", placeholder: "Contém…" }],
    rowActions: [{ id: "saldo-imprimir", icon: "fa-print", title: "Imprimir relatório de saldo" }],
  },

  "apuracao-entrada-saida": {
    id: "apuracao-entrada-saida",
    screen: "ww:apuracao-entrada-saida",
    listScreen: "ww:apuracao-entrada-saida",
    title: "Apuração de Entrada e Saída",
    geneXusPanel: "WPApuracaoEntradaSaidaProdutos",
    breadcrumbSection: "Estoque",
    pageType: "custom",
    customPage: "apuracao",
  },

  "monitoramento-estoque-ue": {
    id: "monitoramento-estoque-ue",
    screen: "ww:monitoramento-estoque-ue",
    listScreen: "ww:monitoramento-estoque-ue",
    title: "Monitoramento de Estoque das UE",
    geneXusPanel: "WPMonitorarLancamentoUE",
    breadcrumbSection: "Estoque",
    pageType: "custom",
    customPage: "monitoramento-ue",
  },

  "rel-compras": {
    id: "rel-compras",
    screen: "ww:rel-compras",
    listScreen: "ww:rel-compras",
    title: "Relatório de Compras",
    geneXusPanel: "WPRelatorioCompras",
    breadcrumbSection: "Relatórios",
    pageType: "custom",
    customPage: "relatorio",
    relatorioId: "rel-compras",
  },

  "rel-dist-ue": {
    id: "rel-dist-ue",
    screen: "ww:rel-dist-ue",
    listScreen: "ww:rel-dist-ue",
    title: "Distribuição por UE",
    geneXusPanel: "WPRelatorioDistribuicao",
    breadcrumbSection: "Relatórios",
    pageType: "custom",
    customPage: "relatorio",
    relatorioId: "rel-dist-ue",
  },

  "rel-dist-rota": {
    id: "rel-dist-rota",
    screen: "ww:rel-dist-rota",
    listScreen: "ww:rel-dist-rota",
    title: "Distribuição por Rota",
    geneXusPanel: "WPRelatorioDistribuicaoProduto",
    breadcrumbSection: "Relatórios",
    pageType: "custom",
    customPage: "relatorio",
    relatorioId: "rel-dist-rota",
  },

  "rel-entradas-saidas-ue": {
    id: "rel-entradas-saidas-ue",
    screen: "ww:rel-entradas-saidas-ue",
    listScreen: "ww:rel-entradas-saidas-ue",
    title: "Entradas e Saídas nas UE",
    geneXusPanel: "WPOpcaoImpressaoUE",
    breadcrumbSection: "Relatórios",
    pageType: "custom",
    customPage: "relatorio",
    relatorioId: "rel-entradas-saidas-ue",
  },

  "gam-usuarios": {
    id: "gam-usuarios",
    screen: "ww:gam-usuarios",
    listScreen: "ww:gam-usuarios",
    title: "Usuários",
    geneXusPanel: "GAMWWUsers",
    geneXusParent: "GAM_Users",
    editTransaction: "GAMUserEntry",
    breadcrumbSection: "Administração",
    apiPath: "/api/admin/gam/users",
    pageType: "custom",
    customPage: "gam-user",
    defaultSort: { orderBy: "UserName", orderDir: "asc" },
    rowKey: (r) => r.UserGUID?.trim() || r.UserName || "",
    editId: (r) => r.UserGUID,
    linkColumn: "UserName",
    columns: [
      { key: "UserName", label: "Login", sortKey: "UserName", defaultSort: true },
      { key: "UserEMail", label: "E-mail", sortKey: "UserEMail" },
      { key: "UserFirstName", label: "Nome", sortKey: "UserFirstName" },
      { key: "UserLastName", label: "Sobrenome", sortKey: "UserLastName" },
      { key: "AuthenticationTypeName", label: "Autenticação", sortKey: "AuthenticationTypeName" },
      { key: "Status", label: "Situação", sortKey: "Status", format: "status" },
    ],
    filterFields: [
      { key: "q", label: "Login / Nome / E-mail", input: "text", placeholder: "Contém…" },
      { key: "status", label: "Situação", input: "status" },
    ],
    statusField: "Status",
  },

  "gam-perfis": {
    id: "gam-perfis",
    screen: "ww:gam-perfis",
    listScreen: "ww:gam-perfis",
    title: "Perfis",
    geneXusPanel: "GAMWWRoles",
    geneXusParent: "GAM_Roles",
    editTransaction: "GAMRoleEntry",
    breadcrumbSection: "Administração",
    apiPath: "/api/admin/gam/roles",
    defaultSort: { orderBy: "RoleName", orderDir: "asc" },
    rowKey: (r) => String(r.RoleId ?? r.RoleGUID ?? ""),
    editId: (r) => String(r.RoleId),
    linkColumn: "RoleName",
    columns: [
      { key: "RoleId", label: "Código", sortKey: "RoleId" },
      { key: "RoleName", label: "Nome", sortKey: "RoleName", defaultSort: true },
      { key: "RoleDsc", label: "Descrição", sortKey: "RoleDsc" },
    ],
    filterFields: [{ key: "q", label: "Nome / Descrição", input: "text", placeholder: "Contém…" }],
  },

  fornecedores: {
    id: "fornecedores",
    screen: "ww:fornecedores",
    listScreen: "ww:fornecedores",
    title: "Listagem de Fornecedores",
    geneXusPanel: "trnsfornecedoresWW",
    geneXusParent: "WorkWithPlustrnsfornecedores",
    editTransaction: "trnsfornecedores",
    breadcrumbSection: "Cadastro",
    apiPath: "/api/logistica/fornecedores",
    defaultSort: { orderBy: "forNome", orderDir: "asc" },
    rowKey: (r) => String(r.forCodigo),
    editId: (r) => String(r.forCodigo),
    linkColumn: "forNome",
    columns: [
      { key: "forCodigo", label: "Código", sortKey: "forCodigo", hidden: true },
      { key: "forNome", label: "Nome", sortKey: "forNome", defaultSort: true },
      { key: "forContato", label: "Contato", sortKey: "forContato" },
      { key: "forCnpjcpf", label: "CNPJ ou CPF", sortKey: "forCnpjcpf" },
      { key: "forCidade", label: "Cidade", sortKey: "forCidade" },
      { key: "forEstado", label: "UF", sortKey: "forEstado" },
      { key: "forTelefone", label: "Telefone", sortKey: "forTelefone" },
      { key: "forEmail", label: "E-mail", sortKey: "forEmail" },
      { key: "forStatus", label: "Situação", sortKey: "forStatus", format: "status" },
    ],
    filterFields: [
      { key: "q", label: "Nome / Cidade / Código", input: "text", placeholder: "Contém…" },
      { key: "status", label: "Situação", input: "status" },
    ],
    statusField: "forStatus",
  },

  "tipos-distribuicao": {
    id: "tipos-distribuicao",
    screen: "ww:tipos-distribuicao",
    listScreen: "ww:tipos-distribuicao",
    title: "Tipo de Distribuição",
    geneXusPanel: "trnsdistribuicaotipoWW",
    geneXusParent: "WorkWithPlustrnsdistribuicaotipo",
    editTransaction: "trnsdistribuicaotipo",
    breadcrumbSection: "Logística",
    apiPath: "/api/logistica/tipos-distribuicao",
    defaultSort: { orderBy: "disTipDescricao", orderDir: "asc" },
    rowKey: (r) => String(r.disTipNumero),
    editId: (r) => String(r.disTipNumero),
    linkColumn: "disTipDescricao",
    columns: [
      { key: "disTipNumero", label: "ID", sortKey: "disTipNumero" },
      { key: "disTipCodigo", label: "Código", sortKey: "disTipCodigo" },
      { key: "disTipDescricao", label: "Descrição", sortKey: "disTipDescricao", defaultSort: true },
      { key: "disTipDias", label: "Dias", sortKey: "disTipDias" },
      { key: "disTipSemanas", label: "Semanas", sortKey: "disTipSemanas" },
      { key: "disTipRemessaMes", label: "Remessas/mês", sortKey: "disTipRemessaMes" },
      { key: "disTipStatus", label: "Situação", sortKey: "disTipStatus", format: "status" },
    ],
    filterFields: [
      { key: "q", label: "Descrição / ID", input: "text", placeholder: "Contém…" },
      { key: "status", label: "Situação", input: "status" },
    ],
    statusField: "disTipStatus",
  },

  rotas: {
    id: "rotas",
    screen: "ww:rotas",
    listScreen: "ww:rotas",
    title: "Rotas",
    geneXusPanel: "trnsrotaWW",
    geneXusParent: "WorkWithPlustrnsrota",
    editTransaction: "trnsrota",
    breadcrumbSection: "Cadastro",
    apiPath: "/api/logistica/rotas",
    defaultSort: { orderBy: "rotaDescricao", orderDir: "asc" },
    rowKey: (r) => String(r.rotaCodigo),
    editId: (r) => String(r.rotaCodigo),
    linkColumn: "rotaDescricao",
    columns: [
      { key: "rotaCodigo", label: "Código", sortKey: "rotaCodigo" },
      { key: "rotaDescricao", label: "Descrição", sortKey: "rotaDescricao", defaultSort: true },
      { key: "rotaSetor", label: "Setor", sortKey: "rotaSetor" },
      { key: "rotaStatus", label: "Situação", sortKey: "rotaStatus", format: "status" },
    ],
    filterFields: [
      { key: "q", label: "Descrição / Código", input: "text", placeholder: "Contém…" },
      { key: "status", label: "Situação", input: "status" },
    ],
    statusField: "rotaStatus",
  },

  compras: {
    id: "compras",
    screen: "ww:compras",
    listScreen: "ww:compras",
    title: "Compras",
    geneXusPanel: "trnsnotaWW",
    geneXusParent: "WorkWithPlustrnsnota",
    editTransaction: "trnsnota",
    breadcrumbSection: "Logística",
    apiPath: "/api/logistica/compras",
    defaultSort: { orderBy: "notaData", orderDir: "desc" },
    rowKey: (r) => String(r.notaCodigo),
    editId: (r) => String(r.notaCodigo),
    linkColumn: "notaNumero",
    columns: [
      { key: "notaCodigo", label: "Código", sortKey: "notaCodigo", hidden: true },
      { key: "notaNumero", label: "Nota", sortKey: "notaNumero", defaultSort: true },
      { key: "notaSerie", label: "Série", sortKey: "notaSerie" },
      { key: "notaData", label: "Data", sortKey: "notaData", format: "date" },
      { key: "notaFornecedorNome", label: "Fornecedor", sortKey: "notaFornecedorNome" },
      { key: "notaProgCodigo", label: "Fonte recurso", sortKey: "notaProgCodigo" },
      { key: "notaStatus", label: "Situação", sortKey: "notaStatus", format: "status" },
    ],
    filterFields: [{ key: "q", label: "Nota / Fornecedor", input: "text", placeholder: "Contém…" }],
    statusField: "notaStatus",
    rowActions: [
      { id: "cancelar-nota", icon: "fa-ban", title: "Cancelar Nota", geneXus: "trnsnotaCancelar", when: (r) => r.notaStatus !== "C" },
      { id: "imprimir-nota", icon: "fa-print", title: "Imprimir Nota", geneXus: "PRINTNotaFiscalCompra", when: (r) => r.notaStatus !== "C" },
    ],
  },

  "guia-distribuicao": {
    id: "guia-distribuicao",
    screen: "ww:guia-distribuicao",
    listScreen: "ww:guia-distribuicao",
    title: "Guia de Distribuição",
    geneXusPanel: "trnsdistribuicaoWW",
    editTransaction: "trnsdistribuicao",
    breadcrumbSection: "Logística",
    apiPath: "/api/logistica/distribuicoes",
    defaultSort: { orderBy: "distCodigo", orderDir: "desc" },
    rowKey: (r) => String(r.distCodigo),
    editId: (r) => String(r.distCodigo),
    linkColumn: "distCodigo",
    columns: [
      { key: "distCodigo", label: "Código", sortKey: "distCodigo", defaultSort: true },
      { key: "distRemCodigo", label: "Remessa", sortKey: "distRemCodigo" },
      { key: "distPeriodo", label: "Período", sortKey: "distPeriodo" },
      { key: "distDataEnvio", label: "Envio", sortKey: "distDataEnvio", format: "date" },
      { key: "distLocalDestinoNome", label: "Destino", sortKey: "distLocalDestinoNome" },
      { key: "distDataRecepcao", label: "Recepção", sortKey: "distDataRecepcao", format: "date" },
      { key: "distRecebedor", label: "Recebedor", sortKey: "distRecebedor", format: "recebedorGuia" },
      { key: "distReceber", label: "Recebimento UE", sortKey: "distReceber", format: "map", map: { S: "Recebido", N: "Aguardando" } },
      { key: "distStatus", label: "Situação", sortKey: "distStatus", format: "status" },
    ],
    filterFields: [{ key: "q", label: "Destino / Código", input: "text", placeholder: "Contém…" }],
    statusField: "distStatus",
    rowActions: [
      { id: "dist-cancelar", icon: "fa-ban", title: "Cancelar guia", geneXus: "trnsdistribuicaoCancelar", when: (r) => r.distStatus !== "C" },
      { id: "dist-imprimir", icon: "fa-print", title: "Imprimir guia", geneXus: "PRINTGuiaDistribuicao", when: (r) => r.distStatus !== "C" },
      { id: "dist-imprimir-2via", icon: "fa-print", title: "Imprimir guia simplificada (2 vias)", geneXus: "PRINTGuiaDistribuicao2vias", when: (r) => r.distStatus !== "C" },
    ],
  },

  "distribuicao-produtos": {
    id: "distribuicao-produtos",
    screen: "ww:distribuicao-produtos",
    listScreen: "ww:distribuicao-produtos",
    title: "Distribuição de Produtos",
    geneXusPanel: "trnsdistribuicaoprodutosWW",
    breadcrumbSection: "Logística",
    apiPath: "/api/logistica/distribuicao-produtos",
    listOnly: true,
    defaultSort: { orderBy: "distProdutoDescricao", orderDir: "asc" },
    rowKey: (r) => `${r.distCodigo}-${r.distProdutoCodigo}`,
    linkColumn: "distProdutoDescricao",
    columns: [
      { key: "distProdutoRemessa", label: "Remessa", sortKey: "distProdutoRemessa" },
      { key: "distCodigo", label: "Guia", sortKey: "distCodigo" },
      { key: "distProdutoDistData", label: "Envio", sortKey: "distProdutoDistData", format: "date" },
      { key: "distRota", label: "Rota", sortKey: "distRota", format: "rotaDescricao", rotaKey: "distRotaDescricao" },
      { key: "distProdutoCodigo", label: "Produto", sortKey: "distProdutoCodigo" },
      { key: "distProdutoDescricao", label: "Nome", sortKey: "distProdutoDescricao", defaultSort: true },
      { key: "distProdutoUN", label: "Unidade", sortKey: "distProdutoUN" },
      { key: "distProdutoQuantidade", label: "Quantidade", sortKey: "distProdutoQuantidade", format: "decimal" },
      { key: "distProdutoPesoTotal", label: "Peso Total", sortKey: "distProdutoPesoTotal", format: "decimal" },
      { key: "distProdutoValidade", label: "Validade", sortKey: "distProdutoValidade", format: "date" },
      { key: "distProdutoLote", label: "Lote", sortKey: "distProdutoLote" },
      { key: "distProdutoDisDestino", label: "Local Destino", sortKey: "distProdutoDisDestino" },
      { key: "distProdutoStatus", label: "Situação", sortKey: "distProdutoStatus", format: "distProdutoStatus" },
    ],
    filterFields: [
      { key: "q", label: "Produto / Destino / Guia", input: "text", placeholder: "Contém…" },
      { key: "status", label: "Situação", input: "distProdutoStatus" },
    ],
    statusField: "distProdutoStatus",
    rowActions: [
      { id: "dp-edit-guia", icon: "fa-pen", title: "Alterar guia", geneXus: "trnsdistribuicao", when: (r) => r.distProdutoStatus !== "C" },
      { id: "dp-itens", icon: "fa-list", title: "Itens da Distribuição", geneXus: "trnsdistribuicaoitensWW" },
      { id: "dp-imprimir", icon: "fa-print", title: "Imprimir guia", geneXus: "PRINTGuiaDistribuicao", when: (r) => r.distProdutoStatus !== "C" },
    ],
  },

  romaneio: {
    id: "romaneio",
    screen: "ww:romaneio",
    listScreen: "ww:romaneio",
    title: "Romaneio",
    geneXusPanel: "RomaneioWW",
    geneXusParent: "WorkWithPlusRomaneio",
    editTransaction: "Romaneio",
    breadcrumbSection: "Logística",
    apiPath: "/api/logistica/romaneios",
    defaultSort: { orderBy: "romanData", orderDir: "desc" },
    rowKey: (r) => String(r.romanCodigo),
    editId: (r) => String(r.romanCodigo),
    linkColumn: "romanCodigo",
    columns: [
      { key: "romanCodigo", label: "Número", sortKey: "romanCodigo", defaultSort: true },
      { key: "romanData", label: "Data", sortKey: "romanData", format: "date" },
      { key: "forNome", label: "Fornecedor", sortKey: "forNome" },
      { key: "romanLocal", label: "Local estoque", sortKey: "romanLocal" },
      { key: "notaNumero", label: "Nota", sortKey: "notaNumero" },
    ],
    filterFields: [{ key: "q", label: "Fornecedor / Número", input: "text", placeholder: "Contém…" }],
  },

  cronograma: {
    id: "cronograma",
    screen: "ww:cronograma",
    listScreen: "ww:cronograma",
    title: "Cronograma de Entrega de Produtos",
    geneXusPanel: "trnscronogramaWW",
    geneXusParent: "WorkWithPlustrnscronograma",
    editTransaction: "trnscronograma",
    breadcrumbSection: "Logística",
    apiPath: "/api/logistica/cronograma",
    defaultSort: { orderBy: "croDtInicial", orderDir: "desc" },
    rowKey: (r) => String(r.croCodigo),
    editId: (r) => String(r.croCodigo),
    linkColumn: "croCodigo",
    statusField: "croStatus",
    statusTabs: [
      ["todos", "Todos"],
      ["A", "Ativos"],
      ["I", "Inativos"],
      ["C", "Duplicados"],
      ["R", "Remessa s/ baixa"],
    ],
    columns: [
      { key: "croCodigo", label: "Código", sortKey: "croCodigo", defaultSort: true },
      { key: "forNome", label: "Fornecedor", sortKey: "forNome" },
      { key: "prodDescricao", label: "Produto", sortKey: "prodDescricao" },
      { key: "croTotal", label: "Total", sortKey: "croTotal", format: "decimal" },
      { key: "croDtInicial", label: "Dt Inicial", sortKey: "croDtInicial", format: "date" },
      { key: "croDtFinal", label: "Dt Final", sortKey: "croDtFinal", format: "date" },
      { key: "croTipoRemessaDesc", label: "Tipo Distribuição", sortKey: "croTipoRemessa" },
      { key: "croRemessa", label: "Última Remessa", sortKey: "croRemessa" },
      { key: "croStatus", label: "Status", sortKey: "croStatus", format: "croStatus" },
    ],
    filterFields: [
      { key: "q", label: "Fornecedor / Produto / Código", input: "text", placeholder: "Contém…" },
      { key: "croStatus", label: "Status", input: "croStatus" },
    ],
    rowActions: [
      { id: "cro-locais", icon: "fa-school", title: "Grades", geneXus: "trnscronogramalocalWW" },
      { id: "cro-gera-remessa", icon: "fa-truck", title: "Gerar Remessa", geneXus: "GerarRemessaCronograma" },
      { id: "cro-duplicar", icon: "fa-copy", title: "Clonar o cronograma", geneXus: "PRCDDuplicarCronograma", confirm: "Deseja realmente duplicar o cronograma?" },
      { id: "cro-imprimir", icon: "fa-print", title: "Imprimir Cronograma", geneXus: "PRINTCronograma" },
      { id: "cro-imprimir-2via", icon: "fa-print", title: "2 guias em uma folha", geneXus: "PRINTCronograma2via" },
      { id: "cro-imprimir-diario", icon: "fa-calendar-alt", title: "Imprimir Dia/Horário", geneXus: "PRINTCronogramaDiaHora" },
    ],
  },

  remessa: {
    id: "remessa",
    screen: "ww:remessa",
    listScreen: "ww:remessa",
    title: "Remessa",
    geneXusPanel: "WizardRemessa",
    breadcrumbSection: "Logística",
    pageType: "custom",
    customPage: "remessa",
  },

  "cancelamento-remessa": {
    id: "cancelamento-remessa",
    screen: "ww:cancelamento-remessa",
    listScreen: "ww:cancelamento-remessa",
    title: "Cancelamento de Remessa",
    geneXusPanel: "WPCancelamentoRemessa",
    breadcrumbSection: "Logística",
    pageType: "custom",
    customPage: "cancelamento-remessa",
  },

  largada: {
    id: "largada",
    screen: "ww:largada",
    listScreen: "ww:largada",
    title: "Largada",
    geneXusPanel: "WPLargada",
    breadcrumbSection: "Logística",
    pageType: "custom",
    customPage: "largada",
  },

  "rancho-assistente": {
    id: "rancho-assistente",
    screen: "ww:rancho-assistente",
    listScreen: "ww:rancho-assistente",
    title: "Rancho Assistente",
    geneXusPanel: "WizardRanchoPlanilha",
    breadcrumbSection: "Logística",
    pageType: "custom",
    customPage: "rancho-assistente",
  },

  "rancho-percapta": {
    id: "rancho-percapta",
    screen: "ww:rancho-percapta",
    listScreen: "ww:rancho-percapta",
    title: "Rancho PerCapta",
    geneXusPanel: "AjustePerCaptas",
    breadcrumbSection: "Logística",
    pageType: "custom",
    customPage: "rancho-percapta",
  },

  "rancho-fixo": {
    id: "rancho-fixo",
    screen: "ww:rancho-fixo",
    listScreen: "ww:rancho-fixo",
    title: "Rancho Fixo",
    geneXusPanel: "WizardRanchoFixo",
    breadcrumbSection: "Logística",
    pageType: "custom",
    customPage: "rancho-fixo",
  },

  prefeituras: {
    id: "prefeituras",
    screen: "ww:prefeituras",
    listScreen: "ww:prefeituras",
    title: "Prefeitura",
    geneXusPanel: "trnsprefeiturasWW",
    editTransaction: "trnsprefeituras",
    breadcrumbSection: "Administração",
    apiPath: "/api/admin/prefeituras",
    defaultSort: { orderBy: "prefNome", orderDir: "asc" },
    rowKey: (r) => String(r.prefCodigo),
    editId: (r) => String(r.prefCodigo),
    linkColumn: "prefNome",
    columns: [
      { key: "prefCodigo", label: "Código", sortKey: "prefCodigo" },
      { key: "prefNome", label: "Nome", sortKey: "prefNome", defaultSort: true },
      { key: "prefCNPJ", label: "CNPJ", sortKey: "prefCNPJ" },
      { key: "PrefMunicipio", label: "Município", sortKey: "PrefMunicipio" },
      { key: "prefEstado", label: "UF", sortKey: "prefEstado" },
      { key: "prefTelefone", label: "Telefone", sortKey: "prefTelefone" },
      { key: "prefContato", label: "Contato", sortKey: "prefContato" },
      { key: "prefStatus", label: "Situação", sortKey: "prefStatus", format: "status" },
    ],
    filterFields: [
      { key: "q", label: "Código / Nome / Município / CNPJ", input: "text", placeholder: "Contém…" },
      { key: "status", label: "Situação", input: "status" },
    ],
    statusField: "prefStatus",
  },
};

export function getWwModuleByScreen(screen) {
  if (!screen?.startsWith("ww:")) return null;
  const rest = screen.slice(3);
  const id = rest.split("?")[0];
  return WW_MODULES[id] ?? null;
}

/** Parâmetros de listagem embutidos na tela (ex.: ww:atendimentos?carGruCodigo=3). */
export function parseWwListParams(screen) {
  if (!screen?.startsWith("ww:")) return {};
  const rest = screen.slice(3);
  const qIdx = rest.indexOf("?");
  if (qIdx < 0) return {};
  const params = {};
  for (const [k, v] of new URLSearchParams(rest.slice(qIdx + 1))) {
    if (v) params[k] = v;
  }
  return params;
}

export function wwListScreen(moduleId, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return qs ? `ww:${moduleId}?${qs}` : `ww:${moduleId}`;
}

export function getWwModuleById(id) {
  return WW_MODULES[id] ?? null;
}

export function parseWwFormScreen(screen) {
  if (!screen?.startsWith("ww-form:")) return null;
  const parts = screen.slice("ww-form:".length).split(":");
  if (parts.length < 2) return null;
  const moduleId = parts[0];
  const TAB_SUFFIXES = new Set(["dados", "pratos", "areas"]);
  if (parts[1] === "novo") return { moduleId, isNew: true };
  if (parts.length >= 3 && TAB_SUFFIXES.has(parts[2])) {
    return { moduleId, isNew: false, recordId: parts[1], initialTab: parts[2] };
  }
  const recordId = parts.slice(1).join(":");
  return { moduleId, isNew: false, recordId };
}

export function wwFormScreen(moduleId, recordId, initialTab) {
  if (initialTab) return `ww-form:${moduleId}:${recordId}:${initialTab}`;
  return `ww-form:${moduleId}:${recordId}`;
}

/** Chave estável e única para linhas da grade (evita colisão entre módulos e valores vazios). */
export function getWwRowKey(module, row, index = 0) {
  let id = module?.rowKey?.(row);
  const raw = id === undefined || id === null ? "" : String(id).trim();
  const invalid =
    !raw ||
    raw === "undefined" ||
    raw === "null" ||
    raw === "undefined-undefined" ||
    raw === "|" ||
    raw.startsWith("undefined") ||
    raw.endsWith("-undefined") ||
    raw.startsWith("-");
  if (invalid) {
    id = `idx-${index}`;
  } else {
    id = raw;
  }
  return `${module?.id ?? "ww"}:${id}:${index}`;
}

export function getWwSortKeys(module) {
  return new Set(module.columns.map((c) => c.sortKey).filter(Boolean));
}

export function normalizeWwSort(module, sort) {
  const keys = getWwSortKeys(module);
  const def = module.defaultSort;
  if (!sort?.orderBy || !keys.has(sort.orderBy)) {
    return { ...def };
  }
  return {
    orderBy: sort.orderBy,
    orderDir: sort.orderDir === "desc" ? "desc" : "asc",
  };
}

const DIST_PRODUTO_STATUS = { A: "Ativo", I: "Inativo", C: "Cancelada" };
const CRO_STATUS_MAP = {
  A: "Ativo",
  I: "Inativo",
  C: "Duplicado",
  D: "Distribuição",
  R: "Remessa sem baixa de estoque",
};
const PERIODO_REFEICAO_MAP = { M: "Matutino", T: "Tarde", N: "Noturno" };
const ACAO_AJUSTE_MAP = { E: "Entrada", S: "Saída" };

export function isGeneXusEmptyDate(value) {
  if (value === null || value === undefined || value === "") return true;
  const s = String(value).slice(0, 10);
  return s.startsWith("1000-");
}

export function formatWwCell(column, row, statusMap) {
  const raw = row[column.key];
  if (column.format === "locTipoUnidade") {
    return formatLocTipoUnidade(raw);
  }
  if (column.format === "rotaDescricao") {
    const desc = row[column.rotaKey || "locRotaDescricao"] ?? row.distRotaDescricao;
    if (desc && String(desc) !== String(raw)) return desc;
    if (raw === null || raw === undefined || raw === "" || Number(raw) === 0) return "—";
    return String(raw);
  }
  if (column.format === "recebedorGuia") {
    if (isGeneXusEmptyDate(row.distDataRecepcao)) return "";
    if (raw === null || raw === undefined || raw === "") return "—";
    return raw;
  }
  if (column.format === "distProdutoStatus") {
    if (!raw) return "—";
    return DIST_PRODUTO_STATUS[String(raw)] ?? String(raw);
  }
  if (column.format === "croStatus") {
    if (!raw) return "—";
    return CRO_STATUS_MAP[String(raw)] ?? String(raw);
  }
  if (column.format === "status") {
    const st = statusMap[raw] || statusMap.I;
    return st?.label ?? raw ?? "—";
  }
  if (column.format === "sn") {
    if (raw === "S") return "Sim";
    if (raw === "N") return "Não";
    if (raw === null || raw === undefined || raw === "") return "—";
    return String(raw);
  }
  if (column.format === "decimal") {
    const n = Number(raw);
    if (Number.isNaN(n)) return raw ?? "—";
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
  }
  if (column.format === "date") {
    if (isGeneXusEmptyDate(raw)) return "";
    if (!raw) return "—";
    const formatted = formatDateBr(raw);
    return formatted || "—";
  }
  if (column.format === "currency") {
    return formatCurrencyBr(raw);
  }
  if (column.format === "map" && column.map) {
    if (raw === null || raw === undefined || raw === "") return "—";
    return column.map[String(raw)] ?? String(raw);
  }
  if (column.format === "periodoRefeicao") {
    if (!raw) return "—";
    return PERIODO_REFEICAO_MAP[String(raw)] ?? String(raw);
  }
  if (column.format === "acaoAjuste") {
    if (!raw) return "—";
    return ACAO_AJUSTE_MAP[String(raw)] ?? String(raw);
  }
  if (column.format === "prodSaldoPosicao") {
    const n = Number(raw);
    const formatted = Number.isNaN(n) ? (raw ?? "—") : n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
    const sit = row.prodSaldoSituacao;
    if (sit === "excesso") return `${formatted} (Em Excesso)`;
    if (sit === "falta") return `${formatted} (Em Falta)`;
    return formatted;
  }
  if (raw === null || raw === undefined || raw === "") return "—";
  return raw;
}

function buildFilterParams(module, field, value, statusTab) {
  const params = {};
  const v = String(value ?? "").trim();
  const statusField = module.statusField;

  if (field === "q" && v) params.q = v;
  else if (field === statusField && v) params.status = v;
  else if (field === "status" && v) params.status = v;
  else if (field === "uniDescricao" && v) params.q = v;
  else if (v && field !== statusField) params[field] = v;

  if (statusTab === "ativo" && statusField) params.status = "A";
  else if (statusTab === "inativo" && statusField) params.status = "I";
  else if (statusTab && statusTab !== "todos" && statusField && module.statusTabs) {
    params.status = statusTab;
  }

  return params;
}

export { buildFilterParams as buildWwFilterParams };
