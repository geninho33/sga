import PDFDocument from "pdfkit";
import { roundNutrient } from "./cardapioNutrientesService.js";
import { fmtDateTimeBr } from "../utils/dateFormatBr.js";

const PAGE = { width: 595, height: 842, margin: 40 };

const C = {
  azul: "#0d47a1",
  azulClaro: "#e3f2fd",
  verde: "#1f6e45",
  verdeClaro: "#e8f5e9",
  borda: "#9aabb8",
  texto: "#222",
  muted: "#555",
};

function pageOpts() {
  return { size: "A4", margin: PAGE.margin };
}

function ensureSpace(doc, y, needed, headerFn) {
  if (y + needed <= PAGE.height - PAGE.margin) return y;
  doc.addPage(pageOpts());
  return headerFn ? headerFn() : PAGE.margin;
}

function drawLine(doc, x1, y, x2, color = C.borda) {
  doc.strokeColor(color).lineWidth(0.5).moveTo(x1, y).lineTo(x2, y).stroke();
}

function sectionTitle(doc, title, y) {
  const w = PAGE.width - PAGE.margin * 2;
  doc.rect(PAGE.margin, y, w, 18).fill(C.azul);
  doc.fontSize(9).fillColor("#fff").text(title.toUpperCase(), PAGE.margin + 8, y + 5, { width: w - 16 });
  return y + 22;
}

function fieldRow(doc, label, value, y, labelW = 130) {
  const x = PAGE.margin;
  const w = PAGE.width - PAGE.margin * 2;
  doc.fontSize(8).fillColor(C.muted).text(label, x, y, { width: labelW });
  doc.fillColor(C.texto).text(value || "—", x + labelW, y, { width: w - labelW });
  return y + 13;
}

function drawInstitutionalHeader(doc, report) {
  let y = PAGE.margin;
  const w = PAGE.width - PAGE.margin * 2;
  const logoSlots = 3;
  const slotW = 72;
  let xLogo = PAGE.margin;

  for (let i = 0; i < logoSlots; i++) {
    doc.rect(xLogo, y, slotW, 44).stroke(C.borda);
    if (i === 1 && report.prefeitura?.prefLogo?.length) {
      try {
        doc.image(Buffer.from(report.prefeitura.prefLogo), xLogo + 2, y + 2, { fit: [slotW - 4, 40] });
      } catch {
        doc.fontSize(6).fillColor(C.muted).text("Brasão / Logo", xLogo + 4, y + 18, { width: slotW - 8, align: "center" });
      }
    } else {
      const labels = ["Brasão Oficial", "Prefeitura", "Secretaria de Educação"];
      doc.fontSize(6).fillColor(C.muted).text(labels[i], xLogo + 4, y + 18, { width: slotW - 8, align: "center" });
    }
    xLogo += slotW + 8;
  }

  const textX = PAGE.margin + logoSlots * (slotW + 8) - (slotW + 8);
  const textW = w - (logoSlots * (slotW + 8) - (slotW + 8));
  const tx = PAGE.margin;
  y += 50;

  const prefNome = String(report.prefeitura?.prefNome || "").toUpperCase();
  doc.fontSize(11).fillColor(C.azul).text(prefNome, tx, y, { width: w, align: "center" });
  y += 14;
  doc.fontSize(9).fillColor(C.verde).text(report.prefeitura?.secretariaEducacao || "SECRETARIA MUNICIPAL DE EDUCAÇÃO", tx, y, { width: w, align: "center" });
  y += 12;
  doc.fontSize(8).fillColor(C.texto).text("PROGRAMA NACIONAL DE ALIMENTAÇÃO ESCOLAR – PNAE", tx, y, { width: w, align: "center" });
  y += 10;
  doc.fontSize(8).fillColor(C.muted).text(
    `Exercício: ${report.prefeitura?.exercicio || ""}  ·  Mês de Referência: ${report.prefeitura?.mesReferencia || ""}`,
    tx, y, { width: w, align: "center" }
  );
  y += 14;

  doc.rect(PAGE.margin, y, w, 22).fill(C.verdeClaro).stroke(C.verde);
  doc.fontSize(12).fillColor(C.azul).text("CARDÁPIO ESCOLAR MENSAL", PAGE.margin, y + 6, { width: w, align: "center" });
  y += 28;

  if (report.cardapio?.carDapDescricao) {
    doc.fontSize(9).fillColor(C.texto).text(report.cardapio.carDapDescricao, PAGE.margin, y, { width: w, align: "center" });
    y += 14;
  }

  drawLine(doc, PAGE.margin, y, PAGE.width - PAGE.margin, C.azul);
  return y + 8;
}

