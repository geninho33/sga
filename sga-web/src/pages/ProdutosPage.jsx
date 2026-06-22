import { useCallback, useEffect, useState } from "react";
import { fetchProdutos, inativarProdutos, reativarProdutos } from "../api/produtos";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import { PRODUTO_STATUS } from "../data/modules";
import {
  PRODUTO_CLASSIFICACAO_OPTIONS,
  PRODUTO_FILTER_FIELDS,
  PRODUTOS_PAGE_SIZES,
  PRODUTOS_WW_ACTIONS,
  PRODUTOS_WW_COLUMNS,
  PRODUTOS_WW_TITLE,
  formatProdutoCell,
  formatProdutoDecimal,
} from "../data/produtosList";
import { useProdutoReferencias } from "../hooks/useProdutoReferencias";

const DEFAULT_SORT = { orderBy: "prodDescricao", orderDir: "asc" };

function buildFilterParams(field, value, statusTab) {
  const params = {};
  const v = String(value ?? "").trim();

  if (field === "prodDescricao" && v) params.q = v;
  else if (field === "prodCodigo" && v) params.prodCodigo = v;
  else if (field === "prodTipo" && v) params.prodTipo = v;
  else if (field === "prodOrigem" && v) params.prodOrigem = v;
  else if (field === "prodCodigoTipoRemessa" && v) params.prodCodigoTipoRemessa = v;
  else if (field === "prodClassificacao" && v) params.prodClassificacao = v;
  else if (field === "prodStatus" && v) params.status = v;
  else if (statusTab === "ativo") params.status = "A";
  else if (statusTab === "inativo") params.status = "I";

  return params;
}

