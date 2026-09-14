import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { useAuth } from "@/context/AuthContext";
import { CURRENT_DATA_VERSION, emptyAppData, seedData } from "@/lib/storage";
import {
  clearFinanceInSupabase,
  loadAppDataFromSupabase,
  subscribeToFinanceChanges,
  syncAppDataToSupabase,
} from "@/lib/supabaseRepo";
import { monthKey, todayISO, uid } from "@/lib/format";
import { FIXED_EXPENSES_UNTIL, withFixedTeachers } from "@/lib/constants";
import {
  applyCollectionToPayments,
  applyInstallmentCollection,
  clearStudentCollections,
  revertInstallmentCollection,
  updatePaymentCollection,
  buildInstallmentPlanPayments,
  expandFixedExpensesUntil,
  retitleInstallmentExpenses,
  withPaymentStatus,
  type CollectionInput,
  type CollectionResult,
  type InstallmentCollectionInput,
} from "@/lib/finance";

type AppDataContextValue = {
  data: AppData;
  loading: boolean;
  syncError: string | null;
  addStudent: (student: StudentDraft) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  addPayment: (payment: Omit<Payment, "id" | "status"> & { status?: Payment["status"] }) => void;
  markPaymentPaid: (id: string, method: NonNullable<Payment["method"]>) => void;
  collectFromStudent: (input: CollectionInput) => CollectionResult;
  collectInstallment: (paymentId: string, input: InstallmentCollectionInput) => void;
  updatePaymentCollection: (paymentId: string, input: InstallmentCollectionInput) => void;
  deletePaymentCollection: (paymentId: string) => void;
  clearStudentCollections: (studentId: string) => void;
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
    parentName: student.parentName ?? "",
    parentPhone: student.parentPhone ?? "",
    phone: student.phone ?? "",
    monthlyFee: student.monthlyFee ?? 0,
    status: student.status === "frozen" || (student.status as string) === "inactive" ? "frozen" : "active",
  };
}

