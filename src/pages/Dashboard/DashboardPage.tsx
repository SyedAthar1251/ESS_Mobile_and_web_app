import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useLiveClock from "../../utils/useLiveClock";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../auth/useAuth";

const DashboardPage = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const time = useLiveClock(language);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState<Date | null>(null);
  const [punchInTimeStr, setPunchInTimeStr] = useState<string | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workDuration, setWorkDuration] = useState<string>("");
  const [finalDuration, setFinalDuration] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<string>("");

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

  const handlePunch = () => {
    if (!isPunchedIn) {
      const now = new Date();
      setPunchInTime(now);
      setPunchInTimeStr(formatTime(now));
      setIsPunchedIn(true);
      setFinalDuration("");
    } else {
      const now = new Date();
      const diff = now.getTime() - (punchInTime?.getTime() || now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setFinalDuration(`${hours}h ${minutes}m`);
      setPunchOutTime(formatTime(now));
      setIsPunchedIn(false);
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
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
          setShowCamera(false);
          
          if (!isPunchedIn) {
            const now = new Date();
            setPunchInTime(now);
            setPunchInTimeStr(formatTime(now));
            setIsPunchedIn(true);
            setFinalDuration("");
          } else {
            const now = new Date();
            const diff = now.getTime() - (punchInTime?.getTime() || now.getTime());
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setFinalDuration(`${hours}h ${minutes}m`);
            setPunchOutTime(formatTime(now));
            setIsPunchedIn(false);
          }
          setIsLoading(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setShowCamera(false);
      setIsLoading(false);
      handlePunch();
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
    { label: t("holidays"), path: "/holidays", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
    )},
    { label: t("payslips"), path: "/payslips", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { label: t("tasks"), path: "/tasks", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    )},
    { label: t("expenses"), path: "/expenses", icon: (
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
          <p className="text-white mt-4 text-lg">
            {isLoading ? "Scanning face..." : "Opening camera..."}
          </p>
          <button onClick={() => setShowCamera(false)} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg">
            Cancel
          </button>
        </div>
      )}

      {/* Background */}
      <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }} />

      {/* Punch Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-5 mx-4"
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
        <div className="flex items-center gap-3">
          <button
            onClick={handlePunch}
            className={`flex-1 py-3 text-white text-base font-bold rounded-2xl transition-all transform hover:scale-105 ${
              isPunchedIn
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : "bg-gradient-to-r from-green-500 to-green-600"
            }`}
          >
            {isPunchedIn ? t("punchOut") : t("punchIn")}
          </button>
          
          <button
            onClick={handleFaceBiometric}
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-800 text-white shadow-lg hover:bg-gray-900 transition-all hover:scale-105"
            title={t("faceScan")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
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
              className="bg-white rounded-xl p-3 cursor-pointer shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center text-center"
            >
              <div className="text-indigo-600 mb-1">{item.icon}</div>
              <span className="text-gray-700 text-xs">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Performance Snapshot */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("performanceSnapshot")}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 mx-auto mb-2 text-green-600 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
              <p className="text-xl font-bold text-green-600">12</p>
              <p className="text-xs text-gray-500 mt-1">{t("tasksDone")}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 mx-auto mb-2 text-blue-600 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
              <p className="text-xl font-bold text-blue-600">94%</p>
              <p className="text-xs text-gray-500 mt-1">{t("attendanceRate")}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 mx-auto mb-2 text-orange-600 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
              <p className="text-xl font-bold text-orange-600">2h</p>
              <p className="text-xs text-gray-500 mt-1">{t("overtime")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("upcomingEvents")}</h3>
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
