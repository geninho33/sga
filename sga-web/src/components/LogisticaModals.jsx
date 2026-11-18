import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../api/client";
import NotaItensPanel from "./NotaItensPanel";
import DistribuicaoItensPanel from "./DistribuicaoItensPanel";
import { formatCurrencyBr, formatDateBr, formatDecimalBr } from "../utils/formatBr";

function ModalShell({ title, children, onClose, width = 1100 }) {
  return (
    <div className="cmd-backdrop open" role="presentation" onClick={onClose}>
      <div
        className="cmd card-pad"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{ padding: "var(--space-5)", maxWidth: width, width: "96vw", maxHeight: "92vh", overflow: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onYes, onNo }) {
  return (
    <div className="cmd-backdrop open" style={{ zIndex: 1200 }} role="presentation" onClick={onNo}>
      <div className="cmd card-pad" role="alertdialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, padding: "var(--space-5)" }}>
        <div className="panel-title" style={{ marginBottom: 12 }}>Cancelar</div>
        <p style={{ marginBottom: 20 }}>{message}</p>
        <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={onYes}>Sim</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onNo}>Não</button>
        </div>
      </div>
    </div>
  );
}

function CancelModalLayout({
  geneXusTitle,
  groupCaption,
  headerText,
  motivo,
  onMotivoChange,
  loading,
  error,
  busy,
  onRetornar,
  onCancelar,
  cancelLabel,
  children,
}) {
  return (
    <ModalShell title={geneXusTitle}>
      <div className="panel-title" style={{ marginBottom: 16 }}>{geneXusTitle}</div>

      <div className="card-pad" style={{ marginBottom: 16, background: "var(--surface-2)" }}>
        <div className="muted" style={{ fontSize: "var(--text-sm)", marginBottom: 6 }}>{groupCaption}</div>
        <div>{headerText || (loading ? "Carregando…" : "—")}</div>
      </div>

      {error && <p style={{ color: "var(--danger-fg)", marginBottom: 12 }}>{error}</p>}

      <div style={{ overflowX: "auto", marginBottom: 16 }}>
        {loading ? <p className="muted">Carregando itens…</p> : children}
      </div>

      <div className="card-pad" style={{ marginBottom: 16, background: "var(--surface-2)" }}>
        <div className="field-label" style={{ marginBottom: 8 }}>Motivo do Cancelamento</div>
        <textarea
          className="input"
          rows={3}
          value={motivo}
          onChange={(e) => onMotivoChange(e.target.value)}
          disabled={busy}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>

      <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-danger btn-sm" onClick={onCancelar} disabled={busy || loading}>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetornar} disabled={busy}>
          Retornar
        </button>
      </div>
    </ModalShell>
  );
}

