import { FaIcon } from "./Icon";

export const ITENS_PAGE_SIZE = 8;

export default function ItensPager({ meta, page, onPageChange, loading = false }) {
  if (!meta || meta.total <= 0) return null;
  const totalPages = meta.totalPages || 1;

  return (
    <div className="row gap-2" style={{ justifyContent: "space-between", alignItems: "center", width: "100%" }}>
      <span className="muted" style={{ fontSize: "var(--text-sm)" }}>
        {meta.total} item(ns)
        {totalPages > 1 && (
          <>
            {" · "}página <span className="tnum">{page}</span> / <span className="tnum">{totalPages}</span>
          </>
        )}
      </span>
      {totalPages > 1 && (
        <div className="row gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            title="Página anterior"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
          >
            <FaIcon icon="fa-chevron-left" />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            title="Próxima página"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
          >
            <FaIcon icon="fa-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}
