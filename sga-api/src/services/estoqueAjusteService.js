import { pool } from "../db.js";
import { nextCode } from "./cadastroEntities.js";

const ENTRADA_TIPOS = new Set(["E", "G", "R", "M", "C"]);

async function loadProdutoSaldo(prefCodigo, prodCodigo) {
  const [rows] = await pool.query(
    `SELECT prodSaldo, prodUnidMedCompra, prodDescricao FROM trnsprodutos
     WHERE prefCodigo = :prefCodigo AND prodCodigo = :prodCodigo`,
    { prefCodigo, prodCodigo }
  );
  return rows[0] ?? null;
}

async function loadUnidadeDescricao(prefCodigo, uniCodigo) {
  if (!uniCodigo) return "";
  const [rows] = await pool.query(
    `SELECT uniDescricao FROM trnsunidades WHERE prefCodigo = :prefCodigo AND uniCodigo = :uniCodigo`,
    { prefCodigo, uniCodigo }
  );
  return rows[0]?.uniDescricao ?? "";
}

async function loadLocalDescricao(prefCodigo, locCodigo) {
  if (!locCodigo) return "";
  const [rows] = await pool.query(
    `SELECT locDescricao FROM trnslocal WHERE prefCodigo = :prefCodigo AND locCodigo = :locCodigo`,
    { prefCodigo, locCodigo }
  );
  return rows[0]?.locDescricao ?? "";
}

async function atualizarSaldoProduto(prefCodigo, prodCodigo, qtde, estoTipo) {
  const delta = Number(qtde) || 0;
  if (delta <= 0) return;
  const op = ENTRADA_TIPOS.has(estoTipo) ? "+" : "-";
  await pool.query(
    `UPDATE trnsprodutos SET prodSaldo = prodSaldo ${op} :delta
     WHERE prefCodigo = :prefCodigo AND prodCodigo = :prodCodigo`,
    { prefCodigo, prodCodigo, delta }
  );
}

/** Lança movimentação de estoque para ajuste (PRCDEstoqueMovimentacao tipo ajuste). */
export async function lancarEstoqueAjuste(
  prefCodigo,
  { ajusCodigo, prodCodigo, locCodigo, quantidade, ajusTipo, userName = "web" }
) {
  const prod = await loadProdutoSaldo(prefCodigo, prodCodigo);
  if (!prod) return;

  const estoTipo = ajusTipo === "E" ? "E" : "S";
  const qtde = Number(quantidade) || 0;
  if (qtde <= 0) return;

  const saldo = Number(prod.prodSaldo) || 0;
  const uniDescricao = await loadUnidadeDescricao(prefCodigo, prod.prodUnidMedCompra);
  const estoLocalDescricao = await loadLocalDescricao(prefCodigo, locCodigo);
  const estoCodigo = await nextCode(prefCodigo, "trnsestoque", "estoCodigo");

  await pool.query(
    `INSERT INTO trnsestoque (
       estoCodigo, prefCodigo, estoNfCodigo, estoDistCodigo, estoAjusCodigo, estoRomanCodigo,
       estoTipo, estoProduto, estoProdutoDescricao, estoLocal, estoLocalDescricao,
       estoUnidade, estoUnidadeSigla, estoQuantidade, estoSaldo, estoCadastro, estoAlteracao,
       estoUserName, estoObservacao
     ) VALUES (
       :estoCodigo, :prefCodigo, 0, 0, :ajusCodigo, 0,
       :estoTipo, :prodCodigo, :prodDescricao, :estoLocal, :estoLocalDescricao,
       :unidade, :uniDescricao, :qtde, :saldo, NOW(), NOW(),
       :userName, ''
     )`,
    {
      estoCodigo,
      prefCodigo,
      ajusCodigo,
      estoTipo,
      prodCodigo,
      prodDescricao: prod.prodDescricao ?? "",
      estoLocal: locCodigo,
      estoLocalDescricao,
      unidade: prod.prodUnidMedCompra,
      uniDescricao,
      qtde,
      saldo,
      userName,
    }
  );
  await atualizarSaldoProduto(prefCodigo, prodCodigo, qtde, estoTipo);
}

