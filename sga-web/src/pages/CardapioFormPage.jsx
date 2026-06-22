import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../api/client";
import { createWwRecord, fetchWwRecord, updateWwRecord } from "../api/cadastroCrud";
import Breadcrumb from "../components/Breadcrumb";
import CardapioCalendario from "../components/CardapioCalendario";
import { FaIcon } from "../components/Icon";
import { PRODUTO_STATUS } from "../data/modules";
import { getWwModuleById, wwListScreen } from "../data/wwModules";
import { emptyForm, formToPayload, getWwFormConfig, recordToForm } from "../data/wwForms";
import { usePreparacaoReferencias } from "../hooks/usePreparacaoReferencias";
import { formatDateBr } from "../utils/calendarMonth";

const config = getWwFormConfig("cardapios");

function Field({ field, form, onChange, referencias, isNew }) {
  const value = form[field.key] ?? "";
  const disabled = field.readOnly || (!isNew && field.readOnlyOnEdit);
  if (field.type === "select") {
    return (
      <div className="field">
        <label className="field-label">{field.label}</label>
        <select className="input" value={value} onChange={(e) => onChange(field.key, e.target.value)}>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }
  if (field.lookup === "cardapioGrupos") {
    const list = referencias.cardapioGrupos ?? [];
    return (
      <div className="field">
        <label className="field-label">{field.label}</label>
        <select className="input" value={value} onChange={(e) => onChange(field.key, e.target.value)}>
          <option value="">Selecione…</option>
          {list.map((g) => (
            <option key={g.carGruCodigo} value={String(g.carGruCodigo)}>{g.carGruDescricao}</option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div className="field">
      <label className="field-label">{field.label}</label>
      <input
        className="input"
        type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
        value={value}
        readOnly={disabled}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    </div>
  );
}

export default function CardapioFormPage({ recordId, isNew = false, initialTab, onBack, onCreated, onNavigate }) {
  const module = getWwModuleById("cardapios");
  const referencias = usePreparacaoReferencias();
  const [tab, setTab] = useState(initialTab || "dados");
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState(null);
  const [pratos, setPratos] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);
  const [pratosView, setPratosView] = useState("calendario");
  const [nutrientes, setNutrientes] = useState(null);
  const [nutLoading, setNutLoading] = useState(false);

  const carDapCodigo = isNew ? null : Number(recordId);

  const loadChildren = useCallback(async (id) => {
    const p = await apiJson(`/api/preparacao/cardapios/${id}/pratos`);
    setPratos(p.data ?? []);
  }, []);

  const load = useCallback(async () => {
    if (isNew) {
      setForm(emptyForm(config));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const row = await fetchWwRecord(config, recordId);
      setForm({
        ...recordToForm(config, row),
        carDapNutricionista: String(row.carDapNutricionista || ""),
        carDapNutricionista1: String(row.carDapNutricionista1 || ""),
        carDapNutricionista2: String(row.carDapNutricionista2 || ""),
        carDapNutricionista3: String(row.carDapNutricionista3 || ""),
      });
      setMeta(row);
      await loadChildren(Number(recordId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isNew, recordId, loadChildren]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab, recordId]);

  useEffect(() => {
    if (tab !== "nutrientes" || !carDapCodigo) return;
    setNutLoading(true);
    apiJson(`/api/preparacao/cardapios/${carDapCodigo}/nutrientes`)
      .then((res) => setNutrientes(res.data))
      .catch(() => setNutrientes(null))
      .finally(() => setNutLoading(false));
  }, [tab, carDapCodigo]);

  const handleSave = async () => {
    if (!form.carDapDescricao?.trim()) {
      setError("Descrição é obrigatória.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...formToPayload(config, form, isNew),
        carDapNutricionista: Number(form.carDapNutricionista) || 0,
        carDapNutricionista1: Number(form.carDapNutricionista1) || 0,
        carDapNutricionista2: Number(form.carDapNutricionista2) || 0,
        carDapNutricionista3: Number(form.carDapNutricionista3) || 0,
      };
      if (isNew) {
        const row = await createWwRecord(config, payload);
        setSaveMsg("Cardápio criado.");
        onCreated?.(row, config);
      } else {
        const row = await updateWwRecord(config, recordId, payload);
        setForm(recordToForm(config, row));
        setMeta(row);
        const avisoGrupo = !row.carDapGruCodigo
          ? " Cardápio confirmado — vincule um grupo para que a impressão PNAE inclua atendimentos."
          : "";
        setSaveMsg(`Cardápio confirmado.${avisoGrupo}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <div className="content-inner"><p className="muted">Carregando…</p></div>;
  }

  const st = meta?.carDapStatus ? PRODUTO_STATUS[meta.carDapStatus] || PRODUTO_STATUS.A : null;
  const grupoCodigo = form.carDapGruCodigo || meta?.carDapGruCodigo;
  const semGrupo = !grupoCodigo || grupoCodigo === "0" || Number(grupoCodigo) === 0;
  const grupoNome = referencias.cardapioGrupos?.find((g) => String(g.carGruCodigo) === String(grupoCodigo))?.carGruDescricao;

  return (
    <div className="content-inner" style={{ maxWidth: pratosView === "calendario" ? 1280 : 1100 }}>
      <Breadcrumb items={[module?.breadcrumbSection, "Cardápios", isNew ? "Inserir" : String(recordId)]} />
      <div className="page-head">
        <div>
          <div className="page-title">{isNew ? "Inserir" : "Alterar"} · Cardápios</div>
          <div className="page-desc"><span className="mono">trnscardapio</span> · refeições, nutricionistas e nutrientes</div>
        </div>
      </div>

      {(error || saveMsg) && (
        <div className="panel" style={{ marginBottom: "var(--space-4)" }}>
          <div className="panel-body" style={{ padding: "var(--space-4)" }}>
            <p style={{ margin: 0, color: error ? "var(--danger-fg)" : "var(--success-fg)" }}>{error || saveMsg}</p>
          </div>
        </div>
      )}

      <div className="tabs" style={{ marginBottom: "var(--space-4)" }}>
        {[
          { id: "dados", label: "Dados gerais" },
          { id: "nutricionistas", label: "Nutricionistas" },
          { id: "nutrientes", label: "Macros e micros" },
          { id: "pratos", label: "Refeições do cardápio" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={"btn btn-sm " + (tab === t.id ? "btn-primary" : "btn-ghost")}
            disabled={t.id !== "dados" && isNew}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dados" && (
        <div className="panel">
          <div className="panel-body">
            {!isNew && st && (
              <span className={"badge " + st.cls} style={{ marginBottom: 12, display: "inline-flex" }}>
                <span className="dot" />{st.label}
              </span>
            )}
            {semGrupo && (
              <div
                className="badge badge-warning"
                style={{ marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", width: "100%", textAlign: "left" }}
              >
                <FaIcon icon="fa-triangle-exclamation" />
                <span>
                  Este cardápio não está vinculado a um grupo. A impressão PNAE não trará público-alvo nem dietas especiais dos atendimentos.
                </span>
              </div>
            )}
            {!semGrupo && onNavigate && (
              <div style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onNavigate(wwListScreen("atendimentos", { carGruCodigo: grupoCodigo }))}
                >
                  <FaIcon icon="fa-users" /> Atendimentos do grupo {grupoNome || grupoCodigo}
                </button>
              </div>
            )}
            <div className="filter-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {config.fields.map((f) => (
                <Field key={f.key} field={f} form={form} onChange={(k, v) => setForm((x) => ({ ...x, [k]: v }))} referencias={referencias} isNew={isNew} />
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "nutricionistas" && (
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Nutricionista(s) que assinam o cardápio</span></div>
          <div className="panel-body">
            <div className="filter-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {[
                { key: "carDapNutricionista", label: "Nutricionista responsável" },
                { key: "carDapNutricionista1", label: "Nutricionista 2" },
                { key: "carDapNutricionista2", label: "Nutricionista 3" },
                { key: "carDapNutricionista3", label: "Nutricionista 4" },
              ].map((f) => (
                <div key={f.key} className="field">
                  <label className="field-label">{f.label}</label>
                  <select className="input" value={form[f.key] ?? ""} onChange={(e) => setForm((x) => ({ ...x, [f.key]: e.target.value }))}>
                    <option value="">Selecione…</option>
                    {(referencias.nutricionistas ?? []).map((n) => (
                      <option key={n.usuCodigo} value={String(n.usuCodigo)}>{n.usuNome}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "nutrientes" && !isNew && (
        <div className="panel">
          <div className="panel-head"><span className="panel-title">WCMacroMicroNutrientes · Média semanal</span></div>
          <div className="panel-body">
            {nutLoading ? <p className="muted">Calculando nutrientes…</p> : !nutrientes ? (
              <p className="muted">Sem dados de nutrientes.</p>
            ) : (
              <>
                <p className="muted" style={{ marginBottom: 12 }}>
                  Público normal (segunda): {nutrientes.totalAtendimentoNormal || 0} · Dias com refeição: {nutrientes.diasComRefeicao}
                </p>
                <table className="table">
                  <thead><tr><th>Nutriente</th><th>Valor exibido</th></tr></thead>
                  <tbody>
                    {(nutrientes.labels ?? []).map((n) => (
                      <tr key={n.key}>
                        <td>{n.label}</td>
                        <td className="tnum">{Number(nutrientes.exibicao?.[n.key] || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "pratos" && !isNew && (
        <div className="panel">
          <div className="panel-head row gap-2" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <span className="panel-title">trnscardapiopratoWW · Montagem do cardápio</span>
            <div className="row gap-2">
              <button
                type="button"
                className={"btn btn-sm " + (pratosView === "calendario" ? "btn-primary" : "btn-ghost")}
                onClick={() => setPratosView("calendario")}
              >
                Calendário
              </button>
              <button
                type="button"
                className={"btn btn-sm " + (pratosView === "lista" ? "btn-primary" : "btn-ghost")}
                onClick={() => setPratosView("lista")}
              >
                Lista
              </button>
            </div>
          </div>
          <div className="panel-body">
            {pratosView === "calendario" ? (
              <CardapioCalendario
                carDapCodigo={carDapCodigo}
                mesAno={form.carDapMesAno || meta?.carDapMesAno}
                pratos={pratos}
                tiposRefeicao={referencias.tiposRefeicao}
                pratosCatalogo={referencias.pratos}
                referencias={referencias}
                onRefresh={() => loadChildren(carDapCodigo)}
              />
            ) : (
              <table className="table">
                <thead><tr><th>Data</th><th>Turno</th><th>Refeição</th></tr></thead>
                <tbody>
                  {pratos.length === 0 ? (
                    <tr><td colSpan={3} className="muted">Nenhuma refeição lançada.</td></tr>
                  ) : (
                    pratos.map((r, i) => (
                      <tr key={`prato-row-${r.carPratoCodigo ?? i}`}>
                        <td>{formatDateBr(r.carPratoData)}</td>
                        <td>{r.carPratoTurnoDesc || r.carPratoTurno}</td>
                        <td>{r.carPratoRefeicaoDesc || r.carPratoRefeicao}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <div className="panel-foot" style={{ marginTop: "var(--space-6)", justifyContent: "flex-end" }}>
        <div className="row gap-2">
          <button type="button" className="btn btn-ghost" onClick={onBack}>Fechar</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <FaIcon icon="fa-check" /> {saving ? "Confirmando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
