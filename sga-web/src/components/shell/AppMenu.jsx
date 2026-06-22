import { useEffect, useMemo, useState } from "react";
import { MENU_SECTIONS, filterMenuSections } from "../../data/navigation";
import { useAuth } from "../../context/AuthContext";
import { FaIcon } from "../Icon";

function isNavItemActive(item, activeScreen) {
  if (item.screen === activeScreen) return true;
  if (item.screen === "produtos" && activeScreen?.startsWith("produto:")) return true;
  if (item.screen?.startsWith("ww:")) {
    const modId = item.screen.slice(3);
    if (activeScreen?.startsWith(`ww-form:${modId}:`)) return true;
  }
  if (item.screen?.startsWith("logistica:") && activeScreen === item.screen) return true;
  return false;
}

function NavSection({ section, activeScreen, onScreen, open, onToggle, searchMode }) {
  const isOpen = searchMode || open;

  return (
    <div className={"nav-tree" + (isOpen ? " open" : "")}>
      <button type="button" className="nav-tree-toggle nav-section-toggle" onClick={() => onToggle(section.id)}>
        <FaIcon icon={section.icon} />
        <span>{section.label}</span>
        <FaIcon icon="fa-chevron-right" className="chev" />
      </button>
      <div className="nav-tree-children">
        <div>
          {section.items.map((item) => (
            <div
              key={item.id}
              className="nav-link nav-link-sub"
              aria-current={isNavItemActive(item, activeScreen) ? "true" : undefined}
              onClick={() => onScreen(item.screen)}
            >
              <FaIcon icon={item.icon || "fa-angle-right"} style={{ fontSize: 11 }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppMenu({ activeScreen, onScreen, collapsed }) {
  const { user } = useAuth();
  const [q, setQ] = useState("");

  const menuSections = useMemo(
    () => filterMenuSections(MENU_SECTIONS, user?.allowedMenuIds ?? null),
    [user?.allowedMenuIds]
  );

  const filtered = useMemo(() => {
    if (!q.trim()) return menuSections;
    const s = q.toLowerCase();
    return menuSections.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.label.toLowerCase().includes(s) || section.label.toLowerCase().includes(s)
      ),
    })).filter((section) => section.items.length > 0);
  }, [q, menuSections]);

  const activeSectionId = useMemo(() => {
    for (const section of menuSections) {
      if (section.items.some((item) => isNavItemActive(item, activeScreen))) {
        return section.id;
      }
    }
    return null;
  }, [activeScreen, menuSections]);

  const [openSectionId, setOpenSectionId] = useState(null);
  const searchMode = !!q.trim();

  useEffect(() => {
    if (activeSectionId) setOpenSectionId(activeSectionId);
  }, [activeSectionId]);

  const handleToggle = (sectionId) => {
    setOpenSectionId((prev) => (prev === sectionId ? null : sectionId));
  };

  if (collapsed) return null;

  return (
    <aside className="sidebar app-menu">
      <div className="sidebar-head">
        <div className="brand" style={{ marginBottom: 4 }}>
          <span className="mark">SGA</span>
          <span>Alimentação Escolar</span>
        </div>
        <div className="sidebar-sub">Sistema de Gestão</div>
      </div>
      <div className="sidebar-search">
        <div className="input-group">
          <FaIcon icon="fa-magnifying-glass" className="input-icon" />
          <input
            className="input btn-sm"
            style={{ height: 36 }}
            placeholder="Filtrar no menu…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      <div className="sidebar-nav">
        <div
          className="nav-link"
          aria-current={activeScreen === "dashboard" ? "true" : undefined}
          onClick={() => onScreen("dashboard")}
          style={{ marginBottom: "var(--space-2)" }}
        >
          <FaIcon icon="fa-grip" />
          <span>Dashboard</span>
        </div>
        {filtered.map((section) => (
          <NavSection
            key={section.id}
            section={section}
            activeScreen={activeScreen}
            onScreen={onScreen}
            open={openSectionId === section.id}
            onToggle={handleToggle}
            searchMode={searchMode}
          />
        ))}
      </div>
    </aside>
  );
}

