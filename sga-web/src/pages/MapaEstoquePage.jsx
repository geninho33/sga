import { useEffect, useState } from "react";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import { FaIcon } from "../components/Icon";
import { getWwModuleById } from "../data/wwModules";
import { usePreparacaoReferencias } from "../hooks/usePreparacaoReferencias";

const TABS = [
  { id: "mapa", label: "Mapa ( Consumo do Dia )" },
  { id: "estoque", label: "Estoque ( Atual )" },
  { id: "entregas", label: "Entregas ( Todas as guias do Mês )" },
  { id: "ajuste", label: "Solicitação de Ajuste" },
  { id: "duvidas", label: "Dúvidas" },
];

function monthIsoFromDate(iso) {
  return String(iso || "").slice(0, 7);
}

function toDisplayMonth(isoMonth) {
  if (!isoMonth || !isoMonth.includes("-")) return "";
  const [y, m] = isoMonth.split("-");
  return `${m}/${y}`;
}

function fromDisplayMonth(display) {
  const m = String(display || "").trim().match(/^(\d{2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[2]}-${m[1]}`;
}

function monthIsoToApi(isoMonth) {
  if (!isoMonth) return "";
  return `${isoMonth}-01`;
}

export default function MapaEstoquePage({ onBack }) {
  const module = getWwModuleById("mapa-estoque");
  const { locais, loading: refsLoading } = usePreparacaoReferencias();
  const [locCodigo, setLocCodigo] = useState("");
  const [dataCorrente, setDataCorrente] = useState(monthIsoFromDate(new Date().toISOString().slice(0, 10)));
  const [dataCorrenteDisplay, setDataCorrenteDisplay] = useState(toDisplayMonth(monthIsoFromDate(new Date().toISOString().slice(0, 10))));
  const [prodFiltro, setProdFiltro] = useState("");
  const [tab, setTab] = useState("mapa");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [edit, setEdit] = useState({});

  const load = async () => {
    if (!locCodigo) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiJson("/api/operacional/mapa-estoque", {
        params: { locCodigo, dataCorrente: monthIsoToApi(dataCorrente), prodDescricao: prodFiltro },
      });
      setData(res.data);
      const map = {};
      for (const row of res.data?.estoque ?? []) map[row.estoUeCodigo] = row.estoUEQtdeFixa ?? "";
      setEdit(map);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (locCodigo) load();
  }, [locCodigo, dataCorrente]);

  const handleSave = async () => {
    if (!data?.estoque?.length) return;
    setSaving(true);
    setError(null);
    try {
      const items = data.estoque.map((r) => ({
        estoUeCodigo: r.estoUeCodigo,
        estoUEQtdeFixa: Number(edit[r.estoUeCodigo]) || 0,
      }));
      const res = await apiJson("/api/operacional/mapa-estoque/salvar", {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      setMsg(`${res.data?.updated ?? 0} registro(s) atualizado(s).`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const buscarEstoque = () => load();

  return (
    <div className="content-inner" style={{ maxWidth: 1200 }}>
      <Breadcrumb items={[module?.breadcrumbSection, module?.title]} />
      <div className="page-head">
        <div>
          <div className="page-title">{module?.title}</div>
          <div className="page-desc"><span className="mono">WPConsultaMapaEstoqueUnidade</span></div>
        </div>
        {onBack && (
          <button type="button" className="btn btn-ghost" onClick={onBack}>Voltar</button>
        )}
      </div>

      <div className="panel" style={{ marginBottom: "var(--space-4)" }}>
        <div className="panel-head"><span className="panel-title">Parâmetro para consulta</span></div>
        <div className="panel-body filter-grid" style={{ gridTemplateColumns: "2fr 1fr auto", alignItems: "end" }}>
          <div className="field">
            <label className="field-label">Unidade Escolar</label>
            <select className="input" value={locCodigo} disabled={refsLoading} onChange={(e) => setLocCodigo(e.target.value)}>
              <option value="">Selecione…</option>
              {locais.map((l) => <option key={l.locCodigo} value={l.locCodigo}>{l.locDescricao}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Mês/Ano</label>
            <input
              className="input"
              type="text"
              placeholder="MM/AAAA"
              maxLength={7}
              value={dataCorrenteDisplay}
              onChange={(e) => {
                const v = e.target.value;
                setDataCorrenteDisplay(v);
                const iso = fromDisplayMonth(v);
                if (iso) setDataCorrente(iso);
              }}
            />
          </div>
          <button type="button" className="btn btn-secondary" onClick={load} disabled={!locCodigo || loading}>
            <FaIcon icon="fa-magnifying-glass" /> Buscar
          </button>
        </div>
      </div>

      {(error || msg) && (
        <p style={{ color: error ? "var(--danger-fg)" : "var(--success-fg)", marginBottom: 12 }}>{error || msg}</p>
      )}

      {locCodigo && (
        <>
          <div className="tabs" style={{ marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={"btn btn-sm " + (tab === t.id ? "btn-primary" : "btn-ghost")}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="muted">Carregando…</p>
          ) : (
            <>
              {tab === "mapa" && (
                <div className="panel">
                  <div className="panel-head"><span className="panel-title">Mapa — {data?.local?.locDescricao}</span></div>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Tipo distribuição</th><th>Cód. produto</th><th>Descrição</th><th>Unidade</th><th>Quantidade</th><th>Saldo</th><th>Observação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.consumo ?? []).map((r, i) => (
                          <tr key={`consumo-${r.prodCodigo}-${i}`}>
                            <td>{r.distipDescricao || "—"}</td>
                            <td className="tnum mono">{r.prodCodigo}</td>
                            <td className="cell-strong">{r.prodDescricao}</td>
                            <td>{r.uniDescricao || "—"}</td>
                            <td className="tnum">{r.quantidade}</td>
                            <td className="tnum">{r.saldo}</td>
                            <td>{r.obs || "—"}</td>
                          </tr>
                        ))}
                        {!data?.consumo?.length && (
                          <tr><td colSpan={7} className="cell-muted">Nenhum consumo para a data informada.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "estoque" && (
                <div className="panel">
                  <div className="panel-head">
                    <span className="panel-title">Estoque — {data?.local?.locDescricao}</span>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                      <FaIcon icon="fa-check" /> Salvar valor fixo
                    </button>
                  </div>
                  <div className="panel-body" style={{ paddingBottom: 0 }}>
                    <div className="row gap-2" style={{ marginBottom: 12 }}>
                      <input
                        className="input"
                        placeholder="Contém no produto"
                        value={prodFiltro}
                        onChange={(e) => setProdFiltro(e.target.value)}
                        style={{ maxWidth: 280 }}
                      />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={buscarEstoque}>
                        <FaIcon icon="fa-magnifying-glass" /> Buscar
                      </button>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Tipo remessa</th><th>Produto</th><th>Descrição</th><th>Unidade</th><th>Saldo</th><th>Qtdade fixa</th><th>Previsão envio</th><th>Última alteração</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.estoque ?? []).map((r) => (
                          <tr key={r.estoUeCodigo || `${r.estoUeProdCodigo}`}>
                            <td>{r.estoUeTipoRemessa || "—"}</td>
                            <td className="tnum mono">{r.estoUeProdCodigo}</td>
                            <td className="cell-strong">{r.estoUeProdDescricao}</td>
                            <td>{r.estoUeUniDescricao}</td>
                            <td className="tnum">{r.estoUeSaldo}</td>
                            <td>
                              <input
                                className="input"
                                type="number"
                                step="any"
                                style={{ width: 100 }}
                                value={edit[r.estoUeCodigo] ?? ""}
                                onChange={(e) => setEdit((m) => ({ ...m, [r.estoUeCodigo]: e.target.value }))}
                              />
                            </td>
                            <td className="tnum">{r.estoUePrevisao || 0}</td>
                            <td className="cell-muted">{r.estoUeAlteracao ? new Date(r.estoUeAlteracao).toLocaleString("pt-BR") : "—"}</td>
                          </tr>
                        ))}
                        {!data?.estoque?.length && (
                          <tr><td colSpan={8} className="cell-muted">Nenhum item de estoque.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "entregas" && (
                <div className="panel">
                  <div className="panel-head"><span className="panel-title">Entregas do mês</span></div>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Código</th><th>Situação</th><th>Tipo remessa</th><th>Envio</th><th>Recepção</th><th>Recebedor</th><th>Vinculação</th><th>Observação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.entregas ?? []).map((r) => (
                          <tr key={r.distCodigo}>
                            <td className="tnum mono">{r.distCodigo}</td>
                            <td>{r.distSituacao}</td>
                            <td>{r.distCodigoTipoRemessa}</td>
                            <td>{r.distDataEnvio ? String(r.distDataEnvio).slice(0, 10) : "—"}</td>
                            <td>{r.distDataRecepcao ? String(r.distDataRecepcao).slice(0, 10) : "—"}</td>
                            <td>{r.distRecebedor || "—"}</td>
                            <td>{r.distVincDescricao || "—"}</td>
                            <td>{r.distObservacao || "—"}</td>
                          </tr>
                        ))}
                        {!data?.entregas?.length && (
                          <tr><td colSpan={8} className="cell-muted">Nenhuma entrega no mês da data informada.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "ajuste" && (
                <div className="panel">
                  <div className="panel-head"><span className="panel-title">Solicitação de ajuste</span></div>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Tipo distribuição</th><th>Cód. produto</th><th>Descrição</th><th>Unidade</th><th>Saldo</th><th>Qtde</th><th>Qtde ajuste</th><th>Motivo</th><th>Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.ajustes ?? []).map((r) => (
                          <tr key={r.mapaUeCodigo}>
                            <td>{r.distipDescricao || "—"}</td>
                            <td className="tnum mono">{r.prodCodigo}</td>
                            <td>{r.prodDescricao}</td>
                            <td>{r.uniDescricao || "—"}</td>
                            <td className="tnum">{r.saldo}</td>
                            <td className="tnum">{r.quantidade}</td>
                            <td className="tnum">{r.qtdeAjuste}</td>
                            <td>{r.obsAjuste || "—"}</td>
                            <td>{r.ajuste}</td>
                          </tr>
                        ))}
                        {!data?.ajustes?.length && (
                          <tr><td colSpan={9} className="cell-muted">Nenhum ajuste pendente no período.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "duvidas" && (
                <div className="panel">
                  <div className="panel-head"><span className="panel-title">Dúvidas</span></div>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr><th>Data</th><th>Assunto</th><th>Pergunta</th><th>Resposta</th></tr>
                      </thead>
                      <tbody>
                        {(data?.duvidas ?? []).map((r, i) => (
                          <tr key={`duvida-${i}`}>
                            <td>{r.perResData ? String(r.perResData).slice(0, 10) : "—"}</td>
                            <td>{r.perResAssuntoLabel || r.perResAssunto}</td>
                            <td>{r.perResPergunta}</td>
                            <td>{r.perResResposta || "—"}</td>
                          </tr>
                        ))}
                        {!data?.duvidas?.length && (
                          <tr><td colSpan={4} className="cell-muted">Nenhuma dúvida registrada para esta unidade.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