export default function ProdutosPage({ onOpenProduto }) {
  const { grupos, origens, tiposRemessa } = useProdutoReferencias();
  const [sel, setSel] = useState({});
  const [statusTab, setStatusTab] = useState("todos");
  const [filterField, setFilterField] = useState("prodDescricao");
  const [filterValue, setFilterValue] = useState("");
  const [applied, setApplied] = useState({ field: "prodDescricao", value: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inactivating, setInactivating] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterParams = buildFilterParams(applied.field, applied.value, statusTab);
      const res = await fetchProdutos({
        page,
        limit: pageSize,
        ...filterParams,
        orderBy: sort.orderBy,
        orderDir: sort.orderDir,
      });
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, applied, statusTab, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [applied, statusTab, pageSize, sort]);

  const allChecked = data.length > 0 && data.every((r) => sel[r.prodCodigo]);
  const someChecked = data.some((r) => sel[r.prodCodigo]);
  const selCount = Object.values(sel).filter(Boolean).length;

  const toggleAll = () => {
    const n = {};
    if (!allChecked) data.forEach((r) => (n[r.prodCodigo] = true));
    setSel(n);
  };

  const applyFilters = () => setApplied({ field: filterField, value: filterValue });

  const clearFilters = () => {
    setFilterField("prodDescricao");
    setFilterValue("");
    setApplied({ field: "prodDescricao", value: "" });
    setStatusTab("todos");
    setSort(DEFAULT_SORT);
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

  const selectedCodes = Object.entries(sel)
    .filter(([, v]) => v)
    .map(([k]) => Number(k));

  const selectedAtivos = data.filter((r) => sel[r.prodCodigo] && r.prodStatus === "A");
  const selectedInativos = data.filter((r) => sel[r.prodCodigo] && r.prodStatus === "I");
  const statusBusy = inactivating || reactivating;

  const handleInativarSelecionados = async () => {
    if (!selectedCodes.length || !selectedAtivos.length) {
      setActionMsg("Nenhum produto ativo selecionado.");
      return;
    }
    const codes = selectedAtivos.map((r) => r.prodCodigo);
    if (!window.confirm(`Inativar ${codes.length} produto(s)?`)) return;

    setInactivating(true);
    setError(null);
    setActionMsg(null);
    try {
      const res = await inativarProdutos(codes);
      setActionMsg(`${res.inativados} produto(s) inativado(s).`);
      setSel({});
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setInactivating(false);
    }
  };

  const handleReativarSelecionados = async () => {
    if (!selectedCodes.length || !selectedInativos.length) {
      setActionMsg("Nenhum produto inativo selecionado.");
      return;
    }
    const codes = selectedInativos.map((r) => r.prodCodigo);
    if (!window.confirm(`Reativar ${codes.length} produto(s)?`)) return;

    setReactivating(true);
    setError(null);
    setActionMsg(null);
    try {
      const res = await reativarProdutos(codes);
      setActionMsg(`${res.reativados} produto(s) reativado(s).`);
      setSel({});
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setReactivating(false);
    }
  };

  const totalPages = meta.totalPages || 1;
  const filterDef = PRODUTO_FILTER_FIELDS.find((f) => f.key === filterField);

  const renderFilterInput = () => {
    if (filterDef?.input === "grupo") {
      return (
        <select
          className="input"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        >
          <option value="">Todos</option>
          {grupos.map((g) => (
            <option key={g.prodGrupCodigo} value={String(g.prodGrupCodigo)}>
              {g.prodGrupDescricao}
            </option>
          ))}
        </select>
      );
    }
    if (filterDef?.input === "origem") {
      return (
        <select
          className="input"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        >
          <option value="">Todas</option>
          {origens.map((o) => (
            <option key={o.prodOrigCodigo} value={String(o.prodOrigCodigo)}>
              {o.prodOrigAbreviatura}
            </option>
          ))}
        </select>
      );
    }
    if (filterDef?.input === "remessa") {
      return (
        <select
          className="input"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        >
          <option value="">Todos</option>
          {tiposRemessa.map((r) => (
            <option key={r.disTipNumero} value={String(r.disTipNumero)}>
              {r.disTipDescricao}
            </option>
          ))}
        </select>
      );
    }
    if (filterDef?.input === "classificacao") {
      return (
        <select
          className="input"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        >
          {PRODUTO_CLASSIFICACAO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    if (filterDef?.input === "status") {
      return (
        <select
          className="input"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="A">Ativo</option>
          <option value="I">Inativo</option>
        </select>
      );
    }
    return (
      <input
        className="input"
        type={filterDef?.input === "number" ? "number" : "text"}
        placeholder={filterDef?.placeholder || "Valor do filtro"}
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && applyFilters()}
      />
    );
  };

  return (
    <div className="content-inner">
      <Breadcrumb items={["Cadastro", "Alimentos"]} />
      <div className="page-head">
        <div>
          <div className="page-title">{PRODUTOS_WW_TITLE}</div>
          <div className="page-desc">
            Work With <span className="mono">trnsprodutosWW</span>
            {meta.total > 0 && (
              <>
                {" "}
                · <strong className="tnum">{meta.total.toLocaleString("pt-BR")}</strong> registros
              </>
            )}
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => onOpenProduto?.("novo")}>
            <FaIcon icon={PRODUTOS_WW_ACTIONS.insert.icon} /> {PRODUTOS_WW_ACTIONS.insert.label}
          </button>
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
                {PRODUTO_FILTER_FIELDS.map((f) => (
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
        <div className="panel-foot">
          <div className="row gap-2 wrap">
            {[
              ["todos", "Todos"],
              ["ativo", "Ativos"],
              ["inativo", "Inativos"],
            ].map(([k, l]) => (
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
      </div>

      {actionMsg && !error && (
        <div className="panel" style={{ marginBottom: "var(--space-5)" }}>
          <div className="panel-body">
            <p style={{ color: "var(--success-fg)", margin: 0 }}>{actionMsg}</p>
          </div>
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
            <div className="row gap-2">
              {selectedAtivos.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  disabled={statusBusy || loading}
                  onClick={handleInativarSelecionados}
                >
                  <FaIcon icon="fa-ban" /> {inactivating ? "Inativando…" : "Inativar"}
                </button>
              )}
              {selectedInativos.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={statusBusy || loading}
                  onClick={handleReativarSelecionados}
                >
                  <FaIcon icon="fa-check" /> {reactivating ? "Reativando…" : "Reativar"}
                </button>
              )}
            </div>
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
                <th className="col-actions" title={PRODUTOS_WW_ACTIONS.update.geneXus}>
                  <span className="sr-only">Ações</span>
                </th>
                {PRODUTOS_WW_COLUMNS.map((col) => (
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
                  <td
                    colSpan={PRODUTOS_WW_COLUMNS.length + 2}
                    className="cell-muted"
                    style={{ textAlign: "center", padding: "var(--space-8)" }}
                  >
                    Carregando produtos…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={PRODUTOS_WW_COLUMNS.length + 2}
                    className="cell-muted"
                    style={{ textAlign: "center", padding: "var(--space-8)" }}
                  >
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                data.map((r) => {
                  const st = PRODUTO_STATUS[r.prodStatus] || PRODUTO_STATUS.I;
                  return (
                    <tr key={`${r.prefCodigo}-${r.prodCodigo}`}>
                      <td className="row-check">
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={!!sel[r.prodCodigo]}
                            onChange={() =>
                              setSel((s) => ({ ...s, [r.prodCodigo]: !s[r.prodCodigo] }))
                            }
                          />
                          <span className="box">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        </label>
                      </td>
                      <td className="col-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          title={PRODUTOS_WW_ACTIONS.update.label}
                          onClick={() => onOpenProduto?.(r.prodCodigo)}
                        >
                          <FaIcon icon={PRODUTOS_WW_ACTIONS.update.icon} />
                        </button>
                      </td>
                      {PRODUTOS_WW_COLUMNS.map((col) => {
                        if (col.format === "status") {
                          return (
                            <td key={col.key}>
                              <span className={"badge " + st.cls}>
                                <span className="dot" />
                                {st.label}
                              </span>
                            </td>
                          );
                        }
                        const display = formatProdutoCell(col, r, PRODUTO_STATUS);
                        const isDesc = col.key === "prodDescricao";
                        return (
                          <td
                            key={col.key}
                            className={
                              (isDesc ? "cell-strong " : "") +
                              (col.format === "decimal" || col.key === "prodCodigo" ? "tnum " : "") +
                              (col.key === "prodCodigo" ? "mono cell-muted" : "")
                            }
                            style={isDesc ? { cursor: onOpenProduto ? "pointer" : undefined } : undefined}
                            onClick={isDesc ? () => onOpenProduto?.(r.prodCodigo) : undefined}
                          >
                            {col.format === "decimal" ? formatProdutoDecimal(r[col.key]) : display}
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
                {PRODUTOS_PAGE_SIZES.map((n) => (
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
    </div>
  );
}
