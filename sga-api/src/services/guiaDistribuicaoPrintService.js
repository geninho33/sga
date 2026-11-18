import { pool } from "../db.js";
import { fmtDateTimeBr, fmtValidadeBr } from "../utils/dateFormatBr.js";
import { loadPrefeituraLogo } from "./adminEntities.js";

function fmtNum(value, decimals = 4) {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function distUserDisplay(name) {
  const s = String(name ?? "");
  const pipe = s.indexOf("|");
  return pipe > 0 ? s.slice(0, pipe).trim() : s.trim();
}

const LOC_TIPO = {
  9: "Unidade Central",
  2: "Secretaria",
  1: "Centro Comunitário",
  6: "Creche",
  3: "Entidade Filantrópica",
  5: "Escola",
  8: "Pré-Escola",
};

async function loadLocalPrint(prefCodigo, locCodigo) {
  const [rows] = await pool.query(
    `SELECT l.locCodigo, l.locDescricao, l.locEndereco, l.locBairro, l.locTelefone,
            l.locTipoUnidade, l.locCodigoLargada, l.locVinculada,
            lv.locDescricao AS locVinculadaNome
     FROM trnslocal l
     LEFT JOIN trnslocal lv ON lv.prefCodigo = l.prefCodigo AND lv.locCodigo = l.locVinculada AND NOT (lv.locStatus <=> 'I')
     WHERE l.prefCodigo = :prefCodigo AND l.locCodigo = :locCodigo AND l.locStatus = 'A'`,
    { prefCodigo, locCodigo }
  );
  const loc = rows[0];
  if (!loc) return null;

  let descricao = loc.locDescricao || "";
  if (loc.locVinculada && loc.locVinculadaNome) {
    descricao += ` ( ${loc.locVinculadaNome} )`;
  }
  const tipo = LOC_TIPO[Number(loc.locTipoUnidade)];
  if (tipo) descricao += ` | Tipo: ${tipo}`;

  const codigoUnidade = loc.locCodigoLargada
    ? `Código : ${loc.locCodigoLargada}`
    : `Código : ${loc.locCodigo}`;

  return {
    descricao,
    enderecoBairro: [loc.locEndereco, loc.locBairro].filter(Boolean).join(" - "),
    telefone: loc.locTelefone || "",
    codigoUnidade,
  };
}

async function loadAtendimentoText(prefCodigo, remCodigo, locCodigo) {
  if (!remCodigo) return "";
  const [rows] = await pool.query(
    `SELECT ra.remAreEnsCodigo, ra.remAreEnsSequencial,
            (ra.remColesterol + ra.remDiabetico + ra.remNormal + ra.remGluten + ra.remLactose) AS total
     FROM trnsremessaatendimento ra
     WHERE ra.prefCodigo = :prefCodigo AND ra.remCodigo = :remCodigo AND ra.remLocal = :locCodigo
     ORDER BY ra.remLocal`,
    { prefCodigo, remCodigo, locCodigo }
  );
  if (!rows.length) return "";

  const parts = [];
  for (const row of rows) {
    const [areaRows] = await pool.query(
      `SELECT ae.AreEnsNome, et.AreEnsEtapaNome
       FROM trnsAreaEnsino ae
       LEFT JOIN trnsAreaEnsinoEtapa et
         ON et.prefCodigo = ae.prefCodigo AND et.AreEnsCodigo = ae.AreEnsCodigo
        AND et.AreEnsSequencial = :seq
       WHERE ae.prefCodigo = :prefCodigo AND ae.AreEnsCodigo = :codigo AND NOT (ae.ArenEnsStatus <=> 'I')`,
      { prefCodigo, codigo: row.remAreEnsCodigo, seq: row.remAreEnsSequencial }
    );
    const ar = areaRows[0];
    let label = (ar?.AreEnsNome || "").trim();
    if (ar?.AreEnsEtapaNome) label += ` - ${ar.AreEnsEtapaNome}`;
    parts.push(`${label} => ${row.total}`);
  }
  return parts.length ? `Atendimento : ${parts.join(" | ")}` : "";
}

async function loadItensPrint(prefCodigo, distCodigo) {
  const [rows] = await pool.query(
    `SELECT di.distItemProduto, p.prodDescricao, u.uniDescricao,
            p.prodPesoConsumo, p.prodObsConsumo, u.uniFracao,
            di.distItemQuantidade, di.distItemPesoTotal, di.distItemValidade, di.distItemLote
     FROM trnsdistribuicaoitens di
     INNER JOIN trnsprodutos p ON p.prefCodigo = di.prefCodigo AND p.prodCodigo = di.distItemProduto AND NOT (p.prodStatus <=> 'I')
     LEFT JOIN trnsunidades u ON u.prefCodigo = p.prefCodigo AND u.uniCodigo = p.prodUnidMedConsumo AND NOT (u.uniStatus <=> 'I')
     WHERE di.prefCodigo = :prefCodigo AND di.distCodigo = :distCodigo AND NOT (di.distItemStatus <=> 'I')
     ORDER BY p.prodDescricao`,
    { prefCodigo, distCodigo }
  );
  return rows.map((r) => {
    const obs = String(r.prodObsConsumo ?? "").trim();
    const fracao = String(r.uniFracao ?? "").trim();
    const pesoSuffix = obs || fracao;
    const pesoProduto =
      r.prodPesoConsumo != null && pesoSuffix
        ? `${fmtNum(r.prodPesoConsumo, 4)} ${pesoSuffix}`
        : r.prodPesoConsumo != null
          ? fmtNum(r.prodPesoConsumo, 4)
          : "";
    const descricao = r.uniDescricao ? `${r.prodDescricao} ( ${r.uniDescricao} )` : r.prodDescricao;
    return {
      codigo: r.distItemProduto,
      descricao,
      qtde: r.distItemQuantidade,
      peso: pesoProduto,
      pesoTotal: r.distItemPesoTotal,
      validade: r.distItemValidade,
      lote: r.distItemLote,
    };
  });
}

export async function loadGuiaDistribuicaoPrintData(prefCodigo, distCodigo) {
  const [distRows] = await pool.query(
    `SELECT d.*, lo.locDescricao AS distLocalOrigemNome, ld.locDescricao AS distLocalDestinoNome,
            dt.disTipDescricao, r.rotaDescricao
     FROM trnsdistribuicao d
     LEFT JOIN trnslocal lo ON lo.prefCodigo = d.prefCodigo AND lo.locCodigo = d.distLocalOrigem AND NOT (lo.locStatus <=> 'I')
     LEFT JOIN trnslocal ld ON ld.prefCodigo = d.prefCodigo AND ld.locCodigo = d.distLocalDestino AND NOT (ld.locStatus <=> 'I')
     LEFT JOIN trnsdistribuicaotipo dt
       ON dt.prefCodigo = d.prefCodigo AND dt.disTipNumero = d.distCodigoTipoRemessa AND dt.disTipStatus = 'A'
     LEFT JOIN trnsrota r ON r.prefCodigo = d.prefCodigo AND r.rotaCodigo = d.distRotaCodigo AND NOT (r.rotaStatus <=> 'I')
     WHERE d.prefCodigo = :prefCodigo AND d.distCodigo = :distCodigo AND d.distStatus = 'A'`,
    { prefCodigo, distCodigo }
  );
  const dist = distRows[0];
  if (!dist) return null;

  const [prefRows] = await pool.query(
    `SELECT prefNome, prefEstado FROM trnsprefeituras WHERE prefCodigo = :prefCodigo`,
    { prefCodigo }
  );
  const pref = prefRows[0] ?? {};
  const logo = await loadPrefeituraLogo(prefCodigo);
  const local = await loadLocalPrint(prefCodigo, dist.distLocalDestino);
  const atendimento = await loadAtendimentoText(prefCodigo, dist.distRemCodigo, dist.distLocalDestino);
  const itens = await loadItensPrint(prefCodigo, distCodigo);

  let dadosRemessa = "";
  if (dist.distRemCodigo) {
    dadosRemessa = ` | Remessa: ${dist.distRemCodigo}`;
    if (dist.distPeriodo) dadosRemessa += ` | Período Base:${dist.distPeriodo}`;
  }

  const hoje = fmtDateTimeBr(new Date());
  const subtitulo =
    `Guia:${dist.distCodigo}${dadosRemessa}` +
    `  | Data de Emissão : ${hoje}` +
    `  | Criado em ${fmtDateTimeBr(dist.distDataCadastro)}` +
    `  | Usuário : ${distUserDisplay(dist.distUserName)}`;

  let rotaTipo = dist.rotaDescricao ? `Rota : ${dist.rotaDescricao}` : "";
  if (dist.disTipDescricao) {
    rotaTipo += (rotaTipo ? " | " : "") + `Tipo de Remessa : ${dist.disTipDescricao}`;
  }

  return {
    dist,
    pref,
    logo,
    local,
    atendimento,
    itens,
    titulo: "Guia de Remessa e Recebimento de Alimentos",
    subtitulo,
    rotaTipo,
    observacao: dist.distObservacao || "",
    autorizacaoGo:
      pref.prefEstado === "GO"
        ? "Autorizado o uso em substituição à nota fiscal pelo despacho n. 315/85 GF 09/05/85 do Secretário de Fazenda do Estado de Goiás."
        : "",
  };
}

function buildSection(data) {
  const logoSrc = data.logo?.buffer?.length
    ? `data:${data.logo.mime || "image/jpeg"};base64,${data.logo.buffer.toString("base64")}`
    : null;

  const itemRows = data.itens
    .map(
      (i) => `<tr>
      <td class="c">${esc(i.codigo)}</td>
      <td class="l">${esc(i.descricao)}</td>
      <td class="r">${esc(fmtNum(i.qtde, 4))}</td>
      <td class="r">${esc(i.peso)}</td>
      <td class="r">${esc(fmtNum(i.pesoTotal, 4))}</td>
      <td class="c">${esc(fmtValidadeBr(i.validade))}</td>
      <td class="c">${esc(i.lote || "")}</td>
    </tr>`
    )
    .join("");

  const localBlock = data.local
    ? `<div class="unidade">
        <div><strong>${esc(data.local.descricao)}</strong></div>
        <div>${esc(data.local.enderecoBairro)}</div>
        <div>${esc(data.local.codigoUnidade)}${data.local.telefone ? ` · Fone: ${esc(data.local.telefone)}` : ""}</div>
      </div>`
    : `<div class="unidade"><strong>${esc(data.dist.distLocalDestinoNome || data.dist.distLocalDestino)}</strong></div>`;

  return `
  <section class="guia-section">
    <div class="top">${logoSrc ? `<img src="${logoSrc}" alt="Logo" />` : `<div class="pref-nome">${esc(data.pref.prefNome || "")}</div>`}</div>
    <div class="title">${esc(data.titulo)}</div>
    <div class="subtitle">${esc(data.subtitulo)}</div>
    ${data.rotaTipo ? `<div class="rota">${esc(data.rotaTipo)}</div>` : ""}
    ${localBlock}
    ${data.atendimento ? `<div class="atendimento">${esc(data.atendimento)}</div>` : ""}
    <table class="grid">
      <thead>
        <tr>
          <th>Cód.</th>
          <th>Descrição</th>
          <th>Qtde</th>
          <th>Peso</th>
          <th>Peso Total</th>
          <th>Validade</th>
          <th>Lote</th>
        </tr>
      </thead>
      <tbody>${itemRows || `<tr><td colspan="7" class="c">Nenhum item</td></tr>`}</tbody>
    </table>
    ${data.observacao ? `<div class="obs"><strong>Observação:</strong> ${esc(data.observacao)}</div>` : ""}
    <div class="assinatura">
      <div class="linha"></div>
      <div>Assinatura do Responsável pelo Recebimento</div>
    </div>
    ${data.autorizacaoGo ? `<div class="go">${esc(data.autorizacaoGo)}</div>` : ""}
  </section>`;
}

export function buildGuiaDistribuicaoPrintHtml(data, { duasVias = false } = {}) {
  const section = buildSection(data);
  const separator = duasVias ? `<div class="via-sep"><hr /></div>` : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Guia de Distribuição ${esc(data.dist.distCodigo)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; orientation: portrait; }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", "Microsoft Sans Serif", Arial, sans-serif; font-size: 9.75pt; color: #000; margin: 0; padding: 12px; }
    .top { text-align: center; margin-bottom: 6px; min-height: 48px; }
    .top img { max-height: 48px; max-width: 150px; }
    .pref-nome { font-weight: bold; font-size: 11pt; }
    .title { text-align: center; font-size: 14pt; font-weight: bold; font-style: italic; margin: 6px 0; }
    .subtitle, .rota { text-align: center; font-size: 8.5pt; margin: 4px 0; line-height: 1.35; }
    .unidade { margin: 10px 0; font-size: 9pt; line-height: 1.4; }
    .atendimento { margin: 6px 0 10px; font-size: 9pt; font-weight: bold; }
    .grid { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 8.25pt; margin-top: 6px; }
    .grid th, .grid td { border: 1px solid #000; padding: 3px 4px; vertical-align: middle; word-wrap: break-word; }
    .grid th { font-size: 9pt; font-weight: bold; text-align: center; }
    .grid .c { text-align: center; }
    .grid .l { text-align: left; }
    .grid .r { text-align: right; }
    .obs { margin-top: 10px; font-size: 9pt; }
    .assinatura { margin-top: 28px; text-align: center; font-size: 9pt; }
    .assinatura .linha { border-top: 1px solid #000; width: 280px; margin: 0 auto 6px; }
    .go { margin-top: 12px; font-size: 8pt; text-align: justify; }
    .via-sep { margin: 18px 0; page-break-inside: avoid; }
    .via-sep hr { border: none; border-top: 2px dashed #666; }
    .guia-section { page-break-inside: avoid; }
    @media print {
      @page { size: A4 portrait; margin: 10mm; orientation: portrait; }
      html, body { width: 210mm; max-width: 210mm; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${section}
  ${duasVias ? separator + section : ""}
  <script>window.onload=()=>window.print()</script>
</body>
</html>`;
}

export async function renderGuiaDistribuicaoPrintHtml(prefCodigo, distCodigo, opts = {}) {
  const data = await loadGuiaDistribuicaoPrintData(prefCodigo, distCodigo);
  if (!data) return null;
  return buildGuiaDistribuicaoPrintHtml(data, { duasVias: opts.duasVias === true });
}
