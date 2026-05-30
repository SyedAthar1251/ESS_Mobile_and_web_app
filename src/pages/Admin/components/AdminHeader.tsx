import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../store/ThemeContext";
import { useAuth } from "../../../auth/useAuth";

interface AdminHeaderProps {
  onMenuToggle: () => void;
  title?: string;
}

const AdminHeader = ({ onMenuToggle, title = "ESS Admin" }: AdminHeaderProps) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDark = theme !== "light";
  const isAdmin = (user?.userType || "employee") === "admin";

  return (
    <div
      className={`sticky top-0 z-30 backdrop-blur-xl border-b ${
        isDark ? "bg-gray-900/95 border-gray-800" : "bg-white/95 border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
        {!isAdmin && (
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            <span className="hidden sm:inline">Employee App</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminHeader;
