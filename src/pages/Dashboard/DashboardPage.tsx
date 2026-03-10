import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useLiveClock from "../../utils/useLiveClock";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../auth/useAuth";
import { useTheme } from "../../store/ThemeContext";
import { createEmployeeLog, getAttendanceDetailsDashboard, getEmployeeCheckinList, CheckinListItem } from "../../services/attendance.service";
import { getDashboard, DashboardData } from "../../services/dashboard.service";
import PunchSlider from "../../components/PunchSlider";

const DashboardPage = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { theme, themeColors } = useTheme();
  const time = useLiveClock(language);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Card style - same for all themes
  const getCardStyle = () => {
    return {};
  };

  const [isPunchedIn, setIsPunchedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem("ess_punch_state");
    return saved === "true";
  });
  const [punchInTime, setPunchInTime] = useState<Date | null>(() => {
    const savedTime = localStorage.getItem("ess_punch_time");
    return savedTime ? new Date(savedTime) : null;
  });
  const [punchInTimeStr, setPunchInTimeStr] = useState<string | null>(() => {
    const savedTime = localStorage.getItem("ess_punch_time");
    if (!savedTime) return null;
    const date = new Date(savedTime);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  });
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workDuration, setWorkDuration] = useState<string>("");
  const [finalDuration, setFinalDuration] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        console.log("[DashboardPage] Fetching dashboard data...");
        const data = await getDashboard();
        console.log("[DashboardPage] Dashboard data:", data);
        setDashboardData(data);

        // Fetch checkins list to determine punch state
        if (user?.employeeId) {
          try {
            const checkins = await getEmployeeCheckinList(user.employeeId);
            if (checkins && checkins.length > 0) {
              // Sort by time descending to get the latest
              const sortedCheckins = [...checkins].sort(
                (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
              );
              const latestCheckin = sortedCheckins[0];
              
              if (latestCheckin.log_type === "IN") {
                // User punched in but not out yet - show punch out
                setIsPunchedIn(true);
                const punchInDate = new Date(latestCheckin.time);
                setPunchInTime(punchInDate);
                setPunchInTimeStr(formatTime(punchInDate));
                localStorage.setItem("ess_punch_state", "true");
                localStorage.setItem("ess_punch_time", latestCheckin.time);
              } else {
                // User punched out - show punch in
                setIsPunchedIn(false);
                setPunchInTime(null);
                setPunchInTimeStr(null);
                setPunchOutTime(formatTime(new Date(latestCheckin.time)));
                localStorage.setItem("ess_punch_state", "false");
                localStorage.removeItem("ess_punch_time");
              }
            } else {
              // No checkins yet - show punch in
              setIsPunchedIn(false);
              localStorage.setItem("ess_punch_state", "false");
            }
          } catch (checkinError) {
            console.error("[DashboardPage] Failed to fetch checkins:", checkinError);
            // Fall back to dashboard API data
            if (data.last_log_type === "IN") {
              setIsPunchedIn(true);
              if (data.last_log_time) {
                const punchInDate = new Date(data.last_log_time);
                setPunchInTime(punchInDate);
                setPunchInTimeStr(formatTime(punchInDate));
              }
            } else {
              setIsPunchedIn(false);
            }
          }
        }
      } catch (error: any) {
        console.error("[DashboardPage] Failed to fetch dashboard:", error);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  // Live timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPunchedIn && punchInTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - punchInTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setWorkDuration(`${hours}h ${minutes}m`);
      }, 1000);
    } else {
      setWorkDuration("");
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPunchedIn, punchInTime]);

  // Save punch state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("ess_punch_state", isPunchedIn ? "true" : "false");
    if (isPunchedIn && punchInTime) {
      localStorage.setItem("ess_punch_time", punchInTime.toISOString());
    } else {
      localStorage.removeItem("ess_punch_time");
    }
  }, [isPunchedIn, punchInTime]);

  // Get location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        () => {
          setCurrentLocation("Location unavailable");
        }
      );
    }
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePunch = async () => {
    setIsLoading(true);
    try {
      // Determine the log type based on current state
      const logType = isPunchedIn ? "OUT" : "IN";
      
      console.log("[DashboardPage] Punch action:", logType, "Location:", currentLocation);
      
      // Call the actual API
      const response = await createEmployeeLog(logType, currentLocation);
      
      console.log("[DashboardPage] Punch success:", response);
      
      if (!isPunchedIn) {
        // Punch In successful
        const now = new Date();
        setPunchInTime(now);
        setPunchInTimeStr(formatTime(now));
        setIsPunchedIn(true);
        setFinalDuration("");
        
        // Show success message
        alert("Punch In recorded successfully!");
      } else {
        // Punch Out successful
        const now = new Date();
        const diff = now.getTime() - (punchInTime?.getTime() || now.getTime());
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setFinalDuration(`${hours}h ${minutes}m`);
        setPunchOutTime(formatTime(now));
        setIsPunchedIn(false);
        
        // Show success message
        alert("Punch Out recorded successfully!");
      }
    } catch (error: any) {
      console.error("[DashboardPage] Punch error:", error);
      alert(error.message || "Failed to record attendance. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle face biometric click
  const handleFaceBiometric = async () => {
    setShowCamera(true);
    setIsLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Get the current punch state before stopping the stream
        const currentLogType = isPunchedIn ? "OUT" : "IN";
        
        // Stop the camera stream
        stream.getTracks().forEach(track => track.stop());
        setShowCamera(false);
        
        console.log("[DashboardPage] Face biometric punch:", currentLogType, "Location:", currentLocation);
        
        // Call the actual API
        const response = await createEmployeeLog(currentLogType, currentLocation);
        console.log("[DashboardPage] Face biometric punch success:", response);
        
        if (!isPunchedIn) {
          // Punch In successful
          const now = new Date();
          setPunchInTime(now);
          setPunchInTimeStr(formatTime(now));
          setIsPunchedIn(true);
          setFinalDuration("");
          alert("Punch In recorded successfully!");
        } else {
          // Punch Out successful
          const now = new Date();
          const diff = now.getTime() - (punchInTime?.getTime() || now.getTime());
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setFinalDuration(`${hours}h ${minutes}m`);
          setPunchOutTime(formatTime(now));
          setIsPunchedIn(false);
          alert("Punch Out recorded successfully!");
        }
      }
    } catch (err: any) {
      console.error("[DashboardPage] Face biometric error:", err);
      setShowCamera(false);
      // Fall back to slider punch if biometric fails
      alert(err.message || "Face recognition failed. Please use the slider to punch.");
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning");
    if (hour < 17) return t("goodAfternoon");
    return t("goodEvening");
  };

  // Quick access items - 8 modules - matching sidebar icons
  const quickAccessItems = [
    { label: t("attendance"), path: "/attendance", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { label: t("leave"), path: "/leave", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    )},
    { label: t("holidays"), path: "/holiday", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
    )},
    { label: t("payslips"), path: "/salary", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { label: t("tasks"), path: "/tasks", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    )},
    { label: t("expenses"), path: "/expense", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
    )},
    { label: t("reports"), path: "/reports", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    )},
    { label: t("documents"), path: "/documents", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    )},
  ];

  // Location status
  const locationStatus = currentLocation ? "Location tracked" : "Getting location...";

  // Recent activity
  const recentActivity = [
    { type: "checkin", time: t("today"), date: t("checkInSuccess"), color: "text-green-600", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    )},
    { type: "leave_approved", time: t("yesterday"), date: t("leaveApproved"), color: "text-blue-600", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    )},
    { type: "expense", time: "Jan 20", date: t("expenseClaimed"), color: "text-purple-600", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    )},
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Camera Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-64 h-64 rounded-full object-cover border-4 border-white" />
          <p className="text-black mt-4 text-lg">
            {isLoading ? "Scanning face..." : "Opening camera..."}
          </p>
          <button onClick={() => setShowCamera(false)} className="mt-4 px-6 py-2 bg-red-500 text-black rounded-lg">
            Cancel
          </button>
        </div>
      )}

      {/* Background - theme will show through */}

      {/* Punch Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`rounded-3xl shadow-2xl mx-4 p-5 bg-white`}
        style={getCardStyle()}
      >
        {/* Greeting - Smaller */}
        <div className="text-left mb-3">
          <p className="text-indigo-600 text-lg font-bold">{getGreeting()}!</p>
          <h2 className="text-4xl font-bold text-gray-800 mt-1">{time || "--:--"}</h2>
          <p className="text-gray-500 text-xs mt-1">{new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Punch In/Out Times - Only show when recorded */}
        {(punchInTimeStr || punchOutTime) && (
          <div className="flex gap-4 mb-3 text-xs">
            {punchInTimeStr && (
              <div className="flex items-center gap-1">
                <span className="text-green-600">✓</span>
                <span className="text-gray-500">In:</span>
                <span className="font-medium text-gray-700">{punchInTimeStr}</span>
              </div>
            )}
            {punchOutTime && (
              <div className="flex items-center gap-1">
                <span className="text-red-600">✓</span>
                <span className="text-gray-500">Out:</span>
                <span className="font-medium text-gray-700">{punchOutTime}</span>
              </div>
            )}
          </div>
        )}

        {/* Working Hours - Show when punched in or after punch out */}
        {(isPunchedIn || finalDuration) && (workDuration || finalDuration) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 text-xs"
          >
            <span className="text-gray-500">Duration: </span>
            <span className="font-bold text-indigo-600">{isPunchedIn ? workDuration : finalDuration}</span>
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {/* Slider Button for Punch In/Out */}
          <div className="flex-1 min-w-0">
            <PunchSlider
              isPunchedIn={isPunchedIn}
              isLoading={isLoading}
              onPunch={handlePunch}
            />
          </div>
          
          <button
            onClick={handleFaceBiometric}
            className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-transparent border-2 border-gray-300 shadow-lg hover:border-gray-400 transition-all hover:scale-105"
            title={t("faceScan")}
          >
            <img 
              src="/icon/face-recognition_8337701.png" 
              alt="Face Scan" 
              className="w-7 h-7"
            />
          </button>
        </div>

        {/* Live Location */}
        <div className="mt-3 p-2 bg-gray-50 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="text-gray-500">{locationStatus}</span>
          </div>
          {currentLocation && (
            <button 
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setCurrentLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                    },
                    () => {}
                  );
                }
              }}
              className="text-indigo-600 font-medium"
            >
              Refresh
            </button>
          )}
        </div>
      </motion.div>

      {/* Quick Access - 8 modules */}
      <div className="px-4">
        <div className="grid grid-cols-4 gap-2">
          {quickAccessItems.map((item, index) => (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl p-3 cursor-pointer shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center text-center bg-white`}
            >
              <div className="mb-1 text-indigo-600">{item.icon}</div>
              <span className="text-xs text-gray-700">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>


      {/* Upcoming Events */}
      <div className="px-4">
        <div className={`rounded-2xl shadow-lg p-4 bg-white`}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">{t("upcomingEvents")}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg></div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{t("ahmedBirthday")}</p>
                <p className="text-xs text-gray-500">Feb 28</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{t("workAnniversaryText")}</p>
                <p className="text-xs text-gray-500">Mar 1</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{t("nationalDayText")}</p>
                <p className="text-xs text-gray-500">Sep 23</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("recentActivity")}</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <div className={activity.color}>{activity.icon}</div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{activity.date}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
