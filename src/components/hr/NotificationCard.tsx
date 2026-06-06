import { useTheme } from "../../store/ThemeContext";
import { motion } from "framer-motion";
import { HRNotificationItem } from "../../services/hrNotification.service";

interface NotificationCardProps {
  notification: HRNotificationItem;
  onMarkAsRead: (name: string) => Promise<void>;
}

const getNotificationIcon = (item: HRNotificationItem, primaryColor: string) => {
  const text = `${item.subject || ""} ${item.message || ""}`.toLowerCase();
  let derivedType = "info";
  if (text.includes("approved") || text.includes("success")) {
    derivedType = "success";
  } else if (text.includes("reject") || text.includes("failed") || text.includes("error")) {
    derivedType = "error";
  } else if (text.includes("warning") || text.includes("alert") || text.includes("reminder")) {
    derivedType = "warning";
  }

  switch (derivedType) {
    case "success":
      return (
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case "error":
      return (
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    case "warning":
      return (
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: primaryColor + "18" }}>
          <svg className="w-5 h-5" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
      );
  }
};

const NotificationCard = ({ notification, onMarkAsRead }: NotificationCardProps) => {
  const { themeColors } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => {
        if (notification.read === 0) {
          onMarkAsRead(notification.name);
        }
      }}
      className={`p-4 cursor-pointer transition-colors border-b ${
        notification.read === 0 ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-gray-50"
      }`}
      style={{ borderColor: themeColors.border }}
    >
      <div className="flex items-start gap-3">
        {getNotificationIcon(notification, themeColors.primary)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`font-semibold text-sm truncate ${notification.read === 0 ? "" : "opacity-70"}`} style={{ color: themeColors.text }}>
              {notification.subject || "Notification"}
            </p>
            {notification.read === 0 && (
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: themeColors.primary }} />
            )}
          </div>
          <p className="text-xs mt-1 line-clamp-2" style={{ color: themeColors.textSecondary }}>
            {notification.message || ""}
          </p>
          <p className="text-xs mt-1.5" style={{ color: themeColors.textSecondary + "80" }}>
            {notification.creation || "-"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationCard;
