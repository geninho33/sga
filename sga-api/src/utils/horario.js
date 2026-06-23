/** Utilitários de horário compatíveis com domínio GeneXus (datetime base 1000-01-01). */

const GX_EMPTY_RE = /^(0000-00-00|\d{4}-00-00)/;
const GX_VAZIO_RE = /^1000-01-01\s+00:00:00$/;

/** Horário GeneXus considerado “não cadastrado”. */
export function isHorarioGxVazio(value) {
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

/**
 * Extrai minutos do dia a partir de horário GeneXus (datetime, string ou HH:MM).
 * Retorna null quando vazio/inválido.
 */
export function parseHorarioToMinutes(value) {
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

/** Formata para exibição HH:MM (vazio quando não cadastrado). */
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

/** Valor padrão GeneXus para horário vazio (coluna NOT NULL). */
export const GX_HORARIO_VAZIO = "1000-01-01 00:00:00";

/** Converte entrada ou valor do banco para datetime GeneXus gravável no MySQL. */
export function horarioParaDatetimeGx(value) {
  const mins = parseHorarioToMinutes(value);
  if (mins == null) return GX_HORARIO_VAZIO;
  const hh = Math.floor(mins / 60) % 24;
  const mm = mins % 60;
  return `1000-01-01 ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

/** Normaliza HH:MM do formulário para gravar em coluna datetime GeneXus. */
export function normalizeHorarioInput(value) {
  if (value == null || value === "") return null;
  const mins = parseHorarioToMinutes(value);
  if (mins == null) return null;
  return horarioParaDatetimeGx(value);
}

/** Rótulo "HH:MM - Descrição". */
export function labelTipoRefeicao(tipo) {
  if (!tipo) return "";
  const h = formatHorario(tipo.refTipHorario);
  const desc = tipo.refTipDescricao || "";
  return h ? `${h} - ${desc}` : desc;
}

/** Serializa tipo de refeição para API (horário como HH:MM ou null). */
export function serializeTipoRefeicao(row) {
  if (!row) return row;
  const h1 = formatHorario(row.refTipHorario);
  const h2 = formatHorario(row.refTipHorario2);
  return {
    ...row,
    refTipHorario: h1 || null,
    refTipHorario2: h2 || null,
  };
}

/** Serializa prato do cardápio com horário formatado. */
export function serializeCardapioPrato(row) {
  if (!row) return row;
  const h = formatHorario(row.carPratoHorario || row.refTipHorario);
  return {
    ...row,
    carPratoHorario: h || null,
    carPratoHorarioFmt: h || null,
    refTipHorario: formatHorario(row.refTipHorario) || null,
  };
}
