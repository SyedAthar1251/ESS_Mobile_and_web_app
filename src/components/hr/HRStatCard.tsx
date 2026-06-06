import { useTheme } from "../../store/ThemeContext";
import { motion } from "framer-motion";

interface HRStatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  loading?: boolean;
  onClick?: () => void;
}

const HRStatCard = ({ title, value, icon, color, loading, onClick }: HRStatCardProps) => {
  const { themeColors } = useTheme();

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl shadow-sm p-5 animate-pulse"
        style={{ background: themeColors.backgroundSecondary }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-8 w-16 bg-gray-200 rounded" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`rounded-2xl shadow-sm p-5 ${onClick ? "cursor-pointer" : ""}`}
      style={{
        background: themeColors.backgroundSecondary,
        border: `1px solid ${themeColors.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>
          {title}
        </span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: (color || themeColors.primary) + "18" }}
        >
          <span style={{ color: color || themeColors.primary }}>{icon}</span>
        </div>
      </div>
      <div className="text-3xl font-bold" style={{ color: themeColors.text }}>
        {value}
      </div>
    </motion.div>
  );
};

export default HRStatCard;
