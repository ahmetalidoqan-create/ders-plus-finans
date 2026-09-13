import { formatDate, formatMoney } from "@/lib/format";
import { RECEIPT_COMPANY } from "@/lib/receipt";
import { statementStatusLabel, type StatementData } from "@/lib/statement";

type Props = {
  data: StatementData;
};

export function StatementSheet({ data }: Props) {
  const brand = /akademi/i.test(data.academyName) ? data.academyName : `${data.academyName} Akademi`;

  return (
    <div className="w-[720px] overflow-hidden bg-white text-slate-900">
      <div className="border-b border-slate-100 px-8 pb-6 pt-8">
        <div className="flex items-start justify-between gap-4">
          <img src="/receipt/logo.png" alt="Ders Plus" className="h-12 w-auto" />
          <div className="text-right text-[11px] leading-relaxed text-slate-500">
            <p className="font-semibold text-slate-800">{RECEIPT_COMPANY.legalName}</p>
            <p>{RECEIPT_COMPANY.address}</p>
            <p>{RECEIPT_COMPANY.taxOffice}</p>
          </div>
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-500">
          Veli / Öğrenci hesap özeti
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{brand}</h2>
        <p className="mt-1 text-sm text-slate-500">Ekstre tarihi: {formatDate(data.issuedAt)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-8 py-5 text-sm">
        <Info label="Öğrenci" value={data.student.fullName} />
        <Info label="Sınıf" value={data.student.classroom || "—"} />
        <Info label="Anne telefonu" value={data.student.parentPhone || "—"} />
        <Info label="Baba telefonu" value={data.student.phone || "—"} />
      </div>

      <div className="grid grid-cols-3 gap-3 px-8 pb-5">
        <Summary label="Toplam tutar" value={formatMoney(data.total)} />
        <Summary label="Ödenen tutar" value={formatMoney(data.paid)} />
        <Summary label="Kalan bakiye" value={formatMoney(data.remaining)} accent={data.remaining > 0} />
      </div>

      <div className="px-8 pb-4">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-y border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
              <th className="py-2 font-medium">Kalem</th>
              <th className="py-2 font-medium">Vade</th>
              <th className="py-2 font-medium">Ödeme</th>
              <th className="py-2 font-medium">Yöntem</th>
              <th className="py-2 text-right font-medium">Tutar</th>
              <th className="py-2 text-right font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-2 font-medium">{row.label}</td>
                <td className="py-2">{formatDate(row.dueDate)}</td>
                <td className="py-2">{row.paidAt ? formatDate(row.paidAt) : "—"}</td>
                <td className="py-2">{row.methodLabel}</td>
                <td className="py-2 text-right font-semibold">{formatMoney(row.amount)}</td>
                <td className="py-2 text-right">{statementStatusLabel(row.status)}</td>
              </tr>
            ))}
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  Henüz ödeme veya taksit kaydı yok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="px-8 pb-8 pt-2 text-center">
        <img src="/receipt/kase-white.png" alt="Ders Plus kaşesi" className="mx-auto h-24 w-auto object-contain" />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-3.5 py-3 ${accent ? "bg-orange-50" : "bg-slate-50"}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ? "text-orange-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
