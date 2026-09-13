import type { AppData, Expense, Payment, PaymentMethod, PaymentPlanInput, Student, TeacherPayType } from "@/types";
import { addDays, addMonths, formatMoney, formatMonthLabel, formatMonthLong, monthKey, splitEqual, todayISO, uid } from "@/lib/format";

export type StudentFinance = {
  total: number;
  paid: number;
  remaining: number;
  overdueAmount: number;
  overdueCount: number;
  installmentCount: number;
  paidCount: number;
  pendingCount: number;
};

export function getStudentPayments(payments: Payment[], studentId: string): Payment[] {
  return payments
    .filter((p) => p.studentId === studentId)
    .slice()
    .sort((a, b) => {
      const rankA = a.kind === "down_payment" ? -1 : (a.installmentNo ?? 0);
      const rankB = b.kind === "down_payment" ? -1 : (b.installmentNo ?? 0);
      return rankA - rankB || a.dueDate.localeCompare(b.dueDate);
    });
}

export function isStudentFrozen(student?: Student | null) {
  return student?.status === "frozen" || (student?.status as string | undefined) === "inactive";
}

export function studentStatusLabel(student: Student) {
  return isStudentFrozen(student) ? "Donduruldu" : "Aktif";
}

export function studentMotherPhone(student: Student) {
  return student.parentPhone.trim();
}

export function studentFatherPhone(student: Student) {
  return student.phone.trim();
}

export function studentPrimaryPhone(student: Student) {
  return studentMotherPhone(student) || studentFatherPhone(student);
}

export function withPaymentStatus(payment: Payment, students: Student[]): Payment {
  if (payment.paidAt) return { ...payment, status: "paid" };
  const student = students.find((item) => item.id === payment.studentId);
  if (isStudentFrozen(student)) return { ...payment, status: "pending" };
  return { ...payment, status: payment.dueDate < todayISO() ? "overdue" : "pending" };
}

function isPaymentPaused(payment: Payment, students: Student[]) {
  if (payment.status === "paid") return false;
  return isStudentFrozen(students.find((item) => item.id === payment.studentId));
}

export function getStudentFinance(student: Student, payments: Payment[]): StudentFinance {
  const rows = payments.filter((p) => p.studentId === student.id);
  const paid = rows.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const overdueRows = isStudentFrozen(student) ? [] : rows.filter((p) => p.status === "overdue");
  const total = student.agreementTotal || rows.reduce((sum, p) => sum + p.amount, 0);
  return {
    total,
    paid,
    remaining: Math.max(total - paid, 0),
    overdueAmount: overdueRows.reduce((sum, p) => sum + p.amount, 0),
    overdueCount: overdueRows.length,
    installmentCount: rows.filter((p) => p.kind === "installment").length,
    paidCount: rows.filter((p) => p.status === "paid").length,
    pendingCount: rows.filter((p) => p.status === "pending").length,
  };
}

export function studentHasDebt(finance: StudentFinance) {
  return finance.remaining > 0;
}

export function studentIsOverdue(finance: StudentFinance) {
  return finance.overdueCount > 0;
}

export type CollectionInput = {
  studentId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  note: string;
};

export type CollectionResult = {
  payments: Payment[];
  coveredCount: number;
  extraAmount: number;
};

/**
 * Applies a lump-sum collection to a student's oldest outstanding (pending/overdue)
 * installments first — deducting from their debt — and books any leftover amount
 * that doesn't fully cover the next installment as a separate realized income row.
 */
export function applyCollectionToPayments(payments: Payment[], input: CollectionInput): CollectionResult {
  const { studentId, amount, date, method, note } = input;
  const outstanding = getStudentPayments(payments, studentId).filter((p) => p.status !== "paid");

  let remaining = amount;
  const paidIds = new Set<string>();
  for (const p of outstanding) {
    if (remaining < p.amount) break;
    paidIds.add(p.id);
    remaining -= p.amount;
  }

  const updated = payments.map((p) =>
    paidIds.has(p.id) ? { ...p, paidAt: date, method, status: "paid" as const } : p,
  );

  if (remaining <= 0) {
    return { payments: updated, coveredCount: paidIds.size, extraAmount: 0 };
  }

  const extraNote =
    paidIds.size > 0
      ? `${note || "Tahsilat"} (kalan/ek tutar)`
      : note || "Aidat tahsilatı";

  const extra: Payment = {
    id: uid("pay"),
    studentId,
    amount: remaining,
    dueDate: date,
    paidAt: date,
    method,
    note: extraNote,
    kind: "other",
    installmentNo: null,
    status: "paid",
  };

  return { payments: [extra, ...updated], coveredCount: paidIds.size, extraAmount: remaining };
}

