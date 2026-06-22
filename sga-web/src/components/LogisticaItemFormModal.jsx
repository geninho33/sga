import { FaIcon } from "./Icon";

export default function LogisticaItemFormModal({
  open,
  title,
  error,
  busy,
  onClose,
  onSave,
  children,
}) {
  if (!open) return null;

  return (
    <div className="cmd-backdrop open" role="presentation" onClick={onClose}>
      <div
        className="cmd card-pad"
        role="dialog"
        aria-labelledby="logistica-item-form-title"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: "var(--space-5)", maxWidth: 720, width: "95vw" }}
      >
        <h2 id="logistica-item-form-title" className="page-title" style={{ fontSize: "1.1rem", marginBottom: 12 }}>
          {title}
        </h2>
        {error && <p className="text-danger" style={{ marginBottom: 12 }}>{error}</p>}
        <div className="filter-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {children}
        </div>
        <div className="row gap-2" style={{ marginTop: 20, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Fechar</button>
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={busy}>
            <FaIcon icon="fa-check" /> {busy ? "Salvando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
