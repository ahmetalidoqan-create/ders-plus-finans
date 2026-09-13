import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Clock3,
  HandCoins,
  Landmark,
  Receipt,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatDate, formatMoney } from "@/lib/format";
import { getCashBankSummary, getDashboardStats, getOverdueByStudent, getUpcomingPayments } from "@/lib/finance";
import { StudentFormModal } from "@/components/modals/StudentFormModal";
import { CollectionFormModal } from "@/components/modals/CollectionFormModal";
import { ExpenseFormModal } from "@/components/modals/ExpenseFormModal";
import { Avatar } from "@/components/Avatar";
import { ClassroomRevenueTable } from "@/components/ClassroomRevenueTable";
import type { Student, StudentDraft } from "@/types";

const RANGE_OPTIONS = [7, 15, 30] as const;
type Range = (typeof RANGE_OPTIONS)[number];
type ModalKind = "student" | "collection" | "expense" | null;

export function DashboardPage() {
  const { data, addStudent, collectFromStudent, collectInstallment, addExpense } = useAppData();
  const [range, setRange] = useState<Range>(7);
  const [modal, setModal] = useState<ModalKind>(null);

  const stats = useMemo(() => getDashboardStats(data), [data]);
  const cashBank = useMemo(() => getCashBankSummary(data), [data]);
  const upcoming = useMemo(() => getUpcomingPayments(data, range), [data, range]);
  const overdue = useMemo(() => getOverdueByStudent(data), [data]);

  function findStudent(id: string): Student | undefined {
    return data.students.find((s) => s.id === id);
  }

  const netPositive = stats.netThisMonth >= 0;
  const cashPositive = cashBank.cash >= 0;
  const bankPositive = cashBank.bank >= 0;

  const cards = [
    {
      label: "Bu Ay Beklenen Tahsilat",
      value: stats.expectedThisMonth,
      icon: Wallet,
      tone: "text-brand-600 bg-brand-50",
    },
    {
      label: "Bu Ay Gerçekleşen Tahsilat",
      value: stats.realizedThisMonth,
      icon: BadgeCheck,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Kalan Tahsilat",
      value: stats.remainingThisMonth,
      icon: Clock3,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "Toplam Geciken Borç",
      value: stats.totalOverdueDebt,
      icon: AlertTriangle,
      tone: "text-red-600 bg-red-50",
    },
    {
      label: "Bu Ay Toplam Gider",
      value: stats.expensesThisMonth,
      icon: Receipt,
      tone: "text-slate-700 bg-slate-100",
    },
    {
      label: "Net Durum",
      value: stats.netThisMonth,
      icon: netPositive ? TrendingUp : TrendingDown,
      tone: netPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50",
    },
    {
      label: "Kasadaki Nakit",
      value: cashBank.cash,
      icon: Banknote,
      tone: cashPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50",
    },
    {
      label: "Bankadaki Tutar",
      value: cashBank.bank,
      icon: Landmark,
      tone: bankPositive ? "text-sky-600 bg-sky-50" : "text-red-600 bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className={`mb-4 inline-flex rounded-xl p-2 ${card.tone}`}>
              <card.icon size={18} />
            </div>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatMoney(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Yaklaşan ödemeler</h2>
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
          <div className="space-y-2">
            {upcoming.slice(0, 6).map((p) => {
              const student = findStudent(p.studentId);
              return (
                <Link
                  key={p.id}
                  to={`/ogrenciler/${p.studentId}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 transition hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={student?.fullName ?? "—"} photoUrl={student?.photoUrl} size={32} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{student?.fullName ?? "—"}</p>
                      <p className="text-xs text-slate-500">Vade: {formatDate(p.dueDate)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatMoney(p.amount)}</p>
                </Link>
              );
            })}
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">Seçilen aralıkta yaklaşan ödeme yok.</p>
            ) : null}
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Geciken ödemeler</h2>
            <Link to="/gecikenler" className="text-sm font-medium text-brand-600">
              Tümü
            </Link>
          </div>
          <div className="space-y-2">
            {overdue.slice(0, 6).map((row) => {
              const student = findStudent(row.studentId);
              return (
                <Link
                  key={row.studentId}
                  to={`/ogrenciler/${row.studentId}`}
                  className="flex items-center justify-between rounded-xl bg-red-50 px-3 py-2.5 transition hover:bg-red-100"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={student?.fullName ?? "—"} photoUrl={student?.photoUrl} size={32} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{student?.fullName ?? "—"}</p>
                      <p className="text-xs text-slate-500">
                        {row.count} taksit gecikti
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-red-600">{formatMoney(row.total)}</p>
                </Link>
              );
            })}
            {overdue.length === 0 ? (
              <p className="text-sm text-slate-500">Geciken ödeme yok.</p>
            ) : null}
          </div>
        </section>
      </div>

      <ClassroomRevenueTable />

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