export async function loadAjuste(prefCodigo, ajusCodigo) {
  const [rows] = await pool.query(
    `SELECT a.*, t.tipajuNome, t.tipajuAcao, l.locDescricao AS ajusLocaDescricao
     FROM trnsajuste a
     LEFT JOIN tipoajuste t ON t.prefCodigo = a.prefCodigo AND t.tipajuCodigo = a.tipajuCodigo
     LEFT JOIN trnslocal l ON l.prefCodigo = a.prefCodigo AND l.locCodigo = a.ajusLocaCodigo AND NOT (l.locStatus <=> 'I')
     WHERE a.prefCodigo = :prefCodigo AND a.ajusCodigo = :ajusCodigo`,
    { prefCodigo, ajusCodigo }
  );
  return rows[0] ?? null;
}

export async function createAjuste(prefCodigo, body, userName = "web") {
  const tipajuCodigo = Number(body.tipajuCodigo);
  const ajusLocaCodigo = Number(body.ajusLocaCodigo);
  if (!tipajuCodigo) return { error: "Tipo de ajuste é obrigatório" };
  if (!ajusLocaCodigo) return { error: "Local é obrigatório" };
  if (!String(body.ajusOBS || "").trim()) return { error: "Justificativa é obrigatória" };

  const [tipoRows] = await pool.query(
    `SELECT tipajuAcao FROM tipoajuste WHERE prefCodigo = :prefCodigo AND tipajuCodigo = :tipajuCodigo`,
    { prefCodigo, tipajuCodigo }
  );
  if (!tipoRows.length) return { error: "Tipo de ajuste inválido" };

  const ajusCodigo = await nextCode(prefCodigo, "trnsajuste", "ajusCodigo");
  await pool.query(
    `INSERT INTO trnsajuste (
       ajusCodigo, prefCodigo, ajusData, ajusDataCadastro, ajusLocaCodigo,
       tipajuCodigo, ajusStatus, ajusOBS, ajusUserName, ajusTipo, ajusRotaCodigo
     ) VALUES (
       :ajusCodigo, :prefCodigo, COALESCE(:ajusData, NOW()), NOW(), :ajusLocaCodigo,
       :tipajuCodigo, 'A', :ajusOBS, :userName, :ajusTipo, :ajusRotaCodigo
     )`,
    {
      ajusCodigo,
      prefCodigo,
      ajusData: body.ajusData || null,
      ajusLocaCodigo,
      tipajuCodigo,
      ajusOBS: body.ajusOBS,
      userName,
      ajusTipo: tipoRows[0].tipajuAcao,
      ajusRotaCodigo: Number(body.ajusRotaCodigo) || 0,
    }
  );
  return { data: await loadAjuste(prefCodigo, ajusCodigo) };
}

export async function updateAjuste(prefCodigo, ajusCodigo, body) {
  const row = await loadAjuste(prefCodigo, ajusCodigo);
  if (!row) return { error: "Ajuste não encontrado", status: 404 };
  if (row.ajusStatus === "C") return { error: "Ajuste cancelado não pode ser alterado" };

  await pool.query(
    `UPDATE trnsajuste SET
       ajusData = COALESCE(:ajusData, ajusData),
       ajusLocaCodigo = COALESCE(:ajusLocaCodigo, ajusLocaCodigo),
       tipajuCodigo = COALESCE(:tipajuCodigo, tipajuCodigo),
       ajusOBS = COALESCE(:ajusOBS, ajusOBS),
       ajusRotaCodigo = COALESCE(:ajusRotaCodigo, ajusRotaCodigo)
     WHERE prefCodigo = :prefCodigo AND ajusCodigo = :ajusCodigo`,
    {
      prefCodigo,
      ajusCodigo,
      ajusData: body.ajusData ?? null,
      ajusLocaCodigo: body.ajusLocaCodigo ?? null,
      tipajuCodigo: body.tipajuCodigo ?? null,
      ajusOBS: body.ajusOBS ?? null,
      ajusRotaCodigo: body.ajusRotaCodigo ?? null,
    }
  );
  return { data: await loadAjuste(prefCodigo, ajusCodigo) };
}

export async function cancelAjuste(prefCodigo, ajusCodigo, motivo = "") {
  const row = await loadAjuste(prefCodigo, ajusCodigo);
  if (!row) return { error: "Ajuste não encontrado", status: 404 };
  if (row.ajusStatus === "C") return { error: "Ajuste já cancelado" };
  await pool.query(
    `UPDATE trnsajuste SET ajusStatus = 'C', ajusDSCancelamento = :motivo
     WHERE prefCodigo = :prefCodigo AND ajusCodigo = :ajusCodigo`,
    { prefCodigo, ajusCodigo, motivo }
  );
  return { data: await loadAjuste(prefCodigo, ajusCodigo) };
}

