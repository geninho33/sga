import { useEffect, useState } from "react";
import { apiJson } from "../api/client";

export function useGamReferencias() {
  const [refs, setRefs] = useState({ prefeituras: [], cargos: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiJson("/api/admin/gam/referencias");
        if (!cancelled) {
          setRefs({
            prefeituras: res.data?.prefeituras ?? [],
            cargos: res.data?.cargos ?? [],
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
