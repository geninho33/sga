import { Router } from "express";
import { requireAuth, resolvePrefCodigo } from "../middleware/auth.js";
import { loadDashboardStats } from "../services/dashboardStats.js";

const router = Router();
router.use(requireAuth);

router.get("/stats", async (req, res, next) => {
  try {
    const prefCodigo = resolvePrefCodigo(req);
    if (!prefCodigo) {
      return res.status(401).json({ error: "Prefeitura não identificada na sessão" });
    }

    const stats = await loadDashboardStats(prefCodigo);
    res.json({
      data: stats,
      meta: {
        prefCodigo,
        prefNome: req.user?.prefNome ?? null,
        prefMunicipio: req.user?.prefMunicipio ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
