import type { AppData, AppSettings, Expense, Payment, Student, Teacher, TeacherLesson } from "@/types";
import { CURRENT_DATA_VERSION, defaultSettings, emptyAppData } from "@/lib/storage";
import { withFixedTeachers } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { ReceiptData } from "@/lib/receipt";
import { uid } from "@/lib/format";

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parentNameFromRow(row: Record<string, unknown>) {
  const named = String(row.parent_name ?? "").trim();
  if (named) return named;
  const stored = String(row.email ?? "").trim();
  return stored.includes("@") ? "" : stored;
}

function mapStudent(row: Record<string, unknown>): Student {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? ""),
    tc: String(row.tc ?? "").replace(/\D/g, ""),
    email: String(row.email ?? "").includes("@") ? String(row.email ?? "") : "",
    phone: String(row.phone ?? ""),
    parentName: parentNameFromRow(row),
    parentPhone: String(row.parent_phone ?? ""),
    classroom: String(row.classroom ?? ""),
    course: String(row.course ?? ""),
    monthlyFee: num(row.monthly_fee),
    agreementTotal: num(row.agreement_total),
    downPayment: num(row.down_payment),
    installmentCount: num(row.installment_count),
    firstInstallmentDate: row.first_installment_date ? String(row.first_installment_date) : null,
    status: row.status === "frozen" || row.status === "inactive" ? "frozen" : "active",
    joinedAt: String(row.joined_at ?? ""),
    photoUrl: row.photo_url ? String(row.photo_url) : null,
  };
}

function studentRow(student: Student, includePhotos = true) {
  const row: Record<string, unknown> = {
    id: student.id,
    full_name: student.fullName,
    tc: String(student.tc ?? "").replace(/\D/g, ""),
    email: student.parentName || student.email,
    phone: student.phone,
    parent_phone: student.parentPhone,
    classroom: student.classroom,
    course: student.course,
    monthly_fee: student.monthlyFee,
    agreement_total: student.agreementTotal,
    down_payment: student.downPayment,
    installment_count: student.installmentCount,
    first_installment_date: student.firstInstallmentDate,
    status: student.status,
    joined_at: student.joinedAt,
  };
  if (student.photoUrl) {
    row.photo_url = student.photoUrl;
  } else if (includePhotos) {
    row.photo_url = null;
  }
  return row;
}

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    amount: num(row.amount),
    dueDate: String(row.due_date),
    paidAt: row.paid_at ? String(row.paid_at) : null,
    status: (row.status as Payment["status"]) ?? "pending",
    method: (row.method as Payment["method"]) ?? null,
    note: String(row.note ?? ""),
    kind: (row.kind as Payment["kind"]) ?? "other",
    installmentNo: row.installment_no == null ? null : num(row.installment_no),
  };
}

function paymentRow(payment: Payment) {
  return {
    id: payment.id,
    student_id: payment.studentId,
    amount: payment.amount,
    due_date: payment.dueDate,
    paid_at: payment.paidAt,
    status: payment.status,
    method: payment.method,
    note: payment.note,
    kind: payment.kind,
    installment_no: payment.installmentNo,
  };
}

function mapExpense(row: Record<string, unknown>): Expense {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    category: String(row.category ?? ""),
    amount: num(row.amount),
    date: String(row.date),
    note: String(row.note ?? ""),
    method: (row.method as Expense["method"]) ?? "nakit",
  };
}

function expenseRow(expense: Expense) {
  return {
    id: expense.id,
    title: expense.title,
    category: expense.category,
    amount: expense.amount,
    date: expense.date,
    note: expense.note,
    method: expense.method,
  };
}

function mapTeacher(row: Record<string, unknown>): Teacher {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? ""),
    payType: row.pay_type === "fixed" ? "fixed" : "hourly",
    monthlySalary: num(row.monthly_salary),
    hourlyRate: num(row.hourly_rate),
  };
}

function teacherRow(teacher: Teacher) {
  return {
    id: teacher.id,
    full_name: teacher.fullName,
    pay_type: teacher.payType,
    monthly_salary: teacher.monthlySalary,
    hourly_rate: teacher.hourlyRate,
  };
}

