/** Completa ajustes pendentes (triggers + croLocSeq) — credenciais via env. */
process.env.MYSQL_HOST = process.env.MYSQL_HOST || "186.233.90.131";
process.env.MYSQL_USER = process.env.MYSQL_USER || "rootexterno";
process.env.MYSQL_DATABASE = process.env.MYSQL_DATABASE || "sgealiesc_2023";
process.env.MYSQL_GAM_DATABASE = process.env.MYSQL_GAM_DATABASE || "sgealiesc_gam_2023";

const { pool } = await import("../src/db.js");

async function fixTriggers(pool) {
  for (const name of [
    "trnsnotaitens_before_delete",
    "trnsnotaitens_before_update",
    "trnsdistribuicaoitens_before_update",
    "romaneioitem_before_update",
    "romaneioitem_before_delete",
  ]) {
    await pool.query(`DROP TRIGGER IF EXISTS \`${name}\``);
  }
  await pool.query(`
    CREATE TRIGGER trnsnotaitens_before_update
    BEFORE UPDATE ON trnsnotaitens
    FOR EACH ROW
    SET NEW.notaItemQtdeAntes = OLD.notaItemQtde
  `);
  await pool.query(`
    CREATE TRIGGER trnsdistribuicaoitens_before_update
    BEFORE UPDATE ON trnsdistribuicaoitens
    FOR EACH ROW
    SET NEW.distItemQtdeAntes = OLD.distItemQuantidade
  `);
  await pool.query(`
    CREATE TRIGGER romaneioitem_before_update
    BEFORE UPDATE ON romaneioitem
    FOR EACH ROW
    SET NEW.romanItemQuantidadeAntes = OLD.romanItemQuantidade
  `);
}

async function ensureCroLocSeq(pool) {
  const [cols] = await pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trnscronogramalocal' AND COLUMN_NAME = 'croLocSeq' LIMIT 1`
  );
  if (cols.length) return false;

  const [fks] = await pool.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trnscronogramalocal'
       AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1`
  );
  if (fks[0]?.CONSTRAINT_NAME) {
    await pool.query(`ALTER TABLE trnscronogramalocal DROP FOREIGN KEY \`${fks[0].CONSTRAINT_NAME}\``);
  }
  await pool.query("ALTER TABLE trnscronogramalocal ADD COLUMN croLocSeq INT NOT NULL DEFAULT 0 AFTER croDia");
  await pool.query("ALTER TABLE trnscronogramalocal DROP PRIMARY KEY");
  await pool.query(
    "ALTER TABLE trnscronogramalocal ADD PRIMARY KEY (prefCodigo, croCodigo, croLocCodigo, croDia, croLocSeq)"
  );
  return true;
}

await fixTriggers(pool);
console.log("Triggers OK");
const cro = await ensureCroLocSeq(pool);
console.log(cro ? "croLocSeq adicionada" : "croLocSeq já existia");
await pool.end();
