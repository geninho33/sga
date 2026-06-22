/**
 * Estrutura do formulário trnsprodutos (WorkWithPlustrnsprodutos).
 * Fonte: WorkWithPlustrnsprodutos.xml / Transaction trnsprodutos
 */

import { PRODUTO_CLASSIFICACAO_OPTIONS } from "./produtosList";

export const PRODUTO_TRANSACTION = "trnsprodutos";

export const PRODUTO_TABS = [
  { id: "dadosGerais", label: "Dados Gerais", icon: "fa-carrot", geneXus: "abaDadosGerais" },
  { id: "composicao", label: "Composição", icon: "fa-heart-pulse", geneXus: "abaComposicao" },
  { id: "outras", label: "Outras Informações", icon: "fa-sliders", geneXus: "abaMedidas" },
  { id: "estoque", label: "Estoque", icon: "fa-boxes-stacked", geneXus: "abaSaldo" },
];

const CLASSIFICACAO_FORM_OPTIONS = PRODUTO_CLASSIFICACAO_OPTIONS.filter((o) => o.value !== "");

export const SN_OPTIONS = [
  { value: "S", label: "Sim" },
  { value: "N", label: "Não" },
];

export const STATUS_OPTIONS = [
  { value: "A", label: "Ativo" },
  { value: "I", label: "Inativo" },
];

/** Metadados por campo (rótulos do GeneXus). */
export const PRODUTO_FIELD_META = {
  prodCodigo: { label: "Código", type: "number", readOnly: true },
  prodDescricao: { label: "Descrição", type: "text", required: true, header: true },
  prodEspecificacao: { label: "Especificação", type: "text" },
  prodTipo: { label: "Tipo", type: "lookup", lookup: "grupo" },
  prodOrigem: { label: "Origem", type: "lookup", lookup: "origem" },
  prodClassificacao: { label: "Classificação", type: "select", options: CLASSIFICACAO_FORM_OPTIONS },
  prodCodigoTipoRemessa: { label: "Remessa", type: "lookup", lookup: "remessa" },
  prodStatus: { label: "Situação", type: "select", options: STATUS_OPTIONS },
  prodTaco: { label: "Aplicar tabela Taco", type: "lookup", lookup: "taco", tacoApply: true },
  prodCaloria: { label: "Calorias", type: "decimal" },
  prodCarboidrato: { label: "Carboidrato", type: "decimal" },
  prodGorduraTrans: { label: "Gordura Trans", type: "decimal" },
  prodGorduraSaturada: { label: "Gordura Saturada", type: "decimal" },
  prodProteina: { label: "Proteína", type: "decimal" },
  prodSal: { label: "Sal", type: "decimal" },
  prodPotassio: { label: "Potássio", type: "decimal" },
  prodCalcio: { label: "Cálcio", type: "decimal" },
  prodFerro: { label: "Ferro", type: "decimal" },
  prodVitaminaA: { label: "Vitamina A", type: "decimal" },
  prodNpcal: { label: "Npcal", type: "decimal" },
  prodNdpcal: { label: "Ndpcal", type: "decimal" },
  prodLipidio: { label: "Lípidio", type: "decimal" },
  prodFibra: { label: "Fibra", type: "decimal" },
  prodVitaminaC: { label: "Vitamina C", type: "decimal" },
  prodMagnesio: { label: "Magnésio", type: "decimal" },
  prodZinco: { label: "Zinco", type: "decimal" },
  prodAcucar: { label: "Açúcar", type: "decimal" },
  prodUnidMedConsumo: { label: "UND Consumo", type: "lookup", lookup: "unidade" },
  prodPesoConsumo: { label: "Peso Consumo", type: "decimal" },
  prodObsConsumo: { label: "UND PESO", type: "text" },
  prodArredConsumo: { label: "Peso para Arredondamento", type: "decimal" },
  prodArredondaOcorrencia: { label: "Arredonda Ocorrência", type: "sn" },
  prodFatorCorrecao: { label: "Fator de Correção", type: "decimal" },
  prodFatorCuccao: { label: "Fator de Cocção", type: "decimal" },
  prodDiasConsumo: { label: "Dias para Consumo", type: "number" },
  prodUnidMedEstocagem: { label: "Und Estocagem", type: "lookup", lookup: "unidade" },
  prodPesoEstocagem: { label: "Peso Estocagem", type: "decimal" },
  prodObsEstocagem: { label: "UND PESO", type: "text" },
  prodFracaoEstocagem: { label: "Fração Estocagem", type: "sn" },
  prodUnidMedCompra: { label: "UND Compra", type: "lookup", lookup: "unidade" },
  prodPesoCompra: { label: "Peso Compra", type: "decimal" },
  prodObsCompra: { label: "UND PESO", type: "text" },
  prodValorunitario: { label: "Valor Unitário", type: "decimal" },
  prodCalculoDifer: { label: "Cálculo Diferenciado", type: "sn" },
  prodEmbalagemCompra: { label: "Embalagem Compra", type: "number" },
  prodQtdeEmbalagemCompra: { label: "QTD EMB. Compra", type: "decimal" },
  prodObsEmbalagem: { label: "Unidade Embalagem", type: "text" },
  prodSaldo: { label: "Estoque Total", type: "decimal", readOnly: true },
  prodPesoEstoque: { label: "Peso Total", type: "decimal", readOnly: true, virtual: true },
  prodQtdeMinimo: { label: "Estoque Mínimo", type: "decimal" },
  prodQtdeMaximo: { label: "Estoque Máximo", type: "decimal" },
};

