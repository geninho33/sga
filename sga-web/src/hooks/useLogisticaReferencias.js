import { useEffect, useState } from "react";
import { apiJson } from "../api/client";

export function useLogisticaReferencias() {
  const [refs, setRefs] = useState({
    fornecedores: [],
    rotas: [],
    tipos: [],
    locais: [],
    produtos: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiJson("/api/logistica/referencias");
        if (!cancelled) {
          setRefs({
            fornecedores: res.data?.fornecedores ?? [],
            rotas: res.data?.rotas ?? [],
            tipos: res.data?.tipos ?? [],
            locais: res.data?.locais ?? [],
            produtos: res.data?.produtos ?? [],
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
