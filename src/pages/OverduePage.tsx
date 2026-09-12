import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Search } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { daysBetween, formatDate, formatMoney, todayISO } from "@/lib/format";
import { getOverduePayments } from "@/lib/finance";
import { normalizeWhatsAppPhone } from "@/lib/receipt";
import { Avatar } from "@/components/Avatar";
import type { Payment, Student } from "@/types";

type OverdueStudent = {
  student: Student;
  payments: Payment[];
  totalAmount: number;
  daysOverdue: number;
  oldestDue: string;
};

function reminderText(row: OverdueStudent) {
  const installment = row.payments
    .map((p) => (p.kind === "installment" && p.installmentNo ? `${p.installmentNo}. taksit` : p.note || "ödeme"))
    .join(", ");
  return [
    "Sayın velimiz,",
    "",
    `${row.student.fullName} adlı öğrencimizin ${formatMoney(row.totalAmount)} tutarındaki ödemesi ${row.daysOverdue} gündür gecikmiştir.`,
    `Vade tarihi: ${formatDate(row.oldestDue)}`,
    installment ? `Kalem: ${installment}` : "",
    "",
    "Ödemenizi en kısa sürede yapmanızı rica ederiz. Teşekkür ederiz.",
    "",
    "Ders Plus",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function reminderUrl(row: OverdueStudent) {
  const phone = normalizeWhatsAppPhone(row.student.parentPhone || row.student.phone);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(reminderText(row))}`;
}

export function OverduePage() {
  const { data } = useAppData();
  const [query, setQuery] = useState("");
  const overdue = getOverduePayments(data);

  const rows = useMemo(() => {
    const byStudent = new Map<string, OverdueStudent>();
    for (const payment of overdue) {
      const student = data.students.find((s) => s.id === payment.studentId);
      if (!student) continue;
      const existing = byStudent.get(student.id);
      const days = Math.max(daysBetween(payment.dueDate, todayISO()), 0);
      if (!existing) {
        byStudent.set(student.id, {
          student,
          payments: [payment],
          totalAmount: payment.amount,
          daysOverdue: days,
          oldestDue: payment.dueDate,
        });
        continue;
      }
      existing.payments.push(payment);
      existing.totalAmount += payment.amount;
      if (payment.dueDate < existing.oldestDue) {
        existing.oldestDue = payment.dueDate;
        existing.daysOverdue = days;
      }
    }
    return Array.from(byStudent.values()).sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [overdue, data.students]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return rows;
    return rows.filter((row) => row.student.fullName.toLocaleLowerCase("tr").includes(q));
  }, [rows, query]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Vadesi geçmiş öğrenciler. İsme göre arayıp hatırlatma gönderebilirsiniz.</p>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="Öğrenci ismi ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Öğrenci</th>
                <th className="px-4 py-3 font-medium">Geciken tutar</th>
                <th className="px-4 py-3 font-medium">Gecikme</th>
                <th className="px-4 py-3 font-medium">Hatırlatma</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const url = reminderUrl(row);
                const phone = row.student.parentPhone || row.student.phone;
                return (
                  <tr key={row.student.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link
                        to={`/ogrenciler/${row.student.id}`}
                        className="flex items-center gap-3 font-medium text-slate-900 hover:text-brand-600"
                      >
                        <Avatar name={row.student.fullName} photoUrl={row.student.photoUrl} size={36} />
                        <span>
                          {row.student.fullName}
                          <span className="block text-xs font-normal text-slate-500">
                            {row.student.classroom}
                            {row.payments.length > 1 ? ` · ${row.payments.length} kalem` : ""}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold text-red-600">{formatMoney(row.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        {row.daysOverdue} gün gecikmede
                      </span>
                      <p className="mt-1 text-xs text-slate-400">Vade: {formatDate(row.oldestDue)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {url ? (
                        <a
                          className="btn-primary py-1.5 text-xs"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle size={14} /> Hatırlatma gönder
                        </a>
                      ) : (
                        <p className="text-xs text-amber-600">Telefon yok</p>
                      )}
                      {phone ? <p className="mt-1 text-xs text-slate-400">{phone}</p> : null}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                    {rows.length === 0 ? "Geciken öğrenci bulunmuyor." : "Aramayla eşleşen öğrenci yok."}
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
