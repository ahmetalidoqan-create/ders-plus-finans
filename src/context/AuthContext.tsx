import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AdminUser } from "@/types";
import { APP_USERS, AUTH_KEY, loadJson, saveJson } from "@/lib/storage";

type AuthContextValue = {
  user: AdminUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toSessionUser(username: string, name: string): AdminUser {
  return { email: username, name };
}

function isAllowedSession(user: AdminUser | null): user is AdminUser {
  if (!user?.email) return false;
  return APP_USERS.some((account) => account.username === user.email.toLocaleLowerCase("tr"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const stored = loadJson<AdminUser | null>(AUTH_KEY, null);
    return isAllowedSession(stored) ? stored : null;
  });

  const login = useCallback((username: string, password: string) => {
    const account = APP_USERS.find(
      (item) => item.username === username.trim().toLocaleLowerCase("tr") && item.password === password,
    );
    if (!account) return false;
    const next = toSessionUser(account.username, account.name);
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
