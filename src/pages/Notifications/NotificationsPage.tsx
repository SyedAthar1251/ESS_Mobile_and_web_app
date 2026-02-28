import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";

// Notification types
interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  date: string;
  icon: string;
}

// Dropdown options
type NotificationFilter = "all" | "unread" | "read";

const NotificationsPage = () => {
  const { language, t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");

  const notificationFilters: { key: NotificationFilter; label: string; icon: string }[] = [
    { key: "all", label: t("all"), icon: "📋" },
    { key: "unread", label: t("unread"), icon: "🔔" },
    { key: "read", label: t("read"), icon: "✅" },
  ];

  // Dummy notification data
  const notifications: Notification[] = [
    {
      id: "NOT-001",
      title: "Leave Approved",
      message: "Your leave application for 15-20 Feb has been approved.",
      type: "success",
      is_read: false,
      date: "2024-02-22",
      icon: "✅",
    },
    {
      id: "NOT-002",
      title: "New Task Assigned",
      message: "You have been assigned to 'Complete project documentation'.",
      type: "info",
      is_read: false,
      date: "2024-02-21",
      icon: "📋",
    },
    {
      id: "NOT-003",
      title: "Salary Credited",
      message: "Your salary for January 2024 has been credited to your account.",
      type: "success",
      is_read: true,
      date: "2024-02-20",
      icon: "💰",
    },
    {
      id: "NOT-004",
      title: "Attendance Reminder",
      message: "Please remember to check in today before 9:00 AM.",
      type: "warning",
      is_read: true,
      date: "2024-02-21",
      icon: "⏰",
    },
    {
      id: "NOT-005",
      title: "Expense Rejected",
      message: "Your expense claim for 'Office Supplies' has been rejected.",
      type: "error",
      is_read: false,
      date: "2024-02-19",
      icon: "❌",
    },
  ];

  const typeColors: Record<string, { bg: string; border: string }> = {
    info: { bg: "bg-blue-50", border: "border-blue-200" },
    success: { bg: "bg-green-50", border: "border-green-200" },
    warning: { bg: "bg-yellow-50", border: "border-yellow-200" },
    error: { bg: "bg-red-50", border: "border-red-200" },
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !notif.is_read;
    if (activeFilter === "read") return notif.is_read;
    return true;
  });

  // Calculate stats
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.filter((n) => n.is_read).length;
  const successCount = notifications.filter((n) => n.type === "success").length;
  const warningCount = notifications.filter((n) => n.type === "warning" || n.type === "error").length;

  // Dashboard stats cards
  const statsCards = [
    { label: t("total"), value: notifications.length, icon: "📋", color: "bg-indigo-50", textColor: "text-indigo-600" },
    { label: t("unread"), value: unreadCount, icon: "🔔", color: "bg-red-50", textColor: "text-red-600" },
    { label: t("read"), value: readCount, icon: "✅", color: "bg-green-50", textColor: "text-green-600" },
    { label: t("alerts"), value: warningCount, icon: "⚠️", color: "bg-yellow-50", textColor: "text-yellow-600" },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("notifications")}</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} {t("new")}
            </span>
          )}
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

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {notificationFilters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
              activeFilter === filter.key
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
            <span className="text-4xl">🔔</span>
            <p className="mt-2">{t("noNotifications")}</p>
          </div>
        ) : (
          filteredNotifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl p-4 border ${typeColors[notif.type].bg} ${typeColors[notif.type].border} ${
                !notif.is_read ? "border-l-4" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{notif.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-800">{notif.title}</h4>
                    {!notif.is_read && (
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(notif.date)}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Mark All Read Button */}
      {unreadCount > 0 && (
        <button className="w-full bg-white text-indigo-600 py-3 rounded-xl font-medium hover:bg-indigo-50 transition-colors">
          Mark All as Read
        </button>
      )}
    </div>
  );
};

export default NotificationsPage;
