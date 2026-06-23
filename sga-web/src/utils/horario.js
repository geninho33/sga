/** Formata horário (GeneXus datetime, TIME ou HH:MM) para exibição HH:MM. */

const GX_EMPTY_RE = /^(0000-00-00|\d{4}-00-00)/;
const GX_VAZIO_RE = /^1000-01-01\s+00:00:00$/;

function isHorarioGxVazio(value) {
  if (value == null || value === "") return true;
  const s = String(value).trim();
  if (GX_VAZIO_RE.test(s)) return true;
  if (GX_EMPTY_RE.test(s)) return true;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    if (
      value.getFullYear() === 1000
      && value.getMonth() === 0
      && value.getDate() === 1
      && value.getHours() === 0
      && value.getMinutes() === 0
    ) {
      return true;
    }
  }
  return false;
}

function parseHorarioToMinutes(value) {
  if (isHorarioGxVazio(value)) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.getHours() * 60 + value.getMinutes();
  }

  const s = String(value).trim();
  if (!s) return null;

  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;

  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

export function formatHorario(value) {
  const mins = parseHorarioToMinutes(value);
  if (mins == null) return "";
  const hh = Math.floor(mins / 60) % 24;
  const mm = mins % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Chave numérica para ordenação por horário (minutos desde meia-noite). */
export function horarioSortKey(value) {
  const mins = parseHorarioToMinutes(value);
  return mins == null ? 9999 : mins;
}

/** Rótulo padrão: "07:30 - Café da Manhã". */
export function labelTipoRefeicao(tipo) {
  if (!tipo) return "";
  const h = formatHorario(tipo.refTipHorario);
  const desc = tipo.refTipDescricao || "";
  return h ? `${h} - ${desc}` : desc;
}

/** Rótulo de turno em prato do cardápio. */
export function labelTurnoPrato(prato) {
  if (!prato) return "";
  const h = formatHorario(prato.carPratoHorarioFmt || prato.carPratoHorario || prato.refTipHorario);
  const desc = prato.carPratoTurnoDesc || prato.carPratoTurno || "";
  return h ? `${h} - ${desc}` : String(desc);
}

export function sortTiposRefeicao(list) {
  return [...(list || [])].sort(
    (a, b) =>
      horarioSortKey(a.refTipHorario) - horarioSortKey(b.refTipHorario)
      || String(a.refTipDescricao || "").localeCompare(String(b.refTipDescricao || ""), "pt-BR")
  );
}

export function sortPratosPorHorario(list) {
  return [...(list || [])].sort(
    (a, b) =>
      horarioSortKey(a.carPratoHorarioFmt || a.carPratoHorario) - horarioSortKey(b.carPratoHorarioFmt || b.carPratoHorario)
      || String(a.carPratoTurnoDesc || "").localeCompare(String(b.carPratoTurnoDesc || ""), "pt-BR")
  );
}
