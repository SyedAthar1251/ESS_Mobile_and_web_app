import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import { getPendingTaskMonitoring, PendingTaskMonitoring } from "../../services/admin.service";

const TaskMonitoring = () => {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeMenu, setActiveMenu] = useState("task-monitoring");
  const [tasks, setTasks] = useState<PendingTaskMonitoring[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getPendingTaskMonitoring();
        setTasks(data);
      } catch (err) {
        console.error("[TaskMonitoring] Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

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

  const cardStyle = isDark ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm border border-gray-100";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <AdminHeader onMenuToggle={() => setShowSidebar(true)} title="Task Monitoring" />
      <AdminSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      <div className="px-4 py-4 space-y-4 pb-8">
        <div>
          <h2 className="text-xl font-bold">Task Monitoring</h2>
          <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {loading ? "Loading..." : `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`rounded-2xl p-4 animate-pulse ${cardStyle}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`h-4 w-36 rounded mb-1 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                  </div>
                  <div className="flex gap-2">
                    <div className={`h-5 w-12 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className={`h-5 w-14 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                  </div>
                </div>
                <div className={`h-3 w-24 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl p-8 text-center ${cardStyle}`}>
            <svg className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>No tasks found</p>
            <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>All tasks are on track</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <motion.div
                key={task.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl p-4 ${cardStyle}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm flex-1 min-w-0 truncate">{task.subject}</h3>
                  <div className="flex gap-2 ml-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]?.bg || "bg-gray-100"} ${priorityColors[task.priority]?.text || "text-gray-700"}`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]?.bg || "bg-gray-100"} ${statusColors[task.status]?.text || "text-gray-700"}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    By: {task.assigned_by || "-"}
                  </span>
                  <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Due: {formatDate(task.due_date)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskMonitoring;
