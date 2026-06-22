import crypto from "crypto";
import { pool, gamPool } from "../db.js";
import { config } from "../config.js";
import { hashGamPassword } from "./gamPassword.js";
import { atendimentoHasCarDapCodigo } from "./schemaFeatures.js";

function auditUser(req) {
  return req.user?.usuUsuario || req.user?.usuNome || "web";
}

export async function nextCode(prefCodigo, table, column) {
  const [rows] = await pool.query(
    `SELECT COALESCE(MAX(${column}), 0) + 1 AS n FROM ${table} WHERE prefCodigo = :prefCodigo`,
    { prefCodigo }
  );
  return Number(rows[0].n);
}

export function sendCrudResult(res, result) {
  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }
  const body = { data: result.data };
  if (result.message) body.message = result.message;
  return res.json(body);
}

// --- Pratos ---
export async function loadPrato(prefCodigo, pratoCodigo) {
  const [rows] = await pool.query(
    `SELECT pratoCodigo, pratoDscricao, pratoTipoRefeicao, pratoComFreezer, pratoSemFreezer,
            pratoForno, pratoRepeticao, pratoCozinhaCentral, pratoModoDeFazer, pratoStatus,
            pratoCodigoPai, pratoCodigoPaiAtend
     FROM trnspratos WHERE prefCodigo = :prefCodigo AND pratoCodigo = :pratoCodigo`,
    { prefCodigo, pratoCodigo }
  );
  return rows[0] ?? null;
}

export async function createPrato(prefCodigo, body) {
  const desc = String(body.pratoDscricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };
  const pratoCodigo = await nextCode(prefCodigo, "trnspratos", "pratoCodigo");
  const pratoStatus = body.pratoStatus === "I" ? "I" : "A";
  await pool.query(
    `INSERT INTO trnspratos (
       prefCodigo, pratoCodigo, pratoDscricao, pratoTipoRefeicao, pratoComFreezer, pratoSemFreezer,
       pratoForno, pratoRepeticao, pratoCozinhaCentral, pratoModoDeFazer, pratoCodigoPai, pratoCodigoPaiAtend,
       pratoStatus, pratoDataCad, pratoDataAlt
     ) VALUES (
       :prefCodigo, :pratoCodigo, :pratoDscricao, :pratoTipoRefeicao,
       :pratoComFreezer, :pratoSemFreezer, :pratoForno, :pratoRepeticao, :pratoCozinhaCentral,
       :pratoModoDeFazer, :pratoCodigoPai, :pratoCodigoPaiAtend, :pratoStatus, NOW(), NOW()
     )`,
    {
      prefCodigo,
      pratoCodigo,
      pratoDscricao: desc,
      pratoTipoRefeicao: Number(body.pratoTipoRefeicao) || 0,
      pratoComFreezer: body.pratoComFreezer === "S" ? "S" : "N",
      pratoSemFreezer: body.pratoSemFreezer === "S" ? "S" : "N",
      pratoForno: body.pratoForno === "S" ? "S" : "N",
      pratoRepeticao: body.pratoRepeticao === "S" ? "S" : "N",
      pratoCozinhaCentral: body.pratoCozinhaCentral === "S" ? "S" : "N",
      pratoModoDeFazer: body.pratoModoDeFazer || "",
      pratoCodigoPai: Number(body.pratoCodigoPai) || 0,
      pratoCodigoPaiAtend: Number(body.pratoCodigoPaiAtend) || 0,
      pratoStatus,
    }
  );
  return { data: await loadPrato(prefCodigo, pratoCodigo) };
}

