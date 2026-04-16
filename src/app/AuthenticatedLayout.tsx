import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth } from "../auth/useAuth";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../store/ThemeContext";
import { LANGUAGES } from "../i18n/languages";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getNotificationList, NotificationItem } from "../services/notification.service";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showThemePopup, setShowThemePopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const { theme, themeColors, setTheme } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  const handleLogout = async () => {
    setShowProfileDropdown(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    setShowProfileDropdown(false);
    navigate("/profile");
  };

  const handleNotification = async () => {
    setShowNotifications(!showNotifications);
    
    // Fetch notifications when opening the modal if not already loaded
    if (!showNotifications && notifications.length === 0) {
      setNotificationsLoading(true);
      setNotificationsError(null);
      
      try {
        const response = await getNotificationList();
        setNotifications(response.data || []);
      } catch (error: any) {
        console.error("Failed to fetch notifications:", error);
        setNotificationsError(error.message || "Failed to load notifications");
      } finally {
        setNotificationsLoading(false);
      }
    }
  };

  // Helper to format notification time
  const formatNotificationTime = (creationDate: string) => {
    try {
      const date = new Date(creationDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hr ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
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

  // RTL support
  const isRTL = language === LANGUAGES.AR;

  return (
    <div 
      className="min-h-screen flex flex-col"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: themeColors.gradient || themeColors.background }}
    >
      {/* Top Navbar with Theme Colors */}
      <header className={`flex-shrink-0 fixed top-0 ${isRTL ? 'right-0' : 'left-0'} left-0 right-0 h-16 shadow-md flex items-center justify-between px-4 md:px-6 z-50`}
        style={{
          background: themeColors.primary
        }}
      >
        
        {/* Left/Right: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-2xl text-black"
          >
            ☰
          </button>

          <h1 className="text-xl font-bold text-black flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            ESS
          </h1>
        </div>

        {/* Right/Left: Language + Notification + Profile */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notification Bell */}
          <button
            onClick={handleNotification}
            className="relative p-2 rounded-lg hover:bg-white/10 transition"
          >
            <svg 
              className="w-6 h-6 text-black" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Notification Badge - Show unread count */}
            {notifications.filter(n => n.read === 0).length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full border-2 border-indigo-600">
                {notifications.filter(n => n.read === 0).length > 9 ? '9+' : notifications.filter(n => n.read === 0).length}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
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
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-xl shadow-xl border border-indigo-500 overflow-hidden z-50`}
                >
                  {/* User Info */}
                  <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                    <p className="font-semibold text-gray-800">{user?.fullName || "Employee"}</p>
                    <p className="text-sm text-gray-500">{user?.userId || "employee@company.com"}</p>
                  </div>

                  {/* Profile Link */}
                  <button
                    onClick={handleProfile}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-indigo-50 transition flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>

                  {/* Help Link */}
                  <button
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-indigo-50 transition flex items-center gap-3"
                  >
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

      {/* Sidebar - with minimized state support */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isMinimized={isSidebarMinimized}
        onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
      />

      {/* Main Content */}
      <main className={`flex-1 pt-20 px-4 md:px-6 pb-6 ${isRTL ? 'text-right' : 'text-left'}`} style={{ minHeight: '100vh' }}>
        {children}
      </main>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
            >
              <div className={`rounded-3xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-hidden ${theme === 'neon-green' ? 'neon-card' : 'bg-white'}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between"
                  style={{ background: themeColors.primary }}
                >
                  <h3 className="font-bold text-xl" style={{ color: themeColors.text || '#ffffff' }}>Notifications</h3>
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

                {/* Notifications List */}
                <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
                  {/* Loading State */}
                  {notificationsLoading && (
                    <div className="p-8 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Error State */}
                  {notificationsError && !notificationsLoading && (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <p className="text-gray-600">{notificationsError}</p>
                      <button
                        onClick={() => {
                          setNotificationsError(null);
                          setNotifications([]);
                          handleNotification();
                        }}
                        className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Empty State */}
                  {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No notifications yet</p>
                    </div>
                  )}

                  {/* Notification Items */}
                  {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                    <>
                      {notifications.slice(0, 10).map((notification, index) => (
                        <div
                          key={notification.name || index}
                          className={`p-4 cursor-pointer transition-colors border-b border-gray-50 ${
                            notification.read === 0 ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold ${notification.read === 0 ? 'text-gray-800' : 'text-gray-600'}`}>
                                {notification.subject || "Notification"}
                              </p>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {notification.content || ""}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatNotificationTime(notification.creation)}
                              </p>
                            </div>
                            {notification.read === 0 && (
                              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Show "View All" if more than 10 notifications */}
                      {notifications.length > 10 && (
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            navigate("/notifications");
                          }}
                          className="w-full p-3 text-center text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                        >
                          View All Notifications
                        </button>
                      )}
                    </>
                  )}
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
