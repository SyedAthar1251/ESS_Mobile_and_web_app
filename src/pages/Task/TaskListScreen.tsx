import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { getTaskList, Task } from "../../services/taskService";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getListItemCardClass,
  getPageCardStyle,
} from "../../utils/pageCardStyles";

interface TaskListScreenProps {
  onNavigateToDetail: (task: Task) => void;
  onBack: () => void;
}

const TaskListScreen = ({ onNavigateToDetail, onBack }: TaskListScreenProps) => {
  const { language, t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await getTaskList();
        setTasks(response.data);
      } catch (err) {
        console.error("[TaskListScreen] Failed to fetch tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const statusColors: Record<string, { bg: string; text: string }> = {
    Open: { bg: "bg-gray-100", text: "text-gray-700" },
    Working: { bg: "bg-blue-100", text: "text-blue-700" },
    "In Progress": { bg: "bg-blue-100", text: "text-blue-700" },
    Completed: { bg: "bg-green-100", text: "text-green-700" },
    Closed: { bg: "bg-green-100", text: "text-green-700" },
    Cancelled: { bg: "bg-red-100", text: "text-red-700" },
    "On Hold": { bg: "bg-yellow-100", text: "text-yellow-700" },
    Pending: { bg: "bg-orange-100", text: "text-orange-700" },
    Review: { bg: "bg-purple-100", text: "text-purple-700" },
  };

  const priorityColors: Record<string, { bg: string; text: string }> = {
    Low: { bg: "bg-gray-100", text: "text-gray-600" },
    Medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
    High: { bg: "bg-orange-100", text: "text-orange-700" },
    Urgent: { bg: "bg-red-100", text: "text-red-700" },
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today && status !== "Completed" && status !== "Closed";
  };

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: themeColors.textSecondary }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold" style={{ color: themeColors.text }}>{t("myTasks") || "My Tasks"}</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`${getPageCardStyle(theme)} p-4 animate-pulse`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="h-4 w-36 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-5 w-14 bg-gray-200 rounded-full" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="h-5 w-12 bg-gray-200 rounded-full" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className={`${getPageCardStyle(theme)} p-8 text-center`}>
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: themeColors.textSecondary }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p style={{ color: themeColors.textSecondary }}>{t("noTasksFound") || "No tasks found"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <motion.div
              key={task.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigateToDetail(task)}
              className={getListItemCardClass(theme)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate" style={{ color: themeColors.text }}>{task.subject}</h3>
                  <p className="text-sm truncate" style={{ color: themeColors.textSecondary }}>{task.project}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${priorityColors[task.priority]?.bg || "bg-gray-100"} ${priorityColors[task.priority]?.text || "text-gray-700"}`}>
                  {task.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.status]?.bg || "bg-gray-100"} ${statusColors[task.status]?.text || "text-gray-700"}`}>
                  {task.status}
                </span>
                <span className={`text-xs ${isOverdue(task.due_date, task.status) ? "text-red-500 font-semibold" : ""}`} style={!isOverdue(task.due_date, task.status) ? { color: themeColors.textSecondary } : {}}>
                  {formatDate(task.due_date)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskListScreen;
