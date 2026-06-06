import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { getTravelRequestDetails, TravelRequest, cancelTravelRequest } from "../../services/travelService";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
} from "../../utils/pageCardStyles";

interface TravelDetailsScreenProps {
  request: TravelRequest;
  onBack: () => void;
}

const TravelDetailsScreen = ({ request: initialRequest, onBack }: TravelDetailsScreenProps) => {
  const { language, t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const [request, setRequest] = useState<TravelRequest>(initialRequest);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!initialRequest.name) return;
      try {
        setLoading(true);
        const details = await getTravelRequestDetails(initialRequest.name);
        if (details) {
          setRequest(details);
        }
      } catch (err) {
        console.error("[TravelDetailsScreen] Failed to fetch details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [initialRequest.name]);

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

  const handleCancel = async () => {
    if (!request.name) return;
    try {
      setCancelling(true);
      await cancelTravelRequest(request.name);
      setRequest((prev) => ({ ...prev, status: "Cancelled" }));
    } catch (err: any) {
      console.error("[TravelDetailsScreen] Failed to cancel:", err);
      alert(err.message || "Failed to cancel travel request");
    } finally {
      setCancelling(false);
    }
  };

  const cardClass = getPageCardStyle(theme);

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
        <h1 className="text-xl font-bold text-gray-800">{t("travelDetails") || "Travel Details"}</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className={`${getPageCardStyle(theme)} p-6 animate-pulse`}>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <div className="h-3 w-20 bg-gray-200 rounded mb-1" />
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[request.status]?.bg || "bg-gray-100"} ${statusColors[request.status]?.text || "text-gray-700"}`}>
              {getStatusLabel(request.status)}
            </span>
          </div>

          <div className={`${cardClass} p-6`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t("travelPurpose") || "Purpose"}</p>
                <p className="font-semibold text-gray-800">{request.purpose || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("travelType") || "Travel Type"}</p>
                <p className="font-semibold text-gray-800">{request.travel_type || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("destination") || "Destination"}</p>
                <p className="font-semibold text-gray-800">{request.destination || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("fromLocation") || "From"}</p>
                <p className="font-semibold text-gray-800">{request.from_location || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("toLocation") || "To"}</p>
                <p className="font-semibold text-gray-800">{request.to_location || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("totalDays") || "Total Days"}</p>
                <p className="font-semibold text-gray-800">{request.total_days || 0} {t("days") || "days"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("startDate") || "Start Date"}</p>
                <p className="font-semibold text-gray-800">{formatDate(request.from_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("endDate") || "End Date"}</p>
                <p className="font-semibold text-gray-800">{formatDate(request.to_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("estimatedExpense") || "Estimated Expense"}</p>
                <p className="font-semibold text-gray-800">{(request.estimated_expense || 0).toLocaleString()} SAR</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("employee") || "Employee"}</p>
                <p className="font-semibold text-gray-800">{request.employee_name || "-"}</p>
              </div>
            </div>

            {request.advance_required && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
                <p className="text-sm text-yellow-700">
                  {t("advanceRequired") || "Advance Required"}: {(request.advance_amount || 0).toLocaleString()} SAR
                </p>
              </div>
            )}
          </div>

          <div className={`${cardClass} p-6`}>
            <h3 className="font-semibold text-gray-800 mb-4">{t("approvalTimeline") || "Approval Timeline"}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{t("submitted") || "Submitted"}</p>
                  <p className="text-xs text-gray-500">{formatDate(request.submitted_date || request.creation)}</p>
                </div>
              </div>
              {request.manager_approved_date && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t("managerApproved") || "Manager Approved"}</p>
                    <p className="text-xs text-gray-500">{formatDate(request.manager_approved_date)}</p>
                  </div>
                </div>
              )}
              {request.hr_approved_date && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t("hrApproved") || "HR Approved"}</p>
                    <p className="text-xs text-gray-500">{formatDate(request.hr_approved_date)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {request.remarks && (
            <div className={`${cardClass} p-6`}>
              <h3 className="font-semibold text-gray-800 mb-2">{t("remarks") || "Remarks"}</h3>
              <p className="text-gray-600">{request.remarks}</p>
            </div>
          )}

          {(request.status === "Pending" || request.status === "Draft") && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-3 px-6 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {cancelling ? (t("cancelling") || "Cancelling...") : (t("cancelRequest") || "Cancel Request")}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default TravelDetailsScreen;
