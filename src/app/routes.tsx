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

import AuthenticatedLayout from "./AuthenticatedLayout";

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
        path="/leave"
        element={
          <AuthenticatedLayout>
            <LeavePage />
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
        path="/expense"
        element={
          <AuthenticatedLayout>
            <ExpensePage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/salary"
        element={
          <AuthenticatedLayout>
            <SalaryPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/tasks"
        element={
          <AuthenticatedLayout>
            <TaskPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/documents"
        element={
          <AuthenticatedLayout>
            <DocumentsPage />
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
        path="/holiday"
        element={
          <AuthenticatedLayout>
            <HolidayActivityPage />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <AuthenticatedLayout>
            <ReportsPage />
          </AuthenticatedLayout>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
