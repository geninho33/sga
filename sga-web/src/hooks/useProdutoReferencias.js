import { useEffect, useState } from "react";
import { fetchProdutoReferencias } from "../api/produtoReferencias";

let cache = null;
let pending = null;

function loadReferencias() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetchProdutoReferencias()
      .then((data) => {
        cache = data;
        return data;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function useProdutoReferencias() {
  const [refs, setRefs] = useState(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    loadReferencias()
      .then((data) => {
        if (active) {
          setRefs(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return {
    grupos: refs?.grupos ?? [],
    origens: refs?.origens ?? [],
    tiposRemessa: refs?.tiposRemessa ?? [],
    tacos: refs?.tacos ?? [],
    unidades: refs?.unidades ?? [],
    loading,
    error,
  };
}
