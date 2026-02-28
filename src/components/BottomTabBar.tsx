import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

// Better icons using SVG
const icons = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  attendance: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  leave: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  profile: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

const BottomTabBar = () => {
  const { t, language } = useLanguage();

  const tabs = [
    { to: "/dashboard", label: t("dashboard"), icon: icons.home },
    { to: "/attendance", label: t("attendance"), icon: icons.attendance },
    { to: "/leave", label: t("leave"), icon: icons.leave },
    { to: "/profile", label: t("profile"), icon: icons.profile },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      {/* Neon glow effect */}
      <div className="absolute inset-0 bg-indigo-600/20 blur-xl rounded-3xl" />
      
      <div className="relative flex justify-between items-center bg-gray-900/90 backdrop-blur-xl shadow-2xl rounded-3xl px-3 py-2">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className="relative flex-1">
            {({ isActive }) => (
              <div className="relative flex flex-col items-center py-2 px-1">
                {/* Neon glow effect behind active tab */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-indigo-600 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div
                  className={`relative z-10 transition-all duration-300 ${
                    isActive ? "text-white scale-110" : "text-gray-400"
                  }`}
                >
                  {tab.icon}
                </div>

                {/* Label - separate from icon to avoid overlap */}
                <span
                  className={`relative z-10 text-xs mt-1 font-medium transition-all duration-300 ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomTabBar;
