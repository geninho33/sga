import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FaIcon } from "../components/Icon";

export default function LoginPage() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(usuario.trim(), senha);
    } catch (err) {
      setError(err.message || "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card card">
        <div className="login-brand">
          <div className="login-logo">
            <FaIcon icon="fa-utensils" />
          </div>
          <div>
            <h1 className="login-title">SGA</h1>
            <p className="login-subtitle">Alimentação Escolar</p>
          </div>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="field">
            <span className="field-label">Usuário</span>
            <input
              className="input"
              type="text"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Seu login"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Senha</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              required
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
