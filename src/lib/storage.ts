import type { AppData, AppSettings } from "@/types";
import { FIXED_TEACHERS } from "@/lib/constants";

export const AUTH_KEY = "dersplus_auth";
export const DATA_KEY = "dersplus_data";
export const DATA_READY_KEY = "dersplus_data_ready";
export const ACCESS_PASSWORD_KEY = "dersplus_access_password";

export const FINANCE_STORAGE_KEYS = [DATA_KEY, DATA_READY_KEY, ACCESS_PASSWORD_KEY] as const;

export const APP_USERS = [
  { username: "hatice", password: "123071", name: "Hatice" },
  { username: "ahmet", password: "180760", name: "Ahmet" },
] as const;
export const CURRENT_DATA_VERSION = 3 as const;

export const defaultSettings = {
  academyName: "Ders Plus",
  city: "İstanbul",
  currency: "TRY" as const,
  logoIcon: "graduation",
  contactPhone: "0212 000 00 00",
  contactEmail: "info@dersplus.com",
  address: "Merkez Mah. Eğitim Cad. No:1, İstanbul",
};

export const seedData: AppData = {
  version: CURRENT_DATA_VERSION,
  settings: defaultSettings,
  teachers: FIXED_TEACHERS,
  teacherLessons: [],
  students: [
    {
      id: "st_001",
      fullName: "Elif Yılmaz",
      email: "elif.yilmaz@email.com",
      phone: "0532 111 22 33",
      parentName: "",
      parentPhone: "",
      classroom: "11. Sınıf",
      course: "TYT-AYT Matematik",
      monthlyFee: 5000,
      agreementTotal: 54000,
      downPayment: 9000,
      installmentCount: 9,
      firstInstallmentDate: "2026-02-05",
      status: "active",
      joinedAt: "2026-01-15",
      photoUrl: null,
    },
    {
      id: "st_002",
      fullName: "Mert Kaya",
      email: "mert.kaya@email.com",
      phone: "0541 444 55 66",
      parentName: "",
      parentPhone: "",
      classroom: "12. Sınıf",
      course: "AYT Fizik",
      monthlyFee: 6500,
      agreementTotal: 45000,
      downPayment: 6000,
      installmentCount: 6,
      firstInstallmentDate: "2026-04-10",
      status: "active",
      joinedAt: "2026-03-20",
      photoUrl: null,
    },
    {
      id: "st_003",
      fullName: "Zeynep Demir",
      email: "zeynep.demir@email.com",
      phone: "0507 777 88 99",
      parentName: "",
      parentPhone: "",
      classroom: "10. Sınıf",
      course: "İngilizce B1",
      monthlyFee: 3000,
      agreementTotal: 28800,
      downPayment: 4800,
      installmentCount: 8,
      firstInstallmentDate: "2026-04-15",
      status: "active",
      joinedAt: "2026-03-18",
      photoUrl: null,
    },
    {
      id: "st_004",
      fullName: "Can Özkan",
      email: "can.ozkan@email.com",
      phone: "0533 222 11 00",
      parentName: "",
      parentPhone: "",
      classroom: "8. Sınıf",
      course: "LGS Türkçe",
      monthlyFee: 2000,
      agreementTotal: 16800,
      downPayment: 2800,
      installmentCount: 7,
      firstInstallmentDate: "2025-10-10",
      status: "frozen",
      joinedAt: "2025-09-10",
      photoUrl: null,
    },
    {
      id: "st_005",
      fullName: "Selin Aydın",
      email: "selin.aydin@email.com",
      phone: "0505 333 44 55",
      parentName: "",
      parentPhone: "",
      classroom: "9. Sınıf",
      course: "LGS Matematik",
      monthlyFee: 3500,
      agreementTotal: 21000,
      downPayment: 0,
      installmentCount: 0,
      firstInstallmentDate: null,
      status: "active",
      joinedAt: "2026-09-08",
      photoUrl: null,
    },
  ],
  payments: [
    { id: "pay_001", studentId: "st_001", amount: 9000, dueDate: "2026-01-20", paidAt: "2026-01-18", status: "paid", method: "havale", note: "Peşinat", kind: "down_payment", installmentNo: null },
    { id: "pay_002", studentId: "st_001", amount: 5000, dueDate: "2026-02-05", paidAt: "2026-02-04", status: "paid", method: "havale", note: "1. Taksit", kind: "installment", installmentNo: 1 },
    { id: "pay_003", studentId: "st_001", amount: 5000, dueDate: "2026-03-05", paidAt: "2026-03-03", status: "paid", method: "kart", note: "2. Taksit", kind: "installment", installmentNo: 2 },
    { id: "pay_004", studentId: "st_001", amount: 5000, dueDate: "2026-04-05", paidAt: "2026-04-05", status: "paid", method: "nakit", note: "3. Taksit", kind: "installment", installmentNo: 3 },
    { id: "pay_005", studentId: "st_001", amount: 5000, dueDate: "2026-05-05", paidAt: "2026-05-06", status: "paid", method: "havale", note: "4. Taksit", kind: "installment", installmentNo: 4 },
    { id: "pay_006", studentId: "st_001", amount: 5000, dueDate: "2026-06-05", paidAt: "2026-06-05", status: "paid", method: "kart", note: "5. Taksit", kind: "installment", installmentNo: 5 },
    { id: "pay_007", studentId: "st_001", amount: 5000, dueDate: "2026-07-05", paidAt: "2026-07-07", status: "paid", method: "nakit", note: "6. Taksit", kind: "installment", installmentNo: 6 },
    { id: "pay_008", studentId: "st_001", amount: 5000, dueDate: "2026-08-05", paidAt: "2026-08-05", status: "paid", method: "havale", note: "7. Taksit", kind: "installment", installmentNo: 7 },
    { id: "pay_009", studentId: "st_001", amount: 5000, dueDate: "2026-09-05", paidAt: null, status: "overdue", method: null, note: "8. Taksit", kind: "installment", installmentNo: 8 },
    { id: "pay_010", studentId: "st_001", amount: 5000, dueDate: "2026-10-05", paidAt: null, status: "pending", method: null, note: "9. Taksit", kind: "installment", installmentNo: 9 },

    { id: "pay_011", studentId: "st_002", amount: 6000, dueDate: "2026-03-25", paidAt: "2026-03-25", status: "paid", method: "havale", note: "Peşinat", kind: "down_payment", installmentNo: null },
    { id: "pay_012", studentId: "st_002", amount: 6500, dueDate: "2026-04-10", paidAt: "2026-04-09", status: "paid", method: "kart", note: "1. Taksit", kind: "installment", installmentNo: 1 },
    { id: "pay_013", studentId: "st_002", amount: 6500, dueDate: "2026-05-10", paidAt: "2026-05-10", status: "paid", method: "kart", note: "2. Taksit", kind: "installment", installmentNo: 2 },
    { id: "pay_014", studentId: "st_002", amount: 6500, dueDate: "2026-06-10", paidAt: "2026-06-12", status: "paid", method: "nakit", note: "3. Taksit", kind: "installment", installmentNo: 3 },
    { id: "pay_015", studentId: "st_002", amount: 6500, dueDate: "2026-07-10", paidAt: "2026-07-10", status: "paid", method: "havale", note: "4. Taksit", kind: "installment", installmentNo: 4 },
    { id: "pay_016", studentId: "st_002", amount: 6500, dueDate: "2026-08-10", paidAt: "2026-08-11", status: "paid", method: "kart", note: "5. Taksit", kind: "installment", installmentNo: 5 },
    { id: "pay_017", studentId: "st_002", amount: 6500, dueDate: "2026-09-10", paidAt: "2026-09-09", status: "paid", method: "kart", note: "6. Taksit", kind: "installment", installmentNo: 6 },

    { id: "pay_018", studentId: "st_003", amount: 4800, dueDate: "2026-03-20", paidAt: "2026-03-20", status: "paid", method: "nakit", note: "Peşinat", kind: "down_payment", installmentNo: null },
    { id: "pay_019", studentId: "st_003", amount: 3000, dueDate: "2026-04-15", paidAt: "2026-04-14", status: "paid", method: "havale", note: "1. Taksit", kind: "installment", installmentNo: 1 },
    { id: "pay_020", studentId: "st_003", amount: 3000, dueDate: "2026-05-15", paidAt: "2026-05-15", status: "paid", method: "kart", note: "2. Taksit", kind: "installment", installmentNo: 2 },
    { id: "pay_021", studentId: "st_003", amount: 3000, dueDate: "2026-06-15", paidAt: "2026-06-16", status: "paid", method: "nakit", note: "3. Taksit", kind: "installment", installmentNo: 3 },
    { id: "pay_022", studentId: "st_003", amount: 3000, dueDate: "2026-07-15", paidAt: null, status: "overdue", method: null, note: "4. Taksit", kind: "installment", installmentNo: 4 },
    { id: "pay_023", studentId: "st_003", amount: 3000, dueDate: "2026-08-15", paidAt: null, status: "overdue", method: null, note: "5. Taksit", kind: "installment", installmentNo: 5 },
    { id: "pay_024", studentId: "st_003", amount: 3000, dueDate: "2026-09-15", paidAt: null, status: "pending", method: null, note: "6. Taksit", kind: "installment", installmentNo: 6 },
    { id: "pay_025", studentId: "st_003", amount: 3000, dueDate: "2026-10-15", paidAt: null, status: "pending", method: null, note: "7. Taksit", kind: "installment", installmentNo: 7 },
    { id: "pay_026", studentId: "st_003", amount: 3000, dueDate: "2026-11-15", paidAt: null, status: "pending", method: null, note: "8. Taksit", kind: "installment", installmentNo: 8 },

    { id: "pay_027", studentId: "st_004", amount: 2800, dueDate: "2025-09-10", paidAt: "2025-09-10", status: "paid", method: "nakit", note: "Peşinat", kind: "down_payment", installmentNo: null },
    { id: "pay_028", studentId: "st_004", amount: 2000, dueDate: "2025-10-10", paidAt: "2025-10-09", status: "paid", method: "nakit", note: "1. Taksit", kind: "installment", installmentNo: 1 },
    { id: "pay_029", studentId: "st_004", amount: 2000, dueDate: "2025-11-10", paidAt: "2025-11-08", status: "paid", method: "kart", note: "2. Taksit", kind: "installment", installmentNo: 2 },
    { id: "pay_030", studentId: "st_004", amount: 2000, dueDate: "2025-12-10", paidAt: null, status: "overdue", method: null, note: "3. Taksit", kind: "installment", installmentNo: 3 },
    { id: "pay_031", studentId: "st_004", amount: 2000, dueDate: "2026-01-10", paidAt: null, status: "overdue", method: null, note: "4. Taksit", kind: "installment", installmentNo: 4 },
    { id: "pay_032", studentId: "st_004", amount: 2000, dueDate: "2026-02-10", paidAt: null, status: "overdue", method: null, note: "5. Taksit", kind: "installment", installmentNo: 5 },
    { id: "pay_033", studentId: "st_004", amount: 2000, dueDate: "2026-03-10", paidAt: null, status: "overdue", method: null, note: "6. Taksit", kind: "installment", installmentNo: 6 },
    { id: "pay_034", studentId: "st_004", amount: 2000, dueDate: "2026-04-10", paidAt: null, status: "overdue", method: null, note: "7. Taksit", kind: "installment", installmentNo: 7 },
  ],
  expenses: [
    { id: "ex_001", title: "Sınıf kirası", category: "Kira", amount: 18500, date: "2026-09-01", note: "Eylül", method: "havale" },
    { id: "ex_002", title: "Fotokopi ve kırtasiye", category: "Kırtasiye/Malzeme", amount: 1240, date: "2026-09-06", note: "", method: "nakit" },
    { id: "ex_003", title: "Elektrik faturası", category: "Faturalar", amount: 2100, date: "2026-09-08", note: "", method: "havale" },
    { id: "ex_004", title: "Öğretmen maaşı", category: "Personel/Maaş", amount: 32000, date: "2026-08-28", note: "Ağustos", method: "havale" },
    { id: "ex_005", title: "Sosyal medya reklamı", category: "Pazarlama", amount: 3500, date: "2026-09-03", note: "Eylül kampanyası", method: "kart" },
    { id: "ex_006", title: "İnternet faturası", category: "Faturalar", amount: 850, date: "2026-08-15", note: "", method: "havale" },
    { id: "ex_007", title: "Temizlik malzemeleri", category: "Diğer", amount: 620, date: "2026-07-20", note: "", method: "nakit" },
  ],
};

