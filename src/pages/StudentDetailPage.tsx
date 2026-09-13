import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, FileText, ListChecks, PlusCircle, ScrollText, Trash2, Wallet } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatDate, formatMoney } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/constants";
import { getStudentFinance, getStudentPayments, isStudentFrozen, studentStatusLabel } from "@/lib/finance";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { StudentFormModal } from "@/components/modals/StudentFormModal";
import { PaymentFormModal } from "@/components/modals/PaymentFormModal";
import { InstallmentPlanModal } from "@/components/modals/InstallmentPlanModal";
import { Avatar } from "@/components/Avatar";
import { CollectPaymentSelect } from "@/components/CollectPaymentSelect";
import type { Payment, StudentDraft } from "@/types";
import { ModalShell } from "@/components/modals/ModalShell";
import { ReceiptActions } from "@/components/receipt/ReceiptActions";
import { StatementModal } from "@/components/modals/StatementModal";
import { buildReceiptData, countRemainingInstallments, type ReceiptData } from "@/lib/receipt";
import { saveReceiptToSupabase } from "@/lib/supabaseRepo";

function paymentLabel(p: Payment) {
  if (p.kind === "down_payment") return "Peşinat";
  if (p.kind === "installment") return `${p.installmentNo}. Taksit`;
  return p.note || "Ödeme";
}

