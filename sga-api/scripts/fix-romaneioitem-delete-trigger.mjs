import { pool } from "../src/db.js";

try {
  await pool.query("DROP TRIGGER IF EXISTS romaneioitem_before_delete");
  console.log("Trigger DELETE removido (lógica tratada na API).");
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
