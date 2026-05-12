import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import useLiveClock from "../../utils/useLiveClock";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../auth/useAuth";
import { useTheme } from "../../store/ThemeContext";
import { createEmployeeLog, getAttendanceDetailsDashboard, getEmployeeCheckinList, CheckinListItem } from "../../services/attendance.service";
import { getDashboard, DashboardData } from "../../services/dashboard.service";
import PunchSlider from "../../components/PunchSlider";
import ComingSoon from "../../components/ComingSoon";

// Helper to get today's date string in local time (YYYY-MM-DD) - MUST be defined before component
const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [lastPunchOut, setLastPunchOut] = useState<{ time: string; date: string } | null>(null);
  
  // Break tracking states
  const [isOnBreak, setIsOnBreak] = useState<boolean>(() => {
    const savedDate = localStorage.getItem("ess_punch_date");
    const today = getTodayString();
    if (savedDate !== today) return false;
    const saved = localStorage.getItem("ess_break_state");
    return saved === "true";
  });
  const [breakOutTime, setBreakOutTime] = useState<Date | null>(() => {
    const savedDate = localStorage.getItem("ess_punch_date");
    const today = getTodayString();
    if (savedDate !== today) return null;
    const savedTime = localStorage.getItem("ess_break_time");
    return savedTime ? new Date(savedTime) : null;
  });
  const [breakOutTimeStr, setBreakOutTimeStr] = useState<string | null>(() => {
    const savedDate = localStorage.getItem("ess_punch_date");
    const today = getTodayString();
    if (savedDate !== today) return null;
    const savedTime = localStorage.getItem("ess_break_time");
    if (!savedTime) return null;
    const date = new Date(savedTime);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  });
  // Track break in time
  const [breakInTime, setBreakInTime] = useState<Date | null>(() => {
    const savedDate = localStorage.getItem("ess_punch_date");
    const today = getTodayString();
    if (savedDate !== today) return null;
    const savedTime = localStorage.getItem("ess_break_in_time");
    return savedTime ? new Date(savedTime) : null;
  });
  const [breakInTimeStr, setBreakInTimeStr] = useState<string | null>(() => {
    const savedDate = localStorage.getItem("ess_punch_date");
    const today = getTodayString();
    if (savedDate !== today) return null;
    const savedTime = localStorage.getItem("ess_break_in_time");
    if (!savedTime) return null;
    const date = new Date(savedTime);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  });
  const [hasTakenBreakToday, setHasTakenBreakToday] = useState<boolean>(() => {
    const savedDate = localStorage.getItem("ess_punch_date");
    const today = getTodayString();
    return savedDate === today ? localStorage.getItem("ess_break_taken_today") === "true" : false;
  });
  
  const [showCamera, setShowCamera] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  
  // Simple notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    visible: boolean;
  }>({ message: '', type: 'success', visible: false });
  
  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification.visible) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.visible]);
  
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setNotification({ message, type, visible: true });
  };
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    message: string;
    onConfirm: () => void;
  }>({ show: false, message: '', onConfirm: () => {} });
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [locationDenied, setLocationDenied] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Check if a date is today
  const isToday = (dateString: string) => {
    if (!dateString) return false;
    const datePart = dateString.includes('T') 
      ? dateString.split('T')[0] 
      : dateString.split(' ')[0];
    return datePart === getTodayString();
  };

  // Daily punch restriction state - initialize from localStorage
  const [hasPunchedInToday, setHasPunchedInToday] = useState<boolean>(() => {
    const savedDate = localStorage.getItem("ess_punch_date");
    const today = getTodayString();
    // Only restore if saved date is today
    return savedDate === today ? localStorage.getItem("ess_punched_in_today") === "true" : false;
  });
  const [hasPunchedOutToday, setHasPunchedOutToday] = useState<boolean>(() => {
    const savedDate = localStorage.getItem("ess_punch_date");
    const today = getTodayString();
    return savedDate === today ? localStorage.getItem("ess_punched_out_today") === "true" : false;
  });
  const [completedToday, setCompletedToday] = useState<boolean>(() => {
    const savedDate = localStorage.getItem("ess_punch_date");
    const today = getTodayString();
    return savedDate === today ? localStorage.getItem("ess_completed_today") === "true" : false;
  });

  // Fetch today's attendance from API on mount to get accurate state
  const fetchTodayAttendance = useCallback(async () => {
    if (!user?.employeeId) return;
    
    try {
      console.log("[DashboardPage] Fetching today's attendance from API...");
      const checkins = await getEmployeeCheckinList(user.employeeId);
      
      // Get today's date string
      const todayStr = getTodayString();
      
      console.log("[DashboardPage] Today's date:", todayStr);
      console.log("[DashboardPage] Raw checkins:", checkins);
      
      // Filter checkins for today only
      const todayCheckins = checkins?.filter(checkin => {
        if (!checkin.time) return false;
        const datePart = checkin.time.includes('T') 
          ? checkin.time.split('T')[0] 
          : checkin.time.split(' ')[0];
        return datePart === todayStr;
      }) || [];
      
console.log("[DashboardPage] Today's checkins:", todayCheckins);
       
      // Sort checkins by time to get the last record
      const sortedCheckins = [...todayCheckins].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      const lastRecord = sortedCheckins[0];
      const lastLogType = lastRecord?.log_type?.toUpperCase();
       
      console.log("[DashboardPage] Last record:", lastRecord, "Type:", lastLogType);
       
      // Button Logic based on last record:
      // If last is "IN" → show Punch Out (need to checkout)
      // If last is "OUT" → show Punch In (can start new day)
      const isPunchedIn = lastLogType === "IN";
      
console.log("[DashboardPage] isPunchedIn:", isPunchedIn);
       
      // Also get punchInToday and punchOutToday for backward compatibility
      const punchInToday = todayCheckins.find(c => c.log_type?.toUpperCase() === "IN");
      const punchOutToday = todayCheckins.find(c => c.log_type?.toUpperCase() === "OUT");
       
      // Check if break was taken today (has break out but not final punch out)
      // Logic: If we have more INS than OUTS, or if last action was IN after OUT, we're still in cycle
      const inCount = todayCheckins.filter(c => c.log_type?.toUpperCase() === "IN").length;
      const outCount = todayCheckins.filter(c => c.log_type?.toUpperCase() === "OUT").length;
      // If more INS than OUTS, or last checkin was IN, we're in incomplete cycle (break taken but not punched out)
      const isIncompleteCycle = inCount > outCount || (inCount === outCount && inCount > 0 && punchInToday);
      
      // Set button state - use API only
      setIsPunchedIn(isPunchedIn);
      setHasPunchedInToday(!!punchInToday);
      setHasPunchedOutToday(!!punchOutToday);
      // Only mark as completed if full cycle (OUT after IN, and break cycle is complete)
      setCompletedToday(!!punchOutToday && !isIncompleteCycle);
      
      // Set punch in time if punched in
      if (punchInToday && punchInToday.time && !punchOutToday) {
        const punchTime = new Date(punchInToday.time);
        setPunchInTime(punchTime);
        setPunchInTimeStr(formatTime(punchTime));
        localStorage.setItem("ess_punch_state", "true");
        localStorage.setItem("ess_punch_time", punchInToday.time);
      } else {
        setPunchInTime(null);
        setPunchInTimeStr(null);
        localStorage.setItem("ess_punch_state", "false");
        localStorage.removeItem("ess_punch_time");
      }
      
      // Set punch out time if punched out
      if (punchOutToday && punchOutToday.time) {
        setPunchOutTime(formatTime(new Date(punchOutToday.time)));
        setLastPunchOut(formatDateTime(new Date(punchOutToday.time)));
      } else {
        setPunchOutTime(null);
      }
      
      // Set break states based on cycle
      // Analyze checkins to find break out and break in
      // Sort by time to process sequentially
      const sortedTodayCheckins = [...todayCheckins].sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      
      let foundBreakOut = false;
      let foundBreakIn = false;
      let breakOutTimeValue: Date | null = null;
      let breakInTimeValue: Date | null = null;
      let isOnBreakValue = false;
      
      // Go through each checkin to find break patterns
      // Break pattern: OUT (not final) -> IN = Break Out -> Break In
      for (let i = 0; i < sortedTodayCheckins.length; i++) {
        const current = sortedTodayCheckins[i];
        const currentType = current.log_type?.toUpperCase();
        const next = sortedTodayCheckins[i + 1];
        const nextType = next?.log_type?.toUpperCase();
        
        // If OUT is followed by IN (not the last record), it's a break
        if (currentType === "OUT" && nextType === "IN") {
          breakOutTimeValue = new Date(current.time);
          breakInTimeValue = new Date(next.time);
          foundBreakOut = true;
          foundBreakIn = true;
          // If current is OUT and next is IN, we're after break in (can punch out)
          isOnBreakValue = false;
        }
        // If IN is followed by OUT (not the last), we're on break
        if (currentType === "IN" && nextType === "OUT" && i < sortedTodayCheckins.length - 2) {
          isOnBreakValue = true;
        }
        // If last record is OUT, we're done (not on break)
        if (i === sortedTodayCheckins.length - 1 && currentType === "OUT") {
          isOnBreakValue = false;
        }
      }
      
      setIsOnBreak(isOnBreakValue);
      setHasTakenBreakToday(foundBreakOut);
      
      // Set break times
      if (foundBreakOut && breakOutTimeValue) {
        setBreakOutTime(breakOutTimeValue);
        setBreakOutTimeStr(formatTime(breakOutTimeValue));
      }
      if (foundBreakIn && breakInTimeValue) {
        setBreakInTime(breakInTimeValue);
        setBreakInTimeStr(formatTime(breakInTimeValue));
      }
      
      // Find last punch out from any previous day
      const allCheckinsSorted = [...(checkins || [])].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      const lastPunchOutRecord = allCheckinsSorted.find(c => c.log_type?.toUpperCase() === "OUT" && c.time);
      if (lastPunchOutRecord && lastPunchOutRecord.time && !punchOutToday) {
        setLastPunchOut(formatDateTime(new Date(lastPunchOutRecord.time)));
      }
      
      // Save to localStorage
      saveDailyPunchState(!!punchInToday, !!punchOutToday, !!punchOutToday);
      
      console.log("[DashboardPage] Today's attendance - isPunchedIn:", isPunchedIn);
    } catch (error) {
      console.error("[DashboardPage] Failed to fetch today's attendance:", error);
    }
  }, [user]);

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        console.log("[DashboardPage] Fetching dashboard data...");
        const data = await getDashboard();
        console.log("[DashboardPage] Dashboard data:", data);
        setDashboardData(data);
      } catch (error: any) {
        console.error("[DashboardPage] Failed to fetch dashboard:", error);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboard();
    // Also fetch today's attendance to get accurate punch state
    fetchTodayAttendance();
  }, [user]);

  // Refresh dashboard data when page becomes visible (fixes mobile app issue)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.employeeId) {
        // Page became visible - ALWAYS fetch fresh data from API
        // This ensures we get the latest state even if records were deleted from backend
        console.log("[DashboardPage] Page became visible, fetching fresh data from API...");
        fetchTodayAttendance();
      }
    };

    // Also fetch immediately on mount to get fresh state
    if (user?.employeeId) {
      console.log("[DashboardPage] Fetching attendance on mount...");
      fetchTodayAttendance();
    }

    // Handle both visibility change and focus events (better for mobile)
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [user, fetchTodayAttendance]);

  // Save punch state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("ess_punch_state", isPunchedIn ? "true" : "false");
    if (isPunchedIn && punchInTime) {
      localStorage.setItem("ess_punch_time", punchInTime.toISOString());
    } else {
      localStorage.removeItem("ess_punch_time");
    }
  }, [isPunchedIn, punchInTime]);

  // Save break state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("ess_break_state", isOnBreak ? "true" : "false");
    if (isOnBreak && breakOutTime) {
      localStorage.setItem("ess_break_time", breakOutTime.toISOString());
    } else {
      localStorage.removeItem("ess_break_time");
    }
  }, [isOnBreak, breakOutTime]);

  // Save break in time to localStorage when it changes
  useEffect(() => {
    if (breakInTime) {
      localStorage.setItem("ess_break_in_time", breakInTime.toISOString());
    } else {
      localStorage.removeItem("ess_break_in_time");
    }
  }, [breakInTime]);

  // Get location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          setLocationDenied(false);
        },
        (error) => {
          console.error("[DashboardPage] Location error:", error);
          setCurrentLocation("Location unavailable");
          setLocationDenied(true);
        }
      );
    } else {
      setCurrentLocation("Location unavailable");
      setLocationDenied(true);
    }
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (date: Date) => {
    const time = date.toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return { time, date: dateStr };
  };

  // Save daily punch state to localStorage
  const saveDailyPunchState = (punchedIn: boolean, punchedOut: boolean, completed: boolean) => {
    const today = getTodayString();
    localStorage.setItem("ess_punch_date", today);
    localStorage.setItem("ess_punched_in_today", punchedIn ? "true" : "false");
    localStorage.setItem("ess_punched_out_today", punchedOut ? "true" : "false");
    localStorage.setItem("ess_completed_today", completed ? "true" : "false");
  };

  // Separate function to handle punch out after confirmation
  const performPunchOut = async () => {
    setIsLoading(true);
    try {
      // Get location for mobile
      let locationString = currentLocation;
      let mobileLocationError = false;

      if (Capacitor.isNativePlatform()) {
        try {
          console.log("[DashboardPage] Getting location for punch out...");
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
          });
          
          const { latitude, longitude } = position.coords;
          locationString = `${latitude},${longitude}`;
          console.log("[DashboardPage] Got location for punch out:", locationString);
          setCurrentLocation(locationString);
          setLocationDenied(false);
        } catch (locationError: any) {
          console.error("[DashboardPage] Location error for punch out:", locationError);
          mobileLocationError = true;
        }
      }

      // Validate location
      if (!locationString || locationString === "Location unavailable" || locationDenied || mobileLocationError) {
        setIsLoading(false);
        showNotification("Location access is required for attendance. Please enable location permission and try again.", "error");
        return;
      }

      console.log("[DashboardPage] Punch OUT action, Location:", locationString);

      // Call the API for punch out
      const response = await createEmployeeLog("OUT", locationString);
      
      console.log("[DashboardPage] Punch Out success:", response);

      // Punch Out successful
      const now = new Date();
      setPunchOutTime(formatTime(now));
      setLastPunchOut(formatDateTime(now));
      setIsPunchedIn(false);
      setHasPunchedOutToday(true);
      setCompletedToday(true);
      
      // Save to localStorage
      saveDailyPunchState(true, true, true);
      
      // Show success message
      showNotification("Punch Out recorded successfully!", "success");
    } catch (error: any) {
      console.error("[DashboardPage] Punch Out error:", error);
      showNotification(error.message || "Failed to record punch out. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePunch = async () => {
    // Check if user has already completed their attendance for today
    if (completedToday) {
      showNotification("You have already completed your attendance for today.", "error");
      return;
    }
    
    // Check if user has already punched in today (prevent duplicate punch in)
    if (!isPunchedIn && hasPunchedInToday) {
      showNotification("You have already punched in today.", "error");
      return;
    }
    
    // Determine action type based on current state
    // 4-step flow: Punch In -> Break Out -> Break In -> Punch Out
    let action: 'punch_in' | 'break_out' | 'break_in' | 'punch_out';
    
    if (!isPunchedIn) {
      // Not punched in yet -> Punch In
      action = 'punch_in';
    } else if (!isOnBreak) {
      // Punched in, not on break -> Break Out (if hasn't taken break) or Punch Out
      if (!hasTakenBreakToday) {
        action = 'break_out';
      } else {
        action = 'punch_out';
      }
    } else {
      // Punched in and on break -> Break In
      action = 'break_in';
    }
    
    // For punch out, show confirmation modal
    if (action === 'punch_out') {
      setConfirmModal({
        show: true,
        message: "Do you want to checkout?\n\nNote: Once you checkout, you will not be able to checkin again today. If you need to checkin again, please contact your HR administrator.",
        onConfirm: () => {
          setConfirmModal({ show: false, message: '', onConfirm: () => {} });
          performPunchOut();
        }
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Determine the log type based on action
      // Frappe only has IN and OUT, so we use:
      // - IN for both punch_in and break_in
      // - OUT for both break_out and punch_out
      const logType = (action === 'punch_in' || action === 'break_in') ? "IN" : "OUT";
      
      // Get location for mobile
      let locationString = currentLocation;
      let mobileLocationError = false;
      
      if (Capacitor.isNativePlatform()) {
        try {
          console.log("[DashboardPage] Getting location...");
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
          });
          
          const { latitude, longitude } = position.coords;
          locationString = `${latitude},${longitude}`;
          console.log("[DashboardPage] Got location:", locationString);
          setCurrentLocation(locationString);
          setLocationDenied(false);
        } catch (locationError: any) {
          console.error("[DashboardPage] Location error:", locationError);
          mobileLocationError = true;
        }
      }
      
      // Validate location - check if location is available
      if (!locationString || locationString === "Location unavailable" || locationDenied || mobileLocationError) {
        setIsLoading(false);
        showNotification("Location access is required for attendance. Please enable location permission and try again.", "error");
        return;
      }
      
      console.log("[DashboardPage] Punch action:", action, "LogType:", logType, "Location:", locationString);
      
      // Call the actual API
      const response = await createEmployeeLog(logType, locationString);
      
      console.log("[DashboardPage] Punch success:", response);
      
      const now = new Date();
      
      if (action === 'punch_in') {
        // Punch In successful
        setPunchInTime(now);
        setPunchInTimeStr(formatTime(now));
        setIsPunchedIn(true);
        setHasPunchedInToday(true);
        
        // Save to localStorage
        saveDailyPunchState(true, false, false);
        
        // Show success message
        showNotification("Punch In recorded successfully!", "success");
      } else if (action === 'break_out') {
        // Break Out successful
        setIsOnBreak(true);
        setBreakOutTime(now);
        setBreakOutTimeStr(formatTime(now));
        // Clear break in time when starting new break
        setBreakInTime(null);
        setBreakInTimeStr(null);
        setHasTakenBreakToday(true);
        
        // Save to localStorage - clear break in, set break out
        localStorage.setItem("ess_break_state", "true");
        localStorage.setItem("ess_break_time", now.toISOString());
        localStorage.setItem("ess_break_taken_today", "true");
        localStorage.removeItem("ess_break_in_time");
        
        // Show success message
        showNotification("Break Out recorded successfully!", "success");
      } else if (action === 'break_in') {
        // Break In successful - keep break out time, add break in time
        setIsOnBreak(false);
        // Don't clear break out time - keep it for display
        setBreakInTime(now);
        setBreakInTimeStr(formatTime(now));
        
        // Save to localStorage - keep break out time
        localStorage.setItem("ess_break_state", "false");
        localStorage.setItem("ess_break_in_time", now.toISOString());
        
        // Show success message
        showNotification("Break In recorded successfully!", "success");
      } else if (action === 'punch_out') {
        // Punch Out successful
        setPunchOutTime(formatTime(now));
        setIsPunchedIn(false);
        setIsOnBreak(false);
        setHasPunchedOutToday(true);
        setCompletedToday(true);
        
        // Save to localStorage
        saveDailyPunchState(true, true, true);
        
        // Show success message
        showNotification("Punch Out recorded successfully!", "success");
      }
    } catch (error: any) {
      console.error("[DashboardPage] Punch error:", error);
      showNotification(error.message || "Failed to record attendance. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle face biometric click
  const handleFaceBiometric = () => {
    // Show development in progress message
    setShowDevModal(true);
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
  const locationStatus = currentLocation || (navigator.geolocation ? "Getting location..." : "Location unavailable");

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
      {/* Custom Notification Toast */}
      {notification.visible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200' :
            notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-blue-50 border border-blue-200'
          }`}
        >
          {notification.type === 'success' && (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {notification.type === 'error' && (
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {notification.type === 'warning' && (
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {notification.type === 'info' && (
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className={`text-sm font-medium ${
            notification.type === 'success' ? 'text-green-800' :
            notification.type === 'error' ? 'text-red-800' :
            notification.type === 'warning' ? 'text-yellow-800' :
            'text-blue-800'
          }`}>
            {notification.message}
          </span>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmModal({ show: false, message: '', onConfirm: () => {} })}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-800 mb-2">Confirm Check Out</h3>
            <p className="text-gray-600 text-center text-sm mb-6 whitespace-pre-line">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ show: false, message: '', onConfirm: () => {} })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                Check Out
              </button>
            </div>
          </motion.div>
        </div>
      )}

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

        {/* Punch In/Out Times - Show when punched in or break times exist */}
        {(isPunchedIn || hasTakenBreakToday) && (
          <div className="mb-3 text-xs space-y-1">
            {punchInTimeStr && (
              <div className="flex items-center gap-1">
                <span className="text-green-600">✓</span>
                <span className="text-gray-500">In:</span>
                <span className="font-medium text-gray-700">{punchInTimeStr}</span>
              </div>
            )}
            {hasTakenBreakToday && (
              <div className="flex gap-4">
                {breakOutTimeStr && (
                  <div className="flex items-center gap-1">
                    <span className="text-orange-600">↳</span>
                    <span className="text-gray-500">Break Out:</span>
                    <span className="font-medium text-gray-700">{breakOutTimeStr}</span>
                  </div>
                )}
                {breakInTimeStr && (
                  <div className="flex items-center gap-1">
                    <span className="text-blue-600">↳</span>
                    <span className="text-gray-500">Break In:</span>
                    <span className="font-medium text-gray-700">{breakInTimeStr}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Last Punch Out - Always show when available */}
        {lastPunchOut && (
          <div className="mb-2 text-xs">
            <div className="text-gray-500">
              <span>Last Punch Out: </span>
              <span className="font-medium text-gray-700">{lastPunchOut.time}</span>
              <span className="text-gray-400"> ({lastPunchOut.date})</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {/* Slider Button for Punch In/Out */}
          <div className="flex-1 min-w-0">
            <PunchSlider
              isPunchedIn={isPunchedIn}
              isLoading={isLoading}
              onPunch={handlePunch}
              disabled={completedToday}
              isOnBreak={isOnBreak}
              hasTakenBreakToday={hasTakenBreakToday}
            />
          </div>
          
          <button
            onClick={handleFaceBiometric}
            className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-transparent border-2 shadow-lg transition-all ${
              completedToday 
                ? 'border-gray-200 cursor-not-allowed opacity-50' 
                : 'border-gray-300 hover:border-gray-400 hover:scale-105'
            }`}
            title={completedToday ? "Attendance completed" : t("faceScan")}
            disabled={completedToday}
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

      {/* Face Biometric Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDevModal(false)}
          />
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center border-2"
            style={{ borderColor: themeColors.primary }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowDevModal(false)}
              className={`absolute top-3 ${language === "ar" ? "left-3" : "right-3"} text-gray-400 hover:text-gray-600 p-1`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Title */}
            <div 
              className="text-sm font-medium mb-3 pb-2 border-b"
              style={{ color: themeColors.textSecondary, borderColor: themeColors.primary + '30' }}
            >
              {language === "ar" ? "المصادقة بالوجه" : "Face Biometric"}
            </div>
            
            {/* Coming Soon Icon */}
            <div className="flex justify-center mb-4">
              <img 
                src="/icon/comingsoon.png" 
                alt="Coming Soon" 
                className="w-24 h-24 object-contain"
              />
            </div>
            
            {/* Message */}
            <h2 
              className="text-xl font-bold mb-2"
              style={{ color: themeColors.text }}
            >
              {language === "ar" ? "قريباً" : "Coming Soon"}
            </h2>
            <p className="text-sm" style={{ color: themeColors.textSecondary }}>
              {language === "ar" 
                ? "ستكون هذه الميزة متاحة في التحديث القادم" 
                : "This feature will be available in next update."}
            </p>
          </motion.div>
        </div>
      )}

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
