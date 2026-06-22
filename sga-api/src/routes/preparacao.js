import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, resolvePrefCodigo } from "../middleware/auth.js";
import { paginatedList } from "../services/listQuery.js";
import {
  createAtendimento,
  createCalendario,
  createCardapio,
  createCardapioArea,
  createCardapioGrupo,
  createCardapioPrato,
  createPrato,
  createTipoRefeicao,
  deleteCardapioArea,
  deleteCalendario,
  deleteCardapioPrato,
  deletePratoIngrediente,
  duplicarCardapio,
  duplicarPrato,
  listCardapioAreas,
  listCardapioPratos,
  listPratoIngredientes,
  listReferencias,
  loadAtendimento,
  loadCalendario,
  loadCardapio,
  loadCardapioGrupo,
  loadPrato,
  loadTipoRefeicao,
  sendCrudResult,
  updateAtendimento,
  updateCalendario,
  updateCardapio,
  updateCardapioGrupo,
  updatePrato,
  updateTipoRefeicao,
  upsertPratoIngrediente,
} from "../services/preparacaoEntities.js";
import { atendimentoHasCarDapCodigo } from "../services/schemaFeatures.js";
import { ATENDIMENTO_TOTAL_SEGUNDA_SQL } from "../services/atendimentoDoencaService.js";

const router = Router();
router.use(requireAuth);

function getPref(req) {
  const pref = resolvePrefCodigo(req);
  return pref !== undefined && pref !== null ? Number(pref) : null;
}

