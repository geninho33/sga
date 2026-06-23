import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const fallback = {
  name: "SGA — Alimentação Escolar",
  shortName: "SGA",
  repository: "https://github.com/viziv-git/sga",
  version: "0.0.0",
  commit: "unknown",
  branch: "",
  buildDate: "",
  builtAt: "",
  displayVersion: "0.0.0",
};

let cached;

export function getAppVersion() {
  if (cached) return cached;
  try {
    const path = join(dirname(fileURLToPath(import.meta.url)), "..", "generated", "version.json");
    cached = JSON.parse(readFileSync(path, "utf8"));
    return cached;
  } catch {
    cached = fallback;
    return cached;
  }
}
