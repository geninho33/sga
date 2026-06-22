import { useState } from "react";
import { SIDEBAR } from "../../data/modules";
import { FaIcon } from "../Icon";

function NavTree({ item, onLeaf }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"nav-tree" + (open ? " open" : "")}>
      <button type="button" className="nav-tree-toggle" onClick={() => setOpen((o) => !o)}>
        <FaIcon icon={item.icon} />
        <span>{item.label}</span>
        <FaIcon icon="fa-chevron-right" className="chev" />
      </button>
      <div className="nav-tree-children">
        <div>
          {item.tree.map((c, i) => (
            <div key={i} className="nav-link" onClick={() => onLeaf && onLeaf(item, c)}>
              <FaIcon icon="fa-chevron-right" style={{ fontSize: 11 }} />
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ moduleId, activeScreen, onScreen }) {
  const cfg = SIDEBAR[moduleId];
  const [q, setQ] = useState("");
  if (!cfg) return null;

  const filterItem = (it) => !q || it.label.toLowerCase().includes(q.toLowerCase());

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <div className="sidebar-module">{cfg.title}</div>
        <div className="sidebar-sub">{cfg.sub}</div>
      </div>
      <div className="sidebar-search">
        <div className="input-group">
          <FaIcon icon="fa-magnifying-glass" className="input-icon" />
          <input
            className="input btn-sm"
            style={{ height: 36 }}
            placeholder="Filtrar neste módulo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      <div className="sidebar-nav">
        {cfg.groups.map((grp, gi) => {
          const items = grp.items.filter(filterItem);
          if (!items.length) return null;
          return (
            <div className="nav-group" key={gi}>
              <div className="nav-group-label">{grp.label}</div>
              {items.map((it) =>
                it.tree ? (
                  <NavTree
                    key={it.id}
                    item={it}
                    onLeaf={() => it.screen && onScreen(it.screen)}
                  />
                ) : (
                  <div
                    key={it.id}
                    className="nav-link"
                    aria-current={it.screen && it.screen === activeScreen}
                    onClick={() => it.screen && onScreen(it.screen)}
                  >
                    <FaIcon icon={it.icon} />
                    <span>{it.label}</span>
                    {it.count && <span className="count">{it.count}</span>}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