export async function listAjusteItens(prefCodigo, ajusCodigo, query = {}) {
  const q = String(query.q || "").trim();
  const params = { prefCodigo, ajusCodigo };
  let whereExtra = "";
  if (q) {
    whereExtra = " AND (p.prodDescricao LIKE :q OR CAST(ai.ajusItemProduto AS CHAR) LIKE :q)";
    params.q = `%${q}%`;
  }
  const [rows] = await pool.query(
    `SELECT ai.ajusItemProduto AS prodCodigo, p.prodDescricao, ai.ajusItemQuantidade,
            a.ajusTipo AS ajusItemTipo, p.prodSaldo AS ajusItemSaldo
     FROM trnsajusteitens ai
     JOIN trnsajuste a ON a.prefCodigo = ai.prefCodigo AND a.ajusCodigo = ai.ajusCodigo
     LEFT JOIN trnsprodutos p ON p.prefCodigo = ai.prefCodigo AND p.prodCodigo = ai.ajusItemProduto
     WHERE ai.prefCodigo = :prefCodigo AND ai.ajusCodigo = :ajusCodigo AND NOT (p.prodStatus <=> 'I') ${whereExtra}
     ORDER BY p.prodDescricao`,
    params
  );
  return { data: rows };
}

export async function upsertAjusteItem(prefCodigo, ajusCodigo, body, userName = "web") {
  const ajuste = await loadAjuste(prefCodigo, ajusCodigo);
  if (!ajuste) return { error: "Ajuste não encontrado", status: 404 };
  if (ajuste.ajusStatus === "C") return { error: "Ajuste cancelado" };

  const prodCodigo = Number(body.prodCodigo ?? body.ajusItemProduto);
  const quantidade = Number(body.ajusItemQuantidade);
  if (!prodCodigo) return { error: "Produto é obrigatório" };
  if (!quantidade || quantidade <= 0) return { error: "Quantidade inválida" };

  const ajusTipo = ajuste.tipajuAcao || ajuste.ajusTipo || "E";
  const prod = await loadProdutoSaldo(prefCodigo, prodCodigo);
  if (!prod) return { error: "Produto não encontrado" };
  const ajusItemUN = prod.prodUnidMedCompra ?? 0;
  const [exists] = await pool.query(
    `SELECT 1 FROM trnsajusteitens WHERE prefCodigo = :prefCodigo AND ajusCodigo = :ajusCodigo AND ajusItemProduto = :prodCodigo`,
    { prefCodigo, ajusCodigo, prodCodigo }
  );
  if (exists.length) {
    await pool.query(
      `UPDATE trnsajusteitens SET ajusItemQuantidade = :quantidade
       WHERE prefCodigo = :prefCodigo AND ajusCodigo = :ajusCodigo AND ajusItemProduto = :prodCodigo`,
      { prefCodigo, ajusCodigo, prodCodigo, quantidade }
    );
  } else {
    await pool.query(
      `INSERT INTO trnsajusteitens (prefCodigo, ajusCodigo, ajusItemProduto, ajusItemQuantidade, ajusItemUN)
       VALUES (:prefCodigo, :ajusCodigo, :prodCodigo, :quantidade, :ajusItemUN)`,
      { prefCodigo, ajusCodigo, prodCodigo, quantidade, ajusItemUN }
    );
  }
  await lancarEstoqueAjuste(prefCodigo, {
    ajusCodigo,
    prodCodigo,
    locCodigo: ajuste.ajusLocaCodigo,
    quantidade,
    ajusTipo,
    userName,
  });
  return listAjusteItens(prefCodigo, ajusCodigo);
}

export async function deleteAjusteItem(prefCodigo, ajusCodigo, prodCodigo) {
  await pool.query(
    `DELETE FROM trnsajusteitens WHERE prefCodigo = :prefCodigo AND ajusCodigo = :ajusCodigo AND ajusItemProduto = :prodCodigo`,
    { prefCodigo, ajusCodigo, prodCodigo: Number(prodCodigo) }
  );
  return { ok: true };
}
