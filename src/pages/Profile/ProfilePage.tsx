import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { motion } from "framer-motion";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
} from "../../utils/pageCardStyles";

const ProfilePage = () => {
  const { logout, user, employee } = useAuth();
  const { t, language } = useLanguage();
  const { theme, themeColors, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log("[ProfilePage] Starting logout...");
    await logout();
    console.log("[ProfilePage] Logout complete, redirecting to login...");
    navigate("/login", { replace: true });
  };

  const getInitials = () => {
    const name = employee?.employeeName || user?.fullName || "";
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.userId?.charAt(0).toUpperCase() || "U";
  };

  const getText = (isPrimary = true) => isPrimary ? (theme === 'neon-green' ? '#ffffff' : '#111827') : (theme === 'neon-green' ? '#9CA3AF' : '#6b7280');
  const getCardBg = () => theme === 'neon-green' ? 'rgba(255,255,255,0.08)' : themeColors.background;
  const getCardBorder = () => theme === 'neon-green' ? 'rgba(255,255,255,0.12)' : themeColors.border;
  const getIconBg = () => theme === 'neon-green' ? 'rgba(46,213,115,0.15)' : `${themeColors.primary}15`;
  const getIconColor = () => theme === 'neon-green' ? '#2ED573' : themeColors.primary;
  const getHeaderBg = () => theme === 'neon-green' ? '#1C4E57' : `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primaryLight})`;
  const getHeaderText = () => theme === 'neon-green' ? '#ffffff' : '#111827';
  const getSubtext = () => theme === 'neon-green' ? '#9CA3AF' : '#6b7280';

  const renderField = (label: string, value: string | number | null | undefined, icon: React.ReactNode, delay: number) => {
    if (!value && value !== 0) return null;
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay }}
        className="rounded-xl p-3.5 flex items-center gap-3"
        style={{ backgroundColor: getCardBg(), border: `1px solid ${getCardBorder()}` }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: getIconBg() }}
        >
          <svg className="w-5 h-5" style={{ color: getIconColor() }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: getText(false) }}>{label}</p>
          <p className="font-semibold text-sm truncate" style={{ color: getText() }}>{value}</p>
        </div>
      </motion.div>
    );
  };

  const e = employee;

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${getPageCardStyle(theme)} overflow-hidden`}
        style={theme !== 'neon-green' ? { backgroundColor: themeColors.backgroundSecondary } : {}}
      >
        <div className="p-6 text-center" style={{ background: getHeaderBg() }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="relative inline-block">
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-xl border-4"
              style={{
                background: theme === 'neon-green' ? '#2ED573' : `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})`,
                borderColor: theme === 'neon-green' ? '#1C4E57' : '#ffffff',
                color: '#ffffff',
              }}
            >
              {getInitials()}
            </div>
            {e?.status && (
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white" style={{ background: e.status === 'Active' ? '#16a34a' : '#dc2626' }} />
            )}
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-3 text-xl font-bold" style={{ color: getHeaderText() }}>
            {e?.employeeName || user?.fullName || "Employee"}
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-1 text-sm" style={{ color: getSubtext() }}>
            {e?.designation || e?.id || "—"}
          </motion.p>
          {e?.department && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-xs mt-0.5" style={{ color: getSubtext() }}>
              {e.department}{e.company ? ` · ${e.company}` : ""}
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`${getPageCardStyle(theme)} overflow-hidden`}
        style={theme !== 'neon-green' ? { backgroundColor: themeColors.backgroundSecondary } : {}}
      >
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: getText(false) }}>Personal Information</h3>
          <div className="space-y-2">
            {renderField("Employee ID", e?.id || user?.employeeId, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />, 0.1)}
            {renderField("Gender", e?.gender, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />, 0.15)}
            {renderField("Date of Birth", e?.dateOfBirth, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />, 0.2)}
            {renderField("Nationality", e?.nationality, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012 2h-1.062M15 20.488V18a2 2 0 012-2h3.062M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, 0.25)}
            {renderField("Religion", e?.religion, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />, 0.3)}
            {renderField("Marital Status", e?.maritalStatus, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />, 0.35)}
            {renderField("Blood Group", e?.bloodGroup, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />, 0.4)}
          </div>
        </div>
      </motion.div>

      {/* Work Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`${getPageCardStyle(theme)} overflow-hidden`}
        style={theme !== 'neon-green' ? { backgroundColor: themeColors.backgroundSecondary } : {}}
      >
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: getSubtext() }}>Work Information</h3>
          <div className="space-y-2">
            {renderField("Designation", e?.designation, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />, 0.1)}
            {renderField("Department", e?.department, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />, 0.15)}
            {renderField("Company", e?.company, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />, 0.2)}
            {renderField("Employment Type", e?.employmentType, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />, 0.25)}
            {renderField("Date of Joining", e?.dateOfJoining, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />, 0.3)}
            {renderField("Status", e?.status, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />, 0.35)}
          </div>
        </div>
      </motion.div>

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={`${getPageCardStyle(theme)} overflow-hidden`}
        style={theme !== 'neon-green' ? { backgroundColor: themeColors.backgroundSecondary } : {}}
      >
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: getSubtext() }}>Contact Information</h3>
          <div className="space-y-2">
            {renderField("Email", e?.userEmail || user?.userId, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />, 0.1)}
            {renderField("Personal Email", e?.personalEmail, <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />, 0.15)}
          </div>
        </div>
      </motion.div>

      {/* Logout */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        onClick={handleLogout}
        className="w-full py-3.5 rounded-xl font-semibold shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
        style={{
          background: theme === 'neon-green' ? 'linear-gradient(135deg, #ff6b6b, #ee5a5a)' : `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.primaryDark})`,
          color: '#ffffff',
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {t("logout")}
      </motion.button>
    </div>
  );
};

export default ProfilePage;
