import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { getLogoIcon } from "@/lib/logoIcons";

export function LoginPage() {
  const { user, login } = useAuth();
  const { data } = useAppData();
  const LogoIcon = getLogoIcon(data.settings.logoIcon);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = login(username, password);
    setError(ok ? "" : "Kullanıcı adı veya şifre hatalı.");
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
            Hatice ve Ahmet aynı kurum verisini görür. Yetkili kullanıcı adı ve şifre ile giriş yapın.
          </p>
        </div>
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Lock size={16} className="text-brand-500" />
            Güvenli giriş
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Kullanıcı adı</label>
            <input
              className="input"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adı"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Şifre</label>
            <input
              className="input [-webkit-text-security:disc]"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              required
            />
          </div>
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          <button type="submit" className="btn-primary w-full">
            Giriş Yap <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
