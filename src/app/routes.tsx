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

import AuthenticatedLayout from "./AuthenticatedLayout";
import ComingSoon from "../components/ComingSoon";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Routes */}
      <Route
        path="/dashboard"
        element={
          <AuthenticatedLayout>
            <DashboardPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/attendance"
        element={
          <AuthenticatedLayout>
            <AttendancePage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/notifications"
        element={
          <AuthenticatedLayout>
            <NotificationsPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <AuthenticatedLayout>
            <ProfilePage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthenticatedLayout>
            <SettingsPage />
          </AuthenticatedLayout>
        }
      />

      {/* Phase 2 - Advanced AlphaX - Coming Soon */}
      <Route
        path="/holiday"
        element={
          <AuthenticatedLayout>
            <ComingSoon title="Holiday & Activities">
              <HolidayActivityPage />
            </ComingSoon>
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/leave"
        element={
          <AuthenticatedLayout>
            <ComingSoon title="Leave Management">
              <LeavePage />
            </ComingSoon>
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/expense"
        element={
          <AuthenticatedLayout>
            <ComingSoon title="Expenses">
              <ExpensePage />
            </ComingSoon>
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/salary"
        element={
          <AuthenticatedLayout>
            <ComingSoon title="Salary & Payslips">
              <SalaryPage />
            </ComingSoon>
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/tasks"
        element={
          <AuthenticatedLayout>
            <ComingSoon title="Tasks">
              <TaskPage />
            </ComingSoon>
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/documents"
        element={
          <AuthenticatedLayout>
            <ComingSoon title="Documents">
              <DocumentsPage />
            </ComingSoon>
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <AuthenticatedLayout>
            <ComingSoon title="Reports">
              <ReportsPage />
            </ComingSoon>
          </AuthenticatedLayout>
        }
      />

      {/* Phase 3 - Manager Features - Coming Soon */}
      <Route
        path="/travel"
        element={
          <AuthenticatedLayout>
            <ComingSoon title="Travel Requests">
              <TravelPage />
            </ComingSoon>
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/loan"
        element={
          <AuthenticatedLayout>
            <ComingSoon title="Loans">
              <LoanPage />
            </ComingSoon>
          </AuthenticatedLayout>
        }
      />

      {/* Demo - Magic Navigation */}
      <Route
        path="/magic-nav"
        element={
          <AuthenticatedLayout>
            <MagicNavPage />
          </AuthenticatedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
