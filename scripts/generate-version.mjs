#!/usr/bin/env node
/**
 * Gera metadados de versão para sga-web e sga-api.
 * Executado automaticamente antes de dev/build (npm pre*) e no Docker build.
 */
import { execSync } from "child_process";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = process.env.SGA_ROOT || join(scriptDir, "..");

function readSemver() {
  try {
    const first = readFileSync(join(root, "VERSION"), "utf8").trim().split(/\r?\n/)[0].trim();
    const m = first.match(/^(\d+\.\d+\.\d+)/);
    if (m) return m[1];
  } catch {
    /* VERSION ausente */
  }
  try {
    const pkg = JSON.parse(readFileSync(join(root, "sga-api", "package.json"), "utf8"));
    if (pkg.version) return String(pkg.version);
  } catch {
    /* ignore */
  }
  return "1.0.0";
}

function gitValue(args) {
  try {
    return execSync(`git ${args}`, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const builtAt = new Date().toISOString();
const buildDate = builtAt.slice(0, 10).replace(/-/g, "");
const version = readSemver();
const commit = gitValue("rev-parse --short HEAD") || "unknown";
const branch = gitValue("rev-parse --abbrev-ref HEAD") || "";

const info = {
  name: "SGA — Alimentação Escolar",
  shortName: "SGA",
  version,
  commit,
  branch,
  buildDate,
  builtAt,
  displayVersion: `${version}+${buildDate}.${commit}`,
};

const webOut = join(root, "sga-web", "src", "generated");
const apiOut = join(root, "sga-api", "src", "generated");
mkdirSync(webOut, { recursive: true });
mkdirSync(apiOut, { recursive: true });

writeFileSync(
  join(webOut, "version.js"),
  `// Gerado por scripts/generate-version.mjs — não editar manualmente
export const APP_VERSION = ${JSON.stringify(info, null, 2)};
`,
  "utf8"
);

writeFileSync(join(apiOut, "version.json"), `${JSON.stringify(info, null, 2)}\n`, "utf8");

console.log(`[version] ${info.displayVersion}${branch ? ` (${branch})` : ""}`);
