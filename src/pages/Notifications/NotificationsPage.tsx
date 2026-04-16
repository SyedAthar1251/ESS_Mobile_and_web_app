import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { getNotificationList, NotificationItem } from "../../services/notification.service";

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
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("[NotificationsPage] Fetching notifications from API...");
      const response = await getNotificationList();
      
      // Transform API data to local format
      const transformedNotifications: Notification[] = response.data.map((item: NotificationItem) => {
        // Map API type to local type
        let type: "info" | "success" | "warning" | "error" = "info";
        if (item.type) {
          const typeLower = item.type.toLowerCase();
          if (typeLower === "success" || typeLower === "approved") {
            type = "success";
          } else if (typeLower === "warning" || typeLower === "alert" || typeLower === "reminder") {
            type = "warning";
          } else if (typeLower === "error" || typeLower === "rejected" || typeLower === "failed") {
            type = "error";
          }
        }

        // Determine icon based on content/subject
        let icon = "📋";
        const subjectLower = (item.subject || "").toLowerCase();
        if (subjectLower.includes("leave") || subjectLower.includes("approved")) {
          icon = "✅";
        } else if (subjectLower.includes("task") || subjectLower.includes("assigned")) {
          icon = "📋";
        } else if (subjectLower.includes("salary") || subjectLower.includes("credited")) {
          icon = "💰";
        } else if (subjectLower.includes("attendance") || subjectLower.includes("reminder")) {
          icon = "⏰";
        } else if (subjectLower.includes("expense") || subjectLower.includes("rejected")) {
          icon = "❌";
        }

        // Parse date - handle "YYYY-MM-DD HH:MM:SS" format
        const dateStr = item.creation || "";
        let formattedDate = dateStr;
        if (dateStr.includes(" ")) {
          // Convert "YYYY-MM-DD HH:MM:SS" to Date
          const datePart = dateStr.split(" ")[0];
          formattedDate = datePart;
        }

        return {
          id: item.name || Math.random().toString(),
          title: item.subject || "Notification",
          message: item.content || "",
          type,
          is_read: item.read === 1,
          date: formattedDate,
          icon,
        };
      });

      console.log("[NotificationsPage] Transformed notifications:", transformedNotifications);
      setNotifications(transformedNotifications);
    } catch (err: any) {
      console.error("[NotificationsPage] Error fetching notifications:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Pull to refresh handler
  const handleRefresh = () => {
    fetchNotifications();
  };

  // Calculate stats
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.filter((n) => n.is_read).length;
  const successCount = notifications.filter((n) => n.type === "success").length;
  const warningCount = notifications.filter((n) => n.type === "warning" || n.type === "error").length;

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !notif.is_read;
    if (activeFilter === "read") return notif.is_read;
    return true;
  });

  const notificationFilters: { key: NotificationFilter; label: string; icon: string }[] = [
    { key: "all", label: t("all"), icon: "📋" },
    { key: "unread", label: t("unread"), icon: "🔔" },
    { key: "read", label: t("read"), icon: "✅" },
  ];

  const typeColors: Record<string, { bg: string; border: string }> = {
    info: { bg: "bg-blue-50", border: "border-blue-200" },
    success: { bg: "bg-green-50", border: "border-green-200" },
    warning: { bg: "bg-yellow-50", border: "border-yellow-200" },
    error: { bg: "bg-red-50", border: "border-red-200" },
  };

  // Dashboard stats cards
  const statsCards = [
    { label: t("total"), value: notifications.length, icon: "📋", color: "bg-indigo-50", textColor: "text-indigo-600" },
    { label: t("unread"), value: unreadCount, icon: "🔔", color: "bg-red-50", textColor: "text-red-600" },
    { label: t("read"), value: readCount, icon: "✅", color: "bg-green-50", textColor: "text-green-600" },
    { label: t("alerts"), value: warningCount, icon: "⚠️", color: "bg-yellow-50", textColor: "text-yellow-600" },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    // Handle "YYYY-MM-DD HH:MM:SS" format
    const datePart = dateStr.split(" ")[0];
    const date = new Date(datePart);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-2xl p-4 animate-pulse">
                <div className="h-8 w-8 mx-auto bg-gray-300 rounded mb-2"></div>
                <div className="h-3 w-12 mx-auto bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-2xl p-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
                  <div className="h-3 w-full bg-gray-300 rounded"></div>
                  <div className="h-2 w-1/4 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">{t("notifications")}</h1>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="mt-2 text-red-600 font-medium">{t("error") || "Error"}</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 bg-red-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors"
          >
            {t("retry") || "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("notifications")}</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-black text-xs px-2 py-1 rounded-full">
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
                ? "bg-indigo-600 text-black"
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
          <div className={`p-8 text-center ${theme === 'neon-green' ? 'neon-card' : 'bg-white rounded-2xl'}`}>
            <span className="text-4xl">🔔</span>
            <p className="mt-2 font-medium text-gray-600">
              {activeFilter === "all" 
                ? (t("noNotifications") || "No notifications yet")
                : activeFilter === "unread"
                ? (t("noUnreadNotifications") || "No unread notifications")
                : (t("noReadNotifications") || "No read notifications")
              }
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeFilter === "all" ? "You're all caught up!" : ""}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl p-4 border ${theme === 'neon-green' ? 'neon-card' : ''} ${typeColors[notif.type].bg} ${typeColors[notif.type].border} ${
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
