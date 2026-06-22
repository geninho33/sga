import { formatDecimalBr } from "../../utils/formatBr";

/** Cards de guia por unidade — 4 colunas, scroll interno. */
export default function WizardGuiaCards({ groups, emptyLabel = "Nenhuma guia para exibir." }) {
  if (!groups?.length) {
    return <p className="muted">{emptyLabel}</p>;
  }

  return (
    <div className="wizard-guia-grid">
      {groups.map(({ loc, itens }) => (
        <div key={`guia-card-${loc.locCodigo}`} className="panel wizard-guia-card">
          <div className="panel-head wizard-guia-card-head">
            <div className="panel-title wizard-guia-card-title">{loc.locDescricao}</div>
            <div className="muted wizard-guia-card-sub">
              Cód. <span className="mono tnum">{loc.locCodigo}</span>
            </div>
          </div>
          <div className="table-wrap wizard-guia-card-body">
            <table className="table table-zebra wizard-guia-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th className="tnum" style={{ width: 44, textAlign: "right" }}>Qtde</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={`${item.locCodigo}-${item.prodCodigo}`}>
                    <td title={item.prodDescricao}>{item.prodDescricao}</td>
                    <td className="tnum" style={{ textAlign: "right" }}>
                      {formatDecimalBr(item.quantidade)}
                      {item.temEstoque && (
                        <div className="muted wizard-guia-estoque-hint">
                          UE c/ estoque
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
