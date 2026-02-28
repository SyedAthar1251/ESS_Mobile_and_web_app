import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../auth/useAuth";
import { getEmployeeCheckinList, getCheckinDetail, CheckinListItem, EmployeeCheckin } from "../../services/attendance.service";

const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

const toArabic = (value: string | number) => {
  const str = String(value);
  return str.replace(/\d/g, (d) => arabicDigits[Number(d)]);
};

// Dropdown options for attendance page
type AttendanceView = "attendance_list" | "checkins_list";

const AttendancePage = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<AttendanceView>("attendance_list");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [checkinList, setCheckinList] = useState<CheckinListItem[]>([]);
  const [selectedCheckin, setSelectedCheckin] = useState<EmployeeCheckin | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setCheckinList(data);
      } catch (err: any) {
        console.error("[AttendancePage] Error fetching checkin list:", err);
        setError(err.message || "Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };

    fetchCheckinList();
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

  const close = () => {
    setSelectedCheckin(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === "ar") {
      return toArabic(date.getDate()) + " " + date.toLocaleDateString("ar-SA", { month: "short" });
    }
    return date.getDate() + " " + date.toLocaleDateString("en-US", { month: "short" });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "--:--";
    const date = new Date(dateStr);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const time = `${hours}:${minutes}`;
    return language === "ar" ? toArabic(time) : time;
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (language === "ar") {
      return date.toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" });
    }
    return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
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
        items: items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
        fullDate: formatFullDate(date),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  })();

  // Calculate attendance stats
  const totalCheckins = checkinList.length;
  const checkIns = checkinList.filter(c => c.log_type === "IN").length;
  const checkOuts = checkinList.filter(c => c.log_type === "OUT").length;
  const uniqueDays = Object.keys(groupedCheckins).length;

  // Stats cards data
  const statsCards = [
    { label: t("totalDays"), value: uniqueDays, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, color: "bg-indigo-50", textColor: "text-indigo-600" },
    { label: t("checkIns"), value: checkIns, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>, color: "bg-green-50", textColor: "text-green-600" },
    { label: t("checkOuts"), value: checkOuts, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>, color: "bg-blue-50", textColor: "text-blue-600" },
    { label: t("records"), value: totalCheckins, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, color: "bg-purple-50", textColor: "text-purple-600" },
  ];

  // Get current selected option
  const currentOption = attendanceOptions.find(opt => opt.key === activeView);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 space-y-6">
      {/* Header with Dashboard Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("attendance")}</h1>
          <span className="text-sm text-gray-500">{totalCheckins} {t("records")}</span>
        </div>

        {/* Dashboard Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.color} rounded-2xl p-4 text-center`}
            >
              <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dropdown Selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between"
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
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">{t("attendanceHistory")}</h2>
          </div>

          {groupedCheckins.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>{t("noAttendanceRecords")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {groupedCheckins.map((group, groupIndex) => (
                <motion.div
                  key={group.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                >
                  {/* Date Header */}
                  <div className="bg-gray-50 px-4 py-2">
                    <p className="font-medium text-gray-600">{group.day}</p>
                    <p className="text-xs text-gray-400">{group.fullDate}</p>
                  </div>

                  {/* Checkin Items */}
                  {group.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIndex * 0.1 + itemIndex * 0.05 }}
                      onClick={() => handleCheckinClick(item.name)}
                      className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        {/* Time */}
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-indigo-600">{formatDate(item.time)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{formatTime(item.time)}</p>
                            <p className="text-xs text-gray-400">{item.name}</p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[item.log_type].bg} ${statusColors[item.log_type].text}`}>
                          {statusColors[item.log_type].label}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === "checkins_list" && (
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">{t("checkInsCheckOuts")}</h2>
          </div>

          {checkinList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>{t("noCheckinRecords")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {checkinList.map((item, index) => (
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
                      <p className="text-xs text-gray-500">Created: {new Date(selectedCheckin.creation).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Modified: {new Date(selectedCheckin.modified).toLocaleString()}</p>
                    </div>
                  </div>
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
    </div>
  );
};

export default AttendancePage;