export function emptyAppData(settings?: Partial<AppSettings>): AppData {
  return {
    version: CURRENT_DATA_VERSION,
    settings: {
      ...defaultSettings,
      ...settings,
      fixedExpensesUntil: undefined,
    },
    students: [],
    payments: [],
    expenses: [],
    teachers: FIXED_TEACHERS.map((teacher) => ({ ...teacher })),
    teacherLessons: [],
  };
}

export function markDataReady() {
  localStorage.setItem(DATA_READY_KEY, "1");
}

export function isDataReady() {
  return localStorage.getItem(DATA_READY_KEY) === "1";
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function persistAppData(value: AppData) {
  saveJson(DATA_KEY, value);
  markDataReady();
}

export function clearFinanceStorage() {
  for (const key of FINANCE_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

export function hasStoredAppData(value: unknown): value is Partial<AppData> & {
  students: AppData["students"];
  payments: AppData["payments"];
  expenses: AppData["expenses"];
} {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<AppData>;
  return Array.isArray(data.students) && Array.isArray(data.payments) && Array.isArray(data.expenses);
}

export function hasUserFinanceRecords(value: Partial<AppData> | null | undefined) {
  if (!value) return false;
  return (
    (value.students?.length ?? 0) > 0 ||
    (value.payments?.length ?? 0) > 0 ||
    (value.expenses?.length ?? 0) > 0 ||
    (value.teacherLessons?.length ?? 0) > 0
  );
}
