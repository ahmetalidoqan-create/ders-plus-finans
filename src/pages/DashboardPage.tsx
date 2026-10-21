import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  HandCoins,
  Receipt,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { addMonths, daysBetween, formatDate, formatMoney, formatMonthLong, formatPercent, monthKey, todayISO } from "@/lib/format";
import {
  getDashboardStats,
  getExpenseBreakdown,
  getMonthlySeries,
  getOverdueByStudent,
  getUpcomingPayments,
  isPaymentPaused,
} from "@/lib/finance";
import { StudentFormModal } from "@/components/modals/StudentFormModal";
import { CollectionFormModal } from "@/components/modals/CollectionFormModal";
import { ExpenseFormModal } from "@/components/modals/ExpenseFormModal";
import { Avatar } from "@/components/Avatar";
import { ClassroomRevenueTable } from "@/components/ClassroomRevenueTable";
import type { Student, StudentDraft } from "@/types";

const RANGE_OPTIONS = [7, 15, 30] as const;
type Range = (typeof RANGE_OPTIONS)[number];
type ModalKind = "student" | "collection" | "expense" | null;

const DONUT_COLORS = ["#f97316", "#38bdf8", "#a78bfa", "#94a3b8"];

function changePercent(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function shortMonth(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(new Date(year, (month || 1) - 1, 1));
}

export function DashboardPage() {
  const { data, addStudent, collectFromStudent, collectInstallment, addExpense } = useAppData();
  const [range, setRange] = useState<Range>(7);
  const [modal, setModal] = useState<ModalKind>(null);
  const [month, setMonth] = useState(monthKey(todayISO()));

  const stats = useMemo(() => getDashboardStats(data, month), [data, month]);
  const previousMonth = monthKey(addMonths(`${month}-01`, -1));
  const previousStats = useMemo(() => getDashboardStats(data, previousMonth), [data, previousMonth]);
  const upcoming = useMemo(() => getUpcomingPayments(data, range), [data, range]);
  const overdue = useMemo(() => getOverdueByStudent(data), [data]);
  const series = useMemo(() => getMonthlySeries(data, 6, month), [data, month]);
  const monthLabel = formatMonthLong(month);
  const today = todayISO();

  const remainingStudents = useMemo(
    () =>
      new Set(
        data.payments
          .filter(
            (p) =>
              monthKey(p.dueDate) === month &&
              p.status !== "paid" &&
              !isPaymentPaused(p, data.students),
          )
          .map((p) => p.studentId),
      ).size,
    [data.payments, data.students, month],
  );

  const monthExpenses = useMemo(
    () => data.expenses.filter((expense) => monthKey(expense.date) === month),
    [data.expenses, month],
  );
  const expenseBreakdown = useMemo(() => getExpenseBreakdown(monthExpenses), [monthExpenses]);
  const collectionRate = stats.expectedThisMonth > 0 ? (stats.realizedThisMonth / stats.expectedThisMonth) * 100 : 0;
  const remainingRate = stats.expectedThisMonth > 0 ? (stats.remainingThisMonth / stats.expectedThisMonth) * 100 : 0;
  const realizedChange = changePercent(stats.realizedThisMonth, previousStats.realizedThisMonth);
  const overdueChange = changePercent(stats.totalOverdueDebt, previousStats.totalOverdueDebt);
  const maxSeriesValue = Math.max(1, ...series.flatMap((item) => [item.expected, item.realized]));

  const donutSlices = useMemo(() => {
    const personnel = monthExpenses
      .filter((expense) => expense.category === "Personel/Maaş")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const rent = monthExpenses
      .filter((expense) => expense.category === "Kira")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const other = Math.max(0, stats.expensesThisMonth - personnel - rent);
    const items = [
      { label: "Tahsilatlar", amount: stats.realizedThisMonth, color: DONUT_COLORS[0] },
      { label: "Personel Giderleri", amount: personnel, color: DONUT_COLORS[1] },
      { label: "Kira", amount: rent, color: DONUT_COLORS[2] },
      { label: "Diğer Giderler", amount: other, color: DONUT_COLORS[3] },
    ].filter((item) => item.amount > 0);
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return {
      total,
      items: items.map((item) => ({ ...item, percent: total ? (item.amount / total) * 100 : 0 })),
    };
  }, [monthExpenses, stats.expensesThisMonth, stats.realizedThisMonth]);

  function findStudent(id: string): Student | undefined {
    return data.students.find((s) => s.id === id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Finans Paneli</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">
            {monthLabel} dönemine ait finansal özet, tahsilat durumu ve bekleyen ödemeler
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input w-auto min-w-[150px] py-2"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Özet dönemi"
          />
          <button type="button" className="btn-primary" onClick={() => setModal("student")}>
            <UserPlus size={16} /> Öğrenci Ekle
          </button>
          <button type="button" className="btn-blue" onClick={() => setModal("collection")}>
            <HandCoins size={16} /> Tahsilat Ekle
          </button>
          <button type="button" className="btn-secondary" onClick={() => setModal("expense")}>
            <Receipt size={16} /> Gider Ekle
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex rounded-xl bg-brand-50 p-2 text-brand-600">
              <Wallet size={18} />
            </span>
          </div>
          <p className="text-sm text-slate-500">Beklenen Tahsilat</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{formatMoney(stats.expectedThisMonth)}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, Math.max(2, collectionRate))}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {formatPercent(collectionRate)} tahsil edildi · Gerçekleşen {formatMoney(stats.realizedThisMonth)}
          </p>
        </article>

        <article className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <BadgeCheck size={18} />
            </span>
            <ChangeBadge value={realizedChange} />
          </div>
          <p className="text-sm text-slate-500">Gerçekleşen Tahsilat</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{formatMoney(stats.realizedThisMonth)}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(2, collectionRate))}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Geçen ay {formatMoney(previousStats.realizedThisMonth)}
          </p>
        </article>

        <article className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex rounded-xl bg-amber-50 p-2 text-amber-600">
              <Clock3 size={18} />
            </span>
          </div>
          <p className="text-sm text-slate-500">Kalan Tahsilat</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{formatMoney(stats.remainingThisMonth)}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, Math.max(2, remainingRate))}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {formatPercent(remainingRate)} vadede bekleyen · {remainingStudents} öğrenci
          </p>
        </article>

        <article className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex rounded-xl bg-red-50 p-2 text-red-600">
              <AlertTriangle size={18} />
            </span>
            <ChangeBadge value={overdueChange} invert />
          </div>
          <p className="text-sm text-slate-500">Toplam Geciken Borç</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{formatMoney(stats.totalOverdueDebt)}</p>
          <p className="mt-3 text-xs text-slate-500">{overdue.length} geciken öğrenci</p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">Tahsilat Grafiği</h3>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-400" /> Beklenen
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Gerçekleşen
              </span>
              <span>Son 6 ay</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="flex min-w-[420px] items-end justify-between gap-3 px-1 pb-1 pt-2" style={{ height: 240 }}>
              {series.map((item) => (
                <div key={item.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex h-48 w-full items-end justify-center gap-1.5">
                    <div
                      className="w-3.5 rounded-t bg-brand-400 sm:w-4"
                      style={{ height: `${Math.max(4, (item.expected / maxSeriesValue) * 100)}%` }}
                      title={`Beklenen: ${formatMoney(item.expected)}`}
                    />
                    <div
                      className="w-3.5 rounded-t bg-sky-400 sm:w-4"
                      style={{ height: `${Math.max(4, (item.realized / maxSeriesValue) * 100)}%` }}
                      title={`Gerçekleşen: ${formatMoney(item.realized)}`}
                    />
                  </div>
                  <span className="text-[11px] font-medium capitalize text-slate-500">{shortMonth(item.key)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Gelir - Gider Özeti</h3>
            <span className="text-xs text-slate-500">{monthLabel}</span>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-44 w-44 shrink-0">
              <div
                className="h-full w-full rounded-full"
                style={{
                  background: donutSlices.items.length
                    ? `conic-gradient(${donutSlices.items
                        .reduce<{ css: string[]; start: number }>(
                          (acc, item) => {
                            const end = acc.start + item.percent;
                            acc.css.push(`${item.color} ${acc.start}% ${end}%`);
                            acc.start = end;
                            return acc;
                          },
                          { css: [], start: 0 },
                        )
                        .css.join(", ")})`
                    : "#e2e8f0",
                }}
              />
              <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center">
                <p className="text-[11px] text-slate-500">Net Gelir</p>
                <p className={`text-sm font-bold ${stats.netThisMonth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatMoney(stats.netThisMonth)}
                </p>
              </div>
            </div>
            <ul className="w-full space-y-2.5 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Tahsilatlar
                </span>
                <span className="font-semibold text-slate-900">{formatMoney(stats.realizedThisMonth)}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Giderler
                </span>
                <span className="font-semibold text-slate-900">{formatMoney(-stats.expensesThisMonth)}</span>
              </li>
              {expenseBreakdown.slice(0, 3).map((item, index) => (
                <li key={item.category} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: DONUT_COLORS[(index + 1) % DONUT_COLORS.length] }}
                    />
                    {item.category}
                  </span>
                  <span className="font-medium text-slate-700">{formatMoney(-item.amount)}</span>
                </li>
              ))}
              {donutSlices.items.length === 0 ? (
                <li className="text-slate-500">Bu ay için gelir veya gider yok.</li>
              ) : null}
            </ul>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold">Yaklaşan Ödemeler</h3>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {RANGE_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setRange(d)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    range === d ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"
                  }`}
                >
                  {d} gün
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Öğrenci</th>
                  <th className="px-3 py-2.5 font-medium">Vade Tarihi</th>
                  <th className="px-3 py-2.5 font-medium">Tutar</th>
                  <th className="px-5 py-2.5 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.slice(0, 6).map((p) => {
                  const student = findStudent(p.studentId);
                  const days = daysBetween(today, p.dueDate);
                  return (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="px-5 py-3">
                        <Link to={`/ogrenciler/${p.studentId}`} className="flex items-center gap-3 font-medium hover:text-brand-600">
                          <Avatar name={student?.fullName ?? "—"} photoUrl={student?.photoUrl} size={32} />
                          {student?.fullName ?? "—"}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-slate-500">{formatDate(p.dueDate)}</td>
                      <td className="px-3 py-3 font-semibold">{formatMoney(p.amount)}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {days} gün kaldı
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {upcoming.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                      Seçilen aralıkta yaklaşan ödeme yok.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold">Geciken Ödemeler</h3>
            <Link to="/gecikenler" className="text-sm font-medium text-brand-600">
              Tümünü Gör
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Öğrenci</th>
                  <th className="px-3 py-2.5 font-medium">Gecikme</th>
                  <th className="px-3 py-2.5 font-medium">Tutar</th>
                  <th className="px-5 py-2.5 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {overdue.slice(0, 6).map((row) => {
                  const student = findStudent(row.studentId);
                  return (
                    <tr key={row.studentId} className="border-t border-slate-100">
                      <td className="px-5 py-3">
                        <Link to={`/ogrenciler/${row.studentId}`} className="flex items-center gap-3 font-medium hover:text-brand-600">
                          <Avatar name={student?.fullName ?? "—"} photoUrl={student?.photoUrl} size={32} />
                          {student?.fullName ?? "—"}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-slate-500">{row.count} taksit gecikti</td>
                      <td className="px-3 py-3 font-semibold text-red-600">{formatMoney(row.total)}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                          Acil
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {overdue.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                      Geciken ödeme yok.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ClassroomRevenueTable month={month} />

      {modal === "student" ? (
        <StudentFormModal
          onClose={() => setModal(null)}
          onSubmit={(draft: StudentDraft) => addStudent(draft)}
        />
      ) : null}
      {modal === "collection" ? (
        <CollectionFormModal
          students={data.students.filter((s) => s.status !== "frozen")}
          payments={data.payments}
          onClose={() => setModal(null)}
          onCollect={(input) => collectFromStudent(input)}
          onCollectInstallment={(paymentId, input) => collectInstallment(paymentId, input)}
        />
      ) : null}
      {modal === "expense" ? (
        <ExpenseFormModal onClose={() => setModal(null)} onSubmit={(payload) => addExpense(payload)} />
      ) : null}
    </div>
  );
}

function ChangeBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  const positive = invert ? value < 0 : value > 0;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  const tone = value === 0 ? "bg-slate-100 text-slate-500" : positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
      <Icon size={12} />
      {formatPercent(Math.abs(value))}
    </span>
  );
}
