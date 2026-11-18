import { pool } from "../db.js";
import { fmtDateTimeBr, fmtValidadeBr } from "../utils/dateFormatBr.js";
import { loadPrefeituraLogo } from "./adminEntities.js";
import { listNotaItens } from "./logisticaEntities.js";

function fmtNum(value, decimals = 2) {
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

export async function loadNotaCompraPrintData(prefCodigo, notaCodigo) {
  const [notaRows] = await pool.query(
    `SELECT n.notaCodigo, n.notaNumero, n.notaSerie, n.notaData, f.forCodigo AS notaFornecedor, l.locCodigo AS notaLocal,
            n.notaStatus, n.notaUserName, n.notaDataCadastro,
            f.forNome AS notaFornecedorNome, l.locDescricao AS notaLocalNome
     FROM trnsnota n
     LEFT JOIN trnsfornecedores f ON f.prefCodigo = n.prefCodigo AND f.forCodigo = n.notaFornecedor AND NOT (f.forStatus <=> 'I')
     LEFT JOIN trnslocal l ON l.prefCodigo = n.prefCodigo AND l.locCodigo = n.notaLocal AND NOT (l.locStatus <=> 'I')
     WHERE n.prefCodigo = :prefCodigo AND n.notaCodigo = :notaCodigo AND NOT (n.notaStatus <=> 'I')`,
    { prefCodigo, notaCodigo }
  );
  const nota = notaRows[0] ?? null;
  if (!nota) return null;

  const itens = await listNotaItens(prefCodigo, notaCodigo);
  const logo = await loadPrefeituraLogo(prefCodigo);

  const notaTotal = itens.reduce(
    (s, i) => s + (Number(i.notaItemTotal) || Number(i.notaItemQtde) * Number(i.notaItemValor) || 0),
    0
  );

  return { nota: { ...nota, notaTotal }, itens, logo };
}

export function buildNotaCompraPrintHtml({ nota, itens, logo }) {
  const logoSrc = logo?.buffer?.length
    ? `data:${logo.mime || "image/jpeg"};base64,${logo.buffer.toString("base64")}`
    : null;

  const itemRows = itens.map((i) => {
    const total = Number(i.notaItemTotal) || Number(i.notaItemQtde) * Number(i.notaItemValor) || 0;
    return `<tr>
      <td class="c">${esc(i.notaItemProduto)}</td>
      <td class="l">${esc(i.notaItemProdutoDescricao || i.notaItemProduto)}</td>
      <td class="c">${esc(i.notaItemProdutoUnidadeDesc || i.notaItemProdutoUnidade || "")}</td>
      <td class="r">${esc(fmtNum(i.notaItemQtde, 4))}</td>
      <td class="r">${esc(fmtNum(i.notaItemValor, 2))}</td>
      <td class="r">${esc(fmtNum(total, 2))}</td>
      <td class="r">${esc(fmtValidadeBr(i.notaItemValidade))}</td>
      <td class="r">${esc(i.notaItemLote || "")}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Comprovante de Compra · Nota ${esc(nota.notaNumero)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", "Microsoft Sans Serif", Arial, sans-serif; font-size: 10pt; color: #000; margin: 0; padding: 16px; }
    .top { text-align: center; margin-bottom: 8px; min-height: 52px; position: relative; }
    .top img { max-height: 52px; max-width: 160px; }
    .title { text-align: center; font-size: 15.75pt; font-weight: bold; font-style: italic; margin: 8px 0 14px; }
    .hdr { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9.75pt; }
    .hdr td { padding: 3px 6px; vertical-align: top; }
    .hdr .lbl { font-weight: bold; white-space: nowrap; }
    .grid { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 8.25pt; }
    .grid th, .grid td { border: 1px solid #000; padding: 3px 4px; vertical-align: middle; }
    .grid th { font-size: 9.75pt; font-weight: bold; text-align: center; }
    .grid .c { text-align: center; }
    .grid .l { text-align: left; }
    .grid .r { text-align: right; }
    col.c-cod { width: 6%; }
    col.c-desc { width: 28%; }
    col.c-un { width: 11%; }
    col.c-qt { width: 8%; }
    col.c-vu { width: 11%; }
    col.c-vt { width: 11%; }
    col.c-val { width: 11%; }
    col.c-lote { width: 14%; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="top">${logoSrc ? `<img src="${logoSrc}" alt="Logo" />` : ""}</div>
  <div class="title">Comprovante de Compra</div>

  <table class="hdr">
    <tr>
      <td><span class="lbl">Dt Emissão :</span> ${esc(fmtDateTimeBr(nota.notaData))}</td>
      <td><span class="lbl">Número :</span> ${esc(nota.notaNumero)}</td>
      <td><span class="lbl">Série :</span> ${esc(nota.notaSerie)}</td>
      <td><span class="lbl">Fornecedor :</span> ${esc(nota.notaFornecedorNome || nota.notaFornecedor)}</td>
    </tr>
    <tr>
      <td><span class="lbl">Dt Recepção :</span> ${esc(fmtDateTimeBr(nota.notaDataCadastro))}</td>
      <td colspan="2"><span class="lbl">Recebedor :</span> ${esc(nota.notaUserName || "")}</td>
      <td><span class="lbl">Armazenamento :</span> ${esc(nota.notaLocalNome || nota.notaLocal || "")}</td>
    </tr>
    <tr>
      <td colspan="4"><span class="lbl">Valor Total :</span> ${esc(fmtNum(nota.notaTotal, 2))}</td>
    </tr>
  </table>

  <table class="grid">
    <colgroup>
      <col class="c-cod" /><col class="c-desc" /><col class="c-un" /><col class="c-qt" />
      <col class="c-vu" /><col class="c-vt" /><col class="c-val" /><col class="c-lote" />
    </colgroup>
    <thead>
      <tr>
        <th>Cód.</th>
        <th>Descrição</th>
        <th>UN</th>
        <th>Qtde</th>
        <th>Vlr Unitário</th>
        <th>Valor Total</th>
        <th>Validade</th>
        <th>Lote</th>
      </tr>
    </thead>
    <tbody>${itemRows || `<tr><td colspan="8" style="text-align:center">Nenhum item</td></tr>`}</tbody>
  </table>
  <script>window.onload = function(){ window.print(); };</script>
</body>
</html>`;
}

export async function renderNotaCompraPrintHtml(prefCodigo, notaCodigo) {
  const data = await loadNotaCompraPrintData(prefCodigo, notaCodigo);
  if (!data) return null;
  return buildNotaCompraPrintHtml(data);
}