export function buildInstallmentPlanPayments(student: Student, plan: PaymentPlanInput): Payment[] {
  const remaining = Math.max(student.agreementTotal - plan.downPayment, 0);
  const parts = splitEqual(remaining, plan.installmentCount);
  const payments: Payment[] = [];

  if (plan.downPayment > 0) {
    payments.push({
      id: uid("pay"),
      studentId: student.id,
      amount: plan.downPayment,
      dueDate: todayISO(),
      paidAt: plan.markDownPaymentPaid ? todayISO() : null,
      status: "pending",
      method: plan.markDownPaymentPaid ? "nakit" : null,
      note: "Peşinat",
      kind: "down_payment",
      installmentNo: null,
    });
  }

  parts.forEach((amount, idx) => {
    payments.push({
      id: uid("pay"),
      studentId: student.id,
      amount,
      dueDate: addMonths(plan.firstInstallmentDate, idx),
      paidAt: null,
      status: "pending",
      method: null,
      note: `${idx + 1}. Taksit`,
      kind: "installment",
      installmentNo: idx + 1,
    });
  });

  return payments;
}

export type DashboardStats = {
  expectedThisMonth: number;
  realizedThisMonth: number;
  remainingThisMonth: number;
  totalOverdueDebt: number;
  expensesThisMonth: number;
  netThisMonth: number;
};

export type PeriodGranularity = "month" | "year";

export type PeriodReport = {
  expected: number;
  realized: number;
  remaining: number;
  expenses: number;
  net: number;
};

function periodBucket(dateStr: string, granularity: PeriodGranularity) {
  return granularity === "month" ? monthKey(dateStr) : dateStr.slice(0, 4);
}

function overdueCarryover(payments: Payment[], month: string, students: Student[]) {
  return payments.filter(
    (p) => p.status === "overdue" && monthKey(p.dueDate) < month && !isPaymentPaused(p, students),
  );
}

export function getPeriodReport(data: AppData, granularity: PeriodGranularity): PeriodReport {
  const today = todayISO();
  const bucket = periodBucket(today, granularity);
  const due = data.payments.filter(
    (p) => periodBucket(p.dueDate, granularity) === bucket && !isPaymentPaused(p, data.students),
  );
  const carryover = granularity === "month" ? overdueCarryover(data.payments, monthKey(today), data.students) : [];
  const expected = due.reduce((sum, p) => sum + p.amount, 0);
  const realized = data.payments
    .filter((p) => p.paidAt && periodBucket(p.paidAt, granularity) === bucket)
    .reduce((sum, p) => sum + p.amount, 0);
  const remaining =
    due.filter((p) => p.status !== "paid").reduce((sum, p) => sum + p.amount, 0) +
    carryover.reduce((sum, p) => sum + p.amount, 0);
  const expenses = data.expenses
    .filter((e) => periodBucket(e.date, granularity) === bucket)
    .reduce((sum, e) => sum + e.amount, 0);
  return { expected, realized, remaining, expenses, net: realized - expenses };
}

export function getDashboardStats(data: AppData): DashboardStats {
  const month = getPeriodReport(data, "month");
  const totalOverdueDebt = data.payments
    .filter((p) => p.status === "overdue" && !isPaymentPaused(p, data.students))
    .reduce((sum, p) => sum + p.amount, 0);
  return {
    expectedThisMonth: month.expected,
    realizedThisMonth: month.realized,
    remainingThisMonth: month.remaining,
    totalOverdueDebt,
    expensesThisMonth: month.expenses,
    netThisMonth: month.net,
  };
}

export type MonthlySeriesPoint = {
  key: string;
  label: string;
  expected: number;
  realized: number;
  expenses: number;
};

