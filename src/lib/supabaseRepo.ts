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

function mapStudent(row: Record<string, unknown>): Student {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
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

function studentRow(student: Student) {
  return {
    id: student.id,
    full_name: student.fullName,
    email: student.email,
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
    photo_url: student.photoUrl,
  };
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

async function upsertRows(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows);
  if (error) throw error;
}

async function deleteMissing(table: string, rows: Record<string, unknown>[]) {
  const { data: existing, error: readError } = await supabase.from(table).select("id");
  if (readError) throw readError;
  const nextIds = new Set(rows.map((row) => String(row.id)));
  const removed = (existing ?? []).map((row) => String(row.id)).filter((id) => !nextIds.has(id));
  if (!removed.length) return;
  const { error } = await supabase.from(table).delete().in("id", removed);
  if (error) throw error;
}

async function replaceRows(table: string, rows: Record<string, unknown>[]) {
  await deleteMissing(table, rows);
  await upsertRows(table, rows);
}

export async function loadAppDataFromSupabase(): Promise<AppData> {
  const [settingsRes, studentsRes, paymentsRes, expensesRes, teachersRes, lessonsRes] = await Promise.all([
    supabase.from("app_settings").select("*").eq("id", "default").maybeSingle(),
    supabase.from("students").select("*"),
    supabase.from("payments").select("*"),
    supabase.from("expenses").select("*"),
    supabase.from("teachers").select("*"),
    supabase.from("teacher_lessons").select("*"),
  ]);

  const firstError =
    settingsRes.error ?? studentsRes.error ?? paymentsRes.error ?? expensesRes.error ?? teachersRes.error ?? lessonsRes.error;
  if (firstError) {
    if (firstError.code === "PGRST205" || firstError.message.includes("schema cache")) {
      throw new Error(
        "Supabase tabloları henüz yok. Supabase SQL Editor’da supabase/schema.sql dosyasını çalıştırın.",
      );
    }
    throw firstError;
  }

  return {
    version: CURRENT_DATA_VERSION,
    settings: mapSettings(settingsRes.data as Record<string, unknown> | null),
    students: (studentsRes.data ?? []).map((row) => mapStudent(row as Record<string, unknown>)),
    payments: (paymentsRes.data ?? []).map((row) => mapPayment(row as Record<string, unknown>)),
    expenses: (expensesRes.data ?? []).map((row) => mapExpense(row as Record<string, unknown>)),
    teachers: withFixedTeachers((teachersRes.data ?? []).map((row) => mapTeacher(row as Record<string, unknown>))),
    teacherLessons: (lessonsRes.data ?? []).map((row) => mapLesson(row as Record<string, unknown>)),
  };
}

export async function syncAppDataToSupabase(data: AppData) {
  const teachers = withFixedTeachers(data.teachers).map(teacherRow);
  const students = data.students.map(studentRow);
  const payments = data.payments.map(paymentRow);
  const expenses = data.expenses.map(expenseRow);
  const lessons = data.teacherLessons.map(lessonRow);

  const { error: settingsError } = await supabase.from("app_settings").upsert(settingsRow(data.settings));
  if (settingsError) throw settingsError;

  await upsertRows("teachers", teachers);
  await upsertRows("students", students);
  await replaceRows("payments", payments);
  await replaceRows("teacher_lessons", lessons);
  await replaceRows("expenses", expenses);
  await deleteMissing("students", students);
  await deleteMissing("teachers", teachers);
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
    .on("postgres_changes", { event: "*", schema: "public", table: "receipts" }, onChange)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
