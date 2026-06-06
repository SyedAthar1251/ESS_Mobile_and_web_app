import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { useNotificationStore } from "../../store/notificationStore";
import { NotificationItem } from "../../services/notification.service";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getListItemCardClass,
  getPageCardStyle,
} from "../../utils/pageCardStyles";
import { useNavigate } from "react-router-dom";


type NotificationFilter = "all" | "unread" | "read";

const PULL_THRESHOLD = 80;

const NotificationsPage = () => {
  const { t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const navigate = useNavigate();

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const loading = useNotificationStore((s) => s.loading);
  const refreshNotifications = useNotificationStore((s) => s.refreshNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const selectedNotification = useNotificationStore((s) => s.selectedNotification);
  const selectNotification = useNotificationStore((s) => s.selectNotification);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0 && scrollRef.current && scrollRef.current.scrollTop <= 0) {
      setPullDistance(Math.min(diff * 0.5, PULL_THRESHOLD * 1.5));
    }
  }, [isPulling]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      await refreshNotifications();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [isPulling, pullDistance, refreshNotifications]);

  const getNotificationIcon = (item: NotificationItem) => {
    const text = `${item.subject || ""} ${item.message || ""}`.toLowerCase();
    if (text.includes("approved") || text.includes("success")) return "✅";
    if (text.includes("reject") || text.includes("failed")) return "❌";
    if (text.includes("warning") || text.includes("alert")) return "⚠️";
    if (text.includes("leave")) return "📋";
    if (text.includes("salary") || text.includes("credited")) return "💰";
    if (text.includes("attendance") || text.includes("reminder")) return "⏰";
    return "📋";
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return n.read === 0;
    if (activeFilter === "read") return n.read === 1;
    return true;
  });

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (notification.read === 0) {
      await markAsRead(String(notification.name));
    }
    if (notification.document_type === "Leave Application") {
      console.log("[Notification Navigation] Notification clicked", notification);
      console.log("[Notification Navigation] Document Type:", notification.document_type);
      console.log("[Notification Navigation] Reference Name:", notification.reference_name);
      console.log("[Notification Navigation] Opening Leave Details");
      navigate("/leave", { state: { openLeaveDetail: true, leaveId: notification.reference_name } });
    } else {
      selectNotification(notification);
    }
  };

  const notificationFilters: { key: NotificationFilter; label: string }[] = [
    { key: "all", label: t("all") || "All" },
    { key: "unread", label: t("unread") || "Unread" },
    { key: "read", label: t("read") || "Read" },
  ];

  const readCount = notifications.filter((n) => n.read === 1).length;

  const statsCards = [
    { label: t("total") || "Total", value: notifications.length, icon: "📋", color: "bg-indigo-50", textColor: "text-indigo-600" },
    { label: t("unread") || "Unread", value: unreadCount, icon: "🔔", color: "bg-red-50", textColor: "text-red-600", action: "markAllRead" },
    { label: t("read") || "Read", value: readCount, icon: "✅", color: "bg-green-50", textColor: "text-green-600" },
  ];

  if (loading && notifications.length === 0) {
    return (
      <div className={EMPLOYEE_PAGE_CONTAINER}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-2xl p-4 animate-pulse">
                <div className="h-8 w-8 mx-auto bg-gray-300 rounded mb-2"></div>
                <div className="h-3 w-12 mx-auto bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto overscroll-y-contain"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div className="flex items-center justify-center overflow-hidden transition-all duration-200" style={{ height: pullDistance > 0 ? Math.max(pullDistance, 40) : 0 }}>
        <div className="flex flex-col items-center gap-1">
          {isRefreshing ? (
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className={`w-5 h-5 text-indigo-500 transition-transform ${pullDistance >= PULL_THRESHOLD ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          <span className="text-xs text-gray-400">{isRefreshing ? (t("refreshing") || "Refreshing...") : pullDistance >= PULL_THRESHOLD ? (t("releaseToRefresh") || "Release to refresh") : (t("pullToRefresh") || "Pull to refresh")}</span>
        </div>
      </div>

      <div className={EMPLOYEE_PAGE_CONTAINER}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">{t("notifications") || "Notifications"}</h1>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-full hover:bg-indigo-700 transition-colors font-medium"
                >
                  {t("markAllAsRead") || "Mark All Read"}
                </button>
              )}
              <button
                onClick={() => refreshNotifications()}
                disabled={isRefreshing}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <svg className={`w-4 h-4 text-gray-600 ${isRefreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  if (stat.action === "markAllRead" && unreadCount > 0) {
                    markAllAsRead();
                  }
                }}
                className={`${stat.color} rounded-2xl p-4 text-center shadow-sm ${stat.action === "markAllRead" && unreadCount > 0 ? "cursor-pointer hover:opacity-80 active:scale-95 transition-all" : ""}`}
              >
                <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

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

        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className={`${getPageCardStyle(theme)} p-8 text-center`}>
              <span className="text-4xl">🔔</span>
              <p className="mt-2 font-medium text-gray-600">
                {activeFilter === "all"
                  ? (t("noNotifications") || "No notifications yet")
                  : activeFilter === "unread"
                  ? (t("noUnreadNotifications") || "No unread notifications")
                  : (t("noReadNotifications") || "No read notifications")
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif, index) => (
              <motion.div
                key={notif.name || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNotificationClick(notif)}
                className={`${getListItemCardClass(theme)} ${
                  notif.read === 0 ? "bg-indigo-50/50 border-l-4 border-indigo-500" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{getNotificationIcon(notif)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-800">{notif.subject || "Notification"}</h4>
                      {notif.read === 0 && (
                        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{notif.creation || "-"}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Notification Detail Popup */}
      <AnimatePresence>
        {selectedNotification && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => selectNotification(null)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ${theme === 'neon-green' ? 'neon-card' : 'bg-white'}`}>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between" style={{ background: themeColors.primary }}>
                  <h3 className="font-bold text-lg truncate flex-1 mr-2" style={{ color: themeColors.text || '#ffffff' }}>
                    {selectedNotification.subject || "Notification"}
                  </h3>
                  <button
                    onClick={() => selectNotification(null)}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0"
                    style={{ color: themeColors.text || '#ffffff' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: selectedNotification.read === 0 ? '#EEF2FF' : '#F3F4F6', color: selectedNotification.read === 0 ? '#4F46E5' : '#6B7280' }}>
                      {selectedNotification.read === 0 ? "Unread" : "Read"}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedNotification.message || "No message content."}
                  </p>
                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Date</span>
                      <span className="text-xs text-gray-600">{selectedNotification.creation || "-"}</span>
                    </div>
                    {selectedNotification.reference_document && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Reference</span>
                        <span className="text-xs text-indigo-600 font-medium">{selectedNotification.reference_document}</span>
                      </div>
                    )}
                    {selectedNotification.reference_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Document ID</span>
                        <span className="text-xs text-gray-600">{selectedNotification.reference_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPage;
