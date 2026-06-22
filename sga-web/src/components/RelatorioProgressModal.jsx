/** Modal de progresso para geração/impressão de relatórios. */
export default function RelatorioProgressModal({
  open,
  progress = 0,
  message = "Gerando relatório, aguarde...",
}) {
  if (!open) return null;

  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="cmd-backdrop open relatorio-progress-backdrop" role="presentation">
      <div
        className="cmd card-pad relatorio-progress-modal"
        role="dialog"
        aria-labelledby="relatorio-progress-title"
        aria-busy="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relatorio-printer-wrap" aria-hidden>
          <svg className="relatorio-printer-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="24" width="36" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" fill="#f8fafc" />
            <rect x="18" y="8" width="28" height="18" rx="2" stroke="currentColor" strokeWidth="2.5" fill="#fff" />
            <rect x="18" y="40" width="28" height="14" rx="1" stroke="currentColor" strokeWidth="2" fill="#fff" className="relatorio-printer-paper" />
            <circle cx="44" cy="30" r="2.5" fill="currentColor" />
            <rect x="10" y="28" width="4" height="8" rx="1" fill="currentColor" opacity="0.35" />
          </svg>
        </div>

        <h2 id="relatorio-progress-title" className="panel-title" style={{ textAlign: "center", marginBottom: 6 }}>
          Preparando relatório
        </h2>
        <p className="muted" style={{ fontSize: "var(--text-sm)", textAlign: "center", marginBottom: 16 }}>
          {message}
        </p>

        <div className="wizard-progress-bar-wrap">
          <div className="wizard-progress-bar relatorio-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="tnum muted" style={{ textAlign: "center", marginTop: 8, fontSize: "var(--text-sm)" }}>
          {pct}%
        </p>
      </div>
    </div>
  );
}
