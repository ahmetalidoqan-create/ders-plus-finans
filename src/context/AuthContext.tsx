import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AdminUser } from "@/types";
import { AUTH_KEY, DEMO_ADMIN, loadJson, saveJson } from "@/lib/storage";

type AuthContextValue = {
  user: AdminUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() =>
    loadJson<AdminUser | null>(AUTH_KEY, null),
  );

  const login = useCallback((email: string, password: string) => {
    const ok =
      email.trim().toLowerCase() === DEMO_ADMIN.email &&
      password === DEMO_ADMIN.password;
    if (!ok) return false;
    const next = { email: DEMO_ADMIN.email, name: DEMO_ADMIN.name };
    setUser(next);
    saveJson(AUTH_KEY, next);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
