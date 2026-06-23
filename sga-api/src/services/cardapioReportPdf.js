import PDFDocument from "pdfkit";
import { macroPercentByGrams, roundNutrient } from "./cardapioNutrientesService.js";

/** A4 paisagem — tabela semanal (formato legado GeneXus). */
const PAGE = { margin: 28, width: 842, height: 595 };

const COLORS = {
  border: "#000000",
  headerBg: "#d9d9d9",
  text: "#111111",
  muted: "#444444",
};

const RODAPE_H = 58;
const MIN_ROW_H = 20;
const TABLE_HEAD_H = 18;

function pageOptions() {
  return { size: [PAGE.width, PAGE.height], margin: PAGE.margin };
}

function formatDateBr(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function macroPercents(resumo) {
  const r = resumo || {};
  const pct = r.macroPercentCarb != null
    ? { carbPct: r.macroPercentCarb, protPct: r.macroPercentProt, lipPct: r.macroPercentLip }
    : macroPercentByGrams(r);
  return {
    carb: `${roundNutrient(r.mediaCarboidratos, 2)} (${pct.carbPct}%)`,
    prot: `${roundNutrient(r.mediaProteinas, 2)} (${pct.protPct}%)`,
    lip: `${roundNutrient(r.mediaLipidios, 2)} (${pct.lipPct}%)`,
  };
}

function prefeituraTitulo(report) {
  const mun = report.prefeitura?.prefMunicipio || report.prefeitura?.prefNome || "";
  if (/prefeitura/i.test(mun)) return mun;
  return `Prefeitura do Município de ${mun}`;
}

function buildColWidths(headers) {
  const usable = PAGE.width - PAGE.margin * 2;
  const turnoW = 108;
  const obsW = headers.some((h) => h.isObs) ? 72 : 0;
  const dayCount = headers.filter((h) => !h.isObs).length;
  const dayW = dayCount > 0 ? (usable - turnoW - obsW) / dayCount : usable - turnoW;
  const widths = [turnoW];
  for (const h of headers) {
    widths.push(h.isObs ? obsW : dayW);
  }
  return widths;
}

function drawPageHeader(doc, report) {
  let y = PAGE.margin;
  const usable = PAGE.width - PAGE.margin * 2;
  let textX = PAGE.margin;

  if (report.prefeitura?.prefLogo?.length) {
    try {
      doc.image(Buffer.from(report.prefeitura.prefLogo), PAGE.margin, y, { fit: [56, 40] });
      textX = PAGE.margin + 62;
    } catch {
      /* logo inválido */
    }
  }

  const textW = PAGE.width - PAGE.margin - textX;
  doc.fontSize(11).fillColor(COLORS.text);
  doc.text(prefeituraTitulo(report), textX, y + 4, { width: textW, align: "center" });
  y += 30;

  doc.fontSize(9).fillColor(COLORS.text).text("Cardápio :", PAGE.margin, y);
  y += 12;

  const descricao = report.titulo || "";
  if (descricao) {
    doc.fontSize(8.5).fillColor(COLORS.muted).text(descricao, PAGE.margin, y, { width: usable, lineGap: 1 });
    y += doc.heightOfString(descricao, { width: usable, lineGap: 1 }) + 4;
  }

  if (report.subtitulo) {
    doc.fontSize(8.5).fillColor(COLORS.muted).text(report.subtitulo, PAGE.margin, y, { width: usable, lineGap: 1 });
    y += doc.heightOfString(report.subtitulo, { width: usable, lineGap: 1 }) + 4;
  }

  return y + 6;
}

function measureRowHeight(doc, turnoLabel, cells, colWidths) {
  const pad = 8;
  doc.fontSize(8);
  let h = doc.heightOfString(turnoLabel || "", { width: colWidths[0] - 6 }) + pad;
  for (let i = 0; i < cells.length; i++) {
    const ch = doc.heightOfString(cells[i] || "", { width: colWidths[i + 1] - 6, lineGap: 0 });
    h = Math.max(h, ch + pad);
  }
  return Math.max(MIN_ROW_H, h);
}

function drawTableRow(doc, labels, y, colWidths, opts = {}) {
  const { header = false, rowH } = opts;
  const h = rowH || TABLE_HEAD_H;
  let x = PAGE.margin;

  for (let i = 0; i < labels.length; i++) {
    const w = colWidths[i];
    if (header) {
      doc.rect(x, y, w, h).fillAndStroke(COLORS.headerBg, COLORS.border);
      doc.fontSize(7.5).fillColor(COLORS.text).text(labels[i] || "", x + 3, y + 4, {
        width: w - 6,
        align: i === 0 ? "left" : "center",
        lineGap: 0,
      });
    } else {
      doc.rect(x, y, w, h).stroke(COLORS.border);
      doc.fontSize(8).fillColor(COLORS.text).text(labels[i] || "", x + 3, y + 4, {
        width: w - 6,
        lineGap: 0,
      });
    }
    x += w;
  }

  return y + h;
}

function drawWeekTableHeader(doc, week, y, colWidths) {
  const labels = [week.tituloSemana, ...week.headers.map((h) => h.label)];
  return drawTableRow(doc, labels, y, colWidths, { header: true, rowH: TABLE_HEAD_H });
}

function bottomLimit(report) {
  const nutri = report.nutricionistas?.[0];
  return PAGE.height - PAGE.margin - (nutri ? RODAPE_H + 8 : 0);
}

function ensureSpace(doc, y, needed, report, repeatPageHeader) {
  if (y + needed <= bottomLimit(report)) return y;
  doc.addPage(pageOptions());
  return repeatPageHeader();
}

function drawWeekTables(doc, report, startY, repeatPageHeader) {
  let y = startY;

  for (const week of report.weeks || []) {
    if (!week.rows?.length) continue;

    const colWidths = buildColWidths(week.headers);
    const headerH = TABLE_HEAD_H;

    y = ensureSpace(doc, y, headerH + MIN_ROW_H, report, repeatPageHeader);

    let headerDrawn = false;
    const drawHeaderIfNeeded = () => {
      if (!headerDrawn) {
        y = drawWeekTableHeader(doc, week, y, colWidths);
        headerDrawn = true;
      }
    };

    drawHeaderIfNeeded();

    for (const row of week.rows) {
      const rowH = measureRowHeight(doc, row.turnoLabel, row.cells, colWidths);
      y = ensureSpace(doc, y, rowH, report, () => {
        const ny = repeatPageHeader();
        headerDrawn = false;
        return ny;
      });

      if (!headerDrawn) {
        drawHeaderIfNeeded();
      }

      const labels = [row.turnoLabel, ...row.cells];
      y = drawTableRow(doc, labels, y, colWidths, { rowH });
    }

    y += 10;
  }

  return y;
}

function drawResumoMacros(doc, resumo, y, report, repeatPageHeader) {
  if (!resumo) return y;

  const needed = 52;
  y = ensureSpace(doc, y, needed, report, repeatPageHeader);

  const usable = PAGE.width - PAGE.margin * 2;
  const headH = 16;
  const rowH = 18;
  const pct = macroPercents(resumo);

  doc.rect(PAGE.margin, y, usable, headH).fillAndStroke(COLORS.headerBg, COLORS.border);
  doc.fontSize(8).fillColor(COLORS.text).text(
    "Total de Macros e Micros Nutrientes - Média Semanal",
    PAGE.margin + 4,
    y + 4,
    { width: usable - 8, align: "center" }
  );
  y += headH;

  const cols = [
    { label: "Calorias kcal", value: roundNutrient(resumo.mediaCalorica, 2), w: usable * 0.25 },
    { label: "Carboidratos g", value: pct.carb, w: usable * 0.25 },
    { label: "Proteínas g", value: pct.prot, w: usable * 0.25 },
    { label: "Lipídios g", value: pct.lip, w: usable * 0.25 },
  ];

  let cx = PAGE.margin;
  for (const col of cols) {
    doc.rect(cx, y, col.w, rowH).stroke(COLORS.border);
    doc.fontSize(7).fillColor(COLORS.text).text(col.label, cx + 3, y + 3, { width: col.w - 6, align: "center" });
    cx += col.w;
  }
  y += rowH;

  cx = PAGE.margin;
  for (const col of cols) {
    doc.rect(cx, y, col.w, rowH).stroke(COLORS.border);
    doc.fontSize(8).fillColor(COLORS.text).text(col.value, cx + 3, y + 5, { width: col.w - 6, align: "center" });
    cx += col.w;
  }

  return y + rowH + 12;
}

function drawTabelaFnde(doc, resumo, y, report, repeatPageHeader) {
  if (!resumo) return y;

  const rows = [
    ["Valor Energético (Kcal)", roundNutrient(resumo.mediaCalorica, 2), "Kcal"],
    ["Carboidratos", roundNutrient(resumo.mediaCarboidratos, 2), "g"],
    ["Proteínas", roundNutrient(resumo.mediaProteinas, 2), "g"],
    ["Lipídios", roundNutrient(resumo.mediaLipidios, 2), "g"],
    ["Fibras", roundNutrient(resumo.mediaFibras, 2), "g"],
    ["Cálcio", roundNutrient(resumo.mediaCalcio, 2), "mg"],
    ["Ferro", roundNutrient(resumo.mediaFerro, 2), "mg"],
    ["Magnésio", roundNutrient(resumo.mediaMagnesio, 2), "mg"],
    ["Zinco", roundNutrient(resumo.mediaZinco, 2), "mg"],
    ["Vitamina A", roundNutrient(resumo.mediaVitaminaA, 2), "mcg"],
    ["Vitamina C", roundNutrient(resumo.mediaVitaminaC, 2), "mg"],
    ["Sódio", roundNutrient(resumo.mediaSodio, 2), "mg"],
  ];

  const needed = 24 + rows.length * 13;
  y = ensureSpace(doc, y, needed, report, repeatPageHeader);

  const usable = PAGE.width - PAGE.margin * 2;
  const cols = [
    { label: "Nutriente", w: Math.round(usable * 0.55) },
    { label: "Média do período", w: Math.round(usable * 0.28) },
    { label: "Un.", w: usable - Math.round(usable * 0.55) - Math.round(usable * 0.28) },
  ];
  const headH = 14;
  const rowH = 12;

  doc.rect(PAGE.margin, y, usable, 16).fillAndStroke(COLORS.headerBg, COLORS.border);
  doc.fontSize(8).fillColor(COLORS.text).text(
    "Tabela de Informação Nutricional — Referência FNDE (média diária letiva)",
    PAGE.margin + 4,
    y + 4,
    { width: usable - 8, align: "center" }
  );
  y += 20;

  let cx = PAGE.margin;
  for (const col of cols) {
    doc.rect(cx, y, col.w, headH).fillAndStroke(COLORS.headerBg, COLORS.border);
    doc.fontSize(7).fillColor(COLORS.text).text(col.label, cx + 3, y + 3, { width: col.w - 6 });
    cx += col.w;
  }
  y += headH;

  for (const row of rows) {
    cx = PAGE.margin;
    for (let i = 0; i < cols.length; i++) {
      doc.rect(cx, y, cols[i].w, rowH).stroke(COLORS.border);
      doc.fontSize(6.5).fillColor(COLORS.text).text(String(row[i] ?? "—"), cx + 3, y + 2, { width: cols[i].w - 6 });
      cx += cols[i].w;
    }
    y += rowH;
  }

  return y + 10;
}

function drawRodapeNutricionista(doc, nutri) {
  const boxH = RODAPE_H;
  const y = PAGE.height - PAGE.margin - boxH;
  const x = PAGE.margin;
  const w = PAGE.width - PAGE.margin * 2;

  doc.strokeColor(COLORS.border).lineWidth(0.4);
  doc.rect(x, y, w, boxH).stroke();

  doc.moveTo(x + w * 0.15, y + 12).lineTo(x + w * 0.85, y + 12).stroke();
  doc.fontSize(7.5).fillColor("#333").text(
    nutri?.usuNome || "Nome do Nutricionista Responsável",
    x,
    y + 16,
    { width: w, align: "center" }
  );
  doc.fontSize(7).fillColor("#555").text(
    `CRN: ${nutri?.usuInscricao || "_____"}`,
    x,
    y + 27,
    { width: w, align: "center" }
  );
  doc.fontSize(6.5).fillColor("#666").text("Assinatura", x + 14, y + 38);
  doc.moveTo(x + 62, y + 46).lineTo(x + w * 0.44, y + 46).stroke();
  doc.text("Data da assinatura: ___/___/______", x + w * 0.5, y + 38);
}

function drawReceitas(doc, receitas) {
  doc.addPage(pageOptions());
  let y = PAGE.margin;

  doc.fontSize(13).fillColor(COLORS.text).text("Receitas e percaptas", PAGE.margin, y);
  y += 20;

  const usable = PAGE.width - PAGE.margin * 2;
  const cols = [
    { label: "Ingrediente", w: Math.round(usable * 0.72) },
    { label: "Percapta", w: usable - Math.round(usable * 0.72) },
  ];

  for (const r of receitas) {
    if (y > PAGE.height - PAGE.margin - 80) {
      doc.addPage(pageOptions());
      y = PAGE.margin;
      doc.fontSize(11).fillColor(COLORS.muted).text("Receitas e percaptas (continuação)", PAGE.margin, y);
      y += 16;
    }

    doc.fontSize(10).fillColor(COLORS.text).text(r.pratoDscricao, PAGE.margin, y);
    y += 13;

    if (r.pratoModoDeFazer) {
      doc.fontSize(7.5).fillColor("#333").text(r.pratoModoDeFazer, PAGE.margin, y, {
        width: usable,
        lineGap: 1,
      });
      y += doc.heightOfString(r.pratoModoDeFazer, { width: usable, lineGap: 1 }) + 5;
    }

    doc.fontSize(7).fillColor("#666").text(
      `Freezer: ${r.usaFreezer} · Forno: ${r.usaForno} · Repetição: ${r.repete}`,
      PAGE.margin,
      y
    );
    y += 9;

    const grupos = r.grupos?.length ? r.grupos : [];
    if (!grupos.length) {
      doc.fontSize(7).fillColor("#888").text("Sem ingredientes cadastrados.", PAGE.margin, y);
      y += 12;
    }

    for (const grupo of grupos) {
      if (y > PAGE.height - PAGE.margin - 50) {
        doc.addPage(pageOptions());
        y = PAGE.margin;
      }

      const tituloGrupo = `${grupo.areaEtapa}${grupo.turno ? ` — ${grupo.turno}` : ""}`;
      doc.fontSize(8).fillColor(COLORS.text).text(tituloGrupo, PAGE.margin, y);
      y += 11;

      const tableTop = y;
      const headH = 14;
      let cx = PAGE.margin;
      doc.rect(PAGE.margin, tableTop, cols.reduce((s, c) => s + c.w, 0), headH).fillAndStroke(COLORS.headerBg, COLORS.border);
      doc.fontSize(7).fillColor(COLORS.text);
      for (const col of cols) {
        doc.text(col.label, cx + 3, tableTop + 3, { width: col.w - 6 });
        cx += col.w;
      }
      y = tableTop + headH;

      for (const ing of grupo.itens || []) {
        if (y > PAGE.height - PAGE.margin - 18) {
          doc.addPage(pageOptions());
          y = PAGE.margin;
        }
        cx = PAGE.margin;
        const rowH = 13;
        const values = [ing.prodDescricao || "", ing.quantidadeGramas || "—"];
        for (let i = 0; i < cols.length; i++) {
          doc.rect(cx, y, cols[i].w, rowH).stroke("#ccc");
          doc.fontSize(6.5).fillColor("#222").text(values[i], cx + 3, y + 2, { width: cols[i].w - 6, height: rowH - 3 });
          cx += cols[i].w;
        }
        y += rowH;
      }
      y += 10;
    }

    y += 6;
  }
}

/**
 * Gera PDF do cardápio em tabela semanal (A4 paisagem), formato legado.
 * @returns {Promise<Buffer>}
 */
export function generateCardapioPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      ...pageOptions(),
      info: {
        Title: report.titulo || "Cardápio",
        Author: report.prefeitura?.prefNome || "SGA",
      },
    });

    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (!report.weeks?.length) {
      reject(new Error("Dados das semanas ausentes"));
      return;
    }

    const nutri = report.nutricionistas?.[0];
    const hasReceitas = (report.receitas?.length ?? 0) > 0;

    const repeatPageHeader = () => drawPageHeader(doc, report);

    let y = repeatPageHeader();
    y = drawWeekTables(doc, report, y, repeatPageHeader);

    const imprimirNutrientes = report.params?.opcNutrientes !== false;
    if (imprimirNutrientes && report.resumoMensal) {
      y = drawResumoMacros(doc, report.resumoMensal, y, report, repeatPageHeader);
      y = drawTabelaFnde(doc, report.resumoMensal, y, report, repeatPageHeader);
    }

    if (nutri) {
      drawRodapeNutricionista(doc, nutri);
    }

    if (hasReceitas) {
      drawReceitas(doc, report.receitas);
    }

    doc.end();
  });
}

export async function buildAndRenderCardapioPdf(prefCodigo, params) {
  const formato = params.opcFormato || "calendario";

  if (formato === "calendario") {
    const { buildCardapioReportData } = await import("./cardapioReportService.js");
    const report = await buildCardapioReportData(prefCodigo, params);
    if (report.error) return report;
    const buffer = await generateCardapioPdf(report);
    return { buffer, report };
  }

  const { buildAndRenderCardapioPnaePdf } = await import("./cardapioReportPnaePdf.js");
  return buildAndRenderCardapioPnaePdf(prefCodigo, params);
}
