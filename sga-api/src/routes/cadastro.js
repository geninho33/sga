import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, resolvePrefCodigo } from "../middleware/auth.js";
import {
  createConvQtde,
  createDoenca,
  createLocal,
  createTipoAjuste,
  createUnidade,
  loadConvQtde,
  loadDoenca,
  loadLocal,
  loadTipoAjuste,
  loadUnidade,
  sendCrudResult,
  updateConvQtde,
  updateDoenca,
  updateLocal,
  updateTipoAjuste,
  updateUnidade,
} from "../services/cadastroEntities.js";
import { paginatedList } from "../services/listQuery.js";

const router = Router();
router.use(requireAuth);

function getPrefCodigo(req) {
  const pref = resolvePrefCodigo(req);
  return pref !== undefined && pref !== null ? Number(pref) : null;
}

function parseSort(req, sortMap, defaultCol) {
  const orderBy = sortMap[req.query.orderBy] || defaultCol;
  const orderDir = String(req.query.orderDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
  return { orderBy, orderDir };
}

router.get("/unidades", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const status = req.query.status;
    const where = [];
    const params = {};

    if (status === "A" || status === "I") {
      where.push("u.uniStatus = :status");
      params.status = status;
    }
    if (q) {
      where.push("u.uniDescricao LIKE :q");
      params.q = `%${q}%`;
    }

    const sort = parseSort(req, { uniDescricao: "u.uniDescricao", uniFracao: "u.uniFracao", uniStatus: "u.uniStatus" }, "u.uniDescricao");

    const result = await paginatedList(pool, {
      select: "u.uniCodigo, u.uniDescricao, u.uniFracao, u.uniStatus, u.uniDataCad, u.uniDataAlt",
      from: "FROM trnsunidades u",
      alias: "u",
      where,
      params,
      prefCodigo,
      prefColumn: "prefCodigo",
      orderBy: sort.orderBy,
      orderDir: sort.orderDir,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/conv-qtdes", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const where = [];
    const params = {};

    if (q) {
      where.push("(uo.uniDescricao LIKE :q OR ud.uniDescricao LIKE :q)");
      params.q = `%${q}%`;
    }

    const sort = parseSort(
      req,
      {
        uniConOrigemDescricao: "uo.uniDescricao",
        uniConDestinoDescricao: "ud.uniDescricao",
        uniConvQtdeGerar: "c.uniConvQtdeGerar",
      },
      "uo.uniDescricao"
    );

    const result = await paginatedList(pool, {
      select: `c.uniConvUnidadeOrigem, c.uniConvUnidadeDestino, c.uniConvQtdeGerar, c.uniConvStatus,
               uo.uniDescricao AS uniConOrigemDescricao, ud.uniDescricao AS uniConDestinoDescricao`,
      from: `FROM trnsconvqtde c
             LEFT JOIN trnsunidades uo ON uo.prefCodigo = c.prefCodigo AND uo.uniCodigo = c.uniConvUnidadeOrigem AND NOT (uo.uniStatus <=> 'I')
             LEFT JOIN trnsunidades ud ON ud.prefCodigo = c.prefCodigo AND ud.uniCodigo = c.uniConvUnidadeDestino AND NOT (ud.uniStatus <=> 'I')`,
      alias: "c",
      where,
      params,
      prefCodigo,
      prefColumn: "prefCodigo",
      orderBy: sort.orderBy,
      orderDir: sort.orderDir,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/locais", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const status = req.query.status;
    const where = [];
    const params = {};

    if (status === "A" || status === "I") {
      where.push("l.locStatus = :status");
      params.status = status;
    }
    if (q) {
      where.push("(l.locDescricao LIKE :q OR CAST(l.locCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }

    const sort = parseSort(
      req,
      {
        locCodigo: "l.locCodigo",
        locDescricao: "l.locDescricao",
        locTipoUnidade: "l.locTipoUnidade",
        locBairro: "l.locBairro",
        locStatus: "l.locStatus",
      },
      "l.locDescricao"
    );

    const result = await paginatedList(pool, {
      select: `l.locCodigo, l.locDescricao, l.locTipoUnidade, l.locTelefone, l.locBairro,
               l.locUsuario, l.locForno, l.locNota, l.locStatus, l.locUeCod,
               r.rotaDescricao AS locRotaDescricao`,
      from: `FROM trnslocal l
             LEFT JOIN trnsrota r ON r.prefCodigo = l.prefCodigo AND r.rotaCodigo = l.locNota AND NOT (r.rotaStatus <=> 'I')`,
      alias: "l",
      where,
      params,
      prefCodigo,
      prefColumn: "prefCodigo",
      orderBy: sort.orderBy,
      orderDir: sort.orderDir,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/doencas", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const status = req.query.status;
    const where = [];
    const params = {};

    if (status === "A" || status === "I") {
      where.push("d.doenStatus = :status");
      params.status = status;
    }
    if (q) {
      where.push("(d.doenDescricao LIKE :q OR CAST(d.doenCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }

    const sort = parseSort(
      req,
      { doenCodigo: "d.doenCodigo", doenDescricao: "d.doenDescricao", doenOrdem: "d.doenOrdem", doenStatus: "d.doenStatus" },
      "d.doenDescricao"
    );

    const result = await paginatedList(pool, {
      select: "d.doenCodigo, d.doenDescricao, d.doenOrdem, d.doenStatus",
      from: "FROM trnsdoencas d",
      alias: "d",
      where,
      params,
      prefCodigo,
      prefColumn: "prefCodigo",
      orderBy: sort.orderBy,
      orderDir: sort.orderDir,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/tipos-ajuste", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const where = [];
    const params = {};

    if (q) {
      where.push("(t.tipajuNome LIKE :q OR t.tipajuSigla LIKE :q OR CAST(t.tipajuCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }

    const sort = parseSort(
      req,
      { tipajuCodigo: "t.tipajuCodigo", tipajuNome: "t.tipajuNome", tipajuSigla: "t.tipajuSigla", tipajuAcao: "t.tipajuAcao" },
      "t.tipajuNome"
    );

    const result = await paginatedList(pool, {
      select: "t.tipajuCodigo, t.tipajuNome, t.tipajuSigla, t.tipajuAcao",
      from: "FROM tipoajuste t",
      alias: "t",
      where,
      params,
      prefCodigo,
      prefColumn: "prefCodigo",
      orderBy: sort.orderBy,
      orderDir: sort.orderDir,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/unidades/:uniCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadUnidade(prefCodigo, Number(req.params.uniCodigo));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/unidades", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createUnidade(prefCodigo, req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.put("/unidades/:uniCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateUnidade(prefCodigo, Number(req.params.uniCodigo), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.get("/conv-qtdes/:orig/:dest", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadConvQtde(prefCodigo, Number(req.params.orig), Number(req.params.dest));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/conv-qtdes", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createConvQtde(prefCodigo, req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.put("/conv-qtdes/:orig/:dest", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(
      res,
      await updateConvQtde(prefCodigo, Number(req.params.orig), Number(req.params.dest), req.body || {})
    );
  } catch (err) {
    next(err);
  }
});

router.get("/locais/:locCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadLocal(prefCodigo, Number(req.params.locCodigo));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/locais", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createLocal(prefCodigo, req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.put("/locais/:locCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateLocal(prefCodigo, Number(req.params.locCodigo), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.get("/doencas/:doenCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadDoenca(prefCodigo, Number(req.params.doenCodigo));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/doencas", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createDoenca(prefCodigo, req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.put("/doencas/:doenCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateDoenca(prefCodigo, Number(req.params.doenCodigo), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.get("/tipos-ajuste/:tipajuCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadTipoAjuste(prefCodigo, Number(req.params.tipajuCodigo));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/tipos-ajuste", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createTipoAjuste(prefCodigo, req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.put("/tipos-ajuste/:tipajuCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateTipoAjuste(prefCodigo, Number(req.params.tipajuCodigo), req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

export default router;
