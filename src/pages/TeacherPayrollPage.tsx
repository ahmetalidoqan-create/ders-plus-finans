import { useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Check, Trash2 } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { withFixedTeachers, PAYROLL_METHOD_OPTIONS, TEACHER_PAY_TYPE_OPTIONS } from "@/lib/constants";
import { buildTeacherAccrualNote, computeTeacherAccrual } from "@/lib/finance";
import { formatMoney, formatMonthLong, monthCalendarDays, monthKey, todayISO } from "@/lib/format";
import { ModalShell } from "@/components/modals/ModalShell";
import { FormField } from "@/components/modals/FormField";
import type { PaymentMethod, Teacher, TeacherPayType } from "@/types";

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function TeacherPayrollPage() {
  const { data, updateTeacher, upsertTeacherLesson, deleteTeacherLesson, addTeacherPayroll } = useAppData();
  const teachers = useMemo(() => withFixedTeachers(data.teachers), [data.teachers]);
  const [teacherId, setTeacherId] = useState(teachers[0].id);
  const [month, setMonth] = useState(monthKey(todayISO()));
  const [method, setMethod] = useState<Extract<PaymentMethod, "nakit" | "havale">>("havale");
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [hoursInput, setHoursInput] = useState("2");
  const [saved, setSaved] = useState(false);

  const teacher = teachers.find((t) => t.id === teacherId) ?? teachers[0];
  const days = useMemo(() => monthCalendarDays(month), [month]);
  const monthLessons = data.teacherLessons.filter(
    (lesson) => lesson.teacherId === teacher.id && monthKey(lesson.date) === month,
  );
  const hoursByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthLessons.forEach((lesson) => map.set(lesson.date, (map.get(lesson.date) ?? 0) + lesson.hours));
    return map;
  }, [monthLessons]);
  const totalHours = monthLessons.reduce((sum, lesson) => sum + lesson.hours, 0);
  const total = computeTeacherAccrual(teacher.payType, teacher.monthlySalary, teacher.hourlyRate, totalHours);
  const note = buildTeacherAccrualNote(
    teacher.fullName,
    month,
    teacher.payType,
    teacher.monthlySalary,
    teacher.hourlyRate,
    totalHours,
  );
  const alreadyPosted = data.expenses.some(
    (expense) => expense.title === `${teacher.fullName} - Öğretmen Hakedişi` && monthKey(expense.date) === month,
  );
  const canPost = total > 0 && (teacher.payType === "fixed" || totalHours > 0);

  function patchTeacher(partial: Partial<Teacher>) {
    updateTeacher({ ...teacher, ...partial });
  }

  function openDay(date: string) {
    setEditingDate(date);
    setHoursInput(String(hoursByDate.get(date) || 2));
  }

  function saveDay(e: FormEvent) {
    e.preventDefault();
    if (!editingDate) return;
    const hours = Number(hoursInput);
    if (hours <= 0) {
      const existing = monthLessons.find((lesson) => lesson.date === editingDate);
      if (existing) deleteTeacherLesson(existing.id);
    } else {
      upsertTeacherLesson({ teacherId: teacher.id, date: editingDate, hours, note: "" });
    }
    setEditingDate(null);
  }

  function clearDay() {
    if (!editingDate) return;
    const existing = monthLessons.find((lesson) => lesson.date === editingDate);
    if (existing) deleteTeacherLesson(existing.id);
    setEditingDate(null);
  }

  function postExpense() {
    if (!canPost) return;
    const expenseDate = month === monthKey(todayISO()) ? todayISO() : `${month}-01`;
    addTeacherPayroll(
      teacher,
      {
        title: `${teacher.fullName} - Öğretmen Hakedişi`,
        category: "Personel/Maaş",
        amount: total,
        date: expenseDate,
        note,
        method,
      },
    );
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="card overflow-hidden p-2">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Öğretmenler</p>
        <div className="space-y-1">
          {teachers.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTeacherId(item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                item.id === teacher.id ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.fullName}
              {data.teacherLessons.some((lesson) => lesson.teacherId === item.id && monthKey(lesson.date) === month) ? (
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              ) : null}
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-4">
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-lg font-bold">{teacher.fullName}</h2>
            <p className="text-sm text-slate-500">{formatMonthLong(month)} ders takvimi</p>
          </div>
          <input
            className="input w-auto min-w-[160px] py-2"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Hakediş ayı"
          />
        </div>

        <div className="card space-y-4 p-5">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Öğretmen tipi</p>
            <div className="grid grid-cols-2 gap-2">
              {TEACHER_PAY_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patchTeacher({ payType: opt.value as TeacherPayType })}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    teacher.payType === opt.value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {teacher.payType === "hourly" ? (
            <FormField label="Saatlik ücret (TL)">
              <input
                className="input"
                type="number"
                min={0}
                step="0.01"
                value={teacher.hourlyRate || ""}
                onChange={(e) => patchTeacher({ hourlyRate: Number(e.target.value) || 0 })}
              />
            </FormField>
          ) : (
            <FormField label="Aylık sabit ücret (TL)">
              <input
                className="input"
                type="number"
                min={0}
                step="0.01"
                value={teacher.monthlySalary || ""}
                onChange={(e) => patchTeacher({ monthlySalary: Number(e.target.value) || 0 })}
              />
            </FormField>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
            <CalendarDays size={16} /> Girdiği günleri işaretle
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;
              const hours = hoursByDate.get(date) ?? 0;
              const isToday = date === todayISO();
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => openDay(date)}
                  className={`min-h-[68px] rounded-xl border px-1.5 py-1.5 text-left transition ${
                    hours > 0
                      ? "border-brand-300 bg-brand-50"
                      : "border-slate-100 bg-white hover:bg-slate-50"
                  } ${isToday ? "ring-1 ring-brand-400" : ""}`}
                >
                  <p className="text-xs font-semibold text-slate-700">{Number(date.slice(8))}</p>
                  {hours > 0 ? <p className="mt-1 text-[11px] font-semibold text-brand-700">{hours} sa</p> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hakediş özeti</p>
            <p className="mt-1 text-2xl font-bold">{formatMoney(total)}</p>
            <p className="mt-1 text-sm text-slate-600">{note}</p>
            <p className="mt-1 text-xs text-slate-400">{monthLessons.length} gün · {totalHours} saat</p>
          </div>
          <FormField label="Ödeme yöntemi">
            <select
              className="input"
              value={method}
              onChange={(e) => setMethod(e.target.value as "nakit" | "havale")}
            >
              {PAYROLL_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
          <button type="button" className="btn-primary w-full justify-center" disabled={!canPost} onClick={postExpense}>
            <Check size={16} /> {alreadyPosted ? "Gideri güncelle" : "Onayla ve gidere ekle"}
          </button>
          {saved ? <p className="text-sm font-medium text-emerald-600">Hakediş Giderler’e işlendi.</p> : null}
        </div>
      </section>

      {editingDate ? (
        <ModalShell widthClass="max-w-sm">
          <form onSubmit={saveDay} className="space-y-3">
            <h2 className="text-lg font-bold">
              {Number(editingDate.slice(8))} {formatMonthLong(month)}
            </h2>
            <p className="text-sm text-slate-500">{teacher.fullName} bu gün kaç saat derse girdi?</p>
            <FormField label="Ders saati">
              <input
                className="input"
                type="number"
                min={0}
                step="0.5"
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                autoFocus
                required
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-1">
              {hoursByDate.get(editingDate) ? (
                <button type="button" className="btn-secondary text-red-600" onClick={clearDay}>
                  <Trash2 size={14} /> Sil
                </button>
              ) : null}
              <button type="button" className="btn-secondary" onClick={() => setEditingDate(null)}>
                Vazgeç
              </button>
              <button type="submit" className="btn-primary">
                Kaydet
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}
