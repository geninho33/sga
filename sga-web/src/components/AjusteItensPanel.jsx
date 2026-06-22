import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../api/client";
import { FaIcon } from "./Icon";
import ItensPager, { ITENS_PAGE_SIZE } from "./ItensPager";
import LogisticaItemFormModal from "./LogisticaItemFormModal";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";
import { formatDecimalBr } from "../utils/formatBr";

const PAGE_SIZE = ITENS_PAGE_SIZE;

function emptyForm() {
  return { prodCodigo: "", ajusItemQuantidade: "" };
}

export default function AjusteItensPanel({ ajusCodigo, readOnly = false }) {
  const { produtos, loading: prodLoading } = useLogisticaReferencias();
  const [itens, setItens] = useState([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    if (!ajusCodigo) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiJson(`/api/estoque/ajustes/${ajusCodigo}/itens`, { params: { q: q || undefined } });
      setItens(res.data ?? []);
    } catch (err) {
      setError(err.message);
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, [ajusCodigo, q]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = itens;
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const saveItem = async () => {
    const prodCodigo = Number(form.prodCodigo);
    const qtd = Number(form.ajusItemQuantidade);
    if (!prodCodigo) { setFormError("Selecione o produto."); return; }
    if (!qtd || qtd <= 0) { setFormError("Informe a quantidade."); return; }
    setBusy(true);
    setFormError("");
    try {
      await apiJson(`/api/estoque/ajustes/${ajusCodigo}/itens`, {
        method: "POST",
        body: JSON.stringify({ prodCodigo, ajusItemQuantidade: qtd }),
      });
      setMode(null);
      setForm(emptyForm());
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (prodCodigo) => {
    if (!window.confirm("Excluir item?")) return;
    setBusy(true);
    try {
      await apiJson(`/api/estoque/ajustes/${ajusCodigo}/itens/${prodCodigo}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <div className="panel-head row between wrap gap-2">
        <span className="panel-title">Itens do ajuste</span>
        {!readOnly && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => { setMode("add"); setForm(emptyForm()); }}>
            <FaIcon icon="fa-plus" /> Incluir item
          </button>
        )}
      </div>
      <div className="panel-body">
        {error && <p style={{ color: "var(--danger-fg)" }}>{error}</p>}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th><th>Descrição</th><th>Saldo</th><th>Quantidade</th>
                {!readOnly && <th />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="cell-muted" style={{ textAlign: "center" }}>Carregando…</td></tr>
              ) : !pageItems.length ? (
                <tr><td colSpan={5} className="cell-muted" style={{ textAlign: "center" }}>Nenhum item.</td></tr>
              ) : pageItems.map((item) => (
                <tr key={item.prodCodigo}>
                  <td className="tnum">{item.prodCodigo}</td>
                  <td>{item.prodDescricao}</td>
                  <td className="tnum">{formatDecimalBr(item.ajusItemSaldo)}</td>
                  <td className="tnum">{formatDecimalBr(item.ajusItemQuantidade)}</td>
                  {!readOnly && (
                    <td>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeItem(item.prodCodigo)} disabled={busy}>
                        <FaIcon icon="fa-trash" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ItensPager meta={{ total: filtered.length, totalPages: Math.ceil(filtered.length / PAGE_SIZE) || 1 }} page={page} onPageChange={setPage} loading={loading} />
      </div>
      {mode && (
        <LogisticaItemFormModal
          open
          title="Item do ajuste"
          busy={busy}
          error={formError}
          onClose={() => setMode(null)}
          onSave={saveItem}
        >
          <div className="field">
            <label className="field-label">Produto</label>
            <select className="input" value={form.prodCodigo} disabled={prodLoading} onChange={(e) => setForm((f) => ({ ...f, prodCodigo: e.target.value }))}>
              <option value="">Selecione…</option>
              {produtos.map((p) => (
                <option key={p.prodCodigo} value={String(p.prodCodigo)}>{p.prodCodigo} — {p.prodDescricao}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Quantidade</label>
            <input type="number" className="input" value={form.ajusItemQuantidade} onChange={(e) => setForm((f) => ({ ...f, ajusItemQuantidade: e.target.value }))} />
          </div>
        </LogisticaItemFormModal>
      )}
    </div>
  );
}
