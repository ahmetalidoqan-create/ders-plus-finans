import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/ogrenciler": "Öğrenciler",
  "/odemeler": "Ödemeler",
  "/gecikenler": "Gecikenler",
  "/giderler": "Giderler",
  "/ogretmen-hakedis": "Öğretmen Hakediş",
  "/raporlar": "Raporlar",
  "/ayarlar": "Ayarlar",
};

function pageTitle(pathname: string) {
  if (pathname.startsWith("/ogrenciler/")) return "Öğrenci Detayı";
  return titles[pathname] ?? "Panel";
}

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { data } = useAppData();

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Menüyü aç"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {data.settings.academyName}
              </p>
              <h1 className="text-lg font-bold text-slate-900">{pageTitle(pathname)}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn-secondary shrink-0 px-3 py-2"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Çıkış Yap</span>
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
