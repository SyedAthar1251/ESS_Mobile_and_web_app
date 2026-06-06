import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { getTravelRequests, TravelRequest } from "../../services/travelService";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getListItemCardClass,
  getPageCardStyle,
} from "../../utils/pageCardStyles";

interface TravelListScreenProps {
  onNavigateToDetails: (request: TravelRequest) => void;
  onBack: () => void;
}

const TravelListScreen = ({ onNavigateToDetails, onBack }: TravelListScreenProps) => {
  const { language, t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await getTravelRequests();
        setRequests(response.data);
      } catch (err) {
        console.error("[TravelListScreen] Failed to fetch requests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const statusColors: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "bg-orange-100", text: "text-orange-700" },
    Approved: { bg: "bg-green-100", text: "text-green-700" },
    Rejected: { bg: "bg-red-100", text: "text-red-700" },
    "On Hold": { bg: "bg-yellow-100", text: "text-yellow-700" },
    Completed: { bg: "bg-blue-100", text: "text-blue-700" },
    Draft: { bg: "bg-gray-100", text: "text-gray-700" },
    Cancelled: { bg: "bg-gray-100", text: "text-gray-700" },
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (status: string) => {
    const key = status.toLowerCase().replace(" ", "");
    return t(key) || status;
  };

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">{t("myTravelRequests") || "My Travel Requests"}</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${getPageCardStyle(theme)} p-4 animate-pulse`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full" />
              </div>
              <div className="h-3 w-40 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className={`${getPageCardStyle(theme)} p-8 text-center`}>
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">{t("noTravelRequests") || "No travel requests found"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <motion.div
              key={request.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigateToDetails(request)}
              className={getListItemCardClass(theme)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-800">{request.purpose}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(request.from_date)} - {formatDate(request.to_date)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[request.status]?.bg || "bg-gray-100"} ${statusColors[request.status]?.text || "text-gray-700"}`}>
                  {getStatusLabel(request.status)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{request.destination}</span>
                <span className="text-sm text-gray-500">{request.travel_type}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TravelListScreen;
