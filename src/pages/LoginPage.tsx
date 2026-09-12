import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { getLogoIcon } from "@/lib/logoIcons";

export function LoginPage() {
  const { user, hasPassword, login, setAccessPassword } = useAuth();
  const { data } = useAppData();
  const LogoIcon = getLogoIcon(data.settings.logoIcon);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hasPassword) {
      if (password.trim().length < 4) {
        setError("Şifre en az 4 karakter olmalı.");
        return;
      }
      if (password !== confirm) {
        setError("Şifreler eşleşmiyor.");
        return;
      }
      setAccessPassword(password);
      return;
    }
    const ok = login(password);
    setError(ok ? "" : "Şifre hatalı. Tekrar deneyin.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand-50 to-transparent" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
            <LogoIcon size={26} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {data.settings.academyName} Finans
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {hasPassword ? "Devam etmek için şifrenizi girin." : "İlk girişte panele bir şifre belirleyin."}
          </p>
        </div>
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Lock size={16} className="text-brand-500" />
            {hasPassword ? "Şifre ile giriş" : "Şifre oluştur"}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Şifre</label>
            <input
              className="input"
              type="password"
              autoComplete={hasPassword ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {!hasPassword ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Şifre tekrar</label>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          ) : null}
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          <button type="submit" className="btn-primary w-full">
            {hasPassword ? "Giriş Yap" : "Şifreyi Kaydet ve Gir"} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
