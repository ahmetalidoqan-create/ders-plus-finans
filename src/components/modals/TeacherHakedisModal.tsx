import { useMemo, useState, type FormEvent } from "react";
import type { PaymentMethod, Teacher, TeacherPayType } from "@/types";
import { formatMoney, monthKey, todayISO } from "@/lib/format";
import { PAYROLL_METHOD_OPTIONS, TEACHER_PAY_TYPE_OPTIONS, withFixedTeachers } from "@/lib/constants";
import { buildTeacherAccrualNote, computeTeacherAccrual } from "@/lib/finance";
import { ModalShell } from "@/components/modals/ModalShell";
import { FormField } from "@/components/modals/FormField";
import { useAppData } from "@/context/AppDataContext";

type Props = {
  onClose: () => void;
};

export function TeacherHakedisModal({ onClose }: Props) {
  const { data, addTeacherPayroll } = useAppData();
  const teachers = useMemo(() => withFixedTeachers(data.teachers), [data.teachers]);
  const [teacherId, setTeacherId] = useState(teachers[0].id);
  const selected = teachers.find((t) => t.id === teacherId) ?? teachers[0];

  const [payType, setPayType] = useState<TeacherPayType>(selected.payType);
  const [monthlySalary, setMonthlySalary] = useState(selected.monthlySalary ? String(selected.monthlySalary) : "");
  const [hourlyRate, setHourlyRate] = useState(selected.hourlyRate ? String(selected.hourlyRate) : "");
  const [hours, setHours] = useState("");
  const [month, setMonth] = useState(monthKey(todayISO()));
  const [method, setMethod] = useState<Extract<PaymentMethod, "nakit" | "havale">>("havale");

  function applyTeacher(nextId: string) {
    const teacher = teachers.find((t) => t.id === nextId);
    if (!teacher) return;
    setTeacherId(teacher.id);
    setPayType(teacher.payType);
    setMonthlySalary(teacher.monthlySalary ? String(teacher.monthlySalary) : "");
    setHourlyRate(teacher.hourlyRate ? String(teacher.hourlyRate) : "");
    setHours("");
  }

  const salary = Number(monthlySalary) || 0;
  const rate = Number(hourlyRate) || 0;
  const hourCount = Number(hours) || 0;
  const total = computeTeacherAccrual(payType, salary, rate, hourCount);
  const fullName = selected.fullName;
  const note = buildTeacherAccrualNote(fullName, month, payType, salary, rate, hourCount);

  const canSubmit = total > 0 && (payType === "fixed" || hourCount > 0);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    addTeacherPayroll(
      {
        id: selected.id,
        fullName,
        payType,
        monthlySalary: salary,
        hourlyRate: rate,
      },
      {
        title: `${fullName} - Öğretmen Hakedişi`,
        category: "Personel/Maaş",
        amount: total,
        date: todayISO(),
        note,
        method,
      },
    );
    onClose();
  }

  return (
    <ModalShell widthClass="max-w-xl">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">Öğretmen Hakediş Hesapla</h2>
          <p className="mt-1 text-sm text-slate-500">
            Onaylanan tutar Personel/Maaş kategorisinde gider olarak işlenir.
          </p>
        </div>

        <FormField label="Öğretmen">
          <select className="input" value={teacherId} onChange={(e) => applyTeacher(e.target.value)}>
            {teachers.map((teacher: Teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName}
              </option>
            ))}
          </select>
        </FormField>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Öğretmen tipi</p>
          <div className="grid grid-cols-2 gap-2">
            {TEACHER_PAY_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPayType(opt.value)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  payType === opt.value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {payType === "fixed" ? (
            <FormField label="Aylık sabit ücret (TL)">
              <input
                className="input"
                type="number"
                min={0}
                step="0.01"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                required
              />
            </FormField>
          ) : (
            <>
              <FormField label="Saatlik ücret (TL)">
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Girdiği ders saati">
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                />
              </FormField>
            </>
          )}
          <FormField label="Dönem">
            <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
          </FormField>
          <FormField label="Ödeme yöntemi">
            <select
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value as "nakit" | "havale")}
            >
              {PAYROLL_METHOD_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hakediş özeti</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{formatMoney(total)}</p>
          <p className="mt-1 text-sm text-slate-600">{note || "Ad soyad ve tutar girildiğinde açıklama oluşur."}</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            Onayla ve gidere ekle
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
