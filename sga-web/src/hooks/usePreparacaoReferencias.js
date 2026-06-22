import { useEffect, useState } from "react";
import { apiJson } from "../api/client";

export function usePreparacaoReferencias() {
  const [refs, setRefs] = useState({
    tiposRefeicao: [],
    locais: [],
    cardapioGrupos: [],
    pratos: [],
    cardapios: [],
    areasEnsino: [],
    etapasEnsino: [],
    produtos: [],
    nutricionistas: [],
    atendimentoHasCarDapCodigo: true,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiJson("/api/preparacao/referencias");
        if (!cancelled) {
          setRefs({
            tiposRefeicao: res.data?.tiposRefeicao ?? [],
            locais: res.data?.locais ?? [],
            cardapioGrupos: res.data?.cardapioGrupos ?? [],
            pratos: res.data?.pratos ?? [],
            cardapios: res.data?.cardapios ?? [],
            areasEnsino: res.data?.areasEnsino ?? [],
            etapasEnsino: res.data?.etapasEnsino ?? [],
            produtos: res.data?.produtos ?? [],
            turnoGrupo: res.data?.turnoGrupo ?? [],
            nutricionistas: res.data?.nutricionistas ?? [],
            atendimentoHasCarDapCodigo: res.data?.atendimentoHasCarDapCodigo !== false,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setRefs((r) => ({ ...r, loading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return refs;
}
