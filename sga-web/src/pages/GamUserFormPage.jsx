import { useCallback, useEffect, useState } from "react";
import { createWwRecord, fetchWwRecord, updateWwRecord } from "../api/cadastroCrud";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import { saveUserRoles } from "../components/MenuPermissionsPanel";
import { FaIcon } from "../components/Icon";
import { getWwModuleById } from "../data/wwModules";
import { getWwFormConfig } from "../data/wwForms";
import { useGamReferencias } from "../hooks/useGamReferencias";

const config = getWwFormConfig("gam-usuarios");
const GENDER_OPTIONS = [
  { value: "N", label: "Não informado" },
  { value: "F", label: "Feminino" },
  { value: "M", label: "Masculino" },
];

function emptyGamForm() {
  return {
    UserGUID: "",
    UserNameSpace: "",
    AuthenticationTypeName: "local",
    UserName: "",
    UserEMail: "",
    UserPwd: "",
    UserPwdConf: "",
    UserFirstName: "",
    UserLastName: "",
    ExternalId: "",
    Birthday: "",
    Gender: "N",
    Phone: "",
    prefCodigoUsuario: "",
    carCodigo: "",
    IsActive: true,
    IsBlocked: false,
    DontReceiveInformation: false,
    CannotChangePassword: false,
    MustChangePassword: false,
    PasswordNeverExpires: false,
  };
}

function rowToForm(row) {
  return {
    UserGUID: row.UserGUID || "",
    UserNameSpace: row.UserNameSpace || "",
    AuthenticationTypeName: row.AuthenticationTypeName || "local",
    UserName: row.UserName || "",
    UserEMail: row.UserEMail || "",
    UserPwd: "",
    UserPwdConf: "",
    UserFirstName: row.UserFirstName || "",
    UserLastName: row.UserLastName || "",
    ExternalId: row.ExternalId || "",
    Birthday: row.Birthday ? String(row.Birthday).slice(0, 10) : "",
    Gender: row.Gender || "N",
    Phone: row.Phone || "",
    prefCodigoUsuario: row.prefCodigoUsuario != null ? String(row.prefCodigoUsuario) : "",
    carCodigo: row.carCodigo != null ? String(row.carCodigo) : "",
    IsActive: row.IsActive !== false && row.Status !== "I",
    IsBlocked: row.IsBlocked === true,
    DontReceiveInformation: row.DontReceiveInformation === true,
    CannotChangePassword: row.CannotChangePassword === true,
    MustChangePassword: row.MustChangePassword === true,
    PasswordNeverExpires: row.PasswordNeverExpires === true,
  };
}

function formToPayload(form, isNew) {
  const payload = {
    AuthenticationTypeName: form.AuthenticationTypeName || "local",
    UserName: form.UserName,
    UserEMail: form.UserEMail,
    UserFirstName: form.UserFirstName,
    UserLastName: form.UserLastName,
    ExternalId: form.ExternalId,
    Birthday: form.Birthday || null,
    Gender: form.Gender || "N",
    Phone: form.Phone,
    prefCodigoUsuario: form.prefCodigoUsuario ? Number(form.prefCodigoUsuario) : null,
    carCodigo: form.carCodigo ? Number(form.carCodigo) : null,
    IsActive: form.IsActive,
    IsBlocked: form.IsBlocked,
    DontReceiveInformation: form.DontReceiveInformation,
    CannotChangePassword: form.CannotChangePassword,
    MustChangePassword: form.MustChangePassword,
    PasswordNeverExpires: form.PasswordNeverExpires,
    Status: form.IsActive && !form.IsBlocked ? "A" : "I",
  };
  if (isNew || form.UserPwd) {
    payload.UserPwd = form.UserPwd;
    payload.UserPwdConf = form.UserPwdConf;
  }
  return payload;
}

function Field({ label, required, children }) {
  return (
    <div className="field">
      <label className="field-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {children}
    </div>
  );
}

