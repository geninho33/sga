import { pool } from "../db.js";

function parseDataCorrente(value) {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function monthYearParams(date) {
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

export async function listMapaEstoque(prefCodigo, locCodigo, options = {}) {
  const loc = Number(locCodigo);
  if (!loc) return { error: "Informe a unidade escolar" };

  const dataCorrente = parseDataCorrente(options.dataCorrente);
  const dataStr = dataCorrente.toISOString().slice(0, 10);
  const { month, year } = monthYearParams(dataCorrente);
  const prodFiltro = String(options.prodDescricao || "").trim();

  const [localRows] = await pool.query(
    `SELECT locCodigo, locDescricao, locVinculada FROM trnslocal WHERE prefCodigo = :prefCodigo AND locCodigo = :loc`,
    { prefCodigo, loc }
  );
  const local = localRows[0] ?? null;
  if (!local) return { error: "Unidade escolar não encontrada" };

  const locVinculada = Number(local.locVinculada) || 0;
  let locVincDescricao = "";
  if (locVinculada) {
    const [vinc] = await pool.query(
      `SELECT locDescricao FROM trnslocal WHERE prefCodigo = :prefCodigo AND locCodigo = :loc`,
      { prefCodigo, loc: locVinculada }
    );
    locVincDescricao = vinc[0]?.locDescricao || "";
  }

  const [consumo] = await pool.query(
    `SELECT p.prodCodigo, p.prodDescricao, u.uniDescricao,
            m.mapaUeQuantidade AS quantidade, m.mapaUeObs AS obs,
            dt.disTipDescricao AS distipDescricao,
            COALESCE(e.estoUeSaldo, 0) AS saldo
     FROM trnsmapaue m
     INNER JOIN trnsprodutos p ON p.prefCodigo = m.prefCodigo AND p.prodCodigo = m.mapaUeProdCodigo
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedConsumo
     LEFT JOIN trnsdistribuicaotipo dt ON dt.prefCodigo = p.prefCodigo AND dt.disTipNumero = p.prodCodigoTipoRemessa
     LEFT JOIN TRNSEstoqueUE e ON e.prefCodigo = m.prefCodigo AND e.estoUeProdCodigo = m.mapaUeProdCodigo AND e.estoUeLocCodigo = m.mapaUeLocCodigo
     WHERE m.prefCodigo = :prefCodigo AND m.mapaUeLocCodigo = :loc AND m.mapaUeData = :dataStr AND p.prodStatus = 'A'
     ORDER BY p.prodCodigoTipoRemessa, p.prodDescricao`,
    { prefCodigo, loc, dataStr }
  );

  const estoqueParams = { prefCodigo, loc };
  let estoqueWhere = "p.prefCodigo = :prefCodigo AND p.prodStatus = 'A'";
  if (prodFiltro) {
    estoqueWhere += " AND p.prodDescricao LIKE :prodFiltro";
    estoqueParams.prodFiltro = `%${prodFiltro}%`;
  }

  const [estoque] = await pool.query(
    `SELECT p.prodCodigo AS estoUeProdCodigo, p.prodDescricao AS estoUeProdDescricao,
            u.uniDescricao AS estoUeUniDescricao,
            COALESCE(e.estoUeSaldo, 0) AS estoUeSaldo,
            COALESCE(e.estoUEQtdeFixa, 0) AS estoUEQtdeFixa,
            e.estoUeAlteracao,
            e.estoUeCodigo,
            dt.disTipDescricao AS estoUeTipoRemessa,
            GREATEST(COALESCE(e.estoUEQtdeFixa, 0) - COALESCE(e.estoUeSaldo, 0), 0) AS estoUePrevisao
     FROM trnsprodutos p
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedConsumo
     LEFT JOIN trnsdistribuicaotipo dt ON dt.prefCodigo = p.prefCodigo AND dt.disTipNumero = p.prodCodigoTipoRemessa
     LEFT JOIN TRNSEstoqueUE e ON e.prefCodigo = p.prefCodigo AND e.estoUeProdCodigo = p.prodCodigo AND e.estoUeLocCodigo = :loc
     WHERE ${estoqueWhere}
     ORDER BY p.prodCodigoTipoRemessa, p.prodDescricao`,
    estoqueParams
  );

  const destinos = locVinculada ? [loc, locVinculada] : [loc];
  const entregasParams = { prefCodigo, month, year, locVincDescricao, locVinculada: locVinculada || 0, loc };
  const destClause = locVinculada
    ? "d.distLocalDestino IN (:loc, :locVinculada)"
    : "d.distLocalDestino = :loc";

  const [entregas] = await pool.query(
    `SELECT d.distCodigo, d.distCodigoTipoRemessa, d.distDataEnvio, d.distDataRecepcao,
            d.distLocalOrigem, d.distObservacao, d.distRecebedor, d.distReceber,
            CASE WHEN d.distReceber = 'S' THEN 'Recebido' ELSE 'Aguardando' END AS distSituacao,
            CASE WHEN d.distLocalDestino = :locVinculada AND :locVinculada > 0 THEN :locVincDescricao ELSE NULL END AS distVincDescricao
     FROM trnsdistribuicao d
     WHERE d.prefCodigo = :prefCodigo
       AND d.distStatus = 'A'
       AND ${destClause}
       AND MONTH(d.distDataEnvio) = :month AND YEAR(d.distDataEnvio) = :year
     ORDER BY d.distLocalDestino, d.distDataEnvio`,
    entregasParams
  );

  const [ajustes] = await pool.query(
    `SELECT m.mapaUeCodigo, m.mapaUeProdCodigo AS prodCodigo, p.prodDescricao,
            u.uniDescricao, m.mapaUeQuantidade AS quantidade, m.mapaUeObs AS obs,
            m.mapaUeQtdeAjuste AS qtdeAjuste, m.mapaUeObsAjuste AS obsAjuste,
            CASE WHEN m.mapaUeAjuste = 'C' THEN 'Confirmado' ELSE 'Aguardando' END AS ajuste,
            dt.disTipDescricao AS distipDescricao,
            COALESCE(e.estoUeSaldo, 0) AS saldo
     FROM trnsmapaue m
     INNER JOIN trnsprodutos p ON p.prefCodigo = m.prefCodigo AND p.prodCodigo = m.mapaUeProdCodigo
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedConsumo
     LEFT JOIN trnsdistribuicaotipo dt ON dt.prefCodigo = p.prefCodigo AND dt.disTipNumero = p.prodCodigoTipoRemessa
     LEFT JOIN TRNSEstoqueUE e ON e.prefCodigo = m.prefCodigo AND e.estoUeProdCodigo = m.mapaUeProdCodigo AND e.estoUeLocCodigo = m.mapaUeLocCodigo
     WHERE m.prefCodigo = :prefCodigo AND m.mapaUeLocCodigo = :loc
       AND m.mapaUeQtdeAjuste > 0
       AND MONTH(m.mapaUeData) = :month AND YEAR(m.mapaUeData) = :year
     ORDER BY p.prodDescricao`,
    { prefCodigo, loc, month, year }
  );

  const ASSUNTO_LABELS = {
    1: "Produto",
    2: "Refeição",
    3: "Cardápio",
    4: "Entregas",
    5: "Lançamento de Estoque",
    6: "Inventário",
    7: "Estoque",
    8: "Sugestões",
    9: "Outros",
  };

  const [duvidas] = await pool.query(
    `SELECT perResData, perResAssunto, perResPergunta, perResResposta
     FROM trnsperguntaresposta
     WHERE prefCodigo = :prefCodigo AND perResLocCodigo = :loc
     ORDER BY perResData`,
    { prefCodigo, loc }
  );

  return {
    data: {
      local,
      dataCorrente: dataStr,
      consumo,
      estoque,
      entregas,
      ajustes,
      duvidas: duvidas.map((d) => ({
        ...d,
        perResAssuntoLabel: ASSUNTO_LABELS[d.perResAssunto] || d.perResAssunto,
      })),
    },
  };
}

export async function salvarMapaEstoqueQtdeFixa(prefCodigo, items, userName) {
  if (!Array.isArray(items) || !items.length) return { error: "Nenhum item para salvar" };
  let updated = 0;
  for (const item of items) {
    const estoUeCodigo = Number(item.estoUeCodigo);
    const qtde = Number(item.estoUEQtdeFixa);
    if (!estoUeCodigo) continue;
    const [result] = await pool.query(
      `UPDATE TRNSEstoqueUE SET estoUEQtdeFixa = :qtde, estoUeAlteracao = NOW(), estoUeUserName = :user
       WHERE prefCodigo = :prefCodigo AND estoUeCodigo = :estoUeCodigo`,
      { prefCodigo, estoUeCodigo, qtde: Number.isFinite(qtde) ? qtde : 0, user: userName || "web" }
    );
    updated += result.affectedRows;
  }
  return { data: { updated } };
}

export async function listQtdeFixaPorProduto(prefCodigo, prodCodigo) {
  const prod = Number(prodCodigo);
  if (!prod) return { error: "Informe o produto" };

  const [produto] = await pool.query(
    `SELECT p.prodCodigo, p.prodDescricao, u.uniDescricao
     FROM trnsprodutos p
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedEstocagem
     WHERE p.prefCodigo = :prefCodigo AND p.prodCodigo = :prod`,
    { prefCodigo, prod }
  );

  const [locais] = await pool.query(
    `SELECT l.locCodigo, l.locDescricao, e.estoUeCodigo, e.estoUeSaldo, e.estoUEQtdeFixa
     FROM trnslocal l
     LEFT JOIN TRNSEstoqueUE e ON e.prefCodigo = l.prefCodigo AND e.estoUeLocCodigo = l.locCodigo AND e.estoUeProdCodigo = :prod
     WHERE l.prefCodigo = :prefCodigo AND l.locStatus = 'A'
     ORDER BY l.locDescricao`,
    { prefCodigo, prod }
  );

  return { data: { produto: produto[0] ?? null, locais } };
}

export async function salvarQtdeFixa(prefCodigo, prodCodigo, items, userName) {
  const prod = Number(prodCodigo);
  if (!prod) return { error: "Informe o produto" };
  if (!Array.isArray(items)) return { error: "Lista de locais inválida" };

  let updated = 0;
  for (const item of items) {
    const locCodigo = Number(item.locCodigo);
    const qtde = Number(item.estoUEQtdeFixa);
    if (!locCodigo) continue;

    const [existing] = await pool.query(
      `SELECT estoUeCodigo FROM TRNSEstoqueUE
       WHERE prefCodigo = :prefCodigo AND estoUeLocCodigo = :loc AND estoUeProdCodigo = :prod`,
      { prefCodigo, loc: locCodigo, prod }
    );

    if (existing.length) {
      await pool.query(
        `UPDATE TRNSEstoqueUE SET estoUEQtdeFixa = :qtde, estoUeAlteracao = NOW(), estoUeUserName = :user
         WHERE prefCodigo = :prefCodigo AND estoUeCodigo = :estoUeCodigo`,
        { prefCodigo, estoUeCodigo: existing[0].estoUeCodigo, qtde: Number.isFinite(qtde) ? qtde : 0, user: userName || "web" }
      );
      updated += 1;
    } else {
      const [maxRows] = await pool.query(
        `SELECT COALESCE(MAX(estoUeCodigo), 0) + 1 AS n FROM TRNSEstoqueUE WHERE prefCodigo = :prefCodigo`,
        { prefCodigo }
      );
      await pool.query(
        `INSERT INTO TRNSEstoqueUE (prefCodigo, estoUeCodigo, estoUeLocCodigo, estoUeProdCodigo, estoUeSaldo, estoUeCadastro, estoUeAlteracao, estoUeUserName, estoUEQtdeFixa)
         VALUES (:prefCodigo, :cod, :loc, :prod, 0, NOW(), NOW(), :user, :qtde)`,
        {
          prefCodigo,
          cod: Number(maxRows[0].n),
          loc: locCodigo,
          prod,
          qtde: Number.isFinite(qtde) ? qtde : 0,
          user: userName || "web",
        }
      );
      updated += 1;
    }
  }
  return { data: { updated } };
}