function mapLesson(row: Record<string, unknown>): TeacherLesson {
  return {
    id: String(row.id),
    teacherId: String(row.teacher_id),
    date: String(row.date),
    hours: num(row.hours),
    note: String(row.note ?? ""),
  };
}

function lessonRow(lesson: TeacherLesson) {
  return {
    id: lesson.id,
    teacher_id: lesson.teacherId,
    date: lesson.date,
    hours: lesson.hours,
    note: lesson.note,
  };
}

function mapSettings(row: Record<string, unknown> | null): AppSettings {
  if (!row) return { ...defaultSettings };
  return {
    academyName: String(row.academy_name ?? defaultSettings.academyName),
    city: String(row.city ?? defaultSettings.city),
    currency: "TRY",
    logoIcon: String(row.logo_icon ?? defaultSettings.logoIcon),
    contactPhone: String(row.contact_phone ?? defaultSettings.contactPhone),
    contactEmail: String(row.contact_email ?? defaultSettings.contactEmail),
    address: String(row.address ?? defaultSettings.address),
    fixedExpensesUntil: row.fixed_expenses_until ? String(row.fixed_expenses_until) : undefined,
  };
}

function settingsRow(settings: AppSettings) {
  return {
    id: "default",
    academy_name: settings.academyName,
    city: settings.city,
    currency: settings.currency,
    logo_icon: settings.logoIcon,
    contact_phone: settings.contactPhone,
    contact_email: settings.contactEmail,
    address: settings.address,
    fixed_expenses_until: settings.fixedExpensesUntil ?? null,
  };
}

const PAGE_SIZE = 1000;
const STUDENT_COLUMNS =
  "id, full_name, tc, email, phone, parent_phone, classroom, course, monthly_fee, agreement_total, down_payment, installment_count, first_installment_date, status, joined_at";
const PAYMENT_COLUMNS = "id, student_id, amount, due_date, paid_at, status, method, note, kind, installment_no";
const EXPENSE_COLUMNS = "id, title, category, amount, date, note, method";
const TEACHER_COLUMNS = "id, full_name, pay_type, monthly_salary, hourly_rate";
const LESSON_COLUMNS = "id, teacher_id, date, hours, note";
const SETTINGS_COLUMNS =
  "academy_name, city, currency, logo_icon, contact_phone, contact_email, address, fixed_expenses_until";

async function fetchAll<T extends Record<string, unknown>>(
  table: string,
  columns: string,
  pageSize = PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

async function upsertRows(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + chunkSize));
    if (error) throw error;
  }
}

export function formatSupabaseSyncError(error: unknown): string {
  const raw =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : error instanceof Error
        ? error.message
        : "";
  if (/column .*tc.* does not exist/i.test(raw) || /\btc\b.*does not exist/i.test(raw)) {
    return "Veritabanında T.C. kolonu yok. Supabase → SQL Editor’de şunu çalıştırın: alter table public.students add column if not exists tc text not null default '';";
  }
  return raw.trim() || "Supabase kaydı başarısız.";
}

async function deleteMissing(table: string, rows: Record<string, unknown>[]) {
  const existing = await fetchAll<{ id: string }>(table, "id");
  const nextIds = new Set(rows.map((row) => String(row.id)));
  const removed = existing.map((row) => String(row.id)).filter((id) => !nextIds.has(id));
  if (!removed.length) return;
  const { error } = await supabase.from(table).delete().in("id", removed);
  if (error) throw error;
}

async function replaceRows(table: string, rows: Record<string, unknown>[]) {
  await deleteMissing(table, rows);
  await upsertRows(table, rows);
}

function throwIfSchemaMissing(error: { code?: string; message: string }) {
  if (error.code === "PGRST205" || error.message.includes("schema cache")) {
    throw new Error(
      "Supabase tabloları henüz yok. Supabase SQL Editor’da supabase/schema.sql dosyasını çalıştırın.",
    );
  }
  throw error;
}

