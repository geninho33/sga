import { pool } from "../db.js";
import { fmtDate, fmtNum, renderTablePdf } from "./relatorioPdf.js";

function defaultDateRange(body) {
  const end = body.dataFinal || new Date().toISOString().slice(0, 10);
  const d = new Date(end);
  d.setDate(d.getDate() - 60);
  const start = body.dataInicial || d.toISOString().slice(0, 10);
  return { start, end: `${String(end).slice(0, 10)} 23:59:59` };
}

export async function gerarRelatorioComprasPdf(prefCodigo, body = {}) {
  const { start, end } = defaultDateRange(body);
  const params = { prefCodigo, start, end };
  const where = [
    "n.prefCodigo = :prefCodigo",
    "NOT (n.notaStatus <=> 'I')",
    "NOT (p.prodStatus <=> 'I')",
    "NOT (f.forStatus <=> 'I')",
    "n.notaData >= :start",
    "n.notaData <= :end",
  ];
  if (body.prodCodigo) {
    where.push("ni.notaItemProduto = :prodCodigo");
    params.prodCodigo = Number(body.prodCodigo);
  }
  if (body.grupoCodigo) {
    where.push("p.prodTipo = :grupoCodigo");
    params.grupoCodigo = Number(body.grupoCodigo);
  }
  if (body.fornecedorCodigo) {
    where.push("n.notaFornecedor = :fornecedorCodigo");
    params.fornecedorCodigo = Number(body.fornecedorCodigo);
  }
  const order =
    body.ordem === "C"
      ? "n.notaData, n.notaCodigo, ni.notaItemProduto"
      : "n.notaData, n.notaCodigo, p.prodDescricao";

  const [rows] = await pool.query(
    `SELECT n.notaCodigo, n.notaData, n.notaNumero, n.notaSerie, f.forNome AS fornecedor,
            ni.notaItemProduto AS prodCodigo, p.prodDescricao AS produto,
            u.uniDescricao AS unidade, ni.notaItemQtde AS qtde, ni.notaItemValor AS valor,
            (ni.notaItemQtde * ni.notaItemValor) AS valorTotal,
            CASE n.notaStatus WHEN 'A' THEN 'Ativa' WHEN 'I' THEN 'Inativa' WHEN 'C' THEN 'Cancelada' ELSE n.notaStatus END AS situacao
     FROM trnsnota n
     JOIN trnsnotaitens ni ON ni.prefCodigo = n.prefCodigo AND ni.notaCodigo = n.notaCodigo
     LEFT JOIN trnsprodutos p ON p.prefCodigo = ni.prefCodigo AND p.prodCodigo = ni.notaItemProduto
     LEFT JOIN trnsfornecedores f ON f.prefCodigo = n.prefCodigo AND f.forCodigo = n.notaFornecedor
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedCompra AND NOT (u.uniStatus <=> 'I')
     WHERE ${where.join(" AND ")}
     ORDER BY ${order}`,
    params
  );

  return renderTablePdf({
    title: "Relatório de Compra de Produtos",
    subtitle: `Período: ${fmtDate(start)} a ${fmtDate(end)}`,
    columns: [
      { key: "notaCodigo", label: "Cód.", weight: 0.55 },
      { key: "notaData", label: "Data", weight: 1.05, format: fmtDate },
      { key: "notaNumero", label: "Nota", weight: 0.65 },
      { key: "fornecedor", label: "Fornecedor", weight: 1.85, wrap: true },
      { key: "produto", label: "Produto", weight: 1.75, wrap: true },
      { key: "unidade", label: "UN", weight: 0.55 },
      { key: "qtde", label: "Qtde", weight: 0.65, format: fmtNum },
      { key: "valorTotal", label: "Valor", weight: 0.75, format: fmtNum },
      { key: "situacao", label: "Sit.", weight: 0.55 },
    ],
    rows,
  });
}

