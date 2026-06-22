import { Router } from "express";
import { requireAuth, resolvePrefCodigo } from "../middleware/auth.js";
import {
  gerarRelatorioComprasPdf,
  gerarRelatorioDistribuicaoRotaPdf,
  gerarRelatorioDistribuicaoUePdf,
  gerarRelatorioEntradasSaidasUePdf,
  gerarRelatorioSaldoPdf,
} from "../services/relatorioService.js";

const router = Router();
router.use(requireAuth);

function getPrefCodigo(req) {
  const pref = resolvePrefCodigo(req);
  return pref !== undefined && pref !== null ? Number(pref) : null;
}

async function sendPdf(res, buffer, filename) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.send(buffer);
}

function handleRelatorioError(err, res) {
  console.error("[relatorios]", err);
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  const detail = err.message || String(err);
  const friendly =
    detail.includes("Selecione") || detail.includes("obrigat")
      ? detail
      : "Não foi possível gerar o relatório. Verifique os filtros informados e tente novamente.";
  return res.status(500).json({
    error: friendly,
    detail: process.env.NODE_ENV === "development" ? detail : undefined,
  });
}

router.post("/compras/pdf", async (req, res) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const pdf = await gerarRelatorioComprasPdf(prefCodigo, req.body || {});
    await sendPdf(res, pdf, "relatorio-compras.pdf");
  } catch (err) {
    handleRelatorioError(err, res);
  }
});

router.post("/distribuicao-ue/pdf", async (req, res) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const pdf = await gerarRelatorioDistribuicaoUePdf(prefCodigo, req.body || {});
    await sendPdf(res, pdf, "relatorio-distribuicao-ue.pdf");
  } catch (err) {
    handleRelatorioError(err, res);
  }
});

router.post("/distribuicao-rota/pdf", async (req, res) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const pdf = await gerarRelatorioDistribuicaoRotaPdf(prefCodigo, req.body || {});
    await sendPdf(res, pdf, "relatorio-distribuicao-rota.pdf");
  } catch (err) {
    handleRelatorioError(err, res);
  }
});

router.post("/entradas-saidas-ue/pdf", async (req, res) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const pdf = await gerarRelatorioEntradasSaidasUePdf(prefCodigo, req.body || {});
    await sendPdf(res, pdf, "relatorio-entradas-saidas-ue.pdf");
  } catch (err) {
    handleRelatorioError(err, res);
  }
});

router.post("/saldo/pdf", async (req, res) => {
  try {
    const prefCodigo = getPrefCodigo(req);
    if (!prefCodigo) return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    const pdf = await gerarRelatorioSaldoPdf(prefCodigo, req.body || {});
    await sendPdf(res, pdf, "relatorio-saldo.pdf");
  } catch (err) {
    handleRelatorioError(err, res);
  }
});

export default router;
