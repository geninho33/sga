import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../api/client";
import { fetchWwList } from "../api/wwList";
import CardapioImpressaoModal from "../components/CardapioImpressaoModal";
import NotaItensModal, {
  CancelarDistribuicaoModal,
  CancelarNotaModal,
} from "../components/LogisticaModals";
import PratoPercaptaModal from "../components/PratoPercaptaModal";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import RelatorioProgressModal from "../components/RelatorioProgressModal";
import { PRODUTO_STATUS } from "../data/modules";
import { usePreparacaoReferencias } from "../hooks/usePreparacaoReferencias";
import { openReportWithProgress } from "../utils/openReportWithProgress";
import {
  WW_ACTIONS,
  WW_PAGE_SIZES,
  buildWwFilterParams,
  formatWwCell,
  getWwRowKey,
  normalizeWwSort,
} from "../data/wwModules";

function ProdSaldoCell({ row }) {
  const n = Number(row.prodSaldo);
  const formatted = Number.isNaN(n)
    ? (row.prodSaldo ?? "—")
    : n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
  const sit = row.prodSaldoSituacao;
  if (sit === "falta") {
    return (
      <span className="tnum" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {formatted}
        <span className="saldo-badge saldo-badge-falta">(Em Falta)</span>
      </span>
    );
  }
  if (sit === "excesso") {
    return (
      <span className="tnum" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {formatted}
        <span className="saldo-badge saldo-badge-excesso">(Em Excesso)</span>
      </span>
    );
  }
  return <span className="tnum">{formatted}</span>;
}

