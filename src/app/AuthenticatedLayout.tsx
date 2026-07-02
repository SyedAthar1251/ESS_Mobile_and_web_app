import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth } from "../auth/useAuth";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../store/ThemeContext";
import { LANGUAGES } from "../i18n/languages";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationItem } from "../services/notification.service";
import { useNotificationStore } from "../store/notificationStore";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showThemePopup, setShowThemePopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout, employee } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const { theme, themeColors, setTheme } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

   const notifications = useNotificationStore((s) => s.notifications);
   const unreadCount = useNotificationStore((s) => s.unreadCount);
   const refreshNotifications = useNotificationStore((s) => s.refreshNotifications);
   const markAsRead = useNotificationStore((s) => s.markAsRead);
   const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
   const selectedNotification = useNotificationStore((s) => s.selectedNotification);
   const selectNotification = useNotificationStore((s) => s.selectNotification);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = () => {
    const name = employee?.employeeName || user?.fullName || "";
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.userId?.charAt(0).toUpperCase() || "U";
  };

  const handleLogout = async () => {
    setShowProfileDropdown(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    setShowProfileDropdown(false);
    navigate("/profile");
  };

  const handleNotification = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      refreshNotifications();
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (notification.read === 0) {
      await markAsRead(String(notification.name));
    }
    if (notification.document_type === "Leave Application") {
      console.log("[Notification Navigation] Notification clicked", notification);
      console.log("[Notification Navigation] Document Type:", notification.document_type);
      console.log("[Notification Navigation] Reference Name:", notification.reference_name);
      console.log("[Notification Navigation] Opening Leave Details");
      setShowNotifications(false);
      navigate("/leave", { state: { openLeaveDetail: true, leaveId: notification.reference_name } });
    } else {
      selectNotification(notification);
    }
  };

  const getNotificationIcon = (item: NotificationItem) => {
    const text = `${item.subject || ""} ${item.message || ""}`.toLowerCase();
    let derivedType = "info";
    if (text.includes("approved") || text.includes("success")) {
      derivedType = "success";
    } else if (text.includes("reject") || text.includes("failed") || text.includes("error")) {
      derivedType = "error";
    } else if (text.includes("warning") || text.includes("alert") || text.includes("reminder")) {
      derivedType = "warning";
    }

    switch (derivedType) {
      case "success":
      case "approval":
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "info":
      case "information":
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "warning":
      case "alert":
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  const isRTL = language === LANGUAGES.AR;

  return (
    <div
      className="min-h-screen flex flex-col"
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        background: theme === "light"
          ? "linear-gradient(160deg, #3E6FB0, #1D4E86)"
          : (themeColors.gradient || themeColors.background)
      }}
    >
      <header className={`flex-shrink-0 fixed top-0 ${isRTL ? 'right-0' : 'left-0'} left-0 right-0 h-16 shadow-md flex items-center justify-between px-4 md:px-6 z-50`}
        style={{ background: themeColors.primary }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="text-2xl text-black">☰</button>
          <h1 className="text-xl font-bold text-black flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            ESS
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <button
            onClick={handleNotification}
            className="relative p-2 rounded-lg hover:bg-white/10 transition"
          >
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full border-2 border-indigo-600">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={`flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className="h-10 w-10 rounded-full bg-white/20 text-black flex items-center justify-center font-semibold shadow">
                {getInitials()}
              </div>
              <svg
                className={`w-4 h-4 text-black transition-transform ${showProfileDropdown ? 'rotate-180' : ''} ${isRTL ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-xl shadow-xl border border-indigo-500 overflow-hidden z-50`}
                >
                  <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                    <p className="font-semibold text-gray-800">{employee?.employeeName || user?.fullName || "Employee"}</p>
                    <p className="text-sm text-gray-500">{employee?.designation || user?.userId || "employee@company.com"}</p>
                    {employee?.department && (
                      <p className="text-xs text-gray-400 mt-0.5">{employee.department}{employee.company ? ` - ${employee.company}` : ""}</p>
                    )}
                  </div>
                  <button
                    onClick={handleProfile}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-indigo-50 transition flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-indigo-50 transition flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isMinimized={isSidebarMinimized}
        onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
      />

      <main className={`flex-1 pt-20 px-4 md:px-6 pb-6 ${isRTL ? 'text-right' : 'text-left'}`} style={{ minHeight: '100vh' }}>
        {children}
      </main>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
            >
              <div className={`rounded-3xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-hidden ${theme === 'neon-green' ? 'neon-card' : 'bg-white'}`}>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between" style={{ background: themeColors.primary }}>
                  <h3 className="font-bold text-xl" style={{ color: themeColors.text || '#ffffff' }}>Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                        className="text-xs px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors font-medium"
                        style={{ color: themeColors.text || '#ffffff' }}
                      >
                        Mark All Read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                      style={{ color: themeColors.text || '#ffffff' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
                  {notifications.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No notifications yet</p>
                    </div>
                  )}

                  {notifications.slice(0, 10).map((notification, index) => (
                    <div
                      key={notification.name || index}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition-colors border-b border-gray-50 ${
                        notification.read === 0 ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification)}
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${notification.read === 0 ? 'text-gray-800' : 'text-gray-600'}`}>
                            {notification.subject || "Notification"}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {notification.message || ""}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notification.creation || "-"}
                          </p>
                        </div>
                        {notification.read === 0 && (
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}

                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate("/notifications");
                      }}
                      className="w-full p-3 text-center text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                    >
                      View All Notifications ({notifications.length})
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Notification Detail Popup */}
      <AnimatePresence>
        {selectedNotification && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => selectNotification(null)}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            >
              <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ${theme === 'neon-green' ? 'neon-card' : 'bg-white'}`}>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between" style={{ background: themeColors.primary }}>
                  <h3 className="font-bold text-lg truncate flex-1 mr-2" style={{ color: themeColors.text || '#ffffff' }}>
                    {selectedNotification.subject || "Notification"}
                  </h3>
                  <button
                    onClick={() => selectNotification(null)}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0"
                    style={{ color: themeColors.text || '#ffffff' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: selectedNotification.read === 0 ? '#EEF2FF' : '#F3F4F6', color: selectedNotification.read === 0 ? '#4F46E5' : '#6B7280' }}>
                      {selectedNotification.read === 0 ? "Unread" : "Read"}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedNotification.message || "No message content."}
                  </p>
                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Date</span>
                      <span className="text-xs text-gray-600">{selectedNotification.creation || "-"}</span>
                    </div>
                    {selectedNotification.reference_document && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Reference</span>
                        <span className="text-xs text-indigo-600 font-medium">{selectedNotification.reference_document}</span>
                      </div>
                    )}
                    {selectedNotification.reference_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Document ID</span>
                        <span className="text-xs text-gray-600">{selectedNotification.reference_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthenticatedLayout;
