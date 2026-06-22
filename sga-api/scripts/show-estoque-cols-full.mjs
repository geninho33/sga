import { pool } from "../src/db.js";
const [c] = await pool.query(
  "SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='trnsestoque' ORDER BY ORDINAL_POSITION"
);
console.log(c);
await pool.end();
