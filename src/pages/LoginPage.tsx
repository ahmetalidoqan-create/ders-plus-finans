import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { DEMO_ADMIN } from "@/lib/storage";
import { getLogoIcon } from "@/lib/logoIcons";

export function LoginPage() {
  const { user, login } = useAuth();
  const { data } = useAppData();
  const LogoIcon = getLogoIcon(data.settings.logoIcon);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = login(email, password);
    setError(ok ? "" : "E-posta veya şifre hatalı.");
  }

  function demoLogin() {
    setEmail(DEMO_ADMIN.email);
    setPassword(DEMO_ADMIN.password);
    login(DEMO_ADMIN.email, DEMO_ADMIN.password);
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
            Öğrenci takip ve finansal yönetim paneli
          </p>
        </div>
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">E-posta</label>
            <input
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dersplus.com"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Şifre</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          <button type="submit" className="btn-primary w-full">
            Giriş Yap <ArrowRight size={16} />
          </button>
          <button type="button" onClick={demoLogin} className="btn-secondary w-full">
            <Sparkles size={16} className="text-brand-500" />
            Demo Girişi Yap
          </button>
        </form>
      </div>
    </div>
  );
}
