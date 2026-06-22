import { pool } from "../src/db.js";

const statements = [
  "DROP TRIGGER IF EXISTS romaneioitem_before_update",
  `CREATE TRIGGER romaneioitem_before_update
   BEFORE UPDATE ON romaneioitem
   FOR EACH ROW
   BEGIN
     SET NEW.romanItemQuantidadeAntes = OLD.romanItemQuantidade;
   END`,
  "DROP TRIGGER IF EXISTS romaneioitem_before_delete",
];

try {
  for (const sql of statements) {
    await pool.query(sql);
    console.log("OK:", sql.split("\n")[0]);
  }
  console.log("Triggers de romaneio ajustados (UPDATE recriado; DELETE removido — lógica na API).");
} catch (e) {
  console.error("Falha:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
