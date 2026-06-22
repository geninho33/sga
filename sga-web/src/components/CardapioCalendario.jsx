import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../api/client";
import { buildCalendarMonth, formatDateBr, indexPratosByDate } from "../utils/calendarMonth";
import CardapioDiaRefeicoesModal from "./CardapioDiaRefeicoesModal";

function formatHorario(value) {
  if (!value) return "";
  const m = String(value).match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

export default function CardapioCalendario({
  carDapCodigo,
  mesAno,
  pratos,
  tiposRefeicao,
  pratosCatalogo,
  referencias = {},
  onRefresh,
}) {
  const [diaAberto, setDiaAberto] = useState(null);
  const [feriados, setFeriados] = useState({});

  const cal = useMemo(() => buildCalendarMonth(mesAno), [mesAno]);
  const byDate = useMemo(() => indexPratosByDate(pratos), [pratos]);

  useEffect(() => {
    if (!carDapCodigo || !cal?.year) return;
    let cancelled = false;
    apiJson(`/api/preparacao/cardapios/${carDapCodigo}/feriados`, { params: { ano: cal.year } })
      .then((res) => { if (!cancelled) setFeriados(res.data ?? {}); })
      .catch(() => { if (!cancelled) setFeriados({}); });
    return () => { cancelled = true; };
  }, [carDapCodigo, cal?.year]);

  if (!cal) {
    return (
      <p className="muted">
        Informe o <strong>Mês/Ano</strong> na aba Dados gerais para montar o calendário.
      </p>
    );
  }

  const refeicoesDia = diaAberto ? byDate.get(diaAberto) ?? [] : [];

  return (
    <>
      <div className="cardapio-cal-header">
        <h3 className="cardapio-cal-title">{cal.monthLabel}</h3>
        <p className="muted cardapio-cal-hint">Clique em um dia para lançar ou editar as refeições.</p>
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

            const items = byDate.get(cell.iso) ?? [];
            const feriado = feriados[cell.iso];
            const hasItems = items.length > 0;
            const isFeriado = !!feriado?.diaLivre;

            return (
              <button
                key={cell.iso}
                type="button"
                className={
                  "cardapio-cal-cell" +
                  (cell.isWeekend ? " cardapio-cal-cell--weekend" : "") +
                  (isFeriado ? " cardapio-cal-cell--feriado" : hasItems ? " cardapio-cal-cell--filled" : "") +
                  (diaAberto === cell.iso ? " cardapio-cal-cell--active" : "")
                }
                onClick={() => !isFeriado && setDiaAberto(cell.iso)}
                aria-label={`Dia ${formatDateBr(cell.iso)}${isFeriado ? ` · ${feriado.diaLivre}` : ""}`}
              >
                <span className={"cardapio-cal-day" + (cell.isWeekend ? " cardapio-cal-day--weekend" : "")}>
                  {cell.day}
                </span>
                {isFeriado ? (
                  <span className="cardapio-cal-feriado">{feriado.calDescricao || feriado.diaLivre}</span>
                ) : hasItems ? (
                  <ul className="cardapio-cal-meals">
                    {items.map((r) => (
                      <li key={r.carPratoCodigo}>
                        <span className="cardapio-cal-meal-turno">
                          {formatHorario(r.carPratoHorario) || r.carPratoTurnoDesc?.slice(0, 8)}
                        </span>
                        <span className="cardapio-cal-meal-name">
                          {r.carPratoRefeicaoDesc || r.carPratoRefeicao}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="cardapio-cal-add">+ refeição</span>
                )}
              </button>
            );
          })
        )}
      </div>

      {diaAberto ? (
        <CardapioDiaRefeicoesModal
          carDapCodigo={carDapCodigo}
          dateIso={diaAberto}
          refeicoes={refeicoesDia}
          tiposRefeicao={tiposRefeicao}
          pratos={pratosCatalogo}
          referencias={referencias}
          onClose={() => setDiaAberto(null)}
          onChanged={async () => {
            await onRefresh?.();
          }}
        />
      ) : null}
    </>
  );
}
