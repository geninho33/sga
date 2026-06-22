import { useMemo, useState } from "react";
import { apiJson } from "../api/client";
import { formatDateBr, weekdayLabel } from "../utils/calendarMonth";
import { FaIcon } from "./Icon";
import PratoPercaptaModal from "./PratoPercaptaModal";

export default function CardapioDiaRefeicoesModal({
  carDapCodigo,
  dateIso,
  refeicoes,
  tiposRefeicao,
  pratos,
  referencias = {},
  onClose,
  onChanged,
}) {
  const [novo, setNovo] = useState({ carPratoTurno: "", carPratoRefeicao: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [percaptaPrato, setPercaptaPrato] = useState(null);

  const sorted = useMemo(
    () =>
      [...refeicoes].sort((a, b) =>
        String(a.carPratoTurnoDesc || a.carPratoTurno).localeCompare(
          String(b.carPratoTurnoDesc || b.carPratoTurno)
        )
      ),
    [refeicoes]
  );

  const add = async () => {
    if (!novo.carPratoTurno || !novo.carPratoRefeicao) {
      setError("Selecione turno e refeição.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiJson(`/api/preparacao/cardapios/${carDapCodigo}/pratos`, {
        method: "POST",
        body: JSON.stringify({
          carPratoData: dateIso,
          carPratoTurno: novo.carPratoTurno,
          carPratoRefeicao: novo.carPratoRefeicao,
        }),
      });
      setNovo({ carPratoTurno: "", carPratoRefeicao: "" });
      await onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (carPratoCodigo) => {
    setBusy(true);
    setError("");
    try {
      await apiJson(`/api/preparacao/cardapios/${carDapCodigo}/pratos/${carPratoCodigo}`, {
        method: "DELETE",
      });
      await onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="cmd-backdrop open" role="presentation" onClick={onClose}>
        <div
          className="cmd card-pad cardapio-dia-modal"
          role="dialog"
          aria-labelledby="cardapio-dia-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="cardapio-dia-head">
            <div>
              <h2 id="cardapio-dia-title" className="cardapio-dia-title">
                Refeições · {formatDateBr(dateIso)}
              </h2>
              <p className="cardapio-dia-sub muted">{weekdayLabel(dateIso)}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar">
              <FaIcon icon="fa-x" />
            </button>
          </div>

          <div className="cardapio-dia-scroll">
            {sorted.length === 0 ? (
              <p className="muted">Nenhuma refeição neste dia.</p>
            ) : (
              <ul className="cardapio-dia-list">
                {sorted.map((r) => (
                  <li key={r.carPratoCodigo} className="cardapio-dia-item">
                    <div className="cardapio-dia-item-main">
                      <span className="cardapio-dia-turno">{r.carPratoTurnoDesc || r.carPratoTurno}</span>
                      <span className="cardapio-dia-prato">{r.carPratoRefeicaoDesc || r.carPratoRefeicao}</span>
                    </div>
                    <div className="cardapio-dia-item-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        title="Percapta por área, etapa e turno"
                        disabled={busy}
                        onClick={() =>
                          setPercaptaPrato({
                            pratoCodigo: r.carPratoRefeicao,
                            pratoDescricao: r.carPratoRefeicaoDesc || String(r.carPratoRefeicao),
                          })
                        }
                      >
                        <FaIcon icon="fa-list" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        title="Excluir"
                        disabled={busy}
                        onClick={() => remove(r.carPratoCodigo)}
                      >
                        <FaIcon icon="fa-x" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="cardapio-dia-add-inline">
            <select
              className="input input-sm"
              value={novo.carPratoTurno}
              disabled={busy}
              onChange={(e) => setNovo((n) => ({ ...n, carPratoTurno: e.target.value }))}
            >
              <option value="">Turno…</option>
              {tiposRefeicao.map((t, i) => (
                <option key={`turno-${t.refTipCodigo ?? i}`} value={String(t.refTipCodigo)}>
                  {t.refTipDescricao}
                </option>
              ))}
            </select>
            <select
              className="input input-sm"
              value={novo.carPratoRefeicao}
              disabled={busy}
              onChange={(e) => setNovo((n) => ({ ...n, carPratoRefeicao: e.target.value }))}
            >
              <option value="">Refeição…</option>
              {pratos.map((p, i) => (
                <option key={`prato-${p.pratoCodigo ?? i}`} value={String(p.pratoCodigo)}>
                  {p.pratoDscricao}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={add} title="Incluir">
              <FaIcon icon="fa-plus" />
            </button>
          </div>

          {error ? <p className="cardapio-dia-error">{error}</p> : null}
        </div>
      </div>

      {percaptaPrato ? (
        <PratoPercaptaModal
          pratoCodigo={percaptaPrato.pratoCodigo}
          pratoDescricao={percaptaPrato.pratoDescricao}
          areasEnsino={referencias.areasEnsino}
          etapasEnsino={referencias.etapasEnsino}
          produtos={referencias.produtos}
          turnoGrupo={referencias.turnoGrupo}
          onClose={() => setPercaptaPrato(null)}
        />
      ) : null}
    </>
  );
}
