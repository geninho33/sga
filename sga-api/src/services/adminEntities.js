import crypto from "crypto";
import { pool, gamPool } from "../db.js";
import { config } from "../config.js";
import { hashGamPassword } from "./gamPassword.js";

const PREFEITURA_COLUMNS = `
  prefCodigo, prefNome, prefCNPJ, prefEndereco, prefComplemento, prefBairro,
  PrefMunicipio, prefCodigoIbge, prefEstado, prefCep, prefTelefone, prefContato,
  prefNomeEmail, prefEmail, prefForma_gestao, prefTitular, prefMunCod,
  prefLocalDeposito, prefStatus, prefDataCad, prefDataAlt, prefLogo_GXI`;

function logoMimeFromGxi(gxi) {
  if (!gxi) return "image/jpeg";
  const ext = String(gxi).split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

async function applyPrefeituraLogo(prefCodigo, prefLogo) {
  if (prefLogo === undefined || prefLogo === null) return;
  if (prefLogo === "" || prefLogo === "__CLEAR__") {
    await pool.query(
      `UPDATE trnsprefeituras SET prefLogo = NULL, prefLogo_GXI = NULL WHERE prefCodigo = :prefCodigo`,
      { prefCodigo }
    );
    return;
  }
  const match = String(prefLogo).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return;
  const buffer = Buffer.from(match[2], "base64");
  const ext = match[1].includes("png") ? "png" : "jpg";
  await pool.query(
    `UPDATE trnsprefeituras SET prefLogo = :logo, prefLogo_GXI = :gxi WHERE prefCodigo = :prefCodigo`,
    { prefCodigo, logo: buffer, gxi: `webupload:${prefCodigo}_logo.${ext}` }
  );
}

export async function loadPrefeituraLogo(prefCodigo) {
  const [rows] = await pool.query(
    `SELECT prefLogo, prefLogo_GXI FROM trnsprefeituras WHERE prefCodigo = :prefCodigo`,
    { prefCodigo }
  );
  const row = rows[0];
  if (!row?.prefLogo?.length) return null;
  return { buffer: row.prefLogo, mime: logoMimeFromGxi(row.prefLogo_GXI) };
}

function formatDateYmd(value) {
  if (value == null || value === "") return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function toSqlDateOrNull(value) {
  const ymd = formatDateYmd(value);
  return ymd || null;
}


export async function nextPrefeituraCodigo() {
  const [rows] = await pool.query(`SELECT COALESCE(MAX(prefCodigo), 0) + 1 AS n FROM trnsprefeituras`);
  return Number(rows[0].n);
}

export async function loadPrefeitura(prefCodigo) {
  const [rows] = await pool.query(
    `SELECT ${PREFEITURA_COLUMNS}, LENGTH(prefLogo) AS prefLogoSize FROM trnsprefeituras WHERE prefCodigo = :prefCodigo`,
    { prefCodigo }
  );
  const row = rows[0];
  if (!row) return null;
  const { prefLogoSize, ...data } = row;
  return { ...data, hasLogo: Number(prefLogoSize) > 0 };
}

export async function createPrefeitura(body) {
  const prefNome = String(body.prefNome || "").trim();
  if (!prefNome) return { error: "Nome é obrigatório" };

  const prefCodigo = await nextPrefeituraCodigo();
  const prefStatus = body.prefStatus === "I" ? "I" : "A";

  await pool.query(
    `INSERT INTO trnsprefeituras (
       prefCodigo, prefNome, prefCNPJ, prefEndereco, prefComplemento, prefBairro,
       PrefMunicipio, prefCodigoIbge, prefEstado, prefCep, prefTelefone, prefContato,
       prefNomeEmail, prefEmail, prefForma_gestao, prefTitular, prefMunCod,
       prefLocalDeposito, prefStatus, prefDataCad, prefDataAlt
     ) VALUES (
       :prefCodigo, :prefNome, :prefCNPJ, :prefEndereco, :prefComplemento, :prefBairro,
       :PrefMunicipio, :prefCodigoIbge, :prefEstado, :prefCep, :prefTelefone, :prefContato,
       :prefNomeEmail, :prefEmail, :prefForma_gestao, :prefTitular, :prefMunCod,
       :prefLocalDeposito, :prefStatus, NOW(), NOW()
     )`,
    {
      prefCodigo,
      prefNome,
      prefCNPJ: body.prefCNPJ || "",
      prefEndereco: body.prefEndereco || "",
      prefComplemento: body.prefComplemento || "",
      prefBairro: body.prefBairro || "",
      PrefMunicipio: body.PrefMunicipio || "",
      prefCodigoIbge: body.prefCodigoIbge || "",
      prefEstado: body.prefEstado || "",
      prefCep: body.prefCep || "",
      prefTelefone: body.prefTelefone || "",
      prefContato: body.prefContato || "",
      prefNomeEmail: body.prefNomeEmail || "",
      prefEmail: body.prefEmail || "",
      prefForma_gestao: body.prefForma_gestao || "",
      prefTitular: body.prefTitular || "",
      prefMunCod: Number(body.prefMunCod) || 0,
      prefLocalDeposito: Number(body.prefLocalDeposito) || 0,
      prefStatus,
    }
  );
  await applyPrefeituraLogo(prefCodigo, body.prefLogo);
  return { data: await loadPrefeitura(prefCodigo) };
}

export async function updatePrefeitura(prefCodigo, body) {
  const prefNome = String(body.prefNome || "").trim();
  if (!prefNome) return { error: "Nome é obrigatório" };

  const prefStatus = body.prefStatus === "I" ? "I" : "A";

  const [result] = await pool.query(
    `UPDATE trnsprefeituras SET
       prefNome = :prefNome, prefCNPJ = :prefCNPJ, prefEndereco = :prefEndereco,
       prefComplemento = :prefComplemento, prefBairro = :prefBairro, PrefMunicipio = :PrefMunicipio,
       prefCodigoIbge = :prefCodigoIbge, prefEstado = :prefEstado, prefCep = :prefCep,
       prefTelefone = :prefTelefone, prefContato = :prefContato, prefNomeEmail = :prefNomeEmail,
       prefEmail = :prefEmail, prefForma_gestao = :prefForma_gestao, prefTitular = :prefTitular,
       prefMunCod = :prefMunCod, prefLocalDeposito = :prefLocalDeposito, prefStatus = :prefStatus,
       prefDataAlt = NOW()
     WHERE prefCodigo = :prefCodigo`,
    {
      prefCodigo,
      prefNome,
      prefCNPJ: body.prefCNPJ || "",
      prefEndereco: body.prefEndereco || "",
      prefComplemento: body.prefComplemento || "",
      prefBairro: body.prefBairro || "",
      PrefMunicipio: body.PrefMunicipio || "",
      prefCodigoIbge: body.prefCodigoIbge || "",
      prefEstado: body.prefEstado || "",
      prefCep: body.prefCep || "",
      prefTelefone: body.prefTelefone || "",
      prefContato: body.prefContato || "",
      prefNomeEmail: body.prefNomeEmail || "",
      prefEmail: body.prefEmail || "",
      prefForma_gestao: body.prefForma_gestao || "",
      prefTitular: body.prefTitular || "",
      prefMunCod: Number(body.prefMunCod) || 0,
      prefLocalDeposito: Number(body.prefLocalDeposito) || 0,
      prefStatus,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  await applyPrefeituraLogo(prefCodigo, body.prefLogo);
  return { data: await loadPrefeitura(prefCodigo) };
}

export async function listPrefeiturasLookup() {
  const [rows] = await pool.query(
    `SELECT prefCodigo, PrefMunicipio, prefNome
     FROM trnsprefeituras
     WHERE prefStatus = 'A'
     ORDER BY PrefMunicipio, prefNome`
  );
  return rows;
}

export async function listCargosLookup() {
  const [rows] = await pool.query(
    `SELECT carCodigo, carDescricao
     FROM trnscargos
     WHERE CarStatus = 'A'
     ORDER BY carDescricao`
  );
  return rows;
}

function clip(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function newGamGuid() {
  return crypto.randomUUID();
}

async function nextUsuarioCodigo(prefCodigo) {
  const [rows] = await pool.query(
    `SELECT COALESCE(MAX(usuCodigo), 0) + 1 AS n FROM trnsusuarios WHERE prefCodigo = :prefCodigo`,
    { prefCodigo }
  );
  return Number(rows[0].n);
}

/** Espelha PRCDSalvarDadosUsuario — vincula usuário GAM ao cadastro SGE. */
export async function syncSgeUsuario(userGuid, body) {
  const prefCodigo = Number(body.prefCodigoUsuario) || 0;
  if (!prefCodigo) return;

  const carCodigo = Number(body.carCodigo) || 0;
  const nome = clip([body.UserFirstName, body.UserLastName].filter(Boolean).join(" "), 40);
  const email = clip(body.UserEMail, 100);
  const login = clip(body.UserName, 20);

  const [existing] = await pool.query(
    `SELECT prefCodigo, usuCodigo FROM trnsusuarios WHERE usuGUID = :userGuid LIMIT 1`,
    { userGuid }
  );

  if (existing.length) {
    await pool.query(
      `UPDATE trnsusuarios
       SET prefCodigo = :prefCodigo, usuCargo = :carCodigo, usuNome = :nome, usuEmail = :email,
           usuUsuario = :login, usuStatus = 'A', usuDataAlt = CURDATE()
       WHERE usuGUID = :userGuid`,
      { userGuid, prefCodigo, carCodigo, nome, email, login }
    );
    return;
  }

  const usuCodigo = await nextUsuarioCodigo(prefCodigo);

  await pool.query(
    `INSERT INTO trnsusuarios (
       prefCodigo, usuCodigo, usuGUID, usuCargo, usuNome, usuEmail, usuUsuario,
       usuSenha, usuValidadeSenha, usuGrupo, usuUnidade, usuUnidadesPermitidas,
       usuInscricao, usuDataAcesso, usuStatus, usuDataCad, usuDataAlt
     ) VALUES (
       :prefCodigo, :usuCodigo, :userGuid, :carCodigo, :nome, :email, :login,
       '', 0, 0, 0, '', '', NOW(), 'A', CURDATE(), CURDATE()
     )`,
    { prefCodigo, usuCodigo, userGuid, carCodigo, nome, email, login }
  );
}

export async function loadGamUserEntry(userGuid) {
  const [rows] = await gamPool.query(
    `SELECT TRIM(UserGUID) AS UserGUID, UserNameSpace, UserName, UserEMail, UserFirstName, UserLastName,
            UserAutTypeName AS AuthenticationTypeName, UserExtId AS ExternalId,
            UserBirthday AS Birthday, UserGender AS Gender, UserPhone AS Phone,
            UserIsAct, UserIsBlk, UserNotChgPwd, UserChgPwdNexLog, UserPwdNevExp, UserNotRcvInf,
            CASE WHEN UserIsAct = 1 AND UserIsBlk = 0 THEN 'A' ELSE 'I' END AS Status
     FROM user WHERE UserGUID = :userGuid AND UserIsDlt = 0`,
    { userGuid }
  );
  const gam = rows[0];
  if (!gam) return null;

  const [sgeRows] = await pool.query(
    `SELECT prefCodigo AS prefCodigoUsuario, usuCargo AS carCodigo
     FROM trnsusuarios WHERE usuGUID = :userGuid
     ORDER BY usuDataAlt DESC, usuCodigo DESC
     LIMIT 1`,
    { userGuid }
  );
  const sge = sgeRows[0] ?? {};

  return {
    UserGUID: gam.UserGUID,
    UserNameSpace: gam.UserNameSpace || "",
    AuthenticationTypeName: gam.AuthenticationTypeName || "local",
    UserName: gam.UserName,
    UserEMail: gam.UserEMail || "",
    UserFirstName: gam.UserFirstName || "",
    UserLastName: gam.UserLastName || "",
    ExternalId: gam.ExternalId || "",
    Birthday: formatDateYmd(gam.Birthday),
    Gender: gam.Gender || "N",
    Phone: gam.Phone || "",
    prefCodigoUsuario: sge.prefCodigoUsuario ?? "",
    carCodigo: sge.carCodigo ?? "",
    IsActive: gam.UserIsAct === 1,
    IsBlocked: gam.UserIsBlk === 1,
    CannotChangePassword: gam.UserNotChgPwd === 1,
    MustChangePassword: gam.UserChgPwdNexLog === 1,
    PasswordNeverExpires: gam.UserPwdNevExp === 1,
    DontReceiveInformation: gam.UserNotRcvInf === 1,
    Status: gam.Status,
  };
}

export async function createGamUserEntry(body) {
  try {
    return await createGamUserEntryInner(body);
  } catch (err) {
    console.error("[createGamUserEntry]", err);
    if (err.code === "ER_DATA_TOO_LONG") {
      return { error: "Um dos campos excede o tamanho máximo permitido." };
    }
    if (err.code === "ER_DUP_ENTRY") {
      return { error: "Login ou cadastro duplicado." };
    }
    return { error: err.message || "Erro ao cadastrar usuário." };
  }
}

async function createGamUserEntryInner(body) {
  const userName = String(body.UserName || "").trim();
  if (!userName) return { error: "Login é obrigatório" };

  const password = String(body.UserPwd || "");
  const passwordConf = String(body.UserPwdConf || "");
  if (!password) return { error: "Senha é obrigatória na inclusão" };
  if (password !== passwordConf) return { error: "Senha e confirmação não conferem" };

  const userGuid = newGamGuid();
  const pwdHash = hashGamPassword(password, userGuid, config.gamPasswordIterations);
  const isActive = body.IsActive !== false && body.Status !== "I";
  const isBlocked = body.IsBlocked === true || body.IsBlocked === "S";

  try {
    await gamPool.query(
      `INSERT INTO user (
         UserGUID, UserNameSpace, UserAutTypeName, UserName, UserEMail, UserPwd,
         UserFirstName, UserLastName, UserExtId, UserBirthday, UserGender, UserPhone,
         UserNotRcvInf, UserIsBlk, UserIsAct, UserIsDlt, UserNotChgPwd, UserChgPwdNexLog,
         UserPwdNevExp, UserPwdEncryption, UserCreDate, UserCreUser, UserLng
       ) VALUES (
         :userGuid, '', :authType, :userName, :email, :pwd,
         :firstName, :lastName, :externalId, :birthday, :gender, :phone,
         :notRcv, :blk, :act, 0, :notChgPwd, :chgPwdNext, :pwdNevExp, 'sh5', NOW(), 'web', 'Portuguese'
       )`,
      {
        userGuid,
        authType: body.AuthenticationTypeName || "local",
        userName,
        email: body.UserEMail || "",
        pwd: pwdHash,
        firstName: body.UserFirstName || "",
        lastName: body.UserLastName || "",
        externalId: body.ExternalId || "",
        birthday: toSqlDateOrNull(body.Birthday),
        gender: body.Gender || "N",
        phone: body.Phone || "",
        notRcv: body.DontReceiveInformation ? 1 : 0,
        blk: isBlocked ? 1 : 0,
        act: isActive ? 1 : 0,
        notChgPwd: body.CannotChangePassword ? 1 : 0,
        chgPwdNext: body.MustChangePassword ? 1 : 0,
        pwdNevExp: body.PasswordNeverExpires ? 1 : 0,
      }
    );
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return { error: "Login já cadastrado" };
    throw err;
  }

  await syncSgeUsuario(userGuid, { ...body, UserName: userName });
  return { data: await loadGamUserEntry(userGuid) };
}

export async function updateGamUserEntry(userGuid, body) {
  try {
    return await updateGamUserEntryInner(userGuid, body);
  } catch (err) {
    console.error("[updateGamUserEntry]", err);
    if (err.code === "ER_DATA_TOO_LONG") {
      return { error: "Um dos campos excede o tamanho máximo permitido." };
    }
    if (err.code === "ER_DUP_ENTRY") {
      return { error: "Login ou cadastro duplicado no SGE." };
    }
    return { error: err.message || "Erro ao salvar usuário." };
  }
}

async function updateGamUserEntryInner(userGuid, body) {
  const existing = await loadGamUserEntry(userGuid);
  if (!existing) return { error: "Usuário não encontrado", status: 404 };

  if (body.UserPwd) {
    const passwordConf = String(body.UserPwdConf || "");
    if (body.UserPwd !== passwordConf) return { error: "Senha e confirmação não conferem" };
  }

  const updates = [];
  const params = { userGuid };

  if (body.UserEMail !== undefined) {
    updates.push("UserEMail = :email");
    params.email = body.UserEMail;
  }
  if (body.UserFirstName !== undefined) {
    updates.push("UserFirstName = :firstName");
    params.firstName = body.UserFirstName;
  }
  if (body.UserLastName !== undefined) {
    updates.push("UserLastName = :lastName");
    params.lastName = body.UserLastName;
  }
  if (body.ExternalId !== undefined) {
    updates.push("UserExtId = :externalId");
    params.externalId = body.ExternalId;
  }
  if (body.Birthday !== undefined) {
    updates.push("UserBirthday = :birthday");
    params.birthday = toSqlDateOrNull(body.Birthday);
  }
  if (body.Gender !== undefined) {
    updates.push("UserGender = :gender");
    params.gender = body.Gender || "N";
  }
  if (body.Phone !== undefined) {
    updates.push("UserPhone = :phone");
    params.phone = body.Phone;
  }
  if (body.DontReceiveInformation !== undefined) {
    updates.push("UserNotRcvInf = :notRcv");
    params.notRcv = body.DontReceiveInformation ? 1 : 0;
  }
  if (body.CannotChangePassword !== undefined) {
    updates.push("UserNotChgPwd = :notChgPwd");
    params.notChgPwd = body.CannotChangePassword ? 1 : 0;
  }
  if (body.MustChangePassword !== undefined) {
    updates.push("UserChgPwdNexLog = :chgPwdNext");
    params.chgPwdNext = body.MustChangePassword ? 1 : 0;
  }
  if (body.PasswordNeverExpires !== undefined) {
    updates.push("UserPwdNevExp = :pwdNevExp");
    params.pwdNevExp = body.PasswordNeverExpires ? 1 : 0;
  }

  const isActive = body.IsActive !== undefined ? body.IsActive : body.Status === "A";
  const isBlocked = body.IsBlocked !== undefined ? body.IsBlocked : undefined;

  if (body.IsActive !== undefined || body.Status !== undefined) {
    updates.push("UserIsAct = :act");
    params.act = isActive ? 1 : 0;
  }
  if (body.IsBlocked !== undefined) {
    updates.push("UserIsBlk = :blk");
    params.blk = isBlocked ? 1 : 0;
  } else if (body.Status === "I") {
    updates.push("UserIsBlk = 1");
  } else if (body.Status === "A") {
    updates.push("UserIsBlk = 0");
  }

  if (body.UserPwd) {
    const pwdHash = hashGamPassword(body.UserPwd, userGuid, config.gamPasswordIterations);
    updates.push("UserPwd = :pwd", "UserPwdEncryption = 'sh5'");
    params.pwd = pwdHash;
  }

  if (updates.length) {
    updates.push("UserUpdDate = NOW()", "UserUpdUser = 'web'");
    await gamPool.query(`UPDATE user SET ${updates.join(", ")} WHERE UserGUID = :userGuid`, params);
  }

  const login = body.UserName || existing.UserName;
  await syncSgeUsuario(userGuid, {
    ...existing,
    ...body,
    UserName: login,
  });

  return { data: await loadGamUserEntry(userGuid) };
}
