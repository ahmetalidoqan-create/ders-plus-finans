import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatDate, formatMoney, formatMonthLong, monthKey, todayISO } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/constants";
import { PaymentFormModal } from "@/components/modals/PaymentFormModal";
import { Avatar } from "@/components/Avatar";

export function PaymentsPage() {
  const { data, addPayment } = useAppData();
  const [open, setOpen] = useState(false);
  const currentMonth = monthKey(todayISO());

  const rows = useMemo(
    () =>
      data.payments
        .filter((p) => p.status === "paid" && p.paidAt && monthKey(p.paidAt) === currentMonth)
        .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? "")),
    [data.payments, currentMonth],
  );

  const totalAmount = rows.reduce((sum, p) => sum + p.amount, 0);
  const studentCount = new Set(rows.map((p) => p.studentId)).size;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{formatMonthLong(currentMonth)} tahsilatları</h2>
          <p className="text-sm text-slate-500">
            Bu ay ödeme yapan {studentCount} öğrenci · Toplam {formatMoney(totalAmount)}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Ödeme ekle
        </button>
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
              {rows.map((p) => {
                const student = data.students.find((s) => s.id === p.studentId);
                return (
                  <tr key={p.id} className="border-t border-slate-100">
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
                    <td className="px-4 py-3 text-slate-500">{p.note}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{formatMoney(p.amount)}</td>
                    <td className="px-4 py-3">{formatDate(p.paidAt)}</td>
                    <td className="px-4 py-3 text-slate-500">{paymentMethodLabel(p.method)}</td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    Bu ay için henüz bir tahsilat kaydı yok.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      {open ? (
        <PaymentFormModal
          students={data.students}
          onClose={() => setOpen(false)}
          onSubmit={(payload) => addPayment(payload)}
        />
      ) : null}
    </div>
  );
}
