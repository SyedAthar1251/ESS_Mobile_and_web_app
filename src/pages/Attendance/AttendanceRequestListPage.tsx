import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { useNavigate } from "react-router-dom";
import {
  getAttendanceRequests,
  AttendanceRequestListItem,
  mapDocstatusToStatus,
} from "../../services/attendanceRequest.service";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
  getListItemCardClass,
} from "../../utils/pageCardStyles";

const EmptyState = () => (
  <div className="text-center py-8">
    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h4m5-8a3 3 0 013 3v6a3 3 0 01-3 3H9a3 3 0 01-3-3V9a3 3 0 013-3z" />
      </svg>
    </div>
    <p className="text-sm text-gray-500">No attendance requests found</p>
  </div>
);

const AttendanceRequestListPage = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AttendanceRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listDisplayLimit, setListDisplayLimit] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAttendanceRequests();
        setRequests(response.data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load attendance requests");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (request: AttendanceRequestListItem) => {
    navigate(`/attendance/requests/${request.name}`);
  };

  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(dateStr);
  };

  const formatDate = (dateStr: string) => {
    return parseDate(dateStr).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (docstatus: number) => {
    const s = mapDocstatusToStatus(docstatus).toLowerCase();
    let label = "";
    let bg = "";
    let text = "";

    if (s === "approved") {
      label = t("approved") || "Approved";
      bg = "bg-green-100";
      text = "text-green-700";
    } else if (s === "cancelled") {
      label = t("cancelled") || "Cancelled";
      bg = "bg-red-100";
      text = "text-red-700";
    } else {
      label = t("draft") || "Draft";
      bg = "bg-gray-100";
      text = "text-gray-700";
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const allListItems = requests;
  const totalItems = allListItems.length;
  const displayedItems = allListItems.slice(0, listDisplayLimit);
  const hasMore = totalItems > listDisplayLimit;
  const hitLimit = listDisplayLimit >= totalItems;

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("attendanceRequests") || "Attendance Requests"}</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-4 animate-pulse">
                <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-20 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        ) : requests.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {displayedItems.map((request, idx) => (
              <motion.div
                key={request.name || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleCardClick(request)}
                className={getListItemCardClass(theme)}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-gray-800 text-sm">{request.reason || "No Reason"}</h4>
                  {getStatusBadge(request.docstatus)}
                </div>
                <p className="text-xs text-gray-500">
                  {formatDate(request.from_date)} – {formatDate(request.to_date)}
                </p>
                {request.shift && (
                  <p className="text-xs text-gray-400">Shift: {request.shift}</p>
                )}
              </motion.div>
            ))}

            {hasMore && (
              <button
                onClick={() => setListDisplayLimit(hitLimit ? 10 : totalItems)}
                className="w-full text-sm text-indigo-600 font-medium py-2 hover:bg-indigo-50 rounded-xl transition-colors"
              >
                {hitLimit
                  ? t("showLess") || "Show Less"
                  : t("loadMore") || `Load More (${totalItems - listDisplayLimit} remaining)`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceRequestListPage;