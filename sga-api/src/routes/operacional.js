import { Router } from "express";
import { requireAuth, resolvePrefCodigo } from "../middleware/auth.js";
import {
  listMapaEstoque,
  listQtdeFixaPorProduto,
  salvarMapaEstoqueQtdeFixa,
  salvarQtdeFixa,
} from "../services/operacionalService.js";
import { sendCrudResult } from "../services/preparacaoEntities.js";

const router = Router();
router.use(requireAuth);

function getPref(req) {
  return resolvePrefCodigo(req);
}

router.get("/mapa-estoque", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await listMapaEstoque(prefCodigo, req.query.locCodigo, {
      dataCorrente: req.query.dataCorrente,
      prodDescricao: req.query.prodDescricao,
    });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/mapa-estoque/salvar", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(
      res,
      await salvarMapaEstoqueQtdeFixa(prefCodigo, req.body?.items, req.user?.usuUsuario)
    );
  } catch (err) {
    next(err);
  }
});

router.get("/qtde-fixa", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const result = await listQtdeFixaPorProduto(prefCodigo, req.query.prodCodigo);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/qtde-fixa/salvar", async (req, res, next) => {
  try {
    const prefCodigo = getPref(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    sendCrudResult(
      res,
      await salvarQtdeFixa(prefCodigo, req.body?.prodCodigo, req.body?.items, req.user?.usuUsuario)
    );
  } catch (err) {
    next(err);
  }
});

export default router;
