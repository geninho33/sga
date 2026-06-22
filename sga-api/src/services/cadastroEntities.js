import { pool } from "../db.js";

function auditUser(req) {
  return req.user?.usuUsuario || req.user?.usuNome || "web";
}

export async function nextCode(prefCodigo, table, column, type = "bigint") {
  const [rows] = await pool.query(
    `SELECT COALESCE(MAX(${column}), 0) + 1 AS n FROM ${table} WHERE prefCodigo = :prefCodigo`,
    { prefCodigo }
  );
  return Number(rows[0].n);
}

export async function loadUnidade(prefCodigo, uniCodigo) {
  const [rows] = await pool.query(
    `SELECT uniCodigo, uniDescricao, uniFracao, uniStatus, uniDataCad, uniDataAlt
     FROM trnsunidades WHERE prefCodigo = :prefCodigo AND uniCodigo = :uniCodigo`,
    { prefCodigo, uniCodigo }
  );
  return rows[0] ?? null;
}

export async function createUnidade(prefCodigo, body) {
  const desc = String(body.uniDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };

  const uniCodigo = await nextCode(prefCodigo, "trnsunidades", "uniCodigo");
  const uniStatus = body.uniStatus === "I" ? "I" : "A";
  const uniFracao = body.uniFracao != null ? String(body.uniFracao) : "";

  await pool.query(
    `INSERT INTO trnsunidades (prefCodigo, uniCodigo, uniDescricao, uniFracao, uniStatus, uniDataCad, uniDataAlt)
     VALUES (:prefCodigo, :uniCodigo, :uniDescricao, :uniFracao, :uniStatus, NOW(), NOW())`,
    { prefCodigo, uniCodigo, uniDescricao: desc, uniFracao, uniStatus }
  );
  return { data: await loadUnidade(prefCodigo, uniCodigo) };
}

export async function updateUnidade(prefCodigo, uniCodigo, body) {
  const desc = String(body.uniDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };

  const uniStatus = body.uniStatus === "I" ? "I" : "A";
  const uniFracao = body.uniFracao != null ? String(body.uniFracao) : "";

  const [result] = await pool.query(
    `UPDATE trnsunidades
     SET uniDescricao = :uniDescricao, uniFracao = :uniFracao, uniStatus = :uniStatus, uniDataAlt = NOW()
     WHERE prefCodigo = :prefCodigo AND uniCodigo = :uniCodigo`,
    { prefCodigo, uniCodigo, uniDescricao: desc, uniFracao, uniStatus }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadUnidade(prefCodigo, uniCodigo) };
}

export async function loadConvQtde(prefCodigo, orig, dest) {
  const [rows] = await pool.query(
    `SELECT uniConvUnidadeOrigem, uniConvUnidadeDestino, uniConvQtdeGerar, uniConvStatus,
            uniConvDataCad, uniConvDataAlt
     FROM trnsconvqtde
     WHERE prefCodigo = :prefCodigo
       AND uniConvUnidadeOrigem = :orig AND uniConvUnidadeDestino = :dest`,
    { prefCodigo, orig, dest }
  );
  return rows[0] ?? null;
}

export async function createConvQtde(prefCodigo, body) {
  const orig = Number(body.uniConvUnidadeOrigem);
  const dest = Number(body.uniConvUnidadeDestino);
  const qtde = body.uniConvQtdeGerar;

  if (!orig || !dest) return { error: "Unidades origem e destino são obrigatórias" };
  if (orig === dest) return { error: "Unidade origem e destino devem ser diferentes" };
  if (qtde === null || qtde === undefined || qtde === "") return { error: "Qtde a gerar é obrigatória" };

  const uniConvStatus = body.uniConvStatus === "I" ? "I" : "A";

  try {
    await pool.query(
      `INSERT INTO trnsconvqtde
       (prefCodigo, uniConvUnidadeOrigem, uniConvUnidadeDestino, uniConvQtdeGerar, uniConvStatus, uniConvDataCad, uniConvDataAlt)
       VALUES (:prefCodigo, :orig, :dest, :qtde, :uniConvStatus, NOW(), NOW())`,
      { prefCodigo, orig, dest, qtde: Number(qtde), uniConvStatus }
    );
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return { error: "Conversão já cadastrada para este par de unidades" };
    throw err;
  }

  return { data: await loadConvQtde(prefCodigo, orig, dest) };
}

export async function updateConvQtde(prefCodigo, orig, dest, body) {
  const qtde = body.uniConvQtdeGerar;
  if (qtde === null || qtde === undefined || qtde === "") return { error: "Qtde a gerar é obrigatória" };

  const uniConvStatus = body.uniConvStatus === "I" ? "I" : "A";

  const [result] = await pool.query(
    `UPDATE trnsconvqtde
     SET uniConvQtdeGerar = :qtde, uniConvStatus = :uniConvStatus, uniConvDataAlt = NOW()
     WHERE prefCodigo = :prefCodigo
       AND uniConvUnidadeOrigem = :orig AND uniConvUnidadeDestino = :dest`,
    { prefCodigo, orig, dest, qtde: Number(qtde), uniConvStatus }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadConvQtde(prefCodigo, orig, dest) };
}

