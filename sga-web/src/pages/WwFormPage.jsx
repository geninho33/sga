import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import { getWwModuleById } from "../data/wwModules";

export default function WwFormPage({ moduleId, recordId, isNew = false, onBack }) {
  const module = getWwModuleById(moduleId);
  const title = module?.title?.replace(/^Listagem de /, "") || moduleId;
  const pageTitle = isNew ? "Inserir" : "Alterar";
  const breadcrumbTail = isNew ? "Inserir" : String(recordId);

  return (
    <div className="content-inner" style={{ maxWidth: 1040 }}>
      <Breadcrumb items={[module?.breadcrumbSection || "Cadastro", title, breadcrumbTail]} />

      <div className="page-head">
        <div>
          <div className="page-title">
            {pageTitle} · {title}
          </div>
          <div className="page-desc">
            <span className="mono">{module?.editTransaction || module?.geneXusParent || module?.geneXusPanel}</span>
            {!isNew && recordId && (
              <>
                {" "}
                · registro <span className="mono tnum">{recordId}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ textAlign: "center", padding: "var(--space-12) var(--space-8)" }}>
        <div
          className="module-icon"
          style={{ margin: "0 auto var(--space-5)", width: 60, height: 60, fontSize: 26 }}
        >
          <FaIcon icon="fa-pen-to-square" />
        </div>
        <div className="h2" style={{ marginBottom: 8 }}>
          Cadastro em desenvolvimento
        </div>
        <p className="muted" style={{ maxWidth: 520, margin: "0 auto var(--space-6)" }}>
          O formulário da transaction GeneXus{" "}
          <span className="mono">{module?.geneXusParent}</span> será implementado na próxima etapa da
          migração. A listagem e a navegação de alteração já seguem o padrão de Alimentos.
        </p>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          <FaIcon icon="fa-arrow-left" /> Voltar à listagem
        </button>
      </div>
    </div>
  );
}