export async function gerarRelatorioDistribuicaoUePdf(prefCodigo, body = {}) {
  const { start, end } = defaultDateRange(body);
  const situacaoData = body.situacaoData || "R";
  const params = { prefCodigo, start, end };
  const dateClause =
    situacaoData === "E"
      ? "d.distDataEnvio >= :start AND d.distDataEnvio <= :end"
      : situacaoData === "T"
        ? "((d.distDataEnvio >= :start AND d.distDataEnvio <= :end) OR (d.distDataRecepcao >= :start AND d.distDataRecepcao <= :end))"
        : "d.distDataRecepcao >= :start AND d.distDataRecepcao <= :end";

  const where = [
    "d.prefCodigo = :prefCodigo", "d.distStatus = 'A'", dateClause,
    "NOT (p.prodStatus <=> 'I')", "NOT (di.distItemStatus <=> 'I')",
    "NOT (lo.locStatus <=> 'I')", "NOT (ld.locStatus <=> 'I')",
  ];
  if (body.rotaCodigo) {
    where.push("d.distRotaCodigo = :rotaCodigo");
    params.rotaCodigo = Number(body.rotaCodigo);
  }
  if (body.localDestino) {
    where.push("d.distLocalDestino = :localDestino");
    params.localDestino = Number(body.localDestino);
  }
  if (body.prodCodigo) {
    where.push("di.distItemProduto = :prodCodigo");
    params.prodCodigo = Number(body.prodCodigo);
  }
  if (body.grupoCodigo) {
    where.push("p.prodTipo = :grupoCodigo");
    params.grupoCodigo = Number(body.grupoCodigo);
  }

  const [rows] = await pool.query(
    `SELECT d.distCodigo, d.distDataEnvio, d.distDataRecepcao,
            lo.locDescricao AS origem, ld.locDescricao AS destino,
            p.prodDescricao AS produto, u.uniDescricao AS unidade,
            di.distItemQuantidade AS qtde, di.distItemPesoTotal AS pesoTotal
     FROM trnsdistribuicao d
     JOIN trnsdistribuicaoitens di ON di.prefCodigo = d.prefCodigo AND di.distCodigo = d.distCodigo
     LEFT JOIN trnsprodutos p ON p.prefCodigo = di.prefCodigo AND p.prodCodigo = di.distItemProduto
     LEFT JOIN trnslocal lo ON lo.prefCodigo = d.prefCodigo AND lo.locCodigo = d.distLocalOrigem
     LEFT JOIN trnslocal ld ON ld.prefCodigo = d.prefCodigo AND ld.locCodigo = d.distLocalDestino
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedConsumo AND NOT (u.uniStatus <=> 'I')
     WHERE ${where.join(" AND ")}
     ORDER BY d.distRotaCodigo, d.distLocalDestino`,
    params
  );

  return renderTablePdf({
    title: "Relatório de Distribuição de Produtos",
    subtitle: `Período: ${fmtDate(start)} a ${fmtDate(end)}`,
    columns: [
      { key: "distCodigo", label: "Guia", weight: 0.6 },
      { key: "distDataEnvio", label: "Envio", weight: 1.0, format: fmtDate },
      { key: "distDataRecepcao", label: "Recep.", weight: 1.0, format: fmtDate },
      { key: "origem", label: "Origem", weight: 1.2, wrap: true },
      { key: "destino", label: "Destino", weight: 1.2, wrap: true },
      { key: "produto", label: "Produto", weight: 1.5, wrap: true },
      { key: "qtde", label: "Qtde", weight: 0.65, format: fmtNum },
      { key: "pesoTotal", label: "Peso", weight: 0.65, format: fmtNum },
    ],
    rows,
  });
}

