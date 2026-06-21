import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { useAuth } from "../../auth/useAuth";
import {
  getAttendanceReport,
  getEmployeeCheckins,
  AttendanceReportItem,
  CheckinReportItem,
} from "../../services/report.service";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
  getListItemCardClass,
} from "../../utils/pageCardStyles";

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

const toArabic = (value: string | number) => {
  const str = String(value);
  return str.replace(/\d/g, (d) => arabicDigits[Number(d)]);
};

type ReportView = "attendance" | "checkin";

const ReportsPage = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [reportType, setReportType] = useState<ReportView>("attendance");
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportItem[]>([]);
  const [checkinReport, setCheckinReport] = useState<CheckinReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<"this_month" | "last_month" | "custom">("this_month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const reportOptions: { key: ReportView; label: string; icon: ReactNode }[] = [
    { key: "attendance", label: t("attendance") || "Attendance", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { key: "checkin", label: t("employeeCheckins") || "Employee Check-ins", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  const dateRangeOptions: { key: "this_month" | "last_month" | "custom"; label: string }[] = [
    { key: "this_month", label: t("thisMonth") || "This Month" },
    { key: "last_month", label: t("lastMonth") || "Last Month" },
    { key: "custom", label: t("custom") || "Custom" },
  ];

  const currentOption = reportOptions.find(opt => opt.key === reportType) || reportOptions[0];
  const currentDateRange = dateRangeOptions.find(o => o.key === selectedDateRange) || dateRangeOptions[0];

  const fetchReportData = async () => {
    if (!user?.employeeId) {
      setError("Employee ID not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      let fromDate: string | undefined;
      let toDate: string | undefined;

      if (selectedDateRange === "this_month") {
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        toDate = today.toISOString().split('T')[0];
      } else if (selectedDateRange === "last_month") {
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
        toDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
      } else {
        fromDate = startDate;
        toDate = endDate;
      }

      if (reportType === "attendance") {
        const attendanceData = await getAttendanceReport(fromDate, toDate);
        setAttendanceReport(attendanceData || []);
        setCheckinReport([]);
      } else {
        const checkinData = await getEmployeeCheckins(fromDate, toDate);
        setCheckinReport(checkinData || []);
        setAttendanceReport([]);
      }
    } catch (err: any) {
      console.error("[ReportsPage] Error fetching report data:", err);
      setError(err.message || "Failed to load reports data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [user?.employeeId, selectedDateRange, startDate, endDate, reportType]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user?.employeeId) {
        try {
          const today = new Date();
          let fromDate: string | undefined;
          let toDate: string | undefined;

          if (selectedDateRange === "this_month") {
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            toDate = today.toISOString().split('T')[0];
          } else if (selectedDateRange === "last_month") {
            fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
            toDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
          } else {
            fromDate = startDate;
            toDate = endDate;
          }

          if (reportType === "attendance") {
            const attendanceData = await getAttendanceReport(fromDate, toDate);
            setAttendanceReport(attendanceData || []);
          } else {
            const checkinData = await getEmployeeCheckins(fromDate, toDate);
            setCheckinReport(checkinData || []);
          }
        } catch (error) {
          console.error("[ReportsPage] Error refreshing data:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.employeeId, selectedDateRange, startDate, endDate, reportType]);

  const presentCount = (attendanceReport || []).filter(r => r.status === "Present").length;
  const absentCount = (attendanceReport || []).filter(r => r.status === "Absent").length;
  const leaveCount = (attendanceReport || []).filter(r => r.status === "On Leave").length;
  const halfDayCount = (attendanceReport || []).filter(r => r.status === "Half Day").length;
  const totalCount = (attendanceReport || []).length;

  const totalWorkingHours = (attendanceReport || []).reduce((sum, r) => sum + (r.working_hours || 0), 0);
  const averageWorkingHours = totalCount > 0 ? totalWorkingHours / totalCount : 0;
  const totalCheckins = (checkinReport || []).length;
  const checkIns = (checkinReport || []).filter(r => r.log_type === "IN").length;
  const checkOuts = (checkinReport || []).filter(r => r.log_type === "OUT").length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "--";
    const date = new Date(dateStr);
    const day = language === "ar" ? toArabic(date.getDate()) : date.getDate();
    const month = date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { month: "short" });
    return `${day} ${month}`;
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "--";
    if (timeStr.includes(":")) {
      const timePart = timeStr.split(" ")[1] || timeStr;
      const formatted = timePart.substring(0, 5);
      return language === "ar" ? toArabic(formatted) : formatted;
    }
    return timeStr;
  };

  const formatDateTime = (datetime: string) => {
    if (!datetime) return "--";
    const date = new Date(datetime.replace(" ", "T"));
    if (language === "ar") {
      return date.toLocaleDateString("ar-SA", { day: "numeric", month: "short" }) + " " + toArabic(date.getHours().toString().padStart(2, "0")) + ":" + toArabic(date.getMinutes().toString().padStart(2, "0"));
    }
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" }) + " " + date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return { bg: "bg-[#EBF5FF]", text: "text-[#2563EB]" };
      case "Absent":
        return { bg: "bg-[#FEF2F2]", text: "text-[#DC2626]" };
      case "On Leave":
        return { bg: "bg-[#F5F3FF]", text: "text-[#7C3AED]" };
      case "Half Day":
        return { bg: "bg-[#FFFBEB]", text: "text-[#D97706]" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-600" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("reports") || "Reports"}</h1>
          <button onClick={() => fetchReportData()} disabled={isRefreshing} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50" title="Refresh">
            <svg className={`w-4 h-4 text-gray-600 ${isRefreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Report Type Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`w-full ${getPageCardStyle(theme)} p-4 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentOption?.icon}</span>
              <span className="font-semibold text-gray-800">{currentOption?.label}</span>
            </div>
            <motion.span
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              className="text-gray-400"
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-20 overflow-hidden"
                >
                  {reportOptions.map((option) => (
                    <li key={option.key}>
                      <button
                        onClick={() => {
                          setReportType(option.key);
                          setDropdownOpen(false);
                        }}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${
                          reportType === option.key ? "bg-indigo-50" : ""
                        }`}
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-medium text-gray-800">{option.label}</span>
                        {reportType === option.key && (
                          <span className="ml-auto text-indigo-600">✓</span>
                        )}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Date Range Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            className={`w-full ${getPageCardStyle(theme)} p-4 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold text-gray-800">{currentDateRange?.label}</span>
            </div>
            <motion.span
              animate={{ rotate: filterDropdownOpen ? 180 : 0 }}
              className="text-gray-400"
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence>
            {filterDropdownOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10"
                  onClick={() => setFilterDropdownOpen(false)}
                />
                <motion.ul
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-20 overflow-hidden"
                >
                  {dateRangeOptions.map((option) => (
                    <li key={option.key}>
                      <button
                        onClick={() => {
                          setSelectedDateRange(option.key);
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${
                          selectedDateRange === option.key ? "bg-indigo-50" : ""
                        }`}
                      >
                        <span className="font-medium text-gray-800">{option.label}</span>
                        {selectedDateRange === option.key && (
                          <span className="ml-auto text-indigo-600">✓</span>
                        )}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Custom Date Range */}
        {selectedDateRange === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <button onClick={() => fetchReportData()} className="mt-2 text-sm underline hover:text-red-800">
            {t("retry") || "Retry"}
          </button>
        </div>
      )}

      {/* Attendance Report */}
      {reportType === "attendance" && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 * 0.06 }}
              className="bg-[#EBF5FF] rounded-2xl px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="h-9 w-9 rounded-full flex items-center justify-center mb-1 bg-[#2563EB]/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-base font-bold text-[#2563EB]">{presentCount}</p>
              <p className="text-[11px] font-medium text-gray-600 mt-0.5">{t("present") || "Present"}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 * 0.06 }}
              className="bg-[#FEF2F2] rounded-2xl px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="h-9 w-9 rounded-full flex items-center justify-center mb-1 bg-[#DC2626]/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-base font-bold text-[#DC2626]">{absentCount}</p>
              <p className="text-[11px] font-medium text-gray-600 mt-0.5">{t("absent") || "Absent"}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 * 0.06 }}
              className="bg-[#F5F3FF] rounded-2xl px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="h-9 w-9 rounded-full flex items-center justify-center mb-1 bg-[#7C3AED]/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-base font-bold text-[#7C3AED]">{leaveCount}</p>
              <p className="text-[11px] font-medium text-gray-600 mt-0.5">{t("leave") || "Leave"}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3 * 0.06 }}
              className="bg-[#FFFBEB] rounded-2xl px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="h-9 w-9 rounded-full flex items-center justify-center mb-1 bg-[#D97706]/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-base font-bold text-[#D97706]">{halfDayCount}</p>
              <p className="text-[11px] font-medium text-gray-600 mt-0.5">{t("halfDay") || "Half Day"}</p>
            </motion.div>
          </div>

          {/* Working Info Cards */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t("workingInformation") || "Working Information"}</h2>

            <div className="grid grid-cols-1 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 * 0.06 }}
                className={getPageCardStyle(theme) + " p-4"}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t("totalAttendanceRecords") || "Total Attendance Records"}</p>
                      <p className="text-lg font-bold text-gray-800">{totalCount}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 * 0.06 }}
                className={getPageCardStyle(theme) + " p-4"}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t("totalWorkingHours") || "Total Working Hours"}</p>
                      <p className="text-lg font-bold text-gray-800">{totalWorkingHours.toFixed(1)} hrs</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 * 0.06 }}
                className={getPageCardStyle(theme) + " p-4"}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t("averageWorkingHours") || "Average Working Hours"}</p>
                      <p className="text-lg font-bold text-gray-800">{averageWorkingHours.toFixed(1)} hrs</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Recent Attendance List */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t("recentAttendance") || "Recent Attendance"}</h2>

            {attendanceReport.length === 0 ? (
              <div className={getPageCardStyle(theme) + " p-8 text-center text-gray-500"}>
                <p>{t("noAttendanceRecords") || "No attendance records found."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceReport.slice(0, 10).map((item, index) => {
                  const statusStyle = getStatusColor(item.status);
                  return (
                    <motion.div
                      key={item.date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={getListItemCardClass(theme)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center ${statusStyle.bg} ${statusStyle.text}`}>
                            <span className="text-lg font-bold">{formatDate(item.date)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{formatDate(item.date)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {t("workingHours") || "Working Hours"}: {item.working_hours > 0 ? `${item.working_hours} hrs` : "--"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            {item.status}
                          </span>
                          {(item.late_entry === 1) && (
                            <p className="text-[10px] text-amber-600 mt-1">{t("lateEntry") || "Late Entry"}</p>
                          )}
                          {(item.early_exit === 1) && (
                            <p className="text-[10px] text-amber-600 mt-1">{t("earlyExit") || "Early Exit"}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div>
                          <span className="text-gray-400">{t("inTime") || "In Time"}:</span>
                          <span className="ml-1 text-gray-700">{formatTime(item.in_time)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">{t("outTime") || "Out Time"}:</span>
                          <span className="ml-1 text-gray-700">{formatTime(item.out_time)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Checkin Report */}
      {reportType === "checkin" && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 * 0.06 }}
              className="bg-[#EBF5FF] rounded-2xl px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="h-9 w-9 rounded-full flex items-center justify-center mb-1 bg-[#2563EB]/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <p className="text-base font-bold text-[#2563EB]">{checkIns}</p>
              <p className="text-[11px] font-medium text-gray-600 mt-0.5">{t("checkIn") || "IN"}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 * 0.06 }}
              className="bg-[#FEF2F2] rounded-2xl px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="h-9 w-9 rounded-full flex items-center justify-center mb-1 bg-[#DC2626]/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <p className="text-base font-bold text-[#DC2626]">{checkOuts}</p>
              <p className="text-[11px] font-medium text-gray-600 mt-0.5">{t("checkOut") || "OUT"}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 * 0.06 }}
              className="bg-[#F5F3FF] rounded-2xl px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="h-9 w-9 rounded-full flex items-center justify-center mb-1 bg-[#7C3AED]/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-base font-bold text-[#7C3AED]">{totalCheckins}</p>
              <p className="text-[11px] font-medium text-gray-600 mt-0.5">{t("totalAttendanceRecords") || "Total"}</p>
            </motion.div>
          </div>

          {/* Checkin List */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t("employeeCheckins") || "Employee Check-ins"} ({totalCheckins})</h2>

            {checkinReport.length === 0 ? (
              <div className={getPageCardStyle(theme) + " p-8 text-center text-gray-500"}>
                <p>{t("noCheckinRecords") || "No check-in records found."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {checkinReport.slice(0, 10).map((item, index) => {
                  const statusStyle = item.log_type === "IN"
                    ? { bg: "bg-green-100", text: "text-green-700", label: t("checkIn") || "IN" }
                    : { bg: "bg-blue-100", text: "text-blue-700", label: t("checkOut") || "OUT" };
                  return (
                    <motion.div
                      key={`${item.time}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={getListItemCardClass(theme)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${statusStyle.bg} ${statusStyle.text}`}>
                            {item.log_type === "IN" ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{statusStyle.label}</p>
                            <p className="text-xs text-gray-400">{formatDateTime(item.time)}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div>
                          <span className="text-gray-400">{t("shift") || "Shift"}:</span>
                          <span className="ml-1 text-gray-700">{item.shift || "--"}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">{t("location") || "Location"}:</span>
                          <span className="ml-1 text-gray-700">{item.location || "--"}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
