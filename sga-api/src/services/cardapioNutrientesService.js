import { pool } from "../db.js";
import { isoFromDate } from "./cardapioReportService.js";

const NUTRIENT_FIELDS = [
  "prodCaloria",
  "prodCarboidrato",
  "prodProteina",
  "prodLipidio",
  "prodFibra",
  "prodCalcio",
  "prodFerro",
  "prodZinco",
  "prodMagnesio",
  "prodVitaminaA",
  "prodVitaminaC",
];

function emptyNutrients() {
  return {
    kcal: 0,
    carboidratos: 0,
    proteinas: 0,
    lipidios: 0,
    fibras: 0,
    calcio: 0,
    ferro: 0,
    zinco: 0,
    magnesio: 0,
    vitaminaA: 0,
    vitaminaC: 0,
    sodio: 0,
  };
}

function mapProductNutrients(prod) {
  const n = emptyNutrients();
  n.kcal = Number(prod.prodCaloria) || 0;
  n.carboidratos = Number(prod.prodCarboidrato) || 0;
  n.proteinas = Number(prod.prodProteina) || 0;
  n.lipidios = Number(prod.prodLipidio) || 0;
  n.fibras = Number(prod.prodFibra) || 0;
  n.calcio = Number(prod.prodCalcio) || 0;
  n.ferro = Number(prod.prodFerro) || 0;
  n.zinco = Number(prod.prodZinco) || 0;
  n.magnesio = Number(prod.prodMagnesio) || 0;
  n.vitaminaA = Number(prod.prodVitaminaA) || 0;
  n.vitaminaC = Number(prod.prodVitaminaC) || 0;
  n.sodio = (Number(prod.prodNpcal) || 0) + (Number(prod.prodNdpcal) || 0) + (Number(prod.prodSal) || 0);
  return n;
}

function addNutrients(target, source, factor = 1) {
  for (const key of Object.keys(target)) {
    target[key] += (source[key] || 0) * factor;
  }
}

/** Percentuais de macros conforme PRINTCardapioMacrosMicros (participação em gramas). */
export function macroPercentByGrams(totals) {
  const carb = Number(totals?.carboidratos ?? totals?.mediaCarboidratos) || 0;
  const prot = Number(totals?.proteinas ?? totals?.mediaProteinas) || 0;
  const lip = Number(totals?.lipidios ?? totals?.mediaLipidios) || 0;
  const sum = carb + prot + lip || 1;
  return {
    carbPct: Math.round((carb * 100) / sum),
    protPct: Math.round((prot * 100) / sum),
    lipPct: Math.round((lip * 100) / sum),
  };
}

/** Espelha ImprimeMacroMicroNutrientes: nutriente do produto × percapta (kg). */
export async function calcNutrientsForDay(prefCodigo, carDapCodigo, dateIso, pratoCodigos) {
  if (!pratoCodigos?.length) return emptyNutrients();

  const totals = emptyNutrients();
  const placeholders = pratoCodigos.map((_, i) => `:p${i}`).join(", ");
  const params = { prefCodigo, carDapCodigo, dateIso };
  pratoCodigos.forEach((id, i) => {
    params[`p${i}`] = id;
  });

  const [ingredientes] = await pool.query(
    `SELECT pi.pratoCodigo, pi.pratIngrProdCodigo, pi.pratIngrQuantidade,
            pi.AreEnsCodigo, pi.AreEnsSequencial
     FROM trnscardapioprato cp
     INNER JOIN trnspratosingredientes pi
       ON pi.prefCodigo = cp.prefCodigo AND pi.pratoCodigo = cp.carPratoRefeicao
     INNER JOIN trnspratos p ON p.prefCodigo = cp.prefCodigo AND p.pratoCodigo = cp.carPratoRefeicao
       AND NOT (p.pratoStatus <=> 'I')
     WHERE cp.prefCodigo = :prefCodigo
       AND cp.carDapCodigo = :carDapCodigo
       AND DATE(cp.carPratoData) = :dateIso
       AND cp.carPratoRefeicao IN (${placeholders})
       AND NOT (pi.pratIngrStatus <=> 'I')
       AND pi.pratIngrQuantidade > 0`,
    params
  );

  if (!ingredientes.length) return totals;

  const prodIds = [...new Set(ingredientes.map((i) => i.pratIngrProdCodigo))];
  const prodPh = prodIds.map((_, i) => `:prod${i}`).join(", ");
  const prodParams = { prefCodigo };
  prodIds.forEach((id, i) => {
    prodParams[`prod${i}`] = id;
  });

  const [produtos] = await pool.query(
    `SELECT prodCodigo, ${NUTRIENT_FIELDS.join(", ")}, prodNpcal, prodNdpcal, prodSal
     FROM trnsprodutos
     WHERE prefCodigo = :prefCodigo AND prodCodigo IN (${prodPh}) AND NOT (prodStatus <=> 'I')`,
    prodParams
  );

  const prodMap = new Map(produtos.map((p) => [p.prodCodigo, p]));

  for (const ing of ingredientes) {
    const prod = prodMap.get(ing.pratIngrProdCodigo);
    if (!prod) continue;
    const perCapta = Number(ing.pratIngrQuantidade) || 0;
    if (perCapta <= 0) continue;
    addNutrients(totals, mapProductNutrients(prod), perCapta);
  }

  return totals;
}