export default function NotaItensModal({ row, onClose }) {
  const readOnly = row.notaStatus === "C";
  return (
    <ModalShell title="trnsnotaitensWW">
      <NotaItensPanel
        notaCodigo={row.notaCodigo}
        codigoDisplay={row.notaCodigo}
        fornecedorNome={row.notaFornecedorNome}
        readOnly={readOnly}
      />
      <div className="row gap-2" style={{ marginTop: 16, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Fechar</button>
      </div>
    </ModalShell>
  );
}

export function DistribuicaoItensModal({ row, onClose }) {
  const readOnly = row.distStatus === "C";
  return (
    <ModalShell title="trnsdistribuicaoitensWW">
      <DistribuicaoItensPanel
        distCodigo={row.distCodigo}
        codigoDisplay={row.distCodigo}
        destinoNome={row.distLocalDestinoNome}
        readOnly={readOnly}
      />
      <div className="row gap-2" style={{ marginTop: 16, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Fechar</button>
      </div>
    </ModalShell>
  );
}

export function CancelarNotaModal({ row, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [nota, setNota] = useState(null);
  const [itens, setItens] = useState([]);
  const [motivo, setMotivo] = useState("");
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [notaRes, itensRes] = await Promise.all([
        apiJson(`/api/logistica/compras/${row.notaCodigo}`),
        apiJson(`/api/logistica/compras/${row.notaCodigo}/itens`, { params: { page: 1, limit: 500 } }),
      ]);
      setNota(notaRes.data);
      setItens(itensRes.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [row.notaCodigo]);

  useEffect(() => {
    load();
  }, [load]);

  const headerText = nota
    ? ` Nota nr. : ${nota.notaNumero} - Série : ${nota.notaSerie} - Data : ${formatDateBr(nota.notaData)}${nota.notaFornecedorNome ? ` - Fornecedor : ${nota.notaFornecedorNome}` : ""}`
    : "";

  const handleCancelar = () => {
    if (!motivo.trim()) {
      setError("Informe o motivo do cancelamento !");
      return;
    }
    setError("");
    setConfirm(true);
  };

  const doCancel = async () => {
    setConfirm(false);
    setBusy(true);
    setError("");
    try {
      const res = await apiJson(`/api/logistica/compras/${row.notaCodigo}/cancelar`, {
        method: "POST",
        body: JSON.stringify({ motivo: motivo.trim() }),
      });
      onSuccess?.(res.message || "Nota cancelada com sucesso !");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <CancelModalLayout
        geneXusTitle="trnsnotaCancelar"
        groupCaption="Compra"
        headerText={headerText}
        motivo={motivo}
        onMotivoChange={setMotivo}
        loading={loading}
        error={error}
        busy={busy}
        onRetornar={onClose}
        onCancelar={handleCancelar}
        cancelLabel="Cancelar Nota"
      >
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Unidade</th>
              <th>Quantidade</th>
              <th>Valor</th>
              <th>Total</th>
              <th>Validade</th>
              <th>Lote</th>
            </tr>
          </thead>
          <tbody>
            {itens.length === 0 ? (
              <tr><td colSpan={8} className="muted">Nenhum item.</td></tr>
            ) : (
              itens.map((i) => (
                <tr key={i.notaItemProduto}>
                  <td className="mono tnum">{i.notaItemProduto}</td>
                  <td>{i.notaItemProdutoDescricao || i.notaItemProduto}</td>
                  <td>{i.notaItemProdutoUnidadeDesc || i.notaItemProdutoUnidade}</td>
                  <td className="tnum">{formatDecimalBr(i.notaItemQtde, 4)}</td>
                  <td className="tnum">{formatCurrencyBr(i.notaItemValor)}</td>
                  <td className="tnum">{formatCurrencyBr(i.notaItemTotal)}</td>
                  <td>{formatDateBr(i.notaItemValidade) || "—"}</td>
                  <td>{i.notaItemLote || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CancelModalLayout>
      {confirm && (
        <ConfirmDialog
          message="Deseja realmente Cancelar essa Nota ?"
          onYes={doCancel}
          onNo={() => setConfirm(false)}
        />
      )}
    </>
  );
}

export function CancelarDistribuicaoModal({ row, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [guia, setGuia] = useState(null);
  const [itens, setItens] = useState([]);
  const [motivo, setMotivo] = useState("");
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [guiaRes, itensRes] = await Promise.all([
        apiJson(`/api/logistica/distribuicoes/${row.distCodigo}`),
        apiJson(`/api/logistica/distribuicoes/${row.distCodigo}/itens`, { params: { page: 1, limit: 500 } }),
      ]);
      setGuia(guiaRes.data);
      setItens(itensRes.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [row.distCodigo]);

  useEffect(() => {
    load();
  }, [load]);

  const headerText = guia
    ? ` Distribuição nr. : ${guia.distCodigo} - Data Envio : ${formatDateBr(guia.distDataEnvio)} - Origem : ${guia.distLocalOrigemNome || guia.distLocalOrigem} - Destino : ${guia.distLocalDestinoNome || guia.distLocalDestino}`
    : "";

  const handleCancelar = () => {
    if (!motivo.trim()) {
      setError("Informe o motivo do cancelamento !");
      return;
    }
    setError("");
    setConfirm(true);
  };

  const doCancel = async () => {
    setConfirm(false);
    setBusy(true);
    setError("");
    try {
      const res = await apiJson(`/api/logistica/distribuicoes/${row.distCodigo}/cancelar`, {
        method: "POST",
        body: JSON.stringify({ motivo: motivo.trim() }),
      });
      onSuccess?.(res.message || "Guia cancelada com sucesso !");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <CancelModalLayout
        geneXusTitle="trnsdistribuicaoCancelar"
        groupCaption="Distribuição"
        headerText={headerText}
        motivo={motivo}
        onMotivoChange={setMotivo}
        loading={loading}
        error={error}
        busy={busy}
        onRetornar={onClose}
        onCancelar={handleCancelar}
        cancelLabel="Cancelar Distribuição"
      >
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>UN</th>
              <th>Quantidade</th>
              <th>Validade</th>
              <th>Lote</th>
            </tr>
          </thead>
          <tbody>
            {itens.length === 0 ? (
              <tr><td colSpan={6} className="muted">Nenhum item.</td></tr>
            ) : (
              itens.map((i) => (
                <tr key={i.distItemProduto}>
                  <td className="mono tnum">{i.distItemProduto}</td>
                  <td>{i.distItemProdutoDescricao || i.distItemProduto}</td>
                  <td>{i.distItemProdutoUN || "—"}</td>
                  <td className="tnum">{formatDecimalBr(i.distItemQuantidade, 4)}</td>
                  <td>{formatDateBr(i.distItemValidade) || "—"}</td>
                  <td>{i.distItemLote || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CancelModalLayout>
      {confirm && (
        <ConfirmDialog
          message="Deseja realmente Cancelar essa Distribuição ?"
          onYes={doCancel}
          onNo={() => setConfirm(false)}
        />
      )}
    </>
  );
}