export async function loadAppDataFromSupabase(): Promise<AppData> {
  try {
    const [settingsRes, students, payments, expenses, teachers, lessons] = await Promise.all([
      supabase.from("app_settings").select(SETTINGS_COLUMNS).eq("id", "default").maybeSingle(),
      fetchAll("students", STUDENT_COLUMNS),
      fetchAll("payments", PAYMENT_COLUMNS),
      fetchAll("expenses", EXPENSE_COLUMNS),
      fetchAll("teachers", TEACHER_COLUMNS),
      fetchAll("teacher_lessons", LESSON_COLUMNS),
    ]);
    if (settingsRes.error) throw settingsRes.error;

    return {
      version: CURRENT_DATA_VERSION,
      settings: mapSettings(settingsRes.data as Record<string, unknown> | null),
      students: students.map((row) => mapStudent(row)),
      payments: payments.map((row) => mapPayment(row)),
      expenses: expenses.map((row) => mapExpense(row)),
      teachers: withFixedTeachers(teachers.map((row) => mapTeacher(row))),
      teacherLessons: lessons.map((row) => mapLesson(row)),
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "message" in error) {
      throwIfSchemaMissing(error as { code?: string; message: string });
    }
    throw error;
  }
}

export async function loadStudentPhotosFromSupabase(): Promise<Map<string, string>> {
  const rows: { id: string; photo_url: string }[] = [];
  const pageSize = 100;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("students")
      .select("id, photo_url")
      .not("photo_url", "is", null)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as { id: string; photo_url: string }[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return new Map(
    rows
      .filter((row) => row.photo_url)
      .map((row) => [String(row.id), String(row.photo_url)]),
  );
}

export async function syncAppDataToSupabase(data: AppData, options?: { includePhotos?: boolean }) {
  const includePhotos = options?.includePhotos ?? true;
  const teachers = withFixedTeachers(data.teachers).map(teacherRow);
  const students = data.students.map((student) => studentRow(student, includePhotos));
  const payments = data.payments.map(paymentRow);
  const expenses = data.expenses.map(expenseRow);
  const lessons = data.teacherLessons.map(lessonRow);

  const { error: settingsError } = await supabase.from("app_settings").upsert(settingsRow(data.settings));
  if (settingsError) throw settingsError;

  await Promise.all([upsertRows("teachers", teachers), upsertRows("students", students)]);
  await Promise.all([
    replaceRows("payments", payments),
    replaceRows("teacher_lessons", lessons),
    replaceRows("expenses", expenses),
  ]);
  await Promise.all([deleteMissing("students", students), deleteMissing("teachers", teachers)]);
}

export async function clearFinanceInSupabase(settings: AppSettings) {
  await supabase.from("receipts").delete().neq("id", "");
  await supabase.from("payments").delete().neq("id", "");
  await supabase.from("teacher_lessons").delete().neq("id", "");
  await supabase.from("expenses").delete().neq("id", "");
  await supabase.from("students").delete().neq("id", "");
  await supabase.from("app_settings").upsert(settingsRow(settings));
  await replaceRows(
    "teachers",
    withFixedTeachers(emptyAppData(settings).teachers).map(teacherRow),
  );
}

export async function saveReceiptToSupabase(data: ReceiptData, studentId?: string) {
  const { error } = await supabase.from("receipts").upsert({
    id: uid("rcpt"),
    receipt_no: data.receiptNo,
    date: data.date,
    student_id: studentId ?? null,
    student_name: data.studentName,
    classroom: data.classroom,
    phone: data.phone,
    parent_phone: data.parentPhone,
    description: data.description,
    method_label: data.methodLabel,
    agreement_total: data.agreementTotal,
    paid_this: data.paidThis,
    paid_total: data.paidTotal,
    remaining: data.remaining,
    remaining_installments: data.remainingInstallments,
  });
  if (error) throw error;
}

export function subscribeToFinanceChanges(onChange: () => void) {
  const channel = supabase
    .channel("dersplus-finance")
    .on("postgres_changes", { event: "*", schema: "public", table: "students" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "teachers" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "teacher_lessons" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, onChange)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
