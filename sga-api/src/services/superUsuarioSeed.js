import crypto from "crypto";
import { gamPool } from "../db.js";
import {
  GAM_REP_ID,
  SUPER_USUARIO_ROLE_NAME,
  getAllMenuIds,
  getUserRoleIds,
  setRoleMenuIds,
  setUserRoleIds,
} from "./menuPermissions.js";

const GAM_REP_IDS = [1, GAM_REP_ID];

async function findRoleIdByName(roleName, repId = GAM_REP_ID) {
  const [rows] = await gamPool.query(
    `SELECT RoleId FROM role WHERE RoleName = :roleName AND RepId = :repId LIMIT 1`,
    { roleName, repId }
  );
  return rows[0]?.RoleId ? Number(rows[0].RoleId) : null;
}

async function nextRoleId(repId = GAM_REP_ID) {
  const [rows] = await gamPool.query(
    `SELECT COALESCE(MAX(RoleId), 0) + 1 AS n FROM role WHERE RepId = :repId`,
    { repId }
  );
  return Number(rows[0].n);
}

async function ensureGamRole(roleName, description) {
  let roleId = await findRoleIdByName(roleName);
  if (roleId) return roleId;

  roleId = await nextRoleId(GAM_REP_ID);
  for (const repId of GAM_REP_IDS) {
    const exists = await findRoleIdByName(roleName, repId);
    if (exists) continue;
    await gamPool.query(
      `INSERT INTO role (RepId, RoleId, RoleExtId, RoleGUID, RoleName, RoleDsc, RoleCreDate, RoleCreUser)
       VALUES (:repId, :roleId, '', :roleGuid, :roleName, :roleDsc, NOW(), 'seed')`,
      {
        repId,
        roleId,
        roleGuid: crypto.randomUUID(),
        roleName,
        roleDsc: description,
      }
    );
  }
  return roleId;
}

async function findGamUserGuid(login) {
  const [rows] = await gamPool.query(
    `SELECT TRIM(UserGUID) AS UserGUID, UserName
     FROM user
     WHERE LOWER(TRIM(UserName)) = LOWER(TRIM(:login)) AND UserIsDlt = 0
     LIMIT 1`,
    { login }
  );
  return rows[0] ?? null;
}

/**
 * Cria (ou atualiza) o perfil super_usuario com todos os menus e vincula ao login informado.
 * Idempotente — pode rodar várias vezes com segurança.
 */
export async function ensureSuperUsuarioProfile(options = {}) {
  const login = String(options.login || "admin").trim();
  const roleName = SUPER_USUARIO_ROLE_NAME;
  const menuIds = getAllMenuIds();

  const roleId = await ensureGamRole(roleName, "Acesso total ao sistema");
  await setRoleMenuIds(roleId, menuIds);

  const gamUser = await findGamUserGuid(login);
  if (!gamUser) {
    return { error: `Usuário GAM "${login}" não encontrado.` };
  }

  const currentRoleIds = await getUserRoleIds(gamUser.UserGUID);
  const roleIds = [...new Set([...currentRoleIds, roleId])];
  await setUserRoleIds(gamUser.UserGUID, roleIds, "seed");

  return {
    roleId,
    roleName,
    userGuid: gamUser.UserGUID,
    login: gamUser.UserName?.trim() || login,
    menuCount: menuIds.length,
    roleIds,
  };
}
