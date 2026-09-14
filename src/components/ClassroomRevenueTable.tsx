import { useMemo, useState } from "react";
import { useAppData } from "@/context/AppDataContext";
import { formatMoney, formatMonthLong, formatPercent, monthKey, todayISO } from "@/lib/format";
import { getClassroomRevenueRows } from "@/lib/finance";

function ratioClass(ratio: number) {
  if (ratio >= 100) return "bg-emerald-50 text-emerald-700";
  if (ratio >= 70) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

type ClassroomRevenueTableProps = {
  month?: string;
};

export function ClassroomRevenueTable({ month: monthProp }: ClassroomRevenueTableProps) {
  const { data } = useAppData();
  const [internalMonth, setInternalMonth] = useState(monthKey(todayISO()));
  const month = monthProp ?? internalMonth;
  const rows = useMemo(() => getClassroomRevenueRows(data, month), [data, month]);
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          students: acc.students + row.studentCount,
          expected: acc.expected + row.expectedMonthly,
          collected: acc.collected + row.collected,
        }),
        { students: 0, expected: 0, collected: 0 },
      ),
    [rows],
  );
  const totalRatio = totals.expected > 0 ? (totals.collected / totals.expected) * 100 : 0;

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div>
          <h3 className="font-semibold">Sınıf Bazlı Ciro Tablosu</h3>
          <p className="text-sm text-slate-500">
            {formatMonthLong(month)} dönemi — yalnızca o ayın taksitlerinden beklenen ciro
          </p>
        </div>
        {monthProp ? null : (
          <input
            className="input w-auto min-w-[160px] py-2"
            type="month"
            value={month}
            onChange={(e) => setInternalMonth(e.target.value)}
            aria-label="Ciro dönemi"
          />
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Sınıf Adı</th>
              <th className="px-4 py-3 font-medium">Öğrenci Sayısı</th>
              <th className="px-4 py-3 font-medium">Beklenen Aylık Ciro</th>
              <th className="px-4 py-3 font-medium">Tahsil Edilen Ciro</th>
              <th className="px-4 py-3 font-medium">Doluluk/Ciro Oranı (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.classroom} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{row.classroom}</td>
                <td className="px-4 py-3">{row.studentCount}</td>
                <td className="px-4 py-3 font-semibold">{formatMoney(row.expectedMonthly)}</td>
                <td className="px-4 py-3">{formatMoney(row.collected)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ratioClass(row.ratio)}`}>
                    {formatPercent(row.ratio)}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  Bu dönemde gösterilecek sınıf cirosu yok.
                </td>
              </tr>
            ) : (
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
                <td className="px-4 py-3">Toplam</td>
                <td className="px-4 py-3">{totals.students}</td>
                <td className="px-4 py-3">{formatMoney(totals.expected)}</td>
                <td className="px-4 py-3">{formatMoney(totals.collected)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ratioClass(totalRatio)}`}>
                    {formatPercent(totalRatio)}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
