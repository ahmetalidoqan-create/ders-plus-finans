import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AdminUser } from "@/types";
import { APP_USERS, AUTH_KEY, loadJson, saveJson } from "@/lib/storage";

const IDLE_LIMIT_MS = 5 * 60 * 1000;
const LAST_ACTIVITY_KEY = "dersplus_last_activity";
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll", "mousemove"] as const;

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
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
  }, []);

  useEffect(() => {
    if (!user) return;

    const markActivity = () => {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    };

    const lastActivity = () => {
      const stored = Number(sessionStorage.getItem(LAST_ACTIVITY_KEY));
      return Number.isFinite(stored) && stored > 0 ? stored : 0;
    };

    const expireIfIdle = () => {
      const last = lastActivity();
      if (!last) {
        markActivity();
        return;
      }
      if (Date.now() - last >= IDLE_LIMIT_MS) logout();
    };

    markActivity();
    expireIfIdle();

    let lastMove = 0;
    const onActivity = (event: Event) => {
      if (event.type === "mousemove") {
        const now = Date.now();
        if (now - lastMove < 1000) return;
        lastMove = now;
      }
      markActivity();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") expireIfIdle();
    };

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", expireIfIdle);
    window.addEventListener("pageshow", expireIfIdle);
    const timer = window.setInterval(expireIfIdle, 15_000);

    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", expireIfIdle);
      window.removeEventListener("pageshow", expireIfIdle);
      window.clearInterval(timer);
    };
  }, [user, logout]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
