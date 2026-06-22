import { runMigrations } from "./migrate.js";

let ensured = false;

/** Garante DDL da API (migrations sga_*). Mantido por compatibilidade com authService. */
export async function ensureAuthTables() {
  if (ensured) return;
  await runMigrations({ silent: true });
  ensured = true;
}
