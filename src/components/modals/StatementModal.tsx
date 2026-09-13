import { useMemo, useRef, useState } from "react";
import { FileDown, MessageCircle, X } from "lucide-react";
import { ModalShell } from "@/components/modals/ModalShell";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { StatementSheet } from "@/components/statement/StatementSheet";
import { formatDate, formatMoney } from "@/lib/format";
import {
  buildStatementData,
  downloadStatementPdf,
  statementWhatsAppUrl,
} from "@/lib/statement";
import type { Payment, Student } from "@/types";

type Props = {
  student: Student;
  payments: Payment[];
  academyName: string;
  onClose: () => void;
};

export function StatementModal({ student, payments, academyName, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const data = useMemo(
    () => buildStatementData(student, payments, academyName),
    [student, payments, academyName],
  );
  const whatsappUrl = statementWhatsAppUrl(data);
  const displayPhone = student.parentPhone.trim() || student.phone.trim();
  const frozen = student.status === "frozen";

  async function handlePdf() {
    if (!sheetRef.current) return;
    setBusy(true);
    setError("");
    try {
      await downloadStatementPdf(sheetRef.current, student.fullName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ekstre PDF’i hazırlanırken bir sorun oluştu.");
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    { label: "Toplam tutar", value: data.total, className: "bg-brand-50 text-brand-700" },
    { label: "Ödenen tutar", value: data.paid, className: "bg-emerald-50 text-emerald-700" },
    {
      label: "Kalan bakiye",
      value: data.remaining,
      className: data.remaining > 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <ModalShell widthClass="max-w-4xl">
      <div className="space-y-5">
        <div className="pointer-events-none absolute -left-[9999px] top-0" aria-hidden>
          <div ref={sheetRef}>
            <StatementSheet data={data} />
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Veli / Öğrenci</p>
            <h2 className="text-lg font-bold text-slate-900">Ekstre / Hesap Özeti</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-secondary" disabled={busy} onClick={() => void handlePdf()}>
              <FileDown size={16} /> {busy ? "Hazırlanıyor…" : "PDF / Yazdır"}
            </button>
            {whatsappUrl ? (
              <a className="btn-primary" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} /> WhatsApp ile Gönder
              </a>
            ) : (
              <button type="button" className="btn-primary" disabled>
                <MessageCircle size={16} /> WhatsApp ile Gönder
              </button>
            )}
            <button type="button" className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" onClick={onClose} aria-label="Kapat">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Öğrenci</p>
            <p className="mt-1 font-semibold text-slate-900">{student.fullName}</p>
            <p className="mt-1 text-sm text-slate-500">{[student.classroom, student.course].filter(Boolean).join(" · ") || "—"}</p>
            <p className="mt-1 text-sm text-slate-500">Baba: {student.phone || "—"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">İletişim</p>
            <p className="mt-1 font-semibold text-slate-900">Anne: {student.parentPhone || "—"}</p>
            <p className="mt-1 text-sm text-slate-500">Kayıt: {student.joinedAt ? formatDate(student.joinedAt) : "—"}</p>
            <p className="mt-1 text-sm text-slate-500">{frozen ? "Dondurulmuş öğrenci" : "Aktif öğrenci"}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className={`rounded-2xl p-4 ${card.className}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{card.label}</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(card.value)}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Kalem</th>
                  <th className="px-4 py-3 font-medium">Vade</th>
                  <th className="px-4 py-3 font-medium">Ödeme tarihi</th>
                  <th className="px-4 py-3 font-medium">Yöntem</th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <td className="px-4 py-3">{formatDate(row.dueDate)}</td>
                    <td className="px-4 py-3">{row.paidAt ? formatDate(row.paidAt) : "—"}</td>
                    <td className="px-4 py-3">{row.methodLabel}</td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(row.amount)}</td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={row.status} paused={frozen} />
                    </td>
                  </tr>
                ))}
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                      Bu öğrenci için henüz ödeme veya taksit kaydı yok.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {whatsappUrl ? (
          <p className="text-xs text-slate-500">
            WhatsApp, {displayPhone} numarasına kalan bakiye ve ödeme özetini hazırlar.
          </p>
        ) : (
          <p className="text-xs text-amber-600">WhatsApp için anne veya baba telefonunu 05xx formatında ekleyin.</p>
        )}
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      </div>
    </ModalShell>
  );
}
