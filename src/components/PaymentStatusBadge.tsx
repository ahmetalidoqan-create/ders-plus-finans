import type { PaymentStatus } from "@/types";

const config: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: "Ödendi", className: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Bekliyor", className: "bg-amber-50 text-amber-700" },
  overdue: { label: "Gecikti", className: "bg-red-50 text-red-700" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${c.className}`}>
      {c.label}
    </span>
  );
}
