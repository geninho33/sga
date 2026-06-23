const GAM_FIELD_LIMITS = {
  UserName: 100,
  UserEMail: 100,
  UserFirstName: 60,
  UserLastName: 60,
  UserExtId: 100,
  UserPhone: 254,
  UserAutTypeName: 60,
  UserGender: 1,
  UserLng: 3,
};

const GAM_FIELD_LABELS = {
  UserName: "Login",
  UserEMail: "E-mail",
  UserFirstName: "Nome",
  UserLastName: "Sobrenome",
  UserExtId: "ID externo",
  UserPhone: "Telefone",
  UserAutTypeName: "Tipo de autenticação",
  UserGender: "Sexo",
  UserLng: "Idioma",
  UserPwd: "Senha (hash GAM)",
};

const SGE_FIELD_LABELS = {
  usuUsuario: "Login (SGE)",
  usuNome: "Nome (SGE)",
  usuEmail: "E-mail (SGE)",
};

export const GAM_DEFAULT_USER_LNG = "";

function clip(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

export function normalizeGamUserInput(body = {}) {
  return {
    userName: clip(body.UserName, GAM_FIELD_LIMITS.UserName),
    email: clip(body.UserEMail, GAM_FIELD_LIMITS.UserEMail),
    firstName: clip(body.UserFirstName, GAM_FIELD_LIMITS.UserFirstName),
    lastName: clip(body.UserLastName, GAM_FIELD_LIMITS.UserLastName),
    externalId: clip(body.ExternalId, GAM_FIELD_LIMITS.UserExtId),
    phone: clip(body.Phone, GAM_FIELD_LIMITS.UserPhone),
    authType: clip(body.AuthenticationTypeName || "local", GAM_FIELD_LIMITS.UserAutTypeName),
    gender: clip(body.Gender || "N", GAM_FIELD_LIMITS.UserGender) || "N",
  };
}

export function dataTooLongErrorMessage(err) {
  const message = String(err?.sqlMessage || err?.message || "");
  const match = message.match(/Data too long for column '([^']+)'/i);
  if (!match) return "Um dos campos excede o tamanho máximo permitido.";

  const column = match[1];
  const label = GAM_FIELD_LABELS[column] || SGE_FIELD_LABELS[column] || column;
  const limit = GAM_FIELD_LIMITS[column];
  if (limit) {
    return `O campo "${label}" excede o tamanho máximo de ${limit} caracteres.`;
  }
  return `O campo "${label}" excede o tamanho máximo permitido.`;
}

const MYSQL_FIELD_LABELS = {
  UserDataReqComplete: "Dados obrigatórios completos",
  UserIsDevice: "Usuário dispositivo",
};

export function mysqlDuplicateErrorMessage(err) {
  const msg = String(err?.sqlMessage || err?.message || "");
  if (/user\.|UserName|UUSER/i.test(msg)) {
    return "Login já cadastrado no GAM.";
  }
  if (/usuCodigo|PRIMARY/i.test(msg)) {
    return "Conflito ao gerar o código do usuário no SGE. Tente salvar novamente.";
  }
  if (/usuUsuario|Itrnsusuarios/i.test(msg)) {
    return "Login já cadastrado nesta prefeitura.";
  }
  return "Login ou cadastro duplicado.";
}

export function mysqlFieldErrorMessage(err) {
  if (err?.code === "ER_DATA_TOO_LONG") return dataTooLongErrorMessage(err);
  const message = String(err?.sqlMessage || err?.message || "");
  const match = message.match(/Field '([^']+)' doesn't have a default value/i);
  if (match) {
    const column = match[1];
    const label = GAM_FIELD_LABELS[column] || SGE_FIELD_LABELS[column] || MYSQL_FIELD_LABELS[column] || column;
    return `Campo obrigatório do GAM não preenchido: "${label}".`;
  }
  return err?.message || "Erro ao salvar usuário.";
}
