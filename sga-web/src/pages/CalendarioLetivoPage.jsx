import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson } from "../api/client";
import Breadcrumb from "../components/Breadcrumb";
import CalendarioLetivoDiaModal from "../components/CalendarioLetivoDiaModal";
import CalendarioLetivoMes from "../components/CalendarioLetivoMes";
import { FaIcon } from "../components/Icon";
import { getWwModuleById } from "../data/wwModules";
import { formatIsoDate } from "../utils/calendarMonth";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function countMes(mapa, ano, mesIndex) {
  const prefix = `${ano}-${String(mesIndex + 1).padStart(2, "0")}-`;
  return Object.keys(mapa).filter((k) => k.startsWith(prefix)).length;
}

export default function CalendarioLetivoPage({ onBack }) {
  const module = getWwModuleById("calendario-letivo");
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mesAberto, setMesAberto] = useState(null);
  const [mapa, setMapa] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [diaModal, setDiaModal] = useState(null);

  const loadMapa = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiJson(`/api/preparacao/calendario-letivo/mapa/${ano}`);
      setMapa(res.data ?? {});
    } catch (err) {
      setError(err.message);
      setMapa({});
    } finally {
      setLoading(false);
    }
  }, [ano]);

  useEffect(() => {
    loadMapa();
  }, [loadMapa]);

  const mesAnoIso = mesAberto !== null ? formatIsoDate(ano, mesAberto, 1) : null;

  const lancamentosMes = useMemo(() => {
    if (mesAberto === null) return [];
    const prefix = `${ano}-${String(mesAberto + 1).padStart(2, "0")}-`;
    return Object.entries(mapa)
      .filter(([k]) => k.startsWith(prefix))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([calData, entry]) => ({ calData, ...entry }));
  }, [mapa, ano, mesAberto]);

  return (
    <div className="content-inner" style={{ maxWidth: 1280 }}>
      <Breadcrumb items={[module?.breadcrumbSection || "Preparações", "Calendário Letivo"]} />
      <div className="page-head">
        <div>
          <div className="page-title">Calendário Letivo</div>
          <div className="page-desc mono">{module?.geneXusPanel}</div>
        </div>
        {onBack && (
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            <FaIcon icon="fa-arrow-left" /> Voltar
          </button>
        )}
      </div>

      <div className="panel card-pad" style={{ marginBottom: 16 }}>
        <div className="row gap-3 wrap" style={{ alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 120 }}>
            <label className="field-label">Ano</label>
            <input
              className="input tnum"
              type="number"
              value={ano}
              onChange={(e) => {
                setAno(Number(e.target.value));
                setMesAberto(null);
              }}
            />
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadMapa} disabled={loading}>
            <FaIcon icon="fa-arrows-rotate" /> Atualizar
          </button>
          {mesAberto !== null && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMesAberto(null)}>
              Ver ano completo
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}

      {loading && mesAberto === null ? (
        <p className="muted">Carregando calendário…</p>
      ) : mesAberto === null ? (
        <>
          <p className="muted" style={{ marginBottom: 12, fontSize: "var(--text-sm)" }}>
            Clique em um mês para ver os lançamentos do período.
          </p>
          <div className="calendario-letivo-year-grid">
            {MESES.map((nome, idx) => {
              const count = countMes(mapa, ano, idx);
              return (
                <button
                  key={nome}
                  type="button"
                  className={"calendario-letivo-month-card" + (count ? " calendario-letivo-month-card--filled" : "")}
                  onClick={() => setMesAberto(idx)}
                >
                  <span className="calendario-letivo-month-name">{nome}</span>
                  <span className="calendario-letivo-month-count tnum">
                    {count} lançamento{count !== 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="panel card-pad">
          <CalendarioLetivoMes
            mesAno={mesAnoIso}
            mapa={mapa}
            onDiaClick={(iso, entry) => setDiaModal({ iso, entry })}
          />

          {lancamentosMes.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 className="panel-title" style={{ marginBottom: 8, fontSize: "var(--text-base)" }}>
                Lançamentos de {MESES[mesAberto]}
              </h3>
              <div className="table-wrap">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th style={{ width: 110 }}>Data</th>
                      <th>Descrição</th>
                      <th style={{ width: 80 }}>Dia útil</th>
                      <th style={{ width: 80 }}>Feriado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lancamentosMes.map((row) => (
                      <tr
                        key={row.calData}
                        style={{ cursor: "pointer" }}
                        onClick={() => setDiaModal({ iso: row.calData, entry: row })}
                      >
                        <td className="tnum">{row.calData.slice(8, 10)}/{String(mesAberto + 1).padStart(2, "0")}</td>
                        <td>{row.calDescricao}</td>
                        <td>{row.diaUtil === false ? "Não" : "Sim"}</td>
                        <td>{row.feriado ? "Sim" : "Não"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {diaModal && (
        <CalendarioLetivoDiaModal
          ano={ano}
          dateIso={diaModal.iso}
          entry={diaModal.entry}
          onClose={() => setDiaModal(null)}
          onSaved={loadMapa}
        />
      )}
    </div>
  );
}