function migrateLoadedData(loaded: Partial<AppData> & { students?: Student[]; payments?: Payment[]; expenses?: Expense[] }): AppData {
  const students = (loaded.students ?? []).map(normalizeStudent);
  return {
    version: CURRENT_DATA_VERSION,
    settings: { ...seedData.settings, ...loaded.settings },
    students,
    payments: (loaded.payments ?? []).map((payment) => withPaymentStatus(payment, students)),
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

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(() => emptyAppData());
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const writingRef = useRef(false);

  const persist = useCallback((next: AppData) => {
    setData(next);
    writingRef.current = true;
    void syncAppDataToSupabase(next)
      .then(() => setSyncError(null))
      .catch((error: unknown) => {
        setSyncError(error instanceof Error ? error.message : "Supabase kaydı başarısız.");
      })
      .finally(() => {
        window.setTimeout(() => {
          writingRef.current = false;
        }, 400);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const remote = migrateLoadedData(await loadAppDataFromSupabase());
        if (cancelled) return;
        const next = ensureFixedExpenses(remote);
        setData(next);
        setSyncError(null);
        if (next !== remote) {
          writingRef.current = true;
          await syncAppDataToSupabase(next);
          writingRef.current = false;
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : "Supabase verileri yüklenemedi.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void hydrate();
    const unsubscribe = subscribeToFinanceChanges(() => {
      if (writingRef.current) return;
      void hydrate();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  const addStudent = useCallback(
    (student: StudentDraft) => {
      persist({ ...data, students: [{ ...student, id: uid("st") }, ...data.students] });
    },
    [data, persist],
  );

  const updateStudent = useCallback(
    (student: Student) => {
      const students = data.students.map((s) => (s.id === student.id ? student : s));
      persist({
        ...data,
        students,
        payments: data.payments.map((payment) => withPaymentStatus(payment, students)),
      });
    },
    [data, persist],
  );

  const deleteStudent = useCallback(
    (id: string) => {
      persist({
        ...data,
        students: data.students.filter((s) => s.id !== id),
        payments: data.payments.filter((p) => p.studentId !== id),
      });
    },
    [data, persist],
  );

  const addPayment = useCallback(
    (payment: Omit<Payment, "id" | "status"> & { status?: Payment["status"] }) => {
      const next = withPaymentStatus({ ...payment, id: uid("pay"), status: "pending" }, data.students);
      persist({ ...data, payments: [next, ...data.payments] });
    },
    [data, persist],
  );

  const markPaymentPaid = useCallback(
    (id: string, method: NonNullable<Payment["method"]>) => {
      persist({
        ...data,
        payments: data.payments.map((p) =>
          p.id === id ? withPaymentStatus({ ...p, paidAt: todayISO(), method }, data.students) : p,
        ),
      });
    },
    [data, persist],
  );

  const collectFromStudent = useCallback(
    (input: CollectionInput) => {
      const result = applyCollectionToPayments(data.payments, input, data.students);
      persist({ ...data, payments: result.payments });
      return result;
    },
    [data, persist],
  );

  const collectInstallment = useCallback(
    (paymentId: string, input: InstallmentCollectionInput) => {
      persist({
        ...data,
        payments: applyInstallmentCollection(data.payments, paymentId, input, data.students),
      });
    },
    [data, persist],
  );

  const updatePaymentCollectionRecord = useCallback(
    (paymentId: string, input: InstallmentCollectionInput) => {
      persist({
        ...data,
        payments: updatePaymentCollection(data.payments, paymentId, input, data.students),
      });
    },
    [data, persist],
  );

  const deletePaymentCollection = useCallback(
    (paymentId: string) => {
      persist({
        ...data,
        payments: revertInstallmentCollection(data.payments, paymentId, data.students),
      });
    },
    [data, persist],
  );

  const clearStudentCollectionsRecord = useCallback(
    (studentId: string) => {
      persist({
        ...data,
        payments: clearStudentCollections(data.payments, studentId, data.students),
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
      const students = data.students.map((s) => (s.id === studentId ? updatedStudent : s));
      const newPayments = buildInstallmentPlanPayments(updatedStudent, plan).map((payment) =>
        withPaymentStatus(payment, students),
      );
      const otherPayments = data.payments.filter((p) => p.studentId !== studentId);
      persist({
        ...data,
        students,
        payments: [...newPayments, ...otherPayments],
      });
    },
    [data, persist],
  );

  const resetDemo = useCallback(() => persist(migrateLoadedData(seedData)), [persist]);

  const clearAllData = useCallback(() => {
    const next = {
      ...emptyAppData(data.settings),
      students: [] as AppData["students"],
      payments: [] as AppData["payments"],
      expenses: [] as AppData["expenses"],
      teacherLessons: [] as AppData["teacherLessons"],
    };
    setData(next);
    writingRef.current = true;
    void clearFinanceInSupabase(data.settings)
      .then(() => setSyncError(null))
      .catch((error: unknown) => {
        setSyncError(error instanceof Error ? error.message : "Supabase temizliği başarısız.");
      })
      .finally(() => {
        window.setTimeout(() => {
          writingRef.current = false;
        }, 400);
      });
  }, [data.settings]);

  const importData = useCallback(
    (incoming: AppData) => {
      const students = incoming.students.map(normalizeStudent);
      persist(
        ensureFixedExpenses({
          ...incoming,
          version: CURRENT_DATA_VERSION,
          settings: { ...seedData.settings, ...incoming.settings },
          students,
          payments: incoming.payments.map((payment) => withPaymentStatus(payment, students)),
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
      loading,
      syncError,
      addStudent,
      updateStudent,
      deleteStudent,
      addPayment,
      markPaymentPaid,
      collectFromStudent,
      collectInstallment,
      updatePaymentCollection: updatePaymentCollectionRecord,
      deletePaymentCollection,
      clearStudentCollections: clearStudentCollectionsRecord,
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
      loading,
      syncError,
      addStudent,
      updateStudent,
      deleteStudent,
      addPayment,
      markPaymentPaid,
      collectFromStudent,
      collectInstallment,
      updatePaymentCollectionRecord,
      deletePaymentCollection,
      clearStudentCollectionsRecord,
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
