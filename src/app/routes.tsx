import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import SplashPage from "../pages/Splash/SplashPage";
import LoginPage from "../pages/Auth/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import AttendancePage from "../pages/Attendance/AttendancePage";
import AttendanceRequestListPage from "../pages/Attendance/AttendanceRequestListPage";
import AttendanceRequestDetailPage from "../pages/Attendance/AttendanceRequestDetailPage";
import NewAttendanceRequestPage from "../pages/Attendance/NewAttendanceRequestPage";
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
import AdminLeaveApprovals from "../pages/Admin/LeaveApprovals";
import AdminLeaveApprovalDetail from "../pages/Admin/LeaveApprovalDetail";
import AdminLoanApprovals from "../pages/Admin/LoanApprovals";
import AdminLoanApprovalDetail from "../pages/Admin/LoanApprovalDetail";
import TravelApprovals from "../pages/Admin/TravelApprovals";
import TravelApprovalDetail from "../pages/Admin/TravelApprovalDetail";
import AttendanceApprovals from "../pages/Admin/AttendanceApprovals";
import AttendanceApprovalDetails from "../pages/Admin/AttendanceApprovalDetails";
import TaskMonitoring from "../pages/Admin/TaskMonitoring";
import EmployeeList from "../pages/Admin/EmployeeList";
import EmployeeDetails from "../pages/Admin/EmployeeDetails";
import PrintFormatSettings from "../pages/Admin/PrintFormatSettings";

import AuthenticatedLayout from "./AuthenticatedLayout";
import ComingSoon from "../components/ComingSoon";
import RouteGuard from "./RouteGuard";
import HRRouteGuard from "./HRRouteGuard";

const HRDashboard = lazy(() => import("../pages/hr/HRDashboard"));
const LeaveApprovals = lazy(() => import("../pages/hr/LeaveApprovals"));
const ExpenseApprovals = lazy(() => import("../pages/hr/ExpenseApprovals"));
const HRNotifications = lazy(() => import("../pages/hr/HRNotifications"));
const Employees = lazy(() => import("../pages/hr/Employees"));
const LoanApprovals = lazy(() => import("../pages/hr/LoanApprovals"));
const LoanApprovalDetail = lazy(() => import("../pages/hr/LoanApprovalDetail"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin-only routes */}
      <Route element={<RouteGuard allowedType="admin" />}>
        <Route path="/admin/print-settings" element={<PrintFormatSettings />} />
        <Route path="/admin/leave-approvals" element={<AdminLeaveApprovals />} />
        <Route path="/admin/leave-approvals/:name" element={<AdminLeaveApprovalDetail />} />
        <Route path="/admin/loan-approvals" element={<AdminLoanApprovals />} />
        <Route path="/admin/loan-approvals/:name" element={<AdminLoanApprovalDetail />} />
        <Route path="/admin/travel-approvals" element={<TravelApprovals />} />
        <Route path="/admin/travel-approvals/:name" element={<TravelApprovalDetail />} />
        <Route path="/admin/attendance-approvals" element={<AttendanceApprovals />} />
        <Route path="/admin/attendance-approvals/:name" element={<AttendanceApprovalDetails />} />
        <Route path="/admin/task-monitoring" element={<TaskMonitoring />} />
        <Route path="/admin/employees" element={<EmployeeList />} />
        <Route path="/admin/employees/:name" element={<EmployeeDetails />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* Employee-only routes */}
      <Route element={<RouteGuard allowedType="employee" />}>
        <Route path="/dashboard" element={<AuthenticatedLayout><DashboardPage /></AuthenticatedLayout>} />
        <Route path="/attendance" element={<AuthenticatedLayout><AttendancePage /></AuthenticatedLayout>} />
        <Route path="/attendance/requests" element={<AuthenticatedLayout><AttendanceRequestListPage /></AuthenticatedLayout>} />
        <Route path="/attendance/requests/:name" element={<AuthenticatedLayout><AttendanceRequestDetailPage /></AuthenticatedLayout>} />
        <Route path="/attendance/requests/new" element={<AuthenticatedLayout><NewAttendanceRequestPage /></AuthenticatedLayout>} />
        <Route path="/attendance/requests/edit/:name" element={<AuthenticatedLayout><NewAttendanceRequestPage /></AuthenticatedLayout>} />
        <Route path="/notifications" element={<AuthenticatedLayout><NotificationsPage /></AuthenticatedLayout>} />
        <Route path="/profile" element={<AuthenticatedLayout><ProfilePage /></AuthenticatedLayout>} />
        <Route path="/settings" element={<AuthenticatedLayout><SettingsPage /></AuthenticatedLayout>} />
        <Route path="/holiday" element={<AuthenticatedLayout><HolidayActivityPage /></AuthenticatedLayout>} />
        <Route path="/leave" element={<AuthenticatedLayout><LeavePage /></AuthenticatedLayout>} />
        <Route path="/expense" element={<AuthenticatedLayout><ExpensePage /></AuthenticatedLayout>} />
        <Route path="/salary" element={<AuthenticatedLayout><SalaryPage /></AuthenticatedLayout>} />
        <Route path="/tasks" element={<AuthenticatedLayout><TaskPage /></AuthenticatedLayout>} />
        <Route path="/documents" element={<AuthenticatedLayout><DocumentsPage /></AuthenticatedLayout>} />
        <Route path="/reports" element={<AuthenticatedLayout><ReportsPage /></AuthenticatedLayout>} />
        <Route path="/travel" element={<AuthenticatedLayout><TravelPage /></AuthenticatedLayout>} />
        <Route path="/loan" element={<AuthenticatedLayout><LoanPage /></AuthenticatedLayout>} />
        <Route path="/magic-nav" element={<AuthenticatedLayout><MagicNavPage /></AuthenticatedLayout>} />
      </Route>

      {/* HR Dashboard routes */}
      <Route element={<HRRouteGuard />}>
        <Route path="/hr-dashboard" element={<AuthenticatedLayout><Suspense fallback={<LoadingFallback />}><HRDashboard /></Suspense></AuthenticatedLayout>} />
        <Route path="/hr-dashboard/leave-approvals" element={<AuthenticatedLayout><Suspense fallback={<LoadingFallback />}><LeaveApprovals /></Suspense></AuthenticatedLayout>} />
        <Route path="/hr-dashboard/expense-approvals" element={<AuthenticatedLayout><Suspense fallback={<LoadingFallback />}><ExpenseApprovals /></Suspense></AuthenticatedLayout>} />
        <Route path="/hr-dashboard/notifications" element={<AuthenticatedLayout><Suspense fallback={<LoadingFallback />}><HRNotifications /></Suspense></AuthenticatedLayout>} />
        <Route path="/hr-dashboard/employees" element={<AuthenticatedLayout><Suspense fallback={<LoadingFallback />}><Employees /></Suspense></AuthenticatedLayout>} />
        <Route path="/hr-dashboard/loan-approvals" element={<AuthenticatedLayout><Suspense fallback={<LoadingFallback />}><LoanApprovals /></Suspense></AuthenticatedLayout>} />
        <Route path="/hr-dashboard/loan-approvals/:name" element={<AuthenticatedLayout><Suspense fallback={<LoadingFallback />}><LoanApprovalDetail /></Suspense></AuthenticatedLayout>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
