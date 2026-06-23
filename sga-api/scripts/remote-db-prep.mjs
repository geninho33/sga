/**
 * Backup + ajustes na base oficial (credenciais via variáveis de ambiente).
 * MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_GAM_DATABASE
 */
import { spawn } from "child_process";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const cfg = {
  host: process.env.MYSQL_HOST || "186.233.90.131",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "rootexterno",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "sgealiesc_2023",
  gamDatabase: process.env.MYSQL_GAM_DATABASE || "sgealiesc_gam_2023",
};

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const backupDir = path.join(ROOT, "backups", stamp);

async function dumpDatabaseNode(dbName, outFile) {
  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: dbName,
  });
  const lines = [
    `-- Backup Node.js ${new Date().toISOString()}`,
    `-- Database: ${dbName}`,
    `SET NAMES utf8mb4;`,
    `SET FOREIGN_KEY_CHECKS=0;`,
  ];
  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
    [dbName]
  );
  for (const { TABLE_NAME: table } of tables) {
    const [create] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    lines.push(`\nDROP TABLE IF EXISTS \`${table}\`;`);
    lines.push(`${create[0]["Create Table"]};`);
    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (!rows.length) continue;
    const cols = Object.keys(rows[0]);
    const colList = cols.map((c) => `\`${c}\``).join(", ");
    const batch = 80;
    for (let i = 0; i < rows.length; i += batch) {
      const chunk = rows.slice(i, i + batch);
      const values = chunk
        .map((row) => {
          const vals = cols.map((c) => conn.escape(row[c]));
          return `(${vals.join(", ")})`;
        })
        .join(",\n");
      lines.push(`INSERT INTO \`${table}\` (${colList}) VALUES\n${values};`);
    }
    console.log(`   dump ${dbName}.${table}: ${rows.length} rows`);
  }
  lines.push(`SET FOREIGN_KEY_CHECKS=1;`);
  await conn.end();
  await writeFile(outFile, lines.join("\n"), "utf8");
}

async function dumpDatabase(dbName, outFile) {
  try {
    return await dumpDatabaseDocker(dbName, outFile);
  } catch (err) {
    console.warn(`   Docker mysqldump indisponível (${err.message}). Usando backup Node…`);
    return dumpDatabaseNode(dbName, outFile);
  }
}

async function dumpDatabaseDocker(dbName, outFile) {
  return new Promise((resolve, reject) => {
    const args = [
      "run",
      "--rm",
      "mysql:8",
      "mysqldump",
      `-h${cfg.host}`,
      `-P${cfg.port}`,
      `-u${cfg.user}`,
      `-p${cfg.password}`,
      "--single-transaction",
      "--routines",
      "--triggers",
      "--set-gtid-purged=OFF",
      dbName,
    ];
    const out = [];
    const proc = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });
    proc.stdout.on("data", (c) => out.push(c));
    proc.stderr.on("data", (c) => process.stderr.write(c));
    proc.on("error", reject);
    proc.on("close", async (code) => {
      if (code !== 0) return reject(new Error(`mysqldump ${dbName} exit ${code}`));
      await writeFile(outFile, Buffer.concat(out));
      resolve(outFile);
    });
  });
}

async function inspect(conn, db) {
  const [sga] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE 'sga_%' ORDER BY TABLE_NAME`,
    [db]
  );
  let migrations = [];
  try {
    const [m] = await conn.query("SELECT name, applied_at FROM sga_schema_migrations ORDER BY name");
    migrations = m;
  } catch {
    /* tabela ainda não existe */
  }
  const [croCol] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'trnscronogramalocal' AND COLUMN_NAME = 'croLocSeq' LIMIT 1`,
    [db]
  );
  const [triggers] = await conn.query(
    `SELECT TRIGGER_NAME, DEFINER FROM information_schema.TRIGGERS
     WHERE TRIGGER_SCHEMA = ? AND TRIGGER_NAME IN (
       'trnsnotaitens_before_update','trnsnotaitens_before_delete',
       'trnsdistribuicaoitens_before_update','romaneioitem_before_update','romaneioitem_before_delete'
     )`,
    [db]
  );
  return { sga, migrations, hasCroLocSeq: croCol.length > 0, triggers };
}

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

async function main() {
  if (!cfg.password) {
    console.error("Defina MYSQL_PASSWORD");
    process.exit(1);
  }

  await mkdir(backupDir, { recursive: true });
  console.log("Backup em:", backupDir);

  console.log(`1/4 Backup ${cfg.database}…`);
  const mainDump = path.join(backupDir, `${cfg.database}.sql`);
  await dumpDatabase(cfg.database, mainDump);
  console.log("   OK:", mainDump);

  console.log(`2/4 Backup ${cfg.gamDatabase}…`);
  const gamDump = path.join(backupDir, `${cfg.gamDatabase}.sql`);
  await dumpDatabase(cfg.gamDatabase, gamDump);
  console.log("   OK:", gamDump);

  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
  });

  console.log("3/4 Inspeção antes dos ajustes…");
  const before = await inspect(conn, cfg.database);
  console.log(JSON.stringify(before, null, 2));
  await conn.end();

  process.env.MYSQL_HOST = cfg.host;
  process.env.MYSQL_PORT = String(cfg.port);
  process.env.MYSQL_USER = cfg.user;
  process.env.MYSQL_PASSWORD = cfg.password;
  process.env.MYSQL_DATABASE = cfg.database;
  process.env.MYSQL_GAM_DATABASE = cfg.gamDatabase;

  const { runMigrations } = await import("../src/services/migrate.js");
  const { pool } = await import("../src/db.js");

  console.log("4/4 Aplicando migrations sga_*…");
  const mig = await runMigrations();
  console.log("   Aplicadas:", mig.applied);

  console.log("   Corrigindo triggers…");
  await fixTriggers(pool);
  console.log("   Triggers OK");

  console.log("   Verificando croLocSeq…");
  const croAdded = await ensureCroLocSeq(pool);
  console.log(croAdded ? "   croLocSeq adicionada" : "   croLocSeq já existia");

  const afterConn = await pool.getConnection();
  try {
    const after = await inspect(afterConn, cfg.database);
    const report = { backupDir, before, after, migrationsApplied: mig.applied, croLocSeqAdded: croAdded };
    const reportPath = path.join(backupDir, "prep-report.json");
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log("Relatório:", reportPath);
  } finally {
    afterConn.release();
  }

  await pool.end();
  console.log("Concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
