import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FileText, Filter, Plus, Search } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatMoney } from "@/lib/format";
import { getStudentFinance, isStudentFrozen, studentHasDebt, studentIsOverdue, studentStatusLabel } from "@/lib/finance";
import { StudentFormModal } from "@/components/modals/StudentFormModal";
import { StatementModal } from "@/components/modals/StatementModal";
import { Avatar } from "@/components/Avatar";
import type { Student, StudentDraft } from "@/types";

export function StudentsPage() {
  const { data, addStudent, updateStudent, deleteStudent } = useAppData();
  const [query, setQuery] = useState("");
  const [classroomFilter, setClassroomFilter] = useState("all");
  const [debtOnly, setDebtOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [statementStudent, setStatementStudent] = useState<Student | null>(null);

  const classrooms = useMemo(
    () => Array.from(new Set(data.students.map((s) => s.classroom))).sort(),
    [data.students],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.students
      .map((s) => ({ student: s, finance: getStudentFinance(s, data.payments) }))
      .filter(({ student, finance }) => {
        const matchesQuery =
          !q ||
          student.fullName.toLowerCase().includes(q) ||
          student.parentName.toLowerCase().includes(q) ||
          student.phone.toLowerCase().includes(q) ||
          student.parentPhone.toLowerCase().includes(q) ||
          student.email.toLowerCase().includes(q) ||
          student.course.toLowerCase().includes(q);
        const matchesClassroom = classroomFilter === "all" || student.classroom === classroomFilter;
        const matchesDebt = !debtOnly || studentHasDebt(finance);
        const matchesOverdue = !overdueOnly || studentIsOverdue(finance);
        return matchesQuery && matchesClassroom && matchesDebt && matchesOverdue;
      });
  }, [data.students, data.payments, query, classroomFilter, debtOnly, overdueOnly]);

  function handleSubmit(draft: StudentDraft, id?: string) {
    if (id) updateStudent({ ...draft, id });
    else addStudent(draft);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="İsim, veli adı veya telefon ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="button" className="btn-primary shrink-0" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Öğrenci ekle
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Filter size={13} /> Filtrele
        </span>
        <select
          className="input w-auto min-w-[140px] py-2 text-sm"
          value={classroomFilter}
          onChange={(e) => setClassroomFilter(e.target.value)}
        >
          <option value="all">Tüm sınıflar</option>
          {classrooms.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setDebtOnly((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            debtOnly
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Borcu Olanlar
        </button>
        <button
          type="button"
          onClick={() => setOverdueOnly((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            overdueOnly
              ? "border-red-400 bg-red-50 text-red-700"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Gecikmede Olanlar
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Öğrenci</th>
                <th className="px-4 py-3 font-medium">Sınıf</th>
                <th className="px-4 py-3 font-medium">Telefonlar</th>
                <th className="px-4 py-3 font-medium">Anlaşma tutarı</th>
                <th className="px-4 py-3 font-medium">Kalan borç</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ student: s, finance }) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.fullName} photoUrl={s.photoUrl} size={36} />
                      <div>
                        <Link
                          to={`/ogrenciler/${s.id}`}
                          className="font-medium text-slate-900 hover:text-brand-600"
                        >
                          {s.fullName}
                        </Link>
                        {s.parentName ? <p className="text-xs text-slate-500">Veli: {s.parentName}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{s.classroom}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {s.parentPhone || s.phone ? (
                      <div className="space-y-0.5">
                        {s.parentPhone ? <p>Anne: {s.parentPhone}</p> : null}
                        {s.phone ? <p>Baba: {s.phone}</p> : null}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatMoney(finance.total)}</td>
                  <td className="px-4 py-3">
                    {finance.remaining > 0 ? (
                      <span className="font-semibold text-red-600">{formatMoney(finance.remaining)}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isStudentFrozen(s) ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {studentStatusLabel(s)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                        onClick={() => setStatementStudent(s)}
                      >
                        <FileText size={14} /> Ekstre
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                        onClick={() => setEditStudent(s)}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-brand-600"
                        onClick={() =>
                          updateStudent({ ...s, status: isStudentFrozen(s) ? "active" : "frozen" })
                        }
                      >
                        {isStudentFrozen(s) ? "Çöz" : "Dondur"}
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                        onClick={() => {
                          const confirmed = window.confirm(
                            `${s.fullName} silinecek. Tüm taksit ve ödeme kayıtları da silinecek. Emin misiniz?`,
                          );
                          if (confirmed) deleteStudent(s.id);
                        }}
                      >
                        Sil
                      </button>
                      <Link to={`/ogrenciler/${s.id}`} className="text-slate-400 hover:text-brand-600">
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Filtrelerle eşleşen öğrenci bulunamadı.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen ? (
        <StudentFormModal onClose={() => setAddOpen(false)} onSubmit={(draft) => handleSubmit(draft)} />
      ) : null}
      {editStudent ? (
        <StudentFormModal
          initial={editStudent}
          onClose={() => setEditStudent(null)}
          onSubmit={(draft, id) => handleSubmit(draft, id)}
        />
      ) : null}
      {statementStudent ? (
        <StatementModal
          student={statementStudent}
          payments={data.payments}
          academyName={data.settings.academyName}
          onClose={() => setStatementStudent(null)}
        />
      ) : null}
    </div>
  );
}
