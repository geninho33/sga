import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import ItensPager, { ITENS_PAGE_SIZE } from "../components/ItensPager";
import LogisticaItemFormModal from "../components/LogisticaItemFormModal";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";
import { formatDateBr, formatDecimalBr } from "../utils/formatBr";

const CRO_DIA_OPTIONS = [
  { value: "0", label: "Nenhum" },
  { value: "2", label: "Segunda" },
  { value: "3", label: "Terça" },
  { value: "4", label: "Quarta" },
  { value: "5", label: "Quinta" },
  { value: "6", label: "Sexta" },
  { value: "7", label: "Sábado" },
];

function emptyForm() {
  return { croLocCodigo: "", croDia: "0", croHora: "", croLocQtde: "", croLocSeq: "" };
}

function itemToForm(item) {
  return {
    croLocCodigo: String(item.croLocCodigo ?? ""),
    croDia: String(item.croDia ?? "0"),
    croHora: item.croHora ? String(item.croHora).slice(0, 16) : "",
    croLocQtde: String(item.croLocQtde ?? ""),
    croLocSeq: item.croLocSeq != null ? String(item.croLocSeq) : "",
  };
}

function formatHoraDisplay(croHora) {
  if (!croHora) return "—";
  const s = String(croHora);
  if (s.length >= 16) return `${formatDateBr(s.slice(0, 10))} ${s.slice(11, 16)}`;
  return s.slice(11, 16) || s;
}

