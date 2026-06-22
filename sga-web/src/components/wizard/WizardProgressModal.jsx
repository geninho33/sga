/** Modal de progresso estilo termômetro para operações demoradas do wizard. */
export default function WizardProgressModal({ open, title = "Calculando…", progress = 0, message = "" }) {
  if (!open) return null;

  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="cmd-backdrop open wizard-progress-backdrop" role="presentation">
      <div
        className="cmd card-pad wizard-progress-modal"
        role="dialog"
        aria-labelledby="wizard-progress-title"
        aria-busy="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="wizard-progress-title" className="panel-title" style={{ marginBottom: 8 }}>
          {title}
        </h2>
        <p className="muted" style={{ fontSize: "var(--text-sm)", marginBottom: 16 }}>
          {message || "Aguarde enquanto processamos os dados."}
        </p>

        <div className="wizard-thermometer" aria-hidden>
          <div className="wizard-thermometer-track">
            <div className="wizard-thermometer-fill" style={{ height: `${pct}%` }} />
          </div>
          <div className="wizard-thermometer-bulb" />
        </div>

        <div className="wizard-progress-bar-wrap">
          <div className="wizard-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="tnum muted" style={{ textAlign: "center", marginTop: 8, fontSize: "var(--text-sm)" }}>
          {pct}%
        </p>
      </div>
    </div>
  );
}
