import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import NotificationCard from "../../components/hr/NotificationCard";
import { getHRNotifications, markHRNotificationAsRead, HRNotificationItem } from "../../services/hrNotification.service";

const HRNotifications = () => {
  const { themeColors } = useTheme();
  const [notifications, setNotifications] = useState<HRNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await getHRNotifications();
      setNotifications(response.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch notifications");
    }
  }, []);

  const initialFetch = useCallback(async () => {
    setLoading(true);
    await fetchNotifications();
    setLoading(false);
  }, [fetchNotifications]);

  useEffect(() => {
    initialFetch();

    // Poll every 30 seconds
    pollingRef.current = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [initialFetch, fetchNotifications]);

  const handleMarkAsRead = async (name: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.name === name ? { ...n, read: 1 } : n))
    );
    try {
      await markHRNotificationAsRead(name);
    } catch (err) {
      console.error("[HRNotifications] Failed to mark as read:", err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return n.read === 0;
    if (filter === "read") return n.read === 1;
    return true;
  });

  const unreadCount = notifications.filter((n) => n.read === 0).length;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: themeColors.text }}>Notifications</h1>
            <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={initialFetch}
            className="p-2 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: themeColors.textSecondary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2"
      >
        {(["all", "unread", "read"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: filter === f ? themeColors.primary : themeColors.background,
              color: filter === f ? "#ffffff" : themeColors.text,
              border: `1px solid ${filter === f ? themeColors.primary : themeColors.border}`,
            }}
          >
            {f === "all" ? "All" : f === "unread" ? `Unread (${unreadCount})` : "Read"}
          </button>
        ))}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={initialFetch} className="ml-auto text-sm text-red-600 font-medium hover:underline">Retry</button>
        </motion.div>
      )}

      {/* Notification List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: themeColors.backgroundSecondary }}
      >
        {loading ? (
          <div className="divide-y" style={{ borderColor: themeColors.border }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-full bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: themeColors.background }}>
              <svg className="w-8 h-8" style={{ color: themeColors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-base font-medium" style={{ color: themeColors.textSecondary }}>No notifications</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: themeColors.border }}>
            {filteredNotifications.map((notification, index) => (
              <NotificationCard
                key={notification.name || index}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HRNotifications;
