import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/useAuth";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../store/ThemeContext";
import { LANGUAGES } from "../i18n/languages";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

// SVG Icons for better understanding
const Icons = {
  logo: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  dashboard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  attendance: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  leave: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  expense: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  salary: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  tasks: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  documents: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  holiday: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  reports: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  notifications: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  profile: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  logout: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  settings: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  // magicNav: (
  //   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  //   </svg>
  // ),
  travel: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  loan: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  menuClose: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  expandLeft: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
  ),
  expandRight: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  ),
};

const Sidebar = ({ isOpen, onClose, isMinimized = false, onToggleMinimize }: Props) => {
  const { logout, user } = useAuth();
  const { language } = useLanguage();
  const { theme, themeColors } = useTheme();
  const navigate = useNavigate();

  const isRTL = language === LANGUAGES.AR;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.userId?.charAt(0).toUpperCase() || "U";
  };

  // Navigation tabs with clear icons - Phase 1 Focus
  // Phase 1: Dashboard, Attendance, Notifications (Core AlphaX)
  // Phase 2: Leave, Salary, Expense, Tasks, Documents, Reports (Advanced AlphaX)
  // Phase 3: Travel, Loan (Manager Features)
  const tabs = [
    { to: "/dashboard", label: isRTL ? "الرئيسية" : "Dashboard", icon: Icons.dashboard, phase: 1 },
    { to: "/attendance", label: isRTL ? "الحضور والانصراف" : "Attendance", icon: Icons.attendance, phase: 1 },
    { to: "/notifications", label: isRTL ? "الإشعارات" : "Notifications", icon: Icons.notifications, phase: 1 },
    { to: "/profile", label: isRTL ? "الملف الشخصي" : "Profile", icon: Icons.profile, phase: 1 },
    { to: "/leave", label: isRTL ? "الإجازات" : "Leave", icon: Icons.leave, phase: 2 },
    { to: "/holiday", label: isRTL ? "العطلات" : "Holiday", icon: Icons.holiday, phase: 2 },
    { to: "/salary", label: isRTL ? "الراتب" : "Salary", icon: Icons.salary, phase: 2 },
    { to: "/expense", label: isRTL ? "المصروفات" : "Expense", icon: Icons.expense, phase: 2 },
    { to: "/tasks", label: isRTL ? "المهام" : "Tasks", icon: Icons.tasks, phase: 2 },
    { to: "/documents", label: isRTL ? "المستندات" : "Documents", icon: Icons.documents, phase: 2 },
    { to: "/reports", label: isRTL ? "التقارير" : "Reports", icon: Icons.reports, phase: 2 },
    { to: "/travel", label: isRTL ? "السفر" : "Travel", icon: Icons.travel, phase: 3 },
    { to: "/loan", label: isRTL ? "القرض" : "Loan", icon: Icons.loan, phase: 3 },
    // { to: "/magic-nav", label: "Magic Nav", icon: Icons.magicNav, phase: 1 },
    { to: "/settings", label: isRTL ? "الإعدادات" : "Settings", icon: Icons.settings, phase: 1 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Sidebar Panel */}
          <motion.aside
            initial={{ x: isRTL ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? "100%" : "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className={`fixed top-0 h-full shadow-2xl z-50 flex flex-col ${
              isRTL ? "right-0" : "left-0"
            } ${isMinimized ? "w-20" : "w-72"}`}
            style={{
              background: themeColors.gradient || `linear-gradient(180deg, ${themeColors.primaryDark} 0%, ${themeColors.primary} 100%)`
            }}
          >
            {/* Header */}
            <div 
              className="px-4 py-4 border-b flex items-center justify-between"
              style={{ borderColor: themeColors.primaryLight + '50' }}
            >
              {/* Logo and ESS Text */}
              <div className="flex items-center gap-2">
                <div style={{ color: themeColors.sidebarText || '#ffffff' }}>
                  {Icons.logo}
                </div>
                {!isMinimized && (
                  <h1 className="text-xl font-bold" style={{ color: themeColors.sidebarText || '#ffffff' }}>ESS</h1>
                )}
              </div>
               
              <div className="flex items-center gap-2">
                {/* Minimize Button */}
                {onToggleMinimize && (
                  <button
                    onClick={onToggleMinimize}
                    className="hover:text-black transition p-1"
                    style={{ color: themeColors.sidebarText || themeColors.primaryLight }}
                    title={isMinimized ? "Expand" : "Minimize"}
                  >
                    {isMinimized ? Icons.expandRight : Icons.expandLeft}
                  </button>
                )}
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="hover:text-black transition p-1"
                  style={{ color: themeColors.sidebarText || themeColors.primaryLight }}
                  title="Close"
                >
                  {Icons.menuClose}
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
              {/* Phase 1 Header - Core AlphaX */}
              {!isMinimized && (
                <div className="px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: themeColors.sidebarText || '#ffffff' }}>
                    {isRTL ? "الخدمات الأساسية" : "Core Features"}
                  </span>
                </div>
              )}
              {tabs.filter(tab => tab.phase === 1).map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg transition ${isMinimized ? "justify-center" : ""}`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? (themeColors.sidebarActiveBg || themeColors.primary) : 'transparent',
                    color: isActive ? (themeColors.sidebarActiveText || '#ffffff') : (themeColors.sidebarText || themeColors.primaryLight),
                  })}
                  title={isMinimized ? tab.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <span style={{ color: isActive ? (themeColors.sidebarActiveText || '#ffffff') : (themeColors.sidebarText || themeColors.primaryLight) }}>
                        {tab.icon}
                      </span>
                      {!isMinimized && <span>{tab.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}

              {/* Phase 2 & 3 Header */}
              {!isMinimized && (
                <div className="px-3 pt-4 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-60" style={{ color: themeColors.sidebarText || '#ffffff' }}>
                    {isRTL ? "قيد التطوير" : "Coming Soon"}
                  </span>
                </div>
              )}
              {tabs.filter(tab => tab.phase > 1).map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg transition opacity-60 ${isMinimized ? "justify-center" : ""}`
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? (themeColors.sidebarActiveBg || themeColors.primary) : 'transparent',
                    color: isActive ? (themeColors.sidebarActiveText || '#ffffff') : (themeColors.sidebarText || themeColors.primaryLight),
                  })}
                  title={isMinimized ? tab.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <span style={{ color: isActive ? (themeColors.sidebarActiveText || '#ffffff') : (themeColors.sidebarText || themeColors.primaryLight) }}>
                        {tab.icon}
                      </span>
                      {!isMinimized && (
                        <div className="flex items-center gap-2">
                          <span>{tab.label}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-200">
                            {tab.phase === 2 ? "P2" : "P3"}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Divider */}
            {!isMinimized && (
              <div className="px-4">
                <div className="border-t border-indigo-500/30 my-2"></div>
              </div>
            )}

            {/* Logout */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                className={`w-full py-3 rounded-lg text-red-300 hover:bg-red-500/20 transition flex items-center justify-center gap-2 ${
                  isMinimized ? "px-2" : "px-4"
                }`}
                title={isMinimized ? "Logout" : undefined}
              >
                {Icons.logout}
                {!isMinimized && <span>{isRTL ? "تسجيل الخروج" : "Logout"}</span>}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
