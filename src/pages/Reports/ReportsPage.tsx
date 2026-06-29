import { useState, useEffect, ReactNode, useMemo } from "react";
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

interface GroupedCheckin {
  date: string;
  dayLabel: string;
  items: CheckinReportItem[];
  firstIn: string | null;
  lastOut: string | null;
  totalHours: number;
}

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
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [checkinDisplayLimit, setCheckinDisplayLimit] = useState(7);

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
        const data = await getAttendanceReport(fromDate, toDate);
        setAttendanceReport(data || []);
        setCheckinReport([]);
      } else {
        const data = await getEmployeeCheckins(fromDate, toDate);
        setCheckinReport(data || []);
        setAttendanceReport([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load reports data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReportData(); }, [user?.employeeId, selectedDateRange, startDate, endDate, reportType]);

  useEffect(() => {
    const handler = async () => {
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
          } else { fromDate = startDate; toDate = endDate; }
          if (reportType === "attendance") {
            setAttendanceReport((await getAttendanceReport(fromDate, toDate)) || []);
          } else {
            setCheckinReport((await getEmployeeCheckins(fromDate, toDate)) || []);
          }
        } catch (e) { console.error("[ReportsPage] refresh error:", e); }
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [user?.employeeId, selectedDateRange, startDate, endDate, reportType]);

  useEffect(() => { setCheckinDisplayLimit(7); }, [checkinReport.length]);

  const presentCount = (attendanceReport || []).filter(r => r.status === "Present").length;
  const absentCount = (attendanceReport || []).filter(r => r.status === "Absent").length;
  const leaveCount = (attendanceReport || []).filter(r => r.status === "On Leave").length;
  const halfDayCount = (attendanceReport || []).filter(r => r.status === "Half Day").length;
  const lateCount = (attendanceReport || []).filter(r => r.late_entry === 1).length;
  const earlyExitCount = (attendanceReport || []).filter(r => r.early_exit === 1).length;
  const totalCount = (attendanceReport || []).length;
  const totalWorkingHours = (attendanceReport || []).reduce((sum, r) => sum + (r.working_hours || 0), 0);
  const averageWorkingHours = totalCount > 0 ? totalWorkingHours / totalCount : 0;
  const totalCheckins = (checkinReport || []).length;
  const checkIns = (checkinReport || []).filter(r => r.log_type === "IN").length;
  const checkOuts = (checkinReport || []).filter(r => r.log_type === "OUT").length;

  const [attendanceDisplayLimit, setAttendanceDisplayLimit] = useState(7);

  const attendanceCalendarMap = useMemo(() => {
    const map = new Map<string, { status: string; late: boolean; early: boolean }>();
    (attendanceReport || []).forEach((item) => {
      map.set(item.date, { status: item.status, late: item.late_entry === 1, early: item.early_exit === 1 });
    });
    return map;
  }, [attendanceReport]);

  const getAttendanceCalendarDays = () => {
    if (attendanceReport.length === 0) return [];
    const dates = attendanceReport.map(r => r.date).sort();
    const minDate = new Date(dates[0] + "T00:00:00");
    const maxDate = new Date(dates[dates.length - 1] + "T00:00:00");
    const days: { date: string; day: number; status: "present" | "absent" | "leave" | "halfday" | "late" | "none" }[] = [];
    const current = new Date(minDate);
    while (current <= maxDate) {
      const dateStr = current.toISOString().split('T')[0];
      const info = attendanceCalendarMap.get(dateStr);
      let status: "present" | "absent" | "leave" | "halfday" | "late" | "none" = "none";
      if (info) {
        if (info.late) status = "late";
        else if (info.status === "Absent") status = "absent";
        else if (info.status === "On Leave") status = "leave";
        else if (info.status === "Half Day") status = "halfday";
        else status = "present";
      }
      days.push({ date: dateStr, day: current.getDate(), status });
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const parseTime = (timeStr: string): Date => {
    if (!timeStr) return new Date(0);
    return new Date(timeStr.replace(" ", "T"));
  };

  const calcHours = (inTime: string, outTime: string): number => {
    if (!inTime || !outTime) return 0;
    const diff = parseTime(outTime).getTime() - parseTime(inTime).getTime();
    return Math.max(0, diff / (1000 * 60 * 60));
  };

  const groupedCheckins: GroupedCheckin[] = useMemo(() => {
    const grouped: Record<string, CheckinReportItem[]> = {};
    (checkinReport || []).forEach((item) => {
      const dateKey = item.time.split(" ")[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });
    return Object.entries(grouped)
      .map(([date, items]) => {
        const sorted = [...items].sort((a, b) => parseTime(a.time).getTime() - parseTime(b.time).getTime());
        const firstIn = sorted.find(i => i.log_type === "IN")?.time || null;
        const lastOut = [...sorted].reverse().find(i => i.log_type === "OUT")?.time || null;
        let totalHours = 0;
        if (firstIn && lastOut) totalHours = calcHours(firstIn, lastOut);
        const dateObj = new Date(date + "T00:00:00");
        const dayLabel = dateObj.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { weekday: "short", day: "numeric", month: "short" });
        return { date, dayLabel, items: sorted, firstIn, lastOut, totalHours };
      })
      .sort((a, b) => parseTime(b.date).getTime() - parseTime(a.date).getTime());
  }, [checkinReport, language]);

  const checkinDaysCount = groupedCheckins.length;
  const avgHoursPerDay = checkinDaysCount > 0
    ? groupedCheckins.reduce((sum, g) => sum + g.totalHours, 0) / checkinDaysCount
    : 0;

  const calendarHeatmap = useMemo(() => {
    const map = new Map<string, { hasCheckin: boolean; isLate: boolean }>();
    groupedCheckins.forEach((g) => {
      const hasLate = g.items.some((item, idx) => {
        if (item.log_type !== "IN" || idx === 0) return false;
        const inTime = parseTime(item.time);
        return inTime.getHours() > 9 || (inTime.getHours() === 9 && inTime.getMinutes() > 0);
      });
      map.set(g.date, { hasCheckin: true, isLate: hasLate });
    });
    return map;
  }, [groupedCheckins]);

  const getCalendarDays = () => {
    if (groupedCheckins.length === 0) return [];
    const dates = groupedCheckins.map(g => g.date).sort();
    const minDate = new Date(dates[0] + "T00:00:00");
    const maxDate = new Date(dates[dates.length - 1] + "T00:00:00");
    const days: { date: string; day: number; status: "present" | "late" | "none" }[] = [];
    const current = new Date(minDate);
    while (current <= maxDate) {
      const dateStr = current.toISOString().split('T')[0];
      const info = calendarHeatmap.get(dateStr);
      days.push({
        date: dateStr,
        day: current.getDate(),
        status: info ? (info.isLate ? "late" : "present") : "none",
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const toggleDateExpand = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

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

  const formatHours = (hrs: number) => {
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    if (m === 0) return `${h}h`;
    return language === "ar" ? `${toArabic(h)}س ${toArabic(m)}د` : `${h}h ${m}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present": return { bg: "bg-[#EBF5FF]", text: "text-[#2563EB]" };
      case "Absent": return { bg: "bg-[#FEF2F2]", text: "text-[#DC2626]" };
      case "On Leave": return { bg: "bg-[#F5F3FF]", text: "text-[#7C3AED]" };
      case "Half Day": return { bg: "bg-[#FFFBEB]", text: "text-[#D97706]" };
      default: return { bg: "bg-gray-100", text: "text-gray-600" };
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

  const displayedGroups = groupedCheckins.slice(0, checkinDisplayLimit);
  const hasMoreGroups = groupedCheckins.length > checkinDisplayLimit;
  const checkinCalDays = getCalendarDays();

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
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`w-full ${getPageCardStyle(theme)} p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentOption?.icon}</span>
              <span className="font-semibold text-gray-800">{currentOption?.label}</span>
            </div>
            <motion.span animate={{ rotate: dropdownOpen ? 180 : 0 }} className="text-gray-400">▼</motion.span>
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <motion.ul initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-20 overflow-hidden">
                  {reportOptions.map((option) => (
                    <li key={option.key}>
                      <button onClick={() => { setReportType(option.key); setDropdownOpen(false); }} className={`w-full p-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${reportType === option.key ? "bg-indigo-50" : ""}`}>
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-medium text-gray-800">{option.label}</span>
                        {reportType === option.key && <span className="ml-auto text-indigo-600">✓</span>}
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
          <button onClick={() => setFilterDropdownOpen(!filterDropdownOpen)} className={`w-full ${getPageCardStyle(theme)} p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold text-gray-800">{currentDateRange?.label}</span>
            </div>
            <motion.span animate={{ rotate: filterDropdownOpen ? 180 : 0 }} className="text-gray-400">▼</motion.span>
          </button>
          <AnimatePresence>
            {filterDropdownOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
                <motion.ul initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-20 overflow-hidden">
                  {dateRangeOptions.map((option) => (
                    <li key={option.key}>
                      <button onClick={() => { setSelectedDateRange(option.key); setFilterDropdownOpen(false); }} className={`w-full p-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${selectedDateRange === option.key ? "bg-indigo-50" : ""}`}>
                        <span className="font-medium text-gray-800">{option.label}</span>
                        {selectedDateRange === option.key && <span className="ml-auto text-indigo-600">✓</span>}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              </>
            )}
          </AnimatePresence>
        </div>

        {selectedDateRange === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <button onClick={() => fetchReportData()} className="mt-2 text-sm underline hover:text-red-800">{t("retry") || "Retry"}</button>
        </div>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* ATTENDANCE REPORT */}
      {/* ════════════════════════════════════════════════ */}
      {reportType === "attendance" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { value: presentCount, label: t("present") || "Present", color: "bg-[#EBF5FF]", textColor: "text-[#2563EB]", pillColor: "bg-[#2563EB]/10", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
              { value: absentCount, label: t("absent") || "Absent", color: "bg-[#FEF2F2]", textColor: "text-[#DC2626]", pillColor: "bg-[#DC2626]/10", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> },
              { value: lateCount, label: t("lateEntry") || "Late", color: "bg-[#FFFBEB]", textColor: "text-[#D97706]", pillColor: "bg-[#D97706]/10", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
              { value: totalWorkingHours.toFixed(1), label: t("totalWorkingHours") || "Total Hrs", color: "bg-[#F5F3FF]", textColor: "text-[#7C3AED]", pillColor: "bg-[#7C3AED]/10", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
            ].map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className={`${stat.color} rounded-2xl px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm`}>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center mb-1 ${stat.pillColor}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{stat.icon}</svg>
                </div>
                <p className={`text-base font-bold ${stat.textColor}`}>{stat.value}</p>
                <p className="text-[11px] font-medium text-gray-600 mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Mini Calendar Heatmap */}
          {getAttendanceCalendarDays().length > 0 && (
            <div className={getPageCardStyle(theme) + " p-4"}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">{t("attendanceOverview") || "Attendance Overview"}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {getAttendanceCalendarDays().map((d) => (
                  <div key={d.date} className="flex flex-col items-center gap-0.5">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium ${
                      d.status === "present" ? "bg-green-500 text-white" :
                      d.status === "late" ? "bg-amber-400 text-white" :
                      d.status === "absent" ? "bg-red-500 text-white" :
                      d.status === "leave" ? "bg-purple-500 text-white" :
                      d.status === "halfday" ? "bg-orange-400 text-white" :
                      "bg-gray-100 text-gray-400"
                    }`}>
                      {language === "ar" ? toArabic(d.day) : d.day}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500 flex-wrap">
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> {t("present") || "Present"}</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> {t("lateEntry") || "Late"}</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> {t("absent") || "Absent"}</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" /> {t("leave") || "Leave"}</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" /> {t("halfDay") || "Half Day"}</div>
              </div>
            </div>
          )}

          {/* Attendance List */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t("recentAttendance") || "Recent Attendance"}</h2>
            {attendanceReport.length === 0 ? (
              <div className={getPageCardStyle(theme) + " p-8 text-center text-gray-500"}>
                <p>{t("noAttendanceRecords") || "No attendance records found."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceReport.slice(0, attendanceDisplayLimit).map((item, index) => {
                  const statusStyle = getStatusColor(item.status);
                  return (
                    <motion.div key={item.date} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={getListItemCardClass(theme)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center ${statusStyle.bg} ${statusStyle.text}`}>
                            <span className="text-lg font-bold">{formatDate(item.date)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{formatDate(item.date)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {t("workingHours") || "Working Hours"}: {item.working_hours > 0 ? `${item.working_hours} hrs` : "--"}
                              {item.late_entry === 1 && <span className="text-amber-600 ml-1">· {t("lateEntry") || "Late"}</span>}
                              {item.early_exit === 1 && <span className="text-amber-600 ml-1">· {t("earlyExit") || "Early"}</span>}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>{item.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div><span className="text-gray-400">{t("inTime") || "In Time"}:</span><span className="ml-1 text-gray-700">{formatTime(item.in_time)}</span></div>
                        <div><span className="text-gray-400">{t("outTime") || "Out Time"}:</span><span className="ml-1 text-gray-700">{formatTime(item.out_time)}</span></div>
                      </div>
                    </motion.div>
                  );
                })}
                {attendanceReport.length > attendanceDisplayLimit && (
                  <button onClick={() => setAttendanceDisplayLimit(prev => prev + 7)} className="w-full py-3 text-sm text-indigo-600 font-medium bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition-colors">
                    {t("loadMore") || "Load More"} ({attendanceReport.length - attendanceDisplayLimit} {t("moreDays") || "more days"})
                  </button>
                )}
                {attendanceDisplayLimit > 7 && attendanceReport.length > 7 && (
                  <button onClick={() => setAttendanceDisplayLimit(7)} className="w-full py-2 text-xs text-gray-500 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                    {t("showLess") || "Show Less"}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════ */}
      {/* CHECKIN REPORT */}
      {/* ════════════════════════════════════════════════ */}
      {reportType === "checkin" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { value: checkIns, label: t("checkIn") || "IN", color: "bg-[#EBF5FF]", textColor: "text-[#2563EB]", pillColor: "bg-[#2563EB]/10", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /> },
              { value: checkOuts, label: t("checkOut") || "OUT", color: "bg-[#FEF2F2]", textColor: "text-[#DC2626]", pillColor: "bg-[#DC2626]/10", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /> },
              { value: checkinDaysCount, label: t("days") || "Days", color: "bg-[#F5F3FF]", textColor: "text-[#7C3AED]", pillColor: "bg-[#7C3AED]/10", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
              { value: formatHours(avgHoursPerDay), label: t("avgHours") || "Avg Hrs", color: "bg-[#FFFBEB]", textColor: "text-[#D97706]", pillColor: "bg-[#D97706]/10", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
            ].map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className={`${stat.color} rounded-2xl px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm`}>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center mb-1 ${stat.pillColor}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{stat.icon}</svg>
                </div>
                <p className={`text-base font-bold ${stat.textColor}`}>{stat.value}</p>
                <p className="text-[11px] font-medium text-gray-600 mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Mini Calendar Heatmap */}
          {checkinCalDays.length > 0 && (
            <div className={getPageCardStyle(theme) + " p-4"}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">{t("activityOverview") || "Activity Overview"}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {checkinCalDays.map((d) => (
                  <div key={d.date} className="flex flex-col items-center gap-0.5">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium ${
                      d.status === "present" ? "bg-green-500 text-white" :
                      d.status === "late" ? "bg-amber-400 text-white" :
                      "bg-gray-100 text-gray-400"
                    }`}>
                      {language === "ar" ? toArabic(d.day) : d.day}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> {t("present") || "Present"}</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> {t("late") || "Late"}</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 inline-block" /> {t("absent") || "Absent"}</div>
              </div>
            </div>
          )}

          {/* Grouped Check-in List */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t("employeeCheckins") || "Employee Check-ins"} ({totalCheckins})</h2>

            {groupedCheckins.length === 0 ? (
              <div className={getPageCardStyle(theme) + " p-8 text-center text-gray-500"}>
                <p>{t("noCheckinRecords") || "No check-in records found."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedGroups.map((group) => {
                  const isExpanded = expandedDates.has(group.date);
                  return (
                    <motion.div key={group.date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={getPageCardStyle(theme) + " overflow-hidden"}>
                      {/* Date Header - Always visible, clickable to expand */}
                      <button onClick={() => toggleDateExpand(group.date)} className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{group.dayLabel}</p>
                            <p className="text-xs text-gray-500">
                              {group.firstIn && group.lastOut
                                ? `${formatTime(group.firstIn)} → ${formatTime(group.lastOut)}`
                                : group.firstIn
                                ? `${formatTime(group.firstIn)}`
                                : "--"}
                              {group.totalHours > 0 && ` · ${formatHours(group.totalHours)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{group.items.length} {t("entries") || "entries"}</span>
                          <motion.svg animate={{ rotate: isExpanded ? 180 : 0 }} className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </motion.svg>
                        </div>
                      </button>

                      {/* Expanded: Individual check-in records */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="border-t border-gray-100 px-4 pb-3 pt-2 space-y-2">
                              {group.items.map((item, idx) => {
                                const isIn = item.log_type === "IN";
                                return (
                                  <div key={`${item.time}-${idx}`} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50">
                                    <div className="flex items-center gap-3">
                                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isIn ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                                        {isIn ? (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                        ) : (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">{isIn ? (t("checkIn") || "IN") : (t("checkOut") || "OUT")}</p>
                                        <p className="text-[10px] text-gray-400">{item.shift || "--"}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-gray-700">{formatTime(item.time)}</p>
                                      <p className="text-[10px] text-gray-400">{item.location || "--"}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                {hasMoreGroups && (
                  <button onClick={() => setCheckinDisplayLimit(prev => prev + 7)} className="w-full py-3 text-sm text-indigo-600 font-medium bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition-colors">
                    {t("loadMore") || "Load More"} ({groupedCheckins.length - checkinDisplayLimit} {t("moreDays") || "more days"})
                  </button>
                )}
                {checkinDisplayLimit > 7 && groupedCheckins.length > 7 && (
                  <button onClick={() => setCheckinDisplayLimit(7)} className="w-full py-2 text-xs text-gray-500 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                    {t("showLess") || "Show Less"}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
