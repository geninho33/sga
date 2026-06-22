import { useEffect, useMemo, useState } from "react";
import { apiJson } from "../api/client";
import { FaIcon } from "./Icon";

const TURNO_GRUPO_DEFAULT = [
  { value: 1, label: "Matutino" },
  { value: 2, label: "Vespertino" },
  { value: 3, label: "Noturno" },
  { value: 4, label: "Integral" },
  { value: 5, label: "Interm. Matutino" },
  { value: 6, label: "Interm. Vespertino" },
];

function formatPercapta(value) {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function emptyPercaptaForm() {
  return {
    pratIngrProdCodigo: "",
    AreEnsCodigo: "",
    AreEnsSequencial: "",
    carGruTurno: "",
    pratIngrQuantidade: "",
  };
}

function percaptaRowKey(r) {
  return `${r.pratIngrProdCodigo}-${r.AreEnsCodigo}-${r.AreEnsSequencial}-${r.carGruTurno}`;
}

export default function PratoPercaptaModal({
  pratoCodigo,
  pratoDescricao,
  areasEnsino = [],
  etapasEnsino = [],
  produtos = [],
  turnoGrupo = TURNO_GRUPO_DEFAULT,
  onClose,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyPercaptaForm);
  const [editingKey, setEditingKey] = useState(null);

  function isEditingRow(r) {
    return editingKey === percaptaRowKey(r);
  }

  const etapasFiltradas = useMemo(() => {
    const area = Number(form.AreEnsCodigo);
    if (!area) return etapasEnsino;
    return etapasEnsino.filter((e) => Number(e.AreEnsCodigo) === area);
  }, [etapasEnsino, form.AreEnsCodigo]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiJson(`/api/preparacao/pratos/${pratoCodigo}/ingredientes`);
      setItems(res.data ?? []);
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [pratoCodigo]);

  const cancelEdit = () => {
    setEditingKey(null);
    setForm(emptyPercaptaForm());
    setError("");
  };

  const startEdit = (row) => {
    setEditingKey(percaptaRowKey(row));
    setForm({
      pratIngrProdCodigo: String(row.pratIngrProdCodigo),
      AreEnsCodigo: String(row.AreEnsCodigo),
      AreEnsSequencial: String(row.AreEnsSequencial),
      carGruTurno: String(row.carGruTurno),
      pratIngrQuantidade: String(row.pratIngrQuantidade ?? ""),
    });
    setError("");
  };

  const save = async () => {
    if (!form.pratIngrProdCodigo || !form.AreEnsCodigo || form.AreEnsSequencial === "" || !form.carGruTurno) {
      setError("Preencha ingrediente, área, etapa e turno.");
      return;
    }
    if (form.pratIngrQuantidade === "" || Number.isNaN(Number(form.pratIngrQuantidade))) {
      setError("Informe a percapta.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiJson(`/api/preparacao/pratos/${pratoCodigo}/ingredientes`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      cancelEdit();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    if (editingKey === percaptaRowKey(row)) cancelEdit();
    if (!window.confirm("Excluir este ingrediente?")) return;
    setBusy(true);
    setError("");
    try {
      await apiJson(
        `/api/preparacao/pratos/${pratoCodigo}/ingredientes/${row.pratIngrProdCodigo}/${row.AreEnsCodigo}/${row.AreEnsSequencial}/${row.carGruTurno}`,
        { method: "DELETE" }
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cmd-backdrop open cardapio-percapta-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cmd card-pad cardapio-percapta-modal"
        role="dialog"
        aria-labelledby="percapta-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cardapio-dia-head">
          <div>
            <h2 id="percapta-title" className="cardapio-dia-title">Percapta por área</h2>
            <p className="muted cardapio-dia-sub">{pratoDescricao}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar">
            <FaIcon icon="fa-x" />
          </button>
        </div>

        <p className="cardapio-percapta-hint muted">
          trnspratosingredientesWW · percapta em kg (ex.: 40 g = 0,0400)
        </p>

        <div className="cardapio-percapta-scroll">
          {loading ? (
            <p className="muted">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="muted">Nenhum ingrediente cadastrado.</p>
          ) : (
            <table className="table table-compact cardapio-percapta-table">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Área / Etapa</th>
                  <th>Turno</th>
                  <th>Percapta</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr
                    key={percaptaRowKey(r)}
                    className={isEditingRow(r) ? "cardapio-percapta-row--editing" : undefined}
                  >
                    <td>{r.prodDescricao}</td>
                    <td>
                      {[r.AreEnsNome, r.AreEnsEtapaNome].filter(Boolean).join(" · ") ||
                        `${r.AreEnsCodigo}/${r.AreEnsSequencial}`}
                    </td>
                    <td>{r.carGruTurnoDesc || r.carGruTurno}</td>
                    <td className="mono">{formatPercapta(r.pratIngrQuantidade)}</td>
                    <td className="cardapio-percapta-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busy}
                        onClick={() => startEdit(r)}
                        title="Alterar"
                      >
                        <FaIcon icon="fa-pen" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busy}
                        onClick={() => remove(r)}
                        title="Excluir"
                      >
                        <FaIcon icon="fa-x" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="cardapio-percapta-add">
          {editingKey ? (
            <p className="cardapio-percapta-edit-banner muted">
              <FaIcon icon="fa-pen" /> Alterando registro — chave bloqueada; ajuste a percapta e salve.
            </p>
          ) : null}
          <select
            className="input input-sm"
            value={form.pratIngrProdCodigo}
            disabled={busy || !!editingKey}
            onChange={(e) => setForm((f) => ({ ...f, pratIngrProdCodigo: e.target.value }))}
          >
            <option value="">Ingrediente…</option>
            {produtos.map((p) => (
              <option key={p.prodCodigo} value={String(p.prodCodigo)}>{p.prodDescricao}</option>
            ))}
          </select>
          <select
            className="input input-sm"
            value={form.AreEnsCodigo}
            disabled={busy || !!editingKey}
            onChange={(e) => setForm((f) => ({ ...f, AreEnsCodigo: e.target.value, AreEnsSequencial: "" }))}
          >
            <option value="">Área…</option>
            {areasEnsino.map((a) => (
              <option key={a.AreEnsCodigo} value={String(a.AreEnsCodigo)}>{a.AreEnsNome}</option>
            ))}
          </select>
          <select
            className="input input-sm"
            value={form.AreEnsSequencial}
            disabled={busy || !form.AreEnsCodigo || !!editingKey}
            onChange={(e) => setForm((f) => ({ ...f, AreEnsSequencial: e.target.value }))}
          >
            <option value="">Etapa…</option>
            {etapasFiltradas.map((e) => (
              <option key={`${e.AreEnsCodigo}-${e.AreEnsSequencial}`} value={String(e.AreEnsSequencial)}>
                {e.AreEnsEtapaNome || e.AreEnsSequencial}
              </option>
            ))}
          </select>
          <select
            className="input input-sm"
            value={form.carGruTurno}
            disabled={busy || !!editingKey}
            onChange={(e) => setForm((f) => ({ ...f, carGruTurno: e.target.value }))}
          >
            <option value="">Turno…</option>
            {turnoGrupo.map((t) => (
              <option key={t.value} value={String(t.value)}>{t.label}</option>
            ))}
          </select>
          <input
            className="input input-sm"
            type="number"
            step="0.0001"
            placeholder="Percapta"
            value={form.pratIngrQuantidade}
            disabled={busy}
            onChange={(e) => setForm((f) => ({ ...f, pratIngrQuantidade: e.target.value }))}
          />
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={save} title={editingKey ? "Salvar alteração" : "Incluir"}>
            <FaIcon icon={editingKey ? "fa-check" : "fa-plus"} />
          </button>
          {editingKey ? (
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={cancelEdit}>
              Fechar
            </button>
          ) : null}
        </div>

        {error ? <p className="cardapio-dia-error">{error}</p> : null}
      </div>
    </div>
  );
}
