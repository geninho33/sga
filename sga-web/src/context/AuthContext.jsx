import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe, login as apiLogin, logout as apiLogout } from "../api/auth";
import { getStoredToken, setStoredToken } from "../api/client";

const AuthContext = createContext(null);

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const data = await fetchMe();
      setUser(data.user);
      return data.user;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  const updateUser = useCallback((partial) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener("sga:unauthorized", onUnauthorized);
    return () => window.removeEventListener("sga:unauthorized", onUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (usuario, senha) => {
    const data = await apiLogin(usuario, senha);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      initials: initialsFromName(user?.usuNome || user?.usuUsuario),
      login,
      logout,
      refresh,
      updateUser,
    }),
    [user, loading, login, logout, refresh, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
