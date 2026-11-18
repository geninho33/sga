import { pool } from "../db.js";

/** Colunas de trnsprodutos (alias p) + descrições de grupo e origem. */
export const PRODUTO_SELECT = `
  p.prefCodigo, p.prodCodigo, p.prodPrograma, p.prodPrograma_exclusivo,
  p.prodDescricao, p.prodEspecificacao, p.prodTipo, p.prodOrigem, p.prodClassificacao,
  p.prodCodigoTipoRemessa, p.prodStatus,
  p.prodUnidMedCompra, p.prodPesoCompra, p.prodObsCompra,
  p.prodUnidMedConsumo, p.prodPesoConsumo, p.prodObsConsumo,
  p.prodUnidMedEstocagem, p.prodPesoEstocagem, p.prodObsEstocagem,
  p.prodEmbalagemCompra, p.prodObsEmbalagem, p.prodQtdeEmbalagemCompra,
  p.prodArredondaOcorrencia, p.prodCalculoDifer, p.prodFracaoEstocagem,
  p.prodValorunitario, p.prodArredConsumo,
  p.prodCaloria, p.prodCarboidrato, p.prodGorduraTrans, p.prodGorduraSaturada,
  p.prodProteina, p.prodSal, p.prodPotassio, p.prodCalcio, p.prodFerro,
  p.prodVitaminaA, p.prodVitaminaC, p.prodMagnesio, p.prodZinco,
  p.prodNpcal, p.prodNdpcal, p.prodLipidio, p.prodFibra, p.prodAcucar,
  p.prodFatorCorrecao, p.prodFatorCuccao, p.prodDiasConsumo, p.prodTaco,
  p.prodSaldo, p.prodQtdeMinimo, p.prodQtdeMaximo,
  p.prodDataCad, p.prodDataAlt,
  g.prodGrupdescricao AS prodGrupDescricao,
  o.prodOrigAbreviatura,
  r.disTipDescricao,
  tk.tacoDescricao,
  umc.uniDescricao AS uniMedCompraDescricao,
  ume.uniDescricao AS uniMedEstocagemDescricao
`;

export const PRODUTO_FROM = `
  FROM trnsprodutos p
  LEFT JOIN trnsprodutosgrupo g ON g.prodGrupCodigo = p.prodTipo AND NOT (g.prodGrupStatus <=> 'I')
  LEFT JOIN trnsprodutosorigem o ON o.prodOrigCodigo = p.prodOrigem AND NOT (o.prodOrigStatus <=> 'I')
  LEFT JOIN trnsdistribuicaotipo r ON r.prefCodigo = p.prefCodigo AND r.disTipNumero = p.prodCodigoTipoRemessa AND NOT (r.disTipStatus <=> 'I')
  LEFT JOIN trnstaco tk ON tk.tacoCodigo = p.prodTaco AND NOT (tk.tacoStatus <=> 'I')
  LEFT JOIN trnsunidades umc ON umc.prefCodigo = p.prefCodigo AND umc.uniCodigo = p.prodUnidMedCompra AND NOT (umc.uniStatus <=> 'I')
  LEFT JOIN trnsunidades ume ON ume.prefCodigo = p.prefCodigo AND ume.uniCodigo = p.prodUnidMedEstocagem AND NOT (ume.uniStatus <=> 'I')
`;

export async function listGruposAtivos() {
  const [rows] = await pool.query(
    `SELECT prodGrupCodigo, prodGrupdescricao AS prodGrupDescricao
     FROM trnsprodutosgrupo
     WHERE prodGrupStatus = 'A'
     ORDER BY prodGrupdescricao`
  );
  return rows;
}

export async function listOrigensAtivas() {
  const [rows] = await pool.query(
    `SELECT prodOrigCodigo, prodOrigDescricao, prodOrigAbreviatura
     FROM trnsprodutosorigem
     WHERE prodOrigStatus = 'A'
     ORDER BY prodOrigAbreviatura`
  );
  return rows;
}

export async function listTiposRemessaAtivos(prefCodigo) {
  const [rows] = await pool.query(
    `SELECT disTipNumero, disTipDescricao
     FROM trnsdistribuicaotipo
     WHERE prefCodigo = :prefCodigo AND disTipStatus = 'A'
     ORDER BY disTipDescricao`,
    { prefCodigo }
  );
  return rows;
}

export async function listTacosAtivos() {
  const [rows] = await pool.query(
    `SELECT tacoCodigo, tacoDescricao
     FROM trnstaco
     WHERE tacoStatus = 'A'
     ORDER BY tacoDescricao`
  );
  return rows;
}

export async function listUnidadesAtivas(prefCodigo) {
  const [rows] = await pool.query(
    `SELECT uniCodigo, uniDescricao
     FROM trnsunidades
     WHERE prefCodigo = :prefCodigo AND uniStatus = 'A'
     ORDER BY uniDescricao`,
    { prefCodigo }
  );
  return rows;
}
