import { useEffect, useState } from "react";
import { apiJson } from "../api/client";
import { formatDateBr, weekdayLabel } from "../utils/calendarMonth";
import { FaIcon } from "./Icon";

const emptyForm = (ano, calData) => ({
  calAno: ano,
  calData,
  calDescricao: "",
  calDiautil: "S",
  calFeriado: "N",
  calStatus: "A",
});

export default function CalendarioLetivoDiaModal({ ano, dateIso, entry, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm(ano, dateIso));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!entry;

  useEffect(() => {
    if (entry) {
      setForm({
        calAno: ano,
        calData: dateIso,
        calDescricao: entry.calDescricao || "",
        calDiautil: entry.diaUtil === false ? "N" : "S",
        calFeriado: entry.feriado ? "S" : "N",
        calStatus: "A",
      });
    } else {
      setForm(emptyForm(ano, dateIso));
    }
  }, [ano, dateIso, entry]);

  const save = async () => {
    if (!form.calDescricao?.trim()) {
      setError("Informe a descrição.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (isEdit) {
        await apiJson(`/api/preparacao/calendario-letivo/${ano}/${dateIso}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        await apiJson("/api/preparacao/calendario-letivo", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      await onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!isEdit || !window.confirm("Excluir este lançamento do calendário?")) return;
    setBusy(true);
    setError("");
    try {
      await apiJson(`/api/preparacao/calendario-letivo/${ano}/${dateIso}`, { method: "DELETE" });
      await onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cmd-backdrop open" role="presentation" onClick={onClose}>
      <div
        className="cmd card-pad cardapio-dia-modal"
        role="dialog"
        aria-labelledby="cal-dia-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cardapio-dia-head">
          <div>
            <h2 id="cal-dia-title" className="cardapio-dia-title">
              Calendário · {formatDateBr(dateIso)}
            </h2>
            <p className="cardapio-dia-sub muted">{weekdayLabel(dateIso)}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar">
            <FaIcon icon="fa-x" />
          </button>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="form-grid form-grid--1" style={{ gap: 12 }}>
          <div className="field">
            <label className="field-label">Descrição</label>
            <input
              className="input"
              value={form.calDescricao}
              onChange={(e) => setForm((f) => ({ ...f, calDescricao: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="field-label">Dia útil</label>
            <select
              className="input"
              value={form.calDiautil}
              onChange={(e) => setForm((f) => ({ ...f, calDiautil: e.target.value }))}
            >
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Feriado</label>
            <select
              className="input"
              value={form.calFeriado}
              onChange={(e) => setForm((f) => ({ ...f, calFeriado: e.target.value }))}
            >
              <option value="N">Não</option>
              <option value="S">Sim</option>
            </select>
          </div>
        </div>

        <div className="row gap-2" style={{ marginTop: 16, justifyContent: "flex-end" }}>
          {isEdit && (
            <button type="button" className="btn btn-ghost" onClick={remove} disabled={busy}>
              Excluir
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? "Gravando…" : "Gravar"}
          </button>
        </div>
      </div>
    </div>
  );
}
