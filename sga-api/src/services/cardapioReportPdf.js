import PDFDocument from "pdfkit";

/** A4 paisagem — não usar layout:'landscape' com size explícito (pdfkit inverte para retrato). */
const PAGE = { margin: 28, width: 842, height: 595 };

const COLORS = {
  weekdayBg: "#eef2f7",
  weekdayWeekendBg: "#f3ebe3",
  weekdayWeekendText: "#8b4513",
  cellBg: "#f8fafc",
  cellWeekendBg: "#faf3eb",
  cellOutRange: "#eef2f7",
  cellFilled: "#e8f2fb",
  cellWeekendFilled: "#f0e4d4",
  border: "#9aabb8",
  headerText: "#0d47a1",
};

function pageOptions() {
  return { size: [PAGE.width, PAGE.height], margin: PAGE.margin };
}

function formatDateBr(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function formatMesAnoBr(iso) {
  if (!iso) return "";
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const [y, m] = String(iso).slice(0, 10).split("-").map(Number);
  return `${months[m - 1]} ${y}`;
}

function drawPageHeader(doc, report, y) {
  const usable = PAGE.width - PAGE.margin * 2;
  let xText = PAGE.margin;

  if (report.prefeitura?.prefLogo?.length) {
    try {
      doc.image(Buffer.from(report.prefeitura.prefLogo), PAGE.margin, y, { fit: [72, 44] });
      xText = PAGE.margin + 78;
    } catch {
      /* logo inválido */
    }
  }

  doc.fontSize(13).fillColor("#111").text(report.titulo, xText, y, { width: usable - (xText - PAGE.margin) });
  y += 18;

  if (report.subtitulo) {
    doc.fontSize(9).fillColor("#444").text(report.subtitulo, xText, y);
    y += 12;
  }

  const cal = report.calendar;
  doc.fontSize(10).fillColor(COLORS.headerText).text(cal?.monthLabel || formatMesAnoBr(report.carDapMesAno), xText, y);
  y += 11;

  doc.fontSize(8).fillColor("#666").text(
    `Semanas ${report.params.opcSemanaINI} a ${report.params.opcSemanaFIN} · Impressão em ${formatDateBr(new Date().toISOString().slice(0, 10))}`,
    xText,
    y
  );

  return y + 14;
}

function drawCellMeals(doc, cell, x, y, colW, rowH) {
  if (!cell.inRange || !cell.refeicoes?.length) return;

  const pad = 3;
  const textW = colW - pad * 2;
  let cy = y + 16;
  const maxY = y + rowH - 4;

  for (const ref of cell.refeicoes) {
    const turnoLine = [ref.horario, ref.turno].filter(Boolean).join(" · ");
    if (turnoLine) {
      if (cy + 7 > maxY) break;
      doc.fontSize(5.5).fillColor("#0d47a1").text(turnoLine, x + pad, cy, { width: textW, lineGap: 0 });
      cy += 7;
    }
    if (ref.prato && cy < maxY) {
      const pratoH = doc.heightOfString(ref.prato, { width: textW, lineGap: 0 });
      const avail = maxY - cy;
      doc.fontSize(5.5).fillColor("#222").text(ref.prato, x + pad, cy, {
        width: textW,
        lineGap: 0,
        height: Math.min(pratoH, avail),
      });
      cy += Math.min(pratoH, avail) + 2;
    }
  }
}

function weekMealCount(week) {
  let max = 0;
  for (const cell of week) {
    if (cell?.inRange && cell.refeicoes?.length) {
      max = Math.max(max, cell.refeicoes.length);
    }
  }
  return max;
}

function weekRowHeight(week, minH) {
  const meals = weekMealCount(week);
  if (meals === 0) return minH;
  return Math.max(minH, 20 + meals * 17);
}

function drawCalendarGrid(doc, calendar, startY) {
  const usable = PAGE.width - PAGE.margin * 2;
  const colW = usable / 7;
  const weekCount = calendar.weeks.length;
  const headH = 20;
  const availH = PAGE.height - PAGE.margin - startY - 36;
  const baseRowH = Math.max(56, Math.floor((availH - headH) / Math.max(weekCount, 1)));

  let y = startY;

  for (let c = 0; c < 7; c++) {
    const isWe = c === 0 || c === 6;
    const x = PAGE.margin + c * colW;
    doc.rect(x, y, colW, headH).fillAndStroke(isWe ? COLORS.weekdayWeekendBg : COLORS.weekdayBg, COLORS.border);
    doc.fontSize(8).fillColor(isWe ? COLORS.weekdayWeekendText : "#333").text(
      calendar.weekdays[c],
      x + 2,
      y + 6,
      { width: colW - 4, align: "center" }
    );
  }
  y += headH;

  for (const week of calendar.weeks) {
    const rowH = weekRowHeight(week, baseRowH);
    for (let c = 0; c < 7; c++) {
      const cell = week[c];
      const x = PAGE.margin + c * colW;
      const isWeCol = c === 0 || c === 6;

      if (!cell) {
        doc.rect(x, y, colW, rowH).fillAndStroke(COLORS.cellOutRange, COLORS.border);
        continue;
      }

      let bg = COLORS.cellBg;
      if (!cell.inRange) bg = COLORS.cellOutRange;
      else if (cell.refeicoes?.length) bg = isWeCol || cell.isWeekend ? COLORS.cellWeekendFilled : COLORS.cellFilled;
      else if (cell.isWeekend || isWeCol) bg = COLORS.cellWeekendBg;

      doc.rect(x, y, colW, rowH).fillAndStroke(bg, COLORS.border);

      doc.fontSize(9).fillColor(cell.isWeekend ? COLORS.weekdayWeekendText : "#111").text(
        String(cell.day),
        x + 4,
        y + 3,
        { width: 20 }
      );
      doc.fontSize(5.5).fillColor("#888").text(formatDateBr(cell.iso), x + 4, y + 3, {
        width: colW - 8,
        align: "right",
      });

      drawCellMeals(doc, cell, x, y, colW, rowH);
    }
    y += rowH;
  }

  return y + 6;
}

function drawNutricionistas(doc, nutricionistas, y) {
  if (!nutricionistas?.length) return y;
  doc.fontSize(8).fillColor("#444").text(
    `Nutricionista(s): ${nutricionistas.map((n) => n.usuNome).join(" · ")}`,
    PAGE.margin,
    PAGE.height - PAGE.margin - 12,
    { width: PAGE.width - PAGE.margin * 2 }
  );
  return y;
}

function drawReceitas(doc, receitas) {
  doc.addPage(pageOptions());
  let y = PAGE.margin;

  doc.fontSize(14).fillColor("#111").text("Receitas e percaptas", PAGE.margin, y);
  y += 18;

  for (const r of receitas) {
    if (y > PAGE.height - PAGE.margin - 80) {
      doc.addPage(pageOptions());
      y = PAGE.margin;
    }

    doc.fontSize(11).fillColor(COLORS.headerText).text(r.pratoDscricao, PAGE.margin, y);
    y += 13;

    if (r.pratoModoDeFazer) {
      doc.fontSize(8).fillColor("#333").text(r.pratoModoDeFazer, PAGE.margin, y, {
        width: PAGE.width - PAGE.margin * 2,
        lineGap: 1,
      });
      y += doc.heightOfString(r.pratoModoDeFazer, { width: PAGE.width - PAGE.margin * 2, lineGap: 1 }) + 6;
    }

    doc.fontSize(7).fillColor("#666").text(
      `Freezer: ${r.usaFreezer} · Forno: ${r.usaForno} · Repetição: ${r.repete}`,
      PAGE.margin,
      y
    );
    y += 10;

    if (r.ingredientes?.length) {
      const tableTop = y;
      const cols = [
        { label: "Ingrediente", w: 200 },
        { label: "Área / Etapa", w: 140 },
        { label: "Turno", w: 80 },
        { label: "Percapta", w: 60 },
      ];
      let cx = PAGE.margin;
      const headH = 16;
      doc.rect(PAGE.margin, tableTop, cols.reduce((s, c) => s + c.w, 0), headH).fillAndStroke("#e8eef4", COLORS.border);
      doc.fontSize(7).fillColor("#111");
      for (const col of cols) {
        doc.text(col.label, cx + 3, tableTop + 4, { width: col.w - 6 });
        cx += col.w;
      }
      y = tableTop + headH;

      for (const ing of r.ingredientes) {
        if (y > PAGE.height - PAGE.margin - 20) {
          doc.addPage(pageOptions());
          y = PAGE.margin;
        }
        cx = PAGE.margin;
        const rowH = 14;
        const values = [
          ing.prodDescricao || "",
          ing.area || "—",
          ing.turno || "—",
          ing.quantidadeGramas || "—",
        ];
        for (let i = 0; i < cols.length; i++) {
          doc.rect(cx, y, cols[i].w, rowH).stroke("#ddd");
          doc.fontSize(7).fillColor("#222").text(values[i], cx + 3, y + 3, { width: cols[i].w - 6, height: rowH - 4 });
          cx += cols[i].w;
        }
        y += rowH;
      }
      y += 10;
    } else {
      doc.fontSize(7).fillColor("#888").text("Sem ingredientes cadastrados.", PAGE.margin, y);
      y += 12;
    }

    y += 8;
  }
}

/**
 * Gera PDF do cardápio em grade calendário (paisagem).
 * @returns {Promise<Buffer>}
 */
export function generateCardapioPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      ...pageOptions(),
      info: {
        Title: report.titulo,
        Author: report.prefeitura?.prefNome || "SGA",
      },
    });

    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (!report.calendar) {
      reject(new Error("Dados do calendário ausentes"));
      return;
    }

    let y = drawPageHeader(doc, report, PAGE.margin);
    y = drawCalendarGrid(doc, report.calendar, y);
    drawNutricionistas(doc, report.nutricionistas, y);

    if (report.params?.opcReceita && report.receitas?.length) {
      drawReceitas(doc, report.receitas);
    }

    doc.end();
  });
}

export async function buildAndRenderCardapioPdf(prefCodigo, params) {
  const formato = params.opcFormato || "pnae";

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
