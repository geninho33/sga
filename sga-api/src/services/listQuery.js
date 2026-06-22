/**
 * Consulta paginada reutilizável para listagens WW.
 */
export async function paginatedList(pool, options) {
  const {
    select,
    from,
    where = [],
    params = {},
    orderBy,
    orderDir = "ASC",
    page = 1,
    limit = 20,
    prefCodigo,
    prefColumn,
    alias = "t",
    groupBy,
  } = options;

  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;
  const clauses = [...where];
  const queryParams = { ...params, limit: safeLimit, offset };

  if (prefCodigo !== undefined && prefCodigo !== null && prefColumn) {
    clauses.push(`${alias}.${prefColumn} = :prefCodigo`);
    queryParams.prefCodigo = prefCodigo;
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const dir = String(orderDir).toLowerCase() === "desc" ? "DESC" : "ASC";
  const groupSql = groupBy ? `GROUP BY ${groupBy}` : "";

  const countSelect = groupBy
    ? `SELECT COUNT(*) AS total FROM (SELECT 1 ${from} ${whereSql} ${groupSql}) AS _cnt`
    : `SELECT COUNT(*) AS total ${from} ${whereSql}`;

  const [countRows] = await pool.query(countSelect, queryParams);
  const total = Number(countRows[0].total);

  const [rows] = await pool.query(
    `SELECT ${select}
     ${from}
     ${whereSql}
     ${groupSql}
     ORDER BY ${orderBy} ${dir}
     LIMIT :limit OFFSET :offset`,
    queryParams
  );

  return {
    data: rows,
    meta: {
      prefCodigo: prefCodigo ?? null,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
      orderBy,
      orderDir: dir === "DESC" ? "desc" : "asc",
    },
  };
}
