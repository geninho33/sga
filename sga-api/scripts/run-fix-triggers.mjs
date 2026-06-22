import { pool } from "../src/db.js";

for (const name of [
  "trnsnotaitens_before_delete",
  "trnsnotaitens_before_update",
  "trnsdistribuicaoitens_before_update",
]) {
  try {
    await pool.query(`DROP TRIGGER IF EXISTS \`${name}\``);
    console.log("Dropped", name);
  } catch (e) {
    console.error("Drop fail", name, e.message);
  }
}

await pool.query(`
  CREATE TRIGGER trnsnotaitens_before_update
  BEFORE UPDATE ON trnsnotaitens
  FOR EACH ROW
  SET NEW.notaItemQtdeAntes = OLD.notaItemQtde
`);
console.log("Created trnsnotaitens_before_update");

await pool.query(`
  CREATE TRIGGER trnsdistribuicaoitens_before_update
  BEFORE UPDATE ON trnsdistribuicaoitens
  FOR EACH ROW
  SET NEW.distItemQtdeAntes = OLD.distItemQuantidade
`);
console.log("Created trnsdistribuicaoitens_before_update");

try {
  await pool.query(
    `UPDATE trnsnotaitens SET notaItemQtde = notaItemQtde
     WHERE prefCodigo = 26 AND notaCodigo = 1057 AND notaItemProduto = 23 LIMIT 1`
  );
  console.log("UPDATE test OK");
} catch (e) {
  console.error("UPDATE test FAIL:", e.message);
}

process.exit(0);
