import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../store/ThemeContext";
import { useAuth } from "../../auth/useAuth";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import { getAdminDashboardStats, AdminDashboardStats } from "../../services/admin.service";

const AdminDashboard = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isDark = theme !== "light";
  const isAdmin = (user?.userType || "employee") === "admin";

  const [showSidebar, setShowSidebar] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const path = location.pathname;
    if (path === "/admin" || path === "/admin/") {
      setActiveMenu("dashboard");
    } else if (path.includes("leave-approvals")) {
      setActiveMenu("leave-approvals");
    } else if (path.includes("travel-approvals")) {
      setActiveMenu("travel-approvals");
    } else if (path.includes("task-monitoring")) {
      setActiveMenu("task-monitoring");
    } else if (path.includes("print-settings")) {
      setActiveMenu("print-formats");
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const data = await getAdminDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("[AdminDashboard] Failed to fetch stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    if (activeMenu === "dashboard") {
      fetchStats();
    }
  }, [activeMenu]);

  const statCards = [
    { label: "Total Employees", value: stats?.totalEmployees ?? 0, color: "bg-indigo-50", textColor: "text-indigo-600", darkColor: "bg-indigo-500/10", darkTextColor: "text-indigo-400", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
    { label: "Total Companies", value: stats?.totalCompanies ?? 0, color: "bg-emerald-50", textColor: "text-emerald-600", darkColor: "bg-emerald-500/10", darkTextColor: "text-emerald-400", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    )},
    { label: "Admin Users", value: stats?.adminUsers ?? 0, color: "bg-amber-50", textColor: "text-amber-600", darkColor: "bg-amber-500/10", darkTextColor: "text-amber-400", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )},
    { label: "Pending Leaves", value: stats?.pendingLeaves ?? 0, color: "bg-blue-50", textColor: "text-blue-600", darkColor: "bg-blue-500/10", darkTextColor: "text-blue-400", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    )},
    { label: "Pending Attendance", value: stats?.pendingAttendance ?? 0, color: "bg-green-50", textColor: "text-green-600", darkColor: "bg-green-500/10", darkTextColor: "text-green-400", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { label: "Pending Travel", value: stats?.pendingTravel ?? 0, color: "bg-purple-50", textColor: "text-purple-600", darkColor: "bg-purple-500/10", darkTextColor: "text-purple-400", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
    )},
    { label: "Pending Tasks", value: stats?.pendingTasks ?? 0, color: "bg-rose-50", textColor: "text-rose-600", darkColor: "bg-rose-500/10", darkTextColor: "text-rose-400", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    )},
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
    "leave-approvals": "Leave Approvals",
    "travel-approvals": "Travel Approvals",
    "task-monitoring": "Task Monitoring",
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <AdminHeader
        onMenuToggle={() => setShowSidebar(true)}
        title={activeMenu === "dashboard" ? "ESS Admin" : sectionTitle[activeMenu] || "ESS Admin"}
      />

      <AdminSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
      />

      <div className="px-4 py-4 space-y-6 pb-8">
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
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? card.darkColor : card.color}`}>
                      <span className={isDark ? card.darkTextColor : card.textColor}>{card.icon}</span>
                    </div>
                  </div>
                  {statsLoading ? (
                    <div className={`h-7 w-12 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                  ) : (
                    <p className={`text-2xl font-bold ${isDark ? card.darkTextColor : card.textColor}`}>
                      {card.value}
                    </p>
                  )}
                  <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {card.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

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
