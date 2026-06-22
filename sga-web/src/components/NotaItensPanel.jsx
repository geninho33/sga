import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson } from "../api/client";
import { FaIcon } from "./Icon";
import ItensPager, { ITENS_PAGE_SIZE } from "./ItensPager";
import LogisticaItemFormModal from "./LogisticaItemFormModal";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";
import { useProdutoReferencias } from "../hooks/useProdutoReferencias";
import { formatCurrencyBr, formatDateBr, formatDecimalBr } from "../utils/formatBr";

function emptyForm() {
  return {
    notaItemProduto: "",
    notaItemProdutoUnidade: "",
    notaItemQtde: "",
    notaItemValor: "",
    notaItemValidade: "",
    notaItemLote: "",
  };
}

function itemToForm(item) {
  return {
    notaItemProduto: String(item.notaItemProduto ?? ""),
    notaItemProdutoUnidade: String(item.notaItemProdutoUnidade ?? ""),
    notaItemQtde: String(item.notaItemQtde ?? ""),
    notaItemValor: String(item.notaItemValor ?? ""),
    notaItemValidade: item.notaItemValidade ? String(item.notaItemValidade).slice(0, 10) : "",
    notaItemLote: item.notaItemLote ?? "",
  };
}

export default function NotaItensPanel({
  notaCodigo,
  codigoDisplay,
  fornecedorNome,
  readOnly = false,
}) {
  const { produtos, loading: prodLoading } = useLogisticaReferencias();
  const { unidades } = useProdutoReferencias();
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

  const codigo = codigoDisplay ?? notaCodigo;

  const load = useCallback(async () => {
    if (!notaCodigo) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiJson(`/api/logistica/compras/${notaCodigo}/itens`, {
        params: { page, limit: ITENS_PAGE_SIZE, q: qApplied || undefined },
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
  }, [notaCodigo, page, qApplied]);

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

  const onProdutoChange = (prodCodigo) => {
    const prod = produtos.find((p) => String(p.prodCodigo) === String(prodCodigo));
    setForm((f) => ({
      ...f,
      notaItemProduto: prodCodigo,
      notaItemProdutoUnidade: prod?.prodUnidMedCompra ? String(prod.prodUnidMedCompra) : f.notaItemProdutoUnidade,
    }));
  };

  const handleSave = async () => {
    if (!form.notaItemProduto) {
      setFormError("Selecione o produto.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const payload = {
        notaItemProduto: Number(form.notaItemProduto),
        notaItemProdutoUnidade: Number(form.notaItemProdutoUnidade) || undefined,
        notaItemQtde: Number(form.notaItemQtde) || 0,
        notaItemValor: Number(form.notaItemValor) || 0,
        notaItemValidade: form.notaItemValidade || null,
        notaItemLote: form.notaItemLote || null,
      };
      const url =
        mode === "edit"
          ? `/api/logistica/compras/${notaCodigo}/itens/${form.notaItemProduto}`
          : `/api/logistica/compras/${notaCodigo}/itens`;
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

  const handleDelete = async (item) => {
    if (!window.confirm(`Excluir o item "${item.notaItemProdutoDescricao || item.notaItemProduto}"?`)) return;
    setBusy(true);
    setError("");
    try {
      await apiJson(`/api/logistica/compras/${notaCodigo}/itens/${item.notaItemProduto}`, { method: "DELETE" });
      setMsg("Item excluído.");
      if (mode === "edit" && String(form.notaItemProduto) === String(item.notaItemProduto)) closeForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const totalPagina = useMemo(
    () => itens.reduce((s, i) => s + (Number(i.notaItemTotal) || 0), 0),
    [itens]
  );

  const totalItem = useMemo(() => {
    const qtde = Number(form.notaItemQtde) || 0;
    const valor = Number(form.notaItemValor) || 0;
    return qtde * valor;
  }, [form.notaItemQtde, form.notaItemValor]);

  return (
    <div>
      <div className="panel-head" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="panel-title">trnsnotaitensWW</div>
          <div className="muted" style={{ fontSize: "var(--text-sm)", marginTop: 4 }}>
            Código <strong className="mono tnum">{codigo}</strong>
            {fornecedorNome && (
              <>
                {" · "}
                Fornecedor <strong>{fornecedorNome}</strong>
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
          Buscar
        </button>
      </div>

      {(error || msg) && (
        <p style={{ color: error ? "var(--danger-fg)" : "var(--success-fg)", marginBottom: 12 }}>{error || msg}</p>
      )}

      {loading ? (
        <p className="muted">Carregando itens…</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>UN</th>
                  <th>Qtde</th>
                  <th>Valor</th>
                  <th>Total</th>
                  <th>Validade</th>
                  <th>Lote</th>
                  {!readOnly && <th />}
                </tr>
              </thead>
              <tbody>
                {itens.length === 0 ? (
                  <tr><td colSpan={readOnly ? 7 : 8} className="muted">Nenhum item.</td></tr>
                ) : (
                  itens.map((i) => (
                    <tr key={i.notaItemProduto}>
                      <td>{i.notaItemProdutoDescricao || i.notaItemProduto}</td>
                      <td>{i.notaItemProdutoUnidadeDesc || i.notaItemProdutoUnidade}</td>
                      <td className="tnum">{formatDecimalBr(i.notaItemQtde, 4)}</td>
                      <td className="tnum">{formatCurrencyBr(i.notaItemValor)}</td>
                      <td className="tnum">{formatCurrencyBr(i.notaItemTotal)}</td>
                      <td>{formatDateBr(i.notaItemValidade) || "—"}</td>
                      <td>{i.notaItemLote || "—"}</td>
                      {!readOnly && (
                        <td>
                          <div className="row gap-1">
                            <button type="button" className="btn btn-ghost btn-sm" title="Alterar" onClick={() => startEdit(i)} disabled={busy}>
                              <FaIcon icon="fa-pen" />
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm" title="Excluir" onClick={() => handleDelete(i)} disabled={busy}>
                              <FaIcon icon="fa-trash" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
              {itens.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={4} className="muted">Total desta página</td>
                    <td className="tnum"><strong>{formatCurrencyBr(totalPagina)}</strong></td>
                    <td colSpan={readOnly ? 2 : 3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <ItensPager meta={meta} page={page} loading={loading} onPageChange={setPage} />
        </>
      )}

      <LogisticaItemFormModal
        open={!!mode && !readOnly}
        title={mode === "insert" ? "Incluir item" : "Alterar item"}
        error={formError}
        busy={busy}
        onClose={closeForm}
        onSave={handleSave}
      >
        <div className="field">
          <label className="field-label">Produto</label>
          <select
            className="input"
            value={form.notaItemProduto}
            disabled={mode === "edit" || prodLoading}
            onChange={(e) => onProdutoChange(e.target.value)}
          >
            <option value="">Selecione…</option>
            {produtos.map((p) => (
              <option key={p.prodCodigo} value={String(p.prodCodigo)}>{p.prodDescricao}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label">Unidade</label>
          <select
            className="input"
            value={form.notaItemProdutoUnidade}
            onChange={(e) => setForm((f) => ({ ...f, notaItemProdutoUnidade: e.target.value }))}
          >
            <option value="">—</option>
            {unidades.map((u) => (
              <option key={u.uniCodigo} value={String(u.uniCodigo)}>{u.uniDescricao}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label">Quantidade</label>
          <input className="input tnum" type="number" min="0" step="0.0001" value={form.notaItemQtde} onChange={(e) => setForm((f) => ({ ...f, notaItemQtde: e.target.value }))} />
        </div>
        <div className="field">
          <label className="field-label">Valor unitário</label>
          <input className="input tnum" type="number" min="0" step="0.01" value={form.notaItemValor} onChange={(e) => setForm((f) => ({ ...f, notaItemValor: e.target.value }))} />
        </div>
        <div className="field">
          <label className="field-label">Total (Qtde × Valor)</label>
          <div className="input tnum" style={{ background: "var(--surface-2)", fontWeight: 600 }}>
            {formatCurrencyBr(totalItem)}
          </div>
        </div>
        <div className="field">
          <label className="field-label">Validade</label>
          <input className="input" type="date" value={form.notaItemValidade} onChange={(e) => setForm((f) => ({ ...f, notaItemValidade: e.target.value }))} />
        </div>
        <div className="field">
          <label className="field-label">Lote</label>
          <input className="input" value={form.notaItemLote} onChange={(e) => setForm((f) => ({ ...f, notaItemLote: e.target.value }))} />
        </div>
      </LogisticaItemFormModal>
    </div>
  );
}
