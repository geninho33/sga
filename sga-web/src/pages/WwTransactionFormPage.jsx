import { useCallback, useEffect, useState } from "react";
import { createWwRecord, fetchWwRecord, updateWwRecord } from "../api/cadastroCrud";
import { apiJson } from "../api/client";
import AtendimentoDoencasPanel from "../components/AtendimentoDoencasPanel";
import DistribuicaoItensPanel from "../components/DistribuicaoItensPanel";
import AjusteItensPanel from "../components/AjusteItensPanel";
import RomaneioItensPanel from "../components/RomaneioItensPanel";
import NotaItensPanel from "../components/NotaItensPanel";
import { apiFetch } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import { PRODUTO_STATUS } from "../data/modules";
import { rotaSelectLabel } from "../data/logisticaCatalog";
import { getWwModuleById } from "../data/wwModules";
import { emptyForm, formToPayload, getFormFields, getWwFormConfig, recordToForm } from "../data/wwForms";
import { useProdutoReferencias } from "../hooks/useProdutoReferencias";
import { usePreparacaoReferencias } from "../hooks/usePreparacaoReferencias";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";

const LOOKUP_CFG = {
  unidade: { list: "unidades", value: "uniCodigo", label: "uniDescricao" },
  tiposRefeicao: { list: "tiposRefeicao", value: "refTipCodigo", label: "refTipDescricao" },
  locais: { list: "locais", value: "locCodigo", label: "locDescricao" },
  cardapioGrupos: { list: "cardapioGrupos", value: "carGruCodigo", label: "carGruDescricao" },
  cardapios: { list: "cardapios", value: "carDapCodigo", label: "carDapDescricao" },
  nutricionistas: { list: "nutricionistas", value: "usuCodigo", label: "usuNome" },
  areasEnsino: { list: "areasEnsino", value: "AreEnsCodigo", label: "AreEnsNome" },
  etapasEnsino: { list: "etapasEnsino", value: "AreEnsSequencial", label: "AreEnsEtapaNome" },
  fornecedores: { list: "fornecedores", value: "forCodigo", label: "forNome" },
  locaisLogistica: { list: "locaisLogistica", value: "locCodigo", label: "locDescricao" },
  produtosLogistica: { list: "produtosLogistica", value: "prodCodigo", label: "prodDescricao" },
  tiposDistribuicao: { list: "tiposDistribuicao", value: "disTipNumero", label: "disTipDescricao" },
  rotasLogistica: { list: "rotasLogistica", value: "rotaCodigo", label: "rotaDescricao" },
  tiposAjuste: { list: "tiposAjuste", value: "tipajuCodigo", label: "tipajuNome" },
};

