import { FaIcon } from "../Icon";

export function WizardStepBar({ steps, stepIdx }) {
  return (
    <div className="wizard-steps" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
      {steps.map((s, i) => (
        <span
          key={s.id}
          className={
            "badge pill " +
            (i === stepIdx ? "badge-brand" : i < stepIdx ? "badge-success" : "badge-neutral")
          }
          style={{ fontSize: "var(--text-sm)" }}
        >
          {i + 1}. {s.title}
        </span>
      ))}
    </div>
  );
}

export function WizardDataTable({ columns, children, emptyMessage = "Nenhum registro.", loading = false }) {
  return (
    <div className="table-wrap wizard-grid" style={{ maxHeight: 420, overflow: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
      <table className="data-table" style={{ margin: 0 }}>
        <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--surface-1)" }}>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { minWidth: col.width } : undefined} className={col.className}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="cell-muted" style={{ textAlign: "center", padding: "2rem" }}>
                Carregando…
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function WizardNav({ stepIdx, isLast, busy, onPrev, onNext, prevLabel = "Anterior", nextLabel = "Próximo", finishLabel = "Finalizar" }) {
  return (
    <div
      className="panel-foot row gap-2"
      style={{ marginTop: 20, justifyContent: "space-between", padding: "12px 0" }}
    >
      <button type="button" className="btn btn-ghost" onClick={onPrev} disabled={busy}>
        <FaIcon icon="fa-arrow-left" /> {prevLabel}
      </button>
      <button type="button" className="btn btn-primary" onClick={onNext} disabled={busy}>
        {isLast ? finishLabel : nextLabel} <FaIcon icon="fa-arrow-right" />
      </button>
    </div>
  );
}

export default function WizardShell({
  title,
  geneXusPanel,
  breadcrumbSection,
  breadcrumbLabel,
  periodoBanner,
  steps,
  stepIdx,
  step,
  error,
  successMsg,
  onBack,
  busy,
  loading,
  onPrev,
  onNext,
  isLastStep,
  children,
}) {
  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="page-head">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-desc mono">{geneXusPanel}</div>
        </div>
        {onBack && (
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            <FaIcon icon="fa-arrow-left" /> Voltar
          </button>
        )}
      </div>

      {periodoBanner && (
        <div className="panel card-pad" style={{ marginBottom: 16, background: "var(--surface-2)", padding: "10px 16px" }}>
          <div className="muted" style={{ fontSize: "var(--text-sm)" }}>{periodoBanner}</div>
        </div>
      )}

      <WizardStepBar steps={steps} stepIdx={stepIdx} />

      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: 12 }}>{successMsg}</div>}

      <div className="panel card-pad">
        <h2 className="panel-title" style={{ marginBottom: 4 }}>{step.title}</h2>
        <p className="muted" style={{ marginBottom: 16, fontSize: "var(--text-sm)" }}>{step.description}</p>
        {children}
      </div>

      {!isLastStep && (
        <WizardNav
          stepIdx={stepIdx}
          isLast={steps[stepIdx]?.id === "Guias"}
          busy={busy || loading}
          onPrev={onPrev}
          onNext={onNext}
          prevLabel={stepIdx === 0 ? "Cancelar" : "Anterior"}
        />
      )}
    </div>
  );
}