export async function updatePrato(prefCodigo, pratoCodigo, body) {
  const desc = String(body.pratoDscricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };
  const pratoStatus = body.pratoStatus === "I" ? "I" : "A";
  const [result] = await pool.query(
    `UPDATE trnspratos SET
       pratoDscricao = :pratoDscricao, pratoTipoRefeicao = :pratoTipoRefeicao,
       pratoComFreezer = :pratoComFreezer, pratoSemFreezer = :pratoSemFreezer,
       pratoForno = :pratoForno, pratoRepeticao = :pratoRepeticao,
       pratoCozinhaCentral = :pratoCozinhaCentral, pratoModoDeFazer = :pratoModoDeFazer,
       pratoStatus = :pratoStatus, pratoDataAlt = NOW()
     WHERE prefCodigo = :prefCodigo AND pratoCodigo = :pratoCodigo`,
    {
      prefCodigo,
      pratoCodigo,
      pratoDscricao: desc,
      pratoTipoRefeicao: Number(body.pratoTipoRefeicao) || 0,
      pratoComFreezer: body.pratoComFreezer === "S" ? "S" : "N",
      pratoSemFreezer: body.pratoSemFreezer === "S" ? "S" : "N",
      pratoForno: body.pratoForno === "S" ? "S" : "N",
      pratoRepeticao: body.pratoRepeticao === "S" ? "S" : "N",
      pratoCozinhaCentral: body.pratoCozinhaCentral === "S" ? "S" : "N",
      pratoModoDeFazer: body.pratoModoDeFazer || "",
      pratoStatus,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadPrato(prefCodigo, pratoCodigo) };
}

// --- Tipo refeição ---
export async function loadTipoRefeicao(prefCodigo, refTipCodigo) {
  const [rows] = await pool.query(
    `SELECT refTipCodigo, refTipDescricao, refTipAbreviatura, refTipperiodo,
            refTipHorario, refTipHorario2, refTipstatus
     FROM trnsrefeicaotipo WHERE prefCodigo = :prefCodigo AND refTipCodigo = :refTipCodigo`,
    { prefCodigo, refTipCodigo }
  );
  return rows[0] ?? null;
}

export async function createTipoRefeicao(prefCodigo, body) {
  const desc = String(body.refTipDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };
  const refTipCodigo = await nextCode(prefCodigo, "trnsrefeicaotipo", "refTipCodigo");
  const refTipstatus = body.refTipstatus === "I" ? "I" : "A";
  await pool.query(
    `INSERT INTO trnsrefeicaotipo (
       prefCodigo, refTipCodigo, refTipDescricao, refTipAbreviatura, refTipperiodo,
       refTipHorario, refTipHorario2, refTipstatus, refTipDataCad, refTipDataAlt
     ) VALUES (
       :prefCodigo, :refTipCodigo, :refTipDescricao, :refTipAbreviatura, :refTipperiodo,
       :refTipHorario, :refTipHorario2, :refTipstatus, NOW(), NOW()
     )`,
    {
      prefCodigo,
      refTipCodigo,
      refTipDescricao: desc,
      refTipAbreviatura: body.refTipAbreviatura || "",
      refTipperiodo: body.refTipperiodo || "M",
      refTipHorario: body.refTipHorario || null,
      refTipHorario2: body.refTipHorario2 || null,
      refTipstatus,
    }
  );
  return { data: await loadTipoRefeicao(prefCodigo, refTipCodigo) };
}

export async function updateTipoRefeicao(prefCodigo, refTipCodigo, body) {
  const desc = String(body.refTipDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };
  const refTipstatus = body.refTipstatus === "I" ? "I" : "A";
  const [result] = await pool.query(
    `UPDATE trnsrefeicaotipo SET
       refTipDescricao = :refTipDescricao, refTipAbreviatura = :refTipAbreviatura,
       refTipperiodo = :refTipperiodo, refTipHorario = :refTipHorario, refTipHorario2 = :refTipHorario2,
       refTipstatus = :refTipstatus, refTipDataAlt = NOW()
     WHERE prefCodigo = :prefCodigo AND refTipCodigo = :refTipCodigo`,
    {
      prefCodigo,
      refTipCodigo,
      refTipDescricao: desc,
      refTipAbreviatura: body.refTipAbreviatura || "",
      refTipperiodo: body.refTipperiodo || "M",
      refTipHorario: body.refTipHorario || null,
      refTipHorario2: body.refTipHorario2 || null,
      refTipstatus,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadTipoRefeicao(prefCodigo, refTipCodigo) };
}

// --- Cardápio ---
export async function loadCardapio(prefCodigo, carDapCodigo) {
  const [rows] = await pool.query(
    `SELECT carDapCodigo, carDapDescricao, carDapNutricionista, carDapMesAno, carDapNecessidade,
            carDapStatus, carDapGruCodigo, carDapNutricionista1, carDapNutricionista2, carDapNutricionista3,
            carDapLiberarAcesso, carDapUsuario
     FROM trnscardapio WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo`,
    { prefCodigo, carDapCodigo }
  );
  return rows[0] ?? null;
}

export async function createCardapio(prefCodigo, body, req) {
  const desc = String(body.carDapDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };
  const carDapCodigo = await nextCode(prefCodigo, "trnscardapio", "carDapCodigo");
  const carDapStatus = body.carDapStatus === "I" ? "I" : "A";
  const user = auditUser(req);
  await pool.query(
    `INSERT INTO trnscardapio (
       prefCodigo, carDapCodigo, carDapDescricao, carDapNutricionista, carDapMesAno, carDapNecessidade,
       carDapStatus, carDapDataCadastro, carDapDataAlteracao, carDapUsuario, carDapGruCodigo,
       carDapNutricionista1, carDapNutricionista2, carDapNutricionista3, carDapLiberarAcesso
     ) VALUES (
       :prefCodigo, :carDapCodigo, :carDapDescricao, :carDapNutricionista, :carDapMesAno, :carDapNecessidade,
       :carDapStatus, CURDATE(), CURDATE(), :user, :carDapGruCodigo,
       :carDapNutricionista1, :carDapNutricionista2, :carDapNutricionista3, :carDapLiberarAcesso
     )`,
    {
      prefCodigo,
      carDapCodigo,
      carDapDescricao: desc,
      carDapNutricionista: Number(body.carDapNutricionista) || 0,
      carDapMesAno: body.carDapMesAno || null,
      carDapNecessidade: Number(body.carDapNecessidade) || 0,
      carDapStatus,
      user,
      carDapGruCodigo: Number(body.carDapGruCodigo) || 0,
      carDapNutricionista1: Number(body.carDapNutricionista1) || 0,
      carDapNutricionista2: Number(body.carDapNutricionista2) || 0,
      carDapNutricionista3: Number(body.carDapNutricionista3) || 0,
      carDapLiberarAcesso: body.carDapLiberarAcesso === "S" ? "S" : "N",
    }
  );
  return { data: await loadCardapio(prefCodigo, carDapCodigo) };
}

export async function updateCardapio(prefCodigo, carDapCodigo, body, req) {
  const desc = String(body.carDapDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };
  const carDapStatus = body.carDapStatus === "I" ? "I" : "A";
  const user = auditUser(req);
  const [result] = await pool.query(
    `UPDATE trnscardapio SET
       carDapDescricao = :carDapDescricao, carDapNutricionista = :carDapNutricionista,
       carDapMesAno = :carDapMesAno, carDapNecessidade = :carDapNecessidade, carDapStatus = :carDapStatus,
       carDapDataAlteracao = CURDATE(), carDapUsuario = :user, carDapGruCodigo = :carDapGruCodigo,
       carDapNutricionista1 = :carDapNutricionista1, carDapNutricionista2 = :carDapNutricionista2,
       carDapNutricionista3 = :carDapNutricionista3, carDapLiberarAcesso = :carDapLiberarAcesso
     WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo`,
    {
      prefCodigo,
      carDapCodigo,
      carDapDescricao: desc,
      carDapNutricionista: Number(body.carDapNutricionista) || 0,
      carDapMesAno: body.carDapMesAno || null,
      carDapNecessidade: Number(body.carDapNecessidade) || 0,
      carDapStatus,
      user,
      carDapGruCodigo: Number(body.carDapGruCodigo) || 0,
      carDapNutricionista1: Number(body.carDapNutricionista1) || 0,
      carDapNutricionista2: Number(body.carDapNutricionista2) || 0,
      carDapNutricionista3: Number(body.carDapNutricionista3) || 0,
      carDapLiberarAcesso: body.carDapLiberarAcesso === "S" ? "S" : "N",
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadCardapio(prefCodigo, carDapCodigo) };
}

/** Espelha PRCDDuplicarCardapio — copia cardápio e refeições vinculadas. */
export async function duplicarCardapio(prefCodigo, carDapCodigo, req) {
  const orig = await loadCardapio(prefCodigo, carDapCodigo);
  if (!orig) return { error: "Cardápio não encontrado", status: 404 };

  const novoCodigo = await nextCode(prefCodigo, "trnscardapio", "carDapCodigo");
  const user = auditUser(req);
  const desc = `( Cópia ) ${orig.carDapDescricao}`;

  await pool.query(
    `INSERT INTO trnscardapio (
       prefCodigo, carDapCodigo, carDapDescricao, carDapNutricionista, carDapMesAno, carDapNecessidade,
       carDapStatus, carDapDataCadastro, carDapDataAlteracao, carDapUsuario, carDapGruCodigo,
       carDapNutricionista1, carDapNutricionista2, carDapNutricionista3, carDapLiberarAcesso
     ) VALUES (
       :prefCodigo, :novoCodigo, :desc, :carDapNutricionista, :carDapMesAno, :carDapNecessidade,
       :carDapStatus, CURDATE(), CURDATE(), :user, :carDapGruCodigo,
       :carDapNutricionista1, :carDapNutricionista2, :carDapNutricionista3, 'N'
     )`,
    {
      prefCodigo,
      novoCodigo,
      desc,
      carDapNutricionista: orig.carDapNutricionista,
      carDapMesAno: orig.carDapMesAno,
      carDapNecessidade: orig.carDapNecessidade,
      carDapStatus: orig.carDapStatus,
      user,
      carDapGruCodigo: orig.carDapGruCodigo,
      carDapNutricionista1: orig.carDapNutricionista1,
      carDapNutricionista2: orig.carDapNutricionista2,
      carDapNutricionista3: orig.carDapNutricionista3,
    }
  );

  await pool.query(
    `INSERT INTO trnscardapioprato (
       prefCodigo, carDapCodigo, carPratoCodigo, carPratoHorario, carPratoData, carPratoRefeicao, carPratoTurno
     )
     SELECT prefCodigo, :novoCodigo, carPratoCodigo, carPratoHorario, carPratoData, carPratoRefeicao, carPratoTurno
     FROM trnscardapioprato
     WHERE prefCodigo = :prefCodigo AND carDapCodigo = :orig`,
    { prefCodigo, novoCodigo, orig: carDapCodigo }
  );

  return { data: await loadCardapio(prefCodigo, novoCodigo), message: "Duplicação realizada com sucesso!" };
}

/** Espelha PRCDDuplicarRefeicao — copia prato e ingredientes. */
export async function duplicarPrato(prefCodigo, pratoCodigo) {
  const orig = await loadPrato(prefCodigo, pratoCodigo);
  if (!orig) return { error: "Refeição não encontrada", status: 404 };

  const novoCodigo = await nextCode(prefCodigo, "trnspratos", "pratoCodigo");
  const baseDesc = String(orig.pratoDscricao || "").replace(/^\(\s*Cópia\s*\)\s*/gi, "").trim();
  const desc = `( Cópia ) ${baseDesc}`;

  await pool.query(
    `INSERT INTO trnspratos (
       prefCodigo, pratoCodigo, pratoDscricao, pratoComFreezer, pratoSemFreezer, pratoForno,
       pratoModoDeFazer, pratoRepeticao, pratoCozinhaCentral, pratoTipoRefeicao,
       pratoCodigoPai, pratoCodigoPaiAtend, pratoStatus, pratoDataCad, pratoDataAlt
     ) VALUES (
       :prefCodigo, :novoCodigo, :desc, :pratoComFreezer, :pratoSemFreezer, :pratoForno,
       :pratoModoDeFazer, :pratoRepeticao, :pratoCozinhaCentral, :pratoTipoRefeicao,
       :pratoCodigoPai, :pratoCodigoPaiAtend, 'A', NOW(), NOW()
     )`,
    {
      prefCodigo,
      novoCodigo,
      desc,
      pratoComFreezer: orig.pratoComFreezer || "N",
      pratoSemFreezer: orig.pratoSemFreezer || "N",
      pratoForno: orig.pratoForno || "N",
      pratoModoDeFazer: orig.pratoModoDeFazer || "",
      pratoRepeticao: orig.pratoRepeticao || "N",
      pratoCozinhaCentral: orig.pratoCozinhaCentral || "N",
      pratoTipoRefeicao: orig.pratoTipoRefeicao || 0,
      pratoCodigoPai: Number(orig.pratoCodigoPai) || 0,
      pratoCodigoPaiAtend: Number(orig.pratoCodigoPaiAtend) || 0,
    }
  );

  await pool.query(
    `INSERT INTO trnspratosingredientes (
       prefCodigo, pratoCodigo, pratIngrProdCodigo, AreEnsCodigo, AreEnsSequencial, carGruTurno, pratIngrQuantidade
     )
     SELECT prefCodigo, :novoCodigo, pratIngrProdCodigo, AreEnsCodigo, AreEnsSequencial, carGruTurno, pratIngrQuantidade
     FROM trnspratosingredientes
     WHERE prefCodigo = :prefCodigo AND pratoCodigo = :orig`,
    { prefCodigo, novoCodigo, orig: pratoCodigo }
  );

  return { data: await loadPrato(prefCodigo, novoCodigo), message: "Duplicação realizada com sucesso!" };
}

export async function listCardapioPratos(prefCodigo, carDapCodigo) {
  const [rows] = await pool.query(
    `SELECT cp.carPratoCodigo, cp.carPratoData, cp.carPratoTurno, cp.carPratoRefeicao, cp.carPratoHorario,
            p.pratoDscricao AS carPratoRefeicaoDesc, t.refTipDescricao AS carPratoTurnoDesc
     FROM trnscardapioprato cp
     LEFT JOIN trnspratos p ON p.prefCodigo = cp.prefCodigo AND p.pratoCodigo = cp.carPratoRefeicao
     LEFT JOIN trnsrefeicaotipo t ON t.prefCodigo = cp.prefCodigo AND t.refTipCodigo = cp.carPratoTurno
     WHERE cp.prefCodigo = :prefCodigo AND cp.carDapCodigo = :carDapCodigo
     ORDER BY cp.carPratoData, cp.carPratoHorario, cp.carPratoTurno`,
    { prefCodigo, carDapCodigo }
  );
  return rows;
}

async function horarioDoTurno(prefCodigo, carPratoTurno) {
  const [rows] = await pool.query(
    `SELECT refTipHorario FROM trnsrefeicaotipo
     WHERE prefCodigo = :prefCodigo AND refTipCodigo = :carPratoTurno`,
    { prefCodigo, carPratoTurno: Number(carPratoTurno) }
  );
  return rows[0]?.refTipHorario ?? null;
}

export async function createCardapioPrato(prefCodigo, carDapCodigo, body) {
  const [maxRows] = await pool.query(
    `SELECT COALESCE(MAX(carPratoCodigo), 0) + 1 AS n FROM trnscardapioprato
     WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo`,
    { prefCodigo, carDapCodigo }
  );
  const carPratoCodigo = Number(maxRows[0].n);
  const carPratoTurno = Number(body.carPratoTurno) || 0;
  const carPratoHorario = (await horarioDoTurno(prefCodigo, carPratoTurno)) ?? new Date();
  await pool.query(
    `INSERT INTO trnscardapioprato (
       prefCodigo, carDapCodigo, carPratoCodigo, carPratoData, carPratoTurno, carPratoRefeicao, carPratoHorario
     ) VALUES (
       :prefCodigo, :carDapCodigo, :carPratoCodigo, :carPratoData, :carPratoTurno, :carPratoRefeicao, :carPratoHorario
     )`,
    {
      prefCodigo,
      carDapCodigo,
      carPratoCodigo,
      carPratoData: body.carPratoData,
      carPratoTurno,
      carPratoRefeicao: Number(body.carPratoRefeicao) || 0,
      carPratoHorario,
    }
  );
  const list = await listCardapioPratos(prefCodigo, carDapCodigo);
  return { data: list.find((r) => r.carPratoCodigo === carPratoCodigo) };
}

export async function deleteCardapioPrato(prefCodigo, carDapCodigo, carPratoCodigo) {
  const [result] = await pool.query(
    `DELETE FROM trnscardapioprato
     WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo AND carPratoCodigo = :carPratoCodigo`,
    { prefCodigo, carDapCodigo, carPratoCodigo }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: { ok: true } };
}

/** Turnos de grupo (carGruTurno) — trnspratosingredientesWW */
export const TURNO_GRUPO_OPTIONS = [
  { value: 1, label: "Matutino" },
  { value: 2, label: "Vespertino" },
  { value: 3, label: "Noturno" },
  { value: 4, label: "Integral" },
  { value: 5, label: "Interm. Matutino" },
  { value: 6, label: "Interm. Vespertino" },
];

export function turnoGrupoLabel(value) {
  const n = Number(value);
  return TURNO_GRUPO_OPTIONS.find((o) => o.value === n)?.label ?? String(value ?? "");
}

export async function listPratoIngredientes(prefCodigo, pratoCodigo) {
  const [rows] = await pool.query(
    `SELECT pi.pratIngrProdCodigo, pi.AreEnsCodigo, pi.AreEnsSequencial, pi.carGruTurno,
            pi.pratIngrQuantidade, pi.pratIngrStatus,
            p.prodDescricao, ae.AreEnsNome, et.AreEnsEtapaNome
     FROM trnspratosingredientes pi
     INNER JOIN trnsprodutos p ON p.prefCodigo = pi.prefCodigo AND p.prodCodigo = pi.pratIngrProdCodigo
     LEFT JOIN trnsareaensino ae ON ae.prefCodigo = pi.prefCodigo AND ae.AreEnsCodigo = pi.AreEnsCodigo
     LEFT JOIN trnsareaensinoetapa et ON et.prefCodigo = pi.prefCodigo
       AND et.AreEnsCodigo = pi.AreEnsCodigo AND et.AreEnsSequencial = pi.AreEnsSequencial
     WHERE pi.prefCodigo = :prefCodigo AND pi.pratoCodigo = :pratoCodigo
     ORDER BY p.prodDescricao, ae.AreEnsNome, et.AreEnsEtapaNome, pi.carGruTurno`,
    { prefCodigo, pratoCodigo }
  );
  return rows.map((r) => ({
    ...r,
    carGruTurnoDesc: turnoGrupoLabel(r.carGruTurno),
  }));
}

export async function upsertPratoIngrediente(prefCodigo, pratoCodigo, body) {
  const pratIngrProdCodigo = Number(body.pratIngrProdCodigo);
  const AreEnsCodigo = Number(body.AreEnsCodigo);
  const AreEnsSequencial = Number(body.AreEnsSequencial);
  const carGruTurno = Number(body.carGruTurno);
  const pratIngrQuantidade = Number(body.pratIngrQuantidade);

  if (!pratIngrProdCodigo || !AreEnsCodigo || Number.isNaN(AreEnsSequencial) || !carGruTurno) {
    return { error: "Ingrediente, área, etapa e turno são obrigatórios", status: 400 };
  }
  if (Number.isNaN(pratIngrQuantidade)) {
    return { error: "Informe a percapta", status: 400 };
  }

  const pratIngrStatus = body.pratIngrStatus === "I" ? "I" : "A";

  await pool.query(
    `INSERT INTO trnspratosingredientes (
       prefCodigo, pratoCodigo, pratIngrProdCodigo, AreEnsCodigo, AreEnsSequencial, carGruTurno,
       pratIngrQuantidade, pratIngrStatus, pratIngrDataCad, pratIngrDataAlt
     ) VALUES (
       :prefCodigo, :pratoCodigo, :pratIngrProdCodigo, :AreEnsCodigo, :AreEnsSequencial, :carGruTurno,
       :pratIngrQuantidade, :pratIngrStatus, NOW(), NOW()
     )
     ON DUPLICATE KEY UPDATE
       pratIngrQuantidade = VALUES(pratIngrQuantidade),
       pratIngrStatus = VALUES(pratIngrStatus),
       pratIngrDataAlt = NOW()`,
    {
      prefCodigo,
      pratoCodigo,
      pratIngrProdCodigo,
      AreEnsCodigo,
      AreEnsSequencial,
      carGruTurno,
      pratIngrQuantidade,
      pratIngrStatus,
    }
  );

  const list = await listPratoIngredientes(prefCodigo, pratoCodigo);
  const row = list.find(
    (r) =>
      r.pratIngrProdCodigo === pratIngrProdCodigo &&
      r.AreEnsCodigo === AreEnsCodigo &&
      r.AreEnsSequencial === AreEnsSequencial &&
      Number(r.carGruTurno) === carGruTurno
  );
  return { data: row };
}

export async function deletePratoIngrediente(prefCodigo, pratoCodigo, keys) {
  const [result] = await pool.query(
    `DELETE FROM trnspratosingredientes
     WHERE prefCodigo = :prefCodigo AND pratoCodigo = :pratoCodigo
       AND pratIngrProdCodigo = :pratIngrProdCodigo
       AND AreEnsCodigo = :AreEnsCodigo AND AreEnsSequencial = :AreEnsSequencial
       AND carGruTurno = :carGruTurno`,
    {
      prefCodigo,
      pratoCodigo,
      pratIngrProdCodigo: Number(keys.pratIngrProdCodigo),
      AreEnsCodigo: Number(keys.AreEnsCodigo),
      AreEnsSequencial: Number(keys.AreEnsSequencial),
      carGruTurno: Number(keys.carGruTurno),
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: { ok: true } };
}

export async function listCardapioAreas(prefCodigo, carDapCodigo) {
  const [rows] = await pool.query(
    `SELECT AreEnsCodigo, AreEnsSequencial, carTurno, carEstNormal, carEstGluten,
            carEstLactose, carEstDiabetico, carEstColesterol,
            CarAteDoenCodigo, CarAteDoenNome, CarAteDoenQtde
     FROM trnscardapioAreaEnsino
     WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo
     ORDER BY AreEnsCodigo, AreEnsSequencial, carTurno`,
    { prefCodigo, carDapCodigo }
  );
  return rows;
}

export async function createCardapioArea(prefCodigo, carDapCodigo, body) {
  await pool.query(
    `INSERT INTO trnscardapioAreaEnsino (
       prefCodigo, carDapCodigo, AreEnsCodigo, AreEnsSequencial, carTurno,
       carEstNormal, carEstGluten, carEstLactose, carEstDiabetico, carEstColesterol,
       CarAteDoenCodigo, CarAteDoenQtde, CarAteDoenNome
     ) VALUES (
       :prefCodigo, :carDapCodigo, :AreEnsCodigo, :AreEnsSequencial, :carTurno,
       :carEstNormal, :carEstGluten, :carEstLactose, :carEstDiabetico, :carEstColesterol,
       0, 0, ''
     )`,
    {
      prefCodigo,
      carDapCodigo,
      AreEnsCodigo: Number(body.AreEnsCodigo) || 0,
      AreEnsSequencial: Number(body.AreEnsSequencial) || 0,
      carTurno: Number(body.carTurno) || 0,
      carEstNormal: Number(body.carEstNormal) || 0,
      carEstGluten: Number(body.carEstGluten) || 0,
      carEstLactose: Number(body.carEstLactose) || 0,
      carEstDiabetico: Number(body.carEstDiabetico) || 0,
      carEstColesterol: Number(body.carEstColesterol) || 0,
    }
  );
  return { data: body };
}

export async function deleteCardapioArea(prefCodigo, carDapCodigo, areEns, seq, turno) {
  const [result] = await pool.query(
    `DELETE FROM trnscardapioAreaEnsino
     WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo
       AND AreEnsCodigo = :areEns AND AreEnsSequencial = :seq AND carTurno = :turno`,
    { prefCodigo, carDapCodigo, areEns, seq, turno }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: { ok: true } };
}

// --- Grupo cardápio ---
export async function loadCardapioGrupo(prefCodigo, carGruCodigo) {
  const [rows] = await pool.query(
    `SELECT carGruCodigo, carGruDescricao, carGruCozinhaCentral, carGruNutricionista, carGruStatus, carDapCodigo
     FROM trnscardapiogrupo WHERE prefCodigo = :prefCodigo AND carGruCodigo = :carGruCodigo`,
    { prefCodigo, carGruCodigo }
  );
  return rows[0] ?? null;
}

export async function createCardapioGrupo(prefCodigo, body) {
  const desc = String(body.carGruDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };
  const carGruCodigo = await nextCode(prefCodigo, "trnscardapiogrupo", "carGruCodigo");
  const carGruStatus = body.carGruStatus === "I" ? "I" : "A";
  await pool.query(
    `INSERT INTO trnscardapiogrupo (
       prefCodigo, carGruCodigo, carGruDescricao, carGruCozinhaCentral, carGruNutricionista,
       carGruStatus, carGruDataCad, carGruDataAlt, carDapCodigo
     ) VALUES (
       :prefCodigo, :carGruCodigo, :carGruDescricao, :carGruCozinhaCentral, :carGruNutricionista,
       :carGruStatus, NOW(), NOW(), :carDapCodigo
     )`,
    {
      prefCodigo,
      carGruCodigo,
      carGruDescricao: desc,
      carGruCozinhaCentral: body.carGruCozinhaCentral === "S" ? "S" : "N",
      carGruNutricionista: Number(body.carGruNutricionista) || 0,
      carGruStatus,
      carDapCodigo: Number(body.carDapCodigo) || 0,
    }
  );
  return { data: await loadCardapioGrupo(prefCodigo, carGruCodigo) };
}

export async function updateCardapioGrupo(prefCodigo, carGruCodigo, body) {
  const desc = String(body.carGruDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };
  const carGruStatus = body.carGruStatus === "I" ? "I" : "A";
  const [result] = await pool.query(
    `UPDATE trnscardapiogrupo SET
       carGruDescricao = :carGruDescricao, carGruCozinhaCentral = :carGruCozinhaCentral,
       carGruNutricionista = :carGruNutricionista, carGruStatus = :carGruStatus,
       carGruDataAlt = NOW(), carDapCodigo = :carDapCodigo
     WHERE prefCodigo = :prefCodigo AND carGruCodigo = :carGruCodigo`,
    {
      prefCodigo,
      carGruCodigo,
      carGruDescricao: desc,
      carGruCozinhaCentral: body.carGruCozinhaCentral === "S" ? "S" : "N",
      carGruNutricionista: Number(body.carGruNutricionista) || 0,
      carGruStatus,
      carDapCodigo: Number(body.carDapCodigo) || 0,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadCardapioGrupo(prefCodigo, carGruCodigo) };
}

// --- Atendimento ---
const ATENDIMENTO_DIAS = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];
const ATENDIMENTO_TIPOS = ["Normal", "Gluten", "Lactose", "Diabetico", "Colesterol", "Funcionarios"];
const ATENDIMENTO_COUNT_COLUMNS = ATENDIMENTO_DIAS.flatMap((d) =>
  ATENDIMENTO_TIPOS.map((t) => `Atendimento${t}${d}`)
);

function atendimentoCountParams(body) {
  const out = {};
  for (const col of ATENDIMENTO_COUNT_COLUMNS) {
    out[col] = Number(body[col]) || 0;
  }
  return out;
}

const ATENDIMENTO_LOAD = `
  SELECT a.*, ae.AreEnsNome, et.AreEnsEtapaNome, cg.carGruDescricao, l.locDescricao,
         cd.carDapDescricao, cd.carDapMesAno
  FROM atendimento a
  LEFT JOIN trnslocal l ON l.prefCodigo = a.prefCodigo AND l.locCodigo = a.locCodigo
  LEFT JOIN trnsareaensino ae ON ae.prefCodigo = a.prefCodigo AND ae.AreEnsCodigo = a.AreEnsCodigo
  LEFT JOIN trnsareaensinoetapa et ON et.prefCodigo = a.prefCodigo
    AND et.AreEnsCodigo = a.AreEnsCodigo AND et.AreEnsSequencial = a.AreEnsSequencial
  LEFT JOIN trnscardapiogrupo cg ON cg.prefCodigo = a.prefCodigo AND cg.carGruCodigo = a.carGruCodigo`;

let atendimentoLoadSql = null;

async function getAtendimentoLoadSql() {
  if (atendimentoLoadSql) return atendimentoLoadSql;
  const hasCarDap = await atendimentoHasCarDapCodigo();
  const cardapioJoin = hasCarDap
    ? `LEFT JOIN trnscardapio cd ON cd.prefCodigo = a.prefCodigo AND cd.carDapCodigo = a.carDapCodigo`
    : `LEFT JOIN trnscardapio cd ON cd.prefCodigo = cg.prefCodigo AND cd.carDapCodigo = cg.carDapCodigo`;
  atendimentoLoadSql = `${ATENDIMENTO_LOAD}\n  ${cardapioJoin}`;
  return atendimentoLoadSql;
}

export async function loadAtendimento(prefCodigo, AtendimentoCodigo) {
  const sql = await getAtendimentoLoadSql();
  const [rows] = await pool.query(
    `${sql} WHERE a.prefCodigo = :prefCodigo AND a.AtendimentoCodigo = :AtendimentoCodigo`,
    { prefCodigo, AtendimentoCodigo }
  );
  return rows[0] ?? null;
}

export async function createAtendimento(prefCodigo, body) {
  const AtendimentoCodigo = await nextCode(prefCodigo, "atendimento", "AtendimentoCodigo");
  const AtendimentoStatus = body.AtendimentoStatus === "I" ? "I" : "A";
  const counts = atendimentoCountParams(body);
  const countCols = ATENDIMENTO_COUNT_COLUMNS.join(", ");
  const countPlaceholders = ATENDIMENTO_COUNT_COLUMNS.map((c) => `:${c}`).join(", ");
  const hasCarDap = await atendimentoHasCarDapCodigo();
  const carDapCol = hasCarDap ? ", carDapCodigo" : "";
  const carDapVal = hasCarDap ? ", :carDapCodigo" : "";

  await pool.query(
    `INSERT INTO atendimento (
       prefCodigo, AtendimentoCodigo, locCodigo, AreEnsCodigo, AreEnsSequencial, carGruCodigo, AtendimentoTurno
       ${carDapCol},
       ${countCols}, AtendimentoStatus, AtendimentoDataCadastro, AtendimentoDataAlteracao
     ) VALUES (
       :prefCodigo, :AtendimentoCodigo, :locCodigo, :AreEnsCodigo, :AreEnsSequencial, :carGruCodigo, :AtendimentoTurno
       ${carDapVal},
       ${countPlaceholders}, :AtendimentoStatus, NOW(), NOW()
     )`,
    {
      prefCodigo,
      AtendimentoCodigo,
      locCodigo: Number(body.locCodigo) || 0,
      AreEnsCodigo: Number(body.AreEnsCodigo) || 0,
      AreEnsSequencial: Number(body.AreEnsSequencial) || 0,
      carGruCodigo: Number(body.carGruCodigo) || 0,
      AtendimentoTurno: Number(body.AtendimentoTurno) || 0,
      ...(hasCarDap ? { carDapCodigo: Number(body.carDapCodigo) || 0 } : {}),
      ...counts,
      AtendimentoStatus,
    }
  );
  return { data: await loadAtendimento(prefCodigo, AtendimentoCodigo) };
}

export async function updateAtendimento(prefCodigo, AtendimentoCodigo, body) {
  const AtendimentoStatus = body.AtendimentoStatus === "I" ? "I" : "A";
  const counts = atendimentoCountParams(body);
  const countSets = ATENDIMENTO_COUNT_COLUMNS.map((c) => `${c} = :${c}`).join(", ");
  const hasCarDap = await atendimentoHasCarDapCodigo();
  const carDapSet = hasCarDap ? "carDapCodigo = :carDapCodigo," : "";

  const [result] = await pool.query(
    `UPDATE atendimento SET
       locCodigo = :locCodigo, AreEnsCodigo = :AreEnsCodigo, AreEnsSequencial = :AreEnsSequencial,
       carGruCodigo = :carGruCodigo, ${carDapSet} AtendimentoTurno = :AtendimentoTurno,
       ${countSets},
       AtendimentoStatus = :AtendimentoStatus, AtendimentoDataAlteracao = NOW()
     WHERE prefCodigo = :prefCodigo AND AtendimentoCodigo = :AtendimentoCodigo`,
    {
      prefCodigo,
      AtendimentoCodigo,
      locCodigo: Number(body.locCodigo) || 0,
      AreEnsCodigo: Number(body.AreEnsCodigo) || 0,
      AreEnsSequencial: Number(body.AreEnsSequencial) || 0,
      carGruCodigo: Number(body.carGruCodigo) || 0,
      ...(hasCarDap ? { carDapCodigo: Number(body.carDapCodigo) || 0 } : {}),
      AtendimentoTurno: Number(body.AtendimentoTurno) || 0,
      ...counts,
      AtendimentoStatus,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadAtendimento(prefCodigo, AtendimentoCodigo) };
}

// --- Calendário letivo ---
export async function loadCalendario(prefCodigo, calAno, calData) {
  const [rows] = await pool.query(
    `SELECT calAno, calData, calDescricao, calDiautil, calFeriado, calStatus
     FROM trnscalendarioletivo
     WHERE prefCodigo = :prefCodigo AND calAno = :calAno AND calData = :calData`,
    { prefCodigo, calAno, calData }
  );
  return rows[0] ?? null;
}

export async function createCalendario(prefCodigo, body) {
  const calAno = Number(body.calAno);
  const calData = body.calData;
  const desc = String(body.calDescricao || "").trim();
  if (!calAno || !calData) return { error: "Ano e data são obrigatórios" };
  if (!desc) return { error: "Descrição é obrigatória" };
  const calStatus = body.calStatus === "I" ? "I" : "A";
  try {
    await pool.query(
      `INSERT INTO trnscalendarioletivo (prefCodigo, calAno, calData, calDescricao, calDiautil, calFeriado, calStatus, calDataCad, calDataAlt)
       VALUES (:prefCodigo, :calAno, :calData, :calDescricao, :calDiautil, :calFeriado, :calStatus, CURDATE(), CURDATE())`,
      {
        prefCodigo,
        calAno,
        calData,
        calDescricao: desc,
        calDiautil: body.calDiautil === "N" ? "N" : "S",
        calFeriado: body.calFeriado === "S" ? "S" : "N",
        calStatus,
      }
    );
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return { error: "Data já cadastrada neste ano" };
    throw err;
  }
  return { data: await loadCalendario(prefCodigo, calAno, calData) };
}

export async function updateCalendario(prefCodigo, calAno, calData, body) {
  const desc = String(body.calDescricao || "").trim();
  if (!desc) return { error: "Descrição é obrigatória" };
  const calStatus = body.calStatus === "I" ? "I" : "A";
  const [result] = await pool.query(
    `UPDATE trnscalendarioletivo SET
       calDescricao = :calDescricao, calDiautil = :calDiautil, calFeriado = :calFeriado,
       calStatus = :calStatus, calDataAlt = CURDATE()
     WHERE prefCodigo = :prefCodigo AND calAno = :calAno AND calData = :calData`,
    {
      prefCodigo,
      calAno,
      calData,
      calDescricao: desc,
      calDiautil: body.calDiautil === "N" ? "N" : "S",
      calFeriado: body.calFeriado === "S" ? "S" : "N",
      calStatus,
    }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { data: await loadCalendario(prefCodigo, calAno, calData) };
}

export async function deleteCalendario(prefCodigo, calAno, calData) {
  const [result] = await pool.query(
    `DELETE FROM trnscalendarioletivo
     WHERE prefCodigo = :prefCodigo AND calAno = :calAno AND calData = :calData`,
    { prefCodigo, calAno, calData }
  );
  if (result.affectedRows === 0) return { error: "Registro não encontrado", status: 404 };
  return { ok: true };
}

// --- Referências ---
export async function listReferencias(prefCodigo) {
  const [tipos, locais, grupos, pratos, cardapios, areas, etapas, produtos, nutricionistas] = await Promise.all([
    pool.query(
      `SELECT refTipCodigo, refTipDescricao, refTipHorario FROM trnsrefeicaotipo
       WHERE prefCodigo = :prefCodigo AND refTipstatus = 'A' ORDER BY refTipHorario, refTipDescricao`,
      { prefCodigo }
    ),
    pool.query(
      `SELECT locCodigo, locDescricao FROM trnslocal
       WHERE prefCodigo = :prefCodigo AND locStatus = 'A' ORDER BY locDescricao`,
      { prefCodigo }
    ),
    pool.query(
      `SELECT carGruCodigo, carGruDescricao, carDapCodigo FROM trnscardapiogrupo
       WHERE prefCodigo = :prefCodigo AND carGruStatus = 'A' ORDER BY carGruDescricao`,
      { prefCodigo }
    ),
    pool.query(
      `SELECT pratoCodigo, pratoDscricao FROM trnspratos
       WHERE prefCodigo = :prefCodigo AND pratoStatus = 'A' ORDER BY pratoDscricao`,
      { prefCodigo }
    ),
    pool.query(
      `SELECT carDapCodigo, carDapDescricao FROM trnscardapio
       WHERE prefCodigo = :prefCodigo AND carDapStatus = 'A' ORDER BY carDapDescricao`,
      { prefCodigo }
    ),
    pool.query(
      `SELECT AreEnsCodigo, AreEnsNome FROM trnsareaensino
       WHERE prefCodigo = :prefCodigo AND (ArenEnsStatus IS NULL OR ArenEnsStatus = 'A')
       ORDER BY AreEnsNome`,
      { prefCodigo }
    ),
    pool.query(
      `SELECT AreEnsCodigo, AreEnsSequencial, AreEnsEtapaNome FROM trnsareaensinoetapa
       WHERE prefCodigo = :prefCodigo ORDER BY AreEnsCodigo, AreEnsSequencial`,
      { prefCodigo }
    ),
    pool.query(
      `SELECT prodCodigo, prodDescricao FROM trnsprodutos
       WHERE prefCodigo = :prefCodigo AND prodStatus = 'A' ORDER BY prodDescricao`,
      { prefCodigo }
    ),
    pool.query(
      `SELECT u.usuCodigo, u.usuNome FROM trnsusuarios u
       INNER JOIN trnscargos c ON c.carCodigo = u.usuCargo
       WHERE u.prefCodigo = :prefCodigo AND u.usuStatus = 'A'
         AND (c.carDescricao LIKE '%Nutricionista%' OR u.usuCargo = 1)
       ORDER BY u.usuNome`,
      { prefCodigo }
    ),
  ]);
  return {
    tiposRefeicao: tipos[0],
    locais: locais[0],
    cardapioGrupos: grupos[0],
    pratos: pratos[0],
    cardapios: cardapios[0],
    areasEnsino: areas[0],
    etapasEnsino: etapas[0],
    produtos: produtos[0],
    nutricionistas: nutricionistas[0],
    turnoGrupo: TURNO_GRUPO_OPTIONS,
  };
}

export function newGamGuid() {
  return crypto.randomUUID();
}

export async function loadGamUser(userGuid) {
  const [rows] = await gamPool.query(
    `SELECT TRIM(UserGUID) AS UserGUID, UserName, UserEMail, UserFirstName, UserLastName,
            UserAutTypeName AS AuthenticationTypeName,
            CASE WHEN UserIsAct = 1 AND UserIsBlk = 0 THEN 'A' ELSE 'I' END AS Status
     FROM user WHERE UserGUID = :userGuid AND UserIsDlt = 0`,
    { userGuid }
  );
  return rows[0] ?? null;
}

export async function createGamUser(body) {
  const userName = String(body.UserName || "").trim();
  if (!userName) return { error: "Login é obrigatório" };
  const password = String(body.UserPwd || "");
  if (!password) return { error: "Senha é obrigatória na inclusão" };

  const userGuid = newGamGuid();
  const pwdHash = hashGamPassword(password, userGuid, config.gamPasswordIterations);

  try {
    await gamPool.query(
      `INSERT INTO user (
         UserGUID, UserNameSpace, UserAutTypeName, UserName, UserEMail, UserPwd,
         UserFirstName, UserLastName, UserPwdEncryption, UserIsBlk, UserIsAct, UserIsDlt,
         UserCreDate, UserCreUser, UserLng
       ) VALUES (
         :userGuid, '', 'local', :userName, :email, :pwd,
         :firstName, :lastName, 'sh5', 0, 1, 0, NOW(), 'web', 'Portuguese'
       )`,
      {
        userGuid,
        userName,
        email: body.UserEMail || "",
        pwd: pwdHash,
        firstName: body.UserFirstName || "",
        lastName: body.UserLastName || "",
      }
    );
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return { error: "Login já cadastrado" };
    throw err;
  }
  return { data: await loadGamUser(userGuid) };
}

export async function updateGamUser(userGuid, body) {
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
  if (body.Status === "A" || body.Status === "I") {
    updates.push("UserIsAct = :act", "UserIsBlk = :blk");
    params.act = body.Status === "A" ? 1 : 0;
    params.blk = body.Status === "I" ? 1 : 0;
  }
  if (body.UserPwd) {
    const pwdHash = hashGamPassword(body.UserPwd, userGuid, config.gamPasswordIterations);
    updates.push("UserPwd = :pwd");
    params.pwd = pwdHash;
  }
  if (!updates.length) return { error: "Nenhum campo para atualizar" };
  updates.push("UserUpdDate = NOW()", "UserUpdUser = 'web'");
  const [result] = await gamPool.query(`UPDATE user SET ${updates.join(", ")} WHERE UserGUID = :userGuid`, params);
  if (result.affectedRows === 0) return { error: "Usuário não encontrado", status: 404 };
  return { data: await loadGamUser(userGuid) };
}

export async function loadGamRole(roleId) {
  const [rows] = await gamPool.query(
    `SELECT RoleId, RoleName, RoleDsc, TRIM(RoleGUID) AS RoleGUID FROM role WHERE RoleId = :roleId`,
    { roleId }
  );
  return rows[0] ?? null;
}

export async function createGamRole(body) {
  const name = String(body.RoleName || "").trim();
  if (!name) return { error: "Nome é obrigatório" };
  const roleGuid = newGamGuid();
  const [maxRows] = await gamPool.query(`SELECT COALESCE(MAX(RoleId), 0) + 1 AS n FROM role`);
  const roleId = Number(maxRows[0].n);
  await gamPool.query(
    `INSERT INTO role (RepId, RoleId, RoleExtId, RoleGUID, RoleName, RoleDsc, RoleCreDate, RoleCreUser)
     VALUES (1, :roleId, '', :roleGuid, :name, :dsc, NOW(), 'web')`,
    { roleId, roleGuid, name, dsc: body.RoleDsc || "" }
  );
  return { data: await loadGamRole(roleId) };
}

export async function updateGamRole(roleId, body) {
  const name = String(body.RoleName || "").trim();
  if (!name) return { error: "Nome é obrigatório" };
  const [result] = await gamPool.query(
    `UPDATE role SET RoleName = :name, RoleDsc = :dsc, RoleUpdDate = NOW(), RoleUpdUser = 'web'
     WHERE RoleId = :roleId`,
    { roleId, name, dsc: body.RoleDsc || "" }
  );
  if (result.affectedRows === 0) return { error: "Perfil não encontrado", status: 404 };
  return { data: await loadGamRole(roleId) };
}