export default function WwListPage({ module, onOpenRecord, initialListParams = {}, onNavigate }) {
  const [sel, setSel] = useState({});
  const [statusTab, setStatusTab] = useState("todos");
  const defaultFilter = module.filterFields[0]?.key || "q";
  const [filterField, setFilterField] = useState(defaultFilter);
  const [filterValue, setFilterValue] = useState("");
  const [applied, setApplied] = useState({ field: defaultFilter, value: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState(() => normalizeWwSort(module, module.defaultSort));
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [impressaoRow, setImpressaoRow] = useState(null);
  const [pratoModal, setPratoModal] = useState(null);
  const [cancelNotaRow, setCancelNotaRow] = useState(null);
  const [cancelDistRow, setCancelDistRow] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const prepRefs = usePreparacaoReferencias();

  const visibleColumns = module.columns.filter((c) => !c.hidden);
  const hasStatus = !!module.statusField;
  const linkColumn = module.linkColumn;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterParams = buildWwFilterParams(module, applied.field, applied.value, statusTab);
      const activeSort = normalizeWwSort(module, sort);
      const res = await fetchWwList(module.apiPath, {
        page,
        limit: pageSize,
        ...filterParams,
        orderBy: activeSort.orderBy,
        orderDir: activeSort.orderDir,
      });
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [module, page, pageSize, applied, statusTab, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const defFilter = module.filterFields[0]?.key || "q";
    setSort(normalizeWwSort(module, module.defaultSort));
    setPage(1);
    setSel({});
    setStatusTab("todos");
    if (initialListParams.carGruCodigo) {
      const v = String(initialListParams.carGruCodigo);
      setFilterField("carGruCodigo");
      setFilterValue(v);
      setApplied({ field: "carGruCodigo", value: v });
    } else {
      setFilterField(defFilter);
      setFilterValue("");
      setApplied({ field: defFilter, value: "" });
    }
  }, [module.id, initialListParams.carGruCodigo]);

  useEffect(() => {
    setPage(1);
  }, [applied, statusTab, pageSize, sort]);

  const rowIds = data.map((r, i) => getWwRowKey(module, r, i));
  const allChecked = data.length > 0 && rowIds.every((id) => sel[id]);
  const someChecked = rowIds.some((id) => sel[id]);
  const selCount = Object.values(sel).filter(Boolean).length;

  const toggleAll = () => {
    const n = { ...sel };
    if (!allChecked) rowIds.forEach((id) => (n[id] = true));
    else rowIds.forEach((id) => delete n[id]);
    setSel(n);
  };

  const applyFilters = () => setApplied({ field: filterField, value: filterValue });

  const clearFilters = () => {
    setFilterField(defaultFilter);
    setFilterValue("");
    setApplied({ field: defaultFilter, value: "" });
    setStatusTab("todos");
    setSort(normalizeWwSort(module, module.defaultSort));
  };

  const toggleSort = (sortKey) => {
    if (!sortKey) return;
    setSort((prev) => {
      if (prev.orderBy === sortKey) {
        return { orderBy: sortKey, orderDir: prev.orderDir === "asc" ? "desc" : "asc" };
      }
      return { orderBy: sortKey, orderDir: "asc" };
    });
  };

  const openEdit = (row) => {
    if (module.listOnly || !onOpenRecord || !module.editId) return;
    onOpenRecord(module.id, module.editId(row));
  };

  const runReport = useCallback(async (url, options = {}) => {
    if (reportBusy) return;
    setReportBusy(true);
    setReportProgress(0);
    setError(null);
    try {
      await openReportWithProgress(url, { ...options, onProgress: setReportProgress });
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => {
        setReportBusy(false);
        setReportProgress(0);
      }, 350);
    }
  }, [reportBusy]);

  const handleRowAction = async (action, row) => {
    setActionMsg(null);
    if (action.id === "refeicoes") {
      onOpenRecord?.(module.id, module.editId(row), { tab: "pratos" });
      return;
    }
    if (action.id === "imprimir") {
      setImpressaoRow(row);
      return;
    }
    if (action.id === "ingredientes") {
      setPratoModal({ pratoCodigo: row.pratoCodigo, pratoDescricao: row.pratoDscricao });
      return;
    }
    if (action.id === "duplicar") {
      if (action.confirm && !window.confirm(action.confirm)) return;
      const url =
        module.id === "pratos"
          ? `/api/preparacao/pratos/${row.pratoCodigo}/duplicar`
          : `/api/preparacao/cardapios/${row.carDapCodigo}/duplicar`;
      try {
        const res = await apiJson(url, { method: "POST" });
        setActionMsg(res.message || "Duplicação realizada com sucesso.");
        await load();
      } catch (err) {
        setError(err.message);
      }
      return;
    }
    if (action.id === "dp-edit-guia") {
      onOpenRecord?.("guia-distribuicao", String(row.distCodigo));
      return;
    }
    if (action.id === "dp-itens") {
      onOpenRecord?.("guia-distribuicao", String(row.distCodigo), { tab: "itens" });
      return;
    }
    if (action.id === "dp-imprimir") {
      await runReport(`/api/logistica/distribuicoes/${row.distCodigo}/impressao`);
      return;
    }
    if (action.id === "cancelar-nota") {
      setCancelNotaRow(row);
      return;
    }
    if (action.id === "saldo-imprimir") {
      await runReport("/api/relatorios/saldo/pdf", {
        method: "POST",
        body: { comSaldo: "1" },
      });
      return;
    }
    if (action.id === "ajus-cancelar") {
      if (!window.confirm("Cancelar este ajuste?")) return;
      try {
        await apiJson(`/api/estoque/ajustes/${row.ajusCodigo}/cancelar`, { method: "POST", body: "{}" });
        setActionMsg("Ajuste cancelado.");
        load();
      } catch (err) {
        setError(err.message);
      }
      return;
    }
    if (action.id === "imprimir-nota") {
      await runReport(`/api/logistica/compras/${row.notaCodigo}/impressao`);
      return;
    }
    if (action.id === "dist-cancelar") {
      setCancelDistRow(row);
      return;
    }
    if (action.id === "dist-imprimir") {
      await runReport(`/api/logistica/distribuicoes/${row.distCodigo}/impressao`);
      return;
    }
    if (action.id === "dist-imprimir-2via") {
      await runReport(`/api/logistica/distribuicoes/${row.distCodigo}/impressao`, { params: { via: "2" } });
      return;
    }
    if (action.id === "cro-locais") {
      onNavigate?.(`cronograma-local:${row.croCodigo}`);
      return;
    }
    if (action.id === "cro-duplicar") {
      if (action.confirm && !window.confirm(action.confirm)) return;
      try {
        const res = await apiJson(`/api/logistica/cronograma/${row.croCodigo}/duplicar`, { method: "POST" });
        setActionMsg(res.message || "Duplicação realizada com sucesso.");
        await load();
      } catch (err) {
        setError(err.message);
      }
      return;
    }
    if (action.id === "cro-gera-remessa") {
      setActionMsg("Geração de remessa a partir do cronograma será implementada em breve.");
      return;
    }
    if (action.id === "cro-imprimir") {
      await runReport(`/api/logistica/cronograma/${row.croCodigo}/impressao`);
      return;
    }
    if (action.id === "cro-imprimir-2via") {
      await runReport(`/api/logistica/cronograma/${row.croCodigo}/impressao`, { params: { tipo: "2via" } });
      return;
    }
    if (action.id === "cro-imprimir-diario") {
      await runReport(`/api/logistica/cronograma/${row.croCodigo}/impressao`, { params: { tipo: "diario" } });
      return;
    }
  };

  const filterDef = module.filterFields.find((f) => f.key === filterField);
  const totalPages = meta.totalPages || 1;
  const colSpan = visibleColumns.length + 2;

  const renderFilterInput = () => {
    if (filterDef?.input === "status") {
      return (
        <select className="input" value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
          <option value="">Todas</option>
          <option value="A">Ativo</option>
          <option value="I">Inativo</option>
        </select>
      );
    }
    if (filterDef?.input === "distProdutoStatus") {
      return (
        <select className="input" value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
          <option value="">Todas</option>
          <option value="A">Ativo</option>
          <option value="I">Inativo</option>
          <option value="C">Cancelada</option>
        </select>
      );
    }
    if (filterDef?.input === "croStatus") {
      return (
        <select className="input" value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
          <option value="">Todos</option>
          <option value="A">Ativo</option>
          <option value="I">Inativo</option>
          <option value="C">Duplicado</option>
          <option value="D">Distribuição</option>
          <option value="R">Remessa sem baixa de estoque</option>
        </select>
      );
    }
    if (filterDef?.input === "carGruCodigo") {
      return (
        <select className="input" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} disabled={prepRefs.loading}>
          <option value="">Todos os grupos</option>
          {(prepRefs.cardapioGrupos ?? []).map((g) => (
            <option key={g.carGruCodigo} value={String(g.carGruCodigo)}>{g.carGruDescricao}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        className="input"
        type="text"
        placeholder={filterDef?.placeholder || "Valor do filtro"}
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && applyFilters()}
      />
    );
  };

  return (
    <div className="content-inner">
      <Breadcrumb items={[module.breadcrumbSection, module.title]} />
      <div className="page-head">
        <div>
          <div className="page-title">{module.title}</div>
          <div className="page-desc">
            Work With <span className="mono">{module.geneXusPanel}</span>
            {meta.total > 0 && (
              <>
                {" "}
                · <strong className="tnum">{meta.total.toLocaleString("pt-BR")}</strong> registros
              </>
            )}
          </div>
        </div>
        <div className="page-actions">
          {!module.listOnly && (
          <button type="button" className="btn btn-primary" onClick={() => onOpenRecord?.(module.id, "novo")}>
            <FaIcon icon={WW_ACTIONS.insert.icon} /> {WW_ACTIONS.insert.label}
          </button>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
        <div className="panel-head">
          <span className="panel-title">
            <FaIcon icon="fa-filter" /> Filtros
          </span>
        </div>
        <div className="panel-body" style={{ paddingBottom: "var(--space-5)" }}>
          <div className="filter-grid" style={{ gridTemplateColumns: "minmax(140px, 1fr) 2fr auto" }}>
            <div className="field">
              <label className="field-label">Campo</label>
              <select
                className="input"
                value={filterField}
                onChange={(e) => {
                  setFilterField(e.target.value);
                  setFilterValue("");
                }}
              >
                {module.filterFields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Valor</label>
              {renderFilterInput()}
            </div>
            <div className="field" style={{ alignSelf: "end" }}>
              <button type="button" className="btn btn-soft" onClick={applyFilters}>
                <FaIcon icon="fa-magnifying-glass" /> Filtrar
              </button>
            </div>
          </div>
        </div>
        {hasStatus && (
          <div className="panel-foot">
            <div className="row gap-2 wrap">
              {(module.statusTabs ?? [
                ["todos", "Todos"],
                ["ativo", "Ativos"],
                ["inativo", "Inativos"],
              ]).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  className={"badge pill " + (statusTab === k ? "badge-brand" : "badge-neutral")}
                  onClick={() => setStatusTab(k)}
                  style={{ cursor: "pointer", fontWeight: 600 }}
                >
                  {l}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
              Limpar filtros
            </button>
          </div>
        )}
        {!hasStatus && (
          <div className="panel-foot">
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {actionMsg && (
        <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
          <div className="panel-body" style={{ color: "var(--success-fg)" }}>{actionMsg}</div>
        </div>
      )}

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
        {selCount > 0 && (
          <div
            className="panel-head"
            style={{ background: "var(--brand-soft)", borderColor: "var(--brand-soft-2)" }}
          >
            <span className="panel-title" style={{ color: "var(--brand-text)" }}>
              <FaIcon icon="fa-circle-check" /> {selCount} selecionado(s)
            </span>
          </div>
        )}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="row-check">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked && !allChecked;
                      }}
                      onChange={toggleAll}
                    />
                    <span className="box">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  </label>
                </th>
                <th className="col-actions" title={WW_ACTIONS.update.geneXus}>
                  <span className="sr-only">Ações</span>
                </th>
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className={col.sortKey ? "sortable" : undefined}
                    onClick={() => toggleSort(col.sortKey)}
                    style={col.sortKey ? { cursor: "pointer" } : undefined}
                  >
                    {col.label}
                    {sort.orderBy === col.sortKey && (
                      <FaIcon
                        icon={sort.orderDir === "asc" ? "fa-sort-up" : "fa-sort-down"}
                        className="caret"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colSpan} className="cell-muted" style={{ textAlign: "center", padding: "var(--space-8)" }}>
                    Carregando registros…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="cell-muted" style={{ textAlign: "center", padding: "var(--space-8)" }}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => {
                  const id = getWwRowKey(module, row, rowIndex);
                  return (
                    <tr key={id}>
                      <td className="row-check">
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={!!sel[id]}
                            onChange={() => setSel((s) => ({ ...s, [id]: !s[id] }))}
                          />
                          <span className="box">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        </label>
                      </td>
                      <td className="col-actions">
                        <div className="row gap-1" style={{ flexWrap: "nowrap" }}>
                          {!module.listOnly && !module.hideRowEdit && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon btn-sm"
                            title={WW_ACTIONS.update.label}
                            onClick={() => openEdit(row)}
                          >
                            <FaIcon icon={WW_ACTIONS.update.icon} />
                          </button>
                          )}
                          {(module.rowActions ?? []).map((action) => {
                            if (action.when && !action.when(row)) return null;
                            return (
                            <button
                              key={action.id}
                              type="button"
                              className="btn btn-ghost btn-icon btn-sm"
                              title={`${action.title} (${action.geneXus})`}
                              onClick={() => handleRowAction(action, row)}
                            >
                              <FaIcon icon={action.icon} />
                            </button>
                            );
                          })}
                        </div>
                      </td>
                      {visibleColumns.map((col) => {
                        if (col.format === "status") {
                          const cellSt = PRODUTO_STATUS[row[col.key]] || PRODUTO_STATUS.I;
                          return (
                            <td key={col.key}>
                              <span className={"badge " + cellSt.cls}>
                                <span className="dot" />
                                {cellSt.label}
                              </span>
                            </td>
                          );
                        }
                        const isLink = col.key === linkColumn && !module.listOnly;
                        const isCode =
                          col.key.toLowerCase().includes("codigo") ||
                          col.key === "RoleId" ||
                          col.key === "tipajuCodigo";
                        if (col.format === "prodSaldoPosicao") {
                          return (
                            <td key={col.key} className="tnum">
                              <ProdSaldoCell row={row} />
                            </td>
                          );
                        }
                        return (
                          <td
                            key={col.key}
                            className={
                              (isLink ? "cell-strong " : "") +
                              (col.format === "decimal" || isCode ? "tnum " : "") +
                              (isCode ? "mono cell-muted " : "")
                            }
                            style={isLink && onOpenRecord ? { cursor: "pointer" } : undefined}
                            onClick={isLink ? () => openEdit(row) : undefined}
                          >
                            {formatWwCell(col, row, PRODUTO_STATUS)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="panel-foot">
          <div className="row gap-4 wrap">
            <span className="muted" style={{ fontSize: "var(--text-sm)" }}>
              Mostrando <strong className="tnum">{data.length}</strong> de{" "}
              <strong className="tnum">{meta.total?.toLocaleString("pt-BR") ?? 0}</strong>
            </span>
            <label className="row gap-2" style={{ fontSize: "var(--text-sm)" }}>
              <span className="muted">Linhas:</span>
              <select
                className="input"
                style={{ width: "auto", minHeight: 32, padding: "4px 8px" }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {WW_PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="row gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <FaIcon icon="fa-chevron-left" /> Anterior
            </button>
            <span className="muted tnum" style={{ fontSize: "var(--text-sm)", alignSelf: "center" }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próximo <FaIcon icon="fa-chevron-right" />
            </button>
          </div>
        </div>
      </div>
      {impressaoRow && (
        <CardapioImpressaoModal row={impressaoRow} onClose={() => setImpressaoRow(null)} onNavigate={onNavigate} />
      )}
      <RelatorioProgressModal open={reportBusy} progress={reportProgress} />
      {cancelNotaRow && (
        <CancelarNotaModal
          row={cancelNotaRow}
          onClose={() => setCancelNotaRow(null)}
          onSuccess={(msg) => { setActionMsg(msg); load(); }}
        />
      )}
      {cancelDistRow && (
        <CancelarDistribuicaoModal
          row={cancelDistRow}
          onClose={() => setCancelDistRow(null)}
          onSuccess={(msg) => { setActionMsg(msg); load(); }}
        />
      )}
      {pratoModal && (
        <PratoPercaptaModal
          pratoCodigo={pratoModal.pratoCodigo}
          pratoDescricao={pratoModal.pratoDescricao}
          areasEnsino={prepRefs.areasEnsino}
          etapasEnsino={prepRefs.etapasEnsino}
          produtos={prepRefs.produtos}
          turnoGrupo={prepRefs.turnoGrupo}
          onClose={() => setPratoModal(null)}
        />
      )}
    </div>
  );
}