/** Seções por aba (espelha grupos/painéis do GeneXus). */
export const PRODUTO_FORM_LAYOUT = {
  dadosGerais: [
    { fields: ["prodEspecificacao"] },
    {
      group: "Detalhes",
      columns: 4,
      fields: ["prodTipo", "prodOrigem", "prodClassificacao", "prodCodigoTipoRemessa"],
    },
    { fields: ["prodStatus"] },
  ],
  composicao: [
    { fields: ["prodTaco"], tacoRow: true },
    {
      panel: "Valores por 100g",
      columns: 3,
      fields: [
        "prodCaloria",
        "prodCarboidrato",
        "prodGorduraTrans",
        "prodGorduraSaturada",
        "prodProteina",
        "prodSal",
        "prodPotassio",
        "prodCalcio",
        "prodFerro",
        "prodVitaminaA",
        "prodNpcal",
        "prodNdpcal",
        "prodLipidio",
        "prodFibra",
        "prodVitaminaC",
        "prodMagnesio",
        "prodZinco",
        "prodAcucar",
      ],
    },
  ],
  outras: [
    {
      group: "Consumo",
      fields: [
        "prodUnidMedConsumo",
        "prodPesoConsumo",
        "prodObsConsumo",
        "prodArredConsumo",
        "prodArredondaOcorrencia",
        "prodFatorCorrecao",
        "prodFatorCuccao",
        "prodDiasConsumo",
      ],
    },
    {
      group: "Estocagem",
      fields: ["prodUnidMedEstocagem", "prodPesoEstocagem", "prodObsEstocagem", "prodFracaoEstocagem"],
    },
    {
      group: "Compra",
      fields: [
        "prodUnidMedCompra",
        "prodPesoCompra",
        "prodObsCompra",
        "prodValorunitario",
        "prodCalculoDifer",
      ],
      nested: {
        group: "Embalagem",
        fields: ["prodEmbalagemCompra", "prodQtdeEmbalagemCompra", "prodObsEmbalagem"],
      },
    },
  ],
  estoque: [
    { fields: ["prodSaldo", "prodPesoEstoque"] },
    {
      group: "Limites",
      fields: ["prodQtdeMinimo", "prodQtdeMaximo"],
    },
  ],
};

export const ALL_FORM_FIELDS = [
  ...new Set(
    Object.values(PRODUTO_FORM_LAYOUT)
      .flat()
      .flatMap((section) => {
        const list = [...(section.fields || [])];
        if (section.nested?.fields) list.push(...section.nested.fields);
        return list;
      })
      .concat(["prodCodigo", "prodDescricao"])
  ),
];

const SN_FIELDS = new Set(["prodArredondaOcorrencia", "prodCalculoDifer", "prodFracaoEstocagem"]);
const TEXT_OBS_FIELDS = new Set(["prodObsConsumo", "prodObsCompra", "prodObsEstocagem", "prodObsEmbalagem"]);
const NULLABLE_DECIMALS = new Set(["prodFatorCorrecao", "prodFatorCuccao", "prodDiasConsumo", "prodTaco"]);

function toInputValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toPayloadValue(key, value) {
  if (value === "" || value === null || value === undefined) {
    if (NULLABLE_DECIMALS.has(key)) return null;
    if (TEXT_OBS_FIELDS.has(key)) return "";
    if (SN_FIELDS.has(key) || key === "prodStatus") return value === "" ? "N" : value;
    if (key === "prodDescricao" || key === "prodEspecificacao") return "";
    return 0;
  }
  if (key === "prodStatus" || SN_FIELDS.has(key)) return value;
  if (key === "prodDescricao" || key === "prodEspecificacao" || TEXT_OBS_FIELDS.has(key)) {
    return value;
  }
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
}

export function computePesoEstoque(produto) {
  const saldo = Number(produto?.prodSaldo);
  const peso = Number(produto?.prodPesoEstocagem);
  if (Number.isNaN(saldo) || Number.isNaN(peso)) return "";
  return String(saldo * peso);
}

export function produtoToForm(produto) {
  const form = {};
  for (const key of ALL_FORM_FIELDS) {
    if (key === "prodPesoEstoque") {
      form[key] = computePesoEstoque(produto);
      continue;
    }
    form[key] = toInputValue(produto[key]);
  }
  return form;
}

export function formToPayload(form) {
  const payload = {};
  for (const key of ALL_FORM_FIELDS) {
    if (key === "prodCodigo" || key === "prodSaldo" || key === "prodPesoEstoque") continue;
    if (Object.prototype.hasOwnProperty.call(form, key)) {
      payload[key] = toPayloadValue(key, form[key]);
    }
  }
  return payload;
}

export function emptyProdutoForm() {
  return produtoToForm({
    prodDescricao: "",
    prodEspecificacao: "",
    prodTipo: 1,
    prodOrigem: 1,
    prodClassificacao: 3,
    prodCodigoTipoRemessa: 1,
    prodStatus: "A",
    prodUnidMedCompra: 2,
    prodPesoCompra: 0,
    prodObsCompra: "kg",
    prodEmbalagemCompra: 0,
    prodObsEmbalagem: "",
    prodQtdeEmbalagemCompra: 0,
    prodUnidMedConsumo: 2,
    prodPesoConsumo: 0,
    prodObsConsumo: "kg",
    prodUnidMedEstocagem: 2,
    prodPesoEstocagem: 0,
    prodObsEstocagem: "kg",
    prodFracaoEstocagem: "N",
    prodValorunitario: 0,
    prodArredConsumo: 0,
    prodArredondaOcorrencia: "S",
    prodCalculoDifer: "N",
    prodSaldo: 0,
    prodQtdeMinimo: 0,
    prodQtdeMaximo: 0,
  });
}
