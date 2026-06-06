import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { getTaskDashboardStats, TaskDashboardStats } from "../../services/taskService";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
} from "../../utils/pageCardStyles";

interface TaskDashboardCardProps {
  onNavigateToList: () => void;
}

const TaskDashboardCard = ({ onNavigateToList }: TaskDashboardCardProps) => {
  const { t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const [stats, setStats] = useState<TaskDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getTaskDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("[TaskDashboardCard] Failed to fetch stats:", err);
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
      title: t("open") || "Open",
      value: stats?.open ?? 0,
      color: "#6b7280",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: t("working") || "Working",
      value: stats?.working ?? 0,
      color: "#3b82f6",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      title: t("completed") || "Completed",
      value: stats?.completed ?? 0,
      color: "#22c55e",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: t("overdue") || "Overdue",
      value: stats?.overdue ?? 0,
      color: "#ef4444",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: themeColors.text }}>{t("tasks") || "Tasks"}</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-2xl shadow-sm p-3"
            style={{
              background: themeColors.backgroundSecondary,
              border: `1px solid ${themeColors.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium" style={{ color: themeColors.textSecondary }}>
                {card.title}
              </span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: card.color + "18" }}
              >
                <span style={{ color: card.color }}>{card.icon}</span>
              </div>
            </div>
            {loading ? (
              <div className="h-5 w-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="text-xl font-bold" style={{ color: themeColors.text }}>
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
            <p className="font-semibold" style={{ color: themeColors.text }}>{t("myTasks") || "My Tasks"}</p>
            <p className="text-xs" style={{ color: themeColors.textSecondary }}>{t("viewAllTasks") || "View all your assigned tasks"}</p>
          </div>
        </div>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: themeColors.textSecondary }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
    </div>
  );
};

export default TaskDashboardCard;
