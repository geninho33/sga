import { pool } from "../src/db.js";
import { upsertNotaItem } from "../src/services/logisticaEntities.js";
import { renderGuiaDistribuicaoPrintHtml } from "../src/services/guiaDistribuicaoPrintService.js";

try {
  const r = await upsertNotaItem(26, 1057, {
    notaItemProduto: 23,
    notaItemQtde: 200,
    notaItemValor: 250,
    notaItemProdutoUnidade: 4,
    notaItemValidade: "2026-06-09",
  });
  console.log("PUT upsert OK", r.data?.notaItemQtde);
} catch (e) {
  console.error("PUT upsert FAIL", e.message);
}

try {
  const html = await renderGuiaDistribuicaoPrintHtml(26, 1, { duasVias: false });
  console.log("Print HTML length", html?.length ?? 0);
} catch (e) {
  console.error("Print FAIL", e.message);
}

process.exit(0);
