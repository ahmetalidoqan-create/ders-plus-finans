import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  AppSettings,
  Expense,
  Payment,
  PaymentPlanInput,
  Student,
  StudentDraft,
  Teacher,
  TeacherLesson,
} from "@/types";
import {
  CURRENT_DATA_VERSION,
  DATA_KEY,
  clearFinanceStorage,
  emptyAppData,
  hasStoredAppData,
  hasUserFinanceRecords,
  loadJson,
  persistAppData,
  seedData,
} from "@/lib/storage";
import { monthKey, todayISO, uid } from "@/lib/format";
import { FIXED_EXPENSES_UNTIL, withFixedTeachers } from "@/lib/constants";
import {
  applyCollectionToPayments,
  buildInstallmentPlanPayments,
  expandFixedExpensesUntil,
  retitleInstallmentExpenses,
  type CollectionInput,
  type CollectionResult,
} from "@/lib/finance";

type AppDataContextValue = {
  data: AppData;
  addStudent: (student: StudentDraft) => void;
  updateStudent: (student: Student) => void;
  addPayment: (payment: Omit<Payment, "id" | "status"> & { status?: Payment["status"] }) => void;
  markPaymentPaid: (id: string, method: NonNullable<Payment["method"]>) => void;
  collectFromStudent: (input: CollectionInput) => CollectionResult;
  collectInstallment: (paymentId: string, input: { date: string; method: NonNullable<Payment["method"]>; note?: string }) => void;
  deletePaymentCollection: (paymentId: string) => void;
  deletePayment: (paymentId: string) => void;
  addExpense: (expense: Omit<Expense, "id">) => void;
  addTeacherPayroll: (teacher: Omit<Teacher, "id"> & { id?: string }, expense: Omit<Expense, "id">) => void;
  updateTeacher: (teacher: Teacher) => void;
  upsertTeacherLesson: (lesson: Omit<TeacherLesson, "id"> & { id?: string }) => void;
  deleteTeacherLesson: (id: string) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;
  generateInstallmentPlan: (studentId: string, plan: PaymentPlanInput) => void;
  resetDemo: () => void;
  clearAllData: () => void;
  importData: (incoming: AppData) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function withDerivedStatus(payment: Payment): Payment {
  if (payment.paidAt) return { ...payment, status: "paid" };
  const overdue = payment.dueDate < todayISO();
  return { ...payment, status: overdue ? "overdue" : "pending" };
}

const LEGACY_CATEGORY_MAP: Record<string, string> = {
  Malzeme: "Kırtasiye/Malzeme",
  Fatura: "Faturalar",
  Personel: "Personel/Maaş",
};

function normalizeExpense(expense: Expense): Expense {
  const category = LEGACY_CATEGORY_MAP[expense.category] ?? expense.category;
  const method = expense.method ?? "nakit";
  return { ...expense, category, method };
}

function normalizeStudent(student: Student): Student {
  return {
    ...student,
    photoUrl: student.photoUrl === undefined ? null : student.photoUrl,
    parentPhone: student.parentPhone ?? "",
  };
}

function migrateLoadedData(loaded: Partial<AppData> & { students?: Student[]; payments?: Payment[]; expenses?: Expense[] }): AppData {
  return {
    version: CURRENT_DATA_VERSION,
    settings: { ...seedData.settings, ...loaded.settings },
    students: (loaded.students ?? []).map(normalizeStudent),
    payments: (loaded.payments ?? []).map(withDerivedStatus),
    expenses: (loaded.expenses ?? []).map(normalizeExpense),
    teachers: withFixedTeachers(loaded.teachers),
    teacherLessons: Array.isArray((loaded as AppData).teacherLessons) ? (loaded as AppData).teacherLessons : [],
  };
}

function ensureFixedExpenses(data: AppData): AppData {
  let expenses = data.expenses;
  let settings = data.settings;
  if (settings.fixedExpensesUntil !== FIXED_EXPENSES_UNTIL && expenses.length > 0) {
    expenses = expandFixedExpensesUntil(expenses, FIXED_EXPENSES_UNTIL);
    settings = { ...settings, fixedExpensesUntil: FIXED_EXPENSES_UNTIL };
  }
  expenses = retitleInstallmentExpenses(expenses);
  if (expenses === data.expenses && settings === data.settings) return data;
  return { ...data, expenses, settings };
}

function loadInitialData(): AppData {
  const loaded = loadJson<unknown>(DATA_KEY, null);
  if (!hasStoredAppData(loaded) || !hasUserFinanceRecords(loaded)) {
    return emptyAppData(hasStoredAppData(loaded) ? loaded.settings : undefined);
  }
  const base = migrateLoadedData(loaded);
  const next = ensureFixedExpenses(base);
  if (next !== base) persistAppData(next);
  return next;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadInitialData);

  const persist = useCallback((next: AppData) => {
    setData(next);
    persistAppData(next);
  }, []);

  const addStudent = useCallback(
    (student: StudentDraft) => {
      persist({ ...data, students: [{ ...student, id: uid("st") }, ...data.students] });
    },
    [data, persist],
  );

  const updateStudent = useCallback(
    (student: Student) => {
      persist({ ...data, students: data.students.map((s) => (s.id === student.id ? student : s)) });
    },
    [data, persist],
  );

  const addPayment = useCallback(
    (payment: Omit<Payment, "id" | "status"> & { status?: Payment["status"] }) => {
      const next = withDerivedStatus({ ...payment, id: uid("pay"), status: "pending" });
      persist({ ...data, payments: [next, ...data.payments] });
    },
    [data, persist],
  );

  const markPaymentPaid = useCallback(
    (id: string, method: NonNullable<Payment["method"]>) => {
      persist({
        ...data,
        payments: data.payments.map((p) =>
          p.id === id ? withDerivedStatus({ ...p, paidAt: todayISO(), method }) : p,
        ),
      });
    },
    [data, persist],
  );

  const collectFromStudent = useCallback(
    (input: CollectionInput) => {
      const result = applyCollectionToPayments(data.payments, input);
      persist({ ...data, payments: result.payments });
      return result;
    },
    [data, persist],
  );

  const collectInstallment = useCallback(
    (paymentId: string, input: { date: string; method: NonNullable<Payment["method"]>; note?: string }) => {
      persist({
        ...data,
        payments: data.payments.map((p) =>
          p.id === paymentId
            ? withDerivedStatus({
                ...p,
                paidAt: input.date,
                method: input.method,
                note: input.note?.trim() ? input.note.trim() : p.note,
              })
            : p,
        ),
      });
    },
    [data, persist],
  );

  const deletePaymentCollection = useCallback(
    (paymentId: string) => {
      const payment = data.payments.find((p) => p.id === paymentId);
      if (!payment) return;
      if (payment.kind === "other") {
        persist({ ...data, payments: data.payments.filter((p) => p.id !== paymentId) });
        return;
      }
      persist({
        ...data,
        payments: data.payments.map((p) =>
          p.id === paymentId ? withDerivedStatus({ ...p, paidAt: null, method: null }) : p,
        ),
      });
    },
    [data, persist],
  );

  const deletePayment = useCallback(
    (paymentId: string) => {
      persist({ ...data, payments: data.payments.filter((p) => p.id !== paymentId) });
    },
    [data, persist],
  );

  const addExpense = useCallback(
    (expense: Omit<Expense, "id">) => {
      persist({ ...data, expenses: [{ ...expense, id: uid("ex") }, ...data.expenses] });
    },
    [data, persist],
  );

  const addTeacherPayroll = useCallback(
    (draft: Omit<Teacher, "id"> & { id?: string }, expense: Omit<Expense, "id">) => {
      const teacher: Teacher = {
        id: draft.id ?? uid("tch"),
        fullName: draft.fullName.trim(),
        payType: draft.payType,
        monthlySalary: draft.payType === "fixed" ? draft.monthlySalary : 0,
        hourlyRate: draft.payType === "hourly" ? draft.hourlyRate : 0,
      };
      const teachers = data.teachers.some((t) => t.id === teacher.id)
        ? data.teachers.map((t) => (t.id === teacher.id ? teacher : t))
        : [teacher, ...data.teachers];
      const existing = data.expenses.find(
        (e) => e.title === expense.title && monthKey(e.date) === monthKey(expense.date),
      );
      persist({
        ...data,
        teachers,
        expenses: existing
          ? data.expenses.map((e) => (e.id === existing.id ? { ...expense, id: existing.id } : e))
          : [{ ...expense, id: uid("ex") }, ...data.expenses],
      });
    },
    [data, persist],
  );

  const updateTeacher = useCallback(
    (teacher: Teacher) => {
      persist({
        ...data,
        teachers: data.teachers.some((t) => t.id === teacher.id)
          ? data.teachers.map((t) => (t.id === teacher.id ? teacher : t))
          : [teacher, ...data.teachers],
      });
    },
    [data, persist],
  );

  const upsertTeacherLesson = useCallback(
    (draft: Omit<TeacherLesson, "id"> & { id?: string }) => {
      const lesson: TeacherLesson = {
        id: draft.id ?? uid("les"),
        teacherId: draft.teacherId,
        date: draft.date,
        hours: draft.hours,
        note: draft.note ?? "",
      };
      const sameDay = data.teacherLessons.find(
        (item) => item.teacherId === lesson.teacherId && item.date === lesson.date && item.id !== lesson.id,
      );
      const next = sameDay
        ? data.teacherLessons.map((item) => (item.id === sameDay.id ? { ...lesson, id: sameDay.id } : item))
        : data.teacherLessons.some((item) => item.id === lesson.id)
          ? data.teacherLessons.map((item) => (item.id === lesson.id ? lesson : item))
          : [lesson, ...data.teacherLessons];
      persist({ ...data, teacherLessons: next });
    },
    [data, persist],
  );

  const deleteTeacherLesson = useCallback(
    (id: string) => persist({ ...data, teacherLessons: data.teacherLessons.filter((item) => item.id !== id) }),
    [data, persist],
  );

  const updateExpense = useCallback(
    (expense: Expense) => {
      persist({ ...data, expenses: data.expenses.map((e) => (e.id === expense.id ? expense : e)) });
    },
    [data, persist],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      persist({ ...data, expenses: data.expenses.filter((e) => e.id !== id) });
    },
    [data, persist],
  );

  const updateSettings = useCallback(
    (settings: AppSettings) => persist({ ...data, settings }),
    [data, persist],
  );

  const generateInstallmentPlan = useCallback(
    (studentId: string, plan: PaymentPlanInput) => {
      const student = data.students.find((s) => s.id === studentId);
      if (!student) return;
      const updatedStudent: Student = {
        ...student,
        downPayment: plan.downPayment,
        installmentCount: plan.installmentCount,
        firstInstallmentDate: plan.firstInstallmentDate,
      };
      const newPayments = buildInstallmentPlanPayments(updatedStudent, plan).map(withDerivedStatus);
      const otherPayments = data.payments.filter((p) => p.studentId !== studentId);
      persist({
        ...data,
        students: data.students.map((s) => (s.id === studentId ? updatedStudent : s)),
        payments: [...newPayments, ...otherPayments],
      });
    },
    [data, persist],
  );

  const resetDemo = useCallback(() => persist(migrateLoadedData(seedData)), [persist]);

  const clearAllData = useCallback(() => {
    clearFinanceStorage();
    setData({
      ...emptyAppData(data.settings),
      students: [],
      payments: [],
      expenses: [],
      teacherLessons: [],
    });
  }, [data.settings]);

  const importData = useCallback(
    (incoming: AppData) => {
      persist(
        ensureFixedExpenses({
          ...incoming,
          version: CURRENT_DATA_VERSION,
          settings: { ...seedData.settings, ...incoming.settings },
          students: incoming.students.map(normalizeStudent),
          payments: incoming.payments.map(withDerivedStatus),
          expenses: incoming.expenses.map(normalizeExpense),
          teachers: withFixedTeachers(incoming.teachers),
          teacherLessons: Array.isArray(incoming.teacherLessons) ? incoming.teacherLessons : [],
        }),
      );
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      data,
      addStudent,
      updateStudent,
      addPayment,
      markPaymentPaid,
      collectFromStudent,
      collectInstallment,
      deletePaymentCollection,
      deletePayment,
      addExpense,
      addTeacherPayroll,
      updateTeacher,
      upsertTeacherLesson,
      deleteTeacherLesson,
      updateExpense,
      deleteExpense,
      updateSettings,
      generateInstallmentPlan,
      resetDemo,
      clearAllData,
      importData,
    }),
    [
      data,
      addStudent,
      updateStudent,
      addPayment,
      markPaymentPaid,
      collectFromStudent,
      collectInstallment,
      deletePaymentCollection,
      deletePayment,
      addExpense,
      addTeacherPayroll,
      updateTeacher,
      upsertTeacherLesson,
      deleteTeacherLesson,
      updateExpense,
      deleteExpense,
      updateSettings,
      generateInstallmentPlan,
      resetDemo,
      clearAllData,
      importData,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
