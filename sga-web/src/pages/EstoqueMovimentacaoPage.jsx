import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import WizardProgressModal from "../components/wizard/WizardProgressModal";
import { WW_PAGE_SIZES, formatWwCell, getWwModuleById, normalizeWwSort } from "../data/wwModules";
import { usePreparacaoReferencias } from "../hooks/usePreparacaoReferencias";

const API_PATH = "/api/estoque/movimentacao";

const ESTO_TIPO_OPTIONS = [
  ["", "Todos"],
  ["E", "Entrada"],
  ["S", "Saída"],
  ["G", "Entrada por Cancelamento"],
  ["F", "Saída por Cancelamento"],
  ["R", "Entrada por Romaneio"],
  ["T", "Saída por Canc. Romaneio"],
  ["M", "Entrada por Canc. Remessa"],
];

const ESTO_TIPO_BADGE = {
  E: { label: "Entrada", cls: "badge-success" },
  S: { label: "Saída", cls: "badge-danger" },
  G: { label: "Entrada por Cancelamento", cls: "badge-success" },
  F: { label: "Saída por Cancelamento", cls: "badge-danger" },
  R: { label: "Entrada por Romaneio", cls: "badge-success" },
  T: { label: "Saída por Canc. Romaneio", cls: "badge-danger" },
  M: { label: "Entrada por Canc. Remessa", cls: "badge-success" },
};

function defaultAlteracaoFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

function EstoCodigoCell({ row }) {
  const tipo = ESTO_TIPO_BADGE[row.estoTipo];
  return (
    <span className="tnum" style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {row.estoCodigo}
      {tipo && (
        <span className={`badge pill ${tipo.cls}`} style={{ fontWeight: 600, fontSize: "0.75rem" }}>
          {tipo.label}
        </span>
      )}
    </span>
  );
}

