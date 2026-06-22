/**
 * Auditoria do relacionamento Atendimento × Grupo × Cardápio (prefeitura 26).
 * Uso: node scripts/audit-relacionamento.mjs
 */
import { pool } from "../src/db.js";

const pref = Number(process.argv[2]) || 26;
const [cols] = await pool.query(
  `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'atendimento'
   ORDER BY ORDINAL_POSITION`
);
const hasCarDap = cols.some((r) => r.COLUMN_NAME === "carDapCodigo");

const [atendStats] = await pool.query(
  hasCarDap
    ? `SELECT COUNT(*) AS total, SUM(carGruCodigo > 0) AS comGrupo, SUM(carDapCodigo > 0) AS comCardapio
       FROM atendimento WHERE prefCodigo = :pref`
    : `SELECT COUNT(*) AS total, SUM(carGruCodigo > 0) AS comGrupo, 0 AS comCardapio
       FROM atendimento WHERE prefCodigo = :pref`,
  { pref }
);
const [cardStats] = await pool.query(
  `SELECT COUNT(*) AS total, SUM(carDapGruCodigo > 0) AS comGrupo, SUM(carDapStatus = 'A') AS ativos
   FROM trnscardapio WHERE prefCodigo = :pref`,
  { pref }
);
const [grupoStats] = await pool.query(
  `SELECT COUNT(*) AS total, SUM(carDapCodigo > 0) AS comCardapioRef
   FROM trnscardapiogrupo WHERE prefCodigo = :pref`,
  { pref }
);

console.log(JSON.stringify({ pref, hasCarDapCodigo: hasCarDap, atendimento: atendStats[0], cardapio: cardStats[0], grupo: grupoStats[0] }, null, 2));
process.exit(0);
