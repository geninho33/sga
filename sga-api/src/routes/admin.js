import { Router } from "express";
import { gamPool, pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createGamUserEntry,
  createPrefeitura,
  listCargosLookup,
  listPrefeiturasLookup,
  loadGamUserEntry,
  loadPrefeitura,
  loadPrefeituraLogo,
  updateGamUserEntry,
  updatePrefeitura,
} from "../services/adminEntities.js";
import { paginatedList } from "../services/listQuery.js";
import {
  createGamRole,
  loadGamRole,
  sendCrudResult,
  updateGamRole,
} from "../services/preparacaoEntities.js";
import {
  getMenuCatalog,
  getRoleMenuIds,
  getUserRoleIds,
  setRoleMenuIds,
  setUserRoleIds,
} from "../services/menuPermissions.js";

const router = Router();
router.use(requireAuth);

function parsePageLimit(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

/** GAMWWUsers — listagem de usuários GAM. */
router.get("/gam/users", async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePageLimit(req);
    const q = (req.query.q || "").trim();
    const status = req.query.status;

    const where = ["u.UserIsDlt = 0"];
    const params = { limit, offset };

    if (status === "A") {
      where.push("u.UserIsAct = 1 AND u.UserIsBlk = 0");
    } else if (status === "I") {
      where.push("(u.UserIsAct = 0 OR u.UserIsBlk = 1)");
    }

    if (q) {
      where.push(
        "(u.UserName LIKE :q OR u.UserEMail LIKE :q OR u.UserFirstName LIKE :q OR u.UserLastName LIKE :q)"
      );
      params.q = `%${q}%`;
    }

    const whereSql = where.join(" AND ");
    const sortCol = {
      UserName: "u.UserName",
      UserEMail: "u.UserEMail",
      UserFirstName: "u.UserFirstName",
      UserLastName: "u.UserLastName",
      AuthenticationTypeName: "u.UserAutTypeName",
      Status: "Status",
    };
    const orderKey = sortCol[req.query.orderBy] ? req.query.orderBy : "UserName";
    const orderBy = sortCol[orderKey];
    const orderDir = String(req.query.orderDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

    const [countRows] = await gamPool.query(
      `SELECT COUNT(*) AS total FROM user u WHERE ${whereSql}`,
      params
    );
    const total = Number(countRows[0].total);

    const [rows] = await gamPool.query(
      `SELECT TRIM(u.UserGUID) AS UserGUID, u.UserName, u.UserEMail, u.UserFirstName, u.UserLastName,
              u.UserAutTypeName AS AuthenticationTypeName,
              CASE WHEN u.UserIsAct = 1 AND u.UserIsBlk = 0 THEN 'A' ELSE 'I' END AS Status
       FROM user u
       WHERE ${whereSql}
       ORDER BY ${orderBy} ${orderDir}
       LIMIT :limit OFFSET :offset`,
      params
    );

    res.json({
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        orderBy: orderKey,
        orderDir: orderDir === "DESC" ? "desc" : "asc",
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/gam/users/:userGuid", async (req, res, next) => {
  try {
    const row = await loadGamUserEntry(req.params.userGuid);
    if (!row) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/gam/users", async (req, res, next) => {
  try {
    sendCrudResult(res, await createGamUserEntry(req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.put("/gam/users/:userGuid", async (req, res, next) => {
  try {
    sendCrudResult(res, await updateGamUserEntry(req.params.userGuid, req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.get("/gam/referencias", async (req, res, next) => {
  try {
    const [prefeituras, cargos] = await Promise.all([listPrefeiturasLookup(), listCargosLookup()]);
    res.json({ data: { prefeituras, cargos } });
  } catch (err) {
    next(err);
  }
});

/** trnsprefeiturasWW — cadastro de prefeituras (sem filtro de sessão). */
router.get("/prefeituras", async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const status = req.query.status;
    const where = [];
    const params = {};

    if (status === "A" || status === "I") {
      where.push("p.prefStatus = :status");
      params.status = status;
    }
    if (q) {
      where.push(
        "(p.prefNome LIKE :q OR p.PrefMunicipio LIKE :q OR p.prefCNPJ LIKE :q OR CAST(p.prefCodigo AS CHAR) LIKE :q)"
      );
      params.q = `%${q}%`;
    }

    const sortMap = {
      prefCodigo: "p.prefCodigo",
      prefNome: "p.prefNome",
      prefCNPJ: "p.prefCNPJ",
      PrefMunicipio: "p.PrefMunicipio",
      prefEstado: "p.prefEstado",
      prefTelefone: "p.prefTelefone",
      prefContato: "p.prefContato",
      prefStatus: "p.prefStatus",
    };
    const orderKey = sortMap[req.query.orderBy] ? req.query.orderBy : "prefNome";
    const orderBy = sortMap[orderKey];
    const orderDir = String(req.query.orderDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

    const result = await paginatedList(pool, {
      select: `p.prefCodigo, p.prefNome, p.prefCNPJ, p.PrefMunicipio, p.prefEstado,
               p.prefTelefone, p.prefContato, p.prefStatus`,
      from: "FROM trnsprefeituras p",
      alias: "p",
      where,
      params,
      orderBy,
      orderDir,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/prefeituras/:prefCodigo/logo", async (req, res, next) => {
  try {
    const logo = await loadPrefeituraLogo(Number(req.params.prefCodigo));
    if (!logo) return res.status(404).json({ error: "Logomarca não encontrada" });
    res.setHeader("Content-Type", logo.mime);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(logo.buffer);
  } catch (err) {
    next(err);
  }
});

router.get("/prefeituras/:prefCodigo", async (req, res, next) => {
  try {
    const row = await loadPrefeitura(Number(req.params.prefCodigo));
    if (!row) return res.status(404).json({ error: "Prefeitura não encontrada" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/prefeituras", async (req, res, next) => {
  try {
    sendCrudResult(res, await createPrefeitura(req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.put("/prefeituras/:prefCodigo", async (req, res, next) => {
  try {
    sendCrudResult(res, await updatePrefeitura(Number(req.params.prefCodigo), req.body || {}));
  } catch (err) {
    next(err);
  }
});

/** GAMWWRoles — catálogo de perfis. */
router.get("/gam/roles", async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePageLimit(req);
    const q = (req.query.q || "").trim();

    const where = ["1=1"];
    const params = { limit, offset };

    if (q) {
      where.push("(r.RoleName LIKE :q OR r.RoleDsc LIKE :q)");
      params.q = `%${q}%`;
    }

    const whereSql = where.join(" AND ");
    const orderDir = String(req.query.orderDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";

    const [countRows] = await gamPool.query(
      `SELECT COUNT(*) AS total FROM role r WHERE ${whereSql}`,
      params
    );
    const total = Number(countRows[0].total);

    const [rows] = await gamPool.query(
      `SELECT r.RoleId, r.RoleName, r.RoleDsc, TRIM(r.RoleGUID) AS RoleGUID
       FROM role r
       WHERE ${whereSql}
       ORDER BY r.RoleName ${orderDir}
       LIMIT :limit OFFSET :offset`,
      params
    );

    res.json({
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        orderBy: "RoleName",
        orderDir: orderDir === "DESC" ? "desc" : "asc",
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/gam/roles/:roleId", async (req, res, next) => {
  try {
    const row = await loadGamRole(Number(req.params.roleId));
    if (!row) return res.status(404).json({ error: "Perfil não encontrado" });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/gam/roles", async (req, res, next) => {
  try {
    sendCrudResult(res, await createGamRole(req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.put("/gam/roles/:roleId", async (req, res, next) => {
  try {
    sendCrudResult(res, await updateGamRole(Number(req.params.roleId), req.body || {}));
  } catch (err) {
    next(err);
  }
});

router.get("/gam/menu-catalog", async (_req, res) => {
  res.json({ data: getMenuCatalog() });
});

router.get("/gam/roles/:roleId/menus", async (req, res, next) => {
  try {
    const roleId = Number(req.params.roleId);
    const role = await loadGamRole(roleId);
    if (!role) return res.status(404).json({ error: "Perfil não encontrado" });
    const menuIds = await getRoleMenuIds(roleId);
    res.json({ data: menuIds });
  } catch (err) {
    next(err);
  }
});

router.put("/gam/roles/:roleId/menus", async (req, res, next) => {
  try {
    const roleId = Number(req.params.roleId);
    const role = await loadGamRole(roleId);
    if (!role) return res.status(404).json({ error: "Perfil não encontrado" });
    const menuIds = await setRoleMenuIds(roleId, req.body?.menuIds || []);
    res.json({ data: menuIds, message: "Permissões atualizadas." });
  } catch (err) {
    next(err);
  }
});

router.get("/gam/users/:userGuid/roles", async (req, res, next) => {
  try {
    const roleIds = await getUserRoleIds(req.params.userGuid);
    res.json({ data: roleIds });
  } catch (err) {
    next(err);
  }
});

router.put("/gam/users/:userGuid/roles", async (req, res, next) => {
  try {
    const audit = req.user?.usuUsuario || req.user?.usuNome || "web";
    const roleIds = await setUserRoleIds(req.params.userGuid, req.body?.roleIds || [], audit);
    res.json({ data: roleIds, message: "Perfis do usuário atualizados." });
  } catch (err) {
    next(err);
  }
});

export default router;
