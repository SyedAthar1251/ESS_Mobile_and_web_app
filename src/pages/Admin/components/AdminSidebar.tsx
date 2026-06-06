import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../store/ThemeContext";
import { useAuth } from "../../../auth/useAuth";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeMenu: string;
  onMenuChange: (key: string) => void;
}

const menuItems = [
  { key: "dashboard", label: "Dashboard", path: "/admin", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  )},
  { key: "leave-approvals", label: "Leave Approvals", path: "/admin/leave-approvals", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  )},
  { key: "travel-approvals", label: "Travel Approvals", path: "/admin/travel-approvals", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
  )},
  { key: "task-monitoring", label: "Task Monitoring", path: "/admin/task-monitoring", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
  )},
  { key: "attendance-approvals", label: "Attendance Approvals", path: "/admin/attendance-approvals", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  )},
  { key: "print-formats", label: "Print Format Settings", path: "/admin/print-settings", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
  )},
  { key: "employees", label: "Employees", path: "/admin/employees", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  )},
];

const AdminSidebar = ({ isOpen, onClose, activeMenu, onMenuChange }: AdminSidebarProps) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isDark = theme !== "light";
  const isAdmin = (user?.userType || "employee") === "admin";

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.path) {
      navigate(item.path);
    } else {
      onMenuChange(item.key);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className={`fixed top-0 left-0 h-full w-72 z-50 flex flex-col shadow-2xl ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className={`px-5 py-5 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">A</div>
                  <div>
                    <div className="font-bold text-base">ESS Admin</div>
                    <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Control Panel</div>
                  </div>
                </div>
                <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = activeMenu === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                        : isDark
                        ? "hover:bg-gray-700 text-gray-300 active:bg-gray-600"
                        : "hover:bg-gray-100 text-gray-700 active:bg-gray-200"
                    }`}
                  >
                    <span className={`transition-colors ${isActive ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className={`px-3 py-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
              {!isAdmin && (
                <button
                  onClick={() => { navigate("/dashboard"); onClose(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span className="text-sm font-medium">Back to Employee App</span>
                </button>
              )}
              <button
                onClick={async () => { await logout(); navigate("/login", { replace: true }); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors mt-1 ${isDark ? "hover:bg-red-900/20 text-red-400" : "hover:bg-red-50 text-red-600"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdminSidebar;
