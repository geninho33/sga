import { useState } from "react";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";
import { rotaSelectLabel } from "../data/logisticaCatalog";
import { getWwModuleById } from "../data/wwModules";

const TOOL_CONFIGS = {
  remessa: {
    title: "Remessa",
    apiPath: "/api/logistica/wizards/remessa",
    fields: [
      { key: "distLocalOrigem", label: "Local de origem", type: "lookup", lookup: "locais", required: true },
      { key: "distCodigoTipoRemessa", label: "Tipo de remessa", type: "lookup", lookup: "tipos", required: true },
      { key: "distDataEnvio", label: "Data de envio", type: "date", required: true },
      { key: "distObservacao", label: "Observação", type: "text" },
    ],
  },
  "cancelamento-remessa": {
    title: "Cancelamento de Remessa",
    apiPath: "/api/logistica/cancelar-remessa",
    fields: [
      { key: "distCodigo", label: "Código da distribuição", type: "number", required: true },
      { key: "motivo", label: "Motivo", type: "textarea" },
    ],
  },
  largada: {
    title: "Largada",
    apiPath: "/api/logistica/largada",
    fields: [
      { key: "rotaCodigo", label: "Rota", type: "lookup", lookup: "rotas", required: true },
      { key: "distDataEnvio", label: "Data de envio", type: "date", required: true },
    ],
  },
  "rancho-assistente": {
    title: "Rancho Assistente",
    apiPath: "/api/logistica/wizards/rancho-planilha",
    fields: [
      { key: "arquivo", label: "Arquivo da planilha", type: "text", required: true, placeholder: "Nome ou referência do arquivo" },
      { key: "observacao", label: "Observação", type: "textarea" },
    ],
  },
  "rancho-percapta": {
    title: "Rancho PerCapta",
    apiPath: "/api/logistica/ajuste-percapta",
    fields: [
      { key: "prodCodigo", label: "Produto", type: "lookup", lookup: "produtos", required: true },
      { key: "locCodigo", label: "Local", type: "lookup", lookup: "locais", required: true },
      { key: "quantidade", label: "Quantidade", type: "decimal" },
    ],
  },
  "rancho-fixo": {
    title: "Rancho Fixo",
    apiPath: "/api/logistica/wizards/rancho-fixo",
    fields: [
      { key: "mes", label: "Mês", type: "number", required: true },
      { key: "ano", label: "Ano", type: "number", required: true },
      { key: "semana", label: "Semana", type: "number" },
    ],
  },
};

const LOOKUP_MAP = {
  locais: { list: "locais", value: "locCodigo", label: "locDescricao" },
  rotas: { list: "rotas", value: "rotaCodigo", label: "rotaDescricao" },
  tipos: { list: "tipos", value: "disTipNumero", label: "disTipDescricao" },
  produtos: { list: "produtos", value: "prodCodigo", label: "prodDescricao" },
};

function emptyForm(fields) {
  const form = {};
  for (const f of fields) form[f.key] = "";
  return form;
}

function formToPayload(fields, form) {
  const payload = {};
  for (const f of fields) {
    const raw = form[f.key];
    if (raw === "") continue;
    if (f.type === "number" || f.type === "decimal" || f.type === "lookup") {
      payload[f.key] = Number(raw);
    } else {
      payload[f.key] = raw;
    }
  }
  return payload;
}

export default function LogisticaToolPage({ toolId, onBack }) {
  const module = getWwModuleById(toolId);
  const config = TOOL_CONFIGS[toolId];
  const refs = useLogisticaReferencias();
  const [form, setForm] = useState(() => emptyForm(config?.fields ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  if (!config) {
    return (
      <div className="content-inner">
        <p>Ferramenta não configurada.</p>
      </div>
    );
  }

  const onChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      for (const field of config.fields) {
        if (field.required && !String(form[field.key] ?? "").trim()) {
          throw new Error(`${field.label} é obrigatório`);
        }
      }
      const res = await apiJson(config.apiPath, {
        method: "POST",
        body: JSON.stringify(formToPayload(config.fields, form)),
      });
      setMessage(res.message || "Solicitação registrada.");
      setForm(emptyForm(config.fields));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field) => {
    const value = form[field.key] ?? "";

    if (field.type === "lookup") {
      const cfg = LOOKUP_MAP[field.lookup];
      const list = refs[cfg.list] ?? [];
      return (
        <div className="field" key={field.key}>
          <label className="field-label">
            {field.label}
            {field.required && <span className="req"> *</span>}
          </label>
          <select
            className="input"
            value={value}
            disabled={refs.loading}
            onChange={(e) => onChange(field.key, e.target.value)}
          >
            <option value="">Selecione…</option>
            {list.map((item) => (
              <option key={item[cfg.value]} value={String(item[cfg.value])}>
                {field.lookup === "rotas" ? rotaSelectLabel(item) : item[cfg.label]}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div className="field" key={field.key} style={{ gridColumn: "1 / -1" }}>
          <label className="field-label">{field.label}</label>
          <textarea className="input" rows={3} value={value} onChange={(e) => onChange(field.key, e.target.value)} />
        </div>
      );
    }

    const inputType = field.type === "date" ? "date" : field.type === "number" || field.type === "decimal" ? "number" : "text";
    return (
      <div className="field" key={field.key}>
        <label className="field-label">
          {field.label}
          {field.required && <span className="req"> *</span>}
        </label>
        <input
          className="input"
          type={inputType}
          step={field.type === "decimal" ? "any" : undefined}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </div>
    );
  };

  return (
    <div className="content-inner" style={{ maxWidth: 720 }}>
      <Breadcrumb items={[module?.breadcrumbSection || "Logística", module?.title || config.title]} />
      <div className="page-head">
        <div>
          <div className="page-title">{module?.title || config.title}</div>
          <div className="page-desc">
            <span className="mono">{module?.geneXusPanel}</span>
          </div>
        </div>
        {onBack && (
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Voltar
          </button>
        )}
      </div>

      {error && (
        <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
          <div className="panel-body" style={{ color: "var(--danger-fg)" }}>
            <FaIcon icon="fa-xmark" /> {error}
          </div>
        </div>
      )}

      {message && (
        <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
          <div className="panel-body" style={{ color: "var(--success-fg)" }}>
            <FaIcon icon="fa-circle-check" /> {message}
          </div>
        </div>
      )}

      <form className="panel" onSubmit={handleSubmit}>
        <div className="panel-body">
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            {config.fields.map(renderField)}
          </div>
        </div>
        <div className="panel-foot row gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving || refs.loading}>
            {saving ? "Enviando…" : "Executar"}
          </button>
        </div>
      </form>
    </div>
  );
}
