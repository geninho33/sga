import { pool } from "../src/db.js";

const tables = ["trnsfornecedores", "trnsdistribuicaotipo", "trnsrota", "trnsnota", "trnsdistribuicao", "Romaneio", "trnscronograma"];
for (const t of tables) {
  try {
    const [r] = await pool.query(`SHOW COLUMNS FROM \`${t}\``);
    console.log("---", t, "---");
    console.log(r.map((c) => c.Field).join(", "));
  } catch (e) {
    console.log(t, "ERR", e.message);
  }
}
const [c] = await pool.query(
  "SELECT carCodigo, carDescricao FROM trnscargos WHERE carDescricao LIKE '%Nutri%' LIMIT 5"
);
console.log("cargos nutri", c);
process.exit(0);
