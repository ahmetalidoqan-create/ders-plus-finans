import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AdminUser } from "@/types";
import { ACCESS_PASSWORD_KEY, AUTH_KEY, loadJson, saveJson } from "@/lib/storage";

const SESSION_USER: AdminUser = {
  email: "",
  name: "Yönetici",
};

type AuthContextValue = {
  user: AdminUser | null;
  hasPassword: boolean;
  setAccessPassword: (password: string) => void;
  login: (password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredPassword() {
  return (localStorage.getItem(ACCESS_PASSWORD_KEY) ?? "").trim();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    if (!readStoredPassword()) return null;
    return loadJson<AdminUser | null>(AUTH_KEY, null);
  });
  const [hasPassword, setHasPassword] = useState(() => Boolean(readStoredPassword()));

  const setAccessPassword = useCallback((password: string) => {
    const next = password.trim();
    localStorage.setItem(ACCESS_PASSWORD_KEY, next);
    setHasPassword(Boolean(next));
    setUser(SESSION_USER);
    saveJson(AUTH_KEY, SESSION_USER);
  }, []);

  const login = useCallback((password: string) => {
    const stored = readStoredPassword();
    if (!stored || password !== stored) return false;
    setUser(SESSION_USER);
    saveJson(AUTH_KEY, SESSION_USER);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, hasPassword, setAccessPassword, login, logout }),
    [user, hasPassword, setAccessPassword, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
