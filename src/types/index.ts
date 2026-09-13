export type StudentStatus = "active" | "frozen";
export type PaymentStatus = "paid" | "pending" | "overdue";
export type PaymentMethod = "nakit" | "havale" | "kart";
export type PaymentKind = "down_payment" | "installment" | "other";

export type Student = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  classroom: string;
  course: string;
  monthlyFee: number;
  agreementTotal: number;
  downPayment: number;
  installmentCount: number;
  firstInstallmentDate: string | null;
  status: StudentStatus;
  joinedAt: string;
  photoUrl: string | null;
};

export type Payment = {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: PaymentStatus;
  method: PaymentMethod | null;
  note: string;
  kind: PaymentKind;
  installmentNo: number | null;
};

export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  note: string;
  method: PaymentMethod;
};

export type TeacherPayType = "fixed" | "hourly";

export type Teacher = {
  id: string;
  fullName: string;
  payType: TeacherPayType;
  monthlySalary: number;
  hourlyRate: number;
};

export type TeacherLesson = {
  id: string;
  teacherId: string;
  date: string;
  hours: number;
  note: string;
};

export type AppSettings = {
  academyName: string;
  city: string;
  currency: "TRY";
  logoIcon: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  fixedExpensesUntil?: string;
};

export type AppData = {
  version: 3;
  students: Student[];
  payments: Payment[];
  expenses: Expense[];
  teachers: Teacher[];
  teacherLessons: TeacherLesson[];
  settings: AppSettings;
};

export type AdminUser = {
  email: string;
  name: string;
};

export type PaymentPlanInput = {
  downPayment: number;
  installmentCount: number;
  firstInstallmentDate: string;
  markDownPaymentPaid: boolean;
};

export type StudentDraft = Omit<Student, "id">;
