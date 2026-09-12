import type { PaymentMethod, Teacher, TeacherPayType } from "@/types";

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "nakit", label: "Nakit" },
  { value: "kart", label: "Kredi Kartı" },
  { value: "havale", label: "EFT/Havale" },
];

export const PAYROLL_METHOD_OPTIONS: { value: Extract<PaymentMethod, "nakit" | "havale">; label: string }[] = [
  { value: "nakit", label: "Nakit" },
  { value: "havale", label: "EFT-Havale" },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  nakit: "Nakit",
  kart: "Kredi Kartı",
  havale: "EFT/Havale",
};

export function paymentMethodLabel(method: PaymentMethod | null) {
  return method ? PAYMENT_METHOD_LABELS[method] : "—";
}

export const CLASSROOM_OPTIONS = [
  "3. Sınıf",
  "4. Sınıf",
  "5. Sınıf",
  "6. Sınıf",
  "7. Sınıf",
  "8. Sınıf",
];

export const FIXED_EXPENSES_UNTIL = "2027-01-01";

export const EXPENSE_CATEGORIES = [
  "Personel/Maaş",
  "Kira",
  "Faturalar",
  "Kırtasiye/Malzeme",
  "Pazarlama",
  "Vergi Ödemesi",
  "Sigorta Ödemesi",
  "Diğer",
];

export const CATEGORY_BADGE_STYLES: Record<string, string> = {
  "Personel/Maaş": "bg-violet-50 text-violet-700",
  Kira: "bg-sky-50 text-sky-700",
  Faturalar: "bg-amber-50 text-amber-700",
  "Kırtasiye/Malzeme": "bg-brand-50 text-brand-700",
  Pazarlama: "bg-pink-50 text-pink-700",
  "Vergi Ödemesi": "bg-red-50 text-red-700",
  "Sigorta Ödemesi": "bg-teal-50 text-teal-700",
  Diğer: "bg-slate-100 text-slate-600",
};

export const CATEGORY_BAR_COLORS: Record<string, string> = {
  "Personel/Maaş": "bg-violet-500",
  Kira: "bg-sky-500",
  Faturalar: "bg-amber-500",
  "Kırtasiye/Malzeme": "bg-brand-500",
  Pazarlama: "bg-pink-500",
  "Vergi Ödemesi": "bg-red-500",
  "Sigorta Ödemesi": "bg-teal-500",
  Diğer: "bg-slate-400",
};

export function categoryBadgeClass(category: string) {
  return CATEGORY_BADGE_STYLES[category] ?? "bg-slate-100 text-slate-600";
}

export function categoryBarClass(category: string) {
  return CATEGORY_BAR_COLORS[category] ?? "bg-slate-400";
}

export const TEACHER_PAY_TYPE_OPTIONS: { value: TeacherPayType; label: string }[] = [
  { value: "fixed", label: "Sabit Maaşlı" },
  { value: "hourly", label: "Ders Saati Ücretli" },
];

export const FIXED_TEACHERS: Teacher[] = [
  { id: "tch_ahmet_kaymakli", fullName: "AHMET KAYMAKLI", payType: "hourly", monthlySalary: 0, hourlyRate: 0 },
  { id: "tch_melike_bayarslan", fullName: "MELİKE BAYARSLAN", payType: "hourly", monthlySalary: 0, hourlyRate: 0 },
  { id: "tch_ayse_incekara", fullName: "AYŞE İNCEKARA", payType: "hourly", monthlySalary: 0, hourlyRate: 0 },
  { id: "tch_furkan_yalcin", fullName: "FURKAN YALÇIN", payType: "hourly", monthlySalary: 0, hourlyRate: 0 },
  { id: "tch_senanur_karademir", fullName: "SENANUR KARADEMİR", payType: "hourly", monthlySalary: 0, hourlyRate: 0 },
  { id: "tch_fatma_sule_sincan", fullName: "FATMA ŞULE SİNÇAN", payType: "hourly", monthlySalary: 0, hourlyRate: 0 },
  { id: "tch_hatice_dogan", fullName: "HATİCE DOĞAN", payType: "hourly", monthlySalary: 0, hourlyRate: 0 },
];

export function withFixedTeachers(existing?: Teacher[]): Teacher[] {
  return FIXED_TEACHERS.map((fixed) => {
    const saved = existing?.find((t) => t.id === fixed.id);
    if (!saved) return { ...fixed };
    return {
      ...fixed,
      payType: saved.payType ?? fixed.payType,
      monthlySalary: saved.monthlySalary ?? 0,
      hourlyRate: saved.hourlyRate ?? 0,
    };
  });
}
