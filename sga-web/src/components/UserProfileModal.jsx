import { useEffect, useState } from "react";
import { apiJson } from "../api/client";
import { FaIcon } from "./Icon";

const GENDER_OPTIONS = [
  { value: "N", label: "Não informado" },
  { value: "F", label: "Feminino" },
  { value: "M", label: "Masculino" },
];

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

export default function UserProfileModal({ open, onClose, user, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      UserName: user.usuUsuario || "",
      UserEMail: user.usuEmail || "",
      Gender: user.gender || "N",
      Phone: user.phone || "",
      UserPwd: "",
      UserPwdConf: "",
    });
    setError(null);
  }, [open, user]);

  if (!open || !form) return null;

  const onChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  };

  const handleSave = async () => {
    if (form.UserPwd && form.UserPwd !== form.UserPwdConf) {
      setError("Senha e confirmação não conferem.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        UserEMail: form.UserEMail,
        Gender: form.Gender,
        Phone: form.Phone,
      };
      if (form.UserPwd) {
        payload.UserPwd = form.UserPwd;
        payload.UserPwdConf = form.UserPwdConf;
      }
      const res = await apiJson("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      onSaved?.(res.user);
      onClose();
    } catch (err) {
      setError(err.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cmd-backdrop open" role="presentation" onClick={onClose}>
      <div
        className="cmd card-pad user-profile-modal"
        role="dialog"
        aria-label="Alterar dados"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-title" style={{ marginBottom: 16 }}>Alterar dados</div>

        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div className="form-grid form-grid--2">
          <Field label="Login">
            <input className="input" value={form.UserName} readOnly />
          </Field>
          <Field label="E-mail">
            <input
              className="input"
              type="email"
              value={form.UserEMail}
              onChange={(e) => onChange("UserEMail", e.target.value)}
            />
          </Field>
          <Field label="Sexo">
            <select className="input" value={form.Gender} onChange={(e) => onChange("Gender", e.target.value)}>
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Telefone">
            <input
              className="input"
              value={form.Phone}
              onChange={(e) => onChange("Phone", e.target.value)}
            />
          </Field>
          <Field label="Senha">
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={form.UserPwd}
              onChange={(e) => onChange("UserPwd", e.target.value)}
              placeholder="Deixe em branco para manter"
            />
          </Field>
          <Field label="Confirmar senha">
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={form.UserPwdConf}
              onChange={(e) => onChange("UserPwdConf", e.target.value)}
            />
          </Field>
        </div>

        <div className="row gap-2" style={{ justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
            <FaIcon icon="fa-check" /> {saving ? "Salvando…" : "Confirmar"}
          </button>
          <button type="button" className="btn btn-secondary" disabled={saving} onClick={onClose}>
            <FaIcon icon="fa-xmark" /> Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
