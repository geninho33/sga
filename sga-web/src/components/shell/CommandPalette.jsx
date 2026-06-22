import { useEffect, useMemo, useRef, useState } from "react";
import { flattenCommands } from "../../data/navigation";
import { useAuth } from "../../context/AuthContext";
import { FaIcon } from "../Icon";

export default function CommandPalette({ open, onClose, onNavigate }) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const commands = useMemo(
    () => flattenCommands(user?.allowedMenuIds ?? null),
    [user?.allowedMenuIds]
  );

  const results = useMemo(() => {
    if (!q) return commands;
    const s = q.toLowerCase();
    return commands.filter(
      (c) => c.label.toLowerCase().includes(s) || c.path.toLowerCase().includes(s)
    );
  }, [q, commands]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    setIdx(0);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const r = results[idx];
        if (r?.screen) {
          onNavigate(r.screen);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, idx, onClose, onNavigate]);

  return (
    <div className={"cmd-backdrop" + (open ? " open" : "")} onClick={onClose}>
      <div className="cmd" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-row">
          <FaIcon icon="fa-magnifying-glass" />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Para onde você quer ir?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="cmd-results">
          <div className="cmd-cat eyebrow">
            {q ? `${results.length} resultado(s)` : "Acesso rápido"}
          </div>
          {results.map((r, i) => (
            <div
              key={`${r.path}-${r.label}`}
              className="cmd-item"
              data-active={i === idx}
              onMouseEnter={() => setIdx(i)}
              onClick={() => {
                if (r.screen) {
                  onNavigate(r.screen);
                  onClose();
                }
              }}
            >
              <span className="ci">
                <FaIcon icon={r.icon} />
              </span>
              <span>{r.label}</span>
              <span className="cpath">{r.path}</span>
            </div>
          ))}
          {!results.length && (
            <div className="cmd-item" style={{ color: "var(--text-3)" }}>
              Nada encontrado.
            </div>
          )}
        </div>
        <div className="cmd-foot">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span> navegar
          </span>
          <span>
            <span className="kbd">↵</span> abrir
          </span>
          <span style={{ marginLeft: "auto" }}>Busca global SGA</span>
        </div>
      </div>
    </div>
  );
}
