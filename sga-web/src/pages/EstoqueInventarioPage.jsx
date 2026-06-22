import { useCallback, useState } from "react";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import WizardProgressModal from "../components/wizard/WizardProgressModal";
import { formatDecimalBr } from "../utils/formatBr";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";

const CLASSIFICACOES = [
  ["", "Todas"],
  ["2", "Perecíveis"],
  ["4", "Semi-perecíveis"],
  ["3", "Não perecíveis"],
];

export default function EstoqueInventarioPage({ onBack }) {
  const { produtos } = useLogisticaReferencias();
  const grupos = [...new Map(produtos.filter((p) => p.prodTipo).map((p) => [p.prodTipo, p.prodGrupdescricao || p.prodTipo])).entries()];
  const [filters, setFilters] = useState({ grupo: "", classificacao: "", nome: "" });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [edit, setEdit] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const buscar = useCallback(async () => {
    setLoading(true);
    setProgress(15);
    setError(null);
    setMsg(null);
    const timer = setInterval(() => setProgress((p) => (p >= 90 ? p : p + 5)), 150);
    try {
      const res = await apiJson("/api/estoque/inventario", { params: filters });
      setRows(res.data ?? []);
      setMeta(res.meta);
      const map = {};
      for (const r of res.data ?? []) map[r.prodCodigo] = r.prodLocalSaldo;
      setEdit(map);
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => { setLoading(false); setProgress(0); }, 250);
    }
  }, [filters]);

  const salvar = async () => {
    setSaving(true);
    setError(null);
    try {
      const items = rows.map((r) => ({
        prodCodigo: r.prodCodigo,
        prodLocalSaldo: Number(edit[r.prodCodigo] ?? r.prodLocalSaldo),
        prodLocalCodigo: r.prodLocalCodigo,
      }));
      const res = await apiJson("/api/estoque/inventario/salvar", {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      setMsg(res.message || "Salvo.");
      await buscar();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-inner">
      <Breadcrumb items={["Estoque", "Inventário"]} />
      <WizardProgressModal open={loading} title="Buscando produtos" progress={progress} message="Carregando inventário…" />
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-head row between wrap gap-2">
          <h1 className="panel-title">Inventário de Produtos</h1>
          {onBack && <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}><FaIcon icon="fa-arrow-left" /> Voltar</button>}
        </div>
        <div className="panel-body">
          <div className="estoque-filter-inline">
            <label className="field-compact"><span>Grupo</span>
              <select className="input input-sm" value={filters.grupo} onChange={(e) => setFilters((f) => ({ ...f, grupo: e.target.value }))}>
                <option value="">Todos</option>
                {grupos.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="field-compact"><span>Classificação</span>
              <select className="input input-sm" value={filters.classificacao} onChange={(e) => setFilters((f) => ({ ...f, classificacao: e.target.value }))}>
                {CLASSIFICACOES.map(([v, l]) => <option key={v || "all"} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="field-compact"><span>Produto</span>
              <input className="input input-sm" placeholder="Contém…" value={filters.nome} onChange={(e) => setFilters((f) => ({ ...f, nome: e.target.value }))} />
            </label>
            <button type="button" className="btn btn-primary btn-sm" onClick={buscar} disabled={loading}><FaIcon icon="fa-search" /> Buscar</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={salvar} disabled={saving || !rows.length}><FaIcon icon="fa-save" /> Salvar</button>
          </div>
          {meta?.localNome && <p className="muted" style={{ fontSize: "var(--text-sm)", marginTop: 8 }}>Local: {meta.localNome}</p>}
        </div>
      </div>
      {error && <div className="panel panel-body" style={{ color: "var(--danger-fg)", marginBottom: 12 }}>{error}</div>}
      {msg && <div className="panel panel-body" style={{ color: "var(--success-fg)", marginBottom: 12 }}>{msg}</div>}
      <div className="panel table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th><th>Descrição</th><th>Grupo</th><th>UN</th><th>Mín.</th><th>Quantidade</th><th>Máx.</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr><td colSpan={7} className="cell-muted" style={{ textAlign: "center", padding: 24 }}>Busque os produtos para inventariar.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.prodCodigo}>
                <td className="tnum">{r.prodCodigo}</td>
                <td>{r.prodDescricao}</td>
                <td>{r.Grupo}</td>
                <td>{r.UNCompra}</td>
                <td className="tnum">{formatDecimalBr(r.QtdeMinimo)}</td>
                <td>
                  <input
                    type="number"
                    className="input input-sm tnum"
                    style={{ width: 100 }}
                    value={edit[r.prodCodigo] ?? ""}
                    onChange={(e) => setEdit((m) => ({ ...m, [r.prodCodigo]: e.target.value }))}
                  />
                </td>
                <td className="tnum">{formatDecimalBr(r.QtdeMaximo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
