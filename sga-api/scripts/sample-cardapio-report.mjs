import { pool } from "../src/db.js";

const [rows] = await pool.query(
  `SELECT c.prefCodigo, c.carDapCodigo, c.carDapDescricao, COUNT(cp.carPratoCodigo) AS n
   FROM trnscardapio c
   INNER JOIN trnscardapioprato cp ON cp.prefCodigo=c.prefCodigo AND cp.carDapCodigo=c.carDapCodigo
   GROUP BY c.prefCodigo, c.carDapCodigo, c.carDapDescricao
   ORDER BY n DESC LIMIT 5`
);
console.log(rows);

const [sample] = await pool.query(
  `SELECT cp.*, p.pratoDscricao, rt.refTipDescricao, rt.refTipHorario
   FROM trnscardapioprato cp
   INNER JOIN trnspratos p ON p.prefCodigo=cp.prefCodigo AND p.pratoCodigo=cp.carPratoRefeicao
   LEFT JOIN trnsrefeicaotipo rt ON rt.prefCodigo=cp.prefCodigo AND rt.refTipCodigo=cp.carPratoTurno
   WHERE cp.prefCodigo=? AND cp.carDapCodigo=?
   LIMIT 5`,
  [rows[0].prefCodigo, rows[0].carDapCodigo]
);
console.log("sample pratos", sample);
process.exit(0);
