import { useMemo, useState } from "react";
import { AlertTriangle, BadgeCheck, Clock3, Receipt, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatMoney } from "@/lib/format";
import {
  getCollectionPerformance,
  getExpenseBreakdown,
  getMonthlySeries,
  getPeriodReport,
  type PeriodGranularity,
} from "@/lib/finance";
import { categoryBarClass } from "@/lib/constants";
import { ClassroomRevenueTable } from "@/components/ClassroomRevenueTable";

const PERIOD_LABELS: Record<PeriodGranularity, string> = {
  month: "Aylık",
  year: "Yıllık",
};

export function ReportsPage() {
  const { data } = useAppData();
  const [period, setPeriod] = useState<PeriodGranularity>("month");

  const report = useMemo(() => getPeriodReport(data, period), [data, period]);
  const series = useMemo(() => getMonthlySeries(data, 6), [data]);
  const breakdown = useMemo(() => getExpenseBreakdown(data.expenses), [data.expenses]);
  const performance = useMemo(() => getCollectionPerformance(data.payments), [data.payments]);

  const netPositive = report.net >= 0;
  const maxSeriesValue = Math.max(1, ...series.flatMap((m) => [m.realized, m.expenses]));

  const summaryCards = [
    { label: "Gerçekleşen Tahsilat", value: report.realized, icon: BadgeCheck, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Beklenen Alacak", value: report.remaining, icon: Clock3, tone: "text-amber-600 bg-amber-50" },
    { label: "Toplam Gider", value: report.expenses, icon: Receipt, tone: "text-slate-700 bg-slate-100" },
    {
      label: "Net Durum",
      value: report.net,
      icon: netPositive ? TrendingUp : TrendingDown,
      tone: netPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50",
    },
  ];

  const activeStudents = data.students.filter((s) => s.status === "active").length;
  const frozenStudents = data.students.filter((s) => s.status === "frozen").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Dönemsel Raporlama</h2>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(Object.keys(PERIOD_LABELS) as PeriodGranularity[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                period === key ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"
              }`}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className={`mb-4 inline-flex rounded-xl p-2 ${card.tone}`}>
              <card.icon size={18} />
            </div>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatMoney(card.value)}</p>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Gelir / Gider Dengesi</h3>
            <p className="text-sm text-slate-500">Son 6 ayın gerçekleşen tahsilat ve gider karşılaştırması</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Tahsilat
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-400" /> Gider
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex min-w-[480px] items-end justify-between gap-3 px-1 pb-2 pt-4" style={{ height: 200 }}>
            {series.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center gap-1.5">
                  <div
                    className="w-3.5 rounded-t bg-emerald-500 transition-all sm:w-4"
                    style={{ height: `${Math.max(2, (m.realized / maxSeriesValue) * 100)}%` }}
                    title={`Tahsilat: ${formatMoney(m.realized)}`}
                  />
                  <div
                    className="w-3.5 rounded-t bg-brand-400 transition-all sm:w-4"
                    style={{ height: `${Math.max(2, (m.expenses / maxSeriesValue) * 100)}%` }}
                    title={`Gider: ${formatMoney(m.expenses)}`}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-500">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h3 className="mb-1 font-semibold">Kategori Bazlı Gider Dağılımı</h3>
          <p className="mb-4 text-sm text-slate-500">Tüm zamanlar toplamına göre kategori payları</p>
          <div className="space-y-4">
            {breakdown.map((item) => (
              <div key={item.category}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.category}</span>
                  <span className="text-slate-500">
                    {formatMoney(item.amount)} · %{item.percent.toFixed(0)}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${categoryBarClass(item.category)}`}
                    style={{ width: `${Math.max(2, item.percent)}%` }}
                  />
                </div>
              </div>
            ))}
            {breakdown.length === 0 ? <p className="text-sm text-slate-500">Henüz gider kaydı yok.</p> : null}
          </div>
        </section>

        <section className="card p-5">
          <h3 className="mb-1 font-semibold">Tahsilat Performansı</h3>
          <p className="mb-4 text-sm text-slate-500">
            Vadesi gelmiş {performance.total} taksitin durumu
          </p>
          <div className="space-y-4">
            <PerformanceRow
              label="Zamanında ödenen"
              count={performance.onTime}
              rate={performance.onTimeRate}
              barClass="bg-emerald-500"
            />
            <PerformanceRow
              label="Geç ödenen"
              count={performance.late}
              rate={performance.lateRate}
              barClass="bg-amber-500"
            />
            <PerformanceRow
              label="Gecikmede (tahsil edilmedi)"
              count={performance.overdue}
              rate={performance.overdueRate}
              barClass="bg-red-500"
            />
          </div>
          <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-slate-400" />
              <span className="text-slate-500">Aktif öğrenci: </span>
              <span className="font-semibold text-slate-800">{activeStudents}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wallet size={14} className="text-slate-400" />
              <span className="text-slate-500">Dondurulmuş öğrenci: </span>
              <span className="font-semibold text-slate-800">{frozenStudents}</span>
            </div>
          </div>
        </section>
      </div>

      <ClassroomRevenueTable />
    </div>
  );
}

function PerformanceRow({
  label,
  count,
  rate,
  barClass,
}: {
  label: string;
  count: number;
  rate: number;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {count} taksit · %{rate.toFixed(0)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.max(2, rate)}%` }} />
      </div>
    </div>
  );
}
