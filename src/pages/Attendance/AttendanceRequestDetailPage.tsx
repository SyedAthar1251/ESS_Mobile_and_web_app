import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import {
  getAttendanceRequest,
  AttendanceRequestDetail,
  mapDocstatusToStatus,
} from "../../services/attendanceRequest.service";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
} from "../../utils/pageCardStyles";
import DetailSection, { DetailRow } from "./components/DetailSection";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const AttendanceRequestDetailPage = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState<AttendanceRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const docstatus = request?.docstatus ?? 0;
  const status = mapDocstatusToStatus(docstatus);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!name) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await getAttendanceRequest(name);
        if (data) {
          setRequest(data);
        } else {
          setError("Request not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load request details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [name]);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(NaN);
    let normalized = dateStr.trim();
    if (normalized.includes(' ') && !normalized.includes('T')) {
      normalized = normalized.replace(' ', 'T');
    }
    const parsed = new Date(normalized);
    if (!isNaN(parsed.getTime())) return parsed;
    const parts = dateStr.split(/[- :]/);
    if (parts.length >= 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 
                      parts[3] ? Number(parts[3]) : 0, 
                      parts[4] ? Number(parts[4]) : 0, 
                      parts[5] ? Number(parts[5]) : 0);
    }
    return new Date(NaN);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = parseDate(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = parseDate(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calendarData = useMemo(() => {
    if (!request?.from_date || !request?.to_date) return null;

    const from = parseDate(request.from_date);
    const to = parseDate(request.to_date);
    
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;

    const datesInRange: Date[] = [];
    const current = new Date(from);
    while (current <= to) {
      datesInRange.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return {
      dates: datesInRange,
      reason: request.reason,
      halfDay: request.half_day === 1,
    };
  }, [request]);

  const renderCalendarView = () => {
    if (!calendarData) return null;

    const { dates, reason, halfDay } = calendarData;
    
    const firstDate = dates[0];
    const startDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const startDay = startDate.getDay();
    const daysInMonth = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0).getDate();
    
    const allDays: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      allDays.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      allDays.push(new Date(firstDate.getFullYear(), firstDate.getMonth(), d));
    }

    const monthHeader = startDate.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { 
      month: "long", 
      year: "numeric" 
    });

    const requestDateSet = new Set<string>(dates.map(d => 
      `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    ));

    const isRequestDate = (date: Date | null) => {
      if (!date) return false;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      return requestDateSet.has(key);
    };

    const getBadgeLabel = (date: Date | null) => {
      if (!date || !isRequestDate(date)) return null;
      if (reason === "Work From Home") return "WFH";
      if (reason === "On Duty") return "OD";
      return "REQ";
    };

    const getBadgeColor = (date: Date | null) => {
      if (!date || !isRequestDate(date)) return "";
      if (reason === "Work From Home") return "bg-blue-100 text-blue-700";
      if (reason === "On Duty") return "bg-purple-100 text-purple-700";
      return "bg-indigo-100 text-indigo-700";
    };

    return (
      <div className={`${getPageCardStyle(theme)} p-3 mb-4`}>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {t("calendarView") || "Calendar View"}
        </h3>
        
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            reason === "Work From Home" ? "bg-blue-100 text-blue-700" :
            reason === "On Duty" ? "bg-purple-100 text-purple-700" :
            "bg-gray-100 text-gray-700"
          }`}>
            {reason || "No Reason"}
          </span>
          {halfDay && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              {t("halfDay") || "Half Day"}
            </span>
          )}
          <span className="text-xs text-gray-500">{dates.length} {t("day") || "day"}{dates.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="grid grid-cols-7 text-center text-[10px] font-medium text-gray-400 mb-2">
          {DAY_LABELS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-2 text-center">
          {allDays.map((date, idx) => {
            if (!date) {
              return <div key={idx} />;
            }

            const isInRange = isRequestDate(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div key={idx} className="flex flex-col items-center justify-center gap-1">
                <div
                  className={`h-8 w-8 flex items-center justify-center rounded-full text-xs relative
                    ${isInRange 
                      ? "bg-indigo-600 text-white font-medium shadow-sm"
                      : "text-gray-700"
                    }`}
                >
                  {date.getDate()}
                  {isInRange && (
                    <span className={`absolute -bottom-3 px-1 rounded text-[8px] font-medium ${getBadgeColor(date)}`}>
                      {getBadgeLabel(date)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error || "Request not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/attendance/requests")}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {t("attendanceRequestDetails") || "Attendance Request Details"}
          </h1>
          <div className="w-10" />
        </div>

        {renderCalendarView()}

        <div className={`${getPageCardStyle(theme)} p-4`}>
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-800">{request.reason || "No Reason"}</h2>
              <p className="text-xs text-gray-400">ID: {request.name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              status === "Approved" ? "bg-green-100 text-green-700" :
              status === "Cancelled" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              {status}
            </span>
          </div>

          <DetailSection title={t("period") || "Period"}>
            <DetailRow label={t("fromDate") || "From Date"} value={formatDate(request.from_date)} />
            <DetailRow label={t("toDate") || "To Date"} value={formatDate(request.to_date)} />
          </DetailSection>

          {request.shift && (
            <DetailSection title={t("shift") || "Shift"}>
              <DetailRow label={t("shift") || "Shift"} value={request.shift} />
            </DetailSection>
          )}

          <DetailSection title={t("employee") || "Employee"}>
            <DetailRow label={t("employee") || "Employee"} value={request.employee} />
            <DetailRow label={t("employeeName") || "Employee Name"} value={request.employee_name} />
          </DetailSection>

          {(request.half_day || request.explanation) && (
            <DetailSection title={t("additionalInfo") || "Additional Info"}>
              {request.half_day === 1 && (
                <DetailRow label={t("halfDay") || "Half Day"} value={t("yes") || "Yes"} />
              )}
              {request.explanation && (
                <DetailRow label={t("explanation") || "Explanation"} value={request.explanation} />
              )}
            </DetailSection>
          )}

          <DetailSection title={t("timestamps") || "Timestamps"}>
            <DetailRow label={t("created") || "Created"} value={formatDateTime(request.creation)} />
            <DetailRow label={t("modified") || "Modified"} value={formatDateTime(request.modified)} />
          </DetailSection>
        </div>
      </div>
    </div>
  );
};

export default AttendanceRequestDetailPage;