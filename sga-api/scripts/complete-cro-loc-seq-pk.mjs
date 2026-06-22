import { pool } from "../src/db.js";

const [fks] = await pool.query(
  `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trnscronogramalocal' AND CONSTRAINT_TYPE = 'FOREIGN KEY'`
);
console.log("FKs:", fks);
for (const fk of fks) {
  await pool.query(`ALTER TABLE trnscronogramalocal DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
  console.log("Dropped", fk.CONSTRAINT_NAME);
}
await pool.query("ALTER TABLE trnscronogramalocal DROP PRIMARY KEY");
await pool.query(
  "ALTER TABLE trnscronogramalocal ADD PRIMARY KEY (prefCodigo, croCodigo, croLocCodigo, croDia, croLocSeq)"
);
console.log("PK atualizada com croLocSeq.");
await pool.end();
