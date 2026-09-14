import { useState, type FormEvent } from "react";
import type { Payment, PaymentMethod } from "@/types";
import { formatMoney, todayISO } from "@/lib/format";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/constants";
import { ModalShell } from "@/components/modals/ModalShell";
import { FormField } from "@/components/modals/FormField";

type Props = {
  payment: Payment;
  title: string;
  mode?: "create" | "edit";
  onClose: () => void;
  onSubmit: (input: { date: string; amount: number; method: PaymentMethod }) => void;
};

export function CollectInstallmentModal({ payment, title, mode = "create", onClose, onSubmit }: Props) {
  const [date, setDate] = useState(mode === "edit" && payment.paidAt ? payment.paidAt : todayISO());
  const [amount, setAmount] = useState(String(payment.amount));
  const [method, setMethod] = useState<PaymentMethod>(payment.method ?? "nakit");

  function submit(e: FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!(numericAmount > 0)) return;
    onSubmit({ date, amount: numericAmount, method });
    onClose();
  }

  return (
    <ModalShell widthClass="max-w-md">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">{mode === "edit" ? "Tahsilatı düzenle" : "Tahsilat kaydet"}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {title} · Taksit tutarı {formatMoney(payment.amount)}. Tutarı gerekirse değiştirebilirsiniz.
            {mode === "create"
              ? " Fazla ödeme sonraki taksitten düşülür; tarih hangi aydaysa gerçekleşen tahsilat o aya yazılır."
              : " Tarih, tutar ve ödeme yöntemini güncelleyebilirsiniz."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Tahsilat tarihi">
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </FormField>
          <FormField label="Tahsil edilen tutar (TL)">
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
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
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn-primary">
            {mode === "edit" ? "Kaydet" : "Tahsilatı kaydet"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
