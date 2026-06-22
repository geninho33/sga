import jwt from "jsonwebtoken";
import { pool, gamPool } from "../db.js";
import { config } from "../config.js";
import { ensureAuthTables } from "./authSchema.js";
import { verifyGamPassword } from "./gamPassword.js";
import {
  isBcryptHash,
  verifyBcryptPassword,
  verifyEncrypt64Password,
} from "./legacyPassword.js";

const USER_SELECT = `
  SELECT
    u.prefCodigo,
    u.usuCodigo,
    u.usuUsuario,
    u.usuNome,
    u.usuEmail,
    u.usuStatus,
    u.usuSenha,
    TRIM(u.usuGUID) AS usuGUID,
    p.prefNome,
    p.PrefMunicipio
  FROM trnsusuarios u
  INNER JOIN trnsprefeituras p ON p.prefCodigo = u.prefCodigo
  WHERE LOWER(TRIM(u.usuUsuario)) = LOWER(TRIM(:usuario))
    AND u.usuStatus = 'A'
  ORDER BY u.usuCodigo
`;

export async function findUsersByLogin(usuario) {
  const [rows] = await pool.query(USER_SELECT, { usuario });
  return rows;
}

async function loadGamUser(userGuid) {
  if (!userGuid) return null;
  const [rows] = await gamPool.query(
    `SELECT UserGUID, UserName, UserPwd, UserPwdEncryption, UserIsAct, UserIsBlk, UserIsDlt
     FROM user
     WHERE UserGUID = :userGuid
       AND UserIsDlt = 0
     LIMIT 1`,
    { userGuid }
  );
  return rows[0] ?? null;
}

async function loadAppPassword(prefCodigo, usuCodigo) {
  const [rows] = await pool.query(
    `SELECT senha_hash
     FROM sga_usuario_senha
     WHERE prefCodigo = :prefCodigo AND usuCodigo = :usuCodigo
     LIMIT 1`,
    { prefCodigo, usuCodigo }
  );
  return rows[0]?.senha_hash ?? null;
}

async function verifyPasswordForUser(user, password) {
  await ensureAuthTables();

  const appHash = await loadAppPassword(user.prefCodigo, user.usuCodigo);
  if (appHash && isBcryptHash(appHash)) {
    if (await verifyBcryptPassword(password, appHash)) return true;
  }

  const usuSenha = user.usuSenha?.trim() || "";

  if (isBcryptHash(usuSenha)) {
    if (await verifyBcryptPassword(password, usuSenha)) return true;
  }

  if (user.usuGUID) {
    const gamUser = await loadGamUser(user.usuGUID);
    if (
      gamUser &&
      gamUser.UserIsAct === 1 &&
      gamUser.UserIsBlk === 0 &&
      gamUser.UserPwdEncryption === "sh5" &&
      gamUser.UserPwd
    ) {
      if (
        verifyGamPassword(
          password,
          gamUser.UserPwd,
          gamUser.UserGUID,
          config.gamPasswordIterations
        )
      ) {
        return true;
      }
    }
  }

  if (usuSenha && !isBcryptHash(usuSenha) && config.gxEncryptKey) {
    if (verifyEncrypt64Password(password, usuSenha)) return true;
  }

  if (config.authAllowPlain && usuSenha && usuSenha === password) {
    return true;
  }

  return false;
}

export async function login(usuario, senha) {
  const login = String(usuario || "").trim();
  const password = String(senha || "");

  if (!login || !password) {
    const err = new Error("Informe usuário e senha");
    err.status = 400;
    throw err;
  }

  const candidates = await findUsersByLogin(login);
  if (!candidates.length) {
    const err = new Error("Usuário ou senha inválidos");
    err.status = 401;
    throw err;
  }

  let matched = null;
  for (const user of candidates) {
    if (await verifyPasswordForUser(user, password)) {
      matched = user;
      break;
    }
  }

  if (!matched) {
    const err = new Error("Usuário ou senha inválidos");
    err.status = 401;
    throw err;
  }

  await pool.query(
    `UPDATE trnsusuarios
     SET usuDataAcesso = NOW()
     WHERE prefCodigo = :prefCodigo AND usuCodigo = :usuCodigo`,
    { prefCodigo: matched.prefCodigo, usuCodigo: matched.usuCodigo }
  );

  return buildSession(matched);
}

export function buildSession(user) {
  const payload = {
    prefCodigo: user.prefCodigo,
    usuCodigo: user.usuCodigo,
    usuUsuario: user.usuUsuario?.trim(),
    usuNome: user.usuNome?.trim(),
    usuEmail: user.usuEmail?.trim() || null,
    usuGUID: user.usuGUID?.trim() || null,
    prefNome: user.prefNome?.trim(),
    prefMunicipio: user.PrefMunicipio?.trim(),
  };

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return { token, user: payload };
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function getUserFromTokenClaims(claims) {
  const [rows] = await pool.query(
    `SELECT
       u.prefCodigo,
       u.usuCodigo,
       u.usuUsuario,
       u.usuNome,
       u.usuEmail,
       u.usuStatus,
       TRIM(u.usuGUID) AS usuGUID,
       p.prefNome,
       p.PrefMunicipio
     FROM trnsusuarios u
     INNER JOIN trnsprefeituras p ON p.prefCodigo = u.prefCodigo
     WHERE u.prefCodigo = :prefCodigo
       AND u.usuCodigo = :usuCodigo
       AND u.usuStatus = 'A'
     LIMIT 1`,
    { prefCodigo: claims.prefCodigo, usuCodigo: claims.usuCodigo }
  );
  return rows[0] ?? null;
}
