import { pool } from "../db.js";
import { loadPrefeituraLogo } from "./adminEntities.js";
import { turnoGrupoLabel } from "./preparacaoEntities.js";
import { formatHorario, horarioSortKey } from "../utils/horario.js";

/** GeneXus DayOfWeek: domingo=1 … sábado=7 */
export function gxDayOfWeek(date) {
  const d = new Date(date);
  const js = d.getDay();
  return js === 0 ? 1 : js + 1;
}

function toDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0);
  }
  const s = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(`${s}T12:00:00`);
}

function formatDayHeader(date) {
  const d = toDateOnly(date);
  if (!d) return "";
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${d.getDate()}/${cap(months[d.getMonth()])} (${cap(days[d.getDay()])})`;
}

function addDays(date, n) {
  const d = toDateOnly(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isoFromParts(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isoFromDate(value) {
  const d = toDateOnly(value);
  if (!d) return "";
  return isoFromParts(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a, b) {
  return isoFromDate(a) === isoFromDate(b);
}

function dateInRange(date, ini, fim) {
  const d = toDateOnly(date);
  const i = toDateOnly(ini);
  const f = toDateOnly(fim);
  return d >= i && d <= f;
}

/** Monta intervalos semanais do mês (espelha loop do PRINTCardapioMacrosMicros). */
export function buildWeekRanges(carDapMesAno) {
  const base = toDateOnly(carDapMesAno);
  const year = base.getFullYear();
  const month = base.getMonth();
  const dataInicial = new Date(year, month, 1, 12, 0, 0);
  const dataFinal = new Date(year, month + 1, 0, 12, 0, 0);

  let carPratoData = new Date(dataInicial);
  let semana = 1;
  let difDias = 7 - gxDayOfWeek(carPratoData);
  const weeks = [];

  while (carPratoData <= dataFinal) {
    const ini = new Date(carPratoData);
    let fim = addDays(carPratoData, difDias);
    if (fim > dataFinal) fim = new Date(dataFinal);

    const headers = [];
    for (let d = new Date(ini); d <= fim; d.setDate(d.getDate() + 1)) {
      const dow = gxDayOfWeek(d);
      headers.push({
        date: new Date(d),
        dow,
        label: dow === 7 && headers.length === 6 ? "Observação" : formatDayHeader(d),
      });
    }

    weeks.push({ semana, dataIni: ini, dataFim: fim, headers });
    carPratoData = addDays(fim, 1);
    semana += 1;
    difDias = 6;
  }

  return weeks;
}

async function loadPratosMes(prefCodigo, carDapCodigo) {
  const [rows] = await pool.query(
    `SELECT cp.carPratoData, cp.carPratoTurno, cp.carPratoHorario, cp.carPratoRefeicao,
            rt.refTipDescricao, rt.refTipHorario, rt.refTipperiodo,
            p.pratoDscricao
     FROM trnscardapioprato cp
     INNER JOIN trnspratos p ON p.prefCodigo = cp.prefCodigo AND p.pratoCodigo = cp.carPratoRefeicao
     LEFT JOIN trnsrefeicaotipo rt ON rt.prefCodigo = cp.prefCodigo AND rt.refTipCodigo = cp.carPratoTurno
     WHERE cp.prefCodigo = :prefCodigo AND cp.carDapCodigo = :carDapCodigo
     ORDER BY cp.carPratoData, rt.refTipHorario, cp.carPratoTurno`,
    { prefCodigo, carDapCodigo }
  );
  return rows;
}

function horarioKey(row) {
  const h = formatHorario(row.carPratoHorario || row.refTipHorario);
  return `${h}|${row.refTipDescricao || row.carPratoTurno}`;
}

function buildWeekBlocks(week, pratos, opcNutrientesMedida = "TS") {
  const weekPratos = pratos.filter((p) => dateInRange(p.carPratoData, week.dataIni, week.dataFim));
  if (!weekPratos.length) return { headers: [], rows: [] };

  const headers = [];
  for (let d = new Date(week.dataIni); d <= week.dataFim; d.setDate(d.getDate() + 1)) {
    const dow = gxDayOfWeek(d);
    if (opcNutrientesMedida === "TS" && dow === 7) {
      headers.push({ dow, label: "Observação", date: new Date(d), isObs: true });
    } else {
      headers.push({ dow, label: formatDayHeader(d), date: new Date(d), isObs: false });
    }
  }

  const slots = new Map();
  for (const prato of weekPratos) {
    const key = horarioKey(prato);
    const h = formatHorario(prato.carPratoHorario || prato.refTipHorario);
    const turnoLabel = h ? `${h} - ${prato.refTipDescricao || ""}` : String(prato.refTipDescricao || "");
    const colIdx = headers.findIndex((hd) => sameDay(hd.date, prato.carPratoData));
    if (colIdx < 0 || headers[colIdx]?.isObs) continue;

    if (!slots.has(key)) {
      slots.set(key, {
        turnoLabel,
        sortKey: horarioSortKey(h),
        byCol: new Map(),
      });
    }
    const slot = slots.get(key);
    if (!slot.byCol.has(colIdx)) slot.byCol.set(colIdx, []);
    const nome = prato.pratoDscricao || "";
    if (nome && !slot.byCol.get(colIdx).includes(nome)) {
      slot.byCol.get(colIdx).push(nome);
    }
  }

  const rows = [...slots.values()]
    .sort((a, b) => a.sortKey - b.sortKey || a.turnoLabel.localeCompare(b.turnoLabel, "pt-BR"))
    .map((slot) => ({
      turnoLabel: slot.turnoLabel,
      cells: headers.map((_, i) => (slot.byCol.get(i) || []).join("\n")),
    }));

  return { headers, rows };
}

async function loadNutricionistas(prefCodigo, cardapio) {
  const ids = [
    cardapio.carDapNutricionista,
    cardapio.carDapNutricionista1,
    cardapio.carDapNutricionista2,
    cardapio.carDapNutricionista3,
  ].filter((id) => id && Number(id) > 0);

  if (!ids.length) return [];
  const placeholders = ids.map((_, i) => `:id${i}`).join(", ");
  const params = { prefCodigo };
  ids.forEach((id, i) => {
    params[`id${i}`] = id;
  });
  const [rows] = await pool.query(
    `SELECT usuCodigo, usuNome, usuInscricao FROM trnsusuarios
     WHERE prefCodigo = :prefCodigo AND usuCodigo IN (${placeholders})`,
    params
  );
  return rows;
}

/** Agrupa ingredientes por área/etapa e turno do grupo (carGruTurno). */
export function groupIngredientesPorAreaTurno(ingredientes) {
  const map = new Map();
  for (const ing of ingredientes) {
    const areaNome = ing.AreEnsNome || "";
    const etapaNome = ing.AreEnsEtapaNome || "";
    const areaEtapa = [areaNome, etapaNome].filter(Boolean).join(" / ") || "—";
    const turno = turnoGrupoLabel(ing.carGruTurno);
    const key = `${ing.AreEnsCodigo ?? 0}|${ing.AreEnsSequencial ?? 0}|${ing.carGruTurno ?? 0}`;

    if (!map.has(key)) {
      map.set(key, { areaEtapa, turno, itens: [] });
    }
    map.get(key).itens.push({
      prodDescricao: ing.prodDescricao,
      quantidadeGramas: formatPercaptaGramas(ing.pratIngrQuantidade),
    });
  }

  return [...map.values()].sort((a, b) => {
    const c = a.areaEtapa.localeCompare(b.areaEtapa, "pt-BR");
    return c !== 0 ? c : a.turno.localeCompare(b.turno, "pt-BR");
  });
}

async function loadReceitas(prefCodigo, carDapCodigo) {
  const [pratoIds] = await pool.query(
    `SELECT DISTINCT carPratoRefeicao AS pratoCodigo FROM trnscardapioprato
     WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo`,
    { prefCodigo, carDapCodigo }
  );

  const receitas = [];
  for (const { pratoCodigo } of pratoIds) {
    const [pratos] = await pool.query(
      `SELECT pratoCodigo, pratoDscricao, pratoModoDeFazer, pratoComFreezer, pratoForno, pratoRepeticao
       FROM trnspratos WHERE prefCodigo = :prefCodigo AND pratoCodigo = :pratoCodigo`,
      { prefCodigo, pratoCodigo }
    );
    const prato = pratos[0];
    if (!prato) continue;

    const [ingredientes] = await pool.query(
      `SELECT pi.AreEnsCodigo, pi.AreEnsSequencial, pi.carGruTurno, pi.pratIngrQuantidade,
              p.prodDescricao, ae.AreEnsNome, et.AreEnsEtapaNome
       FROM trnspratosingredientes pi
       INNER JOIN trnsprodutos p ON p.prefCodigo = pi.prefCodigo AND p.prodCodigo = pi.pratIngrProdCodigo
       LEFT JOIN trnsareaensino ae ON ae.prefCodigo = pi.prefCodigo AND ae.AreEnsCodigo = pi.AreEnsCodigo
       LEFT JOIN trnsareaensinoetapa et ON et.prefCodigo = pi.prefCodigo
         AND et.AreEnsCodigo = pi.AreEnsCodigo AND et.AreEnsSequencial = pi.AreEnsSequencial
       WHERE pi.prefCodigo = :prefCodigo AND pi.pratoCodigo = :pratoCodigo AND pi.pratIngrQuantidade > 0
       ORDER BY ae.AreEnsNome, et.AreEnsEtapaNome, pi.carGruTurno, p.prodDescricao`,
      { prefCodigo, pratoCodigo }
    );

    receitas.push({
      pratoDscricao: prato.pratoDscricao,
      pratoModoDeFazer: prato.pratoModoDeFazer || "",
      usaFreezer: prato.pratoComFreezer === "S" ? "Sim" : "Não",
      usaForno: prato.pratoForno === "S" ? "Sim" : "Não",
      repete: prato.pratoRepeticao === "S" ? "Sim" : "Não",
      grupos: groupIngredientesPorAreaTurno(ingredientes.map((i) => ({
        ...i,
        prodDescricao: i.prodDescricao,
      }))),
    });
  }
  return receitas;
}

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Percapta gravada em kg (0,0400 = 40 g). */
export function formatPercaptaGramas(value) {
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) return "—";
  const grams = n < 1 ? n * 1000 : n;
  return `${grams.toLocaleString("pt-BR", { maximumFractionDigits: grams < 10 ? 1 : 0 })} g`;
}

/** Agrupa preparações do mesmo dia por horário/tipo de refeição (ordem crescente). */
export function groupRefeicoesPorHorario(pratosDia) {
  const groups = new Map();
  for (const p of pratosDia) {
    const horario = formatHorario(p.carPratoHorario || p.refTipHorario);
    const turno = p.refTipDescricao || "";
    const gKey = `${p.carPratoTurno}|${horario}|${turno}`;
    if (!groups.has(gKey)) {
      groups.set(gKey, {
        horario,
        turno,
        label: horario ? `${horario} - ${turno}` : turno,
        pratos: [],
        sortKey: horarioSortKey(horario),
      });
    }
    const nome = p.pratoDscricao || "";
    if (nome && !groups.get(gKey).pratos.includes(nome)) {
      groups.get(gKey).pratos.push(nome);
    }
  }
  return [...groups.values()]
    .sort((a, b) => a.sortKey - b.sortKey || String(a.turno).localeCompare(String(b.turno), "pt-BR"))
    .map((g) => ({ ...g, prato: g.pratos.join("\n") }));
}

/** Grade calendário mensal (domingo = 1ª coluna) para impressão paisagem. */
export function buildCalendarGrid(mesAno, pratos, weekRanges, opcSemanaINI, opcSemanaFIN) {
  const base = toDateOnly(mesAno);
  if (!base) return null;

  const year = base.getFullYear();
  const month = base.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = new Date(year, month, 1).getDay();

  const selectedDates = new Set();
  for (const w of weekRanges) {
    if (w.semana < opcSemanaINI || w.semana > opcSemanaFIN) continue;
    for (let d = new Date(w.dataIni); d <= w.dataFim; d.setDate(d.getDate() + 1)) {
      selectedDates.add(isoFromDate(d));
    }
  }

  const byDate = new Map();
  for (const p of pratos) {
    const key = isoFromDate(p.carPratoData);
    if (!key || !selectedDates.has(key)) continue;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(p);
  }
  for (const [key, list] of byDate) {
    byDate.set(key, groupRefeicoesPorHorario(list));
  }

  const weeks = [];
  let row = Array.from({ length: startPad }, () => null);

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = isoFromParts(year, month, day);
    const weekday = new Date(`${iso}T12:00:00`).getDay();
    const inRange = selectedDates.has(iso);
    row.push({
      day,
      iso,
      weekday,
      isWeekend: weekday === 0 || weekday === 6,
      inRange,
      refeicoes: inRange ? byDate.get(iso) || [] : [],
    });
    if (row.length === 7) {
      weeks.push(row);
      row = [];
    }
  }
  if (row.length) {
    while (row.length < 7) row.push(null);
    weeks.push(row);
  }

  return {
    year,
    month,
    monthLabel: `${MONTHS_PT[month]} ${year}`,
    weekdays: WEEKDAYS_PT,
    weeks,
  };
}

/** Resumo nutricional consolidado do período (média diária letiva — referência FNDE / GeneXus). */
export async function buildResumoNutricionalPeriodo(
  prefCodigo,
  carDapCodigo,
  pratos,
  weekRanges,
  opcSemanaINI,
  opcSemanaFIN,
  opcNutrientesMedida = "TS"
) {
  const { groupPratosByDate, calcNutrientsForDay, averageNutrients, sumNutrients, macroPercentByGrams } = await import("./cardapioNutrientesService.js");
  const pratosByDate = groupPratosByDate(pratos);
  const diasNutricao = [];

  for (const w of weekRanges) {
    if (w.semana < opcSemanaINI || w.semana > opcSemanaFIN) continue;
    for (let d = new Date(w.dataIni); d <= w.dataFim; d.setDate(d.getDate() + 1)) {
      if (opcNutrientesMedida === "TS" && gxDayOfWeek(d) === 7) continue;
      const iso = isoFromDate(d);
      const pratosDia = pratosByDate.get(iso) || [];
      if (!pratosDia.length) continue;
      const pratoCodigos = [...new Set(pratosDia.map((p) => p.carPratoRefeicao))];
      const nutrientes = await calcNutrientsForDay(prefCodigo, carDapCodigo, iso, pratoCodigos);
      if (nutrientes.kcal > 0) diasNutricao.push(nutrientes);
    }
  }

  if (!diasNutricao.length) return null;

  const avg = averageNutrients(diasNutricao);
  const pct = macroPercentByGrams(avg);
  return {
    totalCalorias: sumNutrients(diasNutricao).kcal,
    mediaCalorica: avg.kcal,
    mediaProteinas: avg.proteinas,
    mediaCarboidratos: avg.carboidratos,
    mediaLipidios: avg.lipidios,
    mediaFibras: avg.fibras,
    mediaCalcio: avg.calcio,
    mediaFerro: avg.ferro,
    mediaMagnesio: avg.magnesio,
    mediaZinco: avg.zinco,
    mediaVitaminaA: avg.vitaminaA,
    mediaVitaminaC: avg.vitaminaC,
    mediaSodio: avg.sodio,
    macroPercentCarb: pct.carbPct,
    macroPercentProt: pct.protPct,
    macroPercentLip: pct.lipPct,
    diasComRefeicao: diasNutricao.length,
  };
}

/**
 * Espelha PRINTCardapioMacrosMicros / WPOpcaoImpressaoCardapio.
 */
export async function buildCardapioReportData(prefCodigo, params) {
  const carDapCodigo = Number(params.carDapCodigo);
  const locCodigo = Number(params.locCodigo) || 0;
  const opcSemanaINI = Math.max(1, Number(params.opcSemanaINI) || 1);
  const opcSemanaFIN = Math.min(6, Number(params.opcSemanaFIN) || 6);
  const opcReceita = params.opcReceita === "S";
  const opcNutrientes = params.opcNutrientes !== "N";
  const opcNutrientesMedida = params.opcNutrientesMedida || "TS";

  const [prefRows] = await pool.query(
    `SELECT prefCodigo, prefNome, PrefMunicipio FROM trnsprefeituras WHERE prefCodigo = :prefCodigo`,
    { prefCodigo }
  );
  const prefeitura = prefRows[0];
  if (!prefeitura) return { error: "Prefeitura não encontrada" };
  const logoData = await loadPrefeituraLogo(prefCodigo);
  const municipio = prefeitura.PrefMunicipio || prefeitura.prefNome || "";

  const [cardapioRows] = await pool.query(
    `SELECT carDapCodigo, carDapDescricao, carDapMesAno, carDapGruCodigo,
            carDapNutricionista, carDapNutricionista1, carDapNutricionista2, carDapNutricionista3
     FROM trnscardapio WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo`,
    { prefCodigo, carDapCodigo }
  );
  const cardapio = cardapioRows[0];
  if (!cardapio) return { error: "Cardápio não encontrado" };

  let subtitulo = "";
  if (locCodigo) {
    const [locRows] = await pool.query(
      `SELECT locDescricao FROM trnslocal WHERE prefCodigo = :prefCodigo AND locCodigo = :locCodigo`,
      { prefCodigo, locCodigo }
    );
    if (locRows[0]) subtitulo = `Unidade Educativa : ${locRows[0].locDescricao}`;
  }

  const pratos = await loadPratosMes(prefCodigo, carDapCodigo);
  if (!pratos.length) return { error: "Cardápio sem refeições cadastradas" };

  const allWeeks = buildWeekRanges(cardapio.carDapMesAno);
  const weeks = allWeeks
    .filter((w) => w.semana >= opcSemanaINI && w.semana <= opcSemanaFIN)
    .map((w) => ({
      semana: w.semana,
      tituloSemana: `${w.semana}ª Semana`,
      ...buildWeekBlocks(w, pratos, opcNutrientesMedida),
    }))
    .filter((w) => w.rows.length > 0);

  if (!weeks.length) return { error: "Nenhuma refeição no intervalo de semanas selecionado" };

  const calendar = buildCalendarGrid(cardapio.carDapMesAno, pratos, allWeeks, opcSemanaINI, opcSemanaFIN);

  const nutricionistas = await loadNutricionistas(prefCodigo, cardapio);
  const receitas = opcReceita ? await loadReceitas(prefCodigo, carDapCodigo) : [];
  const resumoMensal = opcNutrientes
    ? await buildResumoNutricionalPeriodo(
      prefCodigo,
      carDapCodigo,
      pratos,
      allWeeks,
      opcSemanaINI,
      opcSemanaFIN,
      opcNutrientesMedida
    )
    : null;

  return {
    prefeitura: {
      prefCodigo: prefeitura.prefCodigo,
      prefNome: prefeitura.prefNome,
      prefMunicipio: municipio,
      prefLogo: logoData?.buffer || null,
    },
    titulo: String(cardapio.carDapDescricao || "").trim(),
    subtitulo,
    carDapMesAno: String(cardapio.carDapMesAno).slice(0, 10),
    calendar,
    weeks,
    nutricionistas,
    receitas,
    resumoMensal,
    params: { opcSemanaINI, opcSemanaFIN, opcReceita, opcNutrientes, opcNutrientesMedida, locCodigo },
  };
}

async function loadPrefeituraCompleta(prefCodigo) {
  const [rows] = await pool.query(
    `SELECT prefCodigo, prefNome, PrefMunicipio, prefEstado, prefCNPJ, prefTelefone
     FROM trnsprefeituras WHERE prefCodigo = :prefCodigo`,
    { prefCodigo }
  );
  return rows[0] ?? null;
}

async function loadUnidadeEscolar(prefCodigo, locCodigo) {
  if (!locCodigo) return null;
  const [rows] = await pool.query(
    `SELECT l.locCodigo, l.locDescricao, TRIM(l.locInep) AS locInep, l.locTipoUnidade,
            l.locResponsavel, l.locDiretor, l.locAbreviatura,
            u.usuNome AS responsavelNome, d.usuNome AS diretorNome
     FROM trnslocal l
     LEFT JOIN trnsusuarios u ON u.prefCodigo = l.prefCodigo AND u.usuCodigo = l.locResponsavel
     LEFT JOIN trnsusuarios d ON d.prefCodigo = l.prefCodigo AND d.usuCodigo = l.locDiretor
     WHERE l.prefCodigo = :prefCodigo AND l.locCodigo = :locCodigo`,
    { prefCodigo, locCodigo }
  );
  return rows[0] ?? null;
}

async function loadAtendimentoInfo(prefCodigo, carGruCodigo, locCodigo) {
  if (!carGruCodigo) return [];
  const params = { prefCodigo, carGruCodigo };
  let locFilter = "";
  if (locCodigo) {
    locFilter = " AND a.locCodigo = :locCodigo";
    params.locCodigo = locCodigo;
  }
  const [rows] = await pool.query(
    `SELECT DISTINCT ae.AreEnsNome, et.AreEnsEtapaNome, a.AtendimentoTurno,
            (COALESCE(a.AtendimentoDiabeticoDomingo,0)+COALESCE(a.AtendimentoDiabeticoSegunda,0)+COALESCE(a.AtendimentoDiabeticoTerca,0)+COALESCE(a.AtendimentoDiabeticoQuarta,0)+COALESCE(a.AtendimentoDiabeticoQuinta,0)+COALESCE(a.AtendimentoDiabeticoSexta,0)+COALESCE(a.AtendimentoDiabeticoSabado,0)) AS diabeticoTotal,
            (COALESCE(a.AtendimentoGlutenDomingo,0)+COALESCE(a.AtendimentoGlutenSegunda,0)+COALESCE(a.AtendimentoGlutenTerca,0)+COALESCE(a.AtendimentoGlutenQuarta,0)+COALESCE(a.AtendimentoGlutenQuinta,0)+COALESCE(a.AtendimentoGlutenSexta,0)+COALESCE(a.AtendimentoGlutenSabado,0)) AS glutenTotal,
            (COALESCE(a.AtendimentoLactoseDomingo,0)+COALESCE(a.AtendimentoLactoseSegunda,0)+COALESCE(a.AtendimentoLactoseTerca,0)+COALESCE(a.AtendimentoLactoseQuarta,0)+COALESCE(a.AtendimentoLactoseQuinta,0)+COALESCE(a.AtendimentoLactoseSexta,0)+COALESCE(a.AtendimentoLactoseSabado,0)) AS lactoseTotal,
            (COALESCE(a.AtendimentoColesterolDomingo,0)+COALESCE(a.AtendimentoColesterolSegunda,0)+COALESCE(a.AtendimentoColesterolTerca,0)+COALESCE(a.AtendimentoColesterolQuarta,0)+COALESCE(a.AtendimentoColesterolQuinta,0)+COALESCE(a.AtendimentoColesterolSexta,0)+COALESCE(a.AtendimentoColesterolSabado,0)) AS colesterolTotal,
            (COALESCE(a.AtendimentoNormalDomingo,0)+COALESCE(a.AtendimentoNormalSegunda,0)+COALESCE(a.AtendimentoNormalTerca,0)+COALESCE(a.AtendimentoNormalQuarta,0)+COALESCE(a.AtendimentoNormalQuinta,0)+COALESCE(a.AtendimentoNormalSexta,0)+COALESCE(a.AtendimentoNormalSabado,0)) AS normalTotal
     FROM atendimento a
     LEFT JOIN trnsareaensino ae ON ae.prefCodigo = a.prefCodigo AND ae.AreEnsCodigo = a.AreEnsCodigo
     LEFT JOIN trnsareaensinoetapa et ON et.prefCodigo = a.prefCodigo
       AND et.AreEnsCodigo = a.AreEnsCodigo AND et.AreEnsSequencial = a.AreEnsSequencial
     WHERE a.prefCodigo = :prefCodigo AND a.carGruCodigo = :carGruCodigo${locFilter}
     ORDER BY ae.AreEnsNome, et.AreEnsEtapaNome`,
    params
  );
  return rows;
}

async function loadPreparacoesControle(prefCodigo, carDapCodigo) {
  const [pratoIds] = await pool.query(
    `SELECT DISTINCT cp.carPratoRefeicao AS pratoCodigo, p.pratoDscricao, p.pratoModoDeFazer
     FROM trnscardapioprato cp
     INNER JOIN trnspratos p ON p.prefCodigo = cp.prefCodigo AND p.pratoCodigo = cp.carPratoRefeicao
     WHERE cp.prefCodigo = :prefCodigo AND cp.carDapCodigo = :carDapCodigo
     ORDER BY p.pratoDscricao`,
    { prefCodigo, carDapCodigo }
  );

  const preparacoes = [];
  for (const row of pratoIds) {
    const [ingredientes] = await pool.query(
      `SELECT pi.pratIngrQuantidade, ae.AreEnsNome, et.AreEnsEtapaNome, pi.carGruTurno
       FROM trnspratosingredientes pi
       LEFT JOIN trnsareaensino ae ON ae.prefCodigo = pi.prefCodigo AND ae.AreEnsCodigo = pi.AreEnsCodigo
       LEFT JOIN trnsareaensinoetapa et ON et.prefCodigo = pi.prefCodigo
         AND et.AreEnsCodigo = pi.AreEnsCodigo AND et.AreEnsSequencial = pi.AreEnsSequencial
       WHERE pi.prefCodigo = :prefCodigo AND pi.pratoCodigo = :pratoCodigo AND pi.pratIngrQuantidade > 0`,
      { prefCodigo, pratoCodigo: row.pratoCodigo }
    );

    const faixas = [...new Set(ingredientes.map((i) => [i.AreEnsNome, i.AreEnsEtapaNome].filter(Boolean).join(" - ")).filter(Boolean))];
    const percaptas = ingredientes.map((i) => Number(i.pratIngrQuantidade) || 0).filter((n) => n > 0);
    const perCaptaMedia = percaptas.length
      ? percaptas.reduce((a, b) => a + b, 0) / percaptas.length
      : 0;

    preparacoes.push({
      codigo: row.pratoCodigo,
      nome: row.pratoDscricao,
      fichaTecnica: String(row.pratoCodigo).padStart(6, "0"),
      receitaPadronizada: String(row.pratoCodigo),
      perCapta: formatPercaptaGramas(perCaptaMedia),
      rendimento: row.pratoModoDeFazer ? "Conforme ficha técnica" : "—",
      faixaEtaria: faixas.join(" · ") || "—",
    });
  }
  return preparacoes;
}

function formatMesAnoCompleto(iso) {
  const months = MONTHS_PT;
  const [y, m] = String(iso).slice(0, 10).split("-").map(Number);
  return `${months[m - 1]}/${y}`;
}

/**
 * Dados completos para documento institucional PNAE (A4 retrato).
 */
export async function buildCardapioPnaeReportData(prefCodigo, params) {
  const {
    buildPnaeWeeklyRows,
    groupPratosByDate,
    calcNutrientsForDay,
    averageNutrients,
    sumNutrients,
    loadAgriculturaFamiliar,
  } = await import("./cardapioNutrientesService.js");

  const carDapCodigo = Number(params.carDapCodigo);
  const locCodigo = Number(params.locCodigo) || 0;
  const opcSemanaINI = Math.max(1, Number(params.opcSemanaINI) || 1);
  const opcSemanaFIN = Math.min(6, Number(params.opcSemanaFIN) || 6);
  const opcReceita = params.opcReceita === "S";

  const prefeitura = await loadPrefeituraCompleta(prefCodigo);
  if (!prefeitura) return { error: "Prefeitura não encontrada" };
  const logoData = await loadPrefeituraLogo(prefCodigo);

  const [cardapioRows] = await pool.query(
    `SELECT carDapCodigo, carDapDescricao, carDapMesAno, carDapGruCodigo,
            carDapNutricionista, carDapNutricionista1, carDapNutricionista2, carDapNutricionista3
     FROM trnscardapio WHERE prefCodigo = :prefCodigo AND carDapCodigo = :carDapCodigo`,
    { prefCodigo, carDapCodigo }
  );
  const cardapio = cardapioRows[0];
  if (!cardapio) return { error: "Cardápio não encontrado" };

  const pratos = await loadPratosMes(prefCodigo, carDapCodigo);
  if (!pratos.length) return { error: "Cardápio sem refeições cadastradas" };

  const mesAnoIso = isoFromDate(cardapio.carDapMesAno);
  if (!mesAnoIso) return { error: "Mês/ano do cardápio inválido" };
  const year = Number(mesAnoIso.slice(0, 4));

  const allWeeks = buildWeekRanges(mesAnoIso);
  const pratosByDate = groupPratosByDate(pratos);
  const { loadCalendarioMap } = await import("./calendarioLetivoService.js");
  const calendarMap = await loadCalendarioMap(prefCodigo, year);
  const tabelaSemanal = buildPnaeWeeklyRows(allWeeks, pratosByDate, opcSemanaINI, opcSemanaFIN, calendarMap);
  if (!tabelaSemanal.length) return { error: "Nenhuma refeição no intervalo de semanas selecionado" };

  const unidade = await loadUnidadeEscolar(prefCodigo, locCodigo);
  const atendimentos = await loadAtendimentoInfo(prefCodigo, cardapio.carDapGruCodigo, locCodigo);
  const preparacoes = await loadPreparacoesControle(prefCodigo, carDapCodigo);
  const agriculturaFamiliar = await loadAgriculturaFamiliar(prefCodigo, carDapCodigo);
  const nutricionistas = await loadNutricionistas(prefCodigo, cardapio);
  const receitas = opcReceita ? await loadReceitas(prefCodigo, carDapCodigo) : [];

  const diasNutricao = [];
  for (const week of tabelaSemanal) {
    for (const day of week.days) {
      if (!day.iso) continue;
      const pratosDia = pratosByDate.get(day.iso) || [];
      const pratoCodigos = [...new Set(pratosDia.map((p) => p.carPratoRefeicao))];
      const nutrientes = await calcNutrientsForDay(prefCodigo, carDapCodigo, day.iso, pratoCodigos);
      diasNutricao.push({
        dia: `${day.label} (${day.iso.split("-").reverse().join("/")})`,
        iso: day.iso,
        ...nutrientes,
      });
    }
  }

  const resumoMensal = {
    totalCalorias: sumNutrients(diasNutricao).kcal,
    mediaCalorica: averageNutrients(diasNutricao).kcal,
    mediaProteinas: averageNutrients(diasNutricao).proteinas,
    mediaCarboidratos: averageNutrients(diasNutricao).carboidratos,
    mediaLipidios: averageNutrients(diasNutricao).lipidios,
    mediaFibras: averageNutrients(diasNutricao).fibras,
    mediaCalcio: averageNutrients(diasNutricao).calcio,
    mediaFerro: averageNutrients(diasNutricao).ferro,
    mediaMagnesio: averageNutrients(diasNutricao).magnesio,
    mediaZinco: averageNutrients(diasNutricao).zinco,
    mediaVitaminaA: averageNutrients(diasNutricao).vitaminaA,
    mediaVitaminaC: averageNutrients(diasNutricao).vitaminaC,
    mediaSodio: averageNutrients(diasNutricao).sodio,
    mediaVitaminas: (averageNutrients(diasNutricao).vitaminaA + averageNutrients(diasNutricao).vitaminaC) / 2,
    mediaMinerais: (
      averageNutrients(diasNutricao).calcio
      + averageNutrients(diasNutricao).ferro
      + averageNutrients(diasNutricao).zinco
      + averageNutrients(diasNutricao).magnesio
    ) / 4,
  };

  const faixaEtaria = [...new Set(atendimentos.map((a) => `${a.AreEnsNome} — ${a.AreEnsEtapaNome}`.trim()))].join(" · ");
  const turnos = [...new Set(atendimentos.map((a) => a.AtendimentoTurno).filter(Boolean))].join(" · ");

  const atendimentoEspecial = {
    diabeticos: atendimentos.reduce((s, a) => s + (Number(a.diabeticoTotal) || 0), 0),
    celiacos: atendimentos.reduce((s, a) => s + (Number(a.glutenTotal) || 0), 0),
    intolerantesLactose: atendimentos.reduce((s, a) => s + (Number(a.lactoseTotal) || 0), 0),
    alergicos: 0,
    dietasEspeciais: atendimentos.reduce((s, a) => s + (Number(a.colesterolTotal) || 0), 0),
  };

  const municipioNome = prefeitura.PrefMunicipio || prefeitura.prefNome || "";

  return {
    formato: "pnae",
    prefeitura: {
      prefCodigo: prefeitura.prefCodigo,
      prefNome: prefeitura.prefNome,
      prefMunicipio: municipioNome,
      prefEstado: prefeitura.prefEstado || "",
      prefLogo: logoData?.buffer || null,
      exercicio: year,
      mesReferencia: formatMesAnoCompleto(mesAnoIso),
      secretariaEducacao: "SECRETARIA MUNICIPAL DE EDUCAÇÃO",
    },
    cardapio: {
      carDapCodigo,
      carDapDescricao: cardapio.carDapDescricao,
      carDapMesAno: mesAnoIso,
    },
    identificacao: {
      unidadeEscolar: unidade?.locDescricao || "—",
      codigoInep: unidade?.locInep?.trim() || "—",
      modalidadeEnsino: faixaEtaria || "—",
      faixaEtaria: faixaEtaria || "—",
      turno: turnos || "—",
      responsavelUnidade: unidade?.responsavelNome || unidade?.diretorNome || "—",
      municipio: municipioNome,
      mesAno: formatMesAnoCompleto(mesAnoIso),
    },
    tabelaSemanal,
    preparacoes,
    nutrientesDiarios: diasNutricao,
    resumoMensal,
    agriculturaFamiliar,
    atendimentoEspecial,
    nutricionistas,
    receitas,
    params: { opcSemanaINI, opcSemanaFIN, opcReceita, locCodigo },
  };
}
