import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AppDataProvider } from "@/context/AppDataContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { StudentsPage } from "@/pages/StudentsPage";
import { StudentDetailPage } from "@/pages/StudentDetailPage";
import { PaymentsPage } from "@/pages/PaymentsPage";
import { OverduePage } from "@/pages/OverduePage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TeacherPayrollPage } from "@/pages/TeacherPayrollPage";

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/ogrenciler" element={<StudentsPage />} />
                <Route path="/ogrenciler/:studentId" element={<StudentDetailPage />} />
                <Route path="/odemeler" element={<PaymentsPage />} />
                <Route path="/gecikenler" element={<OverduePage />} />
                <Route path="/giderler" element={<ExpensesPage />} />
                <Route path="/ogretmen-hakedis" element={<TeacherPayrollPage />} />
                <Route path="/raporlar" element={<ReportsPage />} />
                <Route path="/ayarlar" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </AuthProvider>
  );
}