export async function loadLocal(prefCodigo, locCodigo) {
  const [rows] = await pool.query(
    `SELECT locCodigo, locDescricao, locInep, locAbreviatura, locTipoUnidade, locTelefone, locEndereco,
            locComplemento, locBairro, locCep, locEmail, locForno, locFreezer, locNota, locUeCod,
            locVinculada, locUsuario, locSenha, locStatus, locDataCad, locDataAlt
     FROM trnslocal WHERE prefCodigo = :prefCodigo AND locCodigo = :locCodigo`,
    { prefCodigo, locCodigo }
  );
  return rows[0] ?? null;
}

export async function createLocal(prefCodigo, body, req) {
  const desc = String(body.locDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };

  const locCodigo = await nextCode(prefCodigo, "trnslocal", "locCodigo");
  const locStatus = body.locStatus === "I" ? "I" : "A";
  const locForno = body.locForno === "S" ? "S" : "N";
  const locFreezer = body.locFreezer === "S" ? "S" : "N";
  const locUsuario = body.locUsuario ? String(body.locUsuario).trim() : String(req.user?.usuCodigo || 0).padStart(6, "0");
  const locSenha = body.locSenha ? String(body.locSenha).trim() : "12345";

  await pool.query(
    `INSERT INTO trnslocal (
       prefCodigo, locCodigo, locDescricao, locInep, locTipoUnidade, locTelefone, locEndereco,
       locComplemento, locBairro, locCep, locArea, locUnidadeCentral, locSecretaria, locFreezer,
       locForno, locNota, locNotaSequencia, locAbreviatura, locResponsavel, locEmail, locDiretor,
       locStatus, locDataCad, locDataAlt, locUeCod, locUsuario, locSenha, locVinculada
     ) VALUES (
       :prefCodigo, :locCodigo, :locDescricao, :locInep, :locTipoUnidade, :locTelefone, :locEndereco,
       :locComplemento, :locBairro, :locCep, 1, 1, 1, :locFreezer,
       :locForno, :locNota, 0, :locAbreviatura, 0, :locEmail, '',
       :locStatus, NOW(), NOW(), :locUeCod, :locUsuario, :locSenha, :locVinculada
     )`,
    {
      prefCodigo,
      locCodigo,
      locDescricao: desc,
      locInep: body.locInep ? String(body.locInep).trim() : " ",
      locTipoUnidade: Number(body.locTipoUnidade) || 1,
      locTelefone: body.locTelefone || null,
      locEndereco: body.locEndereco || null,
      locComplemento: body.locComplemento || "",
      locBairro: body.locBairro || null,
      locCep: body.locCep || "",
      locFreezer,
      locForno,
      locNota: Number(body.locNota) || 0,
      locAbreviatura: body.locAbreviatura ? String(body.locAbreviatura).trim() : desc.slice(0, 30),
      locEmail: body.locEmail || "",
      locStatus,
      locUeCod: body.locUeCod ? Number(body.locUeCod) : null,
      locUsuario,
      locSenha,
      locVinculada: Number(body.locVinculada) || 0,
    }
  );
  return { data: await loadLocal(prefCodigo, locCodigo) };
}

