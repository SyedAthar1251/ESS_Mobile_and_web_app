import { motion } from "framer-motion";
import { useTheme } from "../../../store/ThemeContext";

interface SettingCardProps {
  title: string;
  subtitle?: string;
  status?: "active" | "inactive";
  onEdit?: () => void;
  children?: React.ReactNode;
  delay?: number;
}

const SettingCard = ({
  title,
  subtitle,
  status = "active",
  onEdit,
  children,
  delay = 0,
}: SettingCardProps) => {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.01 }}
      className={`rounded-2xl p-4 transition-all ${
        isDark
          ? "bg-gray-800 border border-gray-700 hover:border-gray-600"
          : "bg-white shadow-sm hover:shadow-md border border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold truncate">{title}</h4>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                status === "active"
                  ? isDark
                    ? "bg-green-500/10 text-green-400"
                    : "bg-green-50 text-green-600"
                  : isDark
                  ? "bg-gray-500/10 text-gray-400"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
          {subtitle && (
            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {subtitle}
            </p>
          )}
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </motion.div>
  );
};

export default SettingCard;
