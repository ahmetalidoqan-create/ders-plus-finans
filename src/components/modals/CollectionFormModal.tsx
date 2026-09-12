import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, ChevronLeft, Search } from "lucide-react";
import type { CollectionInput } from "@/lib/finance";
import { getStudentFinance, getStudentPayments } from "@/lib/finance";
import type { Payment, PaymentMethod, Student } from "@/types";
import { formatDate, formatMoney, todayISO, uid } from "@/lib/format";
import { PAYMENT_METHOD_OPTIONS, paymentMethodLabel } from "@/lib/constants";
import { ModalShell } from "@/components/modals/ModalShell";
import { FormField } from "@/components/modals/FormField";
import { Avatar } from "@/components/Avatar";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { ReceiptActions } from "@/components/receipt/ReceiptActions";
import type { ReceiptData } from "@/lib/receipt";

type Props = {
  students: Student[];
  payments: Payment[];
  onClose: () => void;
  onCollect: (input: CollectionInput) => void;
  onCollectInstallment: (paymentId: string, input: { date: string; method: PaymentMethod; note?: string }) => void;
};

function paymentLabel(p: Payment) {
  if (p.kind === "down_payment") return "Peşinat";
  if (p.kind === "installment") return `${p.installmentNo}. Taksit`;
  return p.note || "Ödeme";
}

