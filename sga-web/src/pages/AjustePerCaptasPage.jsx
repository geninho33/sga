import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import { MESES_LABELS, PERCAPTA_AREAS } from "../data/logisticaCatalog";
import { getWwModuleById } from "../data/wwModules";
import { formatDecimalBr } from "../utils/formatBr";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";

export default function AjustePerCaptasPage({ onBack }) {
  const module = getWwModuleById("rancho-percapta");
  const refs = useLogisticaReferencias();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [buscarDados, setBuscarDados] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!buscarDados) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiJson("/api/logistica/ajuste-percapta", {
        params: { mes, ano, q: filtro, limit: 100, page: 1 },
      });
      setRows(res.data ?? []);
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [mes, ano, filtro, buscarDados]);

  useEffect(() => {
    load();
  }, [load]);

  const patchRow = (prodCodigo, key, value) => {
    setRows((list) =>
      list.map((r) => (r.prodCodigo === prodCodigo ? { ...r, [key]: value } : r))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      for (const row of rows) {
        await apiJson("/api/logistica/ajuste-percapta", {
          method: "PUT",
          body: JSON.stringify({ mes, ano, ...row }),
        });
      }
      setMsg("Percapta gravada com sucesso.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tipoLabel = (cod) => {
    const t = (refs.tipos ?? []).find((x) => Number(x.disTipNumero) === Number(cod));
    return t?.disTipDescricao || cod || "—";
  };

  return (
    <div className="content-inner" style={{ maxWidth: "100%" }}>
      <Breadcrumb items={[module?.breadcrumbSection || "Logística", "Percapta de Alimentos"]} />
      <div className="page-head">
        <div>
          <div className="page-title">Rancho PerCapta</div>
          <div className="page-desc mono">AjustePerCaptas</div>
        </div>
        {onBack && (
          <button type="button" className="btn btn-ghost" onClick={onBack}>Voltar</button>
        )}
      </div>

      <div className="panel card-pad" style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div className="row gap-3 wrap" style={{ alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 120 }}>
            <label className="field-label">Ano</label>
            <input className="input" type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} />
          </div>
          <div className="field" style={{ minWidth: 140 }}>
            <label className="field-label">Mês</label>
            <select className="input" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES_LABELS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label className="field-label">Produto</label>
            <input className="input" placeholder="Filtrar descrição…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          </div>
          <label className="field field--checkbox" style={{ marginBottom: 8 }}>
            <input type="checkbox" checked={buscarDados} onChange={(e) => setBuscarDados(e.target.checked)} />
            <span>Buscar dados</span>
          </label>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            <FaIcon icon="fa-arrows-rotate" /> Atualizar
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="panel">
        <div className="table-wrap" style={{ overflowX: "auto", maxHeight: "calc((100vh - 320px) / 2)" }}>
          <table className="table table-zebra" style={{ fontSize: "var(--text-sm)", minWidth: 1200 }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--surface-1)", zIndex: 2 }}>
              <tr>
                <th rowSpan={2}>Cód.</th>
                <th rowSpan={2} style={{ minWidth: 180 }}>Descrição</th>
                <th rowSpan={2}>Tipo Remessa</th>
                {PERCAPTA_AREAS.map((a) => (
                  <th key={a.code} colSpan={2} style={{ textAlign: "center", borderLeft: "1px solid var(--border)" }}>
                    {a.short}
                  </th>
                ))}
              </tr>
              <tr>
                {PERCAPTA_AREAS.flatMap((a) => [
                  <th key={`${a.code}-p`} style={{ fontSize: 10, borderLeft: "1px solid var(--border)" }}>Per Capta</th>,
                  <th key={`${a.code}-o`} style={{ fontSize: 10 }}>Oferta</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3 + PERCAPTA_AREAS.length * 2} className="cell-muted" style={{ textAlign: "center", padding: "2rem" }}>Carregando…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={3 + PERCAPTA_AREAS.length * 2} className="cell-muted" style={{ textAlign: "center", padding: "2rem" }}>Nenhum produto.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={`prod-${row.prodCodigo}`}>
                    <td className="tnum">{row.prodCodigo}</td>
                    <td>{row.prodDescricao}</td>
                    <td>
                      <select
                        className="input input-sm"
                        style={{ minWidth: 120, height: 30, fontSize: 12 }}
                        value={row.prodCodigoTipoRemessa ?? ""}
                        onChange={(e) => patchRow(row.prodCodigo, "prodCodigoTipoRemessa", e.target.value)}
                      >
                        <option value="">—</option>
                        {(refs.tipos ?? []).map((t) => (
                          <option key={t.disTipNumero} value={String(t.disTipNumero)}>{t.disTipDescricao}</option>
                        ))}
                      </select>
                    </td>
                    {PERCAPTA_AREAS.flatMap((a) => [
                      <td key={`${row.prodCodigo}-${a.percaptaKey}`}>
                        <input
                          className="input input-sm tnum"
                          style={{ width: 72, height: 28, fontSize: 12 }}
                          type="number"
                          step="any"
                          value={row[a.percaptaKey] ?? 0}
                          onChange={(e) => patchRow(row.prodCodigo, a.percaptaKey, e.target.value)}
                        />
                      </td>,
                      <td key={`${row.prodCodigo}-${a.ofertaKey}`}>
                        <input
                          className="input input-sm tnum"
                          style={{ width: 56, height: 28, fontSize: 12 }}
                          type="number"
                          value={row[a.ofertaKey] ?? 0}
                          onChange={(e) => patchRow(row.prodCodigo, a.ofertaKey, e.target.value)}
                        />
                      </td>,
                    ])}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="panel-foot row gap-2">
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
            <FaIcon icon="fa-check" /> {saving ? "Gravando…" : "Gravar"}
          </button>
          <span className="muted" style={{ fontSize: "var(--text-sm)" }}>
            {rows.length} produto(s) · {MESES_LABELS[mes - 1]}/{ano}
          </span>
        </div>
      </div>
    </div>
  );
}
