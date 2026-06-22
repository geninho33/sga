import { getUserFromTokenClaims, verifyToken } from "../services/authService.js";

export async function requireAuth(req, res, next) {
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

    req.user = {
      prefCodigo: user.prefCodigo,
      usuCodigo: user.usuCodigo,
      usuUsuario: user.usuUsuario?.trim(),
      usuNome: user.usuNome?.trim(),
      usuEmail: user.usuEmail?.trim() || null,
      usuGUID: user.usuGUID?.trim() || null,
      prefNome: user.prefNome?.trim(),
      prefMunicipio: user.PrefMunicipio?.trim(),
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function resolvePrefCodigo(req) {
  return req.user?.prefCodigo;
}