export function CollectionFormModal({ students, payments, onClose, onCollect, onCollectInstallment }: Props) {
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [freeform, setFreeform] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState<PaymentMethod>("nakit");
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState<ReceiptData | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? students.filter((s) => s.fullName.toLowerCase().includes(q)) : students;
    return list.slice().sort((a, b) => a.fullName.localeCompare(b.fullName, "tr"));
  }, [students, query]);

  const selectedStudent = students.find((s) => s.id === studentId) ?? null;

  const studentRows = useMemo(
    () => (selectedStudent ? getStudentPayments(payments, selectedStudent.id) : []),
    [payments, selectedStudent],
  );
  const unpaidRows = studentRows.filter((p) => p.status !== "paid");
  const selectedPayment = studentRows.find((p) => p.id === paymentId) ?? null;
  const finance = useMemo(
    () => (selectedStudent ? getStudentFinance(selectedStudent, payments) : null),
    [selectedStudent, payments],
  );

  useEffect(() => {
    setPaymentId(null);
    setFreeform(false);
    setAmount("");
    setNote("");
    setDate(todayISO());
    setMethod("nakit");
  }, [selectedStudent?.id]);

  useEffect(() => {
    if (!selectedPayment) return;
    setAmount(String(selectedPayment.amount));
    setNote(paymentLabel(selectedPayment));
  }, [selectedPayment]);

  function selectPayment(p: Payment) {
    setPaymentId(p.id);
    setFreeform(false);
  }

  function startFreeform() {
    setPaymentId(null);
    setFreeform(true);
    setAmount("");
    setNote("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return;
    const numericAmount = Number(amount);
    if (selectedPayment) {
      onCollectInstallment(selectedPayment.id, { date, method, note });
    } else {
      onCollect({ studentId: selectedStudent.id, amount: numericAmount, date, method, note });
    }
    const paidTotal = (finance?.paid ?? 0) + numericAmount;
    const remainingInstallments = unpaidRows.filter(
      (p) => p.kind === "installment" && p.id !== selectedPayment?.id,
    ).length;
    setSuccess({
      receiptNo: `DP-${todayISO().replaceAll("-", "")}-${uid("mk").slice(-4).toUpperCase()}`,
      date,
      studentName: selectedStudent.fullName,
      classroom: selectedStudent.classroom,
      phone: selectedStudent.phone,
      parentPhone: selectedStudent.parentPhone,
      description: note.trim() || (selectedPayment ? paymentLabel(selectedPayment) : "Tahsilat"),
      methodLabel: paymentMethodLabel(method),
      agreementTotal: finance?.total ?? 0,
      paidThis: numericAmount,
      paidTotal,
      remaining: Math.max((finance?.total ?? 0) - paidTotal, 0),
      remainingInstallments,
    });
  }

  if (success) {
    return (
      <ModalShell widthClass="max-w-md">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={28} className="mt-0.5 shrink-0 text-emerald-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tahsilat başarıyla kaydedildi</h2>
              <p className="text-sm text-slate-500">
                {success.studentName} · {formatMoney(success.paidThis)}
              </p>
            </div>
          </div>
          <ReceiptActions data={success} />
          <div className="flex justify-end">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Kapat
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell widthClass="max-w-lg">
      {!selectedStudent ? (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Tahsilat Ekle</h2>
          <p className="text-sm text-slate-500">Tahsilatı kaydetmek istediğiniz öğrenciyi seçin.</p>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              className="input pl-9"
              placeholder="İsim ile ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100">
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStudentId(s.id)}
                className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-slate-50"
              >
                <Avatar name={s.fullName} photoUrl={s.photoUrl} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{s.fullName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {s.classroom} · {s.phone}
                  </p>
                </div>
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">Öğrenci bulunamadı.</p>
            ) : null}
          </div>
          <div className="flex justify-end pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <button
            type="button"
            onClick={() => setStudentId(null)}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ChevronLeft size={15} /> Öğrenci değiştir
          </button>
          <h2 className="text-lg font-bold">Tahsilat Ekle</h2>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <Avatar name={selectedStudent.fullName} photoUrl={selectedStudent.photoUrl} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{selectedStudent.fullName}</p>
              <p className="truncate text-xs text-slate-500">
                {[selectedStudent.classroom, selectedStudent.course].filter(Boolean).join(" · ")}
              </p>
            </div>
            {finance ? (
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-500">Kalan borç</p>
                <p className={`text-sm font-bold ${finance.remaining > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatMoney(finance.remaining)}
                </p>
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Taksit listesi — tahsil edeceğiniz taksiti seçin
            </p>
            <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-100">
              {studentRows.map((p) => {
                const isPaid = p.status === "paid";
                const isSelected = paymentId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isPaid}
                    onClick={() => selectPayment(p)}
                    className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left text-sm last:border-b-0 transition ${
                      isPaid
                        ? "cursor-not-allowed bg-slate-50/60 opacity-60"
                        : isSelected
                          ? "bg-brand-50 ring-1 ring-inset ring-brand-300"
                          : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{paymentLabel(p)}</p>
                      <p className="text-xs text-slate-500">Vade: {formatDate(p.dueDate)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-semibold text-slate-700">{formatMoney(p.amount)}</span>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                  </button>
                );
              })}
              {studentRows.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-500">Bu öğrenciye ait taksit bulunamadı.</p>
              ) : null}
            </div>
            {unpaidRows.length === 0 && studentRows.length > 0 ? (
              <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                Tüm taksitler ödenmiş. Serbest/ek bir tahsilat girmek için aşağıdaki alanı kullanın.
              </p>
            ) : null}
            {!paymentId ? (
              <button
                type="button"
                onClick={startFreeform}
                className={`mt-2 text-xs font-semibold ${freeform ? "text-brand-700" : "text-slate-500 hover:text-brand-700"}`}
              >
                {freeform ? "✓ Serbest tutar giriliyor" : "Serbest tutar gir (taksitle eşleştirme)"}
              </button>
            ) : null}
          </div>

          {paymentId || freeform ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Tutar (TL)">
                  <input
                    autoFocus={freeform}
                    className="input disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                    type="number"
                    min={0}
                    value={amount}
                    disabled={!!paymentId}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Tarih">
                  <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </FormField>
              </div>

              <FormField label="Ödeme yöntemi">
                <select className="input" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                  {PAYMENT_METHOD_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Not (opsiyonel)">
                <input
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Örn. Eylül ayı aidatı"
                />
              </FormField>
            </>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Vazgeç
            </button>
            <button type="submit" className="btn-blue" disabled={!paymentId && !freeform}>
              Tahsilatı Kaydet
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
