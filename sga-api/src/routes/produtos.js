import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, resolvePrefCodigo } from "../middleware/auth.js";
import { EDITABLE_FIELDS, buildProdutoRow } from "../services/produtoRow.js";
import {
  PRODUTO_FROM,
  PRODUTO_SELECT,
  listGruposAtivos,
  listOrigensAtivas,
  listTiposRemessaAtivos,
  listTacosAtivos,
  listUnidadesAtivas,
} from "../services/produtoReferencias.js";
import { aplicarTabelaTaco } from "../services/tacoService.js";

const router = Router();

router.use(requireAuth);

const INSERT_COLS = [
  "prefCodigo",
  "prodCodigo",
  "prodPrograma",
  "prodPrograma_exclusivo",
  "prodDescricao",
  "prodEspecificacao",
  "prodUnidMedCompra",
  "prodPesoCompra",
  "prodObsCompra",
  "prodEmbalagemCompra",
  "prodObsEmbalagem",
  "prodQtdeEmbalagemCompra",
  "prodUnidMedConsumo",
  "prodPesoConsumo",
  "prodObsConsumo",
  "prodPesoUnidade",
  "prodUnidMedEstocagem",
  "prodPesoEstocagem",
  "prodObsEstocagem",
  "prodTipo",
  "prodLoteCompra",
  "prodClassificacao",
  "prodTipoRemessa",
  "prodTiipoCompra",
  "prodFracaoEstocagem",
  "prodFracaoConsumo",
  "prodArredConsumo",
  "prodValorunitario",
  "prodArredondaOcorrencia",
  "prodCalculoDifer",
  "prodOrigem",
  "prodZonaUrbana",
  "prodZonaRural",
  "prodAcucar",
  "prodCaloria",
  "prodCarboidrato",
  "prodGorduraTrans",
  "prodGorduraSaturada",
  "prodProteina",
  "prodSal",
  "prodPotassio",
  "prodCalcio",
  "prodFerro",
  "prodVitaminaA",
  "prodNpcal",
  "prodNdpcal",
  "prodLipidio",
  "prodFibra",
  "prodVitaminaC",
  "prodMagnesio",
  "prodZinco",
  "prodTipoIndice",
  "prodIndice",
  "prodTaco",
  "prodStatus",
  "prodCodigoTipoRemessa",
  "prodSaldo",
  "prodQtdeMinimo",
  "prodQtdeMaximo",
  "prodFatorCorrecao",
  "prodFatorCuccao",
  "prodDiasConsumo",
];

function resolvePrefCodigoFromRequest(req) {
  const fromUser = resolvePrefCodigo(req);
  if (fromUser !== undefined && fromUser !== null) {
    return Number(fromUser);
  }
  return null;
}

