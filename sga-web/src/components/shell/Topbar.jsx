import { FaIcon } from "../Icon";
import { useAuth } from "../../context/AuthContext";

function displayPrefeitura(user) {
  if (!user) return "Prefeitura";
  return user.prefMunicipio || user.prefNome || `Prefeitura ${user.prefCodigo}`;
}

export default function Topbar({
  onOpenCmd,
  theme,
  onToggleTheme,
  sidebarCollapsed,
  onToggleSidebar,
  hasSidebar,
}) {
  const { user, initials, logout } = useAuth();
  const ano = new Date().getFullYear();

  return (
    <header className="topbar">
      {hasSidebar && (
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onToggleSidebar}
          title="Recolher menu"
        >
          <FaIcon icon={sidebarCollapsed ? "fa-bars-staggered" : "fa-bars"} />
        </button>
      )}
      <div className="topsearch">
        <div className="input-group" onClick={onOpenCmd}>
          <FaIcon icon="fa-magnifying-glass" className="input-icon" />
          <input
            className="input"
            readOnly
            placeholder="Buscar no SGA…"
            style={{ cursor: "pointer", paddingRight: 64 }}
          />
          <span
            className="kbd"
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            Ctrl K
          </span>
        </div>
      </div>
      <div className="spacer" style={{ flex: 1 }} />
      <button type="button" className="context-chip" title={user?.prefNome}>
        <FaIcon icon="fa-location-dot" style={{ color: "var(--brand-text)" }} />
        <span>{displayPrefeitura(user)}</span>
        <span className="k">·&nbsp;{ano}</span>
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        onClick={onToggleTheme}
        title="Alternar tema"
      >
        <FaIcon icon={theme === "dark" ? "fa-sun" : "fa-moon"} />
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        title="Notificações"
        style={{ position: "relative" }}
      >
        <FaIcon icon="fa-bell" />
        <span
          style={{
            position: "absolute",
            top: 7,
            right: 8,
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "var(--accent-500)",
          }}
        />
      </button>
      <div className="row gap-2 topbar-user" style={{ marginLeft: 4 }}>
        <div className="topbar-user-meta">
          <span className="topbar-user-name">{user?.usuNome || user?.usuUsuario}</span>
        </div>
        <button
          type="button"
          className="avatar topbar-avatar"
          title={`${user?.usuNome || ""} — Sair`}
          onClick={() => logout()}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
