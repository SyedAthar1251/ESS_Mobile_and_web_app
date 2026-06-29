import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useAuth } from "../../auth/useAuth";
import HRStatCard from "../../components/hr/HRStatCard";
import { getPendingLeaves, HRApplication } from "../../services/hrLeave.service";
import { getPendingExpenses, HRExpenseClaim } from "../../services/hrExpense.service";
import { getHRNotifications, HRNotificationItem } from "../../services/hrNotification.service";
import { getEmployees } from "../../services/hrEmployee.service";
import { getPendingLoans, HRLoanApplication } from "../../services/hrLoan.service";

const HRDashboard = () => {
  const { themeColors } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [pendingExpenseCount, setPendingExpenseCount] = useState(0);
  const [pendingLoanCount, setPendingLoanCount] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [leavesRes, expensesRes, notifRes, empRes, loansRes] = await Promise.allSettled([
        getPendingLeaves(),
        getPendingExpenses(),
        getHRNotifications(),
        getEmployees(1, 1),
        getPendingLoans(),
      ]);

      if (leavesRes.status === "fulfilled") {
        const leaves = leavesRes.value.data || [];
        setPendingLeaveCount(leaves.filter((l: HRApplication) => l.status === "Open" || l.status === "Pending").length);
      }

      if (expensesRes.status === "fulfilled") {
        const expenses = expensesRes.value.data || [];
        setPendingExpenseCount(expenses.filter((e: HRExpenseClaim) => e.approval_status === "Pending" || e.status === "Draft").length);
      }

      if (notifRes.status === "fulfilled") {
        const notifs = notifRes.value.data || [];
        setUnreadNotifications(notifs.filter((n: HRNotificationItem) => n.read === 0).length);
      }

      if (empRes.status === "fulfilled") {
        const emps = empRes.value.data || [];
        setTotalEmployees(emps.length > 0 ? emps.length : 0);
      }

      if (loansRes.status === "fulfilled") {
        const loans = loansRes.value.data || [];
        setPendingLoanCount(loans.filter((l: HRLoanApplication) => l.status === "Open").length);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "HR";
  };

  const userRoles: string[] = (user as any)?.roles || [];
  const isHRManager = userRoles.includes("HR Manager");
  const isLeaveApprover = userRoles.includes("Leave Approver") || isHRManager;
  const isExpenseApprover = userRoles.includes("Expense Approver") || isHRManager;
  const isLoanApprover = userRoles.includes("Loan Approver") || isHRManager;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: themeColors.primary }}
          >
            {getInitials()}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: themeColors.text }}>
              Welcome, {user?.fullName || "HR Manager"}
            </h1>
            {/* <p className="text-sm" style={{ color: themeColors.textSecondary }}>
              {userRoles.join(", ") || "HR Dashboard"}
            </p> */}
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2 rounded-lg transition-colors hover:bg-black/5"
          style={{ color: themeColors.textSecondary }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchDashboardData} className="ml-auto text-sm text-red-600 font-medium hover:underline">
            Retry
          </button>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLeaveApprover && (
          <HRStatCard
            title="Pending Leaves"
            value={pendingLeaveCount}
            color="#f59e0b"
            loading={loading}
            onClick={() => navigate("/hr-dashboard/leave-approvals")}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        )}
        {isLoanApprover && (
          <HRStatCard
            title="Pending Loans"
            value={pendingLoanCount}
            color="#6366f1"
            loading={loading}
            onClick={() => navigate("/hr-dashboard/loan-approvals")}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 9v1m9-5a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        )}
        {isExpenseApprover && (
          <HRStatCard
            title="Pending Expenses"
            value={pendingExpenseCount}
            color="#8b5cf6"
            loading={loading}
            onClick={() => navigate("/hr-dashboard/expense-approvals")}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />
        )}
        {isHRManager && (
          <HRStatCard
            title="Total Employees"
            value={totalEmployees}
            color="#3b82f6"
            loading={loading}
            onClick={() => navigate("/hr-dashboard/employees")}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        )}
        <HRStatCard
          title="Unread Notifications"
          value={unreadNotifications}
          color="#ef4444"
          loading={loading}
          onClick={() => navigate("/hr-dashboard/notifications")}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold mb-3" style={{ color: themeColors.text }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLeaveApprover && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/hr-dashboard/leave-approvals")}
              className="rounded-2xl p-4 text-left shadow-sm"
              style={{ background: themeColors.backgroundSecondary, border: `1px solid ${themeColors.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: "#f59e0b18" }}>
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: themeColors.text }}>Leave Approvals</p>
              <p className="text-xs mt-0.5" style={{ color: themeColors.textSecondary }}>Review leave requests</p>
            </motion.button>
          )}
          {isLoanApprover && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/hr-dashboard/loan-approvals")}
              className="rounded-2xl p-4 text-left shadow-sm"
              style={{ background: themeColors.backgroundSecondary, border: `1px solid ${themeColors.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: "#6366f118" }}>
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 9v1m9-5a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: themeColors.text }}>Loan Approvals</p>
              <p className="text-xs mt-0.5" style={{ color: themeColors.textSecondary }}>Review loan applications</p>
            </motion.button>
          )}
          {isExpenseApprover && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/hr-dashboard/expense-approvals")}
              className="rounded-2xl p-4 text-left shadow-sm"
              style={{ background: themeColors.backgroundSecondary, border: `1px solid ${themeColors.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: "#8b5cf618" }}>
                <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: themeColors.text }}>Expense Approvals</p>
              <p className="text-xs mt-0.5" style={{ color: themeColors.textSecondary }}>Review expense claims</p>
            </motion.button>
          )}
          {isHRManager && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/hr-dashboard/employees")}
              className="rounded-2xl p-4 text-left shadow-sm"
              style={{ background: themeColors.backgroundSecondary, border: `1px solid ${themeColors.border}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: "#3b82f618" }}>
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: themeColors.text }}>Employees</p>
              <p className="text-xs mt-0.5" style={{ color: themeColors.textSecondary }}>Manage employee directory</p>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/hr-dashboard/notifications")}
            className="rounded-2xl p-4 text-left shadow-sm"
            style={{ background: themeColors.backgroundSecondary, border: `1px solid ${themeColors.border}` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: "#ef444418" }}>
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-semibold" style={{ color: themeColors.text }}>Notifications</p>
            <p className="text-xs mt-0.5" style={{ color: themeColors.textSecondary }}>View all notifications</p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default HRDashboard;
