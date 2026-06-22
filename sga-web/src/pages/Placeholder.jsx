import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";

export default function Placeholder({ title, section }) {
  const crumbs = section ? [section, title] : [title];
  return (
    <div className="content-inner">
      <Breadcrumb items={crumbs} />
      <div className="page-head">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-desc">Módulo do SGA — em desenvolvimento.</div>
        </div>
      </div>
      <div className="card card-pad" style={{ textAlign: "center", padding: "var(--space-12) var(--space-8)" }}>
        <div
          className="module-icon"
          style={{ margin: "0 auto var(--space-5)", width: 60, height: 60, fontSize: 26 }}
        >
          <FaIcon icon="fa-sliders" />
        </div>
        <div className="h2" style={{ marginBottom: 8 }}>
          {title}
        </div>
        <p className="muted" style={{ maxWidth: 460, margin: "0 auto var(--space-6)" }}>
          Esta tela será implementada na migração Node.js. Use{" "}
          <span className="kbd">Ctrl K</span> para navegar pelo menu.
        </p>
      </div>
    </div>
  );
}
