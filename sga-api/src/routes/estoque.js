import { Router } from "express";
import { requireAuth, resolvePrefCodigo } from "../middleware/auth.js";
import { listEstoqueMovimentacao } from "../services/estoqueMovimentacaoListService.js";
import {
  aplicarApuracao,
  buscarInventario,
  listAjustes,
  listMonitoramentoUe,
  listPosicaoEstoque,
  listSaldoEstoque,
  processarApuracao,
  salvarInventario,
} from "../services/estoqueService.js";
import {
  cancelAjuste,
  createAjuste,
  deleteAjusteItem,
  listAjusteItens,
  loadAjuste,
  updateAjuste,
  upsertAjusteItem,
} from "../services/estoqueAjusteService.js";
import { sendCrudResult } from "../services/preparacaoEntities.js";

const router = Router();
router.use(requireAuth);

function getPrefCodigo(req) {
  const pref = resolvePrefCodigo(req);
  return pref !== undefined && pref !== null ? Number(pref) : null;
}

router.get("/movimentacao", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    res.json(await listEstoqueMovimentacao(prefCodigo, req.query));
  } catch (err) {
    next(err);
  }
});

router.get("/posicao", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    res.json(await listPosicaoEstoque(prefCodigo, req.query));
  } catch (err) {
    next(err);
  }
});

router.get("/saldo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    res.json(await listSaldoEstoque(prefCodigo, req.query));
  } catch (err) {
    next(err);
  }
});

router.get("/ajustes", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    res.json(await listAjustes(prefCodigo, req.query));
  } catch (err) {
    next(err);
  }
});

router.get("/ajustes/:ajusCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const row = await loadAjuste(prefCodigo, Number(req.params.ajusCodigo));
    if (!row) return res.status(404).json({ error: "Ajuste não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/ajustes", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await createAjuste(prefCodigo, req.body || {}, req.user?.usuUsuario));
  } catch (err) {
    next(err);
  }
});

router.put("/ajustes/:ajusCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(res, await updateAjuste(prefCodigo, Number(req.params.ajusCodigo), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.post("/ajustes/:ajusCodigo/cancelar", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(
      res,
      await cancelAjuste(prefCodigo, Number(req.params.ajusCodigo), req.body?.motivo || "")
    );
  } catch (err) {
    next(err);
  }
});

router.get("/ajustes/:ajusCodigo/itens", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    res.json(await listAjusteItens(prefCodigo, Number(req.params.ajusCodigo), req.query));
  } catch (err) {
    next(err);
  }
});

router.post("/ajustes/:ajusCodigo/itens", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(
      res,
      await upsertAjusteItem(prefCodigo, Number(req.params.ajusCodigo), req.body || {}, req.user?.usuUsuario)
    );
  } catch (err) {
    next(err);
  }
});

router.put("/ajustes/:ajusCodigo/itens/:prodCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(
      res,
      await upsertAjusteItem(
        prefCodigo,
        Number(req.params.ajusCodigo),
        { ...req.body, prodCodigo: req.params.prodCodigo },
        req.user?.usuUsuario
      )
    );
  } catch (err) {
    next(err);
  }
});

router.delete("/ajustes/:ajusCodigo/itens/:prodCodigo", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(
      res,
      await deleteAjusteItem(prefCodigo, Number(req.params.ajusCodigo), req.params.prodCodigo)
    );
  } catch (err) {
    next(err);
  }
});

router.get("/inventario", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    res.json(await buscarInventario(prefCodigo, req.query));
  } catch (err) {
    next(err);
  }
});

router.post("/inventario/salvar", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(
      res,
      await salvarInventario(prefCodigo, req.body?.items || [], req.user?.usuUsuario)
    );
  } catch (err) {
    next(err);
  }
});

router.post("/apuracao/processar", async (req, res) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    res.json(await processarApuracao(prefCodigo, req.body || {}));
  } catch (err) {
    console.error("[apuracao/processar]", err);
    const detail = err.message || String(err);
    res.status(500).json({
      error: "Não foi possível processar a apuração. Verifique os filtros e tente novamente.",
      detail: process.env.NODE_ENV === "development" ? detail : undefined,
    });
  }
});

router.post("/apuracao/aplicar", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(
      res,
      await aplicarApuracao(prefCodigo, req.body?.items || [], req.user?.usuUsuario)
    );
  } catch (err) {
    next(err);
  }
});

router.get("/monitoramento-ue", async (req, res, next) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    res.json(await listMonitoramentoUe(prefCodigo, req.query));
  } catch (err) {
    next(err);
  }
});

export default router;
