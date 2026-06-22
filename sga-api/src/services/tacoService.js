import { pool } from "../db.js";

/** Equivalente a PRCDAplicarTabelaTaco — copia nutrientes de trnstaco para o produto. */
export async function aplicarTabelaTaco(tacoCodigo) {
  const codigo = Number(tacoCodigo);
  if (!Number.isFinite(codigo) || codigo <= 0) {
    return { error: "Informe o código da tabela Taco" };
  }

  const [rows] = await pool.query(
    `SELECT tacoCodigo, tacoDescricao,
            tacoCaloria, tacoCarboidrato, tacoGorduraSaturada, tacoProteina,
            tacoSal, tacoPotassio, tacoCalcio, tacoFerro,
            tacoVitaminaa AS prodVitaminaA, tacoLipidio, tacoFibra,
            tacoVitaminac AS prodVitaminaC, tacoMagnesio, tacoZinco
     FROM trnstaco
     WHERE tacoCodigo = :codigo AND tacoStatus = 'A'
     LIMIT 1`,
    { codigo }
  );

  if (!rows.length) {
    return { error: "Tabela Taco não encontrada ou inativa" };
  }

  const t = rows[0];
  return {
    data: {
      prodTaco: t.tacoCodigo,
      prodCaloria: t.tacoCaloria,
      prodCarboidrato: t.tacoCarboidrato,
      prodGorduraSaturada: t.tacoGorduraSaturada,
      prodProteina: t.tacoProteina,
      prodSal: t.tacoSal,
      prodPotassio: t.tacoPotassio,
      prodCalcio: t.tacoCalcio,
      prodFerro: t.tacoFerro,
      prodVitaminaA: t.prodVitaminaA,
      prodLipidio: t.tacoLipidio,
      prodFibra: t.tacoFibra,
      prodVitaminaC: t.prodVitaminaC,
      prodMagnesio: t.tacoMagnesio,
      prodZinco: t.tacoZinco,
    },
    tacoDescricao: t.tacoDescricao,
  };
}
