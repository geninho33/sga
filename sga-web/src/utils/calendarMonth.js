const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Interpreta carDapMesAno (date ou string) e retorna ano/mês do cardápio. */
export function parseCardapioMesAno(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { year: value.getFullYear(), month: value.getMonth() };
  }
  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m] = s.split("-").map(Number);
  return { year: y, month: m - 1 };
}

export function formatIsoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatDateBr(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const d = value.getDate();
    const m = value.getMonth() + 1;
    const y = value.getFullYear();
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  }
  const s = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  return s;
}

export function weekdayLabel(iso) {
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  return WEEKDAYS[d.getDay()];
}

/** Monta semanas do mês (domingo = primeira coluna). */
export function buildCalendarMonth(mesAno) {
  const parsed = parseCardapioMesAno(mesAno);
  if (!parsed) return null;

  const { year, month } = parsed;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = new Date(year, month, 1).getDay();

  const weeks = [];
  let row = Array.from({ length: startPad }, () => null);

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = formatIsoDate(year, month, day);
    const weekday = new Date(`${iso}T12:00:00`).getDay();
    row.push({
      day,
      iso,
      weekday,
      isWeekend: weekday === 0 || weekday === 6,
    });
    if (row.length === 7) {
      weeks.push(row);
      row = [];
    }
  }
  if (row.length) {
    while (row.length < 7) row.push(null);
    weeks.push(row);
  }

  return {
    year,
    month,
    monthLabel: `${MONTHS[month]} ${year}`,
    weekdays: WEEKDAYS,
    weeks,
  };
}

export function indexPratosByDate(pratos) {
  const map = new Map();
  for (const p of pratos) {
    const key = String(p.carPratoData).slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return map;
}
