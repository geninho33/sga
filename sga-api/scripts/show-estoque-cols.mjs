import { pool } from "../src/db.js";

const [cols] = await pool.query(
  "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trnsestoque' ORDER BY ORDINAL_POSITION"
);
console.log(cols.map((c) => c.COLUMN_NAME).join(", "));
await pool.end();
