import { useCallback, useEffect, useState } from "react";
import { createProduto, fetchProduto, inativarProduto, reativarProduto, updateProduto, aplicarTabelaTacoProduto } from "../api/produtos";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import { PRODUTO_STATUS } from "../data/modules";
import {
  PRODUTO_FIELD_META,
  PRODUTO_FORM_LAYOUT,
  PRODUTO_TABS,
  PRODUTO_TRANSACTION,
  SN_OPTIONS,
  emptyProdutoForm,
  formToPayload,
  produtoToForm,
} from "../data/produtoForm";
import { useProdutoReferencias } from "../hooks/useProdutoReferencias";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

function buildLookupOptions(meta, referencias, currentValue) {
  const empty = [{ value: "", label: "Selecione…" }];
  const cur = currentValue !== null && currentValue !== undefined && currentValue !== "" ? String(currentValue) : "";

  if (meta.lookup === "grupo") {
    const list = referencias?.grupos ?? [];
    const opts = list.map((g) => ({
      value: String(g.prodGrupCodigo),
      label: g.prodGrupDescricao,
    }));
    if (cur && !opts.some((o) => o.value === cur)) {
      opts.unshift({ value: cur, label: `(cód. ${cur})` });
    }
    return [...empty, ...opts];
  }

  if (meta.lookup === "origem") {
    const list = referencias?.origens ?? [];
    const opts = list.map((o) => ({
      value: String(o.prodOrigCodigo),
      label: o.prodOrigAbreviatura,
    }));
    if (cur && !opts.some((o) => o.value === cur)) {
      opts.unshift({ value: cur, label: `(cód. ${cur})` });
    }
    return [...empty, ...opts];
  }

  if (meta.lookup === "remessa") {
    const list = referencias?.tiposRemessa ?? [];
    const opts = list.map((r) => ({
      value: String(r.disTipNumero),
      label: r.disTipDescricao,
    }));
    if (cur && !opts.some((o) => o.value === cur)) {
      opts.unshift({ value: cur, label: `(cód. ${cur})` });
    }
    return [...empty, ...opts];
  }

  if (meta.lookup === "taco") {
    const list = referencias?.tacos ?? [];
    const opts = list.map((t) => ({
      value: String(t.tacoCodigo),
      label: t.tacoDescricao,
    }));
    if (cur && !opts.some((o) => o.value === cur)) {
      opts.unshift({ value: cur, label: `(cód. ${cur})` });
    }
    return [...empty, ...opts];
  }

  if (meta.lookup === "unidade") {
    const list = referencias?.unidades ?? [];
    const opts = list.map((u) => ({
      value: String(u.uniCodigo),
      label: u.uniDescricao,
    }));
    if (cur && !opts.some((o) => o.value === cur)) {
      opts.unshift({ value: cur, label: `(cód. ${cur})` });
    }
    return [...empty, ...opts];
  }

  return empty;
}

