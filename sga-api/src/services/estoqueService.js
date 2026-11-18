import { pool } from "../db.js";
import { paginatedList } from "./listQuery.js";
import { nextCode } from "./cadastroEntities.js";
import { lancarEstoqueAjuste } from "./estoqueAjusteService.js";

function parseSort(query, map, def) {
  const orderBy = map[query.orderBy] || def;
  const orderDir = String(query.orderDir || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
  return { orderBy, orderDir };
}

/** Posição de estoque — trnsprodutosposicaoWW */
export async function listPosicaoEstoque(prefCodigo, query = {}) {
  const where = ["p.prodStatus = 'A'"];
  const params = {};
  const q = String(query.q || "").trim();
  if (q) {
    where.push("(p.prodDescricao LIKE :q OR CAST(p.prodCodigo AS CHAR) LIKE :q)");
    params.q = `%${q}%`;
  }
  const tipo = String(query.prodTipo ?? "").trim();
  if (tipo) {
    where.push("p.prodTipo = :prodTipo");
    params.prodTipo = Number(tipo);
  }
  const sort = parseSort(
    query,
    {
      prodCodigo: "p.prodCodigo",
      prodDescricao: "p.prodDescricao",
      prodSaldo: "p.prodSaldo",
      prodQtdeMinimo: "p.prodQtdeMinimo",
      prodQtdeMaximo: "p.prodQtdeMaximo",
      prodGrupdescricao: "g.prodGrupdescricao",
      uniDescricao: "u.uniDescricao",
      prodPrograma: "p.prodPrograma",
    },
    "p.prodPrograma"
  );
  return paginatedList(pool, {
    select: `p.prodCodigo, p.prodDescricao, p.prodSaldo, p.prodQtdeMinimo, p.prodQtdeMaximo,
             p.prodTipo, g.prodGrupdescricao, p.prodUnidMedCompra, u.uniDescricao,
             CASE
               WHEN p.prodSaldo > p.prodQtdeMaximo AND p.prodQtdeMaximo > 0 THEN 'excesso'
               WHEN p.prodSaldo < p.prodQtdeMinimo AND p.prodQtdeMinimo > 0 THEN 'falta'
               ELSE ''
             END AS prodSaldoSituacao`,
    from: `FROM trnsprodutos p
           LEFT JOIN trnsprodutosgrupo g ON g.prodGrupCodigo = p.prodTipo AND NOT (g.prodGrupStatus <=> 'I')
           LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedCompra AND NOT (u.uniStatus <=> 'I')`,
    alias: "p",
    where,
    params,
    prefCodigo,
    prefColumn: "prefCodigo",
    orderBy: sort.orderBy,
    orderDir: sort.orderDir,
    page: query.page,
    limit: query.limit,
  });
}

/** Saldo de produtos — trnsprodutosSaldoWW */
export async function listSaldoEstoque(prefCodigo, query = {}) {
  const where = ["p.prodStatus = 'A'"];
  const params = {};
  const q = String(query.q || "").trim();
  if (q) {
    where.push("(p.prodDescricao LIKE :q OR CAST(p.prodCodigo AS CHAR) LIKE :q)");
    params.q = `%${q}%`;
  }
  if (query.comSaldo === "1" || query.comSaldo === "true") {
    where.push("p.prodSaldo > 0");
  }
  const sort = parseSort(
    query,
    {
      prodCodigo: "p.prodCodigo",
      prodDescricao: "p.prodDescricao",
      prodSaldo: "p.prodSaldo",
      prodGrupdescricao: "g.prodGrupdescricao",
      uniDescricao: "u.uniDescricao",
      prodTipo: "p.prodTipo",
    },
    "p.prodDescricao"
  );
  return paginatedList(pool, {
    select: `p.prodCodigo, p.prodDescricao, p.prodSaldo, p.prodTipo, g.prodGrupdescricao,
             p.prodUnidMedCompra, u.uniDescricao`,
    from: `FROM trnsprodutos p
           LEFT JOIN trnsprodutosgrupo g ON g.prodGrupCodigo = p.prodTipo AND NOT (g.prodGrupStatus <=> 'I')
           LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedCompra AND NOT (u.uniStatus <=> 'I')`,
    alias: "p",
    where,
    params,
    prefCodigo,
    prefColumn: "prefCodigo",
    orderBy: sort.orderBy,
    orderDir: sort.orderDir,
    page: query.page,
    limit: query.limit,
  });
}

/** Lista de ajustes — trnsajusteWW */
export async function listAjustes(prefCodigo, query = {}) {
  const where = [];
  const params = {};
  const q = String(query.q || "").trim();
  if (q) {
    where.push("(t.tipajuNome LIKE :q OR l.locDescricao LIKE :q OR CAST(a.ajusCodigo AS CHAR) LIKE :q)");
    params.q = `%${q}%`;
  }
  const status = query.status;
  if (status === "A" || status === "C" || status === "L") {
    where.push("a.ajusStatus = :status");
    params.status = status;
  }
  const sort = parseSort(
    query,
    {
      ajusCodigo: "a.ajusCodigo",
      ajusData: "a.ajusData",
      tipajuNome: "t.tipajuNome",
      tipajuAcao: "t.tipajuAcao",
      locDescricao: "l.locDescricao",
    },
    "t.tipajuNome"
  );
  return paginatedList(pool, {
    select: `a.ajusCodigo, a.ajusData, a.tipajuCodigo, t.tipajuNome, t.tipajuAcao,
             a.ajusLocaCodigo, l.locDescricao AS ajusLocaDescricao, a.ajusStatus, a.ajusOBS`,
    from: `FROM trnsajuste a
           LEFT JOIN tipoajuste t ON t.prefCodigo = a.prefCodigo AND t.tipajuCodigo = a.tipajuCodigo
           LEFT JOIN trnslocal l ON l.prefCodigo = a.prefCodigo AND l.locCodigo = a.ajusLocaCodigo AND NOT (l.locStatus <=> 'I')`,
    alias: "a",
    where,
    params,
    prefCodigo,
    prefColumn: "prefCodigo",
    orderBy: sort.orderBy,
    orderDir: sort.orderDir,
    page: query.page,
    limit: query.limit,
  });
}

async function loadDepositoLocal(prefCodigo) {
  const [rows] = await pool.query(
    `SELECT prefLocalDeposito FROM trnsprefeituras WHERE prefCodigo = :prefCodigo`,
    { prefCodigo }
  );
  return Number(rows[0]?.prefLocalDeposito) || 1;
}

/** Inventário — busca produtos WPInventario */
export async function buscarInventario(prefCodigo, query = {}) {
  const where = ["p.prefCodigo = :prefCodigo", "p.prodStatus = 'A'", "p.prodDescricao <> ''"];
  const params = { prefCodigo };
  const grupo = String(query.grupo ?? "").trim();
  if (grupo) {
    where.push("p.prodTipo = :grupo");
    params.grupo = Number(grupo);
  }
  const classificacao = String(query.classificacao ?? "").trim();
  if (classificacao) {
    where.push("p.prodClassificacao = :classificacao");
    params.classificacao = Number(classificacao);
  }
  const nome = String(query.nome ?? query.q ?? "").trim();
  if (nome) {
    where.push("p.prodDescricao LIKE :nome");
    params.nome = `%${nome}%`;
  }
  const locCodigo = await loadDepositoLocal(prefCodigo);
  const [locRows] = await pool.query(
    `SELECT locDescricao FROM trnslocal WHERE prefCodigo = :prefCodigo AND locCodigo = :locCodigo`,
    { prefCodigo, locCodigo }
  );
  const localNome = locRows[0]?.locDescricao ?? "";
  const [rows] = await pool.query(
    `SELECT p.prodCodigo, p.prodDescricao, p.prodSaldo, p.prodQtdeMinimo, p.prodQtdeMaximo,
            g.prodGrupdescricao AS Grupo, u.uniDescricao AS UNCompra
     FROM trnsprodutos p
     LEFT JOIN trnsprodutosgrupo g ON g.prodGrupCodigo = p.prodTipo AND NOT (g.prodGrupStatus <=> 'I')
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedCompra AND NOT (u.uniStatus <=> 'I')
     WHERE ${where.join(" AND ")}
     ORDER BY p.prodDescricao
     LIMIT 500`,
    params
  );
  return {
    data: rows.map((r) => ({
      ...r,
      prodLocalSaldo: r.prodSaldo,
      prodLocalCodigo: locCodigo,
      LocalNome: localNome,
      QtdeMinimo: r.prodQtdeMinimo,
      QtdeMaximo: r.prodQtdeMaximo,
    })),
    meta: { localCodigo: locCodigo, localNome },
  };
}

/** Salva inventário — espelha salvarDados do WPInventario */
export async function salvarInventario(prefCodigo, items = [], userName = "web") {
  let quantidade = 0;
  for (const item of items) {
    const prodCodigo = Number(item.prodCodigo);
    const novaQtd = Number(item.prodLocalSaldo);
    if (!prodCodigo || Number.isNaN(novaQtd)) continue;
    const [prodRows] = await pool.query(
      `SELECT prodSaldo FROM trnsprodutos WHERE prefCodigo = :prefCodigo AND prodCodigo = :prodCodigo`,
      { prefCodigo, prodCodigo }
    );
    const saldoAtual = prodRows.length ? Number(prodRows[0].prodSaldo) : null;
    let ajusTipo;
    let ajusItemQuantidade;
    if (saldoAtual === null) {
      ajusTipo = "E";
      ajusItemQuantidade = novaQtd;
    } else if (novaQtd !== saldoAtual) {
      if (novaQtd > saldoAtual) {
        ajusTipo = "E";
        ajusItemQuantidade = novaQtd - saldoAtual;
      } else {
        ajusTipo = "S";
        ajusItemQuantidade = saldoAtual - novaQtd;
      }
    } else {
      continue;
    }
    const locCodigo = Number(item.prodLocalCodigo) || (await loadDepositoLocal(prefCodigo));
    await lancarInventarioItem(prefCodigo, {
      ajusTipo,
      prodLocalCodigo: locCodigo,
      prodCodigo,
      ajusItemQuantidade,
      ajusItemSaldo: novaQtd,
      userName,
    });
    quantidade += 1;
  }
  return {
    message:
      quantidade > 0
        ? "Atualização de inventário realizada com sucesso!"
        : "Nenhuma atualização foi registrada!",
    quantidade,
  };
}

/** Apuração — processar movimentações no período */
export async function processarApuracao(prefCodigo, query = {}) {
  const dtInicial = String(query.dtInicial || new Date().toISOString().slice(0, 10));
  const dtFinal = String(query.dtFinal || dtInicial);
  const classificacao = String(query.classificacao ?? "").trim();
  const prodCodigo = String(query.prodCodigo ?? "").trim();

  const prodWhere = ["p.prefCodigo = :prefCodigo", "p.prodStatus = 'A'"];
  const params = { prefCodigo, dtInicial, dtFinal: `${dtFinal.slice(0, 10)} 23:59:59` };
  if (classificacao) {
    prodWhere.push("p.prodClassificacao = :classificacao");
    params.classificacao = Number(classificacao);
  }
  if (prodCodigo) {
    prodWhere.push("p.prodCodigo = :prodCodigo");
    params.prodCodigo = Number(prodCodigo);
  }

  const [produtos] = await pool.query(
    `SELECT p.prodCodigo, p.prodDescricao, p.prodSaldo,
            uc.uniDescricao AS UNCompra, ud.uniDescricao AS UNDistribuicao
     FROM trnsprodutos p
     LEFT JOIN trnsunidades uc ON uc.prefCodigo = p.prefCodigo AND uc.uniCodigo = p.prodUnidMedCompra AND NOT (uc.uniStatus <=> 'I')
     LEFT JOIN trnsunidades ud ON ud.prefCodigo = p.prefCodigo AND ud.uniCodigo = p.prodUnidMedConsumo AND NOT (ud.uniStatus <=> 'I')
     WHERE ${prodWhere.join(" AND ")}
     ORDER BY p.prodCodigo`,
    params
  );

  const data = [];
  for (const p of produtos) {
    const pc = p.prodCodigo;
    const [[entNf]] = await pool.query(
      `SELECT COALESCE(SUM(ni.notaItemQtde), 0) AS qtd
       FROM trnsnota n JOIN trnsnotaitens ni ON ni.prefCodigo = n.prefCodigo AND ni.notaCodigo = n.notaCodigo
       WHERE n.prefCodigo = :prefCodigo AND ni.notaItemProduto = :pc
         AND n.notaData >= :dtInicial AND n.notaData <= :dtFinal AND n.notaStatus = 'A'`,
      { prefCodigo, pc, dtInicial, dtFinal: params.dtFinal }
    );
    const [[entRoman]] = await pool.query(
      `SELECT COALESCE(SUM(ri.romanItemQuantidade), 0) AS qtd
       FROM romaneio r JOIN romaneioitem ri ON ri.prefCodigo = r.prefCodigo AND ri.romanCodigo = r.romanCodigo
       WHERE r.prefCodigo = :prefCodigo AND ri.prodCodigo = :pc
         AND r.romanData >= :dtInicial AND r.romanData <= :dtFinal`,
      { prefCodigo, pc, dtInicial, dtFinal: params.dtFinal }
    );
    const [[entAjus]] = await pool.query(
      `SELECT COALESCE(SUM(ai.ajusItemQuantidade), 0) AS qtd
       FROM trnsajuste a JOIN trnsajusteitens ai ON ai.prefCodigo = a.prefCodigo AND ai.ajusCodigo = a.ajusCodigo
       WHERE a.prefCodigo = :prefCodigo AND ai.ajusItemProduto = :pc AND a.ajusTipo = 'E'
         AND a.ajusData >= :dtInicial AND a.ajusData <= :dtFinal AND a.ajusStatus = 'A'`,
      { prefCodigo, pc, dtInicial, dtFinal: params.dtFinal }
    );
    const [[saiDist]] = await pool.query(
      `SELECT COALESCE(SUM(di.distItemQuantidade), 0) AS qtd
       FROM trnsdistribuicao d JOIN trnsdistribuicaoitens di ON di.prefCodigo = d.prefCodigo AND di.distCodigo = d.distCodigo
       WHERE d.prefCodigo = :prefCodigo AND di.distItemProduto = :pc
         AND d.distDataEnvio >= :dtInicial AND d.distDataEnvio <= :dtFinal AND d.distStatus = 'A'`,
      { prefCodigo, pc, dtInicial, dtFinal: params.dtFinal }
    );
    const [[saiAjus]] = await pool.query(
      `SELECT COALESCE(SUM(ai.ajusItemQuantidade), 0) AS qtd
       FROM trnsajuste a JOIN trnsajusteitens ai ON ai.prefCodigo = a.prefCodigo AND ai.ajusCodigo = a.ajusCodigo
       WHERE a.prefCodigo = :prefCodigo AND ai.ajusItemProduto = :pc AND a.ajusTipo = 'S'
         AND a.ajusData >= :dtInicial AND a.ajusData <= :dtFinal AND a.ajusStatus = 'A'`,
      { prefCodigo, pc, dtInicial, dtFinal: params.dtFinal }
    );

    const qtdeEntrada = Number(entNf?.qtd || 0) + Number(entRoman?.qtd || 0) + Number(entAjus?.qtd || 0);
    const qtdeSaida = Number(saiDist?.qtd || 0) + Number(saiAjus?.qtd || 0);
    if (qtdeEntrada === 0 && qtdeSaida === 0) continue;

    data.push({
      prodCodigo: pc,
      prodDescricao: p.prodDescricao,
      UNCompra: p.UNCompra,
      UNDistribuicao: p.UNDistribuicao,
      qtdeEntrada,
      qtdeSaida,
      prodLocalSaldo: qtdeEntrada - qtdeSaida,
      QtdeMaximo: Number(p.prodSaldo),
      check: false,
    });
  }
  return { data };
}

/** Aplica saldo apurado nos produtos selecionados */
export async function aplicarApuracao(prefCodigo, items = [], userName = "web") {
  let quantidade = 0;
  for (const item of items.filter((i) => i.check)) {
    const saldoApurado = Number(item.prodLocalSaldo);
    const saldoAnterior = Number(item.QtdeMaximo);
    if (Number.isNaN(saldoApurado) || Number.isNaN(saldoAnterior)) continue;
    if (saldoApurado === saldoAnterior) continue;
    const diff = Math.abs(saldoApurado - saldoAnterior);
    const ajusTipo = saldoApurado > saldoAnterior ? "E" : "S";
    const locCodigo = await loadDepositoLocal(prefCodigo);
    await lancarInventarioItem(prefCodigo, {
      ajusTipo,
      prodLocalCodigo: locCodigo,
      prodCodigo: Number(item.prodCodigo),
      ajusItemQuantidade: diff,
      ajusItemSaldo: saldoApurado,
      userName,
      obsPrefix: "Apuração Entrada/Saída",
    });
    quantidade += 1;
  }
  return {
    message: quantidade > 0 ? `${quantidade} produto(s) atualizado(s).` : "Nenhum produto aplicado.",
    quantidade,
  };
}

/** Monitoramento UE — WPMonitorarLancamentoUE */
export async function listMonitoramentoUe(prefCodigo, query = {}) {
  const dataHoje = String(query.data || new Date().toISOString().slice(0, 10));
  const opcao = Number(query.opcaoBusca ?? 0);
  const tipoUnidade = Number(query.tipoUnidade ?? 0);

  const locWhere = ["l.prefCodigo = :prefCodigo", "l.locStatus = 'A'"];
  const params = { prefCodigo, dataHoje };
  if (tipoUnidade === 5) locWhere.push("l.locTipoUnidade = 5");
  else if (tipoUnidade === 6) locWhere.push("l.locTipoUnidade = 6");
  else if (tipoUnidade === 99) locWhere.push("l.locTipoUnidade NOT IN (5, 6)");

  const [rows] = await pool.query(
    `SELECT l.locCodigo, l.locDescricao,
            (SELECT COUNT(*) FROM TRNSEstoqueUE e
             WHERE e.prefCodigo = l.prefCodigo AND e.estoUeLocCodigo = l.locCodigo
               AND DATE(e.estoUeAlteracao) = :dataHoje) AS locAtividades
     FROM trnslocal l
     WHERE ${locWhere.join(" AND ")}
     ORDER BY l.locDescricao`,
    params
  );

  let data = rows;
  if (opcao === 1) data = rows.filter((r) => Number(r.locAtividades) > 0);
  if (opcao === 2) data = rows.filter((r) => Number(r.locAtividades) === 0);
  return { data, meta: { data: dataHoje, opcao, tipoUnidade } };
}

async function lancarInventarioItem(
  prefCodigo,
  { ajusTipo, prodLocalCodigo, prodCodigo, ajusItemQuantidade, ajusItemSaldo, userName, obsPrefix = "Inventário" }
) {
  const ajusCodigo = await nextCode(prefCodigo, "trnsajuste", "ajusCodigo");
  const obs = `${obsPrefix} Nr. : ${ajusCodigo} | ${userName}\nQuantidade Lançado Inventário : ${ajusItemSaldo}`;
  await pool.query(
    `INSERT INTO trnsajuste (
       ajusCodigo, prefCodigo, ajusData, ajusDataCadastro, ajusLocaCodigo,
       tipajuCodigo, ajusStatus, ajusOBS, ajusUserName, ajusTipo
     ) VALUES (
       :ajusCodigo, :prefCodigo, NOW(), NOW(), :ajusLocaCodigo,
       99, 'L', :ajusOBS, :userName, :ajusTipo
     )`,
    { ajusCodigo, prefCodigo, ajusLocaCodigo: prodLocalCodigo, ajusOBS: obs, userName, ajusTipo }
  );
  await pool.query(
    `INSERT INTO trnsajusteitens (prefCodigo, ajusCodigo, ajusItemProduto, ajusItemQuantidade, ajusItemTipo)
     VALUES (:prefCodigo, :ajusCodigo, :prodCodigo, :qtd, :ajusTipo)`,
    { prefCodigo, ajusCodigo, prodCodigo, qtd: ajusItemQuantidade, ajusTipo }
  );
  await lancarEstoqueAjuste(prefCodigo, {
    ajusCodigo,
    prodCodigo,
    locCodigo: prodLocalCodigo,
    quantidade: ajusItemQuantidade,
    ajusTipo,
    userName,
  });
}
