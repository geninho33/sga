import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import WizardShell from "../components/wizard/WizardShell";
import WizardProgressModal from "../components/wizard/WizardProgressModal";
import WizardGuiaCards from "../components/wizard/WizardGuiaCards";
import { MESES_LABELS, periodoRangeFromMesAno, rotaSelectLabel } from "../data/logisticaCatalog";
import { getWwModuleById } from "../data/wwModules";
import { formatDecimalBr } from "../utils/formatBr";
import { aggregateGuiaTotais, printRanchoFixoTotais } from "../utils/ranchoGuiaUtils";
import { FaIcon } from "../components/Icon";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";

const STEPS = [
  { id: "Periodo", title: "Período", description: "Informe o ano e o mês base dos dados a serem utilizados nos cálculos." },
  { id: "Locais", title: "Locais", description: "Filtre por rota e selecione os locais de destino." },
  { id: "Alimentos", title: "Alimentos", description: "Lista de alimentos do período (rancho fixo)." },
  { id: "Guias", title: "Guias", description: "Revise locais e alimentos antes de gerar as guias." },
  { id: "Conclusao", title: "Conclusão", description: "O processo foi finalizado com sucesso!" },
];

function emptyData() {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();
  const range = periodoRangeFromMesAno(mes, ano);
  return {
    Periodo: { Mes: mes, Ano: ano, Semana: "", DataEnvio: now.toISOString().slice(0, 10), ...range },
    Locais: { rotaCodigos: [], GridLocais: [] },
    Alimentos: { prodCodigoTipoRemessa: "", GridAlimentos: [] },
    Guias: [],
  };
}

