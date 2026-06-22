import { useEffect, useState } from "react";
import { apiJson } from "../api/client";

const DAY_COLS = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

function emptyRow(doenCodigo = "") {
  return { doenCodigo, qtde: "0" };
}

function rowFromApi(r) {
  const found = DAY_COLS.map((d) => Number(r[`qtde${d}`]) || 0).find((n) => n > 0);
  const qtde = found ?? (Number(r.qtdeSegunda) || 0);
  return { doenCodigo: String(r.doenCodigo), qtde: String(qtde) };
}

function rowToApi(row) {
  const n = Number(row.qtde) || 0;
  const out = { doenCodigo: row.doenCodigo };
  for (const d of DAY_COLS) out[`qtde${d}`] = n;
  return out;
}

export default function AtendimentoDoencasPanel({ atendimentoCodigo, doencasCatalogo = [], onChange }) {
  const [rows, setRows] = useState([emptyRow()]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!atendimentoCodigo) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiJson(`/api/preparacao/atendimentos/${atendimentoCodigo}/doencas`);
        if (!cancelled) {
          const list = res.data?.length ? res.data.map(rowFromApi) : [emptyRow()];
          setRows(list);
        }
      } catch {
        if (!cancelled) setRows([emptyRow()]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [atendimentoCodigo]);

  useEffect(() => {
    onChange?.(rows.filter((r) => r.doenCodigo).map(rowToApi));
  }, [rows, onChange]);

  if (!loaded) return <p className="muted">Carregando doenças…</p>;

  return (
    <div style={{ marginTop: "var(--space-5)" }}>
      <div className="panel-head" style={{ marginBottom: "var(--space-3)" }}>
        <span className="panel-title">Restrição Alimentar</span>
      </div>
      <table className="table" style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th>Restrição Alimentar</th>
            <th>Qtde. de Alunos</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`doenca-${idx}`}>
              <td>
                <select
                  className="input input-sm"
                  value={row.doenCodigo}
                  onChange={(e) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, doenCodigo: e.target.value } : r)))}
                >
                  <option value="">Selecione…</option>
                  {doencasCatalogo.map((d) => (
                    <option key={d.doenCodigo} value={String(d.doenCodigo)}>{d.doenDescricao}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  className="input input-sm tnum"
                  type="number"
                  min="0"
                  value={row.qtde}
                  onChange={(e) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, qtde: e.target.value } : r)))}
                />
              </td>
              <td>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRows((rs) => rs.filter((_, i) => i !== idx))}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRows((rs) => [...rs, emptyRow()])}>+ Restrição</button>
    </div>
  );
}
