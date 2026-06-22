import { pool } from "../db.js";

/** GeneXus define atendimento.carDapCodigo; em alguns ambientes a coluna ainda não foi migrada. */
let atendimentoCarDapCodigo = null;

export async function atendimentoHasCarDapCodigo() {
  if (atendimentoCarDapCodigo !== null) return atendimentoCarDapCodigo;
  const [rows] = await pool.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'atendimento' AND COLUMN_NAME = 'carDapCodigo'
     LIMIT 1`
  );
  atendimentoCarDapCodigo = rows.length > 0;
  return atendimentoCarDapCodigo;
}