export async function gerarRelatorioDistribuicaoRotaPdf(prefCodigo, body = {}) {
  const { start, end } = defaultDateRange(body);
  const prodIds = (body.produtoIds || []).map(Number).filter(Boolean);
  if (!prodIds.length) throw new Error("Selecione ao menos um produto");

  const params = { prefCodigo, start, end };
  const where = [
    "d.prefCodigo = :prefCodigo",
    "d.distStatus = 'A'",
    "d.distDataEnvio >= :start",
    "d.distDataEnvio <= :end",
    "NOT (p.prodStatus <=> 'I')",
    "NOT (di.distItemStatus <=> 'I')",
    `di.distItemProduto IN (${prodIds.map((_, i) => `:p${i}`).join(",")})`,
  ];
  prodIds.forEach((id, i) => {
    params[`p${i}`] = id;
  });
  if (body.rotaCodigo) {
    where.push("d.distRotaCodigo = :rotaCodigo");
    params.rotaCodigo = Number(body.rotaCodigo);
  }

  const [rows] = await pool.query(
    `SELECT di.distItemProduto AS prodCodigo, p.prodDescricao AS produto,
            r.rotaDescricao AS rota, u.uniDescricao AS unidade,
            SUM(di.distItemQuantidade) AS qtde, SUM(di.distItemPesoTotal) AS pesoTotal
     FROM trnsdistribuicao d
     JOIN trnsdistribuicaoitens di ON di.prefCodigo = d.prefCodigo AND di.distCodigo = d.distCodigo
     JOIN trnsrota r ON r.prefCodigo = d.prefCodigo AND r.rotaCodigo = d.distRotaCodigo AND NOT (r.rotaStatus <=> 'I')
     LEFT JOIN trnsprodutos p ON p.prefCodigo = di.prefCodigo AND p.prodCodigo = di.distItemProduto
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedConsumo AND NOT (u.uniStatus <=> 'I')
     WHERE ${where.join(" AND ")}
     GROUP BY di.distItemProduto, p.prodDescricao, r.rotaDescricao, u.uniDescricao
     ORDER BY produto, rota`,
    params
  );

  return renderTablePdf({
    title: "Relatório de Distribuição de Produtos por Rota",
    subtitle: `Período: ${fmtDate(start)} a ${fmtDate(end)}`,
    columns: [
      { key: "prodCodigo", label: "Cód.", weight: 0.6 },
      { key: "produto", label: "Produto", weight: 2.0, wrap: true },
      { key: "rota", label: "Rota", weight: 1.2, wrap: true },
      { key: "unidade", label: "UN", weight: 0.55 },
      { key: "qtde", label: "Qtde", weight: 0.7, format: fmtNum },
      { key: "pesoTotal", label: "Peso", weight: 0.7, format: fmtNum },
    ],
    rows,
  });
}

