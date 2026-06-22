import { pool } from "../db.js";

const DAY_COLS = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

export async function listAtendimentoDoencas(prefCodigo, AtendimentoCodigo) {
  const [rows] = await pool.query(
    `SELECT ad.*, d.doenDescricao
     FROM sga_atendimento_doenca ad
     LEFT JOIN trnsdoencas d ON d.prefCodigo = ad.prefCodigo AND d.doenCodigo = ad.doenCodigo
     WHERE ad.prefCodigo = :prefCodigo AND ad.AtendimentoCodigo = :AtendimentoCodigo
     ORDER BY d.doenOrdem, d.doenDescricao`,
    { prefCodigo, AtendimentoCodigo }
  );
  return rows;
}

export async function saveAtendimentoDoencas(prefCodigo, AtendimentoCodigo, items = []) {
  await pool.query(
    `DELETE FROM sga_atendimento_doenca WHERE prefCodigo = :prefCodigo AND AtendimentoCodigo = :AtendimentoCodigo`,
    { prefCodigo, AtendimentoCodigo }
  );
  for (const item of items) {
    const doenCodigo = Number(item.doenCodigo);
    if (!doenCodigo) continue;
    const params = { prefCodigo, AtendimentoCodigo, doenCodigo };
    for (const d of DAY_COLS) {
      params[`qtde${d}`] = Number(item[`qtde${d}`]) || 0;
    }
    await pool.query(
      `INSERT INTO sga_atendimento_doenca (
         prefCodigo, AtendimentoCodigo, doenCodigo,
         qtdeDomingo, qtdeSegunda, qtdeTerca, qtdeQuarta, qtdeQuinta, qtdeSexta, qtdeSabado
       ) VALUES (
         :prefCodigo, :AtendimentoCodigo, :doenCodigo,
         :qtdeDomingo, :qtdeSegunda, :qtdeTerca, :qtdeQuarta, :qtdeQuinta, :qtdeSexta, :qtdeSabado
       )`,
      params
    );
  }
  return listAtendimentoDoencas(prefCodigo, AtendimentoCodigo);
}

export function sumAtendimentoDoencasPorDia(rows, dia) {
  const col = `qtde${dia}`;
  return (rows || []).reduce((s, r) => s + (Number(r[col]) || 0), 0);
}

/** Total de alunos na segunda: quantidades do atendimento + soma da tabela auxiliar (doenças/restrições). */
export function calcTotalAlunosSegunda(row, doencasSumSegunda = 0) {
  const tipos = ["Normal", "Gluten", "Lactose", "Diabetico", "Colesterol", "Funcionarios"];
  const base = tipos.reduce((s, t) => s + (Number(row[`Atendimento${t}Segunda`]) || 0), 0);
  return base + (Number(doencasSumSegunda) || 0);
}

export const ATENDIMENTO_TOTAL_SEGUNDA_SQL = `
  (
    COALESCE(a.AtendimentoNormalSegunda, 0) +
    COALESCE(a.AtendimentoGlutenSegunda, 0) +
    COALESCE(a.AtendimentoLactoseSegunda, 0) +
    COALESCE(a.AtendimentoDiabeticoSegunda, 0) +
    COALESCE(a.AtendimentoColesterolSegunda, 0) +
    COALESCE(a.AtendimentoFuncionariosSegunda, 0) +
    COALESCE(ad.sumDoencasSegunda, 0)
  )`;

export function calcTotaisAtendimento(form, doencas = []) {
  const dias = DAY_COLS;
  const tiposSemDoenca = ["Normal"];
  const tiposRestricao = ["Gluten", "Lactose", "Diabetico", "Colesterol", "Funcionarios"];
  const out = {};
  for (const dia of dias) {
    const normal = Number(form[`AtendimentoNormal${dia}`]) || 0;
    const restricoes = tiposRestricao.reduce((s, t) => s + (Number(form[`Atendimento${t}${dia}`]) || 0), 0);
    const doencasDia = sumAtendimentoDoencasPorDia(doencas, dia);
    out[dia] = {
      normal,
      restricoes,
      doencas: doencasDia,
      total: normal + restricoes + doencasDia,
    };
  }
  return out;
}
