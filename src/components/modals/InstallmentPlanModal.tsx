import { useMemo, useState, type FormEvent } from "react";
import { addMonths, formatDate, formatMoney, splitEqual, todayISO } from "@/lib/format";
import type { PaymentPlanInput, Student } from "@/types";
import { ModalShell } from "@/components/modals/ModalShell";
import { FormField } from "@/components/modals/FormField";

type Props = {
  student: Student;
  onClose: () => void;
  onSubmit: (plan: PaymentPlanInput) => void;
};

export function InstallmentPlanModal({ student, onClose, onSubmit }: Props) {
  const [downPayment, setDownPayment] = useState("0");
  const [installmentCount, setInstallmentCount] = useState(String(student.installmentCount || 9));
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(
    student.firstInstallmentDate ?? todayISO(),
  );
  const [markDownPaymentPaid, setMarkDownPaymentPaid] = useState(false);

  const downPaymentValue = Number(downPayment || 0);
  const count = Math.max(Number(installmentCount || 0), 0);
  const remaining = Math.max(student.agreementTotal - downPaymentValue, 0);
  const parts = useMemo(() => splitEqual(remaining, count), [remaining, count]);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      downPayment: downPaymentValue,
      installmentCount: count,
      firstInstallmentDate,
      markDownPaymentPaid,
    });
    onClose();
  }

  return (
    <ModalShell widthClass="max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Taksit planı oluştur</h2>
          <p className="mt-1 text-sm text-slate-500">
            {student.fullName} için toplam {formatMoney(student.agreementTotal)} tutarındaki anlaşma
            eşit taksitlere bölünür. Peşinat yoksa tutar 0 kalır.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Peşinat tutarı (TL)">
            <input
              className="input"
              type="number"
              min={0}
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Taksit sayısı">
            <input
              className="input"
              type="number"
              min={1}
              value={installmentCount}
              onChange={(e) => setInstallmentCount(e.target.value)}
              required
            />
          </FormField>
          <FormField label="İlk taksit tarihi">
            <input
              className="input"
              type="date"
              value={firstInstallmentDate}
              onChange={(e) => setFirstInstallmentDate(e.target.value)}
              required
            />
          </FormField>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
              checked={markDownPaymentPaid}
              onChange={(e) => setMarkDownPaymentPaid(e.target.checked)}
            />
            Peşinat tahsil edildi
          </label>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Önizleme</p>
          <div className="max-h-48 space-y-1 overflow-y-auto pr-1 text-sm">
            {downPaymentValue > 0 ? (
              <div className="flex justify-between rounded-lg bg-white px-3 py-2">
                <span>Peşinat</span>
                <span className="font-semibold">{formatMoney(downPaymentValue)}</span>
              </div>
            ) : null}
            {parts.map((amount, idx) => (
              <div key={idx} className="flex justify-between rounded-lg bg-white px-3 py-2">
                <span>
                  {idx + 1}. Taksit · {formatDate(addMonths(firstInstallmentDate, idx))}
                </span>
                <span className="font-semibold">{formatMoney(amount)}</span>
              </div>
            ))}
            {parts.length === 0 && downPaymentValue <= 0 ? (
              <p className="px-1 py-2 text-slate-400">Tutar ve taksit sayısı girin.</p>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Bu işlem, öğrencinin mevcut ödeme kayıtlarının yerine geçen yeni bir plan oluşturur.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn-primary">
            Planı oluştur
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