export async function gerarRelatorioEntradasSaidasUePdf(prefCodigo, body = {}) {
  const { start, end } = defaultDateRange(body);
  const prodIds = (body.produtoIds || []).map(Number).filter(Boolean);
  if (!prodIds.length) throw new Error("Selecione ao menos um produto");
  const tipo = body.tipo || "T";
  const locCodigo = Number(body.locCodigo) || 0;

  const locWhere = locCodigo ? "AND l.locCodigo = :locCodigo" : "";
  const params = { prefCodigo, start, end };
  if (locCodigo) params.locCodigo = locCodigo;

  const [locais] = await pool.query(
    `SELECT l.locCodigo, l.locDescricao FROM trnslocal l
     WHERE l.prefCodigo = :prefCodigo AND l.locStatus = 'A' ${locWhere}
     ORDER BY l.locDescricao`,
    params
  );

  const rows = [];
  const [produtos] = await pool.query(
    `SELECT prodCodigo FROM trnsprodutos
     WHERE prefCodigo = ? AND prodCodigo IN (?) AND NOT (prodStatus <=> 'I')`,
    [prefCodigo, prodIds]
  );
  for (const loc of locais) {
    for (const { prodCodigo } of produtos) {
      if (tipo === "T" || tipo === "E") {
        const [ent] = await pool.query(
          `SELECT d.distDataEnvio AS movData, 'Entrada' AS movTipo, 'Distribuição' AS movDados,
                  di.distItemQuantidade AS movQtde
           FROM trnsdistribuicao d
           JOIN trnsdistribuicaoitens di ON di.prefCodigo = d.prefCodigo AND di.distCodigo = d.distCodigo
           WHERE d.prefCodigo = :prefCodigo AND d.distLocalDestino = :locCodigo
             AND di.distItemProduto = :prodCodigo AND d.distReceber = 'S' AND d.distStatus = 'A'
             AND NOT (di.distItemStatus <=> 'I')
             AND d.distDataEnvio >= :start AND d.distDataEnvio <= :end`,
          { prefCodigo, locCodigo: loc.locCodigo, prodCodigo, start, end }
        );
        for (const r of ent) {
          rows.push({ unidade: loc.locDescricao, prodCodigo, ...r });
        }
      }
      if (tipo === "T" || tipo === "S") {
        const [sai] = await pool.query(
          `SELECT m.mapaUeData AS movData, 'Saída' AS movTipo, 'Mapa Consumo' AS movDados,
                  m.mapaUeQuantidade AS movQtde
           FROM trnsmapaue m
           WHERE m.prefCodigo = :prefCodigo AND m.mapaUeLocCodigo = :locCodigo
             AND m.mapaUeProdCodigo = :prodCodigo
             AND m.mapaUeData >= :start AND m.mapaUeData <= :end AND m.mapaUeQuantidade > 0`,
          { prefCodigo, locCodigo: loc.locCodigo, prodCodigo, start, end }
        );
        for (const r of sai) {
          rows.push({ unidade: loc.locDescricao, prodCodigo, ...r });
        }
      }
    }
  }

  return renderTablePdf({
    title: "Relatório de Entrada e Saída de Produto(s)",
    subtitle: `Período: ${fmtDate(start)} a ${fmtDate(end)}`,
    columns: [
      { key: "unidade", label: "Unidade", weight: 1.4, wrap: true },
      { key: "prodCodigo", label: "Prod.", weight: 0.55 },
      { key: "movData", label: "Data", weight: 1.0, format: fmtDate },
      { key: "movTipo", label: "Tipo", weight: 0.65 },
      { key: "movDados", label: "Origem", weight: 1.0, wrap: true },
      { key: "movQtde", label: "Qtde", weight: 0.65, format: fmtNum },
    ],
    rows,
  });
}

export async function gerarRelatorioSaldoPdf(prefCodigo, body = {}) {
  const where = ["p.prefCodigo = :prefCodigo", "p.prodStatus = 'A'"];
  const params = { prefCodigo };
  if (body.comSaldo === true || body.comSaldo === "1") {
    where.push("p.prodSaldo > 0");
  }
  const [rows] = await pool.query(
    `SELECT p.prodCodigo, g.prodGrupdescricao AS tipo, p.prodDescricao, u.uniDescricao AS unidade, p.prodSaldo
     FROM trnsprodutos p
     LEFT JOIN trnsprodutosgrupo g ON g.prodGrupCodigo = p.prodTipo AND NOT (g.prodGrupStatus <=> 'I')
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedCompra AND NOT (u.uniStatus <=> 'I')
     WHERE ${where.join(" AND ")}
     ORDER BY g.prodGrupCodigo, p.prodDescricao`,
    params
  );
  return renderTablePdf({
    title: "Relatório de Saldo de Estoque",
    subtitle: `Emitido em ${fmtDate(new Date())}`,
    columns: [
      { key: "prodCodigo", label: "Cód.", weight: 0.6 },
      { key: "tipo", label: "Tipo", weight: 1.0, wrap: true },
      { key: "prodDescricao", label: "Produto", weight: 2.2, wrap: true },
      { key: "unidade", label: "UN", weight: 0.55 },
      { key: "prodSaldo", label: "Saldo", weight: 0.75, format: fmtNum },
    ],
    rows,
  });
}
