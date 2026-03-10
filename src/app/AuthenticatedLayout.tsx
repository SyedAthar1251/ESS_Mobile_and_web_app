import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth } from "../auth/useAuth";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../store/ThemeContext";
import { LANGUAGES } from "../i18n/languages";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showThemePopup, setShowThemePopup] = useState(false);
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

  const handleNotification = () => {
    navigate("/notifications");
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
            {/* Notification Badge */}
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-indigo-600"></span>
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
    </div>
  );
};

export default AuthenticatedLayout;
