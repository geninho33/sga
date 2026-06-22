import { apiJson, setStoredToken } from "./client";

export async function login(usuario, senha) {
  const data = await apiJson("/api/auth/login", {
    method: "POST",
    token: null,
    body: JSON.stringify({ usuario, senha }),
  });
  setStoredToken(data.token);
  return data;
}

export async function fetchMe() {
  return apiJson("/api/auth/me");
}

export async function logout() {
  try {
    await apiJson("/api/auth/logout", { method: "POST" });
  } finally {
    setStoredToken(null);
  }
}
