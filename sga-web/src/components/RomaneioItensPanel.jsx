import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../api/client";
import { FaIcon } from "./Icon";
import ItensPager, { ITENS_PAGE_SIZE } from "./ItensPager";
import LogisticaItemFormModal from "./LogisticaItemFormModal";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";
import { formatDecimalBr } from "../utils/formatBr";

const PAGE_SIZE = ITENS_PAGE_SIZE;

function emptyForm() {
  return { prodCodigo: "", romanItemQuantidade: "" };
}

function itemToForm(item) {
  return {
    prodCodigo: String(item.prodCodigo ?? ""),
    romanItemQuantidade: String(item.romanItemQuantidade ?? ""),
  };
}

function ConfirmDeleteModal({ item, busy, onCancel, onConfirm }) {
  return (
    <div className="cmd-backdrop open" style={{ zIndex: 1200 }} role="presentation" onClick={onCancel}>
      <div
        className="cmd card-pad"
        role="alertdialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420, padding: "var(--space-5)" }}
      >
        <div className="panel-title" style={{ marginBottom: 12 }}>
          <FaIcon icon="fa-trash" /> Excluir item
        </div>
        <p style={{ marginBottom: 20 }}>
          Deseja excluir o item <strong>{item.prodDescricao || item.prodCodigo}</strong>?
        </p>
        <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onConfirm} disabled={busy}>
            {busy ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RomaneioItensPanel({ romanCodigo, codigoDisplay, readOnly = false }) {
  const { produtos, loading: prodLoading } = useLogisticaReferencias();
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
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const codigo = codigoDisplay ?? romanCodigo;

  const load = useCallback(async () => {
    if (!romanCodigo) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiJson(`/api/logistica/romaneios/${romanCodigo}/itens`, {
        params: { page, limit: PAGE_SIZE, q: qApplied || undefined },
      });
      setItens(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch (err) {
      setError(err.message);
      setItens([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [romanCodigo, page, qApplied]);

  useEffect(() => {
    load();
  }, [load]);

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

  const handleSave = async () => {
    if (!form.prodCodigo) {
      setFormError("Selecione o produto.");
      return;
    }
    if (!form.romanItemQuantidade || Number(form.romanItemQuantidade) <= 0) {
      setFormError("Informe a quantidade.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const payload = {
        prodCodigo: Number(form.prodCodigo),
        romanItemQuantidade: Number(form.romanItemQuantidade),
      };
      const url =
        mode === "edit"
          ? `/api/logistica/romaneios/${romanCodigo}/itens/${form.prodCodigo}`
          : `/api/logistica/romaneios/${romanCodigo}/itens`;
      await apiJson(url, {
        method: mode === "edit" ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setMsg(mode === "edit" ? "Item atualizado." : "Item incluído.");
      closeForm();
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setBusy(true);
    setError("");
    try {
      await apiJson(`/api/logistica/romaneios/${romanCodigo}/itens/${deleteItem.prodCodigo}`, { method: "DELETE" });
      setMsg("Item excluído.");
      if (mode === "edit" && String(form.prodCodigo) === String(deleteItem.prodCodigo)) closeForm();
      setDeleteItem(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="panel-head" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="panel-title">Itens do Romaneio</div>
          <div className="muted" style={{ fontSize: "var(--text-sm)", marginTop: 4 }}>
            Número <strong className="mono tnum">{codigo}</strong>
            {meta?.total != null && (
              <>
                {" · "}
                <strong className="tnum">{meta.total}</strong> item(ns)
              </>
            )}
          </div>
        </div>
        {!readOnly && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={startInsert} disabled={busy || !!mode}>
            <FaIcon icon="fa-plus" /> Incluir
          </button>
        )}
      </div>

      <div className="row gap-2" style={{ marginBottom: 12, flexWrap: "wrap" }}>
        <input
          className="input"
          style={{ maxWidth: 280 }}
          placeholder="Filtrar produto…"
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

      <div className="panel" style={{ marginBottom: 0 }}>
        <div className="table-wrap">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th style={{ width: 72 }}>Código</th>
                <th style={{ width: 100 }}>Unid.</th>
                <th>Descrição</th>
                <th style={{ width: 120, textAlign: "right" }}>Quantidade</th>
                {!readOnly && <th className="col-actions">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={readOnly ? 4 : 5} className="cell-muted">Carregando…</td></tr>
              ) : itens.length === 0 ? (
                <tr><td colSpan={readOnly ? 4 : 5} className="cell-muted">Nenhum item cadastrado.</td></tr>
              ) : (
                itens.map((item) => (
                  <tr key={item.prodCodigo}>
                    <td className="mono tnum cell-strong">{item.prodCodigo}</td>
                    <td className="cell-muted">{item.prodUnidMedCompraDesc ?? item.prodUnidMedCompra ?? "—"}</td>
                    <td>{item.prodDescricao ?? "—"}</td>
                    <td className="tnum" style={{ textAlign: "right" }}>{formatDecimalBr(item.romanItemQuantidade)}</td>
                    {!readOnly && (
                      <td className="col-actions">
                        <div className="row gap-1" style={{ justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title="Alterar item"
                            onClick={() => startEdit(item)}
                            disabled={busy}
                          >
                            <FaIcon icon="fa-pen" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title="Excluir item"
                            onClick={() => setDeleteItem(item)}
                            disabled={busy}
                          >
                            <FaIcon icon="fa-trash" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="panel-foot" style={{ borderTop: "1px solid var(--border)" }}>
          <ItensPager meta={meta} page={page} loading={loading} onPageChange={setPage} />
        </div>
      </div>

      <LogisticaItemFormModal
        open={!!mode && !readOnly}
        title={mode === "edit" ? "Alterar item" : "Incluir item"}
        busy={busy}
        error={formError}
        onClose={closeForm}
        onSave={handleSave}
      >
        <div className="field">
          <label className="field-label">Produto</label>
          <select
            className="input"
            value={form.prodCodigo}
            disabled={mode === "edit" || prodLoading}
            onChange={(e) => setForm((f) => ({ ...f, prodCodigo: e.target.value }))}
          >
            <option value="">Selecione…</option>
            {produtos.map((p) => (
              <option key={p.prodCodigo} value={String(p.prodCodigo)}>
                {p.prodCodigo} — {p.prodDescricao}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label">Quantidade</label>
          <input
            className="input"
            type="number"
            step="0.0001"
            min="0"
            value={form.romanItemQuantidade}
            onChange={(e) => setForm((f) => ({ ...f, romanItemQuantidade: e.target.value }))}
          />
        </div>
      </LogisticaItemFormModal>

      {deleteItem && !readOnly && (
        <ConfirmDeleteModal
          item={deleteItem}
          busy={busy}
          onCancel={() => setDeleteItem(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