function parseSort(req, map, def) {
  const orderBy = map[req.query.orderBy] || def;
  const orderDir = String(req.query.orderDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
  return { orderBy, orderDir };
}

router.get("/referencias", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const data = await listReferencias(prefCodigo);
    data.atendimentoHasCarDapCodigo = await atendimentoHasCarDapCodigo();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/pratos", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const q = (req.query.q || "").trim();
    const where = [];
    const params = {};
    if (req.query.status === "A" || req.query.status === "I") {
      where.push("p.pratoStatus = :status");
      params.status = req.query.status;
    }
    if (q) {
      where.push("(p.pratoDscricao LIKE :q OR CAST(p.pratoCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }
    const sort = parseSort(
      req,
      { pratoDscricao: "p.pratoDscricao", pratoCodigo: "p.pratoCodigo", pratoStatus: "p.pratoStatus", pratoTipoRefeicao: "p.pratoTipoRefeicao" },
      "p.pratoDscricao"
    );
    const result = await paginatedList(pool, {
      select: `p.pratoCodigo, p.pratoDscricao, p.pratoTipoRefeicao, p.pratoStatus, t.refTipDescricao AS pratoTipoRefeicaoDesc`,
      from: `FROM trnspratos p LEFT JOIN trnsrefeicaotipo t ON t.prefCodigo = p.prefCodigo AND t.refTipCodigo = p.pratoTipoRefeicao`,
      alias: "p",
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

router.get("/pratos/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    const row = await loadPrato(prefCodigo, Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});
router.post("/pratos", async (req, res, next) => {
  try {
    sendCrudResult(res, await createPrato(getPref(req), req.body || {}));
  } catch (err) {
    next(err);
  }
});
router.put("/pratos/:id", async (req, res, next) => {
  try {
    sendCrudResult(res, await updatePrato(getPref(req), Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.post("/pratos/:id/duplicar", async (req, res, next) => {
  try {
    sendCrudResult(res, await duplicarPrato(getPref(req), Number(req.params.id)));
  } catch (err) {
    next(err);
  }
});

router.get("/pratos/:id/ingredientes", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    res.json({ data: await listPratoIngredientes(prefCodigo, Number(req.params.id)) });
  } catch (err) {
    next(err);
  }
});

router.post("/pratos/:id/ingredientes", async (req, res, next) => {
  try {
    sendCrudResult(res, await upsertPratoIngrediente(getPref(req), Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.delete("/pratos/:id/ingredientes/:prod/:area/:seq/:turno", async (req, res, next) => {
  try {
    sendCrudResult(
      res,
      await deletePratoIngrediente(getPref(req), Number(req.params.id), {
        pratIngrProdCodigo: req.params.prod,
        AreEnsCodigo: req.params.area,
        AreEnsSequencial: req.params.seq,
        carGruTurno: req.params.turno,
      })
    );
  } catch (err) {
    next(err);
  }
});

router.get("/tipos-refeicao", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    const q = (req.query.q || "").trim();
    const where = [];
    const params = {};
    if (req.query.status) {
      where.push("t.refTipstatus = :status");
      params.status = req.query.status;
    }
    if (q) where.push("(t.refTipDescricao LIKE :q OR t.refTipAbreviatura LIKE :q)");
    if (q) params.q = `%${q}%`;
    const sort = parseSort(req, { refTipDescricao: "t.refTipDescricao", refTipCodigo: "t.refTipCodigo" }, "t.refTipDescricao");
    res.json(
      await paginatedList(pool, {
        select: "t.refTipCodigo, t.refTipAbreviatura, t.refTipDescricao, t.refTipperiodo, t.refTipHorario, t.refTipHorario2, t.refTipstatus",
        from: "FROM trnsrefeicaotipo t",
        alias: "t",
        where,
        params,
        prefCodigo,
        prefColumn: "prefCodigo",
        orderBy: sort.orderBy,
        orderDir: sort.orderDir,
        page: req.query.page,
        limit: req.query.limit,
      })
    );
  } catch (err) {
    next(err);
  }
});
router.get("/tipos-refeicao/:id", async (req, res, next) => {
  try {
    const row = await loadTipoRefeicao(getPref(req), Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});
router.post("/tipos-refeicao", async (req, res, next) => {
  try {
    sendCrudResult(res, await createTipoRefeicao(getPref(req), req.body || {}));
  } catch (err) {
    next(err);
  }
});
router.put("/tipos-refeicao/:id", async (req, res, next) => {
  try {
    sendCrudResult(res, await updateTipoRefeicao(getPref(req), Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.get("/cardapios", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    const q = (req.query.q || "").trim();
    const where = [];
    const params = {};
    if (req.query.status) {
      where.push("c.carDapStatus = :status");
      params.status = req.query.status;
    }
    if (q) {
      where.push("c.carDapDescricao LIKE :q");
      params.q = `%${q}%`;
    }
    const sort = parseSort(req, { carDapDescricao: "c.carDapDescricao", carDapCodigo: "c.carDapCodigo", carDapMesAno: "c.carDapMesAno", carGruDescricao: "cg.carGruDescricao" }, "c.carDapDescricao");
    res.json(
      await paginatedList(pool, {
        select: `c.carDapCodigo, c.carDapDescricao, c.carDapNutricionista, c.carDapMesAno, c.carDapStatus,
                 c.carDapLiberarAcesso, c.carDapGruCodigo, cg.carGruDescricao`,
        from: `FROM trnscardapio c
          LEFT JOIN trnscardapiogrupo cg ON cg.prefCodigo = c.prefCodigo AND cg.carGruCodigo = c.carDapGruCodigo`,
        alias: "c",
        where,
        params,
        prefCodigo,
        prefColumn: "prefCodigo",
        orderBy: sort.orderBy,
        orderDir: sort.orderDir,
        page: req.query.page,
        limit: req.query.limit,
      })
    );
  } catch (err) {
    next(err);
  }
});
router.get("/cardapios/:id", async (req, res, next) => {
  try {
    const row = await loadCardapio(getPref(req), Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});
router.post("/cardapios", async (req, res, next) => {
  try {
    sendCrudResult(res, await createCardapio(getPref(req), req.body || {}, req));
  } catch (err) {
    next(err);
  }
});
router.put("/cardapios/:id", async (req, res, next) => {
  try {
    sendCrudResult(res, await updateCardapio(getPref(req), Number(req.params.id), req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.post("/cardapios/:id/duplicar", async (req, res, next) => {
  try {
    sendCrudResult(res, await duplicarCardapio(getPref(req), Number(req.params.id), req));
  } catch (err) {
    next(err);
  }
});

router.get("/cardapios/:id/impressao", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const { buildAndRenderCardapioPdf } = await import("../services/cardapioReportPdf.js");
    const result = await buildAndRenderCardapioPdf(prefCodigo, {
      carDapCodigo: Number(req.params.id),
      carDapMesAno: req.query.carDapMesAno,
      locCodigo: req.query.locCodigo,
      opcReceita: req.query.opcReceita || "N",
      opcSemanaINI: req.query.opcSemanaINI,
      opcSemanaFIN: req.query.opcSemanaFIN,
      opcFormato: req.query.opcFormato || "pnae",
    });

    if (result.error) return res.status(400).json({ error: result.error });

    const filename = `cardapio-${req.params.id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
});

router.get("/cardapios/:id/pratos", async (req, res, next) => {
  try {
    res.json({ data: await listCardapioPratos(getPref(req), Number(req.params.id)) });
  } catch (err) {
    next(err);
  }
});
router.post("/cardapios/:id/pratos", async (req, res, next) => {
  try {
    sendCrudResult(res, await createCardapioPrato(getPref(req), Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});
router.delete("/cardapios/:id/pratos/:pratoId", async (req, res, next) => {
  try {
    sendCrudResult(res, await deleteCardapioPrato(getPref(req), Number(req.params.id), Number(req.params.pratoId)));
  } catch (err) {
    next(err);
  }
});

router.get("/cardapios/:id/areas", async (req, res, next) => {
  try {
    res.json({ data: await listCardapioAreas(getPref(req), Number(req.params.id)) });
  } catch (err) {
    next(err);
  }
});
router.post("/cardapios/:id/areas", async (req, res, next) => {
  try {
    sendCrudResult(res, await createCardapioArea(getPref(req), Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});
router.delete("/cardapios/:id/areas/:are/:seq/:turno", async (req, res, next) => {
  try {
    sendCrudResult(
      res,
      await deleteCardapioArea(getPref(req), Number(req.params.id), Number(req.params.are), Number(req.params.seq), Number(req.params.turno))
    );
  } catch (err) {
    next(err);
  }
});

router.get("/cardapio-grupos", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    const q = (req.query.q || "").trim();
    const where = [];
    const params = {};
    if (req.query.status) {
      where.push("g.carGruStatus = :status");
      params.status = req.query.status;
    }
    if (q) {
      where.push("g.carGruDescricao LIKE :q");
      params.q = `%${q}%`;
    }
    const sort = parseSort(req, { carGruDescricao: "g.carGruDescricao", carGruCodigo: "g.carGruCodigo", carDapDescricao: "cd.carDapDescricao" }, "g.carGruDescricao");
    res.json(
      await paginatedList(pool, {
        select: `g.carGruCodigo, g.carGruDescricao, g.carGruCozinhaCentral, g.carGruStatus,
                 g.carDapCodigo, cd.carDapDescricao, cd.carDapMesAno`,
        from: `FROM trnscardapiogrupo g
          LEFT JOIN trnscardapio cd ON cd.prefCodigo = g.prefCodigo AND cd.carDapCodigo = g.carDapCodigo`,
        alias: "g",
        where,
        params,
        prefCodigo,
        prefColumn: "prefCodigo",
        orderBy: sort.orderBy,
        orderDir: sort.orderDir,
        page: req.query.page,
        limit: req.query.limit,
      })
    );
  } catch (err) {
    next(err);
  }
});
router.get("/cardapio-grupos/:id", async (req, res, next) => {
  try {
    const row = await loadCardapioGrupo(getPref(req), Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});
router.post("/cardapio-grupos", async (req, res, next) => {
  try {
    sendCrudResult(res, await createCardapioGrupo(getPref(req), req.body || {}));
  } catch (err) {
    next(err);
  }
});
router.put("/cardapio-grupos/:id", async (req, res, next) => {
  try {
    sendCrudResult(res, await updateCardapioGrupo(getPref(req), Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.get("/atendimentos", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    const q = (req.query.q || "").trim();
    const where = [];
    const params = {};
    if (req.query.status) {
      where.push("a.AtendimentoStatus = :status");
      params.status = req.query.status;
    }
    if (req.query.carGruCodigo) {
      where.push("a.carGruCodigo = :carGruCodigo");
      params.carGruCodigo = Number(req.query.carGruCodigo);
    }
    if (q) {
      where.push("(l.locDescricao LIKE :q OR CAST(a.AtendimentoCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }
    const hasCarDap = await atendimentoHasCarDapCodigo();
    const cardapioJoin = hasCarDap
      ? `LEFT JOIN trnscardapio cd ON cd.prefCodigo = a.prefCodigo AND cd.carDapCodigo = a.carDapCodigo`
      : `LEFT JOIN trnscardapio cd ON cd.prefCodigo = cg.prefCodigo AND cd.carDapCodigo = cg.carDapCodigo`;
    const sort = parseSort(
      req,
      {
        locDescricao: "l.locDescricao",
        AtendimentoCodigo: "a.AtendimentoCodigo",
        AreEnsNome: "ae.AreEnsNome",
        carGruDescricao: "cg.carGruDescricao",
        carDapDescricao: "cd.carDapDescricao",
        AtendimentoTurnoDesc: "rt.refTipDescricao",
        AtendimentoTotalAlunos: ATENDIMENTO_TOTAL_SEGUNDA_SQL.trim(),
      },
      "l.locDescricao"
    );
    res.json(
      await paginatedList(pool, {
        select: `a.AtendimentoCodigo, l.locDescricao, ae.AreEnsNome, cg.carGruDescricao,
                 cd.carDapDescricao, cd.carDapMesAno,
                 rt.refTipDescricao AS AtendimentoTurnoDesc, a.AtendimentoTurno,
                 ${ATENDIMENTO_TOTAL_SEGUNDA_SQL} AS AtendimentoTotalAlunos,
                 a.AtendimentoStatus`,
        from: `FROM atendimento a
          LEFT JOIN trnslocal l ON l.prefCodigo = a.prefCodigo AND l.locCodigo = a.locCodigo
          LEFT JOIN trnsareaensino ae ON ae.prefCodigo = a.prefCodigo AND ae.AreEnsCodigo = a.AreEnsCodigo
          LEFT JOIN trnscardapiogrupo cg ON cg.prefCodigo = a.prefCodigo AND cg.carGruCodigo = a.carGruCodigo
          ${cardapioJoin}
          LEFT JOIN trnsrefeicaotipo rt ON rt.prefCodigo = a.prefCodigo AND rt.refTipCodigo = a.AtendimentoTurno
          LEFT JOIN (
            SELECT prefCodigo, AtendimentoCodigo, SUM(COALESCE(qtdeSegunda, 0)) AS sumDoencasSegunda
            FROM sga_atendimento_doenca
            GROUP BY prefCodigo, AtendimentoCodigo
          ) ad ON ad.prefCodigo = a.prefCodigo AND ad.AtendimentoCodigo = a.AtendimentoCodigo`,
        alias: "a",
        where,
        params,
        prefCodigo,
        prefColumn: "prefCodigo",
        orderBy: sort.orderBy,
        orderDir: sort.orderDir,
        page: req.query.page,
        limit: req.query.limit,
      })
    );
  } catch (err) {
    next(err);
  }
});
router.get("/atendimentos/:id", async (req, res, next) => {
  try {
    const row = await loadAtendimento(getPref(req), Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});
router.post("/atendimentos", async (req, res, next) => {
  try {
    sendCrudResult(res, await createAtendimento(getPref(req), req.body || {}));
  } catch (err) {
    next(err);
  }
});
router.put("/atendimentos/:id", async (req, res, next) => {
  try {
    sendCrudResult(res, await updateAtendimento(getPref(req), Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.get("/calendario-letivo", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    const q = (req.query.q || "").trim();
    const where = [];
    const params = {};
    if (req.query.status) {
      where.push("c.calStatus = :status");
      params.status = req.query.status;
    }
    if (q) {
      where.push("(c.calDescricao LIKE :q OR CAST(c.calAno AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }
    const sort = parseSort(req, { calData: "c.calData", calAno: "c.calAno", calDescricao: "c.calDescricao" }, "c.calData");
    res.json(
      await paginatedList(pool, {
        select: "c.calAno, c.calData, c.calDescricao, c.calDiautil, c.calFeriado, c.calStatus",
        from: "FROM trnscalendarioletivo c",
        alias: "c",
        where,
        params,
        prefCodigo,
        prefColumn: "prefCodigo",
        orderBy: sort.orderBy,
        orderDir: sort.orderDir,
        page: req.query.page,
        limit: req.query.limit,
      })
    );
  } catch (err) {
    next(err);
  }
});
router.get("/calendario-letivo/mapa/:ano", async (req, res, next) => {
  try {
    const { loadCalendarioMap } = await import("../services/calendarioLetivoService.js");
    const ano = Number(req.params.ano);
    const map = await loadCalendarioMap(getPref(req), ano);
    res.json({ data: Object.fromEntries(map) });
  } catch (err) {
    next(err);
  }
});
router.get("/calendario-letivo/:ano/:data", async (req, res, next) => {
  try {
    const row = await loadCalendario(getPref(req), Number(req.params.ano), req.params.data);
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});
router.post("/calendario-letivo", async (req, res, next) => {
  try {
    sendCrudResult(res, await createCalendario(getPref(req), req.body || {}));
  } catch (err) {
    next(err);
  }
});
router.put("/calendario-letivo/:ano/:data", async (req, res, next) => {
  try {
    sendCrudResult(res, await updateCalendario(getPref(req), Number(req.params.ano), req.params.data, req.body || {}));
  } catch (err) {
    next(err);
  }
});
router.delete("/calendario-letivo/:ano/:data", async (req, res, next) => {
  try {
    sendCrudResult(res, await deleteCalendario(getPref(req), Number(req.params.ano), req.params.data));
  } catch (err) {
    next(err);
  }
});

router.get("/cardapios/:id/nutrientes", async (req, res, next) => {
  try {
    const { calcCardapioNutrientesResumo } = await import("../services/cardapioNutrientesService.js");
    const data = await calcCardapioNutrientesResumo(getPref(req), Number(req.params.id));
    if (!data) return res.status(404).json({ error: "Cardápio não encontrado" });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/cardapios/:id/feriados", async (req, res, next) => {
  try {
    const { loadCalendarioMap } = await import("../services/calendarioLetivoService.js");
    const ano = Number(req.query.ano) || new Date().getFullYear();
    const map = await loadCalendarioMap(getPref(req), ano);
    res.json({ data: Object.fromEntries(map) });
  } catch (err) {
    next(err);
  }
});

router.get("/cardapio-grupos/:id/cardapios", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    const carGruCodigo = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT carDapCodigo, carDapDescricao, carDapMesAno, carDapStatus
       FROM trnscardapio WHERE prefCodigo = :prefCodigo AND carDapGruCodigo = :carGruCodigo
       ORDER BY carDapMesAno DESC, carDapDescricao`,
      { prefCodigo, carGruCodigo }
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/cardapio-grupos/:id/vincular-cardapio", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    const carGruCodigo = Number(req.params.id);
    const carDapCodigo = Number(req.body?.carDapCodigo);
    if (!carDapCodigo) return res.status(400).json({ error: "Cardápio é obrigatório" });
    const [result] = await pool.query(
      `UPDATE trnscardapio SET carDapGruCodigo = :carGruCodigo, carDapDataAlteracao = NOW()
       WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo`,
      { prefCodigo, carGruCodigo, carDapCodigo }
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Cardápio não encontrado" });
    res.json({ message: "Cardápio vinculado ao grupo." });
  } catch (err) {
    next(err);
  }
});

router.get("/atendimentos/:id/doencas", async (req, res, next) => {
  try {
    const { listAtendimentoDoencas } = await import("../services/atendimentoDoencaService.js");
    const data = await listAtendimentoDoencas(getPref(req), Number(req.params.id));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.put("/atendimentos/:id/doencas", async (req, res, next) => {
  try {
    const { saveAtendimentoDoencas } = await import("../services/atendimentoDoencaService.js");
    const data = await saveAtendimentoDoencas(getPref(req), Number(req.params.id), req.body?.items || []);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
