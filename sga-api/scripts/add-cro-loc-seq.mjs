import { pool } from "../src/db.js";

async function columnExists(name) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trnscronogramalocal' AND COLUMN_NAME = :name`,
    { name }
  );
  return rows.length > 0;
}

try {
  if (!(await columnExists("croLocSeq"))) {
    await pool.query("ALTER TABLE trnscronogramalocal ADD COLUMN croLocSeq INT NOT NULL DEFAULT 0 AFTER croDia");
    await pool.query("ALTER TABLE trnscronogramalocal DROP PRIMARY KEY");
    await pool.query(
      "ALTER TABLE trnscronogramalocal ADD PRIMARY KEY (prefCodigo, croCodigo, croLocCodigo, croDia, croLocSeq)"
    );
    console.log("Coluna croLocSeq adicionada à PK.");
  } else {
    console.log("croLocSeq já existe.");
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
