import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppData } from "@/context/AppDataContext";
import { formatDate, formatMoney, formatMonthLong, monthKey, todayISO } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/constants";
import { Avatar } from "@/components/Avatar";
import type { Payment, PaymentMethod } from "@/types";

function paymentLabel(p: Payment) {
  if (p.note.includes("kalan")) return p.note;
  if (p.kind === "down_payment") return "Peşinat";
  if (p.kind === "installment") return `${p.installmentNo}. Taksit`;
  return p.note || "Ödeme";
}

function groupDescription(labels: string[]) {
  if (labels.length === 1) return labels[0];
  return labels.join(", ");
}

type CollectionRow = {
  key: string;
  studentId: string;
  amount: number;
  paidAt: string;
  method: PaymentMethod | null;
  description: string;
};

function groupPaidCollections(payments: Payment[]): CollectionRow[] {
  const groups = new Map<string, CollectionRow & { labels: string[] }>();
  for (const payment of payments) {
    if (!payment.paidAt) continue;
    const key = `${payment.studentId}|${payment.paidAt}|${payment.method ?? ""}`;
    const label = paymentLabel(payment);
    const existing = groups.get(key);
    if (existing) {
      existing.amount += payment.amount;
      if (!existing.labels.includes(label)) existing.labels.push(label);
      existing.description = groupDescription(existing.labels);
    } else {
      groups.set(key, {
        key,
        studentId: payment.studentId,
        amount: payment.amount,
        paidAt: payment.paidAt,
        method: payment.method,
        labels: [label],
        description: label,
      });
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.paidAt.localeCompare(a.paidAt) || b.amount - a.amount);
}

export function PaymentsPage() {
  const { data } = useAppData();
  const currentMonth = monthKey(todayISO());
  const [selectedDay, setSelectedDay] = useState("");

  const paidRows = useMemo(
    () =>
      data.payments.filter((p) => {
        if (p.status !== "paid" || !p.paidAt) return false;
        if (selectedDay) return p.paidAt === selectedDay;
        return monthKey(p.paidAt) === currentMonth;
      }),
    [data.payments, currentMonth, selectedDay],
  );
  const rows = useMemo(() => groupPaidCollections(paidRows), [paidRows]);
  const totalAmount = paidRows.reduce((sum, p) => sum + p.amount, 0);
  const studentCount = new Set(paidRows.map((p) => p.studentId)).size;
  const heading = selectedDay ? `${formatDate(selectedDay)} tahsilatları` : `${formatMonthLong(currentMonth)} tahsilatları`;
  const summaryLabel = selectedDay ? "Bu gün ödeme yapan" : "Bu ay ödeme yapan";
  const emptyLabel = selectedDay ? "Seçilen günde tahsilat kaydı yok." : "Bu ay için henüz bir tahsilat kaydı yok.";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
          <p className="text-sm text-slate-500">
            {summaryLabel} {studentCount} öğrenci · Toplam {formatMoney(totalAmount)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input w-auto min-w-[160px] py-2 text-sm"
            type="date"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            aria-label="Tahsilat günü"
          />
          {selectedDay ? (
            <button type="button" className="btn-secondary py-2 text-xs" onClick={() => setSelectedDay("")}>
              Ayın tamamı
            </button>
          ) : null}
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Öğrenci</th>
                <th className="px-4 py-3 font-medium">Açıklama</th>
                <th className="px-4 py-3 font-medium">Tutar</th>
                <th className="px-4 py-3 font-medium">Ödeme tarihi</th>
                <th className="px-4 py-3 font-medium">Yöntem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const student = data.students.find((s) => s.id === row.studentId);
                return (
                  <tr key={row.key} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      {student ? (
                        <Link
                          to={`/ogrenciler/${student.id}`}
                          className="flex items-center gap-3 font-medium text-slate-900 hover:text-brand-600"
                        >
                          <Avatar name={student.fullName} photoUrl={student.photoUrl} size={32} />
                          {student.fullName}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.description}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{formatMoney(row.amount)}</td>
                    <td className="px-4 py-3">{formatDate(row.paidAt)}</td>
                    <td className="px-4 py-3 text-slate-500">{paymentMethodLabel(row.method)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    {emptyLabel}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
