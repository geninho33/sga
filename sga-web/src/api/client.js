const API_BASE = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "sga_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function buildUrl(path, params) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  return url.pathname + url.search;
}

async function parseError(res, fallback) {
  const body = await res.json().catch(() => ({}));
  const err = new Error(body.error || fallback);
  err.status = res.status;
  throw err;
}

export async function apiFetch(path, { params, token, headers, ...init } = {}) {
  const authToken = token ?? getStoredToken();
  const reqHeaders = { ...headers };

  if (authToken) {
    reqHeaders.Authorization = `Bearer ${authToken}`;
  }

  if (init.body && !reqHeaders["Content-Type"]) {
    reqHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(buildUrl(path, params), {
    ...init,
    headers: reqHeaders,
    signal: init.signal,
  });

  if (res.status === 401 && authToken) {
    setStoredToken(null);
    window.dispatchEvent(new CustomEvent("sga:unauthorized"));
  }

  return res;
}

export async function apiJson(path, options) {
  const res = await apiFetch(path, options);
  if (!res.ok) await parseError(res, `Erro ${res.status}`);
  return res.json();
}

export { buildUrl, parseError };
