import { useEffect, useMemo, useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import RelatorioProgressModal from "../components/RelatorioProgressModal";
import { getRelatorioConfig } from "../data/relatorioConfigs";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";
import { usePreparacaoReferencias } from "../hooks/usePreparacaoReferencias";
import { openReportWithProgress } from "../utils/openReportWithProgress";

function defaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 60);
  return {
    dataInicial: start.toISOString().slice(0, 10),
    dataFinal: end.toISOString().slice(0, 10),
  };
}

export default function RelatorioPage({ configId, onBack }) {
  const config = getRelatorioConfig(configId);
  const { produtos, fornecedores, rotas } = useLogisticaReferencias();
  const { locais } = usePreparacaoReferencias();
  const [form, setForm] = useState(() => ({ ...defaultDates(), ordem: "N", situacaoData: "R", tipo: "T" }));
  const [selProdutos, setSelProdutos] = useState({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const grupos = useMemo(() => {
    const map = new Map();
    for (const p of produtos) {
      if (p.prodTipo && p.prodGrupdescricao) map.set(p.prodTipo, p.prodGrupdescricao);
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [produtos]);

  useEffect(() => {
    setForm({ ...defaultDates(), ordem: "N", situacaoData: "R", tipo: "T" });
    setSelProdutos({});
  }, [configId]);

  if (!config) {
    return (
      <div className="content-inner">
        <p>Relatório não configurado.</p>
      </div>
    );
  }

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const imprimir = async () => {
    if (busy) return;
    setBusy(true);
    setProgress(0);
    setError(null);
    try {
      const body = { ...form };
      for (const k of Object.keys(body)) {
        if (body[k] === "" || body[k] == null) delete body[k];
        else if (["prodCodigo", "grupoCodigo", "fornecedorCodigo", "rotaCodigo", "localDestino", "locCodigo"].includes(k)) {
          body[k] = Number(body[k]) || undefined;
        }
      }
      if (config.requiresProdutos) {
        const ids = Object.entries(selProdutos).filter(([, v]) => v).map(([k]) => Number(k));
        if (!ids.length) throw new Error("Selecione ao menos um produto.");
        body.produtoIds = ids;
      }
      await openReportWithProgress(config.pdfPath, {
        method: "POST",
        body,
        onProgress: setProgress,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => {
        setBusy(false);
        setProgress(0);
      }, 350);
    }
  };

  const renderField = (field) => {
    if (field.type === "date") {
      return (
        <label key={field.key} className="field-compact">
          <span>{field.label}</span>
          <input type="date" className="input input-sm" value={form[field.key] || ""} onChange={(e) => setField(field.key, e.target.value)} />
        </label>
      );
    }
    if (field.type === "select") {
      return (
        <label key={field.key} className="field-compact">
          <span>{field.label}</span>
          <select className="input input-sm" value={form[field.key] || field.options[0]?.value} onChange={(e) => setField(field.key, e.target.value)}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      );
    }
    if (field.type === "produto") {
      return (
        <label key={field.key} className="field-compact">
          <span>{field.label}</span>
          <select className="input input-sm" value={form[field.key] || ""} onChange={(e) => setField(field.key, e.target.value)}>
            <option value="">Todos</option>
            {produtos.map((p) => (
              <option key={p.prodCodigo} value={p.prodCodigo}>{p.prodDescricao}</option>
            ))}
          </select>
        </label>
      );
    }
    if (field.type === "grupo") {
      return (
        <label key={field.key} className="field-compact">
          <span>{field.label}</span>
          <select className="input input-sm" value={form[field.key] || ""} onChange={(e) => setField(field.key, e.target.value)}>
            <option value="">Todos</option>
            {grupos.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </label>
      );
    }
    if (field.type === "fornecedor") {
      return (
        <label key={field.key} className="field-compact">
          <span>{field.label}</span>
          <select className="input input-sm" value={form[field.key] || ""} onChange={(e) => setField(field.key, e.target.value)}>
            <option value="">Todos</option>
            {fornecedores.map((f) => (
              <option key={f.forCodigo} value={f.forCodigo}>{f.forNome}</option>
            ))}
          </select>
        </label>
      );
    }
    if (field.type === "rota") {
      return (
        <label key={field.key} className="field-compact">
          <span>{field.label}</span>
          <select className="input input-sm" value={form[field.key] || ""} onChange={(e) => setField(field.key, e.target.value)}>
            <option value="">Todas</option>
            {rotas.map((r) => (
              <option key={r.rotaCodigo} value={r.rotaCodigo}>{r.rotaDescricao}</option>
            ))}
          </select>
        </label>
      );
    }
    if (field.type === "local") {
      return (
        <label key={field.key} className="field-compact">
          <span>{field.label}</span>
          <select className="input input-sm" value={form[field.key] || ""} onChange={(e) => setField(field.key, e.target.value)}>
            <option value="">Todos</option>
            {locais.map((l) => (
              <option key={l.locCodigo} value={l.locCodigo}>{l.locDescricao}</option>
            ))}
          </select>
        </label>
      );
    }
    return null;
  };

  return (
    <div className="content-inner">
      <RelatorioProgressModal open={busy} progress={progress} />
      <Breadcrumb items={["Relatórios", config.title]} />
      <div className="panel">
        <div className="panel-head row between wrap gap-2">
          <div>
            <h1 className="panel-title">{config.title}</h1>
            <p className="muted" style={{ fontSize: "var(--text-sm)", margin: "4px 0 0" }}>{config.geneXusPanel}</p>
          </div>
          {onBack && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
              <FaIcon icon="fa-arrow-left" /> Voltar
            </button>
          )}
        </div>
        <div className="panel-body">
          <div className="estoque-filter-inline" style={{ marginBottom: 16 }}>
            {config.fields.map(renderField)}
            <button type="button" className="btn btn-primary btn-sm" onClick={imprimir} disabled={busy}>
              <FaIcon icon="fa-print" /> {busy ? "Gerando…" : "Imprimir"}
            </button>
          </div>
          {error && <p style={{ color: "var(--danger-fg)" }}>{error}</p>}
          {config.requiresProdutos && (
            <div className="table-wrap" style={{ maxHeight: 360, overflow: "auto" }}>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th style={{ width: 40 }} />
                    <th>Código</th>
                    <th>Produto</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p) => (
                    <tr key={p.prodCodigo}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!selProdutos[p.prodCodigo]}
                          onChange={(e) => setSelProdutos((s) => ({ ...s, [p.prodCodigo]: e.target.checked }))}
                        />
                      </td>
                      <td className="tnum">{p.prodCodigo}</td>
                      <td>{p.prodDescricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
