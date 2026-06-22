import { useEffect, useRef, useState } from "react";
import { FaIcon } from "../Icon";
import { useAuth } from "../../context/AuthContext";
import UserProfileModal from "../UserProfileModal";

function LogoutConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div className="cmd-backdrop open" style={{ zIndex: 1200 }} role="presentation" onClick={onCancel}>
      <div
        className="cmd card-pad"
        role="alertdialog"
        aria-label="Confirmar saída"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420, padding: "var(--space-5)" }}
      >
        <div className="panel-title" style={{ marginBottom: 12 }}>Sair do sistema</div>
        <p style={{ marginBottom: 20 }}>Deseja realmente encerrar sua sessão?</p>
        <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={onConfirm}>Sair</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function Topbar({
  onOpenCmd,
  theme,
  onToggleTheme,
  sidebarCollapsed,
  onToggleSidebar,
  hasSidebar,
}) {
  const { user, initials, logout, updateUser } = useAuth();
  const ano = new Date().getFullYear();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  const handleProfileSaved = (updatedUser) => {
    if (updatedUser) updateUser(updatedUser);
  };

  const handleLogout = async () => {
    setLogoutConfirm(false);
    await logout();
  };

  return (
    <>
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
          <span>{user?.prefMunicipio || user?.prefNome || `Prefeitura ${user?.prefCodigo}`}</span>
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

        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="user-menu-trigger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <div className="topbar-user-meta">
              <span className="topbar-user-name">{user?.usuNome || user?.usuUsuario}</span>
            </div>
            <FaIcon
              icon="fa-chevron-down"
              className={"user-menu-chevron" + (menuOpen ? " user-menu-chevron--open" : "")}
            />
            <span className="avatar topbar-avatar">{initials}</span>
          </button>

          {menuOpen && (
            <div className="user-menu-dropdown" role="menu">
              <button
                type="button"
                className="user-menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setProfileOpen(true);
                }}
              >
                <FaIcon icon="fa-user-pen" />
                Alterar Dados
              </button>
              <button
                type="button"
                className="user-menu-item user-menu-item--danger"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setLogoutConfirm(true);
                }}
              >
                <FaIcon icon="fa-right-from-bracket" />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <UserProfileModal
        open={profileOpen}
        user={user}
        onClose={() => setProfileOpen(false)}
        onSaved={handleProfileSaved}
      />

      {logoutConfirm && (
        <LogoutConfirmDialog
          onConfirm={handleLogout}
          onCancel={() => setLogoutConfirm(false)}
        />
      )}
    </>
  );
}
