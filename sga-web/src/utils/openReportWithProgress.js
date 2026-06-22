import { apiFetch } from "../api/client";

/**
 * Busca um relatório (PDF ou HTML) com progresso simulado e abre em nova aba.
 */
export async function openReportWithProgress(url, { method = "GET", body, params, onProgress, minDuration = 700 } = {}) {
  let finalUrl = url;
  if (params && typeof params === "object") {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== "" && v != null) qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) finalUrl += (url.includes("?") ? "&" : "?") + s;
  }

  let progress = 0;
  const start = Date.now();
  onProgress?.(5);

  const timer = setInterval(() => {
    progress = Math.min(92, progress + 3 + Math.random() * 7);
    onProgress?.(progress);
  }, 160);

  try {
    const res = await apiFetch(finalUrl, {
      method,
      headers: body != null ? { "Content-Type": "application/json" } : undefined,
      body: body != null ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Falha ao gerar relatório");
    }

    const blob = await res.blob();
    const elapsed = Date.now() - start;
    if (elapsed < minDuration) {
      await new Promise((r) => setTimeout(r, minDuration - elapsed));
    }

    onProgress?.(100);
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
    return blob;
  } finally {
    clearInterval(timer);
  }
}