export default function CronogramaLocalPage({ croCodigo, onBack }) {
  const { locais, loading: locLoading } = useLogisticaReferencias();
  const [cronograma, setCronograma] = useState(null);
  const [itens, setItens] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    if (!croCodigo) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiJson(`/api/logistica/cronograma/${croCodigo}/locais`, {
        params: { page, limit: ITENS_PAGE_SIZE, q: qApplied || undefined },
      });
      setItens(res.data ?? []);
      setMeta(res.meta ?? null);
      setCronograma(res.cronograma ?? null);
    } catch (err) {
      setError(err.message);
      setItens([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [croCodigo, page, qApplied]);

  useEffect(() => {
    load();
  }, [load]);

  const groupedByDate = useMemo(() => {
    const map = new Map();
    for (const item of itens) {
      const dateKey = item.croHora ? String(item.croHora).slice(0, 10) : `dia-${item.croDia}`;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey).push(item);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [itens]);

  const closeForm = () => {
    setMode(null);
    setForm(emptyForm());
    setFormError("");
  };

  const startInsert = () => {
    setMode("insert");
    setForm(emptyForm());
    setFormError("");
    setMsg("");
  };

  const startEdit = (item) => {
    setMode("edit");
    setForm(itemToForm(item));
    setFormError("");
    setMsg("");
  };

  const itemUrl = (item, method) => {
    const seq = item.croLocSeq ?? 0;
    const base = `/api/logistica/cronograma/${croCodigo}/locais/${item.croLocCodigo}/${item.croDia}/${seq}`;
    return { url: base, method };
  };

  const handleSave = async () => {
    if (!form.croLocCodigo) {
      setFormError("Selecione a unidade educativa.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const payload = {
        croLocCodigo: Number(form.croLocCodigo),
        croDia: form.croDia,
        croHora: form.croHora || null,
        croLocQtde: form.croLocQtde !== "" ? Number(form.croLocQtde) : null,
      };
      if (mode === "edit") payload.croLocSeq = Number(form.croLocSeq) || 0;

      const url =
        mode === "edit"
          ? `/api/logistica/cronograma/${croCodigo}/locais/${form.croLocCodigo}/${form.croDia}/${form.croLocSeq || 0}`
          : `/api/logistica/cronograma/${croCodigo}/locais`;

      await apiJson(url, {
        method: mode === "edit" ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setMsg(mode === "edit" ? "Entrega atualizada." : "Entrega incluída.");
      closeForm();
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Excluir entrega de "${item.locDescricao || item.croLocCodigo}"?`)) return;
    setBusy(true);
    setError("");
    try {
      const { url } = itemUrl(item, "DELETE");
      await apiJson(url, { method: "DELETE" });
      setMsg("Entrega excluída.");
      if (mode === "edit" && String(form.croLocCodigo) === String(item.croLocCodigo)) closeForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="content-inner">
      <Breadcrumb items={["Logística", "Cronograma de Entrega de Produtos", `Grades #${croCodigo}`]} />

      <div className="page-head">
        <div>
          <div className="page-title row gap-2" style={{ alignItems: "center" }}>
            <FaIcon icon="fa-school" /> Grades do Cronograma
          </div>
          <div className="page-desc">
            {cronograma ? (
              <>
                <strong>{cronograma.prodDescricao}</strong>
                {" · "}
                {formatDateBr(cronograma.croDtInicial)} — {formatDateBr(cronograma.croDtFinal)}
                {meta?.total != null && (
                  <>
                    {" · "}
                    <span className="tnum">{meta.total}</span> entrega(s)
                  </>
                )}
              </>
            ) : (
              <span className="mono">trnscronogramalocalWW</span>
            )}
          </div>
        </div>
        <div className="page-actions row gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={startInsert} disabled={busy || !!mode}>
            <FaIcon icon="fa-plus" /> Incluir entrega
          </button>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Retornar
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <div className="row gap-2" style={{ marginBottom: 16, flexWrap: "wrap" }}>
            <input
              className="input"
              style={{ maxWidth: 280 }}
              placeholder="Filtrar unidade educativa…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setQApplied(q);
                }
              }}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPage(1); setQApplied(q); }}>
              Filtrar
            </button>
          </div>

          {(error || msg) && (
            <p style={{ color: error ? "var(--danger-fg)" : "var(--success-fg)", fontSize: "var(--text-sm)", marginBottom: 12 }}>
              {error || msg}
            </p>
          )}

          {loading ? (
            <p className="muted">Carregando grades…</p>
          ) : itens.length === 0 ? (
            <p className="muted">Nenhuma entrega cadastrada.</p>
          ) : (
            <div className="cro-grades-grid">
              {groupedByDate.map(([dateKey, rows]) => (
                <section key={dateKey} className="cro-grade-card panel" style={{ marginBottom: 12, padding: 0 }}>
                  <div className="panel-head card-pad" style={{ borderBottom: "1px solid var(--border)", marginBottom: 0 }}>
                    <FaIcon icon="fa-calendar-alt" />
                    <strong style={{ marginLeft: 8 }}>
                      {dateKey.startsWith("dia-")
                        ? CRO_DIA_OPTIONS.find((o) => o.value === dateKey.slice(4))?.label ?? dateKey
                        : formatDateBr(dateKey)}
                    </strong>
                    <span className="muted" style={{ marginLeft: 8, fontSize: "var(--text-sm)" }}>
                      {rows.length} entrega(s)
                    </span>
                  </div>
                  <div className="table-wrap">
                    <table className="table table-zebra" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Unidade Educativa</th>
                          <th>Dia</th>
                          <th>Horário</th>
                          <th className="tnum">Quantidade</th>
                          <th>Rota</th>
                          <th className="col-actions" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((item) => (
                          <tr key={`${item.croLocCodigo}-${item.croDia}-${item.croLocSeq}-${item.croHora}`}>
                            <td>{item.locDescricao ?? item.croLocCodigo}</td>
                            <td>{item.croDiaLabel ?? item.croDia}</td>
                            <td>{formatHoraDisplay(item.croHora)}</td>
                            <td className="tnum">{formatDecimalBr(item.croLocQtde)}</td>
                            <td>{item.rotaDescricao ?? "—"}</td>
                            <td className="col-actions">
                              <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
                                <button type="button" className="btn btn-ghost btn-sm" title="Editar" onClick={() => startEdit(item)}>
                                  <FaIcon icon="fa-pen" />
                                </button>
                                <button type="button" className="btn btn-ghost btn-sm" title="Excluir" onClick={() => handleDelete(item)}>
                                  <FaIcon icon="fa-trash" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          )}

          <ItensPager meta={meta} page={page} onPageChange={setPage} />
        </div>
      </div>

      {mode && (
        <LogisticaItemFormModal
          open={!!mode}
          title={mode === "edit" ? "Alterar entrega" : "Incluir entrega"}
          busy={busy}
          error={formError}
          onClose={closeForm}
          onSave={handleSave}
        >
          <div className="field">
            <label className="field-label">Unidade Educativa</label>
            <select
              className="input"
              value={form.croLocCodigo}
              disabled={mode === "edit" || locLoading}
              onChange={(e) => setForm((f) => ({ ...f, croLocCodigo: e.target.value }))}
            >
              <option value="">Selecione…</option>
              {locais.map((l) => (
                <option key={l.locCodigo} value={String(l.locCodigo)}>
                  {l.locCodigo} — {l.locDescricao}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Dia da Semana</label>
            <select
              className="input"
              value={form.croDia}
              disabled={mode === "edit"}
              onChange={(e) => setForm((f) => ({ ...f, croDia: e.target.value }))}
            >
              {CRO_DIA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Data / Horário</label>
            <input
              className="input"
              type="datetime-local"
              value={form.croHora}
              onChange={(e) => setForm((f) => ({ ...f, croHora: e.target.value }))}
            />
            {mode === "insert" && (
              <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                É possível incluir várias entregas na mesma data — cada horário gera um registro independente.
              </p>
            )}
          </div>
          <div className="field">
            <label className="field-label">Quantidade</label>
            <input
              className="input"
              type="number"
              step="0.0001"
              value={form.croLocQtde}
              onChange={(e) => setForm((f) => ({ ...f, croLocQtde: e.target.value }))}
            />
          </div>
        </LogisticaItemFormModal>
      )}

      <style>{`
        .cro-grades-grid { display: flex; flex-direction: column; gap: 0; }
        .cro-grade-card .panel-head { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
      `}</style>
    </div>
  );
}
