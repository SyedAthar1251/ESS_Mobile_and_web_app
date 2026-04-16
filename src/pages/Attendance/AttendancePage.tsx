import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../auth/useAuth";
import { useTheme } from "../../store/ThemeContext";
import { getEmployeeCheckinList, getCheckinDetail, CheckinListItem, EmployeeCheckin, getAttendanceList, AttendanceDetails, AttendanceListItem } from "../../services/attendance.service";

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

const toArabic = (value: string | number) => {
  const str = String(value);
  return str.replace(/\d/g, (d) => arabicDigits[Number(d)]);
};

// Dropdown options for attendance page
type AttendanceView = "attendance_list" | "checkins_list";

// Filter types (design only - currently not applied to API)
interface AttendanceFilters {
  dateRange: string;
  fromDate: string;
  toDate: string;
}

const AttendancePage = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { theme, themeColors } = useTheme();
  const [activeView, setActiveView] = useState<AttendanceView>("attendance_list");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [checkinList, setCheckinList] = useState<CheckinListItem[]>([]);
  const [selectedCheckin, setSelectedCheckin] = useState<EmployeeCheckin | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  
  // New state for attendance list from API
  const [attendanceData, setAttendanceData] = useState<{
    details: AttendanceDetails | null;
    list: AttendanceListItem[];
  } | null>(null);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<AttendanceListItem | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  
  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AttendanceFilters>({
    dateRange: "",
    fromDate: "",
    toDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<{
    dateRange: string;
    fromDate: string;
    toDate: string;
  } | null>(null);

  // Pagination state for checkins list
  const [checkinPage, setCheckinPage] = useState(1);
  const CHECKINS_PER_PAGE = 10;

  // Pagination state for attendance list
  const [attendancePage, setAttendancePage] = useState(1);
  const ATTENDANCE_PER_PAGE = 10;

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    IN: { bg: "bg-green-100", text: "text-green-700", label: t("checkIn") },
    OUT: { bg: "bg-blue-100", text: "text-blue-700", label: t("checkOut") },
  };

  const attendanceOptions: { key: AttendanceView; label: string; icon: ReactNode }[] = [
    { key: "attendance_list", label: t("attendanceList"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { key: "checkins_list", label: t("checkinsList"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  useEffect(() => {
    const fetchCheckinList = async () => {
      if (!user?.employeeId) {
        setError("Employee ID not found. Please login again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getEmployeeCheckinList(user.employeeId);
        // Sort checkins by time descending (newest first)
        const sortedData = [...data].sort(
          (a, b) => parseDateString(b.time).getTime() - parseDateString(a.time).getTime()
        );
        setCheckinList(sortedData);
      } catch (err: any) {
        console.error("[AttendancePage] Error fetching checkin list:", err);
        setError(err.message || "Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchCheckinList();
  }, [user]);

  // Refresh checkin list when page becomes visible (fixes mobile app issue)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user?.employeeId) {
        // Page became visible - fetch fresh data
        console.log("[AttendancePage] Page became visible, refreshing data...");
        try {
          const data = await getEmployeeCheckinList(user.employeeId);
          const sortedData = [...data].sort(
            (a, b) => parseDateString(b.time).getTime() - parseDateString(a.time).getTime()
          );
          setCheckinList(sortedData);
        } catch (error) {
          console.error("[AttendancePage] Error refreshing data:", error);
        }
      }
    };

    // Handle both visibility change and focus events (better for mobile)
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [user]);

  const handleCheckinClick = async (checkinName: string) => {
    try {
      setDetailLoading(true);
      const detail = await getCheckinDetail(checkinName);
      setSelectedCheckin(detail);
    } catch (err: any) {
      console.error("[AttendancePage] Error fetching checkin detail:", err);
      setError(err.message || "Failed to load checkin details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Fetch attendance list from API
  const fetchAttendanceList = async () => {
    try {
      setAttendanceLoading(true);
      const year = calendarDate.getFullYear();
      const month = (calendarDate.getMonth() + 1).toString().padStart(2, "0");
      const response = await getAttendanceList(year, month);
      setAttendanceData({
        details: response.data.attendance_details,
        list: response.data.attendance_list,
      });
    } catch (err: any) {
      console.error("[AttendancePage] Error fetching attendance list:", err);
      setError(err.message || "Failed to load attendance list");
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Get filtered attendance list based on applied filters
  const getFilteredAttendanceList = (): AttendanceListItem[] => {
    if (!attendanceData?.list) return [];
    
    // If no filters applied, return all data
    if (!appliedFilters || !appliedFilters.dateRange) {
      return attendanceData.list;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return attendanceData.list.filter((item) => {
      // Parse the attendance_date to get the date
      // Format is like "08 Sunday" or "08 Sunday, 2026"
      const dateParts = item.attendance_date.split(' ');
      const day = parseInt(dateParts[0]);
      const month = calendarDate.getMonth();
      const year = calendarDate.getFullYear();
      const itemDate = new Date(year, month, day);
      itemDate.setHours(0, 0, 0, 0);

      switch (appliedFilters.dateRange) {
        case "today":
          return itemDate.getTime() === today.getTime();
        
        case "yesterday":
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return itemDate.getTime() === yesterday.getTime();
        
        case "this_week":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return itemDate >= weekStart && itemDate <= weekEnd;
        
        case "this_month":
          return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
        
        case "previous_month":
          const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          return itemDate.getMonth() === prevMonth.getMonth() && itemDate.getFullYear() === prevMonth.getFullYear();
        
        case "custom":
          if (appliedFilters.fromDate && appliedFilters.toDate) {
            const fromDate = new Date(appliedFilters.fromDate);
            fromDate.setHours(0, 0, 0, 0);
            const toDate = new Date(appliedFilters.toDate);
            toDate.setHours(23, 59, 59, 999);
            return itemDate >= fromDate && itemDate <= toDate;
          }
          return true;
        
        default:
          return true;
      }
    });
  };

  // Get paginated attendance list
  const filteredAttendanceList = getFilteredAttendanceList();
  const paginatedAttendanceList = filteredAttendanceList.slice(0, attendancePage * ATTENDANCE_PER_PAGE);
  const hasMoreAttendance = filteredAttendanceList.length > attendancePage * ATTENDANCE_PER_PAGE;

  // Fetch attendance list when calendar month changes
  useEffect(() => {
    fetchAttendanceList();
  }, [calendarDate]);

  const close = () => {
    setSelectedCheckin(null);
  };

  // Helper to parse date string that might be in format "YYYY-MM-DD HH:MM:SS" or ISO
  const parseDateString = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    // Replace space with 'T' for proper parsing
    const normalized = dateStr.replace(' ', 'T');
    return new Date(normalized);
  };

  // Format timestamp for display
  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = parseDateString(dateStr);
    return date.toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Format time string (handles both "HH:MM:SS" and "YYYY-MM-DD HH:MM:SS" formats)
  const formatTimeString = (timeStr: string | null) => {
    if (!timeStr) return "--:--";
    // If it contains a space, it's a full datetime, extract just the time part
    if (timeStr.includes(' ')) {
      return timeStr.split(' ')[1]?.substring(0, 5) || "--:--";
    }
    // If it contains colon, assume it's a time string
    if (timeStr.includes(':')) {
      return timeStr.substring(0, 5);
    }
    return timeStr;
  };

  const formatDate = (dateStr: string) => {
    const date = parseDateString(dateStr);
    if (language === "ar") {
      return toArabic(date.getDate()) + " " + date.toLocaleDateString("ar-SA", { month: "short" });
    }
    return date.getDate() + " " + date.toLocaleDateString("en-US", { month: "short" });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "--:--";
    const date = parseDateString(dateStr);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const time = `${hours}:${minutes}`;
    return language === "ar" ? toArabic(time) : time;
  };

  const formatFullDate = (dateStr: string) => {
    const date = parseDateString(dateStr);
    if (language === "ar") {
      return date.toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" });
    }
    return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  };

  const getDayName = (dateStr: string) => {
    const date = parseDateString(dateStr);
    if (language === "ar") {
      return date.toLocaleDateString("ar-SA", { weekday: "long" });
    }
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  // Group checkins by date
  const groupedCheckins = (() => {
    const grouped: Record<string, CheckinListItem[]> = {};
    
    checkinList.forEach((checkin) => {
      const dateKey = checkin.time.split(" ")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(checkin);
    });

    return Object.entries(grouped)
      .map(([date, items]) => ({
        date,
        day: getDayName(date),
        items: items.sort((a, b) => parseDateString(b.time).getTime() - parseDateString(a.time).getTime()),
        fullDate: formatFullDate(date),
      }))
      .sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime());
  })();

  // Calculate attendance stats
  const totalCheckins = checkinList.length;
  const checkIns = checkinList.filter(c => c.log_type === "IN").length;
  const checkOuts = checkinList.filter(c => c.log_type === "OUT").length;
  const uniqueDays = groupedCheckins.length;

  // Get paginated checkins (show last 10 by default)
  const paginatedCheckins = checkinList.slice(0, checkinPage * CHECKINS_PER_PAGE);
  const hasMoreCheckins = checkinList.length > checkinPage * CHECKINS_PER_PAGE;

  // Reset page when checkinList changes
  useEffect(() => {
    setCheckinPage(1);
  }, [checkinList.length]);

  // Reset attendance page when filters or attendanceData changes
  useEffect(() => {
    setAttendancePage(1);
  }, [attendanceData, appliedFilters]);

  // Calendar helpers (based on attendance data from API)
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth(); // 0-indexed
  const startOfMonth = new Date(calendarYear, calendarMonth, 1);
  const endOfMonth = new Date(calendarYear, calendarMonth + 1, 0);
  const startWeekday = startOfMonth.getDay(); // 0 = Sunday
  const totalDaysInMonth = endOfMonth.getDate();

  // Create a map of dates with attendance status from API data
  const attendanceStatusMap = new Map<string, {
    hasAttendance: boolean;
    isPresent: boolean;
    inTime: string | null;
  }>();
  
  if (attendanceData?.list) {
    attendanceData.list.forEach((item) => {
      // Parse date from attendance_date format like "08 Sunday"
      const dateParts = item.attendance_date.split(' ');
      const day = parseInt(dateParts[0]);
      const key = `${calendarYear}-${calendarMonth}-${day}`;
      attendanceStatusMap.set(key, {
        hasAttendance: true,
        isPresent: item.in_time !== null,
        inTime: item.in_time,
      });
    });
  }

  const buildCalendarDays = () => {
    const days: {
      key: string;
      date: Date | null;
      isToday: boolean;
      isWeekend: boolean;
      hasAttendance: boolean;
      isPresent: boolean;
    }[] = [];

    const today = new Date();

    // Leading empty cells
    for (let i = 0; i < startWeekday; i++) {
      days.push({
        key: `empty-${i}`,
        date: null,
        isToday: false,
        isWeekend: false,
        hasAttendance: false,
        isPresent: false,
      });
    }

    // Month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = new Date(calendarYear, calendarMonth, day);
      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
      const weekday = date.getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const keyForAttendance = `${calendarYear}-${calendarMonth}-${day}`;
      const attendanceStatus = attendanceStatusMap.get(keyForAttendance);

      days.push({
        key: `day-${day}`,
        date,
        isToday,
        isWeekend,
        hasAttendance: attendanceStatus?.hasAttendance ?? false,
        isPresent: attendanceStatus?.isPresent ?? false,
      });
    }

    return days;
  };

  const calendarDays = buildCalendarDays();

  // Stats cards data - now uses API data
  const statsCards = [
    {
      label: t("present"),
      value: attendanceData?.details?.present ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-[#EBF5FF]",
      textColor: "text-[#2563EB]",
      pillColor: "bg-[#2563EB]/10",
    },
    {
      label: t("absent"),
      value: attendanceData?.details?.absent ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      color: "bg-[#FEF2F2]",
      textColor: "text-[#DC2626]",
      pillColor: "bg-[#DC2626]/10",
    },
    {
      label: t("leave"),
      value: 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3m6 0a3 3 0 00-3-3m0 0V5m0 6v8" />
        </svg>
      ),
      color: "bg-[#F5F3FF]",
      textColor: "text-[#7C3AED]",
      pillColor: "bg-[#7C3AED]/10",
    },
    {
      label: t("late"),
      value: attendanceData?.details?.late ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-[#FFFBEB]",
      textColor: "text-[#D97706]",
      pillColor: "bg-[#D97706]/10",
    },
  ];

  // Get current selected option
  const currentOption = attendanceOptions.find(opt => opt.key === activeView);

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header, Calendar & Dashboard Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("attendance")}</h1>
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-1 px-3 py-2 text-black rounded-lg transition-colors shadow-sm"
            style={{ backgroundColor: themeColors.primary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-sm font-medium">{t("filter")}</span>
          </button>
        </div>

        {/* Calendar Card */}
        <div className={`rounded-3xl shadow-lg p-4 ${theme === "neon-green" ? "neon-card" : "bg-white"}`}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() =>
                setCalendarDate(
                  new Date(calendarYear, calendarMonth - 1, Math.min(calendarDate.getDate(), 28))
                )
              }
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400">
                {calendarDate.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={() =>
                setCalendarDate(
                  new Date(calendarYear, calendarMonth + 1, Math.min(calendarDate.getDate(), 28))
                )
              }
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 text-center text-[10px] font-medium text-gray-400 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {calendarDays.map((item) =>
              item.date ? (
                <div
                  key={item.key}
                  className={`flex flex-col items-center justify-center gap-1 ${
                    item.isToday ? "font-semibold" : ""
                  }`}
                >
                  <div
                    className={`h-8 w-8 flex items-center justify-center rounded-full text-xs ${
                      item.isToday
                        ? "bg-[#2563EB] text-white shadow-sm"
                        : "text-gray-700"
                    }`}
                  >
                    {language === "ar"
                      ? toArabic(item.date.getDate())
                      : item.date.getDate()}
                  </div>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      item.isPresent
                        ? "bg-green-500"
                        : item.hasAttendance
                        ? "bg-red-500"
                        : item.isWeekend
                        ? "bg-gray-300"
                        : "bg-transparent"
                    }`}
                  />
                </div>
              ) : (
                <div key={item.key} />
              )
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between mt-4 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
              <span className="text-gray-500">{t("present")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#D97706]" />
              <span className="text-gray-500">{t("late")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
              <span className="text-gray-500">{t("absent")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
              <span className="text-gray-500">{t("leave")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="text-gray-500">{t("weekend")}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`${stat.color} rounded-2xl px-2 py-3 flex flex-col items-center justify-center text-center shadow-sm`}
            >
              <div className={`h-9 w-9 rounded-full flex items-center justify-center mb-1 ${stat.pillColor}`}>
                {stat.icon}
              </div>
              <p className={`text-base font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
              <p className="text-[11px] font-medium text-gray-600 mt-0.5">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dropdown Selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`w-full shadow-lg p-4 flex items-center justify-between ${theme === 'neon-green' ? 'neon-card' : 'bg-white rounded-2xl'}`}
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

        {/* Dropdown Menu */}
        <AnimatePresence>
          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              
              {/* Menu */}
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-20 overflow-hidden"
              >
                {attendanceOptions.map((option) => (
                  <li key={option.key}>
                    <button
                      onClick={() => {
                        setActiveView(option.key);
                        setDropdownOpen(false);
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${
                        activeView === option.key ? "bg-indigo-50" : ""
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-gray-800">{option.label}</span>
                      {activeView === option.key && (
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

      {/* Content based on selected view */}
      {activeView === "attendance_list" && (
        <div className={`rounded-3xl shadow-lg overflow-hidden ${theme === 'neon-green' ? 'neon-card' : 'bg-white'}`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">{t("attendanceHistory")}</h2>
          </div>

          {attendanceLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : getFilteredAttendanceList().length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>{t("noAttendanceRecords")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedAttendanceList.map((item, index) => (
                <motion.div
                  key={item.attendance_date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedAttendanceDate(item)}
                  className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    {/* Date */}
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center ${
                        item.in_time ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                      }`}>
                        {item.in_time ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.attendance_date}</p>
                        <p className="text-xs text-gray-400">
                          {item.working_hours > 0 ? `${item.working_hours} hours` : "No record"}
                        </p>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="text-right">
                      {item.in_time ? (
                        <>
                          <p className="text-sm font-medium text-gray-800">
                            {formatTimeString(item.in_time)} - {formatTimeString(item.out_time)}
                          </p>
                          <p className="text-xs text-green-600">Present</p>
                        </>
                      ) : (
                        <p className="text-sm text-red-600">Absent</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Load More Button */}
              {hasMoreAttendance && (
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={() => setAttendancePage(prev => prev + 1)}
                    className="w-full py-2 px-4 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors text-sm"
                  >
                    Load More ({filteredAttendanceList.length - paginatedAttendanceList.length} more)
                  </button>
                </div>
              )}
              
              {/* View Less Button */}
              {attendancePage > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={() => setAttendancePage(1)}
                    className="w-full py-2 px-4 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
                  >
                    View Less
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeView === "checkins_list" && (
        <div className={`rounded-3xl shadow-lg overflow-hidden ${theme === 'neon-green' ? 'neon-card' : 'bg-white'}`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">{t("checkInsCheckOuts")}</h2>
          </div>

          {checkinList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>{t("noCheckinRecords")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paginatedCheckins.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleCheckinClick(item.name)}
                  className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center ${
                        item.log_type === "IN" 
                          ? "bg-green-100 text-green-600" 
                          : "bg-blue-100 text-blue-600"
                      }`}>
                        {item.log_type === "IN" ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.log_type === "IN" ? "Check In" : "Check Out"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFullDate(item.time)} • {formatTime(item.time)}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[item.log_type].bg} ${statusColors[item.log_type].text}`}>
                      {statusColors[item.log_type].label}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Load More Button */}
              {hasMoreCheckins && (
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={() => setCheckinPage(prev => prev + 1)}
                    className="w-full py-2 px-4 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors text-sm"
                  >
                    Load More ({checkinList.length - paginatedCheckins.length} more)
                  </button>
                </div>
              )}
              
              {/* View Less Button */}
              {checkinPage > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={() => setCheckinPage(1)}
                    className="w-full py-2 px-4 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
                  >
                    View Less
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCheckin && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-black/30 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Checkin Details</h3>
                  <button
                    onClick={close}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Record ID</p>
                      <p className="font-medium text-gray-800">{selectedCheckin.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Log Type</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedCheckin.log_type].bg} ${statusColors[selectedCheckin.log_type].text}`}>
                        {statusColors[selectedCheckin.log_type].label}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Date & Time</p>
                      <p className="font-medium text-gray-800">{formatFullDate(selectedCheckin.time)}</p>
                      <p className="text-sm text-indigo-600">{formatTime(selectedCheckin.time)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Shift</p>
                      <p className="font-medium text-gray-800">{selectedCheckin.shift || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="font-medium text-gray-800">{selectedCheckin.custom_checkin_location || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Office Hours</p>
                      <p className="font-medium text-gray-800">{selectedCheckin.office_hours || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Employee</p>
                      <p className="font-medium text-gray-800">{selectedCheckin.employee_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Employee ID</p>
                      <p className="font-medium text-gray-800">{selectedCheckin.employee}</p>
                    </div>
                  </div>

                  {/* Location Details */}
                  {(selectedCheckin.latitude || selectedCheckin.longitude) && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">Location Coordinates</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">
                          Lat: {selectedCheckin.latitude}, Long: {selectedCheckin.longitude}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Record Info</p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Created: {formatTimestamp(selectedCheckin.creation)}</p>
                      <p className="text-xs text-gray-500">Modified: {formatTimestamp(selectedCheckin.modified)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Attendance Date Detail Modal */}
      <AnimatePresence>
        {selectedAttendanceDate && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAttendanceDate(null)}
              className="fixed inset-0 bg-black/30 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Attendance Details</h3>
                  <button
                    onClick={() => setSelectedAttendanceDate(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="font-medium text-gray-800">{selectedAttendanceDate.attendance_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedAttendanceDate.in_time 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {selectedAttendanceDate.in_time ? "Present" : "Absent"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Check In</p>
                      <p className="font-medium text-gray-800">
                        {formatTimeString(selectedAttendanceDate.in_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Check Out</p>
                      <p className="font-medium text-gray-800">
                        {formatTimeString(selectedAttendanceDate.out_time)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Working Hours</p>
                      <p className="font-medium text-gray-800">
                        {selectedAttendanceDate.working_hours > 0 
                          ? `${selectedAttendanceDate.working_hours} hours` 
                          : "No record"}
                      </p>
                    </div>
                  </div>

                  {/* Checkin Details */}
                  {selectedAttendanceDate.employee_checkin_detail.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">Checkin Records</p>
                      <div className="space-y-2">
                        {selectedAttendanceDate.employee_checkin_detail.map((checkin, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {checkin.log_type === "IN" ? "Check In" : "Check Out"}
                              </p>
                              <p className="text-xs text-gray-500">{formatFullDate(checkin.time)}</p>
                            </div>
                            <p className="text-sm text-indigo-600">{formatTime(checkin.time)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Loading Overlay for Detail */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-full p-4 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setFilterOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white rounded-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
                <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">{t("filter")}</h2>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Date Range Section */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t("dateRange")}</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t("selectOption")}</option>
                    <option value="today">{t("today")}</option>
                    <option value="yesterday">{t("yesterday")}</option>
                    <option value="this_week">{t("thisWeek")}</option>
                    <option value="this_month">{t("thisMonth")}</option>
                    <option value="previous_month">{t("previousMonth")}</option>
                    <option value="custom">{t("custom")}</option>
                  </select>

                  {/* Custom Date Range */}
                  {filters.dateRange === "custom" && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">{t("fromDate")}</label>
                        <input
                          type="date"
                          value={filters.fromDate}
                          onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                          className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">{t("toDate")}</label>
                        <input
                          type="date"
                          value={filters.toDate}
                          onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                          className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setFilters({
                          dateRange: "",
                          fromDate: "",
                          toDate: "",
                        });
                        setAppliedFilters(null);
                      }}
                      className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      {t("reset")}
                    </button>
                    <button
                      onClick={() => {
                        setAppliedFilters(filters);
                        setFilterOpen(false);
                      }}
                      className="flex-1 py-3 px-6 text-black rounded-xl font-semibold transition-colors"
                      style={{ backgroundColor: themeColors.primary }}
                    >
                      {t("apply")}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendancePage;
