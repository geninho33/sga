import { writeFileSync } from "fs";
import { buildAndRenderCardapioPnaePdf } from "../src/services/cardapioReportPnaePdf.js";

const prefCodigo = 26;
const carDapCodigo = 28;

const result = await buildAndRenderCardapioPnaePdf(prefCodigo, {
  carDapCodigo,
  locCodigo: 0,
  opcReceita: "S",
  opcSemanaINI: 1,
  opcSemanaFIN: 6,
});

if (result.error) {
  console.error("ERRO:", result.error);
  process.exit(1);
}

const out = `c:\\Desenvolvimento\\sga\\sga-api\\scripts\\cardapio-pnae-${carDapCodigo}.pdf`;
writeFileSync(out, result.buffer);
console.log("OK:", out, result.buffer.length, "bytes");
console.log("Semanas:", result.report.tabelaSemanal?.length);
console.log("Dias nutrição:", result.report.nutrientesDiarios?.length);
console.log("Preparações:", result.report.preparacoes?.length);

process.exit(0);
