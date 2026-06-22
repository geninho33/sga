import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, resolvePrefCodigo } from "../middleware/auth.js";
import { renderNotaCompraPrintHtml } from "../services/notaCompraPrintService.js";
import { renderGuiaDistribuicaoPrintHtml } from "../services/guiaDistribuicaoPrintService.js";
import { fmtDateTimeBr } from "../utils/dateFormatBr.js";
import { paginatedList } from "../services/listQuery.js";
import {
  createCronograma,
  createFornecedor,
  createNota,
  createRomaneio,
  createRota,
  createTipoDistribuicao,
  cancelDistribuicao,
  cancelNota,
  deleteDistribuicaoItem,
  deleteNotaItem,
  deleteRomaneioItem,
  deleteCronogramaLocal,
  duplicateCronograma,
  listDistribuicaoItens,
  listDistribuicaoProdutosQuery,
  listNotaItens,
  listRomaneioItens,
  listCronogramaLocais,
  listAjustePerCaptas,
  saveAjustePerCaptaRow,
  loadRanchoFixoGuiasPreview,
  loadRanchoWizardAlimentos,
  loadRanchoWizardLocais,
  loadCronograma,
  loadDistribuicao,
  loadFornecedor,
  loadNota,
  loadRomaneio,
  loadRota,
  loadTipoDistribuicao,
  listLogisticaReferencias,
  updateCronograma,
  updateDistribuicao,
  updateFornecedor,
  updateNota,
  updateRomaneio,
  updateRota,
  updateTipoDistribuicao,
  upsertDistribuicaoItem,
  upsertNotaItem,
  upsertRomaneioItem,
  upsertCronogramaLocal,
} from "../services/logisticaEntities.js";
import { sendCrudResult } from "../services/preparacaoEntities.js";

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

function requireFields(body, fields) {
  for (const { key, label } of fields) {
    const v = body[key];
    if (v === null || v === undefined || v === "") {
      return { error: `${label} é obrigatório` };
    }
  }
  return null;
}

router.get("/referencias", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    res.json({ data: await listLogisticaReferencias(prefCodigo) });
  } catch (err) {
    next(err);
  }
});

