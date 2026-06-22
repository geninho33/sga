import { Router } from "express";
import { getUserFromTokenClaims, login, verifyToken } from "../services/authService.js";
import { getUserAllowedMenuIds } from "../services/menuPermissions.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const { usuario, senha } = req.body || {};
    const session = await login(usuario, senha);
    if (session.user.usuGUID) {
      session.user.allowedMenuIds = await getUserAllowedMenuIds(session.user.usuGUID);
    } else {
      session.user.allowedMenuIds = null;
    }
    res.json(session);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    let claims;
    try {
      claims = verifyToken(match[1]);
    } catch {
      return res.status(401).json({ error: "Sessão expirada ou inválida" });
    }

    const user = await getUserFromTokenClaims(claims);
    if (!user) {
      return res.status(401).json({ error: "Usuário inativo ou não encontrado" });
    }

    const usuGUID = user.usuGUID?.trim() || null;
    const allowedMenuIds = usuGUID ? await getUserAllowedMenuIds(usuGUID) : null;

    res.json({
      user: {
        prefCodigo: user.prefCodigo,
        usuCodigo: user.usuCodigo,
        usuUsuario: user.usuUsuario?.trim(),
        usuNome: user.usuNome?.trim(),
        usuEmail: user.usuEmail?.trim() || null,
        usuGUID,
        prefNome: user.prefNome?.trim(),
        prefMunicipio: user.PrefMunicipio?.trim(),
        allowedMenuIds,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

export default router;
