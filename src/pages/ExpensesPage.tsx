import { useMemo, useState } from "react";
import { Calculator, Filter, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { formatDate, formatMoney, formatMonthLong, monthKey, todayISO } from "@/lib/format";
import { EXPENSE_CATEGORIES, categoryBadgeClass, paymentMethodLabel } from "@/lib/constants";
import { ExpenseFormModal } from "@/components/modals/ExpenseFormModal";
import { TeacherHakedisModal } from "@/components/modals/TeacherHakedisModal";
import type { Expense } from "@/types";

type RangeFilter = "all" | "month";

export function ExpensesPage() {
  const { data, addExpense, updateExpense, deleteExpense } = useAppData();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("month");
  const [month, setMonth] = useState(monthKey(todayISO()));
  const [addOpen, setAddOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const periodLabel = rangeFilter === "all" ? "Tüm zamanlar" : formatMonthLong(month);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.expenses
      .filter((e) => {
        const matchesQuery =
          !q || e.title.toLowerCase().includes(q) || e.note.toLowerCase().includes(q);
        const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
        const matchesRange = rangeFilter === "all" || monthKey(e.date) === month;
        return matchesQuery && matchesCategory && matchesRange;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "tr"));
  }, [data.expenses, query, categoryFilter, rangeFilter, month]);

  const total = rows.reduce((sum, e) => sum + e.amount, 0);

  function handleSubmit(expense: Omit<Expense, "id">, id?: string) {
    if (id) updateExpense({ ...expense, id });
    else addExpense(expense);
  }

  function handleDelete(expense: Expense) {
    if (window.confirm(`"${expense.title}" giderini silmek istediğinize emin misiniz?`)) {
      deleteExpense(expense.id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Başlık veya açıklama ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary shrink-0" onClick={() => setPayrollOpen(true)}>
            <Calculator size={16} /> Öğretmen Hakediş Hesapla
          </button>
          <button type="button" className="btn-primary shrink-0" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Gider ekle
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Filter size={13} /> Filtrele
        </span>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setRangeFilter("all")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              rangeFilter === "all" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"
            }`}
          >
            Tüm zamanlar
          </button>
          <button
            type="button"
            onClick={() => setRangeFilter("month")}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              rangeFilter === "month" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"
            }`}
          >
            Ay seç
          </button>
        </div>
        <input
          className="input w-auto min-w-[160px] py-2 text-sm"
          type="month"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setRangeFilter("month");
          }}
          aria-label="Gider ayı"
        />
        <select
          className="input w-auto min-w-[160px] py-2 text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">Tüm kategoriler</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="card p-5">
        <p className="text-sm text-slate-500">{periodLabel} toplam gider</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{formatMoney(total)}</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Başlık</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium">Açıklama</th>
                <th className="px-4 py-3 font-medium">Yöntem</th>
                <th className="px-4 py-3 font-medium">Tutar</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{e.title}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${categoryBadgeClass(e.category)}`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 max-w-[220px] truncate text-slate-500">{e.note || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{paymentMethodLabel(e.method)}</td>
                  <td className="px-4 py-3 font-semibold">{formatMoney(e.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        className="text-slate-500 hover:text-brand-600"
                        onClick={() => setEditExpense(e)}
                        aria-label="Düzenle"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="text-slate-500 hover:text-red-600"
                        onClick={() => handleDelete(e)}
                        aria-label="Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Filtrelerle eşleşen gider bulunamadı.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen ? (
        <ExpenseFormModal onClose={() => setAddOpen(false)} onSubmit={(expense) => handleSubmit(expense)} />
      ) : null}
      {payrollOpen ? <TeacherHakedisModal onClose={() => setPayrollOpen(false)} /> : null}
      {editExpense ? (
        <ExpenseFormModal
          initial={editExpense}
          onClose={() => setEditExpense(null)}
          onSubmit={(expense, id) => handleSubmit(expense, id)}
        />
      ) : null}
    </div>
  );
}
