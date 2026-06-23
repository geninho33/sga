import { useEffect, useState } from "react";
import { wwListScreen } from "../data/wwModules";
import { apiJson } from "../api/client";
import { FaIcon } from "./Icon";
import RelatorioProgressModal from "./RelatorioProgressModal";
import { openReportWithProgress } from "../utils/openReportWithProgress";

const SEMANAS = [
  { value: "1", label: "1ª Semana" },
  { value: "2", label: "2ª Semana" },
  { value: "3", label: "3ª Semana" },
  { value: "4", label: "4ª Semana" },
  { value: "5", label: "5ª Semana" },
  { value: "6", label: "6ª Semana" },
];

const FORMATOS_IMPRESSAO = [
  { value: "calendario", label: "Cardápio Mensal (Paisagem)" },
  { value: "pnae", label: "Documento Institucional PNAE (A4 retrato)" },
];

export default function CardapioImpressaoModal({ row, onClose, onNavigate }) {
  const [locais, setLocais] = useState([]);
  const [form, setForm] = useState({
    locCodigo: "",
    opcFormato: "calendario",
    opcReceita: "S",
    opcNutrientes: "S",
    opcSemanaINI: "1",
    opcSemanaFIN: "6",
  });
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiJson("/api/preparacao/referencias");
        if (!cancelled) setLocais(res.data?.locais ?? []);
      } catch {
        if (!cancelled) setLocais([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);
    setPrintProgress(0);
    setError("");
    try {
      await openReportWithProgress(`/api/preparacao/cardapios/${row.carDapCodigo}/impressao`, {
        params: {
          carDapMesAno: String(row.carDapMesAno || "").slice(0, 10),
          locCodigo: form.locCodigo,
          opcFormato: form.opcFormato,
          opcReceita: form.opcReceita,
          opcNutrientes: form.opcNutrientes,
          opcSemanaINI: form.opcSemanaINI,
          opcSemanaFIN: form.opcSemanaFIN,
        },
        onProgress: setPrintProgress,
      });
      onClose?.();
    } catch (err) {
      setError(err.message || "Não foi possível gerar o PDF");
    } finally {
      setTimeout(() => {
        setPrinting(false);
        setPrintProgress(0);
      }, 350);
    }
  };

  return (
    <>
      <RelatorioProgressModal open={printing} progress={printProgress} />
      <div className="cmd-backdrop open" role="presentation" onClick={onClose}>
        <div
          className="cmd card-pad"
          role="dialog"
          aria-labelledby="cardapio-impressao-title"
          onClick={(e) => e.stopPropagation()}
          style={{ padding: "var(--space-5)" }}
        >
          <h2 id="cardapio-impressao-title" className="page-title" style={{ fontSize: "1.1rem", marginBottom: 8 }}>
            Opção de Impressão Cardápio
          </h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            {row.carDapDescricao}
          </p>

          {form.opcFormato === "pnae" && !row.carDapGruCodigo && (
            <div
              className="badge badge-warning"
              style={{ marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", width: "100%", textAlign: "left" }}
            >
              <FaIcon icon="fa-triangle-exclamation" />
              <span>
                Cardápio sem grupo vinculado: o documento PNAE não incluirá totais de atendimento (público e dietas especiais).
              </span>
            </div>
          )}

          {form.opcFormato === "pnae" && row.carDapGruCodigo && onNavigate && (
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  onClose?.();
                  onNavigate(wwListScreen("atendimentos", { carGruCodigo: row.carDapGruCodigo }));
                }}
              >
                <FaIcon icon="fa-users" /> Ver atendimentos deste grupo
              </button>
            </div>
          )}

          <div className="filter-grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
            <div className="field">
              <label className="field-label">Modelo de impressão</label>
              <select
                className="input"
                value={form.opcFormato}
                onChange={(e) => setForm((f) => ({ ...f, opcFormato: e.target.value }))}
              >
                {FORMATOS_IMPRESSAO.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Unidade Educativa</label>
              <select
                className="input"
                value={form.locCodigo}
                disabled={loading}
                onChange={(e) => setForm((f) => ({ ...f, locCodigo: e.target.value }))}
              >
                <option value="">Selecione…</option>
                {locais.map((l) => (
                  <option key={l.locCodigo} value={String(l.locCodigo)}>{l.locDescricao}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Imprimir as receitas</label>
              <select className="input" value={form.opcReceita} onChange={(e) => setForm((f) => ({ ...f, opcReceita: e.target.value }))}>
                <option value="N">Não</option>
                <option value="S">Sim</option>
              </select>
            </div>
            {form.opcFormato === "calendario" && (
              <div className="field">
                <label className="field-label">Imprimir resumo de nutrientes (média semanal)</label>
                <select className="input" value={form.opcNutrientes} onChange={(e) => setForm((f) => ({ ...f, opcNutrientes: e.target.value }))}>
                  <option value="S">Sim</option>
                  <option value="N">Não</option>
                </select>
              </div>
            )}
            <div className="field">
              <label className="field-label">Imprimir da semana</label>
              <div className="row gap-2">
                <select className="input" value={form.opcSemanaINI} onChange={(e) => setForm((f) => ({ ...f, opcSemanaINI: e.target.value }))}>
                  {SEMANAS.map((s) => <option key={`ini-${s.value}`} value={s.value}>{s.label}</option>)}
                </select>
                <span className="muted">até</span>
                <select className="input" value={form.opcSemanaFIN} onChange={(e) => setForm((f) => ({ ...f, opcSemanaFIN: e.target.value }))}>
                  {[...SEMANAS].reverse().map((s) => <option key={`fin-${s.value}`} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {error ? <p className="text-danger" style={{ marginTop: 12 }}>{error}</p> : null}

          <div className="row gap-2" style={{ marginTop: 20, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={printing}>Fechar</button>
            <button type="button" className="btn btn-primary" onClick={handlePrint} disabled={printing}>
              <FaIcon icon="fa-print" /> {printing ? "Gerando…" : "Imprimir"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
