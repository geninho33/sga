/** Valores padrão para INSERT em trnsprodutos (campos NOT NULL fora do formulário). */
export const PRODUTO_INSERT_DEFAULTS = {
  prodPrograma: 1,
  prodPrograma_exclusivo: "P",
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
  prodPesoUnidade: 1,
  prodUnidMedEstocagem: 2,
  prodPesoEstocagem: 0,
  prodObsEstocagem: "kg",
  prodLoteCompra: 0,
  prodTipoRemessa: "M",
  prodTiipoCompra: "M",
  prodFracaoEstocagem: "N",
  prodFracaoConsumo: "N",
  prodArredConsumo: 0,
  prodValorunitario: 0,
  prodArredondaOcorrencia: "S",
  prodCalculoDifer: "N",
  prodZonaUrbana: "S",
  prodZonaRural: "S",
  prodAcucar: 0,
  prodCaloria: 0,
  prodCarboidrato: 0,
  prodGorduraTrans: 0,
  prodGorduraSaturada: 0,
  prodProteina: 0,
  prodSal: 0,
  prodPotassio: 0,
  prodCalcio: 0,
  prodFerro: 0,
  prodVitaminaA: 0,
  prodNpcal: 0,
  prodNdpcal: 0,
  prodLipidio: 0,
  prodFibra: 0,
  prodVitaminaC: 0,
  prodMagnesio: 0,
  prodZinco: 0,
  prodTipoIndice: "A",
  prodIndice: 0,
  prodTaco: null,
  prodSaldo: 0,
  prodQtdeMinimo: 0,
  prodQtdeMaximo: 0,
  prodFatorCorrecao: null,
  prodFatorCuccao: null,
  prodDiasConsumo: null,
};

export const EDITABLE_FIELDS = [
  "prodDescricao",
  "prodEspecificacao",
  "prodTipo",
  "prodOrigem",
  "prodClassificacao",
  "prodCodigoTipoRemessa",
  "prodStatus",
  "prodUnidMedCompra",
  "prodPesoCompra",
  "prodObsCompra",
  "prodUnidMedConsumo",
  "prodPesoConsumo",
  "prodObsConsumo",
  "prodUnidMedEstocagem",
  "prodPesoEstocagem",
  "prodObsEstocagem",
  "prodValorunitario",
  "prodArredConsumo",
  "prodArredondaOcorrencia",
  "prodCalculoDifer",
  "prodEmbalagemCompra",
  "prodQtdeEmbalagemCompra",
  "prodObsEmbalagem",
  "prodFracaoEstocagem",
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
  "prodVitaminaC",
  "prodMagnesio",
  "prodZinco",
  "prodNpcal",
  "prodNdpcal",
  "prodLipidio",
  "prodFibra",
  "prodAcucar",
  "prodFatorCorrecao",
  "prodFatorCuccao",
  "prodDiasConsumo",
  "prodTaco",
  "prodQtdeMinimo",
  "prodQtdeMaximo",
];

export function buildProdutoRow(prefCodigo, prodCodigo, body = {}) {
  const row = {
    ...PRODUTO_INSERT_DEFAULTS,
    prefCodigo,
    prodCodigo,
  };

  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      row[field] = body[field];
    }
  }

  if (!row.prodDescricao || String(row.prodDescricao).trim() === "") {
    return { error: "Descrição é obrigatória" };
  }

  if (row.prodStatus !== "A" && row.prodStatus !== "I") {
    return { error: "Situação inválida (use A ou I)" };
  }

  return { row };
}
