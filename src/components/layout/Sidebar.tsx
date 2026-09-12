import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  AlertTriangle,
  Receipt,
  BarChart3,
  Settings,
  CalendarClock,
  X,
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { getLogoIcon } from "@/lib/logoIcons";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ogrenciler", label: "Öğrenciler", icon: Users },
  { to: "/odemeler", label: "Ödemeler", icon: Wallet },
  { to: "/gecikenler", label: "Gecikenler", icon: AlertTriangle },
  { to: "/giderler", label: "Giderler", icon: Receipt },
  { to: "/ogretmen-hakedis", label: "Öğretmen Hakediş", icon: CalendarClock },
  { to: "/raporlar", label: "Raporlar", icon: BarChart3 },
  { to: "/ayarlar", label: "Ayarlar", icon: Settings },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const { data } = useAppData();
  const LogoIcon = getLogoIcon(data.settings.logoIcon);

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-100 bg-white transition-transform lg:static lg:w-64 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <LogoIcon size={20} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">{data.settings.academyName}</p>
              <p className="text-xs text-slate-500">Finans Paneli</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 lg:hidden"
            onClick={onClose}
            aria-label="Menüyü kapat"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 pb-6">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