export function roundNutrient(n, decimals = 1) {
  const v = Number(n);
  if (Number.isNaN(v) || Math.abs(v) < 0.0001) return "—";
  return v.toLocaleString("pt-BR", { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
}

export function averageNutrients(days) {
  const valid = days.filter((d) => d && d.kcal > 0);
  if (!valid.length) return emptyNutrients();
  const sum = emptyNutrients();
  for (const d of valid) addNutrients(sum, d, 1);
  const avg = emptyNutrients();
  for (const key of Object.keys(avg)) {
    avg[key] = sum[key] / valid.length;
  }
  return avg;
}

export function sumNutrients(days) {
  const sum = emptyNutrients();
  for (const d of days) {
    if (d) addNutrients(sum, d, 1);
  }
  return sum;
}

export function classifyRefeicao(descricao = "", turno = "") {
  const t = `${descricao} ${turno}`.toLowerCase();
  if (/suco|leite|achocolat|água|agua|bebida|café|cafe|chá|cha|iogurte líquido/.test(t)) return "bebida";
  if (/fruta|banana|maçã|maca|melancia|mamão|mamao|sobremesa|doce|gelatina|salada de frutas/.test(t)) {
    return "sobremesa";
  }
  return "preparacao";
}

export function groupPratosByDate(pratos) {
  const map = new Map();
  for (const p of pratos) {
    const key = isoFromDate(p.carPratoData);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return map;
}

export function dateFromWeekDay(week, gxDow) {
  for (let d = new Date(week.dataIni); d <= week.dataFim; d.setDate(d.getDate() + 1)) {
    const js = d.getDay();
    const dow = js === 0 ? 1 : js + 1;
    if (dow === gxDow) return new Date(d);
  }
  return null;
}

/** Monta células Seg–Sex para cada semana do intervalo. calendarMap: iso → { diaLivre } */
export function buildPnaeWeeklyRows(allWeeks, pratosByDate, opcSemanaINI, opcSemanaFIN, calendarMap = null) {
  const weekdayMeta = [
    { dow: 2, label: "Segunda" },
    { dow: 3, label: "Terça" },
    { dow: 4, label: "Quarta" },
    { dow: 5, label: "Quinta" },
    { dow: 6, label: "Sexta" },
  ];

  return allWeeks
    .filter((w) => w.semana >= opcSemanaINI && w.semana <= opcSemanaFIN)
    .map((week) => {
      const days = weekdayMeta.map(({ dow, label }) => {
        const date = dateFromWeekDay(week, dow);
        const iso = date ? isoFromDate(date) : "";
        const cal = iso && calendarMap?.get ? calendarMap.get(iso) : null;
        const items = iso && !cal?.diaLivre ? pratosByDate.get(iso) || [] : [];
        const cell = {
          label,
          iso,
          preparacoes: [],
          bebida: "",
          sobremesa: "",
          observacao: cal?.diaLivre || "",
          feriado: !!cal?.diaLivre,
        };

        for (const item of items) {
          const desc = item.pratoDscricao || "";
          const turno = item.refTipDescricao || "";
          const kind = classifyRefeicao(desc, turno);
          if (kind === "bebida") {
            cell.bebida = cell.bebida ? `${cell.bebida}\n${desc}` : desc;
          } else if (kind === "sobremesa") {
            cell.sobremesa = cell.sobremesa ? `${cell.sobremesa}\n${desc}` : desc;
          } else {
            cell.preparacoes.push(desc);
          }
        }
        return cell;
      });

      const hasContent = days.some((d) => d.preparacoes.length || d.bebida || d.sobremesa || d.observacao);
      return { semana: week.semana, titulo: `${week.semana}ª Semana`, days, hasContent };
    })
    .filter((w) => w.hasContent);
}

export async function loadAgriculturaFamiliar(prefCodigo, carDapCodigo) {
  const [rows] = await pool.query(
    `SELECT DISTINCT p.prodDescricao, COALESCE(po.prodOrigDescricao, '') AS origem
     FROM trnscardapioprato cp
     INNER JOIN trnspratos pr ON pr.prefCodigo = cp.prefCodigo AND pr.pratoCodigo = cp.carPratoRefeicao
       AND NOT (pr.pratoStatus <=> 'I')
     INNER JOIN trnspratosingredientes pi ON pi.prefCodigo = cp.prefCodigo AND pi.pratoCodigo = cp.carPratoRefeicao
     INNER JOIN trnsprodutos p ON p.prefCodigo = pi.prefCodigo AND p.prodCodigo = pi.pratIngrProdCodigo AND NOT (p.prodStatus <=> 'I')
     LEFT JOIN trnsprodutosorigem po ON po.prodOrigCodigo = p.prodOrigem AND NOT (po.prodOrigStatus <=> 'I')
     WHERE cp.prefCodigo = :prefCodigo AND cp.carDapCodigo = :carDapCodigo
       AND NOT (pi.pratIngrStatus <=> 'I')
       AND (
         LOWER(po.prodOrigDescricao) LIKE '%familiar%'
         OR LOWER(po.prodOrigDescricao) LIKE '%paa%'
         OR LOWER(po.prodOrigDescricao) LIKE '%agricultura%'
       )
     ORDER BY p.prodDescricao`,
    { prefCodigo, carDapCodigo }
  );
  return rows.map((r) => ({
    produto: r.prodDescricao,
    origem: r.origem || "—",
    fornecedor: "",
    agriculturaFamiliar: "Sim",
  }));
}

const NUTRIENT_LABELS = [
  { key: "kcal", label: "Calorias (kcal)" },
  { key: "carboidratos", label: "Carboidratos (g)" },
  { key: "proteinas", label: "Proteínas (g)" },
  { key: "lipidios", label: "Lipídios (g)" },
  { key: "fibras", label: "Fibras (g)" },
  { key: "calcio", label: "Cálcio (mg)" },
  { key: "ferro", label: "Ferro (mg)" },
  { key: "zinco", label: "Zinco (mg)" },
  { key: "magnesio", label: "Magnésio (mg)" },
  { key: "vitaminaA", label: "Vitamina A (µg)" },
  { key: "vitaminaC", label: "Vitamina C (mg)" },
  { key: "sodio", label: "Sódio (mg)" },
];

/** Resumo macros/micros — espelha aba WCMacroMicroNutrientes (média semanal). */
export async function calcCardapioNutrientesResumo(prefCodigo, carDapCodigo) {
  const [cardRows] = await pool.query(
    `SELECT carDapMesAno, carDapGruCodigo FROM trnscardapio
     WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo`,
    { prefCodigo, carDapCodigo }
  );
  const card = cardRows[0];
  if (!card) return null;

  const [pratos] = await pool.query(
    `SELECT DISTINCT DATE(carPratoData) AS dia, carPratoRefeicao AS pratoCodigo
     FROM trnscardapioprato
     WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo`,
    { prefCodigo, carDapCodigo }
  );

  const dayTotals = [];
  const dias = [...new Set(pratos.map((p) => isoFromDate(p.dia)).filter(Boolean))];
  for (const dia of dias) {
    const codigos = pratos.filter((p) => isoFromDate(p.dia) === dia).map((p) => p.pratoCodigo);
    const n = await calcNutrientsForDay(prefCodigo, carDapCodigo, dia, codigos);
    if (n.kcal > 0) dayTotals.push(n);
  }

  const mediaSemanal = averageNutrients(dayTotals);
  const somaCardapio = sumNutrients(dayTotals);

  let totalAtendimentoNormal = 0;
  if (card.carDapGruCodigo) {
    const [atend] = await pool.query(
      `SELECT COALESCE(SUM(AtendimentoNormalSegunda), 0) AS t
       FROM atendimento WHERE prefCodigo = :prefCodigo AND carGruCodigo = :carGruCodigo AND AtendimentoStatus = 'A'`,
      { prefCodigo, carGruCodigo: card.carDapGruCodigo }
    );
    totalAtendimentoNormal = Number(atend[0]?.t) || 0;
  }

  const exibicao = {};
  for (const { key } of NUTRIENT_LABELS) {
    exibicao[key] = totalAtendimentoNormal > 0 ? (somaCardapio[key] * totalAtendimentoNormal) / 4 : mediaSemanal[key];
  }

  return {
    labels: NUTRIENT_LABELS,
    mediaSemanal,
    somaCardapio,
    totalAtendimentoNormal,
    exibicao,
    diasComRefeicao: dayTotals.length,
  };
}
