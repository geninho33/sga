import { APP_VERSION } from "../../generated/version.js";

export default function AppFooter({ className = "" }) {
  const year = new Date().getFullYear();

  return (
    <footer className={`app-footer ${className}`.trim()} role="contentinfo">
      <div className="app-footer-inner">
        <span className="app-footer-item app-footer-brand">
          {APP_VERSION.shortName} · Alimentação Escolar
        </span>
        <span className="app-footer-sep" aria-hidden="true">
          |
        </span>
        <span className="app-footer-item" title={`Compilação: ${APP_VERSION.builtAt}`}>
          Versão {APP_VERSION.displayVersion}
        </span>
        <span className="app-footer-sep" aria-hidden="true">
          |
        </span>
        <span className="app-footer-item">© {year}</span>
        <span className="app-footer-sep app-footer-sep--hide-sm" aria-hidden="true">
          |
        </span>
        <span className="app-footer-item app-footer-muted app-footer-sep--hide-sm">
          Ambiente de gestão da alimentação escolar (PNAE)
        </span>
      </div>
    </footer>
  );
}
