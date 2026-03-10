import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { motion } from "framer-motion";

const ProfilePage = () => {
  const { logout, user } = useAuth();
  const { t, language } = useLanguage();
  const { theme, themeColors, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log("[ProfilePage] Starting logout...");
    await logout();
    console.log("[ProfilePage] Logout complete, redirecting to login...");
    navigate("/login", { replace: true });
  };

  // Get initials from full name or user ID
  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.userId?.charAt(0).toUpperCase() || "U";
  };

  // Theme-specific card styling
  const getCardStyle = () => {
    if (theme === 'neon-green') {
      return {};
    }
    if (theme === 'light') {
      return {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
      };
    }
    return {
      backgroundColor: themeColors.backgroundSecondary,
      borderColor: themeColors.border,
    };
  };

  // Theme-specific text colors
  const getTextColor = (isPrimary = true) => {
    // For all themes (including neon), use dark text for better visibility on light/white cards
    return isPrimary ? '#111827' : '#6b7280';
  };

  return (
    <div className="p-4">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl shadow-2xl overflow-hidden mb-6 ${theme === 'neon-green' ? 'neon-card' : 'bg-white'}`}
        style={theme !== 'neon-green' ? getCardStyle() : {}}
      >
        <div 
          className="p-6 text-center"
          style={{ 
            background: theme === 'neon-green' 
              ? '#f0fdf4'
              : `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primaryLight})`
          }}
        >
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative inline-block"
          >
            <div 
              className="h-28 w-28 rounded-full flex items-center justify-center text-3xl font-bold shadow-2xl border-4 border-white"
              style={{ 
                background: theme === 'neon-green'
                  ? '#f0fdf4'
                  : `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})`,
                color: '#111827'
              }}
            >
              {getInitials()}
            </div>
          </motion.div>

          {/* Name */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-2xl font-bold"
            style={{ color: '#111827' }}
          >
            {user?.fullName || user?.userId || "User"}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-1"
            style={{ color: '#6b7280' }}
          >
            {user?.employeeId || "N/A"}
          </motion.p>
        </div>
      </motion.div>

      {/* Employee Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-3xl shadow-lg overflow-hidden mb-6 ${theme === 'neon-green' ? 'neon-card' : 'bg-white'}`}
        style={theme !== 'neon-green' ? getCardStyle() : {}}
      >
        <div className="p-5 space-y-4">
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: getTextColor() }}
          >
            Employee Information
          </h3>

          {/* User ID */}
          <div 
            className="rounded-xl p-4 flex items-center gap-4"
            style={{ 
              backgroundColor: theme === 'neon-green' ? 'rgba(255,255,255,0.1)' : themeColors.background 
            }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: theme === 'neon-green' ? 'rgba(46, 213, 115, 0.2)' : `${themeColors.primary}20` 
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                style={{ color: theme === 'neon-green' ? '#2ED573' : themeColors.primary }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p 
                className="text-xs uppercase tracking-wider"
                style={{ color: getTextColor(false) }}
              >
                {t("profile")}
              </p>
              <p 
                className="font-semibold"
                style={{ color: getTextColor() }}
              >
                {user?.userId || "N/A"}
              </p>
            </div>
          </div>

          {/* Employee ID */}
          <div 
            className="rounded-xl p-4 flex items-center gap-4"
            style={{ 
              backgroundColor: theme === 'neon-green' ? 'rgba(255,255,255,0.1)' : themeColors.background 
            }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: theme === 'neon-green' ? 'rgba(46, 213, 115, 0.2)' : `${themeColors.primary}20` 
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                style={{ color: theme === 'neon-green' ? '#2ED573' : themeColors.primary }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p 
                className="text-xs uppercase tracking-wider"
                style={{ color: getTextColor(false) }}
              >
                Employee ID
              </p>
              <p 
                className="font-semibold"
                style={{ color: getTextColor() }}
              >
                {user?.employeeId || "N/A"}
              </p>
            </div>
          </div>

          {/* Company */}
          <div 
            className="rounded-xl p-4 flex items-center gap-4"
            style={{ 
              backgroundColor: theme === 'neon-green' ? 'rgba(255,255,255,0.1)' : themeColors.background 
            }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: theme === 'neon-green' ? 'rgba(46, 213, 115, 0.2)' : `${themeColors.primary}20` 
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                style={{ color: theme === 'neon-green' ? '#2ED573' : themeColors.primary }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <p 
                className="text-xs uppercase tracking-wider"
                style={{ color: getTextColor(false) }}
              >
                Company
              </p>
              <p 
                className="font-semibold truncate"
                style={{ color: getTextColor() }}
              >
                {user?.companyUrl || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Logout Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={handleLogout}
        className="w-full py-4 rounded-2xl font-semibold shadow-lg active:scale-95 transition flex items-center justify-center gap-2 group"
        style={{ 
          background: theme === 'neon-green'
            ? 'linear-gradient(135deg, #ff6b6b, #ee5a5a)'
            : `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primaryDark})`,
          color: '#000000'
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 group-hover:rotate-12 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        {t("logout")}
      </motion.button>
    </div>
  );
};

export default ProfilePage;
