import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../api/client";
import { createWwRecord, fetchWwRecord, updateWwRecord } from "../api/cadastroCrud";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import { PRODUTO_STATUS } from "../data/modules";
import { getWwModuleById } from "../data/wwModules";
import { emptyForm, formToPayload, getWwFormConfig, recordToForm } from "../data/wwForms";
import { usePreparacaoReferencias } from "../hooks/usePreparacaoReferencias";

const config = getWwFormConfig("cardapio-grupos");

function NutricionistaSelect({ label, value, list, onChange }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecione…</option>
        {list.map((n) => (
          <option key={n.usuCodigo} value={String(n.usuCodigo)}>{n.usuNome}</option>
        ))}
      </select>
    </div>
  );
}

export default function CardapioGrupoFormPage({ recordId, isNew = false, onBack, onCreated }) {
  const module = getWwModuleById("cardapio-grupos");
  const referencias = usePreparacaoReferencias();
  const [tab, setTab] = useState("dados");
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState(null);
  const [cardapios, setCardapios] = useState([]);
  const [novoCardapio, setNovoCardapio] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);

  const carGruCodigo = isNew ? null : Number(recordId);

  const loadCardapios = useCallback(async (id) => {
    const res = await apiJson(`/api/preparacao/cardapio-grupos/${id}/cardapios`);
    setCardapios(res.data ?? []);
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
      setForm(recordToForm(config, row));
      setMeta(row);
      await loadCardapios(Number(recordId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isNew, recordId, loadCardapios]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.carGruDescricao?.trim()) {
      setError("Descrição é obrigatória.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = formToPayload(config, form, isNew);
      if (isNew) {
        const row = await createWwRecord(config, payload);
        setSaveMsg("Grupo criado.");
        onCreated?.(row, config);
      } else {
        const row = await updateWwRecord(config, recordId, payload);
        setForm(recordToForm(config, row));
        setMeta(row);
        setSaveMsg("Grupo confirmado.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const vincularCardapio = async () => {
    if (!carGruCodigo || !novoCardapio) return;
    try {
      await apiJson(`/api/preparacao/cardapio-grupos/${carGruCodigo}/vincular-cardapio`, {
        method: "POST",
        body: JSON.stringify({ carDapCodigo: Number(novoCardapio) }),
      });
      setNovoCardapio("");
      await loadCardapios(carGruCodigo);
      setSaveMsg("Cardápio vinculado ao grupo.");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading || !form) {
    return <div className="content-inner"><p className="muted">Carregando…</p></div>;
  }

  const st = meta?.carGruStatus ? PRODUTO_STATUS[meta.carGruStatus] || PRODUTO_STATUS.A : null;
  const nutricionistas = referencias.nutricionistas ?? [];
  const cardapiosDisp = (referencias.cardapios ?? []).filter(
    (c) => !cardapios.some((v) => v.carDapCodigo === c.carDapCodigo)
  );

  return (
    <div className="content-inner" style={{ maxWidth: 1040 }}>
      <Breadcrumb items={[module?.breadcrumbSection, "Grupo de Cardápios", isNew ? "Inserir" : String(recordId)]} />
      <div className="page-head">
        <div>
          <div className="page-title">{isNew ? "Inserir" : "Alterar"} · Grupo de Cardápios</div>
          <div className="page-desc"><span className="mono">trnscardapiogrupo</span> · vários cardápios por grupo</div>
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
        {["dados", "cardapios"].map((t) => (
          <button key={t} type="button" className={"btn btn-sm " + (tab === t ? "btn-primary" : "btn-ghost")} disabled={t === "cardapios" && isNew} onClick={() => setTab(t)}>
            {t === "dados" ? "Dados gerais" : "Cardápios do grupo"}
          </button>
        ))}
      </div>

      {tab === "dados" && (
        <div className="panel">
          <div className="panel-body">
            {!isNew && st && <span className={"badge " + st.cls} style={{ marginBottom: 12, display: "inline-flex" }}><span className="dot" />{st.label}</span>}
            <div
              className="filter-grid"
              style={{ gridTemplateColumns: "minmax(90px, 120px) 1fr minmax(220px, 1fr)", gap: "var(--space-4)" }}
            >
              <div className="field">
                <label className="field-label">Código</label>
                <input className="input input--code" readOnly value={form.carGruCodigo ?? ""} />
              </div>
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label className="field-label">Descrição</label>
                <input className="input" value={form.carGruDescricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, carGruDescricao: e.target.value }))} />
              </div>
              <NutricionistaSelect label="Nutricionista" value={form.carGruNutricionista ?? ""} list={nutricionistas} onChange={(v) => setForm((f) => ({ ...f, carGruNutricionista: v }))} />
              <div className="field">
                <label className="field-label">Cozinha central</label>
                <select className="input" value={form.carGruCozinhaCentral ?? "N"} onChange={(e) => setForm((f) => ({ ...f, carGruCozinhaCentral: e.target.value }))}>
                  <option value="N">Não</option><option value="S">Sim</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Situação</label>
                <select className="input" value={form.carGruStatus ?? "A"} onChange={(e) => setForm((f) => ({ ...f, carGruStatus: e.target.value }))}>
                  <option value="A">Ativo</option><option value="I">Inativo</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "cardapios" && !isNew && (
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Cardápios vinculados (carDapGruCodigo)</span></div>
          <div className="panel-body">
            <div className="row gap-2" style={{ marginBottom: 16 }}>
              <select className="input" style={{ flex: 1 }} value={novoCardapio} onChange={(e) => setNovoCardapio(e.target.value)}>
                <option value="">Selecione cardápio para vincular…</option>
                {cardapiosDisp.map((c) => (
                  <option key={c.carDapCodigo} value={String(c.carDapCodigo)}>{c.carDapDescricao}</option>
                ))}
              </select>
              <button type="button" className="btn btn-secondary" onClick={vincularCardapio} disabled={!novoCardapio}><FaIcon icon="fa-plus" /> Vincular</button>
            </div>
            <table className="table">
              <thead><tr><th>Código</th><th>Descrição</th><th>Mês/Ano</th><th>Situação</th></tr></thead>
              <tbody>
                {cardapios.length === 0 ? (
                  <tr><td colSpan={4} className="muted">Nenhum cardápio vinculado a este grupo.</td></tr>
                ) : cardapios.map((c) => (
                  <tr key={c.carDapCodigo}>
                    <td>{c.carDapCodigo}</td>
                    <td>{c.carDapDescricao}</td>
                    <td>{String(c.carDapMesAno || "").slice(0, 10)}</td>
                    <td>{c.carDapStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
