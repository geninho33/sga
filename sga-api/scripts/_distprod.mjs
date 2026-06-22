import { pool } from "../src/db.js";
const [cols] = await pool.query("SHOW COLUMNS FROM trnsdistribuicaoprodutos");
console.log(cols.map((c) => c.Field).join(", "));
const [rows] = await pool.query("SELECT * FROM trnsdistribuicaoprodutos LIMIT 1");
console.log("sample", rows[0]);
process.exit(0);
