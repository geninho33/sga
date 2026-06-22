import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import WizardShell from "../components/wizard/WizardShell";
import {
  MESES_LABELS,
  PERCAPTA_AREAS,
  periodoRangeFromMesAno,
  rotaSelectLabel,
} from "../data/logisticaCatalog";
import { getWwModuleById } from "../data/wwModules";
import { formatDecimalBr } from "../utils/formatBr";
import { buildRanchoPlanilhaGuiasPreview } from "../utils/ranchoPlanilhaGuiaCalc";
import WizardGuiaCards from "../components/wizard/WizardGuiaCards";
import { useLogisticaReferencias } from "../hooks/useLogisticaReferencias";

const STEPS = [
  { id: "Periodo", title: "Período", description: "Informe o ano e o mês base dos dados a serem utilizados nos cálculos." },
  { id: "Locais", title: "Locais", description: "Selecione os locais de destino." },
  { id: "Alimentos", title: "Alimentos", description: "Lista de alimentos do período." },
  { id: "Pessoas2", title: "Pessoas", description: "Quantidade de pessoas atendidas por local e área de ensino." },
  { id: "PerCapta2", title: "Percapta", description: "Percapta e oferta por alimento e área de ensino." },
  { id: "Guias", title: "Guias", description: "Locais e quantidades de cada alimento a ser distribuído." },
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
    Pessoas: [],
    Percapta: [],
    Guias: [],
  };
}

