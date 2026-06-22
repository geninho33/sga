import { pool } from "../src/db.js";
const [c] = await pool.query(
  "SELECT COLUMN_NAME, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='trnscronogramalocal' ORDER BY ORDINAL_POSITION"
);
console.log(c);
const [idx] = await pool.query("SHOW INDEX FROM trnscronogramalocal");
console.log(idx.filter((i) => i.Key_name === "PRIMARY"));
await pool.end();
