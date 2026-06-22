import { pool } from "../db.js";

async function countOne(sql, params) {
  const [rows] = await pool.query(sql, params);
  return Number(rows[0]?.c ?? 0);
}

/** KPIs do dashboard filtrados pela prefeitura (município) logada. */
export async function loadDashboardStats(prefCodigo) {
  const pref = Number(prefCodigo);
  if (!Number.isFinite(pref) || pref <= 0) {
    return null;
  }

  const [remessasAtivas, locaisAtivos, produtosAtivos, produtosTotal, cardapios] = await Promise.all([
    countOne(
      `SELECT COUNT(*) AS c FROM trnsremessas
       WHERE prefCodigo = :prefCodigo AND remStatus = 'A'`,
      { prefCodigo: pref }
    ),
    countOne(
      `SELECT COUNT(*) AS c FROM trnslocal
       WHERE prefCodigo = :prefCodigo AND locStatus = 'A'`,
      { prefCodigo: pref }
    ),
    countOne(
      `SELECT COUNT(*) AS c FROM trnsprodutos
       WHERE prefCodigo = :prefCodigo AND prodStatus = 'A'`,
      { prefCodigo: pref }
    ),
    countOne(
      `SELECT COUNT(*) AS c FROM trnsprodutos WHERE prefCodigo = :prefCodigo`,
      { prefCodigo: pref }
    ),
    countOne(
      `SELECT COUNT(*) AS c FROM trnscardapio
       WHERE prefCodigo = :prefCodigo AND carDapStatus = 'A'`,
      { prefCodigo: pref }
    ),
  ]);

  return {
    prefCodigo: pref,
    remessasAtivas,
    locaisAtivos,
    produtosAtivos,
    produtosTotal,
    cardapios,
  };
}
