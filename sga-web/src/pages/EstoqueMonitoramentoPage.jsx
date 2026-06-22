import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";

const TABS = [
  { id: 5, label: "Escolas" },
  { id: 6, label: "Creches" },
  { id: 99, label: "Outras" },
];

const OPCOES = [
  ["0", "Todos"],
  ["1", "Com atividades"],
  ["2", "Sem atividades"],
];

export default function EstoqueMonitoramentoPage({ onBack }) {
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [opcaoBusca, setOpcaoBusca] = useState("0");
  const [tab, setTab] = useState(5);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson("/api/estoque/monitoramento-ue", {
        params: { data, opcaoBusca, tipoUnidade: tab },
      });
      setRows(res.data ?? []);
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [data, opcaoBusca, tab]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="content-inner">
      <Breadcrumb items={["Estoque", "Monitoramento de Estoque das UE"]} />
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-head row between wrap gap-2">
          <h1 className="panel-title">Monitoramento de Estoque das UE</h1>
          {onBack && <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}><FaIcon icon="fa-arrow-left" /> Voltar</button>}
        </div>
        <div className="panel-body">
          <div className="estoque-filter-inline">
            <label className="field-compact"><span>Data</span>
              <input type="date" className="input input-sm" value={data} onChange={(e) => setData(e.target.value)} />
            </label>
            <label className="field-compact"><span>Filtro</span>
              <select className="input input-sm" value={opcaoBusca} onChange={(e) => setOpcaoBusca(e.target.value)}>
                {OPCOES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <button type="button" className="btn btn-primary btn-sm" onClick={load} disabled={loading}><FaIcon icon="fa-search" /> Buscar</button>
          </div>
          <div className="row gap-2 wrap" style={{ marginTop: 12 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`badge pill ${tab === t.id ? "badge-brand" : "badge-neutral"}`}
                style={{ cursor: "pointer", fontWeight: 600 }}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <div className="panel panel-body" style={{ color: "var(--danger-fg)", marginBottom: 12 }}>{error}</div>}
      <div className="panel table-wrap">
        <table className="table">
          <thead>
            <tr><th>Código</th><th>Unidade Educativa</th><th>Atividades</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="cell-muted" style={{ textAlign: "center", padding: 24 }}>Carregando…</td></tr>
            ) : !rows.length ? (
              <tr><td colSpan={3} className="cell-muted" style={{ textAlign: "center", padding: 24 }}>Nenhum registro.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.locCodigo}>
                <td className="tnum">{r.locCodigo}</td>
                <td>{r.locDescricao}</td>
                <td className="tnum">{r.locAtividades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
