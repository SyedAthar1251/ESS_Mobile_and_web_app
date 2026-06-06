import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { getTravelDashboardStats, TravelDashboardStats } from "../../services/travelService";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
} from "../../utils/pageCardStyles";

interface TravelScreenProps {
  onNavigateToList: () => void;
  onNavigateToCreate: () => void;
}

const TravelScreen = ({ onNavigateToList, onNavigateToCreate }: TravelScreenProps) => {
  const { t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const [stats, setStats] = useState<TravelDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getTravelDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("[TravelScreen] Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: t("total") || "Total",
      value: stats?.total ?? 0,
      color: "#6366f1",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      title: t("approved") || "Approved",
      value: stats?.approved ?? 0,
      color: "#22c55e",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      title: t("pending") || "Pending",
      value: stats?.pending ?? 0,
      color: "#f59e0b",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: t("rejected") || "Rejected",
      value: stats?.rejected ?? 0,
      color: "#ef4444",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  ];

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t("travel") || "Travel"}</h1>
        <button
          onClick={onNavigateToCreate}
          className="flex items-center gap-1 px-3 py-2 text-black rounded-lg transition-colors"
          style={{ backgroundColor: themeColors.primary }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">{t("applyTravel") || "Apply Travel"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl shadow-sm p-4"
            style={{
              background: themeColors.backgroundSecondary,
              border: `1px solid ${themeColors.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: themeColors.textSecondary }}>
                {card.title}
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: card.color + "18" }}
              >
                <span style={{ color: card.color }}>{card.icon}</span>
              </div>
            </div>
            {loading ? (
              <div className="h-7 w-10 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold" style={{ color: themeColors.text }}>
                {card.value}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={onNavigateToList}
        className={`w-full ${getPageCardStyle(theme)} p-4 flex items-center justify-between hover:shadow-md transition-shadow`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: themeColors.primary + "18" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: themeColors.primary }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800">{t("myTravelRequests") || "My Travel Requests"}</p>
            <p className="text-xs text-gray-500">{t("viewAllRequests") || "View all your travel requests"}</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
    </div>
  );
};

export default TravelScreen;
