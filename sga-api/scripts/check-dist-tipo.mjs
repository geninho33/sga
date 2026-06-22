import { pool } from "../src/db.js";
const [c] = await pool.query("SHOW COLUMNS FROM trnsdistribuicaotipo");
console.log(c.map((x) => x.Field).join(", "));
process.exit(0);