function drawIdentificacao(doc, report, y) {
  y = sectionTitle(doc, "Identificação da Unidade Escolar", y);
  const id = report.identificacao || {};
  y = fieldRow(doc, "Unidade Escolar:", id.unidadeEscolar, y);
  y = fieldRow(doc, "Código INEP:", id.codigoInep, y);
  y = fieldRow(doc, "Modalidade de Ensino:", id.modalidadeEnsino, y);
  y = fieldRow(doc, "Faixa Etária:", id.faixaEtaria, y);
  y = fieldRow(doc, "Turno:", id.turno, y);
  y = fieldRow(doc, "Responsável pela Unidade:", id.responsavelUnidade, y);
  y = fieldRow(doc, "Município:", id.municipio, y);
  y = fieldRow(doc, "Mês/Ano:", id.mesAno, y);
  return y + 6;
}

function cellText(doc, text, x, y, cw, ch, opts = {}) {
  const pad = 3;
  doc.fontSize(opts.size || 6.5).fillColor(opts.color || C.texto);
  doc.text(text || "", x + pad, y + pad, { width: cw - pad * 2, height: ch - pad * 2, lineGap: 0 });
}

function drawWeeklyMenu(doc, report, y, repeatHeader) {
  y = ensureSpace(doc, y, 60, repeatHeader);
  y = sectionTitle(doc, "Tabela Principal do Cardápio", y);

  const cols = [
    { label: "Semana", w: 42 },
    { label: "Segunda", w: 98 },
    { label: "Terça", w: 98 },
    { label: "Quarta", w: 98 },
    { label: "Quinta", w: 98 },
    { label: "Sexta", w: 98 },
  ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const x0 = PAGE.margin + (PAGE.width - PAGE.margin * 2 - tableW) / 2;

  const drawHead = (yy) => {
    let cx = x0;
    for (const col of cols) {
      doc.rect(cx, yy, col.w, 16).fillAndStroke(C.azulClaro, C.borda);
      doc.fontSize(7).fillColor(C.azul).text(col.label, cx + 2, yy + 4, { width: col.w - 4, align: "center" });
      cx += col.w;
    }
    return yy + 16;
  };

  y = drawHead(y);

  for (const week of report.tabelaSemanal || []) {
    const rowLines = week.days.map((d) => {
      const parts = [];
      if (d.preparacoes?.length) parts.push(d.preparacoes.join("\n"));
      if (d.bebida) parts.push(`Bebida: ${d.bebida}`);
      if (d.sobremesa) parts.push(`Fruta/Sobremesa: ${d.sobremesa}`);
      if (d.observacao) parts.push(`Obs.: ${d.observacao}`);
      return parts.join("\n") || "—";
    });
    const maxH = Math.max(48, ...rowLines.map((t) => Math.max(48, doc.heightOfString(t, { width: cols[1].w - 6, fontSize: 6.5 }) + 10)));

    y = ensureSpace(doc, y, maxH + 4, repeatHeader);
    if (y === PAGE.margin && repeatHeader) y = drawHead(y);

    let cx = x0;
    doc.rect(cx, y, cols[0].w, maxH).fillAndStroke(C.verdeClaro, C.borda);
    doc.fontSize(7).fillColor(C.verde).text(week.titulo, cx + 2, y + maxH / 2 - 6, { width: cols[0].w - 4, align: "center" });
    cx += cols[0].w;

    for (let i = 0; i < 5; i++) {
      doc.rect(cx, y, cols[i + 1].w, maxH).stroke(C.borda);
      cellText(doc, rowLines[i], cx, y, cols[i + 1].w, maxH);
      cx += cols[i + 1].w;
    }
    y += maxH;
  }
  return y + 8;
}

function drawSimpleTable(doc, title, columns, rows, y, repeatHeader, rowH = 14) {
  y = ensureSpace(doc, y, 40, repeatHeader);
  if (title) y = sectionTitle(doc, title, y);

  const tableW = columns.reduce((s, c) => s + c.w, 0);
  const x0 = PAGE.margin;

  const drawHead = (yy) => {
    let cx = x0;
    for (const col of columns) {
      doc.rect(cx, yy, col.w, 16).fillAndStroke(C.azulClaro, C.borda);
      doc.fontSize(7).fillColor(C.azul).text(col.label, cx + 3, yy + 4, { width: col.w - 6 });
      cx += col.w;
    }
    return yy + 16;
  };

  y = drawHead(y);

  for (const row of rows) {
    y = ensureSpace(doc, y, rowH + 2, repeatHeader);
    if (y === PAGE.margin && repeatHeader) y = drawHead(y);
    let cx = x0;
    for (let i = 0; i < columns.length; i++) {
      doc.rect(cx, y, columns[i].w, rowH).stroke("#ddd");
      doc.fontSize(7).fillColor(C.texto).text(String(row[i] ?? "—"), cx + 3, y + 3, { width: columns[i].w - 6, height: rowH - 4 });
      cx += columns[i].w;
    }
    y += rowH;
  }
  return y + 8;
}

function drawPreparacoes(doc, report, y, repeatHeader) {
  const cols = [
    { label: "Preparação", w: 120 },
    { label: "Ficha Téc.", w: 52 },
    { label: "Receita Pad.", w: 52 },
    { label: "Per Capita", w: 52 },
    { label: "Rendimento", w: 80 },
    { label: "Faixa Etária", w: 114 },
  ];
  const rows = (report.preparacoes || []).map((p) => [
    p.nome, p.fichaTecnica, p.receitaPadronizada, p.perCapta, p.rendimento, p.faixaEtaria,
  ]);
  if (!rows.length) rows.push(["—", "—", "—", "—", "—", "—"]);
  return drawSimpleTable(doc, "Controle de Preparações", cols, rows, y, repeatHeader, 16);
}

function drawNutrientes(doc, report, y, repeatHeader) {
  const macroCols = [
    { label: "Dia", w: 110 },
    { label: "Kcal", w: 62 },
    { label: "Carb. (g)", w: 62 },
    { label: "Prot. (g)", w: 62 },
    { label: "Lip. (g)", w: 62 },
    { label: "Fib. (g)", w: 62 },
  ];
  const macroRows = (report.nutrientesDiarios || []).map((d) => [
    d.dia,
    roundNutrient(d.kcal, 0),
    roundNutrient(d.carboidratos),
    roundNutrient(d.proteinas),
    roundNutrient(d.lipidios),
    roundNutrient(d.fibras),
  ]);
  y = drawSimpleTable(doc, "Tabela de Informação Nutricional (Diária)", macroCols, macroRows.length ? macroRows : [["—", "—", "—", "—", "—", "—"]], y, repeatHeader);

  const microCols = [
    { label: "Dia", w: 90 },
    { label: "Ca (mg)", w: 50 },
    { label: "Fe (mg)", w: 50 },
    { label: "Zn (mg)", w: 50 },
    { label: "Mg (mg)", w: 50 },
    { label: "Vit.A (mcg)", w: 58 },
    { label: "Vit.C (mg)", w: 58 },
    { label: "Na (mg)", w: 50 },
  ];
  const microRows = (report.nutrientesDiarios || []).map((d) => [
    d.dia?.split(" ")[0] || d.dia,
    roundNutrient(d.calcio),
    roundNutrient(d.ferro),
    roundNutrient(d.zinco),
    roundNutrient(d.magnesio),
    roundNutrient(d.vitaminaA),
    roundNutrient(d.vitaminaC),
    roundNutrient(d.sodio),
  ]);
  y = drawSimpleTable(doc, "Tabela de Micronutrientes (Diária)", microCols, microRows.length ? microRows : [["—", "—", "—", "—", "—", "—", "—", "—"]], y, repeatHeader);

  y = ensureSpace(doc, y, 80, repeatHeader);
  y = sectionTitle(doc, "Resumo Nutricional Mensal", y);
  const r = report.resumoMensal || {};
  y = fieldRow(doc, "Total de calorias ofertadas:", `${roundNutrient(r.totalCalorias, 0)} Kcal`, y);
  y = fieldRow(doc, "Média calórica diária:", `${roundNutrient(r.mediaCalorica, 0)} Kcal`, y);
  y = fieldRow(doc, "Média de proteínas:", `${roundNutrient(r.mediaProteinas)} g`, y);
  y = fieldRow(doc, "Média de carboidratos:", `${roundNutrient(r.mediaCarboidratos)} g`, y);
  y = fieldRow(doc, "Média de lipídios:", `${roundNutrient(r.mediaLipidios)} g`, y);
  y = fieldRow(doc, "Média de fibras:", `${roundNutrient(r.mediaFibras)} g`, y);
  y = fieldRow(doc, "Média de vitaminas (A/C):", `${roundNutrient(r.mediaVitaminas)}`, y);
  y = fieldRow(doc, "Média de minerais:", `${roundNutrient(r.mediaMinerais)}`, y);
  return y + 6;
}

function drawCheckboxList(doc, title, items, y, repeatHeader) {
  y = ensureSpace(doc, y, 50, repeatHeader);
  y = sectionTitle(doc, title, y);
  const colW = (PAGE.width - PAGE.margin * 2) / 2;
  let col = 0;
  let yy = y;
  for (const item of items) {
    const x = PAGE.margin + col * colW;
    doc.rect(x, yy, 8, 8).stroke(C.borda);
    doc.fontSize(8).fillColor(C.texto).text(item.label, x + 12, yy - 1, { width: colW - 16 });
    col += 1;
    if (col > 1) { col = 0; yy += 12; }
  }
  return (col === 0 ? yy : yy + 12) + 6;
}

function drawAdequacaoPnae(doc, y, repeatHeader) {
  const items = [
    { label: "Cardápio elaborado por Nutricionista" },
    { label: "Atende às necessidades nutricionais da faixa etária" },
    { label: "Respeita hábitos alimentares locais" },
    { label: "Utiliza alimentos da agricultura familiar" },
    { label: "Possui oferta regular de frutas" },
    { label: "Possui oferta regular de hortaliças" },
    { label: "Atende às exigências da Resolução FNDE nº 06/2020" },
    { label: "Atende às recomendações do Conselho Federal de Nutricionistas" },
  ];
  return drawCheckboxList(doc, "Adequação ao PNAE", items, y, repeatHeader);
}

function drawAgriculturaFamiliar(doc, report, y, repeatHeader) {
  const cols = [
    { label: "Produto", w: 180 },
    { label: "Origem", w: 120 },
    { label: "Fornecedor", w: 100 },
    { label: "Agricultura Familiar", w: 80 },
  ];
  const rows = (report.agriculturaFamiliar || []).map((a) => [a.produto, a.origem, a.fornecedor || "—", a.agriculturaFamiliar]);
  if (!rows.length) rows.push(["—", "—", "—", "—"]);
  return drawSimpleTable(doc, "Controle de Agricultura Familiar", cols, rows, y, repeatHeader);
}

function drawAlergenos(doc, y, repeatHeader) {
  y = ensureSpace(doc, y, 60, repeatHeader);
  y = sectionTitle(doc, "Controle de Alérgenos", y);
  doc.fontSize(8).fillColor(C.muted).text("Contém:", PAGE.margin, y);
  y += 12;
  const alergenos = ["Leite", "Ovo", "Soja", "Glúten", "Peixes", "Crustáceos", "Amendoim", "Castanhas"];
  const colW = (PAGE.width - PAGE.margin * 2) / 4;
  let cx = 0;
  for (const a of alergenos) {
    const x = PAGE.margin + cx * colW;
    doc.rect(x, y, 8, 8).stroke(C.borda);
    doc.fontSize(8).fillColor(C.texto).text(a, x + 12, y - 1);
    cx += 1;
    if (cx >= 4) { cx = 0; y += 14; }
  }
  y += 10;
  doc.fontSize(8).fillColor(C.muted).text("Observações:", PAGE.margin, y);
  y += 10;
  doc.rect(PAGE.margin, y, PAGE.width - PAGE.margin * 2, 36).stroke(C.borda);
  return y + 44;
}

function drawNecessidadesEspeciais(doc, report, y, repeatHeader) {
  y = ensureSpace(doc, y, 70, repeatHeader);
  y = sectionTitle(doc, "Necessidades Alimentares Especiais", y);
  const esp = report.atendimentoEspecial || {};
  y = fieldRow(doc, "Diabéticos:", String(esp.diabeticos || 0), y);
  y = fieldRow(doc, "Celíacos:", String(esp.celiacos || 0), y);
  y = fieldRow(doc, "Intolerantes à lactose:", String(esp.intolerantesLactose || 0), y);
  y = fieldRow(doc, "Alérgicos:", String(esp.alergicos || 0), y);
  y = fieldRow(doc, "Dietas especiais prescritas:", String(esp.dietasEspeciais || 0), y);
  return y + 6;
}

function drawAssinaturas(doc, report, y, repeatHeader) {
  y = ensureSpace(doc, y, 180, repeatHeader);

  y = sectionTitle(doc, "Responsabilidade Técnica", y);
  const nutri = report.nutricionistas?.[0];
  y = fieldRow(doc, "Nome:", nutri?.usuNome || "", y);
  y = fieldRow(doc, "CRN:", "", y);
  y += 8;
  doc.fontSize(8).fillColor(C.muted).text("Assinatura: _________________________________________", PAGE.margin, y);
  y += 14;
  doc.text(`Data: ${fmtDateTimeBr(new Date())}`, PAGE.margin, y);
  y += 20;

  y = sectionTitle(doc, "Aprovação — Direção da Unidade Escolar", y);
  y = fieldRow(doc, "Nome:", report.identificacao?.responsavelUnidade !== "—" ? report.identificacao.responsavelUnidade : "", y);
  y = fieldRow(doc, "Cargo:", "Diretor(a) / Responsável", y);
  y += 8;
  doc.fontSize(8).fillColor(C.muted).text("Assinatura: _________________________________________", PAGE.margin, y);
  y += 24;

  y = sectionTitle(doc, "Controle do Conselho de Alimentação Escolar (CAE)", y);
  y = fieldRow(doc, "Data da apresentação ao CAE:", "", y);
  y += 4;
  doc.fontSize(8).fillColor(C.muted).text("Parecer:", PAGE.margin, y);
  y += 10;
  doc.rect(PAGE.margin, y, PAGE.width - PAGE.margin * 2, 40).stroke(C.borda);
  y += 48;

  y = sectionTitle(doc, "Observações Gerais", y);
  const legalText =
    "Este cardápio foi elaborado em conformidade com as diretrizes do Programa Nacional de Alimentação Escolar (PNAE), "
    + "observando a Resolução CD/FNDE nº 06/2020 e demais normativas vigentes, visando garantir alimentação adequada, "
    + "saudável e nutricionalmente equilibrada aos estudantes da rede pública de ensino.";
  doc.fontSize(7.5).fillColor(C.texto).text(legalText, PAGE.margin, y, {
    width: PAGE.width - PAGE.margin * 2,
    align: "justify",
    lineGap: 2,
  });
  y += doc.heightOfString(legalText, { width: PAGE.width - PAGE.margin * 2, lineGap: 2 }) + 8;

  doc.fontSize(7).fillColor(C.muted).text(
    `Documento gerado pelo SGA · Impressão em ${fmtDateTimeBr(new Date())}`,
    PAGE.margin,
    PAGE.height - PAGE.margin - 10,
    { width: PAGE.width - PAGE.margin * 2, align: "center" }
  );

  return y;
}

function drawReceitasAnexo(doc, receitas, y, repeatHeader) {
  if (!receitas?.length) return y;

  doc.addPage(pageOpts());
  y = PAGE.margin;
  y = sectionTitle(doc, "Anexo — Receitas e Percaptas", y);

  for (const r of receitas) {
    y = ensureSpace(doc, y, 60, repeatHeader);
    doc.fontSize(10).fillColor(C.azul).text(r.pratoDscricao, PAGE.margin, y);
    y += 14;
    if (r.pratoModoDeFazer) {
      doc.fontSize(7).fillColor(C.texto).text(r.pratoModoDeFazer, PAGE.margin, y, {
        width: PAGE.width - PAGE.margin * 2,
        lineGap: 1,
      });
      y += doc.heightOfString(r.pratoModoDeFazer, { width: PAGE.width - PAGE.margin * 2, lineGap: 1 }) + 6;
    }
    if (r.ingredientes?.length) {
      const cols = [
        { label: "Ingrediente", w: 200 },
        { label: "Área / Etapa", w: 140 },
        { label: "Turno", w: 80 },
        { label: "Percapta", w: 60 },
      ];
      const rows = r.ingredientes.map((i) => [i.prodDescricao, i.area, i.turno, i.quantidadeGramas]);
      y = drawSimpleTable(doc, "", cols, rows, y, repeatHeader, 13);
    }
    y += 6;
  }
  return y;
}

export function generateCardapioPnaePdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      ...pageOpts(),
      info: {
        Title: `Cardápio Escolar PNAE — ${report.cardapio?.carDapDescricao || ""}`,
        Author: report.prefeitura?.prefNome || "SGA",
      },
    });

    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const repeatHeader = () => drawInstitutionalHeader(doc, report);

    let y = drawInstitutionalHeader(doc, report);
    y = drawIdentificacao(doc, report, y);
    y = drawWeeklyMenu(doc, report, y, repeatHeader);
    y = drawPreparacoes(doc, report, y, repeatHeader);
    y = drawNutrientes(doc, report, y, repeatHeader);
    y = drawAdequacaoPnae(doc, y, repeatHeader);
    y = drawAgriculturaFamiliar(doc, report, y, repeatHeader);
    y = drawAlergenos(doc, y, repeatHeader);
    y = drawNecessidadesEspeciais(doc, report, y, repeatHeader);
    y = drawAssinaturas(doc, report, y, repeatHeader);

    if (report.params?.opcReceita && report.receitas?.length) {
      drawReceitasAnexo(doc, report.receitas, y, repeatHeader);
    }

    doc.end();
  });
}

export async function buildAndRenderCardapioPnaePdf(prefCodigo, params) {
  const { buildCardapioPnaeReportData } = await import("./cardapioReportService.js");
  const report = await buildCardapioPnaeReportData(prefCodigo, params);
  if (report.error) return report;
  const buffer = await generateCardapioPnaePdf(report);
  return { buffer, report };
}
