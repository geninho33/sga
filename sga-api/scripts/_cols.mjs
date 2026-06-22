import { pool } from "../src/db.js";
const [cols] = await pool.query(`SHOW COLUMNS FROM trnsdistribuicao`);
console.log(cols.map(c => c.Field).join(", "));
process.exit(0);
