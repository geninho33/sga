import { PERCAPTA_AREAS } from "../data/logisticaCatalog";

function parseLocIgnore(json) {
  if (!json) return new Set();
  try {
    const arr = typeof json === "string" ? JSON.parse(json) : json;
    return new Set((Array.isArray(arr) ? arr : []).map(Number).filter(Boolean));
  } catch {
    return new Set();
  }
}

export function totalPessoasLocal(pessoa) {
  if (!pessoa) return 0;
  return PERCAPTA_AREAS.reduce((s, a) => s + (Number(pessoa[a.percaptaKey]) || 0), 0);
}

function calcValorPerCapta(pessoa, percapta) {
  if (!pessoa || !percapta) return 0;
  let v = 0;
  for (const a of PERCAPTA_AREAS) {
    const pc = Number(percapta[a.percaptaKey]) || 0;
    const of = Number(percapta[a.ofertaKey]) || 0;
    const pes = Number(pessoa[a.percaptaKey]) || 0;
    v += pc * pes * of;
  }
  return v;
}

/** Espelha GeneXus: round((valor / qtdeEmbalagem) + 0.49), mínimo 1. */
export function calcQuantidadeGuia(valorPerCapta, qtdeEmbalagem) {
  const emb = Number(qtdeEmbalagem) || 0;
  if (valorPerCapta <= 0 || emb <= 0) return 0;
  let q = Math.round(valorPerCapta / emb + 0.49);
  if (q <= 0) q = 1;
  return q;
}

function shouldCalcForLocal(prodSaldo, locCodigo, percapta) {
  if ((Number(prodSaldo) || 0) <= 0) return false;
  const ignored = parseLocIgnore(percapta?.locCodigoCollectionJson);
  return !ignored.has(Number(locCodigo));
}

export function shouldIncludeLocalInGuia(pessoa, alimentos, percaptaList, locCodigo) {
  if (!pessoa || totalPessoasLocal(pessoa) <= 0) return false;
  for (const ali of alimentos) {
    const perc = percaptaList.find((p) => String(p.prodCodigo) === String(ali.prodCodigo));
    if (!perc || !shouldCalcForLocal(ali.prodSaldo, locCodigo, perc)) continue;
    if (calcValorPerCapta(pessoa, perc) > 0) return true;
  }
  return false;
}

/** Prévia das guias — RanchoWizardPlanilhaGuias (Grid.Load). */
export function buildRanchoPlanilhaGuiasPreview(locais, alimentos, pessoas, percaptaList) {
  const rows = [];
  for (const loc of locais) {
    const pessoa = pessoas.find((p) => String(p.locCodigo) === String(loc.locCodigo));
    if (!shouldIncludeLocalInGuia(pessoa, alimentos, percaptaList, loc.locCodigo)) continue;

    for (const ali of alimentos) {
      const perc = percaptaList.find((p) => String(p.prodCodigo) === String(ali.prodCodigo));
      if (!perc || !shouldCalcForLocal(ali.prodSaldo, loc.locCodigo, perc)) continue;
      const valorPerCapta = calcValorPerCapta(pessoa, perc);
      if (valorPerCapta <= 0) continue;
      const quantidade = calcQuantidadeGuia(valorPerCapta, ali.qtdeEmbalagem);
      rows.push({
        locCodigo: loc.locCodigo,
        locDescricao: loc.locDescricao,
        prodCodigo: ali.prodCodigo,
        prodDescricao: ali.prodDescricao,
        uniDescricao: ali.uniDescricao || "—",
        quantidade,
      });
    }
  }
  return rows;
}
