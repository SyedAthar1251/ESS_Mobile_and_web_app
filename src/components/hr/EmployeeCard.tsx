import { useTheme } from "../../store/ThemeContext";
import { motion } from "framer-motion";
import { HREmployee } from "../../services/hrEmployee.service";

interface EmployeeCardProps {
  employee: HREmployee;
}

const EmployeeCard = ({ employee }: EmployeeCardProps) => {
  const { themeColors } = useTheme();

  const getInitials = () => {
    if (employee.employee_name) {
      return employee.employee_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "E";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="rounded-2xl shadow-sm p-4"
      style={{
        background: themeColors.backgroundSecondary,
        border: `1px solid ${themeColors.border}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: themeColors.primary }}
        >
          {getInitials()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: themeColors.text }}>
            {employee.employee_name}
          </p>
          <p className="text-xs truncate" style={{ color: themeColors.textSecondary }}>
            {employee.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {employee.department && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: themeColors.primary + "15", color: themeColors.primary }}
              >
                {employee.department}
              </span>
            )}
            {employee.designation && (
              <span className="text-xs truncate" style={{ color: themeColors.textSecondary }}>
                {employee.designation}
              </span>
            )}
          </div>
        </div>
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: employee.status === "Active" ? "#16a34a" : "#dc2626" }}
        />
      </div>
    </motion.div>
  );
};

export default EmployeeCard;