router.get("/fornecedores", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const status = req.query.status;
    const where = [];
    const params = {};

    if (status === "A" || status === "I") {
      where.push("f.forStatus = :status");
      params.status = status;
    }
    if (q) {
      where.push("(f.forNome LIKE :q OR f.forCidade LIKE :q OR CAST(f.forCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }

    const sort = parseSort(
      req,
      {
        forCodigo: "f.forCodigo",
        forNome: "f.forNome",
        forContato: "f.forContato",
        forCnpjcpf: "f.forCnpjcpf",
        forCidade: "f.forCidade",
        forEstado: "f.forEstado",
        forTelefone: "f.forTelefone",
        forEmail: "f.forEmail",
        forStatus: "f.forStatus",
      },
      "f.forNome"
    );

    const result = await paginatedList(pool, {
      select: `f.forCodigo, f.forNome, f.forAbreviatura, f.forContato, f.forCnpjcpf,
               f.forCidade, f.forEstado, f.forTelefone, f.forEmail, f.forStatus`,
      from: "FROM trnsfornecedores f",
      alias: "f",
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

router.get("/tipos-distribuicao", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const status = req.query.status;
    const where = [];
    const params = {};

    if (status === "A" || status === "I") {
      where.push("t.disTipStatus = :status");
      params.status = status;
    }
    if (q) {
      where.push("(t.disTipDescricao LIKE :q OR CAST(t.disTipNumero AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }

    const sort = parseSort(
      req,
      {
        disTipNumero: "t.disTipNumero",
        disTipCodigo: "t.disTipCodigo",
        disTipDescricao: "t.disTipDescricao",
        disTipDias: "t.disTipDias",
        disTipStatus: "t.disTipStatus",
      },
      "t.disTipDescricao"
    );

    const result = await paginatedList(pool, {
      select: `t.disTipNumero, t.disTipCodigo, t.disTipDescricao, t.disTipDescricaoPlural,
               t.disTipDias, t.disTipSemanas, t.disTipRemessaMes, t.disTipStatus`,
      from: "FROM trnsdistribuicaotipo t",
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

router.get("/rotas", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const status = req.query.status;
    const where = [];
    const params = {};

    if (status === "A" || status === "I") {
      where.push("r.rotaStatus = :status");
      params.status = status;
    }
    if (q) {
      where.push("(r.rotaDescricao LIKE :q OR CAST(r.rotaCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }

    const sort = parseSort(
      req,
      {
        rotaCodigo: "r.rotaCodigo",
        rotaDescricao: "r.rotaDescricao",
        rotaSetor: "r.rotaSetor",
        rotaStatus: "r.rotaStatus",
      },
      "r.rotaDescricao"
    );

    const result = await paginatedList(pool, {
      select: "r.rotaCodigo, r.rotaDescricao, r.rotaSetor, r.rotaStatus",
      from: "FROM trnsrota r",
      alias: "r",
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

router.get("/compras", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const status = req.query.status;
    const where = [];
    const params = {};

    if (status === "A" || status === "I") {
      where.push("n.notaStatus = :status");
      params.status = status;
    }
    if (q) {
      where.push("(n.notaNumero LIKE :q OR f.forNome LIKE :q OR CAST(n.notaCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }

    const sort = parseSort(
      req,
      {
        notaCodigo: "n.notaCodigo",
        notaNumero: "n.notaNumero",
        notaData: "n.notaData",
        notaFornecedorNome: "f.forNome",
        notaProgCodigo: "n.notaProgCodigo",
        notaStatus: "n.notaStatus",
      },
      "n.notaData"
    );

    const result = await paginatedList(pool, {
      select: `n.notaCodigo, n.notaNumero, n.notaSerie, n.notaData, n.notaFornecedor,
               n.notaLocal, n.notaProgCodigo, n.notaStatus, f.forNome AS notaFornecedorNome`,
      from: `FROM trnsnota n
             LEFT JOIN trnsfornecedores f ON f.prefCodigo = n.prefCodigo AND f.forCodigo = n.notaFornecedor`,
      alias: "n",
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

router.get("/distribuicoes", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const status = req.query.status;
    const where = [];
    const params = {};

    if (status) {
      where.push("d.distStatus = :status");
      params.status = status;
    }
    if (q) {
      where.push("(lo.locDescricao LIKE :q OR ld.locDescricao LIKE :q OR CAST(d.distCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }

    const sort = parseSort(
      req,
      {
        distCodigo: "d.distCodigo",
        distDataEnvio: "d.distDataEnvio",
        distRemCodigo: "d.distRemCodigo",
        distPeriodo: "d.distPeriodo",
        distDataRecepcao: "d.distDataRecepcao",
        distRecebedor: "d.distRecebedor",
        distReceber: "d.distReceber",
        distLocalOrigemNome: "lo.locDescricao",
        distLocalDestinoNome: "ld.locDescricao",
        distStatus: "d.distStatus",
      },
      "d.distDataEnvio"
    );

    const result = await paginatedList(pool, {
      select: `d.distCodigo, d.distRemCodigo, d.distPeriodo, d.distDataEnvio, d.distDataRecepcao,
               d.distRecebedor, d.distReceber, d.distLocalOrigem, d.distLocalDestino, d.distStatus,
               d.distObservacao, lo.locDescricao AS distLocalOrigemNome, ld.locDescricao AS distLocalDestinoNome`,
      from: `FROM trnsdistribuicao d
             LEFT JOIN trnslocal lo ON lo.prefCodigo = d.prefCodigo AND lo.locCodigo = d.distLocalOrigem
             LEFT JOIN trnslocal ld ON ld.prefCodigo = d.prefCodigo AND ld.locCodigo = d.distLocalDestino`,
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

router.get("/romaneios", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const where = [];
    const params = {};

    if (q) {
      where.push("(f.forNome LIKE :q OR CAST(r.romanCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }

    const sort = parseSort(
      req,
      {
        romanCodigo: "r.romanCodigo",
        romanData: "r.romanData",
        forNome: "f.forNome",
        romanLocal: "r.romanLocal",
        notaNumero: "n.notaNumero",
      },
      "r.romanData"
    );

    const result = await paginatedList(pool, {
      select: `r.romanCodigo, r.romanData, r.forCodigo, r.romanLocal, r.notaCodigo,
               f.forNome, n.notaNumero, n.notaSerie`,
      from: `FROM Romaneio r
             LEFT JOIN trnsfornecedores f ON f.prefCodigo = r.prefCodigo AND f.forCodigo = r.forCodigo
             LEFT JOIN trnsnota n ON n.prefCodigo = r.prefCodigo AND n.notaCodigo = r.notaCodigo`,
      alias: "r",
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

router.get("/cronograma", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });

    const q = (req.query.q || "").trim();
    const status = req.query.status;
    const where = [];
    const params = {};

    if (status) {
      where.push("c.croStatus = :status");
      params.status = status;
    }
    if (q) {
      where.push("(f.forNome LIKE :q OR p.prodDescricao LIKE :q OR CAST(c.croCodigo AS CHAR) LIKE :q)");
      params.q = `%${q}%`;
    }

    const sort = parseSort(
      req,
      {
        croCodigo: "c.croCodigo",
        forNome: "f.forNome",
        prodDescricao: "p.prodDescricao",
        croTotal: "croTotal",
        croDtInicial: "c.croDtInicial",
        croDtFinal: "c.croDtFinal",
        croTipoRemessa: "c.croTipoRemessa",
        croRemessa: "c.croRemessa",
        croStatus: "c.croStatus",
      },
      "c.croDtInicial"
    );

    const result = await paginatedList(pool, {
      select: `c.croCodigo, c.forCodigo, c.prodCodigo, c.croDtInicial, c.croDtFinal,
               c.croNumeroNota, c.croStatus, c.croRemessa, c.croTipoRemessa,
               f.forNome, p.prodDescricao, t.disTipDescricao AS croTipoRemessaDesc,
               (SELECT COALESCE(SUM(cl.croLocQtde), 0) FROM trnscronogramalocal cl
                WHERE cl.prefCodigo = c.prefCodigo AND cl.croCodigo = c.croCodigo) AS croTotal`,
      from: `FROM trnscronograma c
             LEFT JOIN trnsfornecedores f ON f.prefCodigo = c.prefCodigo AND f.forCodigo = c.forCodigo
             LEFT JOIN trnsprodutos p ON p.prefCodigo = c.prefCodigo AND p.prodCodigo = c.prodCodigo
             LEFT JOIN trnsdistribuicaotipo t ON t.prefCodigo = c.prefCodigo AND t.disTipNumero = c.croTipoRemessa`,
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

router.get("/fornecedores/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadFornecedor(prefCodigo, Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/fornecedores", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createFornecedor(prefCodigo, req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.put("/fornecedores/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateFornecedor(prefCodigo, Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.get("/tipos-distribuicao/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadTipoDistribuicao(prefCodigo, Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/tipos-distribuicao", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createTipoDistribuicao(prefCodigo, req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.put("/tipos-distribuicao/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateTipoDistribuicao(prefCodigo, Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.get("/rotas/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadRota(prefCodigo, Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/rotas", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createRota(prefCodigo, req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.put("/rotas/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateRota(prefCodigo, Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.get("/compras/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadNota(prefCodigo, Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/compras", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createNota(prefCodigo, req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.put("/compras/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateNota(prefCodigo, Number(req.params.id), req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.get("/compras/:id/itens", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    const result = await listNotaItens(prefCodigo, Number(req.params.id), {
      page: req.query.page,
      limit: req.query.limit,
      q: req.query.q,
    });
    if (Array.isArray(result)) {
      res.json({ data: result });
    } else {
      res.json(result);
    }
  } catch (err) {
    next(err);
  }
});

router.post("/compras/:id/itens", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await upsertNotaItem(prefCodigo, Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.put("/compras/:id/itens/:prodId", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await upsertNotaItem(prefCodigo, Number(req.params.id), {
      ...(req.body || {}),
      notaItemProduto: Number(req.params.prodId),
    }));
  } catch (err) {
    next(err);
  }
});

router.delete("/compras/:id/itens/:prodId", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await deleteNotaItem(prefCodigo, Number(req.params.id), Number(req.params.prodId)));
  } catch (err) {
    next(err);
  }
});

router.post("/compras/:id/cancelar", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    sendCrudResult(res, await cancelNota(prefCodigo, Number(req.params.id), req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.get("/compras/:id/impressao", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    const notaCodigo = Number(req.params.id);
    const data = await loadNota(prefCodigo, notaCodigo);
    if (!data) return res.status(404).json({ error: "Nota não encontrada" });
    if (data.notaStatus === "C") return res.status(400).json({ error: "Nota cancelada" });
    const html = await renderNotaCompraPrintHtml(prefCodigo, notaCodigo);
    if (!html) return res.status(404).json({ error: "Nota não encontrada" });
    res.type("html").send(html);
  } catch (err) {
    next(err);
  }
});

router.get("/distribuicao-produtos", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await listDistribuicaoProdutosQuery(prefCodigo, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/distribuicoes/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadDistribuicao(prefCodigo, Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.put("/distribuicoes/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateDistribuicao(prefCodigo, Number(req.params.id), req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.get("/distribuicoes/:id/itens", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    const result = await listDistribuicaoItens(prefCodigo, Number(req.params.id), {
      page: req.query.page,
      limit: req.query.limit,
      q: req.query.q,
    });
    if (Array.isArray(result)) {
      res.json({ data: result });
    } else {
      res.json(result);
    }
  } catch (err) {
    next(err);
  }
});

router.post("/distribuicoes/:id/itens", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await upsertDistribuicaoItem(prefCodigo, Number(req.params.id), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.put("/distribuicoes/:id/itens/:prodId", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await upsertDistribuicaoItem(prefCodigo, Number(req.params.id), {
      ...(req.body || {}),
      distItemProduto: Number(req.params.prodId),
    }));
  } catch (err) {
    next(err);
  }
});

router.delete("/distribuicoes/:id/itens/:prodId", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await deleteDistribuicaoItem(prefCodigo, Number(req.params.id), Number(req.params.prodId)));
  } catch (err) {
    next(err);
  }
});

router.post("/distribuicoes/:id/cancelar", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    sendCrudResult(res, await cancelDistribuicao(prefCodigo, Number(req.params.id), req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.get("/distribuicoes/:id/impressao", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    const distCodigo = Number(req.params.id);
    const guia = await loadDistribuicao(prefCodigo, distCodigo);
    if (!guia) return res.status(404).json({ error: "Guia não encontrada" });
    if (guia.distStatus === "C") return res.status(400).json({ error: "Guia cancelada" });
    const duasVias = req.query.via === "2";
    const html = await renderGuiaDistribuicaoPrintHtml(prefCodigo, distCodigo, { duasVias });
    if (!html) return res.status(404).json({ error: "Guia não encontrada" });
    res.type("html").send(html);
  } catch (err) {
    next(err);
  }
});

router.get("/romaneios/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadRomaneio(prefCodigo, Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/romaneios", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createRomaneio(prefCodigo, req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.put("/romaneios/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateRomaneio(prefCodigo, Number(req.params.id), req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.get("/romaneios/:id/itens", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await listRomaneioItens(prefCodigo, Number(req.params.id), {
      page: req.query.page,
      limit: req.query.limit,
      q: req.query.q,
    });
    if (Array.isArray(result)) return res.json({ data: result });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/romaneios/:id/itens", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await upsertRomaneioItem(prefCodigo, Number(req.params.id), req.body || {}, req);
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.json({ message: "Item salvo." });
  } catch (err) {
    next(err);
  }
});

router.put("/romaneios/:id/itens/:prodId", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await upsertRomaneioItem(prefCodigo, Number(req.params.id), {
      ...(req.body || {}),
      prodCodigo: Number(req.params.prodId),
    }, req);
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.json({ message: "Item atualizado." });
  } catch (err) {
    next(err);
  }
});

router.delete("/romaneios/:id/itens/:prodId", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await deleteRomaneioItem(prefCodigo, Number(req.params.id), req.params.prodId, req);
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.json({ message: "Item excluído." });
  } catch (err) {
    next(err);
  }
});

router.get("/cronograma/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadCronograma(prefCodigo, Number(req.params.id));
    if (!row) return res.status(404).json({ error: "Registro não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/cronograma", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createCronograma(prefCodigo, req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.put("/cronograma/:id", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateCronograma(prefCodigo, Number(req.params.id), req.body || {}, req));
  } catch (err) {
    next(err);
  }
});

router.post("/cronograma/:id/duplicar", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await duplicateCronograma(prefCodigo, Number(req.params.id), req);
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/cronograma/:id/locais", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await listCronogramaLocais(prefCodigo, Number(req.params.id), {
      page: req.query.page,
      limit: req.query.limit,
      q: req.query.q,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/cronograma/:id/locais", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await upsertCronogramaLocal(prefCodigo, Number(req.params.id), req.body || {});
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.json({ message: "Grade salva." });
  } catch (err) {
    next(err);
  }
});

router.put("/cronograma/:id/locais/:locId/:dia/:seq?", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await upsertCronogramaLocal(prefCodigo, Number(req.params.id), {
      ...(req.body || {}),
      croLocCodigo: Number(req.params.locId),
      croDia: req.params.dia,
      croLocSeq: req.params.seq ?? req.body?.croLocSeq,
    });
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.json({ message: "Grade atualizada." });
  } catch (err) {
    next(err);
  }
});

router.delete("/cronograma/:id/locais/:locId/:dia/:seq?", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await deleteCronogramaLocal(
      prefCodigo,
      Number(req.params.id),
      req.params.locId,
      req.params.dia,
      req.params.seq ?? 0
    );
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.json({ message: "Unidade excluída." });
  } catch (err) {
    next(err);
  }
});

router.get("/cronograma/:id/impressao", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const cro = await loadCronograma(prefCodigo, Number(req.params.id));
    if (!cro) return res.status(404).json({ error: "Cronograma não encontrado" });
    const tipo = req.query.tipo || "normal";
    const locais = await listCronogramaLocais(prefCodigo, Number(req.params.id), { limit: 500 });
    const rows = (locais.data ?? [])
      .map(
        (l) =>
          `<tr><td>${l.locDescricao ?? l.croLocCodigo}</td><td>${l.croDiaLabel ?? l.croDia}</td><td>${l.croHora ? fmtDateTimeBr(l.croHora) : ""}</td><td class="r">${Number(l.croLocQtde ?? 0).toLocaleString("pt-BR")}</td><td>${l.rotaDescricao ?? ""}</td></tr>`
      )
      .join("");
    const titulo =
      tipo === "2via"
        ? "Cronograma (2 guias em uma folha)"
        : tipo === "diario"
          ? "Cronograma — Dia / Horário"
          : "Cronograma de Entrega";
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>${titulo}</title>
<style>
@page { size: A4 portrait; margin: 12mm; orientation: portrait; }
body { font-family: Arial, sans-serif; font-size: 10pt; }
h1 { font-size: 14pt; text-align: center; }
.meta { margin: 12px 0; line-height: 1.5; }
table { width: 100%; border-collapse: collapse; }
th, td { border: 1px solid #000; padding: 4px 6px; }
th { background: #eee; }
.r { text-align: right; }
</style></head><body>
<h1>${titulo}</h1>
<div class="meta">
<strong>Código:</strong> ${cro.croCodigo} · <strong>Fornecedor:</strong> ${cro.forNome ?? cro.forCodigo}<br/>
<strong>Produto:</strong> ${cro.prodDescricao ?? cro.prodCodigo} · <strong>Período:</strong> ${fmtDateTimeBr(cro.croDtInicial)} a ${fmtDateTimeBr(cro.croDtFinal)}<br/>
<strong>Tipo remessa:</strong> ${cro.croTipoRemessaDesc ?? cro.croTipoRemessa ?? "—"} · <strong>Total:</strong> ${Number(cro.croTotal ?? 0).toLocaleString("pt-BR")}<br/>
<strong>Emitido em:</strong> ${fmtDateTimeBr(new Date())}
</div>
<table><thead><tr><th>Unidade</th><th>Dia</th><th>Horário</th><th>Quantidade</th><th>Rota</th></tr></thead>
<tbody>${rows || "<tr><td colspan='5'>Nenhuma unidade</td></tr>"}</tbody></table>
<script>window.onload=()=>window.print()</script></body></html>`;
    res.type("html").send(html);
  } catch (err) {
    next(err);
  }
});

router.post("/wizards/remessa", async (req, res) => {
  const err = requireFields(req.body || {}, [
    { key: "distLocalOrigem", label: "Local de origem" },
    { key: "distCodigoTipoRemessa", label: "Tipo de remessa" },
    { key: "distDataEnvio", label: "Data de envio" },
  ]);
  if (err) return res.status(400).json(err);
  res.json({ message: "Solicitação registrada." });
});

router.post("/wizards/rancho-planilha", async (req, res) => {
  const err = requireFields(req.body || {}, [{ key: "arquivo", label: "Arquivo da planilha" }]);
  if (err) return res.status(400).json(err);
  res.json({ message: "Solicitação registrada." });
});

const ranchoSessions = new Map();
const ranchoFixoSessions = new Map();

router.get("/wizards/rancho-planilha/session", async (req, res) => {
  const key = req.user?.UserGUID || req.user?.usuGUID || "anon";
  res.json({ data: ranchoSessions.get(key) || null });
});

router.put("/wizards/rancho-planilha/session", async (req, res) => {
  const key = req.user?.UserGUID || req.user?.usuGUID || "anon";
  ranchoSessions.set(key, req.body || {});
  res.json({ message: "Sessão salva." });
});

router.get("/wizards/rancho-planilha/alimentos", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigo(req);
    const data = await loadRanchoWizardAlimentos(prefCodigo, {
      dataInicial: req.query.dataInicial,
      dataFinal: req.query.dataFinal,
      prodCodigoTipoRemessa: req.query.prodCodigoTipoRemessa,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/wizards/rancho-planilha/locais", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigo(req);
    const rotaCodigos = String(req.query.rotas || "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter(Boolean);
    const data = await loadRanchoWizardLocais(prefCodigo, { rotaCodigos });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/wizards/rancho-fixo/session", async (req, res) => {
  const key = req.user?.UserGUID || req.user?.usuGUID || "anon";
  res.json({ data: ranchoFixoSessions.get(key) || null });
});

router.put("/wizards/rancho-fixo/session", async (req, res) => {
  const key = req.user?.UserGUID || req.user?.usuGUID || "anon";
  ranchoFixoSessions.set(key, req.body || {});
  res.json({ message: "Sessão salva." });
});

router.get("/wizards/rancho-fixo/guias", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigo(req);
    const locCodigos = String(req.query.locCodigos || "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter(Boolean);
    const prodCodigos = String(req.query.prodCodigos || "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter(Boolean);
    const data = await loadRanchoFixoGuiasPreview(prefCodigo, locCodigos, prodCodigos);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/wizards/rancho-fixo/guias", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigo(req);
    const body = req.body || {};
    const locCodigos = Array.isArray(body.locCodigos)
      ? body.locCodigos.map(Number).filter(Boolean)
      : String(body.locCodigos || "")
          .split(",")
          .map((s) => Number(s.trim()))
          .filter(Boolean);
    const prodCodigos = Array.isArray(body.prodCodigos)
      ? body.prodCodigos.map(Number).filter(Boolean)
      : String(body.prodCodigos || "")
          .split(",")
          .map((s) => Number(s.trim()))
          .filter(Boolean);
    const data = await loadRanchoFixoGuiasPreview(prefCodigo, locCodigos, prodCodigos);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/wizards/rancho-fixo/finalizar", async (req, res) => {
  const key = req.user?.UserGUID || req.user?.usuGUID || "anon";
  ranchoFixoSessions.set(key, req.body || {});
  res.json({ message: "Rancho fixo processado com sucesso! (WizardRanchoFixoGravaDados)" });
});

router.get("/ajuste-percapta", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigo(req);
    const result = await listAjustePerCaptas(prefCodigo, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.put("/ajuste-percapta", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigo(req);
    const result = await saveAjustePerCaptaRow(prefCodigo, req.body || {});
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.json({ message: "Percapta gravada." });
  } catch (err) {
    next(err);
  }
});

router.post("/wizards/rancho-planilha/finalizar", async (req, res) => {
  const key = req.user?.UserGUID || req.user?.usuGUID || "anon";
  ranchoSessions.set(key, req.body || {});
  res.json({ message: "Rancho processado com sucesso! (RanchoWizardPlanilhaGravaDados)" });
});

router.post("/wizards/rancho-fixo", async (req, res) => {
  const err = requireFields(req.body || {}, [
    { key: "mes", label: "Mês" },
    { key: "ano", label: "Ano" },
  ]);
  if (err) return res.status(400).json(err);
  res.json({ message: "Solicitação registrada." });
});

router.post("/cancelar-remessa", async (req, res) => {
  const err = requireFields(req.body || {}, [{ key: "distCodigo", label: "Código da distribuição" }]);
  if (err) return res.status(400).json(err);
  res.json({ message: "Solicitação registrada." });
});

router.post("/largada", async (req, res) => {
  const err = requireFields(req.body || {}, [
    { key: "rotaCodigo", label: "Rota" },
    { key: "distDataEnvio", label: "Data de envio" },
  ]);
  if (err) return res.status(400).json(err);
  res.json({ message: "Solicitação registrada." });
});

router.post("/ajuste-percapta", async (req, res) => {
  const err = requireFields(req.body || {}, [
    { key: "prodCodigo", label: "Produto" },
    { key: "locCodigo", label: "Local" },
  ]);
  if (err) return res.status(400).json(err);
  res.json({ message: "Solicitação registrada." });
});

export default router;