export default function RanchoWizardPage({ onBack }) {
  const module = getWwModuleById("rancho-assistente");
  const refs = useLogisticaReferencias();
  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState(emptyData);
  const [locaisRows, setLocaisRows] = useState([]);
  const [loadingLocais, setLoadingLocais] = useState(false);
  const [loadingAlimentos, setLoadingAlimentos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [pessoasRows, setPessoasRows] = useState([]);
  const [percaptaRows, setPercaptaRows] = useState([]);
  const pessoasSeededKey = useRef("");
  const percaptaSeededKey = useRef("");
  const selectedLocaisRef = useRef([]);
  const selectedAlimentosRef = useRef([]);
  const dataRef = useRef(data);
  dataRef.current = data;

  const step = STEPS[stepIdx];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiJson("/api/logistica/wizards/rancho-planilha/session");
        if (!cancelled && res.data) setData({ ...emptyData(), ...res.data });
      } catch { /* nova */ }
      if (!cancelled) setSessionReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const saveSession = (payload) =>
    apiJson("/api/logistica/wizards/rancho-planilha/session", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

  const loadLocais = useCallback(async (rotas, prevGrid) => {
    setLoadingLocais(true);
    try {
      const params = rotas?.length ? { rotas: rotas.join(",") } : {};
      const res = await apiJson("/api/logistica/wizards/rancho-planilha/locais", { params });
      const selected = new Set((prevGrid || []).filter((r) => r.selected).map((r) => r.locCodigo));
      setLocaisRows(
        (res.data ?? []).map((r) => ({
          ...r,
          selected: selected.size ? selected.has(r.locCodigo) : false,
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingLocais(false);
    }
  }, []);

  useEffect(() => {
    if (step.id === "Locais") loadLocais(data.Locais.rotaCodigos, data.Locais.GridLocais);
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
              selected: sel.size ? sel.has(row.prodCodigo) : row.selected,
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

  const selectedLocais = useMemo(() => {
    const fromRows = locaisRows.filter((r) => r.selected);
    if (fromRows.length) return fromRows;
    return (data.Locais?.GridLocais || []).filter((r) => r.selected !== false);
  }, [locaisRows, data.Locais?.GridLocais]);

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

  selectedLocaisRef.current = selectedLocais;
  selectedAlimentosRef.current = selectedAlimentos;

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

  const guiasPreview = useMemo(() => {
    if (step.id !== "Guias") return [];
    return buildRanchoPlanilhaGuiasPreview(
      selectedLocais,
      selectedAlimentos,
      pessoasRows.length ? pessoasRows : (data.Pessoas || []),
      percaptaRows.length ? percaptaRows : (data.Percapta || [])
    );
  }, [step.id, selectedLocais, selectedAlimentos, pessoasRows, percaptaRows, data.Pessoas, data.Percapta]);

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

  useEffect(() => {
    if (step.id !== "Pessoas2" || !locIdsKey) return;
    if (pessoasSeededKey.current === locIdsKey) return;
    pessoasSeededKey.current = locIdsKey;
    const saved = dataRef.current.Pessoas || [];
    setPessoasRows(
      selectedLocaisRef.current.map((loc) => {
        const existing = saved.find((p) => String(p.locCodigo) === String(loc.locCodigo));
        const areas = {};
        for (const a of PERCAPTA_AREAS) areas[a.percaptaKey] = existing?.[a.percaptaKey] ?? "";
        return { locCodigo: loc.locCodigo, locDescricao: loc.locDescricao, ...areas };
      })
    );
  }, [step.id, locIdsKey]);

  useEffect(() => {
    if (step.id !== "PerCapta2" || !prodIdsKey) return;
    if (percaptaSeededKey.current === prodIdsKey) return;
    percaptaSeededKey.current = prodIdsKey;
    const saved = dataRef.current.Percapta || [];
    setPercaptaRows(
      selectedAlimentosRef.current.map((ali) => {
        const existing = saved.find((p) => String(p.prodCodigo) === String(ali.prodCodigo));
        const areas = {};
        for (const a of PERCAPTA_AREAS) {
          areas[a.percaptaKey] = existing?.[a.percaptaKey] ?? "";
          areas[a.ofertaKey] = existing?.[a.ofertaKey] ?? "";
        }
        return {
          prodCodigo: ali.prodCodigo,
          prodDescricao: ali.prodDescricao,
          locCodigoCollectionJson: existing?.locCodigoCollectionJson ?? "",
          ...areas,
        };
      })
    );
  }, [step.id, prodIdsKey]);

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

  const patchPessoa = (locCodigo, key, value) => {
    setPessoasRows((rows) =>
      rows.map((p) =>
        String(p.locCodigo) === String(locCodigo) ? { ...p, [key]: value } : p
      )
    );
  };

  const patchPercapta = (prodCodigo, key, value) => {
    setPercaptaRows((rows) =>
      rows.map((p) =>
        String(p.prodCodigo) === String(prodCodigo) ? { ...p, [key]: value } : p
      )
    );
  };

  const buildPayload = () => ({
    ...data,
    Locais: { ...data.Locais, GridLocais: selectedLocais },
    Alimentos: { ...data.Alimentos, GridAlimentos: selectedAlimentos },
    Pessoas: pessoasRows,
    Percapta: percaptaRows,
  });

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
    const payload = buildPayload();
    setBusy(true);
    try {
      await saveSession(payload);
      setData(payload);
      if (step.id === "Guias") {
        const res = await apiJson("/api/logistica/wizards/rancho-planilha/finalizar", {
          method: "POST",
          body: JSON.stringify(payload),
        });
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
    <div className="content-inner" style={{ maxWidth: 1180 }}>
      <Breadcrumb items={[module?.breadcrumbSection || "Logística", "Rancho Assistente"]} />
      <WizardShell
        title="Rancho via Assistente"
        geneXusPanel="RanchoWizardPlanilha"
        periodoBanner={periodoBanner}
        steps={STEPS}
        stepIdx={stepIdx}
        step={step}
        error={error}
        successMsg={step.id === "Conclusao" ? msg : ""}
        onBack={onBack}
        busy={busy}
        loading={!sessionReady || loadingLocais || loadingAlimentos}
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
                {[1, 2, 3, 4, 5].map((n) => <option key={`sem-${n}`} value={String(n)}>{n}</option>)}
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
              <p className="muted">Nenhum local encontrado.</p>
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
                              <th style={{ width: 90, textAlign: "right" }}>Qtde Emb.</th>
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
                                  <td className="tnum" style={{ textAlign: "right" }}>{formatDecimalBr(row.qtdeEmbalagem)}</td>
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

        {step.id === "Pessoas2" && (
          <div className="table-wrap" style={{ maxHeight: 420, overflowY: "auto" }}>
            {pessoasRows.length === 0 ? (
              <p className="muted">Carregando locais…</p>
            ) : (
            <table className="table table-zebra">
              <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--surface-1)" }}>
                <tr>
                  <th style={{ minWidth: 200 }}>Local</th>
                  {PERCAPTA_AREAS.map((a) => (
                    <th key={a.code} style={{ width: 88, textAlign: "center" }}>{a.short}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pessoasRows.map((row) => (
                  <tr key={`pes-${row.locCodigo}`}>
                    <td className="cell-strong">{row.locDescricao}</td>
                    {PERCAPTA_AREAS.map((a) => (
                      <td key={`${row.locCodigo}-${a.code}`} style={{ textAlign: "center" }}>
                        <input
                          className="input input-sm tnum"
                          style={{ width: 72, height: 28, fontSize: 12, margin: "0 auto" }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={row[a.percaptaKey] ?? ""}
                          placeholder="0"
                          onChange={(e) => patchPessoa(row.locCodigo, a.percaptaKey, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}

        {step.id === "PerCapta2" && (
          <div className="table-wrap" style={{ overflowX: "auto", maxHeight: 210, overflowY: "auto" }}>
            {percaptaRows.length === 0 ? (
              <p className="muted">Carregando alimentos…</p>
            ) : (
            <table className="table table-zebra" style={{ minWidth: 900 }}>
              <thead style={{ position: "sticky", top: 0, background: "var(--surface-1)", zIndex: 1 }}>
                <tr>
                  <th rowSpan={2} style={{ minWidth: 180 }}>Alimento</th>
                  {PERCAPTA_AREAS.map((a) => (
                    <th key={a.code} colSpan={2} style={{ textAlign: "center", borderLeft: "1px solid var(--border)" }}>{a.short}</th>
                  ))}
                </tr>
                <tr>
                  {PERCAPTA_AREAS.flatMap((a) => [
                    <th key={`${a.code}-p`} style={{ fontSize: 10, borderLeft: "1px solid var(--border)" }}>Perc.</th>,
                    <th key={`${a.code}-o`} style={{ fontSize: 10 }}>Oft.</th>,
                  ])}
                </tr>
              </thead>
              <tbody>
                {percaptaRows.map((row) => (
                  <tr key={`perc-${row.prodCodigo}`}>
                    <td className="cell-strong">{row.prodDescricao}</td>
                    {PERCAPTA_AREAS.flatMap((a) => [
                      <td key={`${row.prodCodigo}-${a.percaptaKey}`}>
                        <input className="input input-sm tnum" style={{ width: 64, height: 28, fontSize: 12 }} type="text" inputMode="decimal" value={row[a.percaptaKey] ?? ""} placeholder="0" onChange={(e) => patchPercapta(row.prodCodigo, a.percaptaKey, e.target.value)} />
                      </td>,
                      <td key={`${row.prodCodigo}-${a.ofertaKey}`}>
                        <input className="input input-sm tnum" style={{ width: 48, height: 28, fontSize: 12 }} type="text" inputMode="numeric" value={row[a.ofertaKey] ?? ""} placeholder="0" onChange={(e) => patchPercapta(row.prodCodigo, a.ofertaKey, e.target.value)} />
                      </td>,
                    ])}
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}

        {step.id === "Guias" && (
          <div className="wizard-guia-scroll">
            {selectedLocais.length === 0 || selectedAlimentos.length === 0 ? (
              <p className="muted">Selecione locais e alimentos nas etapas anteriores.</p>
            ) : (
              <WizardGuiaCards
                groups={guiasPorLocal}
                emptyLabel="Nenhuma guia gerada. Verifique pessoas, percapta e estoque dos produtos."
              />
            )}
          </div>
        )}

        {step.id === "Conclusao" && <p>{msg || "Processo concluído."}</p>}
      </WizardShell>
    </div>
  );
}