function FormField({ name, form, onChange, readOnly: readOnlyOverride, referencias }) {
  const meta = PRODUTO_FIELD_META[name];
  if (!meta) return null;

  const readOnly = readOnlyOverride ?? meta.readOnly;
  const value = form[name] ?? "";

  if (meta.type === "lookup") {
    const options = buildLookupOptions(meta, referencias, value);
    return (
      <div className="field">
        <label className="field-label">
          {meta.label}
          {meta.required && <span className="req"> *</span>}
        </label>
        <select
          className={"input" + (readOnly ? " input--code" : "")}
          value={value}
          disabled={readOnly || referencias?.loading}
          onChange={(e) => onChange(name, e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value || "__empty"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (meta.type === "select" || meta.type === "sn") {
    const options = meta.type === "sn" ? SN_OPTIONS : meta.options;
    return (
      <div className="field">
        <label className="field-label">
          {meta.label}
          {meta.required && <span className="req"> *</span>}
        </label>
        <select
          className={"input" + (readOnly ? " input--code" : "")}
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(name, e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const isDecimal = meta.type === "decimal" || meta.type === "number";
  return (
    <div className="field">
      <label className="field-label">
        {meta.label}
        {meta.required && <span className="req"> *</span>}
      </label>
      <input
        className={"input" + (readOnly ? " input--code" : "")}
        type={isDecimal ? "number" : "text"}
        step={meta.type === "decimal" ? "any" : undefined}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </div>
  );
}

function FieldGrid({ fields, form, onChange, columns = 2, referencias }) {
  return (
    <div
      className="filter-grid"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 4 ? 160 : 220}px, 1fr))` }}
    >
      {fields.map((name) => (
        <FormField key={name} name={name} form={form} onChange={onChange} referencias={referencias} />
      ))}
    </div>
  );
}

function FormSection({ section, form, onChange, isNew, referencias, onAplicarTaco, applyingTaco }) {
  if (section.tacoRow) {
    return (
      <div className="row gap-3 wrap" style={{ marginBottom: "var(--space-5)" }}>
        <div style={{ flex: "1 1 240px", maxWidth: 320 }}>
          <FormField name="prodTaco" form={form} onChange={onChange} referencias={referencias} />
        </div>
        {isNew && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ alignSelf: "end" }}
            disabled={!form?.prodTaco || applyingTaco}
            title="PRCDAplicarTabelaTaco"
            onClick={onAplicarTaco}
          >
            <FaIcon icon="fa-table" /> {applyingTaco ? "Aplicando…" : "Aplicar"}
          </button>
        )}
      </div>
    );
  }

  if (section.panel) {
    return (
      <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
        <div className="panel-head">
          <span className="panel-title">{section.panel}</span>
        </div>
        <div className="panel-body">
          <FieldGrid fields={section.fields} form={form} onChange={onChange} columns={section.columns} referencias={referencias} />
        </div>
      </div>
    );
  }

  if (section.group) {
    return (
      <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
        <div className="panel-head">
          <span className="panel-title">{section.group}</span>
        </div>
        <div className="panel-body">
          <FieldGrid
            fields={section.fields}
            form={form}
            onChange={onChange}
            columns={section.columns || 2}
            referencias={referencias}
          />
          {section.nested && (
            <div className="panel" style={{ marginTop: "var(--space-5)" }}>
              <div className="panel-head">
                <span className="panel-title">{section.nested.group}</span>
              </div>
              <div className="panel-body">
                <FieldGrid fields={section.nested.fields} form={form} onChange={onChange} referencias={referencias} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "var(--space-5)" }}>
      <FieldGrid fields={section.fields} form={form} onChange={onChange} referencias={referencias} />
    </div>
  );
}

export default function ProdutoFormPage({ isNew = false, prodCodigo, onBack, onCreated }) {
  const { grupos, origens, tiposRemessa, tacos, unidades, loading: refsLoading } = useProdutoReferencias();
  const referencias = { grupos, origens, tiposRemessa, tacos, unidades, loading: refsLoading };
  const [tab, setTab] = useState("dadosGerais");
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [inactivating, setInactivating] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const statusBusy = saving || inactivating || reactivating;
  const [error, setError] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);
  const [applyingTaco, setApplyingTaco] = useState(false);

  const load = useCallback(async () => {
    if (isNew) {
      setForm(emptyProdutoForm());
      setMeta(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProduto(prodCodigo);
      setForm(produtoToForm(res.data));
      setMeta(res.data);
    } catch (err) {
      setError(err.message);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [isNew, prodCodigo]);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaveMsg(null);
  };

  const handleAplicarTaco = async () => {
    if (!form?.prodTaco) {
      setError("Selecione uma tabela Taco antes de aplicar.");
      setTab("composicao");
      return;
    }
    setApplyingTaco(true);
    setError(null);
    setSaveMsg(null);
    try {
      const res = await aplicarTabelaTacoProduto(form.prodTaco);
      const vals = res.data || {};
      setForm((f) => {
        const next = { ...f };
        for (const [k, v] of Object.entries(vals)) {
          next[k] = v === null || v === undefined ? "" : String(v);
        }
        return next;
      });
      setSaveMsg(
        res.tacoDescricao
          ? `Valores nutricionais aplicados da tabela "${res.tacoDescricao}".`
          : "Valores nutricionais aplicados da tabela Taco."
      );
      setTab("composicao");
    } catch (err) {
      setError(err.message);
    } finally {
      setApplyingTaco(false);
    }
  };

  const handleSave = async () => {
    if (!form.prodDescricao?.trim()) {
      setError("Descrição é obrigatória.");
      setTab("dadosGerais");
      return;
    }
    setSaving(true);
    setError(null);
    setSaveMsg(null);
    try {
      const payload = formToPayload(form);
      if (isNew) {
        const res = await createProduto(payload);
        setSaveMsg(`Produto criado com código ${res.data.prodCodigo}.`);
        onCreated?.(res.data);
      } else {
        const res = await updateProduto(prodCodigo, payload);
        setForm(produtoToForm(res.data));
        setMeta(res.data);
        setSaveMsg("Registro confirmado.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInativar = async () => {
    if (isNew || form?.prodStatus === "I") return;
    if (!window.confirm(`Inativar o produto "${form?.prodDescricao}"?`)) return;
    setInactivating(true);
    setError(null);
    setSaveMsg(null);
    try {
      const res = await inativarProduto(prodCodigo);
      setForm(produtoToForm(res.data));
      setMeta(res.data);
      setSaveMsg(res.message || "Produto inativado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setInactivating(false);
    }
  };

  const handleReativar = async () => {
    if (isNew || form?.prodStatus === "A") return;
    if (!window.confirm(`Reativar o produto "${form?.prodDescricao}"?`)) return;
    setReactivating(true);
    setError(null);
    setSaveMsg(null);
    try {
      const res = await reativarProduto(prodCodigo);
      setForm(produtoToForm(res.data));
      setMeta(res.data);
      setSaveMsg(res.message || "Produto reativado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setReactivating(false);
    }
  };

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
        <Breadcrumb items={["Cadastro", "Alimentos", "Erro"]} />
        <div className="panel card-pad">
          <p style={{ color: "var(--danger-fg)" }}>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const st = PRODUTO_STATUS[form?.prodStatus || meta?.prodStatus] || PRODUTO_STATUS.A;
  const pageTitle = isNew ? "Inserir" : "Alterar";
  const breadcrumbTail = isNew ? "Inserir" : String(prodCodigo);

  return (
    <div className="content-inner" style={{ maxWidth: 1040 }}>
      <Breadcrumb items={["Cadastro", "Alimentos", breadcrumbTail]} />

      <div className="page-head">
        <div>
          <div className="page-title">
            {pageTitle} · Alimentos
          </div>
          <div className="page-desc">
            <span className="mono">{PRODUTO_TRANSACTION}</span>
            {!isNew && meta?.prodDataAlt && (
              <> · alterado em {formatDate(meta.prodDataAlt)}</>
            )}
          </div>
        </div>
        <div className="page-actions">
          {!isNew && form?.prodStatus === "A" && (
            <button type="button" className="btn btn-danger" onClick={handleInativar} disabled={statusBusy}>
              <FaIcon icon="fa-ban" /> {inactivating ? "Inativando…" : "Inativar"}
            </button>
          )}
          {!isNew && form?.prodStatus === "I" && (
            <button type="button" className="btn btn-secondary" onClick={handleReativar} disabled={statusBusy}>
              <FaIcon icon="fa-check" /> {reactivating ? "Reativando…" : "Reativar"}
            </button>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
        <div className="panel-body">
          <div className="filter-grid" style={{ gridTemplateColumns: "140px 1fr auto" }}>
            {!isNew && (
              <FormField name="prodCodigo" form={form} onChange={onChange} readOnly referencias={referencias} />
            )}
            <div className="field" style={{ gridColumn: isNew ? "1 / -1" : undefined }}>
              <label className="field-label">
                Descrição <span className="req">*</span>
              </label>
              <input
                className="input"
                value={form.prodDescricao}
                onChange={(e) => onChange("prodDescricao", e.target.value)}
              />
            </div>
            {!isNew && (
              <div className="field" style={{ alignSelf: "end" }}>
                <span className={"badge " + st.cls}>
                  <span className="dot" />
                  {st.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {(error || saveMsg) && (
        <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
          <div className="panel-body" style={{ padding: "var(--space-4)" }}>
            <p
              style={{
                margin: 0,
                color: error ? "var(--danger-fg)" : "var(--success-fg)",
                fontSize: "var(--text-sm)",
              }}
            >
              {error || saveMsg}
            </p>
          </div>
        </div>
      )}

      <div className="tabs">
        {PRODUTO_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            <FaIcon icon={t.icon} style={{ marginRight: 8, fontSize: 13 }} />
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "var(--space-5)" }}>
        {(PRODUTO_FORM_LAYOUT[tab] || []).map((section, i) => (
          <FormSection
            key={i}
            section={section}
            form={form}
            onChange={onChange}
            isNew={isNew}
            referencias={referencias}
            onAplicarTaco={handleAplicarTaco}
            applyingTaco={applyingTaco}
          />
        ))}
      </div>

      <div className="panel-foot" style={{ marginTop: "var(--space-6)", justifyContent: "flex-end" }}>
        <div className="row gap-2">
          <button type="button" className="btn btn-ghost" onClick={onBack} disabled={statusBusy}>
            Fechar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={statusBusy}>
            <FaIcon icon="fa-check" /> {saving ? "Confirmando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
