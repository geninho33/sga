import { useCallback, useEffect, useState } from "react";
import { createWwRecord, fetchWwRecord, updateWwRecord } from "../api/cadastroCrud";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import MenuPermissionsPanel, { saveRoleMenus } from "../components/MenuPermissionsPanel";
import { FaIcon } from "../components/Icon";
import { getWwModuleById } from "../data/wwModules";
import { getWwFormConfig } from "../data/wwForms";

const config = getWwFormConfig("gam-perfis");

export default function GamRoleFormPage({ recordId, isNew = false, onBack, onCreated }) {
  const module = getWwModuleById("gam-perfis");
  const [form, setForm] = useState({ RoleName: "", RoleDsc: "" });
  const [menuIds, setMenuIds] = useState([]);
  const [tab, setTab] = useState("dados");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);

  const load = useCallback(async () => {
    if (isNew) {
      setForm({ RoleName: "", RoleDsc: "" });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await fetchWwRecord(config, recordId);
      setForm({ RoleName: row.RoleName || "", RoleDsc: row.RoleDsc || "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isNew, recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!String(form.RoleName ?? "").trim()) {
      setError("Nome é obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaveMsg(null);
    try {
      let roleId = recordId;
      if (isNew) {
        const row = await createWwRecord(config, form);
        roleId = row.RoleId;
        await saveRoleMenus(roleId, menuIds);
        setSaveMsg("Perfil criado.");
        onCreated?.(row, config);
      } else {
        await updateWwRecord(config, recordId, form);
        await saveRoleMenus(recordId, menuIds);
        setSaveMsg("Perfil confirmado.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="content-inner" style={{ maxWidth: 1040 }}>
        <p className="muted">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="content-inner" style={{ maxWidth: 1040 }}>
      <Breadcrumb items={[module?.breadcrumbSection, "Perfis", isNew ? "Novo" : form.RoleName || "Editar"]} />
      <div className="page-header">
        <h1 className="page-title">{isNew ? "Novo perfil" : `Perfil — ${form.RoleName}`}</h1>
        <p className="page-sub muted">GAMRoleEntry</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {saveMsg && <div className="alert alert-success">{saveMsg}</div>}

      <div className="tabs" style={{ marginBottom: 16 }}>
        {[
          { id: "dados", label: "Dados" },
          { id: "permissoes", label: "Permissões de menu" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={"btn btn-sm " + (tab === t.id ? "btn-primary" : "btn-ghost")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dados" && (
        <div className="panel card-pad">
          <div className="form-grid form-grid--2">
            {!isNew && (
              <div className="field">
                <label className="field-label">Código</label>
                <input className="input" value={recordId} readOnly />
              </div>
            )}
            <div className="field">
              <label className="field-label">Nome *</label>
              <input className="input" value={form.RoleName} onChange={(e) => setForm((f) => ({ ...f, RoleName: e.target.value }))} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label className="field-label">Descrição</label>
              <input className="input" value={form.RoleDsc} onChange={(e) => setForm((f) => ({ ...f, RoleDsc: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      {tab === "permissoes" && (
        <div className="panel card-pad" style={{ padding: 16 }}>
          <p className="muted" style={{ marginBottom: 16 }}>
            Selecione os menus que este perfil pode acessar (GAMRolePermissionSelect).
          </p>
          {(isNew && !recordId) ? (
            <MenuPermissionsPanel roleId={null} onChange={setMenuIds} />
          ) : (
            <MenuPermissionsPanel roleId={recordId} onChange={setMenuIds} />
          )}
          {isNew && (
            <p className="muted" style={{ marginTop: 12, fontSize: "var(--text-sm)" }}>
              As permissões serão gravadas ao confirmar o perfil.
            </p>
          )}
        </div>
      )}

      <div className="panel-foot row gap-2" style={{ marginTop: 24, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={saving}>Fechar</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <FaIcon icon="fa-check" /> {saving ? "Confirmando…" : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
