import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../store/ThemeContext";
import { useAuth } from "../../auth/useAuth";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";

const AdminDashboard = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDark = theme !== "light";
  const isAdmin = (user?.userType || "employee") === "admin";

  const [showSidebar, setShowSidebar] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const statCards = [
    { label: "Total Employees", value: "232", color: "bg-indigo-50", textColor: "text-indigo-600", darkColor: "bg-indigo-500/10", darkTextColor: "text-indigo-400" },
    { label: "Total Companies", value: "4", color: "bg-emerald-50", textColor: "text-emerald-600", darkColor: "bg-emerald-500/10", darkTextColor: "text-emerald-400" },
    { label: "Admin Users", value: "3", color: "bg-amber-50", textColor: "text-amber-600", darkColor: "bg-amber-500/10", darkTextColor: "text-amber-400" },
    { label: "Total Leaves", value: "48", color: "bg-blue-50", textColor: "text-blue-600", darkColor: "bg-blue-500/10", darkTextColor: "text-blue-400" },
    { label: "Attendance", value: "96%", color: "bg-green-50", textColor: "text-green-600", darkColor: "bg-green-500/10", darkTextColor: "text-green-400" },
    { label: "Expenses", value: "12", color: "bg-purple-50", textColor: "text-purple-600", darkColor: "bg-purple-500/10", darkTextColor: "text-purple-400" },
    { label: "Print Formats", value: "4", color: "bg-rose-50", textColor: "text-rose-600", darkColor: "bg-rose-500/10", darkTextColor: "text-rose-400" },
    { label: "Reports", value: "8", color: "bg-cyan-50", textColor: "text-cyan-600", darkColor: "bg-cyan-500/10", darkTextColor: "text-cyan-400" },
  ];

  const quickActions = [
    { label: "Add Admin User", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
    ), color: "bg-indigo-600" },
    { label: "Add Company", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    ), color: "bg-emerald-600" },
    { label: "Configure Print Format", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
    ), color: "bg-amber-600" },
    { label: "View Reports", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    ), color: "bg-blue-600" },
  ];

  const recentActivity = [
    { action: "New admin user created", detail: "admin2@test.com added as Company Admin", time: "2 min ago", color: "bg-indigo-500" },
    { action: "Print format updated", detail: "Payslip ERC set for Company A", time: "15 min ago", color: "bg-emerald-500" },
    { action: "Leave approved", detail: "Annual leave approved for EMP-001", time: "1 hr ago", color: "bg-blue-500" },
    { action: "Employee added", detail: "New employee John Doe onboarded", time: "3 hrs ago", color: "bg-amber-500" },
    { action: "Report generated", detail: "Monthly attendance report exported", time: "5 hrs ago", color: "bg-purple-500" },
  ];

  const sectionTitle: Record<string, string> = {
    dashboard: "Dashboard",
    "admin-users": "Admin Users",
    "print-formats": "Print Format Settings",
    companies: "Companies",
    employees: "Employees",
    attendance: "Attendance",
    leave: "Leave Management",
    expenses: "Expenses",
    reports: "Reports",
    settings: "Settings",
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Admin Header */}
      <AdminHeader
        onMenuToggle={() => setShowSidebar(true)}
        title={activeMenu === "dashboard" ? "ESS Admin" : sectionTitle[activeMenu] || "ESS Admin"}
      />

      {/* Admin Sidebar */}
      <AdminSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
      />

      {/* Main Content */}
      <div className="px-4 py-4 space-y-6 pb-8">
        {/* Admin Profile Card — only on dashboard */}
        {activeMenu === "dashboard" && (
          !isDark ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{user?.fullName || "ESS Admin"}</h2>
                  <p className="text-sm opacity-90">{isAdmin ? "Super Admin" : "Admin"}</p>
                  <p className="text-xs opacity-75">{user?.userId || ""}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-2xl p-5 border border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-600/20 flex items-center justify-center text-2xl font-bold text-indigo-400">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{user?.fullName || "ESS Admin"}</h2>
                  <p className="text-sm text-gray-400">{isAdmin ? "Super Admin" : "Admin"}</p>
                  <p className="text-xs text-gray-500">{user?.userId || ""}</p>
                </div>
              </div>
            </motion.div>
          )
        )}

        {/* Statistics Cards — only on dashboard */}
        {activeMenu === "dashboard" && (
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statCards.map((card, idx) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow ${isDark ? card.darkColor + " border border-gray-700" : card.color}`}
                >
                  <p className={`text-2xl font-bold ${isDark ? card.darkTextColor : card.textColor}`}>
                    {card.value}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {card.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions — only on dashboard */}
        {activeMenu === "dashboard" && (
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action, idx) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`${action.color} text-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-2`}
                >
                  {action.icon}
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity — only on dashboard */}
        {activeMenu === "dashboard" && (
          <div>
            <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Recent Activity
            </h3>
            <div className={`rounded-2xl overflow-hidden ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm"}`}>
              {recentActivity.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                  className={`flex items-start gap-3 p-4 ${idx < recentActivity.length - 1 ? (isDark ? "border-b border-gray-700" : "border-b border-gray-100") : ""}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${item.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{item.detail}</p>
                  </div>
                  <span className={`text-xs flex-shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{item.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder for non-dashboard sections */}
        {activeMenu !== "dashboard" && activeMenu !== "print-formats" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm"}`}
          >
            <h3 className="text-lg font-bold mb-2">
              {sectionTitle[activeMenu]}
            </h3>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              This section will be implemented in the next phase.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
