import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";

// Task types
interface Task {
  id: string;
  title: string;
  status: "Open" | "In Progress" | "Completed" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Urgent";
  due_date: string;
  project: string;
  description: string;
}

// Dropdown options
type TaskView = "my_tasks" | "create_task";

const TaskPage = () => {
  const { language, t } = useLanguage();
  const [activeView, setActiveView] = useState<TaskView>("my_tasks");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const taskOptions: { key: TaskView; label: string; icon: ReactNode }[] = [
    { key: "my_tasks", label: t("myTasks"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { key: "create_task", label: t("createTask"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
  ];

  // Dummy task data
  const tasks: Task[] = [
    {
      id: "TASK-001",
      title: "Complete project documentation",
      status: "In Progress",
      priority: "High",
      due_date: "2024-02-25",
      project: "ESS Mobile App",
      description: "Write comprehensive documentation for the mobile app",
    },
    {
      id: "TASK-002",
      title: "Review pull requests",
      status: "Open",
      priority: "Medium",
      due_date: "2024-02-28",
      project: "ESS Mobile App",
      description: "Review and approve pending PRs from the team",
    },
    {
      id: "TASK-003",
      title: "Fix login bug",
      status: "Completed",
      priority: "Urgent",
      due_date: "2024-02-20",
      project: "ESS Mobile App",
      description: "Users unable to login with valid credentials",
    },
    {
      id: "TASK-004",
      title: "Update UI components",
      status: "Open",
      priority: "Low",
      due_date: "2024-03-05",
      project: "ESS Mobile App",
      description: "Refresh the design of existing components",
    },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    Open: { bg: "bg-gray-100", text: "text-gray-700" },
    "In Progress": { bg: "bg-blue-100", text: "text-blue-700" },
    Completed: { bg: "bg-green-100", text: "text-green-700" },
    Cancelled: { bg: "bg-red-100", text: "text-red-700" },
  };

  const priorityColors: Record<string, { bg: string; text: string }> = {
    Low: { bg: "bg-gray-100", text: "text-gray-600" },
    Medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
    High: { bg: "bg-orange-100", text: "text-orange-700" },
    Urgent: { bg: "bg-red-100", text: "text-red-700" },
  };

  const currentOption = taskOptions.find((opt) => opt.key === activeView);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
    });
  };

  // Calculate task stats
  const openTasks = tasks.filter((t) => t.status === "Open");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const urgentTasks = tasks.filter((t) => t.priority === "Urgent" || t.priority === "High");

  // Dashboard stats cards
  const statsCards = [
    { label: t("open"), value: openTasks.length, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>, color: "bg-gray-50", textColor: "text-gray-600" },
    { label: t("inProgress"), value: inProgressTasks.length, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>, color: "bg-blue-50", textColor: "text-blue-600" },
    { label: t("completed"), value: completedTasks.length, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "bg-green-50", textColor: "text-green-600" },
    { label: t("highPriority"), value: urgentTasks.length, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>, color: "bg-red-50", textColor: "text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("tasks")}</h1>
          <span className="text-sm text-gray-500">{tasks.length} {t("total")}</span>
        </div>

        {/* Dashboard Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.color} rounded-2xl p-4 text-center`}
            >
              <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dropdown Selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentOption?.icon}</span>
            <span className="font-semibold text-gray-800">{currentOption?.label}</span>
          </div>
          <motion.span animate={{ rotate: dropdownOpen ? 180 : 0 }} className="text-gray-400">
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-20 overflow-hidden"
              >
                {taskOptions.map((option) => (
                  <li key={option.key}>
                    <button
                      onClick={() => {
                        setActiveView(option.key);
                        setDropdownOpen(false);
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${
                        activeView === option.key ? "bg-indigo-50" : ""
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-gray-800">{option.label}</span>
                      {activeView === option.key && <span className="ml-auto text-indigo-600">✓</span>}
                    </button>
                  </li>
                ))}
              </motion.ul>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* My Tasks View */}
      {activeView === "my_tasks" && (
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
              <p>{t("noTasksFound")}</p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
                    <p className="text-sm text-gray-500">{task.project}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      priorityColors[task.priority].bg
                    } ${priorityColors[task.priority].text}`}
                  >
                    {task.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusColors[task.status].bg
                    } ${statusColors[task.status].text}`}
                  >
                    {task.status}
                  </span>
                  <span className="text-xs text-gray-400">{t("due")} {formatDate(task.due_date)}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Create Task View */}
      {activeView === "create_task" && (
        <div className="bg-white rounded-2xl shadow-lg p-4 space-y-4">
          <h2 className="font-semibold text-gray-800 mb-4">{t("createNewTask")}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("taskTitle")}</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              placeholder={t("enterTaskTitle")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("project")}</label>
            <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50">
              <option>ESS Mobile App</option>
              <option>Web Dashboard</option>
              <option>API Development</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t("priority")}</label>
              <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t("dueDate")}</label>
              <input type="date" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("description")}</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              placeholder={t("enterTaskDescription")}
            />
          </div>

          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            {t("createTaskButton")}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskPage;
