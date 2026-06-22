import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

const TRACKING_TABLE = "sga_schema_migrations";

async function ensureTrackingTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_sga_schema_migrations_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function listMigrationFiles() {
  let entries;
  try {
    entries = await readdir(MIGRATIONS_DIR);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  return entries.filter((f) => f.endsWith(".sql")).sort();
}

async function listAppliedMigrations() {
  await ensureTrackingTable();
  const [rows] = await pool.query(
    `SELECT name, applied_at FROM ${TRACKING_TABLE} ORDER BY name`
  );
  return rows;
}

export async function getMigrationStatus() {
  const files = await listMigrationFiles();
  const applied = await listAppliedMigrations();
  const appliedSet = new Set(applied.map((r) => r.name));
  const pending = files.filter((f) => !appliedSet.has(f));
  return { files, applied, pending };
}

function splitSqlStatements(sql) {
  const cleaned = sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  return cleaned
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function applyMigrationFile(name) {
  const fullPath = path.join(MIGRATIONS_DIR, name);
  const sql = await readFile(fullPath, "utf8");
  const statements = splitSqlStatements(sql);
  if (statements.length === 0) {
    throw new Error(`Migration vazia: ${name}`);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const statement of statements) {
      await conn.query(statement);
    }
    await conn.query(`INSERT INTO ${TRACKING_TABLE} (name) VALUES (:name)`, { name });
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Aplica migrations SQL pendentes (somente pasta migrations/ — objetos sga_*).
 * @param {{ silent?: boolean }} options
 * @returns {{ applied: string[], pending: string[] }}
 */
export async function runMigrations(options = {}) {
  const { silent = false } = options;
  const { pending } = await getMigrationStatus();

  if (pending.length === 0) {
    if (!silent) console.log("Migrations: nenhuma pendente.");
    return { applied: [], pending: [] };
  }

  const applied = [];
  for (const name of pending) {
    if (!silent) console.log(`Migration: aplicando ${name}…`);
    await applyMigrationFile(name);
    applied.push(name);
    if (!silent) console.log(`Migration: ${name} OK`);
  }

  return { applied, pending: [] };
}

export async function printMigrationStatus() {
  const { files, applied, pending } = await getMigrationStatus();
  const appliedSet = new Set(applied.map((r) => r.name));

  console.log(`Diretório: ${MIGRATIONS_DIR}\n`);

  if (files.length === 0) {
    console.log("Nenhum arquivo .sql encontrado.");
    return;
  }

  for (const file of files) {
    const row = applied.find((r) => r.name === file);
    if (row) {
      const when = row.applied_at instanceof Date ? row.applied_at.toISOString() : row.applied_at;
      console.log(`  [ok]  ${file}  (${when})`);
    } else {
      console.log(`  [ -- ] ${file}`);
    }
  }

  console.log(`\nTotal: ${files.length} | Aplicadas: ${appliedSet.size} | Pendentes: ${pending.length}`);
}
