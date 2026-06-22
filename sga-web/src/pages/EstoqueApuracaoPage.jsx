import { useState } from "react";
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

function defaultRange() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);
  return { dtInicial: start.toISOString().slice(0, 10), dtFinal: end.toISOString().slice(0, 10) };
}

export default function EstoqueApuracaoPage({ onBack }) {
  const { produtos } = useLogisticaReferencias();
  const [filters, setFilters] = useState({ ...defaultRange(), classificacao: "", prodCodigo: "" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const processar = async () => {
    setLoading(true);
    setProgress(10);
    setError(null);
    setMsg(null);
    const timer = setInterval(() => setProgress((p) => (p >= 90 ? p : p + 4)), 200);
    try {
      const res = await apiJson("/api/estoque/apuracao/processar", {
        method: "POST",
        body: JSON.stringify(filters),
      });
      setRows(res.data ?? []);
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => { setLoading(false); setProgress(0); }, 250);
    }
  };

  const aplicar = async () => {
    const selected = rows.filter((r) => r.check);
    if (!selected.length) {
      setError("Marque ao menos um produto.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await apiJson("/api/estoque/apuracao/aplicar", {
        method: "POST",
        body: JSON.stringify({ items: selected }),
      });
      setMsg(res.message || "Aplicado.");
      await processar();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (prodCodigo, checked) => {
    setRows((list) => list.map((r) => (r.prodCodigo === prodCodigo ? { ...r, check: checked } : r)));
  };

  return (
    <div className="content-inner">
      <Breadcrumb items={["Estoque", "Apuração de Entrada e Saída"]} />
      <WizardProgressModal open={loading} title="Processando apuração" progress={progress} message="Calculando entradas e saídas…" />
      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-head row between wrap gap-2">
          <h1 className="panel-title">Apuração de Entrada e Saída</h1>
          {onBack && <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}><FaIcon icon="fa-arrow-left" /> Voltar</button>}
        </div>
        <div className="panel-body">
          <div className="estoque-filter-inline">
            <label className="field-compact"><span>Classificação</span>
              <select className="input input-sm" value={filters.classificacao} onChange={(e) => setFilters((f) => ({ ...f, classificacao: e.target.value }))}>
                {CLASSIFICACOES.map(([v, l]) => <option key={v || "all"} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="field-compact"><span>Produto</span>
              <select className="input input-sm" value={filters.prodCodigo} onChange={(e) => setFilters((f) => ({ ...f, prodCodigo: e.target.value }))}>
                <option value="">Todos</option>
                {produtos.map((p) => <option key={p.prodCodigo} value={p.prodCodigo}>{p.prodDescricao}</option>)}
              </select>
            </label>
            <label className="field-compact"><span>De</span>
              <input type="date" className="input input-sm" value={filters.dtInicial} onChange={(e) => setFilters((f) => ({ ...f, dtInicial: e.target.value }))} />
            </label>
            <label className="field-compact"><span>Até</span>
              <input type="date" className="input input-sm" value={filters.dtFinal} onChange={(e) => setFilters((f) => ({ ...f, dtFinal: e.target.value }))} />
            </label>
            <button type="button" className="btn btn-primary btn-sm" onClick={processar} disabled={loading}><FaIcon icon="fa-play" /> Processar</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={aplicar} disabled={saving || !rows.length}><FaIcon icon="fa-check" /> Aplicar saldo</button>
          </div>
        </div>
      </div>
      {error && <div className="panel panel-body" style={{ color: "var(--danger-fg)", marginBottom: 12 }}>{error}</div>}
      {msg && <div className="panel panel-body" style={{ color: "var(--success-fg)", marginBottom: 12 }}>{msg}</div>}
      <div className="panel table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th /><th>Cód.</th><th>Descrição</th><th>UN Ent.</th><th>UN Saí.</th><th>Entrada</th><th>Saída</th><th>Saldo</th><th>Estoque ant.</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr><td colSpan={9} className="cell-muted" style={{ textAlign: "center", padding: 24 }}>Processe para ver os resultados.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.prodCodigo}>
                <td><input type="checkbox" checked={!!r.check} onChange={(e) => toggle(r.prodCodigo, e.target.checked)} /></td>
                <td className="tnum">{r.prodCodigo}</td>
                <td>{r.prodDescricao}</td>
                <td>{r.UNCompra}</td>
                <td>{r.UNDistribuicao}</td>
                <td className="tnum">{formatDecimalBr(r.qtdeEntrada)}</td>
                <td className="tnum">{formatDecimalBr(r.qtdeSaida)}</td>
                <td className="tnum">{formatDecimalBr(r.prodLocalSaldo)}</td>
                <td className="tnum">{formatDecimalBr(r.QtdeMaximo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