export function getMonthlySeries(data: AppData, monthsBack = 6): MonthlySeriesPoint[] {
  const today = todayISO();
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const keys: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(year, month - 1 - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys.map((key) => {
    const expected = data.payments
      .filter((p) => monthKey(p.dueDate) === key && (p.status === "paid" || !isPaymentPaused(p, data.students)))
      .reduce((sum, p) => sum + p.amount, 0);
    const realized = data.payments
      .filter((p) => p.paidAt && monthKey(p.paidAt) === key)
      .reduce((sum, p) => sum + p.amount, 0);
    const expenses = data.expenses
      .filter((e) => monthKey(e.date) === key)
      .reduce((sum, e) => sum + e.amount, 0);
    return { key, label: formatMonthLabel(key), expected, realized, expenses };
  });
}

export type ExpenseBreakdownItem = {
  category: string;
  amount: number;
  percent: number;
};

export function getExpenseBreakdown(expenses: Expense[]): ExpenseBreakdownItem[] {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const map = new Map<string, number>();
  expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount, percent: total ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export type CashBankSummary = {
  cash: number;
  bank: number;
};

export function getCashBankSummary(data: AppData): CashBankSummary {
  const paidAidatBy = (method: PaymentMethod) =>
    data.payments
      .filter((p) => p.status === "paid" && p.method === method)
      .reduce((sum, p) => sum + p.amount, 0);

  return {
    cash: paidAidatBy("nakit"),
    bank: paidAidatBy("kart"),
  };
}

export type CollectionPerformance = {
  onTime: number;
  late: number;
  overdue: number;
  onTimeRate: number;
  lateRate: number;
  overdueRate: number;
  total: number;
};

export function getCollectionPerformance(payments: Payment[]): CollectionPerformance {
  const paid = payments.filter((p) => p.status === "paid");
  const onTime = paid.filter((p) => (p.paidAt as string) <= p.dueDate).length;
  const late = paid.length - onTime;
  const overdue = payments.filter((p) => p.status === "overdue").length;
  const total = paid.length + overdue;
  return {
    onTime,
    late,
    overdue,
    onTimeRate: total ? (onTime / total) * 100 : 0,
    lateRate: total ? (late / total) * 100 : 0,
    overdueRate: total ? (overdue / total) * 100 : 0,
    total,
  };
}

export function getUpcomingPayments(data: AppData, days: number) {
  const today = todayISO();
  const cutoff = addDays(today, days);
  return data.payments
    .filter(
      (p) =>
        p.status !== "paid" &&
        p.dueDate >= today &&
        p.dueDate <= cutoff &&
        !isPaymentPaused(p, data.students),
    )
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getOverduePayments(data: AppData) {
  return data.payments
    .filter((p) => p.status === "overdue" && !isPaymentPaused(p, data.students))
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export type OverdueStudentSummary = {
  studentId: string;
  count: number;
  total: number;
  oldestDue: string;
};

export function getOverdueByStudent(data: AppData): OverdueStudentSummary[] {
  const groups = new Map<string, OverdueStudentSummary>();
  for (const payment of getOverduePayments(data)) {
    const existing = groups.get(payment.studentId);
    if (!existing) {
      groups.set(payment.studentId, {
        studentId: payment.studentId,
        count: 1,
        total: payment.amount,
        oldestDue: payment.dueDate,
      });
      continue;
    }
    existing.count += 1;
    existing.total += payment.amount;
    if (payment.dueDate < existing.oldestDue) existing.oldestDue = payment.dueDate;
  }
  return Array.from(groups.values()).sort(
    (a, b) => b.total - a.total || a.oldestDue.localeCompare(b.oldestDue),
  );
}

export function computeTeacherAccrual(
  payType: TeacherPayType,
  monthlySalary: number,
  hourlyRate: number,
  hours: number,
) {
  if (payType === "fixed") return Math.max(0, monthlySalary);
  return Math.max(0, hourlyRate * hours);
}

export function buildTeacherAccrualNote(
  fullName: string,
  month: string,
  payType: TeacherPayType,
  monthlySalary: number,
  hourlyRate: number,
  hours: number,
) {
  const period = formatMonthLong(month);
  if (payType === "hourly") {
    return `${fullName} - ${period} Hakedişi [${hours} Sa x ${formatMoney(hourlyRate)}]`;
  }
  return `${fullName} - ${period} Hakedişi [Sabit maaş ${formatMoney(monthlySalary)}]`;
}

export type ClassroomRevenueRow = {
  classroom: string;
  studentCount: number;
  expectedMonthly: number;
  collected: number;
  ratio: number;
};

export function getClassroomRevenueRows(data: AppData, month: string): ClassroomRevenueRow[] {
  const byClass = new Map<string, Student[]>();
  data.students.forEach((student) => {
    const key = student.classroom.trim() || "Sınıf belirtilmedi";
    const list = byClass.get(key) ?? [];
    list.push(student);
    byClass.set(key, list);
  });

  const rows: ClassroomRevenueRow[] = [];
  byClass.forEach((students, classroom) => {
    const active = students.filter((s) => s.status === "active");
    const studentCount = active.length;
    const ids = new Set(students.map((s) => s.id));
    const expectedMonthly = data.payments
      .filter(
        (p) =>
          ids.has(p.studentId) &&
          !isPaymentPaused(p, data.students) &&
          (monthKey(p.dueDate) === month || (p.status === "overdue" && monthKey(p.dueDate) < month)),
      )
      .reduce((sum, p) => sum + p.amount, 0);
    const collected = data.payments
      .filter((p) => p.status === "paid" && p.paidAt && monthKey(p.paidAt) === month && ids.has(p.studentId))
      .reduce((sum, p) => sum + p.amount, 0);
    if (studentCount === 0 && expectedMonthly === 0 && collected === 0) return;
    const ratio = expectedMonthly > 0 ? (collected / expectedMonthly) * 100 : collected > 0 ? 100 : 0;
    rows.push({ classroom, studentCount, expectedMonthly, collected, ratio });
  });

  return rows.sort(
    (a, b) =>
      b.expectedMonthly - a.expectedMonthly ||
      b.collected - a.collected ||
      a.classroom.localeCompare(b.classroom, "tr"),
  );
}

function monthIndex(key: string) {
  const [year, month] = key.split("-").map(Number);
  return year * 12 + (month - 1);
}

function foldTr(value: string) {
  return value
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .toLowerCase();
}

function titleHas(title: string, needle: string) {
  return foldTr(title).includes(foldTr(needle));
}

function isVergiExpense(expense: Expense) {
  return expense.category === "Vergi Ödemesi" || titleHas(expense.title, "vergi");
}

function isSigortaExpense(expense: Expense) {
  return expense.category === "Sigorta Ödemesi" || titleHas(expense.title, "sigorta");
}

function isInstallmentExpense(expense: Expense) {
  return isVergiExpense(expense) || isSigortaExpense(expense);
}

function isTeacherPayrollExpense(expense: Expense) {
  return titleHas(expense.title, "hakedis");
}

function earliestMonth(expenses: Expense[]) {
  return expenses.reduce<string | null>((min, expense) => {
    const key = monthKey(expense.date);
    if (!min || key < min) return key;
    return min;
  }, null);
}

export function retitleInstallmentExpenses(expenses: Expense[]): Expense[] {
  const vergiFirst = earliestMonth(expenses.filter(isVergiExpense));
  const sigortaFirst = earliestMonth(expenses.filter(isSigortaExpense));
  if (!vergiFirst && !sigortaFirst) return expenses;

  let changed = false;
  const next = expenses.map((expense) => {
    if (isVergiExpense(expense) && vergiFirst) {
      const n = monthIndex(monthKey(expense.date)) - monthIndex(vergiFirst) + 1;
      const title = `VERGİ ${n}. TAKSİTİ`;
      if (expense.title !== title) {
        changed = true;
        return { ...expense, title };
      }
    } else if (isSigortaExpense(expense) && sigortaFirst) {
      const n = monthIndex(monthKey(expense.date)) - monthIndex(sigortaFirst) + 1;
      const title = `SİGORTA ÖDEMESİ ${n}. TAKSİT`;
      if (expense.title !== title) {
        changed = true;
        return { ...expense, title };
      }
    }
    return expense;
  });

  return changed ? next : expenses;
}

export function expandFixedExpensesUntil(expenses: Expense[], untilDate: string): Expense[] {
  const generated: Expense[] = [];

  for (const source of expenses) {
    if (isTeacherPayrollExpense(source)) continue;
    const sourceMonth = monthKey(source.date);
    let cursor = addMonths(source.date, 1);
    while (cursor < untilDate) {
      const targetMonth = monthKey(cursor);
      const shift = monthIndex(targetMonth) - monthIndex(sourceMonth);
      const title = isInstallmentExpense(source)
        ? isVergiExpense(source)
          ? `VERGİ ${shift + 1}. TAKSİTİ`
          : `SİGORTA ÖDEMESİ ${shift + 1}. TAKSİT`
        : source.title;
      const exists = [...expenses, ...generated].some(
        (e) =>
          monthKey(e.date) === targetMonth &&
          e.category === source.category &&
          e.amount === source.amount &&
          e.method === source.method,
      );
      if (!exists) {
        generated.push({
          ...source,
          id: uid("ex"),
          title,
          date: cursor,
        });
      }
      cursor = addMonths(cursor, 1);
    }
  }

  return generated.length ? [...generated, ...expenses] : expenses;
}
