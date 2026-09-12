import { formatDate, formatMoney } from "@/lib/format";
import type { ReceiptData } from "@/lib/receipt";

type Props = {
  data: ReceiptData;
};

export function ReceiptSheet({ data }: Props) {
  return (
    <div className="w-[420px] overflow-hidden rounded-[28px] border border-slate-100 bg-white text-slate-900">
      <div className="bg-white px-7 pb-5 pt-7">
        <img src="/receipt/logo.png" alt="Ders Plus" className="h-11 w-auto" />
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-500">
          Tahsilat makbuzu
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{data.studentName}</h2>
          <p className="text-right text-[11px] text-slate-500">
            {data.receiptNo}
            <br />
            {formatDate(data.date)}
          </p>
        </div>
        <p className="mt-1 text-sm text-slate-500">{data.classroom}</p>
      </div>

      <div className="space-y-5 px-7 py-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-50 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Açıklama</p>
            <p className="mt-1 font-semibold">{data.description}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Yöntem</p>
            <p className="mt-1 font-semibold">{data.methodLabel}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <Row label="Anlaşılan tutar" value={formatMoney(data.agreementTotal)} />
          <Row label="Bu tahsilat" value={formatMoney(data.paidThis)} accent />
          <Row label="Toplam ödenen" value={formatMoney(data.paidTotal)} />
          <Row label="Kalan borç" value={formatMoney(data.remaining)} />
          <Row label="Kalan taksit" value={`${data.remainingInstallments} adet`} last />
        </div>

        {(data.parentPhone || data.phone) && (
          <p className="text-xs text-slate-500">
            İletişim: {[data.parentPhone, data.phone].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="bg-white px-7 pb-7 pt-1 text-center">
        <img src="/receipt/kase-white.png" alt="Ders Plus kaşesi" className="mx-auto h-28 w-auto object-contain" />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
  last,
}: {
  label: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 text-sm ${last ? "" : "border-b border-slate-100"} ${
        accent ? "bg-orange-50" : "bg-white"
      }`}
    >
      <span className={accent ? "font-medium text-orange-700" : "text-slate-500"}>{label}</span>
      <span className={`font-semibold ${accent ? "text-orange-700" : "text-slate-900"}`}>{value}</span>
    </div>
  );
}
