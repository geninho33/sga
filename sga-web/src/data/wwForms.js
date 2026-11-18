import { STATUS_OPTIONS } from "./produtoForm";
import { LOC_TIPO_UNIDADE_OPTIONS } from "./logisticaCatalog";

const ACAO_AJUSTE_OPTIONS = [
  { value: "E", label: "Entrada" },
  { value: "S", label: "Saída" },
];

const UF_OPTIONS = [
  { value: "", label: "Selecione…" },
  ..."AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO"
    .split(" ")
    .map((uf) => ({ value: uf, label: uf })),
];

/** Formulários das transactions GeneXus (objeto aberto no Alterar do WW). */
export const WW_FORM_CONFIGS = {
  unidades: {
    transaction: "trnsunidades",
    editObject: "trnsunidades",
    apiPath: "/api/cadastro/unidades",
    idField: "uniCodigo",
    requiredFields: ["uniDescricao"],
    defaultValues: { uniStatus: "A", uniFracao: "" },
    fields: [
      { key: "uniCodigo", label: "Código", type: "number", readOnly: true },
      { key: "uniDescricao", label: "Descrição", type: "text", required: true },
      { key: "uniFracao", label: "Fração", type: "text" },
      { key: "uniStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  "conv-qtdes": {
    transaction: "trnsconvqtde",
    editObject: "trnsconvqtde",
    apiPath: "/api/cadastro/conv-qtdes",
    compositeId: true,
    idFields: ["uniConvUnidadeOrigem", "uniConvUnidadeDestino"],
    requiredFields: ["uniConvUnidadeOrigem", "uniConvUnidadeDestino", "uniConvQtdeGerar"],
    defaultValues: { uniConvStatus: "A", uniConvQtdeGerar: 0 },
    fields: [
      { key: "uniConvUnidadeOrigem", label: "Unidade origem", type: "lookup", lookup: "unidade", required: true, readOnlyOnEdit: true },
      { key: "uniConvUnidadeDestino", label: "Unidade destino", type: "lookup", lookup: "unidade", required: true, readOnlyOnEdit: true },
      { key: "uniConvQtdeGerar", label: "Qtde a gerar", type: "decimal", required: true },
      { key: "uniConvStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  locais: {
    transaction: "trnslocal",
    editObject: "trnslocal",
    apiPath: "/api/cadastro/locais",
    idField: "locCodigo",
    requiredFields: ["locDescricao"],
    defaultValues: { locStatus: "A", locForno: "N", locFreezer: "N" },
    sections: [
      {
        title: "Identificação",
        fields: [
          { key: "locCodigo", label: "Código", type: "number", readOnly: true },
          { key: "locDescricao", label: "Descrição", type: "text", required: true },
          { key: "locInep", label: "Código INEP", type: "text" },
          { key: "locAbreviatura", label: "Abreviatura", type: "text" },
          { key: "locTipoUnidade", label: "Tipo unidade", type: "select", options: [{ value: "", label: "Selecione…" }, ...LOC_TIPO_UNIDADE_OPTIONS] },
          { key: "locStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
        ],
      },
      {
        title: "Endereço e contato",
        fields: [
          { key: "locEndereco", label: "Endereço", type: "text" },
          { key: "locComplemento", label: "Complemento", type: "text" },
          { key: "locBairro", label: "Bairro", type: "text" },
          { key: "locCep", label: "CEP", type: "text" },
          { key: "locTelefone", label: "Telefone", type: "text" },
          { key: "locEmail", label: "E-mail", type: "text" },
        ],
      },
      {
        title: "Cozinha e logística",
        fields: [
          { key: "locForno", label: "Tem forno", type: "select", options: [{ value: "S", label: "Sim" }, { value: "N", label: "Não" }] },
          { key: "locFreezer", label: "Tem freezer", type: "select", options: [{ value: "S", label: "Sim" }, { value: "N", label: "Não" }] },
          { key: "locNota", label: "Rota", type: "lookup", lookup: "rotasLogistica" },
          { key: "locUeCod", label: "Código SGE", type: "text" },
          { key: "locVinculada", label: "Unidade vinculada", type: "number" },
        ],
      },
      {
        title: "Login da unidade escolar",
        fields: [
          { key: "locUsuario", label: "Usuário", type: "text" },
          { key: "locSenha", label: "Senha", type: "password" },
        ],
      },
    ],
    fields: [],
  },

  doencas: {
    transaction: "trnsdoencas",
    editObject: "trnsdoencas",
    apiPath: "/api/cadastro/doencas",
    idField: "doenCodigo",
    requiredFields: ["doenDescricao"],
    defaultValues: { doenStatus: "A", doenOrdem: 0 },
    fields: [
      { key: "doenCodigo", label: "Código", type: "number", readOnly: true },
      { key: "doenDescricao", label: "Descrição", type: "text", required: true },
      { key: "doenStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  "tipos-ajuste": {
    transaction: "TipoAjuste",
    editObject: "TipoAjuste",
    apiPath: "/api/cadastro/tipos-ajuste",
    idField: "tipajuCodigo",
    requiredFields: ["tipajuNome", "tipajuSigla"],
    defaultValues: { tipajuAcao: "E" },
    fields: [
      { key: "tipajuCodigo", label: "Ajuste", type: "number", readOnly: true },
      { key: "tipajuNome", label: "Nome", type: "text", required: true },
      { key: "tipajuSigla", label: "Sigla", type: "text", required: true },
      { key: "tipajuAcao", label: "Ação", type: "select", options: ACAO_AJUSTE_OPTIONS },
    ],
  },

  pratos: {
    transaction: "trnspratos",
    apiPath: "/api/preparacao/pratos",
    idField: "pratoCodigo",
    requiredFields: ["pratoDscricao"],
    defaultValues: { pratoStatus: "A", pratoComFreezer: "N", pratoSemFreezer: "N", pratoForno: "N", pratoRepeticao: "N", pratoCozinhaCentral: "N" },
    fields: [
      { key: "pratoCodigo", label: "Código", type: "number", readOnly: true },
      { key: "pratoDscricao", label: "Descrição", type: "text", required: true },
      { key: "pratoTipoRefeicao", label: "Turno", type: "lookup", lookup: "tiposRefeicao" },
      { key: "pratoComFreezer", label: "Com freezer", type: "select", options: [{ value: "S", label: "Sim" }, { value: "N", label: "Não" }] },
      { key: "pratoSemFreezer", label: "Sem freezer", type: "select", options: [{ value: "S", label: "Sim" }, { value: "N", label: "Não" }] },
      { key: "pratoForno", label: "Forno", type: "select", options: [{ value: "S", label: "Sim" }, { value: "N", label: "Não" }] },
      { key: "pratoCozinhaCentral", label: "Cozinha central", type: "select", options: [{ value: "S", label: "Sim" }, { value: "N", label: "Não" }] },
      { key: "pratoModoDeFazer", label: "Modo de fazer", type: "textarea" },
      { key: "pratoStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  "tipos-refeicao": {
    transaction: "trnsrefeicaotipo",
    apiPath: "/api/preparacao/tipos-refeicao",
    idField: "refTipCodigo",
    requiredFields: ["refTipDescricao"],
    defaultValues: { refTipstatus: "A", refTipperiodo: "M" },
    fields: [
      { key: "refTipCodigo", label: "Código", type: "number", readOnly: true },
      { key: "refTipDescricao", label: "Descrição", type: "text", required: true },
      { key: "refTipHorario", label: "Horário 1", type: "time" },
      { key: "refTipHorario2", label: "Horário 2", type: "time" },
      { key: "refTipAbreviatura", label: "Abreviatura", type: "text" },
      { key: "refTipperiodo", label: "Período", type: "select", options: [
        { value: "M", label: "Matutino" },
        { value: "T", label: "Tarde" },
        { value: "N", label: "Noturno" },
      ] },
      { key: "refTipstatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  cardapios: {
    transaction: "trnscardapio",
    apiPath: "/api/preparacao/cardapios",
    idField: "carDapCodigo",
    customForm: "cardapio",
    requiredFields: ["carDapDescricao"],
    defaultValues: { carDapStatus: "A", carDapLiberarAcesso: "N" },
    fields: [
      { key: "carDapCodigo", label: "Código", type: "number", readOnly: true },
      { key: "carDapDescricao", label: "Descrição", type: "text", required: true },
      { key: "carDapMesAno", label: "Mês/Ano", type: "date" },
      { key: "carDapGruCodigo", label: "Grupo cardápio", type: "lookup", lookup: "cardapioGrupos" },
      { key: "carDapNecessidade", label: "Necessidade", type: "number" },
      { key: "carDapLiberarAcesso", label: "Liberar acesso", type: "select", options: [{ value: "S", label: "Sim" }, { value: "N", label: "Não" }] },
      { key: "carDapStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  "cardapio-grupos": {
    transaction: "trnscardapiogrupo",
    apiPath: "/api/preparacao/cardapio-grupos",
    idField: "carGruCodigo",
    customForm: "cardapio-grupo",
    requiredFields: ["carGruDescricao"],
    defaultValues: { carGruStatus: "A", carGruCozinhaCentral: "N" },
    fields: [
      { key: "carGruCodigo", label: "Código", type: "number", readOnly: true },
      { key: "carGruDescricao", label: "Descrição", type: "text", required: true },
      { key: "carGruCozinhaCentral", label: "Cozinha central", type: "select", options: [{ value: "S", label: "Sim" }, { value: "N", label: "Não" }] },
      { key: "carGruNutricionista", label: "Nutricionista", type: "lookup", lookup: "nutricionistas" },
      { key: "carGruStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  atendimentos: {
    transaction: "Atendimento",
    apiPath: "/api/preparacao/atendimentos",
    idField: "AtendimentoCodigo",
    requiredFields: ["locCodigo"],
    defaultValues: { AtendimentoStatus: "A" },
    sections: [
      {
        title: "Identificação",
        fields: [
          { key: "AtendimentoCodigo", label: "Código", type: "number", readOnly: true },
          { key: "locCodigo", label: "Local", type: "lookup", lookup: "locais", required: true },
          { key: "carGruCodigo", label: "Grupo de Cardápio", type: "lookup", lookup: "cardapioGrupos" },
          { key: "AreEnsCodigo", label: "Área de Ensino", type: "lookup", lookup: "areasEnsino" },
          { key: "AreEnsSequencial", label: "Etapa", type: "lookup", lookup: "etapasEnsino" },
          { key: "AtendimentoTurno", label: "Turno", type: "lookup", lookup: "tiposRefeicao" },
          { key: "AtendimentoStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
        ],
      },
    ],
    fields: [],
  },

  "calendario-letivo": {
    transaction: "trnscalendarioletivo",
    apiPath: "/api/preparacao/calendario-letivo",
    compositeId: true,
    compositeSeparator: "|",
    idFields: ["calAno", "calData"],
    requiredFields: ["calAno", "calData", "calDescricao"],
    defaultValues: { calStatus: "A", calDiautil: "S", calFeriado: "N" },
    fields: [
      { key: "calAno", label: "Ano", type: "number", required: true, readOnlyOnEdit: true },
      { key: "calData", label: "Data", type: "date", required: true, readOnlyOnEdit: true },
      { key: "calDescricao", label: "Descrição", type: "text", required: true },
      { key: "calDiautil", label: "Dia útil", type: "select", options: [{ value: "S", label: "Sim" }, { value: "N", label: "Não" }] },
      { key: "calFeriado", label: "Feriado", type: "select", options: [{ value: "S", label: "Sim" }, { value: "N", label: "Não" }] },
      { key: "calStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  ajuste: {
    transaction: "trnsajuste",
    editObject: "trnsajuste",
    apiPath: "/api/estoque/ajustes",
    idField: "ajusCodigo",
    requiredFields: ["tipajuCodigo", "ajusLocaCodigo", "ajusOBS"],
    defaultValues: {},
    sections: [
      {
        title: "Ajuste de Estoque",
        fields: [
          { key: "ajusCodigo", label: "Código", type: "number", readOnly: true },
          { key: "ajusData", label: "Data", type: "date" },
          { key: "tipajuCodigo", label: "Tipo de Ajuste", type: "lookup", lookup: "tiposAjuste", required: true },
          { key: "ajusLocaCodigo", label: "Local", type: "lookup", lookup: "locaisLogistica", required: true },
          { key: "ajusRotaCodigo", label: "Rota", type: "lookup", lookup: "rotasLogistica" },
          { key: "ajusOBS", label: "Justificativa", type: "textarea", required: true },
        ],
      },
    ],
    fields: [],
  },

  "gam-usuarios": {
    transaction: "GAMUserEntry",
    apiPath: "/api/admin/gam/users",
    idField: "UserGUID",
    customPage: true,
  },

  fornecedores: {
    transaction: "trnsfornecedores",
    editObject: "trnsfornecedores",
    apiPath: "/api/logistica/fornecedores",
    idField: "forCodigo",
    requiredFields: ["forNome"],
    defaultValues: { forStatus: "A" },
    sections: [
      {
        title: "Identificação",
        fields: [
          { key: "forCodigo", label: "Código", type: "number", readOnly: true },
          { key: "forNome", label: "Nome", type: "text", required: true, maxLength: 100 },
          { key: "forAbreviatura", label: "Abreviatura", type: "text", maxLength: 30 },
          { key: "forCnpjcpf", label: "CNPJ ou CPF", type: "text", maxLength: 20 },
          { key: "forStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
        ],
      },
      {
        title: "Endereço e contato",
        fields: [
          { key: "forCep", label: "CEP", type: "text", maxLength: 10, mask: "cep", inputMode: "numeric" },
          { key: "forEndereco", label: "Endereço", type: "text", maxLength: 50 },
          { key: "forComplemento", label: "Complemento", type: "text", maxLength: 20 },
          { key: "forBairro", label: "Bairro", type: "text", maxLength: 30 },
          { key: "forCidade", label: "Cidade", type: "text", maxLength: 30 },
          { key: "forEstado", label: "UF", type: "select", options: UF_OPTIONS, maxLength: 2 },
          { key: "forTelefone", label: "Telefone", type: "text", maxLength: 50, mask: "phone", inputMode: "tel" },
          { key: "forContato", label: "Contato", type: "text", maxLength: 20, mask: "contact" },
          { key: "forEmail", label: "E-mail", type: "text", maxLength: 50 },
        ],
      },
    ],
    fields: [],
  },

  "tipos-distribuicao": {
    transaction: "trnsdistribuicaotipo",
    editObject: "trnsdistribuicaotipo",
    apiPath: "/api/logistica/tipos-distribuicao",
    idField: "disTipNumero",
    requiredFields: ["disTipDescricao"],
    defaultValues: { disTipStatus: "A", disTipDias: 0, disTipSemanas: 0, disTipRemessaMes: 0 },
    fields: [
      { key: "disTipNumero", label: "ID", type: "number", readOnly: true },
      { key: "disTipCodigo", label: "Código", type: "text" },
      { key: "disTipDescricao", label: "Descrição", type: "text", required: true },
      { key: "disTipDescricaoPlural", label: "Descrição no plural", type: "text" },
      { key: "disTipDias", label: "Dias", type: "number" },
      { key: "disTipSemanas", label: "Semanas", type: "number" },
      { key: "disTipRemessaMes", label: "Remessas no mês", type: "number" },
      { key: "disTipStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  rotas: {
    transaction: "trnsrota",
    editObject: "trnsrota",
    apiPath: "/api/logistica/rotas",
    idField: "rotaCodigo",
    requiredFields: ["rotaDescricao"],
    defaultValues: { rotaStatus: "A", rotaSetor: 0 },
    fields: [
      { key: "rotaCodigo", label: "Código", type: "number", readOnly: true },
      { key: "rotaDescricao", label: "Descrição", type: "text", required: true },
      { key: "rotaSetor", label: "Setor", type: "number" },
      { key: "rotaStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  compras: {
    transaction: "trnsnota",
    editObject: "trnsnota",
    apiPath: "/api/logistica/compras",
    idField: "notaCodigo",
    requiredFields: ["notaNumero", "notaSerie", "notaData", "notaFornecedor", "notaLocal"],
    defaultValues: { notaStatus: "A", notaProgCodigo: 0 },
    fields: [
      { key: "notaCodigo", label: "Código", type: "number", readOnly: true },
      { key: "notaNumero", label: "Nota", type: "text", required: true },
      { key: "notaSerie", label: "Série", type: "text", required: true },
      { key: "notaData", label: "Data", type: "date", required: true },
      { key: "notaFornecedor", label: "Fornecedor", type: "lookup", lookup: "fornecedores", required: true },
      { key: "notaLocal", label: "Local de destino", type: "lookup", lookup: "locaisLogistica", required: true },
      { key: "notaProgCodigo", label: "Fonte de recurso", type: "number" },
      { key: "notaStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  "guia-distribuicao": {
    transaction: "trnsdistribuicao",
    editObject: "trnsdistribuicao",
    apiPath: "/api/logistica/distribuicoes",
    idField: "distCodigo",
    requiredFields: [],
    fields: [
      { key: "distCodigo", label: "Código", type: "number", readOnly: true },
      { key: "distRemCodigo", label: "Remessa", type: "number", readOnly: true },
      { key: "distPeriodo", label: "Período", type: "text", readOnly: true },
      { key: "distDataEnvio", label: "Data envio", type: "date", readOnly: true },
      { key: "distLocalOrigem", label: "Origem", type: "lookup", lookup: "locaisLogistica", readOnly: true },
      { key: "distLocalDestino", label: "Destino", type: "lookup", lookup: "locaisLogistica", readOnly: true },
      { key: "distDataRecepcao", label: "Data recepção", type: "date" },
      { key: "distRecebedor", label: "Recebedor", type: "text" },
      {
        key: "distReceber",
        label: "Recebimento UE",
        type: "select",
        options: [
          { value: "N", label: "Aguardando" },
          { value: "S", label: "Recebido" },
        ],
      },
      { key: "distObservacao", label: "Observação", type: "text" },
      { key: "distStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value), readOnly: true },
    ],
  },

  romaneio: {
    transaction: "Romaneio",
    editObject: "Romaneio",
    apiPath: "/api/logistica/romaneios",
    idField: "romanCodigo",
    requiredFields: ["romanData", "forCodigo", "romanLocal"],
    defaultValues: {},
    sections: [
      {
        title: null,
        fields: [
          { key: "romanCodigo", label: "Número", type: "number", readOnly: true },
          { key: "romanData", label: "Data", type: "date", required: true },
          { key: "forCodigo", label: "Fornecedor", type: "lookup", lookup: "fornecedores", required: true },
          { key: "romanLocal", label: "Local Estoque", type: "lookup", lookup: "locaisLogistica", required: true },
        ],
      },
      {
        title: "Nota Fiscal de Compra",
        fields: [
          { key: "notaNumero", label: "Nota nº", type: "text", readOnly: true, readOnlyOnEdit: true },
          { key: "notaSerie", label: "Série", type: "text", readOnly: true, readOnlyOnEdit: true },
          { key: "notaData", label: "Data", type: "date", readOnly: true, readOnlyOnEdit: true },
        ],
      },
    ],
    fields: [],
  },

  cronograma: {
    transaction: "trnscronograma",
    editObject: "trnscronograma",
    apiPath: "/api/logistica/cronograma",
    idField: "croCodigo",
    requiredFields: ["forCodigo", "prodCodigo", "croMarca", "croDtInicial", "croDtFinal"],
    defaultValues: { croStatus: "A", croRemessa: 0 },
    fields: [
      { key: "croCodigo", label: "Código", type: "number", readOnly: true, readOnlyOnEdit: true },
      { key: "forCodigo", label: "Fornecedor", type: "lookup", lookup: "fornecedores", required: true },
      { key: "prodCodigo", label: "Produto", type: "lookup", lookup: "produtosLogistica", required: true },
      { key: "croMarca", label: "Marca", type: "text", required: true },
      { key: "croDtInicial", label: "Período de", type: "date", required: true },
      { key: "croDtFinal", label: "Período até", type: "date", required: true },
      { key: "croDtConsumo", label: "Data Consumo", type: "date" },
      { key: "croNumeroNota", label: "Nota", type: "text" },
      { key: "croTipoRemessa", label: "Tipo de Remessa", type: "lookup", lookup: "tiposDistribuicao" },
      { key: "croRemessa", label: "Remessa", type: "number" },
      {
        key: "croStatus",
        label: "Status",
        type: "select",
        options: [
          { value: "A", label: "Ativo" },
          { value: "I", label: "Inativo" },
          { value: "C", label: "Duplicado" },
          { value: "D", label: "Distribuição" },
          { value: "R", label: "Remessa sem baixa de estoque" },
        ],
      },
      { key: "croTotal", label: "Total", type: "number", readOnly: true, readOnlyOnEdit: true },
    ],
  },

  prefeituras: {
    transaction: "trnsprefeituras",
    editObject: "trnsprefeituras",
    apiPath: "/api/admin/prefeituras",
    idField: "prefCodigo",
    requiredFields: ["prefNome"],
    defaultValues: { prefStatus: "A" },
    fields: [
      { key: "prefCodigo", label: "Código", type: "number", readOnly: true },
      { key: "prefLogo", label: "Logomarca", type: "image", imageApiPath: "/api/admin/prefeituras" },
      { key: "prefNome", label: "Nome", type: "text", required: true },
      { key: "prefCNPJ", label: "CNPJ", type: "text" },
      { key: "prefEndereco", label: "Endereço", type: "text" },
      { key: "prefComplemento", label: "Complemento", type: "text" },
      { key: "prefBairro", label: "Bairro", type: "text" },
      { key: "PrefMunicipio", label: "Município", type: "text", required: true },
      { key: "prefCodigoIbge", label: "Código IBGE", type: "text" },
      { key: "prefEstado", label: "UF", type: "text" },
      { key: "prefCep", label: "CEP", type: "text" },
      { key: "prefTelefone", label: "Telefone", type: "text" },
      { key: "prefContato", label: "Contato", type: "text" },
      { key: "prefNomeEmail", label: "Nome do e-mail", type: "text" },
      { key: "prefEmail", label: "E-mail", type: "text" },
      { key: "prefForma_gestao", label: "Forma de gestão", type: "text" },
      { key: "prefTitular", label: "Titular", type: "text" },
      { key: "prefMunCod", label: "Código SGE", type: "number" },
      { key: "prefLocalDeposito", label: "Local depósito", type: "number" },
      { key: "prefStatus", label: "Situação", type: "select", options: STATUS_OPTIONS.filter((o) => o.value) },
    ],
  },

  "gam-perfis": {
    transaction: "GAMRoleEntry",
    apiPath: "/api/admin/gam/roles",
    idField: "RoleId",
    requiredFields: ["RoleName"],
    fields: [
      { key: "RoleId", label: "Código", type: "number", readOnly: true },
      { key: "RoleName", label: "Nome", type: "text", required: true },
      { key: "RoleDsc", label: "Descrição", type: "text" },
    ],
  },
};

export function getWwFormConfig(moduleId) {
  return WW_FORM_CONFIGS[moduleId] ?? null;
}

/** Campos planos (fields + sections[].fields). */
export function getFormFields(config) {
  if (!config) return [];
  if (config.sections?.length) {
    return config.sections.flatMap((s) => s.fields || []);
  }
  return config.fields || [];
}

export function recordToForm(config, row) {
  const form = {};
  for (const field of getFormFields(config)) {
    if (field.type === "image") {
      form[field.key] = row?.hasLogo ? "__EXISTING__" : "";
      continue;
    }
    const v = row?.[field.key];
    if (v === null || v === undefined) form[field.key] = "";
    else if (field.type === "date") form[field.key] = String(v).slice(0, 10);
    else if (field.type === "time") {
      const m = String(v).match(/(\d{1,2}):(\d{2})/);
      form[field.key] = m ? `${String(m[1]).padStart(2, "0")}:${m[2]}` : "";
    } else form[field.key] = String(v);
  }
  return form;
}

export function emptyForm(config) {
  return recordToForm(config, config.defaultValues || {});
}

export function formToPayload(config, form, isNew) {
  const payload = {};
  for (const field of getFormFields(config)) {
    if (!isNew && field.readOnlyOnEdit) continue;
    if (field.insertOnly && !isNew) continue;
    if (field.readOnly && field.key === config.idField && isNew) continue;
    if (field.readOnly && field.key === config.idField) continue;
    const raw = form[field.key];
    if (field.type === "password" && !raw) continue;
    if (field.type === "image") {
      if (raw && raw !== "__EXISTING__") payload[field.key] = raw;
      else if (raw === "") payload[field.key] = "__CLEAR__";
      continue;
    }
    if (field.type === "number" || field.type === "decimal" || field.type === "lookup") {
      payload[field.key] = raw === "" ? null : Number(raw);
    } else if (field.type === "date") {
      payload[field.key] = raw === "" ? null : raw;
    } else if (field.type === "time") {
      payload[field.key] = raw === "" ? null : raw;
    } else {
      payload[field.key] = raw ?? "";
    }
  }
  return payload;
}

export function buildRecordApiPath(config, recordId, isNew) {
  if (config.compositeId && !isNew) {
    const sep = config.compositeSeparator || "-";
    const parts = String(recordId).split(sep);
    if (config.idFields?.length === 2) {
      return `${config.apiPath}/${parts[0]}/${parts[1]}`;
    }
    const [orig, dest] = parts;
    return `${config.apiPath}/${orig}/${dest}`;
  }
  if (isNew) return config.apiPath;
  return `${config.apiPath}/${recordId}`;
}

export function buildCreatedRecordId(moduleId, row, config) {
  if (config.compositeId && config.idFields?.length === 2) {
    const sep = config.compositeSeparator || "-";
    const a = row[config.idFields[0]];
    const b = row[config.idFields[1]];
    const bStr = String(b).slice(0, 10);
    return `${a}${sep}${bStr}`;
  }
  if (config.compositeId) {
    return `${row.uniConvUnidadeOrigem}-${row.uniConvUnidadeDestino}`;
  }
  if (config.idField === "UserGUID") return row.UserGUID;
  return String(row[config.idField]);
}
