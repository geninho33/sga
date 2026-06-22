import { pool } from "../db.js";
import { nextCode } from "./cadastroEntities.js";

const ENTRADA_TIPOS = new Set(["C", "DD", "R", "E"]);

function resolveMovimento(tipoRT, situacao, quantidade, qtdeAnterior, estoQuantidade) {
  const qtd = Number(quantidade) || 0;
  const ant = Number(qtdeAnterior) || 0;

  if (situacao === "I") {
    if (["D", "S", "RD", "RR", "DD", "RM"].includes(tipoRT)) {
      return { qtde: qtd, estoTipo: "E" };
    }
    return { qtde: qtd, estoTipo: "S" };
  }

  if (["D", "S", "RD", "RR", "DD", "RM"].includes(tipoRT)) {
    if (qtd < ant) return { qtde: ant - qtd, estoTipo: "E" };
    return { qtde: qtd - ant, estoTipo: "S" };
  }

  const ref = Number(estoQuantidade) || ant;
  if (qtd < ref) return { qtde: ant - qtd, estoTipo: "S" };
  return { qtde: qtd - ant, estoTipo: "E" };
}

async function loadProdutoSaldo(prefCodigo, prodCodigo) {
  const [rows] = await pool.query(
    `SELECT prodSaldo, prodUnidMedCompra FROM trnsprodutos
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

async function loadLocalDescricao(prefCodigo, locCodigo) {
  if (!locCodigo) return "";
  const [rows] = await pool.query(
    `SELECT locDescricao FROM trnslocal WHERE prefCodigo = :prefCodigo AND locCodigo = :locCodigo`,
    { prefCodigo, locCodigo }
  );
  return rows[0]?.locDescricao ?? "";
}

/**
 * Espelha PRCDEstoqueMovimentacao para romaneio (tipo R).
 */
export async function lancarEstoqueRomaneio(
  prefCodigo,
  { romanCodigo, prodCodigo, romanLocal, quantidade, situacao = "N", qtdeAnterior = 0, userName = "web" }
) {
  const tipoRT = "R";
  const prod = await loadProdutoSaldo(prefCodigo, prodCodigo);
  if (!prod) return;

  let locaCodigoLocal = Number(romanLocal) || 0;
  if (!locaCodigoLocal) {
    const [prefRows] = await pool.query(
      `SELECT prefLocalDeposito FROM trnsprefeituras WHERE prefCodigo = :prefCodigo`,
      { prefCodigo }
    );
    locaCodigoLocal = Number(prefRows[0]?.prefLocalDeposito) || 1;
  }

  const [movRows] = await pool.query(
    `SELECT estoCodigo, estoQuantidade FROM trnsestoque
     WHERE prefCodigo = :prefCodigo AND estoRomanCodigo = :romanCodigo AND estoProduto = :prodCodigo
     ORDER BY estoCodigo DESC LIMIT 1`,
    { prefCodigo, romanCodigo, prodCodigo }
  );
  const mov = movRows[0];
  const { qtde, estoTipo } = resolveMovimento(
    tipoRT,
    situacao,
    quantidade,
    qtdeAnterior,
    mov?.estoQuantidade
  );
  if (!qtde || qtde <= 0) return;

  const saldo = Number(prod.prodSaldo) || 0;
  const unidade = prod.prodUnidMedCompra;
  const uniDescricao = await loadUnidadeDescricao(prefCodigo, unidade);
  const estoLocalDescricao = await loadLocalDescricao(prefCodigo, locaCodigoLocal);
  const estoCodigo = await nextCode(prefCodigo, "trnsestoque", "estoCodigo");

  let estoObservacao = "";
  if (mov?.estoCodigo) {
    estoObservacao =
      situacao === "N"
        ? `Movimentaco n. ${mov.estoCodigo}  | Correção de Quantidade : ${qtdeAnterior} para ${quantidade} | Usuário : ${userName}`
        : `Movimentaco n. ${mov.estoCodigo}  | Correção de Quantidade : ${qtdeAnterior} para 0   ( Exclusão ) | Usuário : ${userName}`;
  }

  await pool.query(
    `INSERT INTO trnsestoque (
       estoCodigo, prefCodigo, estoNfCodigo, estoDistCodigo, estoAjusCodigo, estoRomanCodigo,
       estoTipo, estoProduto, estoLocal, estoLocalDescricao,
       estoUnidade, estoUnidadeSigla, estoQuantidade, estoSaldo, estoCadastro, estoAlteracao,
       estoUserName, estoObservacao
     ) VALUES (
       :estoCodigo, :prefCodigo, 0, 0, 0, :romanCodigo,
       :estoTipo, :prodCodigo, :estoLocal, :estoLocalDescricao,
       :unidade, :uniDescricao, :qtde, :saldo, NOW(), NOW(),
       :userName, :estoObservacao
     )`,
    {
      estoCodigo,
      prefCodigo,
      romanCodigo,
      estoTipo,
      prodCodigo,
      estoLocal: locaCodigoLocal,
      estoLocalDescricao,
      unidade,
      uniDescricao,
      qtde,
      saldo,
      userName,
      estoObservacao,
    }
  );

  await atualizarSaldoProduto(prefCodigo, prodCodigo, qtde, estoTipo);
}

export async function ensureRomaneioItemTriggers() {
  const [rows] = await pool.query("SHOW TRIGGERS LIKE 'romaneioitem'");
  const update = rows.find((r) => r.Trigger === "romaneioitem_before_update");
  if (update && String(update.Definer).toLowerCase().includes("rootexterno")) {
    await pool.query("DROP TRIGGER IF EXISTS romaneioitem_before_update");
    await pool.query(
      `CREATE TRIGGER romaneioitem_before_update
       BEFORE UPDATE ON romaneioitem
       FOR EACH ROW
       BEGIN
         SET NEW.romanItemQuantidadeAntes = OLD.romanItemQuantidade;
       END`
    );
  }
  await pool.query("DROP TRIGGER IF EXISTS romaneioitem_before_delete");
}
