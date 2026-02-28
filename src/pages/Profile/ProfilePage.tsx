import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useLanguage } from "../../i18n/LanguageContext";
import { motion } from "framer-motion";

const ProfilePage = () => {
  const { logout, user } = useAuth();
  const { t, language } = useLanguage();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Background glow effects */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="fixed bottom-20 right-10 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Neon border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />
        <div className="absolute inset-[1px] bg-gray-800 rounded-3xl" />

        <div className="relative p-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center -mt-16 mb-6">
            {/* Avatar with neon glow */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-lg animate-pulse" />
              <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-3xl font-bold text-white shadow-2xl border-4 border-gray-800">
                {getInitials()}
              </div>
            </motion.div>

            {/* Name */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-2xl font-bold text-white"
            >
              {user?.fullName || user?.userId || "User"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400"
            >
              {user?.employeeId || "N/A"}
            </motion.p>
          </div>

          {/* Employee Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 mb-6"
          >
            <div className="bg-gray-700/30 rounded-2xl p-4 border border-gray-600/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{t("profile")}</p>
                  <p className="text-white font-medium">{user?.userId || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/30 rounded-2xl p-4 border border-gray-600/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Employee ID</p>
                  <p className="text-white font-medium">{user?.employeeId || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700/30 rounded-2xl p-4 border border-gray-600/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-600/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Company</p>
                  <p className="text-white font-medium truncate">{user?.companyUrl || "N/A"}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Logout Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleLogout}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl font-semibold shadow-lg active:scale-95 transition flex items-center justify-center gap-2 group"
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
      </motion.div>
    </div>
  );
};

export default ProfilePage;
