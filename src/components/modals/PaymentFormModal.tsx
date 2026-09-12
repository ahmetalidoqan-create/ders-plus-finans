import { useState, type FormEvent } from "react";
import type { Payment, PaymentMethod, Student } from "@/types";
import { todayISO } from "@/lib/format";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/constants";
import { ModalShell } from "@/components/modals/ModalShell";
import { FormField } from "@/components/modals/FormField";

type Props = {
  students: Student[];
  defaultStudentId?: string;
  lockStudent?: boolean;
  onClose: () => void;
  onSubmit: (payment: Omit<Payment, "id" | "status">) => void;
};

export function PaymentFormModal({ students, defaultStudentId, lockStudent, onClose, onSubmit }: Props) {
  const [studentId, setStudentId] = useState(defaultStudentId ?? students[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      studentId,
      amount: Number(amount),
      dueDate,
      paidAt: null,
      method: method || null,
      note: note || "Ödeme",
      kind: "other",
      installmentNo: null,
    });
    onClose();
  }

  return (
    <ModalShell>
      <form onSubmit={submit} className="space-y-3">
        <h2 className="text-lg font-bold">Yeni ödeme kaydı</h2>
        <FormField label="Öğrenci">
          <select
            className="input"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={lockStudent}
            required
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
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
          <FormField label="Vade tarihi">
            <input
              className="input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </FormField>
        </div>
        <FormField label="Not">
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Örn. Ekstra ders ücreti"
          />
        </FormField>
        <FormField label="Ödeme yöntemi (opsiyonel)">
          <select
            className="input"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod | "")}
          >
            <option value="">Seçilmedi</option>
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
            Kaydet
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
