import { Routes, Route, Navigate } from "react-router-dom";

import SplashPage from "../pages/Splash/SplashPage";
import LoginPage from "../pages/Auth/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import AttendancePage from "../pages/Attendance/AttendancePage";
import LeavePage from "../pages/Leave/LeavePage";
import ProfilePage from "../pages/Profile/ProfilePage";
import ExpensePage from "../pages/Expense/ExpensePage";
import SalaryPage from "../pages/Salary/SalaryPage";
import TaskPage from "../pages/Task/TaskPage";
import DocumentsPage from "../pages/Documents/DocumentsPage";
import NotificationsPage from "../pages/Notifications/NotificationsPage";
import HolidayActivityPage from "../pages/Holiday/HolidayActivityPage";
import ReportsPage from "../pages/Reports/ReportsPage";
import SettingsPage from "../pages/Settings/SettingsPage";
import TravelPage from "../pages/Travel/TravelPage";
import LoanPage from "../pages/Loan/LoanPage";
import MagicNavPage from "../pages/MagicNav/MagicNavPage";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import PrintFormatSettings from "../pages/Admin/PrintFormatSettings";

import AuthenticatedLayout from "./AuthenticatedLayout";
import ComingSoon from "../components/ComingSoon";
import RouteGuard from "./RouteGuard";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin-only routes */}
      <Route element={<RouteGuard allowedType="admin" />}>
        <Route path="/admin/print-settings" element={<PrintFormatSettings />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Route>

      {/* Employee-only routes */}
      <Route element={<RouteGuard allowedType="employee" />}>
        <Route path="/dashboard" element={<AuthenticatedLayout><DashboardPage /></AuthenticatedLayout>} />
        <Route path="/attendance" element={<AuthenticatedLayout><AttendancePage /></AuthenticatedLayout>} />
        <Route path="/notifications" element={<AuthenticatedLayout><NotificationsPage /></AuthenticatedLayout>} />
        <Route path="/profile" element={<AuthenticatedLayout><ProfilePage /></AuthenticatedLayout>} />
        <Route path="/settings" element={<AuthenticatedLayout><SettingsPage /></AuthenticatedLayout>} />
        <Route path="/holiday" element={<AuthenticatedLayout><HolidayActivityPage /></AuthenticatedLayout>} />
        <Route path="/leave" element={<AuthenticatedLayout><LeavePage /></AuthenticatedLayout>} />
        <Route path="/expense" element={<AuthenticatedLayout><ExpensePage /></AuthenticatedLayout>} />
        <Route path="/salary" element={<AuthenticatedLayout><SalaryPage /></AuthenticatedLayout>} />
        <Route path="/tasks" element={<AuthenticatedLayout><ComingSoon title="Tasks"><TaskPage /></ComingSoon></AuthenticatedLayout>} />
        <Route path="/documents" element={<AuthenticatedLayout><ComingSoon title="Documents"><DocumentsPage /></ComingSoon></AuthenticatedLayout>} />
        <Route path="/reports" element={<AuthenticatedLayout><ComingSoon title="Reports"><ReportsPage /></ComingSoon></AuthenticatedLayout>} />
        <Route path="/travel" element={<AuthenticatedLayout><ComingSoon title="Travel Requests"><TravelPage /></ComingSoon></AuthenticatedLayout>} />
        <Route path="/loan" element={<AuthenticatedLayout><ComingSoon title="Loans"><LoanPage /></ComingSoon></AuthenticatedLayout>} />
        <Route path="/magic-nav" element={<AuthenticatedLayout><MagicNavPage /></AuthenticatedLayout>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