function ImageField({ field, form, onChange, recordId, isNew }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let objectUrl = null;
    const raw = form[field.key] ?? "";

    if (raw.startsWith("data:")) {
      setPreview(raw);
      return undefined;
    }

    if (!isNew && raw === "__EXISTING__" && recordId && field.imageApiPath) {
      (async () => {
        try {
          const res = await apiFetch(`${field.imageApiPath}/${recordId}/logo`);
          if (res.ok) {
            const blob = await res.blob();
            objectUrl = URL.createObjectURL(blob);
            setPreview(objectUrl);
          } else {
            setPreview(null);
          }
        } catch {
          setPreview(null);
        }
      })();
    } else {
      setPreview(null);
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [field.imageApiPath, field.key, form[field.key], isNew, recordId]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(field.key, reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="field" style={{ gridColumn: "1 / -1" }}>
      <label className="field-label">{field.label}</label>
      <div className="row gap-4 wrap" style={{ alignItems: "flex-start" }}>
        {preview ? (
          <img
            src={preview}
            alt={field.label}
            style={{ maxWidth: 220, maxHeight: 120, objectFit: "contain", border: "1px solid var(--border)", borderRadius: 8, padding: 8, background: "#fff" }}
          />
        ) : (
          <div className="muted" style={{ padding: "1.5rem", border: "1px dashed var(--border)", borderRadius: 8 }}>
            Nenhuma logomarca cadastrada
          </div>
        )}
        <div className="row gap-2" style={{ flexDirection: "column", alignItems: "flex-start" }}>
          <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
            <FaIcon icon="fa-upload" /> Enviar imagem
            <input type="file" accept="image/*" hidden onChange={onFile} />
          </label>
          {preview && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(field.key, "")}>
              Remover
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ field, form, onChange, referencias, isNew, recordId }) {
  const value = form[field.key] ?? "";
  const disabled = field.readOnly || (!isNew && field.readOnlyOnEdit);
  const showField = !field.insertOnly || isNew;

  if (!showField) return null;

  if (field.type === "image") {
    return <ImageField field={field} form={form} onChange={onChange} recordId={recordId} isNew={isNew} />;
  }

  if (field.type === "select") {
    return (
      <div className="field">
        <label className="field-label">
          {field.label}
          {field.required && <span className="req"> *</span>}
        </label>
        <select className={"input" + (disabled ? " input--code" : "")} value={value} disabled={disabled} onChange={(e) => onChange(field.key, e.target.value)}>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "lookup") {
    const cfg = LOOKUP_CFG[field.lookup] || LOOKUP_CFG.unidade;
    const list = referencias?.[cfg.list] ?? [];
    return (
      <div className="field">
        <label className="field-label">
          {field.label}
          {field.required && <span className="req"> *</span>}
        </label>
        <select
          className={"input" + (disabled ? " input--code" : "")}
          value={value}
          disabled={disabled || referencias?.loading}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          <option value="">Selecione…</option>
          {list.map((u, i) => (
            <option key={`${field.lookup}-${u[cfg.value] ?? i}`} value={String(u[cfg.value] ?? "")}>
              {field.lookup === "rotasLogistica" ? rotaSelectLabel(u) : u[cfg.label]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label className="field-label">{field.label}</label>
        <textarea className={"input" + (disabled ? " input--code" : "")} rows={4} value={value} readOnly={disabled} onChange={(e) => onChange(field.key, e.target.value)} />
      </div>
    );
  }

  if (field.type === "time") {
    return (
      <div className="field">
        <label className="field-label">
          {field.label}
          {field.required && <span className="req"> *</span>}
        </label>
        <input
          className={"input" + (disabled ? " input--code" : "")}
          type="time"
          value={value}
          readOnly={disabled}
          disabled={disabled}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </div>
    );
  }

  const inputType = field.type === "password" ? "password" : field.type === "date" ? "date" : field.type === "number" || field.type === "decimal" ? "number" : "text";
  const isNum = field.type === "number" || field.type === "decimal";
  return (
    <div className="field">
      <label className="field-label">
        {field.label}
        {field.required && <span className="req"> *</span>}
        {field.insertOnly && isNew && <span className="muted" style={{ fontSize: "var(--text-xs)" }}> (inclusão)</span>}
      </label>
      <input
        className={"input" + (disabled ? " input--code" : "")}
        type={inputType}
        step={field.type === "decimal" ? "any" : undefined}
        value={value}
        readOnly={disabled && field.type !== "password"}
        disabled={disabled && field.type === "password"}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    </div>
  );
}

export default function WwTransactionFormPage({ moduleId, recordId, isNew = false, initialTab, onBack, onCreated }) {
  const module = getWwModuleById(moduleId);
  const config = getWwFormConfig(moduleId);
  const { unidades, loading: uniLoading } = useProdutoReferencias();
  const prepRefs = usePreparacaoReferencias();
  const logRefs = useLogisticaReferencias();
  const [tiposAjuste, setTiposAjuste] = useState([]);

  useEffect(() => {
    if (moduleId !== "ajuste") return;
    apiJson("/api/cadastro/tipos-ajuste", { params: { limit: 200 } })
      .then((res) => setTiposAjuste(res.data ?? []))
      .catch(() => setTiposAjuste([]));
  }, [moduleId]);

  const referencias = {
    unidades,
    ...prepRefs,
    fornecedores: logRefs.fornecedores,
    locaisLogistica: logRefs.locais,
    produtosLogistica: logRefs.produtos,
    tiposDistribuicao: logRefs.tipos,
    rotasLogistica: logRefs.rotas,
    tiposAjuste,
    locais: logRefs.locais.length ? logRefs.locais : prepRefs.locais,
    produtos: logRefs.produtos.length ? logRefs.produtos : prepRefs.produtos,
    loading: uniLoading || prepRefs.loading || logRefs.loading,
  };

  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);
  const [doencasItems, setDoencasItems] = useState([]);
  const [doencasCatalogo, setDoencasCatalogo] = useState([]);
  const [comprasTab, setComprasTab] = useState(initialTab === "itens" ? "itens" : "dados");
  const guiaTabs = moduleId === "guia-distribuicao";
  const ajusteTabs = moduleId === "ajuste";
  const [guiaTab, setGuiaTab] = useState(initialTab === "itens" ? "itens" : "dados");
  const [ajusteTab, setAjusteTab] = useState(initialTab === "itens" ? "itens" : "dados");
  const formTab = guiaTabs ? guiaTab : ajusteTabs ? ajusteTab : comprasTab;
  const setFormTab = guiaTabs ? setGuiaTab : ajusteTabs ? setAjusteTab : setComprasTab;
  const hasItemTab = moduleId === "compras" || guiaTabs || ajusteTabs;
  const itensTabLabel = ajusteTabs ? "Itens do Ajuste" : "Itens";

  const title = module?.title?.replace(/^Listagem de /, "") || moduleId;
  const statusKey = module?.statusField;
  const st = statusKey && meta?.[statusKey] ? PRODUTO_STATUS[meta[statusKey]] || PRODUTO_STATUS.A : null;

  const load = useCallback(async () => {
    if (!config) return;
    if (isNew) {
      setForm(emptyForm(config));
      setMeta(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await fetchWwRecord(config, recordId);
      setForm(recordToForm(config, row));
      setMeta(row);
    } catch (err) {
      setError(err.message);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [config, isNew, recordId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (moduleId !== "atendimentos") return;
    apiJson("/api/cadastro/doencas", { params: { status: "A", limit: 200 } })
      .then((res) => setDoencasCatalogo(res.data ?? []))
      .catch(() => setDoencasCatalogo([]));
  }, [moduleId]);

  const onChange = (key, value) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (moduleId === "atendimentos" && key === "carGruCodigo" && value) {
        const grupo = prepRefs.cardapioGrupos?.find((g) => String(g.carGruCodigo) === String(value));
        if (grupo?.carDapCodigo) {
          next.carDapCodigo = String(grupo.carDapCodigo);
        }
      }
      return next;
    });
    setSaveMsg(null);
  };

  const handleSave = async () => {
    if (!config) return;
    for (const key of config.requiredFields || []) {
      if (!String(form[key] ?? "").trim()) {
        const f = getFormFields(config).find((x) => x.key === key);
        setError(`${f?.label || key} é obrigatório.`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    setSaveMsg(null);
    try {
      const payload = formToPayload(config, form, isNew);
      if (isNew) {
        const row = await createWwRecord(config, payload);
        setSaveMsg("Registro criado.");
        onCreated?.(row, config);
      } else {
        const row = await updateWwRecord(config, recordId, payload);
        setForm(recordToForm(config, row));
        setMeta(row);
        if (moduleId === "atendimentos") {
          await apiJson(`/api/preparacao/atendimentos/${recordId}/doencas`, {
            method: "PUT",
            body: JSON.stringify({ items: doencasItems }),
          });
        }
        setSaveMsg("Registro confirmado.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return null;
  }

  if (loading) {
    return (
      <div className="content-inner" style={{ maxWidth: 1040 }}>
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="content-inner" style={{ maxWidth: 1040 }}>
        <Breadcrumb items={[module?.breadcrumbSection, title, "Erro"]} />
        <div className="panel card-pad">
          <p style={{ color: "var(--danger-fg)" }}>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="content-inner" style={{ maxWidth: 1040 }}>
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  const pageTitle = isNew ? "Inserir" : "Alterar";
  const breadcrumbTail = isNew ? "Inserir" : String(recordId);

  return (
    <div className="content-inner" style={{ maxWidth: 1040 }}>
      <Breadcrumb items={[module?.breadcrumbSection || "Cadastro", title, breadcrumbTail]} />

      <div className="page-head">
        <div>
          <div className="page-title">
            {pageTitle} · {title}
          </div>
          <div className="page-desc">
            <span className="mono">{config.transaction}</span>
            {config.editObject && config.editObject !== config.transaction && (
              <>
                {" "}
                · objeto <span className="mono">{config.editObject}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {(error || saveMsg) && (
        <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
          <div className="panel-body" style={{ padding: "var(--space-4)" }}>
            <p style={{ margin: 0, color: error ? "var(--danger-fg)" : "var(--success-fg)", fontSize: "var(--text-sm)" }}>
              {error || saveMsg}
            </p>
          </div>
        </div>
      )}

      {hasItemTab && !isNew && (
        <div className="tabs" style={{ marginBottom: "var(--space-4)" }}>
          {[
            { id: "dados", label: "Dados" },
            { id: "itens", label: itensTabLabel },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={"btn btn-sm " + (formTab === t.id ? "btn-primary" : "btn-ghost")}
              onClick={() => setFormTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {(!hasItemTab || isNew || formTab === "dados") && (
      <div className="panel">
        <div className="panel-body">
          {!isNew && st && (
            <div style={{ marginBottom: "var(--space-4)" }}>
              <span className={"badge " + st.cls}>
                <span className="dot" />
                {st.label}
              </span>
            </div>
          )}
          {(config.sections?.length ? config.sections : [{ title: null, fields: config.fields }]).map((section) => (
            <div key={section.title || "main"} style={{ marginBottom: section.title ? "var(--space-5)" : 0 }}>
              {section.title ? (
                <div className="panel-head" style={{ marginBottom: "var(--space-3)", paddingBottom: "var(--space-2)" }}>
                  <span className="panel-title">{section.title}</span>
                </div>
              ) : null}
              <div
                className="filter-grid"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
              >
                {section.fields.map((field) => (
                  <FormField key={field.key} field={field} form={form} onChange={onChange} referencias={referencias} isNew={isNew} recordId={recordId} />
                ))}
              </div>
            </div>
          ))}
          {moduleId === "atendimentos" && !isNew && (
            <AtendimentoDoencasPanel
              atendimentoCodigo={recordId}
              doencasCatalogo={doencasCatalogo}
              onChange={setDoencasItems}
            />
          )}
        </div>
      </div>
      )}

      {moduleId === "compras" && !isNew && formTab === "itens" && (
        <div className="panel">
          <div className="panel-body">
            <NotaItensPanel
              notaCodigo={recordId}
              codigoDisplay={recordId}
              fornecedorNome={meta?.notaFornecedorNome}
              readOnly={meta?.notaStatus === "C" || form?.notaStatus === "C"}
            />
          </div>
        </div>
      )}

      {guiaTabs && !isNew && formTab === "itens" && (
        <div className="panel">
          <div className="panel-body">
            <DistribuicaoItensPanel
              distCodigo={recordId}
              codigoDisplay={recordId}
              destinoNome={meta?.distLocalDestinoNome}
              readOnly={meta?.distStatus === "C" || form?.distStatus === "C"}
            />
          </div>
        </div>
      )}

      {ajusteTabs && !isNew && formTab === "itens" && (
        <div className="panel">
          <div className="panel-body">
            <AjusteItensPanel ajusCodigo={recordId} readOnly={meta?.ajusStatus === "C"} />
          </div>
        </div>
      )}

      {moduleId === "romaneio" && !isNew && (
        <div className="panel" style={{ marginTop: "var(--space-5)" }}>
          <div className="panel-body">
            <RomaneioItensPanel
              romanCodigo={recordId}
              codigoDisplay={recordId}
              readOnly={!!meta?.notaCodigo}
            />
          </div>
        </div>
      )}

      <div className="panel-foot" style={{ marginTop: "var(--space-6)", justifyContent: "flex-end" }}>
        <div className="row gap-2">
          <button type="button" className="btn btn-ghost" onClick={onBack} disabled={saving}>
            Fechar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <FaIcon icon="fa-check" /> {saving ? "Confirmando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
