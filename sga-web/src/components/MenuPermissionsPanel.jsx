import { useEffect, useState } from "react";
import { apiJson } from "../api/client";

export default function MenuPermissionsPanel({ roleId, disabled = false, onChange }) {
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const catRes = await apiJson("/api/admin/gam/menu-catalog");
        if (cancelled) return;
        setCatalog(catRes.data ?? []);
        if (roleId) {
          const menuRes = await apiJson(`/api/admin/gam/roles/${roleId}/menus`);
          if (!cancelled) setSelected(new Set(menuRes.data ?? []));
        } else if (!cancelled) {
          setSelected(new Set());
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roleId]);

  useEffect(() => {
    onChange?.([...selected]);
  }, [selected, onChange]);

  const toggle = (menuId) => {
    if (disabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) next.delete(menuId);
      else next.add(menuId);
      return next;
    });
  };

  const toggleSection = (items, allOn) => {
    if (disabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of items) {
        if (allOn) next.add(item.id);
        else next.delete(item.id);
      }
      return next;
    });
  };

  if (loading) return <p className="muted" style={{ fontSize: "var(--text-sm)" }}>Carregando permissões…</p>;
  if (error) return <p style={{ color: "var(--danger-fg)", fontSize: "var(--text-sm)" }}>{error}</p>;

  return (
    <div className="perm-panel">
      <div
        className="perm-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
          maxHeight: 520,
          overflow: "auto",
          padding: 2,
        }}
      >
        {catalog.map((section) => {
          const allSelected = section.items.every((i) => selected.has(i.id));
          const count = section.items.filter((i) => selected.has(i.id)).length;
          return (
            <section
              key={section.section}
              className="panel card-pad"
              style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <strong style={{ fontSize: "var(--text-sm)" }}>{section.section}</strong>
                  <div className="muted tnum" style={{ fontSize: 11 }}>{count}/{section.items.length} ativos</div>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11, padding: "2px 8px", flexShrink: 0 }}
                    onClick={() => toggleSection(section.items, !allSelected)}
                  >
                    {allSelected ? "Limpar" : "Todos"}
                  </button>
                )}
              </div>
              <div className="perm-chips">
                {section.items.map((item) => (
                  <label
                    key={item.id}
                    className={"perm-chip" + (selected.has(item.id) ? " perm-chip--on" : "")}
                    title={item.label}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      disabled={disabled}
                      onChange={() => toggle(item.id)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <style>{`
        .perm-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .perm-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: 8px; border: 1px solid var(--border);
          background: var(--surface-2); cursor: pointer; font-size: 12px; line-height: 1.4;
          user-select: none; max-width: 100%;
        }
        .perm-chip input { width: 13px; height: 13px; margin: 0; flex-shrink: 0; }
        .perm-chip--on { background: var(--brand-soft); border-color: var(--brand); color: var(--brand-text); }
        .perm-chip span { overflow: hidden; text-overflow: ellipsis; }
      `}</style>
    </div>
  );
}

export async function saveRoleMenus(roleId, menuIds) {
  await apiJson(`/api/admin/gam/roles/${roleId}/menus`, {
    method: "PUT",
    body: JSON.stringify({ menuIds }),
  });
}

export async function saveUserRoles(userGuid, roleIds) {
  await apiJson(`/api/admin/gam/users/${userGuid}/roles`, {
    method: "PUT",
    body: JSON.stringify({ roleIds }),
  });
}
