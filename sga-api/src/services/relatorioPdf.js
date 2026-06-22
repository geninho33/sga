import PDFDocument from "pdfkit";
import { fmtDateTimeBr } from "../utils/dateFormatBr.js";

const PAGE = { margin: 36, width: 842, height: 595 };
const FOOTER_H = 18;
const MIN_ROW_H = 12;
const HEADER_ROW_H = 18;

function fmtNum(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return String(n ?? "");
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

function resolveColWidths(columns, usable) {
  const fixed = columns.reduce((s, c) => s + (typeof c.width === "number" ? c.width : 0), 0);
  const flexWeight = columns.reduce((s, c) => s + (typeof c.width === "number" ? 0 : c.weight ?? 1), 0);
  const flexSpace = Math.max(0, usable - fixed);
  return columns.map((col) => {
    if (typeof col.width === "number") return col.width;
    const w = (flexSpace * (col.weight ?? 1)) / (flexWeight || 1);
    return Math.max(28, w);
  });
}

function colX(widths, index) {
  return PAGE.margin + widths.slice(0, index).reduce((a, b) => a + b, 0);
}

function cellValue(col, row) {
  const val = col.format ? col.format(row[col.key], row) : row[col.key];
  return val == null || val === "" ? "—" : String(val);
}

function measureRowHeight(doc, columns, widths, row, fontSize) {
  doc.fontSize(fontSize);
  let maxH = MIN_ROW_H;
  columns.forEach((col, i) => {
    const text = cellValue(col, row);
    const w = Math.max(8, widths[i] - 4);
    const h = doc.heightOfString(text, { width: w, lineGap: 1 });
    maxH = Math.max(maxH, Math.ceil(h) + 4);
  });
  return maxH;
}

function drawTitleBlock(doc, title, subtitle) {
  let y = PAGE.margin;
  doc.font("Helvetica-Bold").fontSize(14).fillColor("#111").text(title, PAGE.margin, y, {
    width: PAGE.width - PAGE.margin * 2,
    align: "center",
  });
  y = doc.y + 4;
  if (subtitle) {
    doc.font("Helvetica").fontSize(9).fillColor("#444").text(subtitle, PAGE.margin, y, {
      width: PAGE.width - PAGE.margin * 2,
      align: "center",
    });
    y = doc.y + 6;
  } else {
    y += 4;
  }
  doc.fillColor("#111");
  return y;
}

function drawTableHeader(doc, columns, widths, y, fontSize) {
  doc.font("Helvetica-Bold").fontSize(fontSize);
  columns.forEach((col, i) => {
    doc.text(col.label, colX(widths, i), y, {
      width: widths[i] - 4,
      lineBreak: false,
      ellipsis: true,
    });
  });
  y += HEADER_ROW_H;
  doc.moveTo(PAGE.margin, y).lineTo(PAGE.width - PAGE.margin, y).strokeColor("#999").stroke();
  return y + 4;
}

function drawRow(doc, columns, widths, row, y, fontSize) {
  doc.font("Helvetica").fontSize(fontSize);
  const rh = measureRowHeight(doc, columns, widths, row, fontSize);
  columns.forEach((col, i) => {
    const text = cellValue(col, row);
    const w = Math.max(8, widths[i] - 4);
    const opts = { width: w, lineGap: 1 };
    if (!col.wrap) opts.ellipsis = true;
    doc.text(text, colX(widths, i), y, opts);
  });
  return y + rh;
}

function drawFooters(doc) {
  const range = doc.bufferedPageRange();
  const emitido = fmtDateTimeBr(new Date());
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const pageNum = i - range.start + 1;
    const total = range.count;
    doc.font("Helvetica").fontSize(7).fillColor("#666");
    doc.text(`Emitido em ${emitido}`, PAGE.margin, PAGE.height - PAGE.margin + 4, {
      width: (PAGE.width - PAGE.margin * 2) * 0.6,
      align: "left",
      lineBreak: false,
    });
    doc.text(`Página ${pageNum} de ${total}`, PAGE.margin, PAGE.height - PAGE.margin + 4, {
      width: PAGE.width - PAGE.margin * 2,
      align: "right",
      lineBreak: false,
    });
  }
  doc.fillColor("#111");
}

/**
 * Gera PDF tabular (paisagem) com quebra de página, colunas proporcionais e texto multilinha.
 */
export function renderTablePdf({ title, subtitle, columns, rows, fontSize = 7 }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [PAGE.width, PAGE.height],
      margin: PAGE.margin,
      bufferPages: true,
      autoFirstPage: true,
    });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const usable = PAGE.width - PAGE.margin * 2;
    const widths = resolveColWidths(columns, usable);
    const bottomLimit = PAGE.height - PAGE.margin - FOOTER_H;

    let y = drawTitleBlock(doc, title, subtitle);
    const tableTop = y;
    y = drawTableHeader(doc, columns, widths, y, fontSize + 1);

    for (const row of rows) {
      const rh = measureRowHeight(doc, columns, widths, row, fontSize);
      if (y + rh > bottomLimit && y > tableTop + HEADER_ROW_H + 4) {
        doc.addPage({ size: [PAGE.width, PAGE.height], margin: PAGE.margin });
        y = PAGE.margin;
        y = drawTableHeader(doc, columns, widths, y, fontSize + 1);
      }
      y = drawRow(doc, columns, widths, row, y, fontSize);
    }

    drawFooters(doc);
    doc.end();
  });
}

export { fmtDateTimeBr, fmtDateTimeBr as fmtDate, fmtNum };
