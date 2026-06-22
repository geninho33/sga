/** Tipo de unidade escolar — ordem GeneXus trnslocal.locTipoUnidade */
export const LOC_TIPO_UNIDADE_OPTIONS = [
  { value: "9", label: "9 - Unidade Central" },
  { value: "2", label: "2 - Secretaria" },
  { value: "1", label: "1 - Centro Comunitário" },
  { value: "6", label: "6 - Creche" },
  { value: "3", label: "3 - Entidade Filantrópica" },
  { value: "5", label: "5 - Escola" },
  { value: "8", label: "8 - Pré-escola" },
];

const LOC_TIPO_MAP = Object.fromEntries(
  LOC_TIPO_UNIDADE_OPTIONS.map((o) => [String(o.value), o.label.replace(/^\d+\s-\s/, "")])
);

export function formatLocTipoUnidade(value) {
  if (value === null || value === undefined || value === "") return "—";
  const key = String(value);
  const opt = LOC_TIPO_UNIDADE_OPTIONS.find((o) => o.value === key);
  return opt ? opt.label : key;
}

export function formatRotaLabel(codigo, descricao) {
  if (descricao) return descricao;
  if (codigo === null || codigo === undefined || codigo === "" || Number(codigo) === 0) return "—";
  return String(codigo);
}

export function rotaSelectLabel(item) {
  if (!item) return "";
  const cod = item.rotaCodigo ?? item.locNota ?? "";
  const desc = item.rotaDescricao ?? "";
  if (desc) return `${cod} - ${desc}`;
  return String(cod);
}

/** Áreas de ensino — AjustePerCaptas / Rancho wizard */
export const PERCAPTA_AREAS = [
  { code: 1, percaptaKey: "bercario1", ofertaKey: "bercario1Oferta", label: "Berçário I", short: "Berç. I" },
  { code: 2, percaptaKey: "bercario2", ofertaKey: "bercario2Oferta", label: "Berçário II", short: "Berç. II" },
  { code: 3, percaptaKey: "creche", ofertaKey: "crecheOferta", label: "Creche", short: "Creche" },
  { code: 4, percaptaKey: "emeb", ofertaKey: "emebOferta", label: "EMEB", short: "EMEB" },
  { code: 5, percaptaKey: "integral", ofertaKey: "integralOferta", label: "Integral", short: "Integral" },
  { code: 99999997, percaptaKey: "funcionarios", ofertaKey: "funcionariosOferta", label: "Funcionários", short: "Func." },
];

export const MESES_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function periodoRangeFromMesAno(mes, ano) {
  const m = Number(mes);
  const y = Number(ano);
  if (!m || !y) return { dataInicial: "", dataFinal: "" };
  const lastDay = new Date(y, m, 0).getDate();
  const pad = (n) => String(n).padStart(2, "0");
  return {
    dataInicial: `${y}-${pad(m)}-01`,
    dataFinal: `${y}-${pad(m)}-${pad(lastDay)}`,
  };
}
