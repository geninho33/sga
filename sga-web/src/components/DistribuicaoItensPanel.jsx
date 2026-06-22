import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../api/client";
import { FaIcon } from "./Icon";
import ItensPager, { ITENS_PAGE_SIZE } from "./ItensPager";
import LogisticaItemFormModal from "./LogisticaItemFormModal";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";
import { formatDateBr, formatDecimalBr } from "../utils/formatBr";
import { PRODUTO_STATUS } from "../data/modules";

function emptyForm() {
  return {
    distItemProduto: "",
    distItemQuantidade: "",
    distItemStatus: "A",
    distItemValidade: "",
    distItemLote: "",
  };
}

function itemToForm(item) {
  return {
    distItemProduto: String(item.distItemProduto ?? ""),
    distItemQuantidade: String(item.distItemQuantidade ?? ""),
    distItemStatus: item.distItemStatus === "I" ? "I" : "A",
    distItemValidade: item.distItemValidade ? String(item.distItemValidade).slice(0, 10) : "",
    distItemLote: item.distItemLote ?? "",
  };
}

export default function DistribuicaoItensPanel({
  distCodigo,
  codigoDisplay,
  destinoNome,
  readOnly = false,
}) {
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
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const codigo = codigoDisplay ?? distCodigo;

  const load = useCallback(async () => {
    if (!distCodigo) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiJson(`/api/logistica/distribuicoes/${distCodigo}/itens`, {
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
  }, [distCodigo, page, qApplied]);

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
    if (!form.distItemProduto) {
      setFormError("Selecione o produto.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const payload = {
        distItemProduto: Number(form.distItemProduto),
        distItemQuantidade: Number(form.distItemQuantidade) || 0,
        distItemStatus: form.distItemStatus,
        distItemValidade: form.distItemValidade || null,
        distItemLote: form.distItemLote || null,
      };
      const url =
        mode === "edit"
          ? `/api/logistica/distribuicoes/${distCodigo}/itens/${form.distItemProduto}`
          : `/api/logistica/distribuicoes/${distCodigo}/itens`;
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
    if (!window.confirm(`Excluir o item "${item.distItemProdutoDescricao || item.distItemProduto}"?`)) return;
    setBusy(true);
    setError("");
    try {
      await apiJson(`/api/logistica/distribuicoes/${distCodigo}/itens/${item.distItemProduto}`, { method: "DELETE" });
      setMsg("Item excluído.");
      if (mode === "edit" && String(form.distItemProduto) === String(item.distItemProduto)) closeForm();
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
          <div className="panel-title">trnsdistribuicaoitensWW</div>
          <div className="muted" style={{ fontSize: "var(--text-sm)", marginTop: 4 }}>
            Código <strong className="mono tnum">{codigo}</strong>
            {destinoNome && (
              <>
                {" · "}
                Destino <strong>{destinoNome}</strong>
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
                  <th>Quantidade</th>
                  <th>Situação</th>
                  <th>Validade</th>
                  <th>Lote</th>
                  {!readOnly && <th />}
                </tr>
              </thead>
              <tbody>
                {itens.length === 0 ? (
                  <tr><td colSpan={readOnly ? 6 : 7} className="muted">Nenhum item.</td></tr>
                ) : (
                  itens.map((i) => {
                    const st = PRODUTO_STATUS[i.distItemStatus] || PRODUTO_STATUS.A;
                    return (
                      <tr key={i.distItemProduto}>
                        <td>{i.distItemProdutoDescricao || i.distItemProduto}</td>
                        <td>{i.distItemProdutoUN}</td>
                        <td className="tnum">{formatDecimalBr(i.distItemQuantidade, 4)}</td>
                        <td><span className={"badge " + st.cls}><span className="dot" />{st.label}</span></td>
                        <td>{formatDateBr(i.distItemValidade) || "—"}</td>
                        <td>{i.distItemLote || "—"}</td>
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
                    );
                  })
                )}
              </tbody>
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
            value={form.distItemProduto}
            disabled={mode === "edit" || prodLoading}
            onChange={(e) => setForm((f) => ({ ...f, distItemProduto: e.target.value }))}
          >
            <option value="">Selecione…</option>
            {produtos.map((p) => (
              <option key={p.prodCodigo} value={String(p.prodCodigo)}>{p.prodDescricao}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label">Quantidade</label>
          <input className="input tnum" type="number" min="0" step="0.0001" value={form.distItemQuantidade} onChange={(e) => setForm((f) => ({ ...f, distItemQuantidade: e.target.value }))} />
        </div>
        <div className="field">
          <label className="field-label">Situação</label>
          <select className="input" value={form.distItemStatus} onChange={(e) => setForm((f) => ({ ...f, distItemStatus: e.target.value }))}>
            <option value="A">Ativo</option>
            <option value="I">Inativo</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label">Validade</label>
          <input className="input" type="date" value={form.distItemValidade} onChange={(e) => setForm((f) => ({ ...f, distItemValidade: e.target.value }))} />
        </div>
        <div className="field">
          <label className="field-label">Lote</label>
          <input className="input" value={form.distItemLote} onChange={(e) => setForm((f) => ({ ...f, distItemLote: e.target.value }))} />
        </div>
      </LogisticaItemFormModal>
    </div>
  );
}
