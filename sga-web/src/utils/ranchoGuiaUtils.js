import { formatDecimalBr } from "./formatBr";

/** Soma quantidades por produto em todas as unidades. */
export function aggregateGuiaTotais(guiasPreview) {
  const map = new Map();
  for (const row of guiasPreview || []) {
    const key = String(row.prodCodigo);
    if (!map.has(key)) {
      map.set(key, {
        prodCodigo: row.prodCodigo,
        prodDescricao: row.prodDescricao,
        total: 0,
      });
    }
    map.get(key).total += Number(row.quantidade) || 0;
  }
  return [...map.values()].sort((a, b) =>
    String(a.prodDescricao).localeCompare(String(b.prodDescricao), "pt-BR")
  );
}

export function printRanchoFixoTotais(guiasPreview, { titulo = "Rancho Fixo — Totais a entregar", periodo = "" } = {}) {
  const totais = aggregateGuiaTotais(guiasPreview);
  const linhas = totais
    .map(
      (t) =>
        `<tr><td class="tnum">${t.prodCodigo}</td><td>${escapeHtml(t.prodDescricao)}</td><td class="tnum">${formatDecimalBr(t.total)}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>${escapeHtml(titulo)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { color: #555; font-size: 13px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background: #f3f3f3; }
  .tnum { text-align: right; font-variant-numeric: tabular-nums; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>${escapeHtml(titulo)}</h1>
  ${periodo ? `<div class="sub">${escapeHtml(periodo)}</div>` : ""}
  <table>
    <thead><tr><th>Cód.</th><th>Produto</th><th>Qtde total</th></tr></thead>
    <tbody>${linhas || "<tr><td colspan=\"3\">Nenhum item.</td></tr>"}</tbody>
  </table>
  <script>window.onload = () => { window.print(); };</script>
</body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
