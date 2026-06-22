import { useEffect, useState } from "react";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import { getWwModuleById } from "../data/wwModules";

export default function LancarQtdeFixaPage({ onBack }) {
  const module = getWwModuleById("qtde-fixa");
  const [produtos, setProdutos] = useState([]);
  const [prodCodigo, setProdCodigo] = useState("");
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    apiJson("/api/preparacao/referencias")
      .then((res) => setProdutos([]))
      .catch(() => {});
    apiJson("/api/produtos", { params: { status: "A", limit: 500, orderBy: "prodDescricao" } })
      .then((res) => setProdutos(res.data ?? []))
      .catch(() => {});
  }, []);

  const load = async () => {
    if (!prodCodigo) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson("/api/operacional/qtde-fixa", { params: { prodCodigo } });
      setData(res.data);
      const map = {};
      for (const row of res.data?.locais ?? []) {
        if (row.estoUeCodigo) map[row.locCodigo] = row.estoUEQtdeFixa ?? "";
      }
      setEdit(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prodCodigo) load();
  }, [prodCodigo]);

  const handleSave = async () => {
    if (!data?.locais?.length) return;
    setSaving(true);
    try {
      const items = data.locais.map((r) => ({
        locCodigo: r.locCodigo,
        estoUEQtdeFixa: Number(edit[r.locCodigo]) || 0,
      }));
      const res = await apiJson("/api/operacional/qtde-fixa/salvar", {
        method: "POST",
        body: JSON.stringify({ prodCodigo: Number(prodCodigo), items }),
      });
      setMsg(`${res.data?.updated ?? 0} local(is) atualizado(s).`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-inner" style={{ maxWidth: 1100 }}>
      <Breadcrumb items={[module?.breadcrumbSection, module?.title]} />
      <div className="page-head">
        <div>
          <div className="page-title">{module?.title}</div>
          <div className="page-desc"><span className="mono">WPLancarQtdeFixa</span></div>
        </div>
        {onBack && <button type="button" className="btn btn-ghost" onClick={onBack}>Voltar</button>}
      </div>

      <div className="panel" style={{ marginBottom: "var(--space-4)" }}>
        <div className="panel-body">
          <div className="field" style={{ maxWidth: 420 }}>
            <label className="field-label">Produto</label>
            <select className="input" value={prodCodigo} onChange={(e) => setProdCodigo(e.target.value)}>
              <option value="">Selecione…</option>
              {produtos.map((p) => (
                <option key={p.prodCodigo} value={p.prodCodigo}>{p.prodDescricao}</option>
              ))}
            </select>
          </div>
          {data?.produto && (
            <p className="muted" style={{ marginTop: 8, fontSize: "var(--text-sm)" }}>
              Unidade: {data.produto.uniDescricao || "—"}
            </p>
          )}
        </div>
      </div>

      {(error || msg) && <p style={{ color: error ? "var(--danger-fg)" : "var(--success-fg)" }}>{error || msg}</p>}

      {loading ? (
        <p className="muted">Carregando locais…</p>
      ) : data?.locais?.length ? (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Locais / quantidade fixa</span>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              <FaIcon icon="fa-check" /> Salvar
            </button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Local</th><th>Saldo</th><th>Qtde fixa</th></tr></thead>
              <tbody>
                {data.locais.map((r) => (
                  <tr key={r.locCodigo}>
                    <td className="cell-strong">{r.locDescricao}</td>
                    <td className="tnum">{r.estoUeSaldo ?? "—"}</td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        step="any"
                        style={{ width: 100 }}
                        value={edit[r.locCodigo] ?? ""}
                        onChange={(e) => setEdit((m) => ({ ...m, [r.locCodigo]: e.target.value }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : prodCodigo ? (
        <p className="muted">Nenhum local ativo encontrado.</p>
      ) : null}
    </div>
  );
}
