function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Formato padrão do sistema: dd/mm/yyyy hh:mm */
export function fmtDateTimeBr(value) {
  if (value === null || value === undefined || value === "") return "";

  const raw = String(value).trim();
  if (raw.slice(0, 10).startsWith("1000-")) return "";

  const d = value instanceof Date ? value : new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));
  if (!Number.isNaN(d.getTime())) {
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]} 00:00`;

  return raw;
}

/** Alias — datas sem hora exibem 00:00 */
export function fmtDateBr(value) {
  return fmtDateTimeBr(value);
}

/** Validade de produto — ignora datas GeneXus vazias */
export function fmtValidadeBr(value) {
  if (!value) return "";
  const s = String(value).slice(0, 10);
  if (s.startsWith("1000-")) return "";
  return fmtDateTimeBr(value);
}
