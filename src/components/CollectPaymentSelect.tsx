import type { PaymentMethod } from "@/types";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/constants";

type Props = {
  onCollect: (method: PaymentMethod) => void;
  className?: string;
  label?: string;
};

export function CollectPaymentSelect({ onCollect, className = "", label = "Tahsil et" }: Props) {
  return (
    <select
      defaultValue=""
      aria-label={label}
      className={`cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 focus:outline-none ${className}`}
      onChange={(e) => {
        const value = e.target.value as PaymentMethod | "";
        if (value) onCollect(value);
        e.target.value = "";
      }}
    >
      <option value="" disabled>
        {label}
      </option>
      {PAYMENT_METHOD_OPTIONS.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
