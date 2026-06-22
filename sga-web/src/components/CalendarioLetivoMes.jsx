import { useMemo } from "react";
import { buildCalendarMonth, formatDateBr } from "../utils/calendarMonth";

export default function CalendarioLetivoMes({ mesAno, mapa = {}, onDiaClick }) {
  const cal = useMemo(() => buildCalendarMonth(mesAno), [mesAno]);

  if (!cal) return null;

  return (
    <>
      <div className="cardapio-cal-header">
        <h3 className="cardapio-cal-title">{cal.monthLabel}</h3>
        <p className="muted cardapio-cal-hint">Clique em um dia para ver ou lançar no calendário letivo.</p>
      </div>

      <div className="cardapio-cal-grid cardapio-cal-grid--month" role="grid" aria-label={`Calendário ${cal.monthLabel}`}>
        {cal.weekdays.map((wd, i) => (
          <div
            key={wd}
            className={"cardapio-cal-weekday" + (i === 0 || i === 6 ? " cardapio-cal-weekday--weekend" : "")}
            role="columnheader"
          >
            {wd}
          </div>
        ))}

        {cal.weeks.flatMap((week, wi) =>
          week.map((cell, ci) => {
            if (!cell) {
              return <div key={`empty-${wi}-${ci}`} className="cardapio-cal-cell cardapio-cal-cell--empty" aria-hidden />;
            }

            const entry = mapa[cell.iso];
            const hasEntry = !!entry?.calDescricao;
            const isFeriado = entry?.feriado || entry?.diaUtil === false;

            return (
              <button
                key={cell.iso}
                type="button"
                className={
                  "cardapio-cal-cell" +
                  (cell.isWeekend ? " cardapio-cal-cell--weekend" : "") +
                  (isFeriado ? " cardapio-cal-cell--feriado" : hasEntry ? " cardapio-cal-cell--filled" : "")
                }
                onClick={() => onDiaClick?.(cell.iso, entry)}
                aria-label={`Dia ${formatDateBr(cell.iso)}${hasEntry ? ` · ${entry.calDescricao}` : ""}`}
              >
                <span className={"cardapio-cal-day" + (cell.isWeekend ? " cardapio-cal-day--weekend" : "")}>
                  {cell.day}
                </span>
                {hasEntry ? (
                  <span className="cardapio-cal-feriado">{entry.calDescricao}</span>
                ) : (
                  <span className="cardapio-cal-add">+ lançamento</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