export function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const {
    data,
    loading,
    updateStudent,
    deleteStudent,
    markPaymentPaid,
    deletePaymentCollection,
    deletePayment,
    generateInstallmentPlan,
    addPayment,
  } = useAppData();
  const [editOpen, setEditOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [statementOpen, setStatementOpen] = useState(false);

  const student = data.students.find((s) => s.id === studentId);
  if (loading) return null;
  if (!student) return <Navigate to="/ogrenciler" replace />;

  const finance = getStudentFinance(student, data.payments);
  const allRows = getStudentPayments(data.payments, student.id);
  const rows = allRows.filter((p) => p.kind !== "other");
  const extraPayments = allRows.filter((p) => p.kind === "other");
  const frozen = isStudentFrozen(student);

  function handleEdit(draft: StudentDraft, id?: string) {
    if (id) updateStudent({ ...draft, id });
  }

  function handleDeleteCollection(p: Payment) {
    const confirmed = window.confirm(
      `${paymentLabel(p)} için alınan ${formatMoney(p.amount)} tutarındaki tahsilat silinecek. Emin misiniz?`,
    );
    if (confirmed) deletePaymentCollection(p.id);
  }

  function handleDeleteExtraPayment(p: Payment) {
    const confirmed = window.confirm(
      `${p.note || "Ödeme"} kaydı (${formatMoney(p.amount)}) silinecek. Emin misiniz?`,
    );
    if (confirmed) deletePayment(p.id);
  }

  const summaryCards = [
    { label: "Toplam anlaşma tutarı", value: finance.total, icon: Wallet, tone: "text-brand-600 bg-brand-50" },
    { label: "Ödenen", value: finance.paid, icon: ListChecks, tone: "text-emerald-600 bg-emerald-50" },
    {
      label: "Kalan borç",
      value: finance.remaining,
      icon: CalendarClock,
      tone: finance.remaining > 0 ? "text-red-600 bg-red-50" : "text-slate-600 bg-slate-100",
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/ogrenciler"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Öğrencilere dön
      </Link>

      <div className="card flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={student.fullName} photoUrl={student.photoUrl} size={64} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{student.fullName}</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  frozen ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {studentStatusLabel(student)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {[student.classroom, student.course].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Veli: {student.parentName || "—"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Anne: {student.parentPhone || "—"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Baba: {student.phone || "—"}
            </p>
            <p className="mt-1 text-xs text-slate-400">Kayıt tarihi: {formatDate(student.joinedAt)}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => setStatementOpen(true)}>
            <ScrollText size={16} /> Ekstre / Hesap Özeti
          </button>
          <button type="button" className="btn-secondary" onClick={() => setEditOpen(true)}>
            Düzenle
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => updateStudent({ ...student, status: frozen ? "active" : "frozen" })}
          >
            {frozen ? "Çöz" : "Dondur"}
          </button>
          <button
            type="button"
            className="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              const confirmed = window.confirm(
                `${student.fullName} silinecek. Tüm taksit ve ödeme kayıtları da silinecek. Emin misiniz?`,
              );
              if (!confirmed) return;
              deleteStudent(student.id);
              navigate("/ogrenciler", { replace: true });
            }}
          >
            <Trash2 size={16} /> Öğrenciyi sil
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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

      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Taksit durumu</h3>
            <p className="text-sm text-slate-500">
              {frozen
                ? "Öğrenci dondurulduğu için taksitler durduruldu ve gecikmede görünmez."
                : finance.installmentCount > 0
                  ? `${finance.installmentCount} taksit · ${finance.overdueCount} gecikmiş`
                  : "Henüz taksit planı oluşturulmadı."}
            </p>
          </div>
          {frozen ? null : (
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => setPaymentOpen(true)}>
                <PlusCircle size={16} /> Ödeme ekle
              </button>
              <button type="button" className="btn-primary" onClick={() => setPlanOpen(true)}>
                Taksit planı oluştur
              </button>
            </div>
          )}
        </div>

        {rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Taksit</th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium">Vade</th>
                  <th className="px-4 py-3 font-medium">Ödeme tarihi</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{paymentLabel(p)}</td>
                    <td className="px-4 py-3">{formatMoney(p.amount)}</td>
                    <td className="px-4 py-3">{formatDate(p.dueDate)}</td>
                    <td className="px-4 py-3">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={p.status} paused={frozen} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status !== "paid" && !frozen ? (
                        <CollectPaymentSelect onCollect={(method) => markPaymentPaid(p.id, method)} />
                      ) : p.status !== "paid" && frozen ? (
                        <span className="text-xs text-sky-600">Donduruldu</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-slate-400">{paymentMethodLabel(p.method)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = buildReceiptData({
                                student,
                                payments: data.payments,
                                paidThis: p.amount,
                                date: p.paidAt ?? undefined,
                                method: p.method,
                                description: paymentLabel(p),
                                remainingInstallments: countRemainingInstallments(data.payments, student.id),
                              });
                              setReceipt(next);
                              void saveReceiptToSupabase(next, student.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                          >
                            <FileText size={13} /> Makbuz
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCollection(p)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={13} /> Tahsilatı sil
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
            Bu öğrenci için henüz bir taksit planı oluşturulmadı. "Taksit planı oluştur" butonuyla peşinat ve
            taksit bilgilerini girerek otomatik ödeme takvimi oluşturabilirsiniz.
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Ödeme menüsünden eklenen tutarlar</h3>
            <p className="text-sm text-slate-500">
              Ödeme ekle ile girilen kayıtlar burada listelenir. İstemediğiniz tutarı silebilirsiniz.
            </p>
          </div>
          {frozen ? null : (
            <button type="button" className="btn-secondary" onClick={() => setPaymentOpen(true)}>
              <PlusCircle size={16} /> Ödeme ekle
            </button>
          )}
        </div>

        {extraPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Açıklama</th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">Yöntem</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {extraPayments.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{p.note || "Ödeme"}</td>
                    <td className="px-4 py-3">{formatMoney(p.amount)}</td>
                    <td className="px-4 py-3">{formatDate(p.paidAt || p.dueDate)}</td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={p.status} paused={frozen} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{paymentMethodLabel(p.method)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== "paid" && !frozen ? (
                          <CollectPaymentSelect onCollect={(method) => markPaymentPaid(p.id, method)} />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDeleteExtraPayment(p)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={13} /> Ödemeyi sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
            Ödeme menüsünden eklenmiş bir tutar yok.
          </div>
        )}
      </div>

      {editOpen ? (
        <StudentFormModal initial={student} onClose={() => setEditOpen(false)} onSubmit={handleEdit} />
      ) : null}
      {planOpen ? (
        <InstallmentPlanModal
          student={student}
          onClose={() => setPlanOpen(false)}
          onSubmit={(plan) => generateInstallmentPlan(student.id, plan)}
        />
      ) : null}
      {paymentOpen ? (
        <PaymentFormModal
          students={[student]}
          defaultStudentId={student.id}
          lockStudent
          onClose={() => setPaymentOpen(false)}
          onSubmit={(payload) => addPayment(payload)}
        />
      ) : null}
      {receipt ? (
        <ModalShell widthClass="max-w-md">
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Tahsilat makbuzu</h2>
            <ReceiptActions data={receipt} />
            <div className="flex justify-end">
              <button type="button" className="btn-secondary" onClick={() => setReceipt(null)}>
                Kapat
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
      {statementOpen ? (
        <StatementModal
          student={student}
          payments={data.payments}
          academyName={data.settings.academyName}
          onClose={() => setStatementOpen(false)}
        />
      ) : null}
    </div>
  );
}
