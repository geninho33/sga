import { pool } from "../src/db.js";

async function showCols(table) {
  const [c] = await pool.query(`SHOW COLUMNS FROM ${table}`);
  return c.map((x) => x.Field).join(", ");
}

console.log("trnsmapaue:", await showCols("trnsmapaue"));
console.log("trnsdistribuicao:", await showCols("trnsdistribuicao"));
console.log("trnsperguntaresposta:", await showCols("trnsperguntaresposta"));
process.exit(0);