function CheckField({ label, checked, onChange, disabled }) {
  return (
    <label className="field field--checkbox">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export default function GamUserFormPage({ recordId, isNew = false, onBack, onCreated }) {
  const module = getWwModuleById("gam-usuarios");
  const referencias = useGamReferencias();
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState("dados");
  const [roleIds, setRoleIds] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);

  const load = useCallback(async () => {
    if (isNew) {
      setForm(emptyGamForm());
      setRoleIds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [row, rolesRes, userRolesRes] = await Promise.all([
        fetchWwRecord(config, recordId),
        apiJson("/api/admin/gam/roles", { params: { limit: 200 } }),
        apiJson(`/api/admin/gam/users/${recordId}/roles`),
      ]);
      setRoles(rolesRes.data ?? []);
      setRoleIds((userRolesRes.data ?? []).map(String));
      setForm(rowToForm(row));
    } catch (err) {
      setError(err.message);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [isNew, recordId]);

  useEffect(() => {
    apiJson("/api/admin/gam/roles", { params: { limit: 200 } })
      .then((res) => setRoles(res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaveMsg(null);
  };

  const handleSave = async () => {
    if (!String(form.UserName ?? "").trim()) {
      setError("Login é obrigatório.");
      return;
    }
    if (isNew && !String(form.UserPwd ?? "").trim()) {
      setError("Senha é obrigatória na inclusão.");
      return;
    }
    if (form.UserPwd && form.UserPwd !== form.UserPwdConf) {
      setError("Senha e confirmação não conferem.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaveMsg(null);
    try {
      const payload = formToPayload(form, isNew);
      if (isNew) {
        const row = await createWwRecord(config, payload);
        if (roleIds.length) await saveUserRoles(row.UserGUID, roleIds.map(Number));
        setSaveMsg("Usuário criado.");
        onCreated?.(row, config);
      } else {
        const row = await updateWwRecord(config, recordId, payload);
        await saveUserRoles(recordId, roleIds.map(Number));
        setForm(rowToForm(row));
        setSaveMsg("Usuário confirmado.");
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

  if (error && !form) {
    return (
      <div className="content-inner" style={{ maxWidth: 1040 }}>
        <Breadcrumb items={[module?.breadcrumbSection, "Usuários", "Erro"]} />
        <div className="panel card-pad">
          <p style={{ color: "var(--danger-fg)" }}>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="content-inner" style={{ maxWidth: 1040 }}>
      <Breadcrumb
        items={[
          module?.breadcrumbSection,
          "Usuários",
          isNew ? "Novo" : form.UserName || "Editar",
        ]}
      />
      <div className="page-header">
        <h1 className="page-title">
          {isNew ? "Novo usuário" : `Usuário — ${form.UserName}`}
        </h1>
        <p className="page-sub muted">GAMUserEntry</p>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {saveMsg && (
        <div className="alert alert-success" role="status">
          {saveMsg}
        </div>
      )}

      <div className="tabs" style={{ marginBottom: 16 }}>
        {[
          { id: "dados", label: "Dados" },
          { id: "identificacao", label: "Identificação" },
          { id: "sistema", label: "Sistema" },
          { id: "opcoes", label: "Opções" },
          { id: "perfil", label: "Perfil" },
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

      <div className="panel card-pad">
        {tab === "dados" && (
          <div className="form-grid form-grid--2">
            {!isNew && (
              <>
                <Field label="GUID">
                  <input className="input" value={form.UserGUID} readOnly />
                </Field>
                <Field label="Namespace">
                  <input className="input" value={form.UserNameSpace} readOnly />
                </Field>
              </>
            )}
            <Field label="Tipo de autenticação">
              <input className="input" value={form.AuthenticationTypeName} readOnly={!isNew} onChange={(e) => onChange("AuthenticationTypeName", e.target.value)} />
            </Field>
            <Field label="Login" required>
              <input className="input" value={form.UserName} readOnly={!isNew} onChange={(e) => onChange("UserName", e.target.value)} />
            </Field>
            <Field label="E-mail">
              <input className="input" value={form.UserEMail} onChange={(e) => onChange("UserEMail", e.target.value)} />
            </Field>
            <Field label="Senha" required={isNew}>
              <input className="input" type="password" autoComplete="new-password" value={form.UserPwd} onChange={(e) => onChange("UserPwd", e.target.value)} placeholder={isNew ? "" : "Deixe em branco para manter"} />
            </Field>
            <Field label="Confirmar senha" required={isNew}>
              <input className="input" type="password" autoComplete="new-password" value={form.UserPwdConf} onChange={(e) => onChange("UserPwdConf", e.target.value)} />
            </Field>
          </div>
        )}

        {tab === "identificacao" && (
          <div className="form-grid form-grid--2">
            <Field label="Nome">
              <input className="input" value={form.UserFirstName} onChange={(e) => onChange("UserFirstName", e.target.value)} />
            </Field>
            <Field label="Sobrenome">
              <input className="input" value={form.UserLastName} onChange={(e) => onChange("UserLastName", e.target.value)} />
            </Field>
            <Field label="ID externo">
              <input className="input" value={form.ExternalId} onChange={(e) => onChange("ExternalId", e.target.value)} />
            </Field>
            <Field label="Data de nascimento">
              <input className="input" type="date" value={form.Birthday} onChange={(e) => onChange("Birthday", e.target.value)} />
            </Field>
            <Field label="Sexo">
              <select className="input" value={form.Gender} onChange={(e) => onChange("Gender", e.target.value)}>
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Telefone">
              <input className="input" value={form.Phone} onChange={(e) => onChange("Phone", e.target.value)} />
            </Field>
          </div>
        )}

        {tab === "sistema" && (
          <div className="form-grid form-grid--2">
            <Field label="Município">
              <select className="input" value={form.prefCodigoUsuario} disabled={referencias.loading} onChange={(e) => onChange("prefCodigoUsuario", e.target.value)}>
                <option value="">Selecione…</option>
                {referencias.prefeituras.map((p) => (
                  <option key={p.prefCodigo} value={String(p.prefCodigo)}>{p.PrefMunicipio || p.prefNome}</option>
                ))}
              </select>
            </Field>
            <Field label="Cargo">
              <select className="input" value={form.carCodigo} disabled={referencias.loading} onChange={(e) => onChange("carCodigo", e.target.value)}>
                <option value="">Selecione…</option>
                {referencias.cargos.map((c) => (
                  <option key={c.carCodigo} value={String(c.carCodigo)}>{c.carDescricao}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {tab === "opcoes" && (
          <div className="form-grid form-grid--2">
            <CheckField label="Conta ativa" checked={form.IsActive} onChange={(v) => onChange("IsActive", v)} />
            <CheckField label="Conta bloqueada" checked={form.IsBlocked} onChange={(v) => onChange("IsBlocked", v)} />
            <CheckField label="Não receber informações" checked={form.DontReceiveInformation} onChange={(v) => onChange("DontReceiveInformation", v)} />
            <CheckField label="Não pode alterar senha" checked={form.CannotChangePassword} onChange={(v) => onChange("CannotChangePassword", v)} />
            <CheckField label="Deve alterar senha no próximo login" checked={form.MustChangePassword} onChange={(v) => onChange("MustChangePassword", v)} />
            <CheckField label="Senha nunca expira" checked={form.PasswordNeverExpires} onChange={(v) => onChange("PasswordNeverExpires", v)} />
          </div>
        )}

        {tab === "perfil" && (
          <div>
            <p className="muted" style={{ marginBottom: 12 }}>Perfis GAM atribuídos ao usuário.</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {roles.map((r, idx) => (
                <label
                  key={`role-${r.RoleId}-${idx}`}
                  className="panel card-pad field field--checkbox"
                  style={{ margin: 0, cursor: "pointer", alignItems: "flex-start" }}
                >
                  <input
                    type="checkbox"
                    checked={roleIds.includes(String(r.RoleId))}
                    onChange={(e) => {
                      const id = String(r.RoleId);
                      setRoleIds((prev) => (e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)));
                    }}
                  />
                  <span>
                    <strong style={{ display: "block" }}>{r.RoleName}</strong>
                    {r.RoleDsc && <span className="muted" style={{ fontSize: "var(--text-sm)" }}>{r.RoleDsc}</span>}
                  </span>
                </label>
              ))}
            </div>
            {roles.length === 0 && <p className="muted">Nenhum perfil cadastrado.</p>}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
          <FaIcon icon="fa-check" /> {saving ? "Salvando…" : "Confirmar"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          <FaIcon icon="fa-xmark" /> Fechar
        </button>
      </div>
    </div>
  );
}
