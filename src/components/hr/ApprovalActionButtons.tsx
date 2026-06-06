import { useTheme } from "../../store/ThemeContext";
import { motion } from "framer-motion";

interface ApprovalActionButtonsProps {
  onApprove: () => void;
  onReject: () => void;
  onView?: () => void;
  loading?: boolean;
  compact?: boolean;
}

const ApprovalActionButtons = ({ onApprove, onReject, onView, loading, compact }: ApprovalActionButtonsProps) => {
  const { themeColors } = useTheme();

  const btnClass = compact
    ? "px-2.5 py-1 text-xs font-medium rounded-lg transition-all"
    : "px-3 py-1.5 text-sm font-medium rounded-lg transition-all";

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onApprove}
        disabled={loading}
        className={`${btnClass} text-white`}
        style={{ background: "#16a34a" }}
      >
        Approve
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReject}
        disabled={loading}
        className={`${btnClass} text-white`}
        style={{ background: "#dc2626" }}
      >
        Reject
      </motion.button>
      {onView && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onView}
          disabled={loading}
          className={`${btnClass}`}
          style={{
            background: themeColors.background,
            color: themeColors.primary,
            border: `1px solid ${themeColors.border}`,
          }}
        >
          View
        </motion.button>
      )}
    </div>
  );
};

export default ApprovalActionButtons;