router.get("/", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigoFromRequest(req);
    if (!prefCodigo) {
      return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const q = (req.query.q || "").trim();
    const prodCodigo = req.query.prodCodigo;
    const prodTipo = req.query.prodTipo;
    const prodOrigem = req.query.prodOrigem;
    const prodClassificacao = req.query.prodClassificacao;

    const SORT_COLUMNS = {
      prodDescricao: "prodDescricao",
      prodCodigo: "prodCodigo",
      prodPesoConsumo: "prodPesoConsumo",
      prodPesoEstocagem: "prodPesoEstocagem",
      prodTipo: "prodTipo",
      prodOrigem: "prodOrigem",
      prodClassificacao: "prodClassificacao",
      prodCodigoTipoRemessa: "prodCodigoTipoRemessa",
      prodStatus: "prodStatus",
    };
    const orderBy = SORT_COLUMNS[req.query.orderBy] || "prodDescricao";
    const orderDir = String(req.query.orderDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

    const where = ["p.prefCodigo = :prefCodigo"];
    const params = { prefCodigo, limit, offset };

    if (status === "A" || status === "I") {
      where.push("p.prodStatus = :status");
      params.status = status;
    }

    if (q) {
      where.push("(p.prodDescricao LIKE :q OR CAST(p.prodCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }

    if (prodCodigo !== undefined && prodCodigo !== "") {
      where.push("p.prodCodigo = :prodCodigo");
      params.prodCodigo = Number(prodCodigo);
    }

    if (prodTipo !== undefined && prodTipo !== "") {
      where.push("p.prodTipo = :prodTipo");
      params.prodTipo = Number(prodTipo);
    }

    if (prodOrigem !== undefined && prodOrigem !== "") {
      where.push("p.prodOrigem = :prodOrigem");
      params.prodOrigem = Number(prodOrigem);
    }

    if (prodClassificacao !== undefined && prodClassificacao !== "") {
      where.push("p.prodClassificacao = :prodClassificacao");
      params.prodClassificacao = Number(prodClassificacao);
    }

    const whereSql = where.join(" AND ");

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM trnsprodutos p WHERE ${whereSql}`,
      params
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query(
      `SELECT ${PRODUTO_SELECT}
       ${PRODUTO_FROM}
       WHERE ${whereSql}
       ORDER BY p.${orderBy} ${orderDir}
       LIMIT :limit OFFSET :offset`,
      params
    );

    res.json({
      data: rows,
      meta: {
        prefCodigo,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        orderBy,
        orderDir: orderDir === "DESC" ? "desc" : "asc",
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const prefCodigo = resolvePrefCodigoFromRequest(req);
    if (!prefCodigo) {
      return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    }
    const body = req.body || {};

    await conn.beginTransaction();

    const [maxRows] = await conn.query(
      `SELECT COALESCE(MAX(prodCodigo), 0) + 1 AS nextCodigo
       FROM trnsprodutos
       WHERE prefCodigo = ?
       FOR UPDATE`,
      [prefCodigo]
    );
    const prodCodigo = Number(maxRows[0].nextCodigo);

    const built = buildProdutoRow(prefCodigo, prodCodigo, body);
    if (built.error) {
      await conn.rollback();
      return res.status(400).json({ error: built.error });
    }

    const row = built.row;
    const placeholders = INSERT_COLS.map((c) => `:${c}`).join(", ");
    const insertParams = {};
    for (const col of INSERT_COLS) {
      insertParams[col] = row[col];
    }

    await conn.query(
      `INSERT INTO trnsprodutos (${INSERT_COLS.join(", ")}, prodDataCad, prodDataAlt)
       VALUES (${placeholders}, NOW(), NOW())`,
      insertParams
    );

    await conn.commit();

    const created = await loadProduto(prefCodigo, prodCodigo);
    res.status(201).json({ data: created });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

async function loadProduto(prefCodigo, prodCodigo) {
  const [rows] = await pool.query(
    `SELECT ${PRODUTO_SELECT}
     ${PRODUTO_FROM}
     WHERE p.prefCodigo = :prefCodigo AND p.prodCodigo = :prodCodigo
     LIMIT 1`,
    { prefCodigo, prodCodigo }
  );
  return rows[0] ?? null;
}

/** Inativa um ou mais produtos (prodStatus = 'I'). */
router.patch("/inativar", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigoFromRequest(req);
    if (!prefCodigo) {
      return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    }
    const raw = req.body?.prodCodigos;
    const prodCodigos = (Array.isArray(raw) ? raw : [])
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);

    if (!prodCodigos.length) {
      return res.status(400).json({ error: "Informe prodCodigos (array de códigos)" });
    }

    const [result] = await pool.query(
      `UPDATE trnsprodutos
       SET prodStatus = 'I', prodDataAlt = NOW()
       WHERE prefCodigo = :prefCodigo
         AND prodCodigo IN (:prodCodigos)
         AND prodStatus = 'A'`,
      { prefCodigo, prodCodigos }
    );

    res.json({
      inativados: result.affectedRows,
      prodCodigos,
      prefCodigo,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:prodCodigo/inativar", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigoFromRequest(req);
    if (!prefCodigo) {
      return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    }
    const prodCodigo = Number(req.params.prodCodigo);

    const [result] = await pool.query(
      `UPDATE trnsprodutos
       SET prodStatus = 'I', prodDataAlt = NOW()
       WHERE prefCodigo = :prefCodigo AND prodCodigo = :prodCodigo`,
      { prefCodigo, prodCodigo }
    );

    if (result.affectedRows === 0) {
      const existing = await loadProduto(prefCodigo, prodCodigo);
      if (!existing) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      if (existing.prodStatus === "I") {
        return res.json({ data: existing, message: "Produto já estava inativo" });
      }
    }

    const row = await loadProduto(prefCodigo, prodCodigo);
    res.json({ data: row, message: "Produto inativado" });
  } catch (err) {
    next(err);
  }
});

/** Reativa um ou mais produtos (prodStatus = 'A'). */
router.patch("/reativar", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigoFromRequest(req);
    if (!prefCodigo) {
      return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    }
    const raw = req.body?.prodCodigos;
    const prodCodigos = (Array.isArray(raw) ? raw : [])
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);

    if (!prodCodigos.length) {
      return res.status(400).json({ error: "Informe prodCodigos (array de códigos)" });
    }

    const [result] = await pool.query(
      `UPDATE trnsprodutos
       SET prodStatus = 'A', prodDataAlt = NOW()
       WHERE prefCodigo = :prefCodigo
         AND prodCodigo IN (:prodCodigos)
         AND prodStatus = 'I'`,
      { prefCodigo, prodCodigos }
    );

    res.json({
      reativados: result.affectedRows,
      prodCodigos,
      prefCodigo,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:prodCodigo/reativar", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigoFromRequest(req);
    if (!prefCodigo) {
      return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    }
    const prodCodigo = Number(req.params.prodCodigo);

    const [result] = await pool.query(
      `UPDATE trnsprodutos
       SET prodStatus = 'A', prodDataAlt = NOW()
       WHERE prefCodigo = :prefCodigo AND prodCodigo = :prodCodigo`,
      { prefCodigo, prodCodigo }
    );

    if (result.affectedRows === 0) {
      const existing = await loadProduto(prefCodigo, prodCodigo);
      if (!existing) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      if (existing.prodStatus === "A") {
        return res.json({ data: existing, message: "Produto já estava ativo" });
      }
    }

    const row = await loadProduto(prefCodigo, prodCodigo);
    res.json({ data: row, message: "Produto reativado" });
  } catch (err) {
    next(err);
  }
});

router.get("/referencias/grupos", async (_req, res, next) => {
  try {
    const data = await listGruposAtivos();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/referencias/origens", async (_req, res, next) => {
  try {
    const data = await listOrigensAtivas();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/referencias/tipos-remessa", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigoFromRequest(req);
    if (!prefCodigo) {
      return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    }
    const data = await listTiposRemessaAtivos(prefCodigo);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/referencias/tacos", async (_req, res, next) => {
  try {
    const data = await listTacosAtivos();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/referencias/unidades", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigoFromRequest(req);
    if (!prefCodigo) {
      return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    }
    const data = await listUnidadesAtivas(prefCodigo);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/aplicar-taco", async (req, res, next) => {
  try {
    const tacoCodigo = req.body?.prodTaco ?? req.body?.tacoCodigo;
    const result = await aplicarTabelaTaco(tacoCodigo);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/:prodCodigo", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigoFromRequest(req);
    if (!prefCodigo) {
      return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    }
    const prodCodigo = Number(req.params.prodCodigo);

    const row = await loadProduto(prefCodigo, prodCodigo);
    if (!row) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.put("/:prodCodigo", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigoFromRequest(req);
    if (!prefCodigo) {
      return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    }
    const prodCodigo = Number(req.params.prodCodigo);
    const body = req.body || {};

    if (!body.prodDescricao || String(body.prodDescricao).trim() === "") {
      return res.status(400).json({ error: "Descrição é obrigatória" });
    }

    if (body.prodStatus && body.prodStatus !== "A" && body.prodStatus !== "I") {
      return res.status(400).json({ error: "Situação inválida (use A ou I)" });
    }

    const updates = [];
    const params = { prefCodigo, prodCodigo };

    for (const field of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates.push(`${field} = :${field}`);
        params[field] = body[field];
      }
    }

    if (!updates.length) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }

    updates.push("prodDataAlt = NOW()");

    const [result] = await pool.query(
      `UPDATE trnsprodutos SET ${updates.join(", ")}
       WHERE prefCodigo = :prefCodigo AND prodCodigo = :prodCodigo`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const row = await loadProduto(prefCodigo, prodCodigo);
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;