export async function updateLocal(prefCodigo, locCodigo, body) {
  const desc = String(body.locDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };

  const locStatus = body.locStatus === "I" ? "I" : "A";
  const locForno = body.locForno === "S" ? "S" : "N";
  const locFreezer = body.locFreezer === "S" ? "S" : "N";

  const [result] = await pool.query(
    `UPDATE trnslocal SET
       locDescricao = :locDescricao,
       locInep = :locInep,
       locAbreviatura = :locAbreviatura,
       locTipoUnidade = :locTipoUnidade,
       locTelefone = :locTelefone,
       locEndereco = :locEndereco,
       locComplemento = :locComplemento,
       locBairro = :locBairro,
       locCep = :locCep,
       locEmail = :locEmail,
       locForno = :locForno,
       locFreezer = :locFreezer,
       locNota = :locNota,
       locUeCod = :locUeCod,
       locVinculada = :locVinculada,
       locUsuario = :locUsuario,
       locSenha = COALESCE(:locSenha, locSenha),
       locStatus = :locStatus,
       locDataAlt = NOW()
     WHERE prefCodigo = :prefCodigo AND locCodigo = :locCodigo`,
    {
      prefCodigo,
      locCodigo,
      locDescricao: desc,
      locInep: body.locInep ? String(body.locInep).trim() : " ",
      locAbreviatura: body.locAbreviatura ? String(body.locAbreviatura).trim() : desc.slice(0, 30),
      locTipoUnidade: Number(body.locTipoUnidade) || 1,
      locTelefone: body.locTelefone || null,
      locEndereco: body.locEndereco || null,
      locComplemento: body.locComplemento || "",
      locBairro: body.locBairro || null,
      locCep: body.locCep || "",
      locEmail: body.locEmail || "",
      locForno,
      locFreezer,
      locNota: Number(body.locNota) || 0,
      locUeCod: body.locUeCod ? Number(body.locUeCod) : null,
      locVinculada: Number(body.locVinculada) || 0,
      locUsuario: body.locUsuario ? String(body.locUsuario).trim() : null,
      locSenha: body.locSenha ? String(body.locSenha).trim() : null,
      locStatus,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadLocal(prefCodigo, locCodigo) };
}

export async function loadDoenca(prefCodigo, doenCodigo) {
  const [rows] = await pool.query(
    `SELECT doenCodigo, doenDescricao, doenOrdem, doenStatus, doenSataCad, doenDataAlt
     FROM trnsdoencas WHERE prefCodigo = :prefCodigo AND doenCodigo = :doenCodigo`,
    { prefCodigo, doenCodigo }
  );
  return rows[0] ?? null;
}

export async function createDoenca(prefCodigo, body) {
  const desc = String(body.doenDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };

  const doenCodigo = await nextCode(prefCodigo, "trnsdoencas", "doenCodigo");
  const doenStatus = body.doenStatus === "I" ? "I" : "A";
  const doenOrdem = Number(body.doenOrdem) || 0;

  await pool.query(
    `INSERT INTO trnsdoencas (prefCodigo, doenCodigo, doenDescricao, doenOrdem, doenStatus, doenSataCad, doenDataAlt)
     VALUES (:prefCodigo, :doenCodigo, :doenDescricao, :doenOrdem, :doenStatus, NOW(), NOW())`,
    { prefCodigo, doenCodigo, doenDescricao: desc, doenOrdem, doenStatus }
  );
  return { data: await loadDoenca(prefCodigo, doenCodigo) };
}

export async function updateDoenca(prefCodigo, doenCodigo, body) {
  const desc = String(body.doenDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };

  const doenStatus = body.doenStatus === "I" ? "I" : "A";
  const doenOrdem = Number(body.doenOrdem) || 0;

  const [result] = await pool.query(
    `UPDATE trnsdoencas
     SET doenDescricao = :doenDescricao, doenOrdem = :doenOrdem, doenStatus = :doenStatus, doenDataAlt = NOW()
     WHERE prefCodigo = :prefCodigo AND doenCodigo = :doenCodigo`,
    { prefCodigo, doenCodigo, doenDescricao: desc, doenOrdem, doenStatus }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadDoenca(prefCodigo, doenCodigo) };
}

export async function loadTipoAjuste(prefCodigo, tipajuCodigo) {
  const [rows] = await pool.query(
    `SELECT tipajuCodigo, tipajuNome, tipajuSigla, tipajuAcao
     FROM tipoajuste WHERE prefCodigo = :prefCodigo AND tipajuCodigo = :tipajuCodigo`,
    { prefCodigo, tipajuCodigo }
  );
  return rows[0] ?? null;
}

export async function createTipoAjuste(prefCodigo, body, req) {
  const nome = String(body.tipajuNome || "").trim();
  const sigla = String(body.tipajuSigla || "").trim();
  if (!nome) return { error: "Nome é obrigatório" };
  if (!sigla) return { error: "Sigla é obrigatória" };

  const tipajuCodigo = await nextCode(prefCodigo, "tipoajuste", "tipajuCodigo", "smallint");
  const tipajuAcao = body.tipajuAcao === "S" ? "S" : "E";
  const user = auditUser(req);

  await pool.query(
    `INSERT INTO tipoajuste (
       tipajuCodigo, prefCodigo, tipajuNome, tipajuSigla, tipajuAcao,
       tipajuUsuarioInclusao, tipajuDataHoraInclusao
     ) VALUES (:tipajuCodigo, :prefCodigo, :tipajuNome, :tipajuSigla, :tipajuAcao, :user, NOW())`,
    { prefCodigo, tipajuCodigo, tipajuNome: nome, tipajuSigla: sigla, tipajuAcao, user }
  );
  return { data: await loadTipoAjuste(prefCodigo, tipajuCodigo) };
}

export async function updateTipoAjuste(prefCodigo, tipajuCodigo, body, req) {
  const nome = String(body.tipajuNome || "").trim();
  const sigla = String(body.tipajuSigla || "").trim();
  if (!nome) return { error: "Nome é obrigatório" };
  if (!sigla) return { error: "Sigla é obrigatória" };

  const tipajuAcao = body.tipajuAcao === "S" ? "S" : "E";
  const user = auditUser(req);

  const [result] = await pool.query(
    `UPDATE tipoajuste SET
       tipajuNome = :tipajuNome, tipajuSigla = :tipajuSigla, tipajuAcao = :tipajuAcao,
       tipajuUsuarioAlteracao = :user, tipajuDataHoraAlteracao = NOW()
     WHERE prefCodigo = :prefCodigo AND tipajuCodigo = :tipajuCodigo`,
    { prefCodigo, tipajuCodigo, tipajuNome: nome, tipajuSigla: sigla, tipajuAcao, user }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadTipoAjuste(prefCodigo, tipajuCodigo) };
}

export function sendCrudResult(res, result) {
  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }
  return res.json({ data: result.data });
}
