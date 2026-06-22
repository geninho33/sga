import { pool } from "../db.js";

/** Espelha PRCDVerificaCalendarioRetorno: retorna descrição se feriado ou não útil. */
export async function verifyCalendarDay(prefCodigo, dateIso) {
  if (!dateIso) return { diaLivre: "", feriado: false, diaUtil: true };
  const ano = Number(String(dateIso).slice(0, 4));
  const [rows] = await pool.query(
    `SELECT calDescricao, calFeriado, calDiautil
     FROM trnscalendarioletivo
     WHERE prefCodigo = :prefCodigo AND calAno = :ano AND calData = :dateIso AND calStatus = 'A'
     LIMIT 1`,
    { prefCodigo, ano, dateIso }
  );
  const row = rows[0];
  if (!row) return { diaLivre: "", feriado: false, diaUtil: true };
  const feriado = row.calFeriado === "S";
  const diaUtil = row.calDiautil !== "N";
  const diaLivre = feriado || !diaUtil ? String(row.calDescricao || "Feriado") : "";
  return { diaLivre, feriado, diaUtil, calDescricao: row.calDescricao };
}

export async function loadCalendarioMap(prefCodigo, ano) {
  const [rows] = await pool.query(
    `SELECT calData, calDescricao, calFeriado, calDiautil
     FROM trnscalendarioletivo
     WHERE prefCodigo = :prefCodigo AND calAno = :ano AND calStatus = 'A'`,
    { prefCodigo, ano }
  );
  const map = new Map();
  for (const r of rows) {
    const iso = r.calData instanceof Date ? r.calData.toISOString().slice(0, 10) : String(r.calData).slice(0, 10);
    map.set(iso, {
      calDescricao: r.calDescricao,
      feriado: r.calFeriado === "S",
      diaUtil: r.calDiautil !== "N",
      diaLivre: r.calFeriado === "S" || r.calDiautil === "N" ? String(r.calDescricao || "Feriado") : "",
    });
  }
  return map;
}
