import { pool } from "../src/db.js";

for (const name of [
  "trnsnotaitens_before_update",
  "trnsnotaitens_before_delete",
  "trnsdistribuicaoitens_before_update",
]) {
  const [rows] = await pool.query(`SHOW CREATE TRIGGER \`${name}\``);
  console.log("\n===", name, "===\n");
  console.log(rows[0]["SQL Original Statement"] || rows[0]["Create Trigger"]);
}
process.exit(0);