export default function EstoqueMovimentacaoPage({ onBack }) {
  const module = getWwModuleById("movimentacao");
  const { locais } = usePreparacaoReferencias();
  const visibleColumns = module.columns.filter((c) => !c.hidden);

  const [filters, setFilters] = useState({
    estoProduto: "",
    estoProdutoDescricao: "",
    estoQuantidade: "",
    estoTipo: "",
    estoLocal: "",
    estoAlteracaoFrom: defaultAlteracaoFrom(),
    estoAlteracaoTo: "",
    recentOnly: "1",
  });
  const [applied, setApplied] = useState(() => ({
    estoAlteracaoFrom: defaultAlteracaoFrom(),
    recentOnly: "1",
  }));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState(() => normalizeWwSort(module, module.defaultSort));
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fetchRef = useRef(0);

  const load = useCallback(async () => {
    const fetchId = ++fetchRef.current;
    setLoading(true);
    setProgress(12);
    setError(null);

    const timer = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + 4));
    }, 180);

    try {
      const activeSort = normalizeWwSort(module, sort);
      const params = {
        page,
        limit: pageSize,
        orderBy: activeSort.orderBy,
        orderDir: activeSort.orderDir,
        ...applied,
      };
      const res = await apiJson(API_PATH, { params });
      if (fetchRef.current !== fetchId) return;
      setData(res.data ?? []);
      setMeta(res.meta ?? { total: 0, totalPages: 1 });
    } catch (err) {
      if (fetchRef.current === fetchId) {
        setError(err.message);
        setData([]);
      }
    } finally {
      clearInterval(timer);
      if (fetchRef.current !== fetchId) return;
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 280);
    }
  }, [module, page, pageSize, applied, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [applied, pageSize, sort]);

  const applyFilters = () => setApplied({ ...filters });
  const clearFilters = () => {
    const empty = {
      estoProduto: "",
      estoProdutoDescricao: "",
      estoQuantidade: "",
      estoTipo: "",
      estoLocal: "",
      estoAlteracaoFrom: defaultAlteracaoFrom(),
      estoAlteracaoTo: "",
      recentOnly: "1",
    };
    setFilters(empty);
    setApplied(empty);
    setSort(normalizeWwSort(module, module.defaultSort));
  };

  const toggleSort = (sortKey) => {
    if (!sortKey) return;
    setSort((prev) => {
      const norm = normalizeWwSort(module, prev);
      if (norm.orderBy === sortKey) {
        return { orderBy: sortKey, orderDir: norm.orderDir === "asc" ? "desc" : "asc" };
      }
      return { orderBy: sortKey, orderDir: "asc" };
    });
  };

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="content-inner">
      <Breadcrumb items={[module?.breadcrumbSection || "Estoque", module?.title || "Movimentação"]} />

      <WizardProgressModal
        open={loading}
        title="Carregando movimentações"
        progress={progress}
        message="Consultando histórico de estoque. Use filtros de data para acelerar a busca."
      />

      <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
        <div className="panel-head">
          <div>
            <h1 className="panel-title">{module?.title || "Movimentação de Estoque"}</h1>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: "var(--text-sm)" }}>
              {module?.geneXusPanel || "TRNSEstoqueWW"} — histórico de entradas e saídas
            </p>
          </div>
          {onBack && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
              <FaIcon icon="fa-arrow-left" /> Voltar
            </button>
          )}
        </div>

        <div className="panel-body" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <div className="estoque-filter-compact">
            <div className="estoque-filter-row">
              <label className="field-compact"><span>Prod.</span>
                <input type="number" className="input input-sm" style={{ width: 72 }} value={filters.estoProduto} onChange={(e) => setFilter("estoProduto", e.target.value)} />
              </label>
              <label className="field-compact"><span>Descrição</span>
                <input type="text" className="input input-sm" style={{ width: 120 }} placeholder="Contém…" value={filters.estoProdutoDescricao} onChange={(e) => setFilter("estoProdutoDescricao", e.target.value)} />
              </label>
              <label className="field-compact"><span>Qtde</span>
                <input type="text" className="input input-sm" style={{ width: 72 }} value={filters.estoQuantidade} onChange={(e) => setFilter("estoQuantidade", e.target.value)} />
              </label>
              <label className="field-compact"><span>Tipo</span>
                <select className="input input-sm" style={{ width: 130 }} value={filters.estoTipo} onChange={(e) => setFilter("estoTipo", e.target.value)}>
                  {ESTO_TIPO_OPTIONS.map(([v, l]) => <option key={v || "all"} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="field-compact"><span>Local</span>
                <select className="input input-sm" style={{ width: 120 }} value={filters.estoLocal} onChange={(e) => setFilter("estoLocal", e.target.value)}>
                  <option value="">Todos</option>
                  {locais.map((loc) => <option key={loc.locCodigo} value={loc.locCodigo}>{loc.locDescricao}</option>)}
                </select>
              </label>
              <label className="field-compact"><span>Dt de</span>
                <input type="date" className="input input-sm" style={{ width: 130 }} value={filters.estoAlteracaoFrom} onChange={(e) => setFilter("estoAlteracaoFrom", e.target.value)} />
              </label>
              <label className="field-compact"><span>Dt até</span>
                <input type="date" className="input input-sm" style={{ width: 130 }} value={filters.estoAlteracaoTo} onChange={(e) => setFilter("estoAlteracaoTo", e.target.value)} />
              </label>
            </div>
            <div className="estoque-filter-row">
              <button type="button" className="btn btn-primary btn-sm" onClick={applyFilters} disabled={loading}>
                <FaIcon icon="fa-filter" /> Filtrar
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters} disabled={loading}>Limpar</button>
              <label className="check check-compact">
                <input type="checkbox" checked={filters.recentOnly === "1"} onChange={(e) => setFilter("recentOnly", e.target.checked ? "1" : "0")} />
                <span className="box"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg></span>
                <span className="muted" style={{ fontSize: "0.75rem" }}>Limitar 90 dias sem filtros</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
          <div className="panel-body">
            <p style={{ color: "var(--danger-fg)", margin: 0 }}>
              <FaIcon icon="fa-xmark" /> {error}
            </p>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title muted" style={{ fontWeight: 500 }}>
            {meta.total?.toLocaleString("pt-BR") ?? 0} registro(s)
          </span>
          <div className="row gap-2 align-center">
            <label className="row gap-1 align-center muted" style={{ fontSize: "var(--text-sm)" }}>
              Por página
              <select
                className="input input-sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                disabled={loading}
              >
                {WW_PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className={col.sortKey ? "sortable" : undefined}
                    onClick={() => toggleSort(col.sortKey)}
                    style={col.sortKey ? { cursor: "pointer" } : undefined}
                  >
                    {col.label}
                    {sort.orderBy === col.sortKey && (
                      <FaIcon icon={sort.orderDir === "asc" ? "fa-sort-up" : "fa-sort-down"} className="caret" />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && data.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="cell-muted" style={{ textAlign: "center", padding: "var(--space-8)" }}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr key={`${row.estoCodigo}-${i}`}>
                    {visibleColumns.map((col) => (
                      <td key={col.key} className={col.key === "estoCodigo" ? "tnum" : undefined}>
                        {col.key === "estoCodigo" ? (
                          <EstoCodigoCell row={row} />
                        ) : (
                          formatWwCell(col, row)
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="panel-foot row between wrap gap-2">
            <span className="muted" style={{ fontSize: "var(--text-sm)" }}>
              Página {meta.page ?? page} de {meta.totalPages}
            </span>
            <div className="row gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <FaIcon icon="fa-chevron-left" /> Anterior
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page >= meta.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima <FaIcon icon="fa-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