export default function RanchoFixoWizardPage({ onBack }) {
  const module = getWwModuleById("rancho-fixo");
  const refs = useLogisticaReferencias();
  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState(emptyData);
  const [locaisRows, setLocaisRows] = useState([]);
  const [loadingLocais, setLoadingLocais] = useState(false);
  const [loadingAlimentos, setLoadingAlimentos] = useState(false);
  const [loadingGuias, setLoadingGuias] = useState(false);
  const [guiasProgress, setGuiasProgress] = useState(0);
  const [guiasPreview, setGuiasPreview] = useState([]);
  const guiasFetchRef = useRef(0);
  const guiasCacheRef = useRef({ key: "", data: [] });
  const [sessionReady, setSessionReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const step = STEPS[stepIdx];
  const sessionPath = "/api/logistica/wizards/rancho-fixo";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiJson(`${sessionPath}/session`);
        if (!cancelled && res.data) setData({ ...emptyData(), ...res.data });
      } catch { /* nova */ }
      if (!cancelled) setSessionReady(true);
    })();
    return () => { cancelled = true; };
  }, [sessionPath]);

  const saveSession = (payload) =>
    apiJson(`${sessionPath}/session`, { method: "PUT", body: JSON.stringify(payload) });

  const loadLocais = useCallback(async (rotas) => {
    setLoadingLocais(true);
    try {
      const params = rotas?.length ? { rotas: rotas.join(",") } : {};
      const res = await apiJson("/api/logistica/wizards/rancho-planilha/locais", { params });
      const selected = new Set((data.Locais.GridLocais || []).filter((r) => r.selected).map((r) => r.locCodigo));
      setLocaisRows(
        (res.data ?? []).map((r) => ({
          ...r,
          selected: selected.size ? selected.has(r.locCodigo) : true,
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingLocais(false);
    }
  }, [data.Locais.GridLocais]);

  useEffect(() => {
    if (step.id === "Locais") loadLocais(data.Locais.rotaCodigos);
  }, [step.id, data.Locais.rotaCodigos.join(",")]);

  const loadAlimentos = useCallback(async () => {
    setLoadingAlimentos(true);
    try {
      const p = data.Periodo;
      const params = { dataInicial: p.DataInicial, dataFinal: p.DataFinal };
      if (data.Alimentos.prodCodigoTipoRemessa) params.prodCodigoTipoRemessa = data.Alimentos.prodCodigoTipoRemessa;
      const res = await apiJson("/api/logistica/wizards/rancho-planilha/alimentos", { params });
      setData((d) => {
        const sel = new Set((d.Alimentos.GridAlimentos || []).filter((r) => r.selected).map((r) => r.prodCodigo));
        return {
          ...d,
          Alimentos: {
            ...d.Alimentos,
            GridAlimentos: (res.data ?? []).map((row) => ({
              ...row,
              selected: sel.size ? sel.has(row.prodCodigo) : true,
            })),
          },
        };
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAlimentos(false);
    }
  }, [data.Periodo.DataInicial, data.Periodo.DataFinal, data.Alimentos.prodCodigoTipoRemessa]);

  useEffect(() => {
    if (step.id === "Alimentos") loadAlimentos();
  }, [step.id, data.Alimentos.prodCodigoTipoRemessa, data.Periodo.DataInicial, data.Periodo.DataFinal, loadAlimentos]);

  const selectedLocais = useMemo(() => locaisRows.filter((r) => r.selected), [locaisRows]);
  const selectedAlimentos = useMemo(
    () => (data.Alimentos.GridAlimentos || []).filter((r) => r.selected),
    [data.Alimentos.GridAlimentos]
  );

  const locIdsKey = useMemo(
    () => [...selectedLocais].map((l) => Number(l.locCodigo)).sort((a, b) => a - b).join(","),
    [selectedLocais]
  );
  const prodIdsKey = useMemo(
    () => [...selectedAlimentos].map((a) => Number(a.prodCodigo)).sort((a, b) => a - b).join(","),
    [selectedAlimentos]
  );

  useEffect(() => {
    if (step.id !== "Guias") return;

    if (!locIdsKey || !prodIdsKey) {
      setGuiasPreview([]);
      setLoadingGuias(false);
      return;
    }

    const cacheKey = `${locIdsKey}|${prodIdsKey}`;
    if (guiasCacheRef.current.key === cacheKey) {
      setGuiasPreview(guiasCacheRef.current.data);
      setLoadingGuias(false);
      return;
    }

    const ac = new AbortController();
    const fetchId = ++guiasFetchRef.current;
    setLoadingGuias(true);
    setGuiasProgress(12);

    const timer = setInterval(() => {
      setGuiasProgress((p) => (p >= 90 ? p : p + 5));
    }, 200);

    apiJson("/api/logistica/wizards/rancho-fixo/guias", {
      method: "POST",
      body: JSON.stringify({
        locCodigos: locIdsKey.split(",").map(Number),
        prodCodigos: prodIdsKey.split(",").map(Number),
      }),
      signal: ac.signal,
    })
      .then((res) => {
        if (guiasFetchRef.current !== fetchId) return;
        const rows = res.data ?? [];
        guiasCacheRef.current = { key: cacheKey, data: rows };
        setGuiasPreview(rows);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        if (guiasFetchRef.current === fetchId) setError(err.message);
      })
      .finally(() => {
        clearInterval(timer);
        if (guiasFetchRef.current !== fetchId) return;
        setGuiasProgress(100);
        setTimeout(() => {
          setLoadingGuias(false);
          setGuiasProgress(0);
        }, 300);
      });

    return () => {
      clearInterval(timer);
      guiasFetchRef.current += 1;
      ac.abort();
    };
  }, [step.id, locIdsKey, prodIdsKey]);

  const locaisPorRota = useMemo(() => {
    const map = new Map();
    for (const row of locaisRows) {
      const rotaKey = row.rotaDescricao || (row.locNota ? `Rota ${row.locNota}` : "Sem rota");
      if (!map.has(rotaKey)) map.set(rotaKey, []);
      map.get(rotaKey).push(row);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  }, [locaisRows]);

  const tipoLabel = (cod) => {
    const t = (refs.tipos ?? []).find((x) => String(x.disTipNumero) === String(cod));
    return t?.disTipDescricao || (cod ? `Tipo ${cod}` : "Sem tipo");
  };

  const alimentosPorTipo = useMemo(() => {
    const map = new Map();
    for (const row of data.Alimentos.GridAlimentos || []) {
      const key = tipoLabel(row.prodCodigoTipoRemessa);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  }, [data.Alimentos.GridAlimentos, refs.tipos]);

  const guiasPorLocal = useMemo(() => {
    const map = new Map();
    for (const row of guiasPreview) {
      if (!map.has(row.locCodigo)) {
        map.set(row.locCodigo, { loc: row, itens: [] });
      }
      map.get(row.locCodigo).itens.push(row);
    }
    return [...map.values()];
  }, [guiasPreview]);

  const guiasTotais = useMemo(() => aggregateGuiaTotais(guiasPreview), [guiasPreview]);

  const restartWizard = () => {
    setStepIdx(0);
    setData(emptyData());
    setLocaisRows([]);
    setGuiasPreview([]);
    guiasCacheRef.current = { key: "", data: [] };
    setMsg("");
    setError("");
    setGuiasProgress(0);
    setLoadingGuias(false);
  };

  const periodoBanner = useMemo(() => {
    const p = data.Periodo;
    return `${MESES_LABELS[Number(p.Mes) - 1]}/${p.Ano}${p.Semana ? ` · Sem.${p.Semana}` : ""} · Envio ${p.DataEnvio || "—"}`;
  }, [data.Periodo]);

  const toggleRota = (cod) => {
    setData((d) => {
      const set = new Set(d.Locais.rotaCodigos || []);
      if (set.has(cod)) set.delete(cod);
      else set.add(cod);
      return { ...d, Locais: { ...d.Locais, rotaCodigos: [...set] } };
    });
  };

  const goNext = async () => {
    setError("");
    if (step.id === "Periodo" && (!data.Periodo.Mes || !data.Periodo.Ano || !data.Periodo.DataEnvio)) {
      setError("Informe mês, ano e data de envio.");
      return;
    }
    if (step.id === "Locais" && selectedLocais.length === 0) {
      setError("Selecione ao menos um local.");
      return;
    }
    if (step.id === "Alimentos" && selectedAlimentos.length === 0) {
      setError("Selecione ao menos um alimento.");
      return;
    }
    const payload = {
      ...data,
      Locais: { ...data.Locais, GridLocais: selectedLocais },
    };
    setBusy(true);
    try {
      await saveSession(payload);
      setData(payload);
      if (step.id === "Guias") {
        const res = await apiJson(`${sessionPath}/finalizar`, { method: "POST", body: JSON.stringify(payload) });
        setMsg(res.message || "Processo finalizado.");
        setStepIdx(STEPS.length - 1);
      } else {
        setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const goPrev = () => {
    if (stepIdx === 0) { onBack?.(); return; }
    setStepIdx((i) => Math.max(0, i - 1));
  };

  return (
    <div className="content-inner" style={{ maxWidth: 1100 }}>
      <Breadcrumb items={[module?.breadcrumbSection || "Logística", "Rancho Fixo"]} />
      <WizardProgressModal
        open={loadingGuias}
        title="Calculando guias"
        progress={guiasProgress}
        message="Processando quantidades por unidade e produto…"
      />
      <WizardShell
        title="Rancho Fixo"
        geneXusPanel="WizardRanchoFixo"
        periodoBanner={periodoBanner}
        steps={STEPS}
        stepIdx={stepIdx}
        step={step}
        error={error}
        successMsg={step.id === "Conclusao" ? msg : ""}
        onBack={onBack}
        busy={busy}
        loading={loadingLocais || loadingAlimentos || loadingGuias}
        onPrev={goPrev}
        onNext={goNext}
        isLastStep={step.id === "Conclusao"}
      >
        {step.id === "Periodo" && (
          <div className="form-grid form-grid--2">
            <div className="field">
              <label className="field-label">Mês</label>
              <select className="input" value={data.Periodo.Mes} onChange={(e) => {
                const Mes = Number(e.target.value);
                setData((d) => ({ ...d, Periodo: { ...d.Periodo, Mes, ...periodoRangeFromMesAno(Mes, d.Periodo.Ano) } }));
              }}>
                {MESES_LABELS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Ano</label>
              <input className="input" type="number" value={data.Periodo.Ano} onChange={(e) => {
                const Ano = Number(e.target.value);
                setData((d) => ({ ...d, Periodo: { ...d.Periodo, Ano, ...periodoRangeFromMesAno(d.Periodo.Mes, Ano) } }));
              }} />
            </div>
            <div className="field">
              <label className="field-label">Semana</label>
              <select className="input" value={data.Periodo.Semana} onChange={(e) => setData((d) => ({ ...d, Periodo: { ...d.Periodo, Semana: e.target.value } }))}>
                <option value="">Todas</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={String(n)}>{n}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Data envio</label>
              <input className="input" type="date" value={data.Periodo.DataEnvio} onChange={(e) => setData((d) => ({ ...d, Periodo: { ...d.Periodo, DataEnvio: e.target.value } }))} />
            </div>
          </div>
        )}

        {step.id === "Locais" && (
          <>
            <div className="field" style={{ marginBottom: 16 }}>
              <label className="field-label">Filtrar por rotas</label>
              <div className="row gap-2 wrap">
                {(refs.rotas ?? []).map((r) => {
                  const active = (data.Locais.rotaCodigos || []).includes(r.rotaCodigo);
                  return (
                    <button
                      key={`rota-${r.rotaCodigo}`}
                      type="button"
                      className={"badge pill " + (active ? "badge-brand" : "badge-neutral")}
                      style={{ cursor: "pointer", fontWeight: 600, border: "none" }}
                      onClick={() => toggleRota(r.rotaCodigo)}
                    >
                      {rotaSelectLabel(r)}
                    </button>
                  );
                })}
              </div>
            </div>

            {loadingLocais ? (
              <p className="muted">Carregando locais…</p>
            ) : locaisPorRota.length === 0 ? (
              <p className="muted">Nenhum local para a rota selecionada.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                {locaisPorRota.map(([rotaNome, rows]) => {
                  const selCount = rows.filter((r) => r.selected).length;
                  return (
                    <div key={rotaNome} className="panel">
                      <div className="panel-head" style={{ background: "var(--surface-2)" }}>
                        <div>
                          <div className="panel-title">{rotaNome}</div>
                          <div className="muted" style={{ fontSize: "var(--text-sm)", marginTop: 2 }}>
                            {selCount} de {rows.length} selecionado(s)
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            const allSelected = rows.every((r) => r.selected);
                            const ids = new Set(rows.map((r) => r.locCodigo));
                            setLocaisRows((prev) => prev.map((r) => (ids.has(r.locCodigo) ? { ...r, selected: !allSelected } : r)));
                          }}
                        >
                          {rows.every((r) => r.selected) ? "Desmarcar todos" : "Marcar todos"}
                        </button>
                      </div>
                      <div className="table-wrap">
                        <table className="table table-zebra">
                          <thead>
                            <tr>
                              <th style={{ width: 36 }} />
                              <th style={{ width: 72 }}>Código</th>
                              <th>Local</th>
                              <th>Bairro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => {
                              const idx = locaisRows.findIndex((r) => r.locCodigo === row.locCodigo);
                              return (
                                <tr key={`loc-${row.locCodigo}`}>
                                  <td className="row-check">
                                    <input
                                      type="checkbox"
                                      checked={!!row.selected}
                                      onChange={() => setLocaisRows((prev) => prev.map((r, i) => (i === idx ? { ...r, selected: !r.selected } : r)))}
                                    />
                                  </td>
                                  <td className="tnum">{row.locCodigo}</td>
                                  <td className="cell-strong">{row.locDescricao}</td>
                                  <td className="cell-muted">{row.locBairro || "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {step.id === "Alimentos" && (
          <>
            <div className="field" style={{ marginBottom: 16 }}>
              <label className="field-label">Tipo de Remessa</label>
              <div className="row gap-2 wrap">
                <button
                  type="button"
                  className={"badge pill " + (!data.Alimentos.prodCodigoTipoRemessa ? "badge-brand" : "badge-neutral")}
                  style={{ cursor: "pointer", fontWeight: 600, border: "none" }}
                  onClick={() => setData((d) => ({ ...d, Alimentos: { ...d.Alimentos, prodCodigoTipoRemessa: "" } }))}
                >
                  Todos
                </button>
                {(refs.tipos ?? []).map((t) => {
                  const active = String(data.Alimentos.prodCodigoTipoRemessa) === String(t.disTipNumero);
                  return (
                    <button
                      key={t.disTipNumero}
                      type="button"
                      className={"badge pill " + (active ? "badge-brand" : "badge-neutral")}
                      style={{ cursor: "pointer", fontWeight: 600, border: "none" }}
                      onClick={() => setData((d) => ({ ...d, Alimentos: { ...d.Alimentos, prodCodigoTipoRemessa: String(t.disTipNumero) } }))}
                    >
                      {t.disTipDescricao}
                    </button>
                  );
                })}
              </div>
            </div>

            {loadingAlimentos ? (
              <p className="muted">Carregando alimentos…</p>
            ) : alimentosPorTipo.length === 0 ? (
              <p className="muted">Nenhum alimento encontrado para o período e tipo selecionados.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                {alimentosPorTipo.map(([tipoNome, rows]) => {
                  const selCount = rows.filter((r) => r.selected).length;
                  return (
                    <div key={tipoNome} className="panel">
                      <div className="panel-head" style={{ background: "var(--surface-2)" }}>
                        <div>
                          <div className="panel-title">{tipoNome}</div>
                          <div className="muted" style={{ fontSize: "var(--text-sm)", marginTop: 2 }}>
                            {selCount} de {rows.length} selecionado(s)
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            const ids = new Set(rows.map((r) => r.prodCodigo));
                            const allSelected = rows.every((r) => r.selected);
                            setData((d) => ({
                              ...d,
                              Alimentos: {
                                ...d.Alimentos,
                                GridAlimentos: d.Alimentos.GridAlimentos.map((r) =>
                                  ids.has(r.prodCodigo) ? { ...r, selected: !allSelected } : r
                                ),
                              },
                            }));
                          }}
                        >
                          {rows.every((r) => r.selected) ? "Desmarcar todos" : "Marcar todos"}
                        </button>
                      </div>
                      <div className="table-wrap">
                        <table className="table table-zebra">
                          <thead>
                            <tr>
                              <th style={{ width: 36 }} />
                              <th style={{ width: 72 }}>Código</th>
                              <th>Descrição</th>
                              <th style={{ width: 100, textAlign: "right" }}>Estoque</th>
                              <th style={{ width: 80 }}>Und.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => {
                              const idx = (data.Alimentos.GridAlimentos || []).findIndex((r) => r.prodCodigo === row.prodCodigo);
                              return (
                                <tr key={`ali-${row.prodCodigo}`}>
                                  <td className="row-check">
                                    <input
                                      type="checkbox"
                                      checked={!!row.selected}
                                      onChange={() => setData((d) => ({
                                        ...d,
                                        Alimentos: {
                                          ...d.Alimentos,
                                          GridAlimentos: d.Alimentos.GridAlimentos.map((r, i) =>
                                            i === idx ? { ...r, selected: !r.selected } : r
                                          ),
                                        },
                                      }))}
                                    />
                                  </td>
                                  <td className="tnum">{row.prodCodigo}</td>
                                  <td className="cell-strong">{row.prodDescricao}</td>
                                  <td className="tnum" style={{ textAlign: "right" }}>{formatDecimalBr(row.prodSaldo)}</td>
                                  <td className="cell-muted">{row.uniDescricao || "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {step.id === "Guias" && (
          <div className="wizard-guia-scroll">
            {loadingGuias ? (
              <p className="muted">Aguarde o cálculo das quantidades…</p>
            ) : (
              <WizardGuiaCards groups={guiasPorLocal} />
            )}
          </div>
        )}

        {step.id === "Conclusao" && (
          <>
            <p className="muted" style={{ marginBottom: 16 }}>{msg || "Processo concluído."}</p>
            <div className="table-wrap" style={{ marginBottom: 16 }}>
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th style={{ width: 72 }}>Cód.</th>
                    <th>Produto</th>
                    <th style={{ width: 120, textAlign: "right" }}>Qtde total</th>
                  </tr>
                </thead>
                <tbody>
                  {guiasTotais.length === 0 ? (
                    <tr><td colSpan={3} className="cell-muted">Nenhum produto calculado.</td></tr>
                  ) : (
                    guiasTotais.map((t) => (
                      <tr key={`tot-${t.prodCodigo}`}>
                        <td className="tnum">{t.prodCodigo}</td>
                        <td className="cell-strong">{t.prodDescricao}</td>
                        <td className="tnum" style={{ textAlign: "right" }}>{formatDecimalBr(t.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="row gap-2 wrap">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => printRanchoFixoTotais(guiasPreview, { titulo: "Rancho Fixo — Totais a entregar", periodo: periodoBanner })}
                disabled={!guiasTotais.length}
              >
                <FaIcon icon="fa-print" /> Imprimir totais
              </button>
              <button type="button" className="btn btn-primary" onClick={restartWizard}>
                <FaIcon icon="fa-arrow-left" /> Voltar ao início
              </button>
            </div>
          </>
        )}
      </WizardShell>
    </div>
  );
}
