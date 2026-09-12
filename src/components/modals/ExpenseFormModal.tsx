import { useState, type FormEvent } from "react";
import type { Expense, PaymentMethod } from "@/types";
import { todayISO } from "@/lib/format";
import { EXPENSE_CATEGORIES, PAYMENT_METHOD_OPTIONS } from "@/lib/constants";
import { ModalShell } from "@/components/modals/ModalShell";
import { FormField } from "@/components/modals/FormField";

type Props = {
  initial?: Expense;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, "id">, id?: string) => void;
};

export function ExpenseFormModal({ initial, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [note, setNote] = useState(initial?.note ?? "");
  const [method, setMethod] = useState<PaymentMethod>(initial?.method ?? "nakit");

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ title, category, amount: Number(amount), date, note, method }, initial?.id);
    onClose();
  }

  return (
    <ModalShell>
      <form onSubmit={submit} className="space-y-3">
        <h2 className="text-lg font-bold">{initial ? "Gideri düzenle" : "Yeni gider"}</h2>
        <FormField label="Başlık">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Kategori">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Tutar (TL)">
            <input
              className="input"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Tarih">
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </FormField>
          <FormField label="Ödeme yöntemi">
            <select
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHOD_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Açıklama">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsiyonel" />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn-primary">
            Kaydet
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
