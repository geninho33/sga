export { formatDateBr } from "./calendarMonth";

/** Valores monetários / Real GeneXus: 0.000.000,00 */
export function formatCurrencyBr(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Decimais com separador de milhar (quantidades). */
export function formatDecimalBr(value, decimals = 4) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function parseDecimalInput(value) {
  if (value === null || value === undefined || value === "") return null;
  const s = String(value).trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}
