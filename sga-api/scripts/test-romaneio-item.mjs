import { pool } from "../src/db.js";
import { upsertRomaneioItem } from "../src/services/logisticaEntities.js";

const prefCodigo = Number(process.argv[2] || 1);
const romanCodigo = Number(process.argv[3] || 135);
const prodCodigo = Number(process.argv[4] || 137);

try {
  const [tables] = await pool.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE '%omaneio%'"
  );
  console.log("tables", tables);

  const [item] = await pool.query(
    "SELECT * FROM RomaneioItem WHERE romanCodigo = :romanCodigo AND prodCodigo = :prodCodigo LIMIT 1",
    { romanCodigo, prodCodigo }
  );
  console.log("item before", item[0]);

  const result = await upsertRomaneioItem(prefCodigo, romanCodigo, {
    prodCodigo,
    romanItemQuantidade: Number(item[0]?.romanItemQuantidade || 1) + 1,
  });
  console.log("upsert result", result);

  const [item2] = await pool.query(
    "SELECT * FROM RomaneioItem WHERE romanCodigo = :romanCodigo AND prodCodigo = :prodCodigo LIMIT 1",
    { romanCodigo, prodCodigo }
  );
  console.log("item after", item2[0]);
} catch (e) {
  console.error("ERR", e);
} finally {
  await pool.end();
}
