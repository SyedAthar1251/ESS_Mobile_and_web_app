import api from "./api";
import { CheckinListItem } from "./attendance.service";

// DUMMY MODE - Set to true to bypass API calls for development
const DUMMY_MODE = false;

// ============================================
// Types
// ============================================

export interface DashboardData {
  notices?: Notice[];
  attendance_summary?: AttendanceSummary;
  latest_records?: LatestRecords;
  version_info?: VersionInfo;
  employee_image?: string;
  // Additional fields from API
  notice_board?: Notice[];
  leave_balance?: any[];
  latest_leave?: any;
  latest_expense?: any;
  latest_salary_slip?: any;
  stop_location_validate?: number;
  last_log_type?: string;
  version?: string;
  update_version_forcefully?: number;
  company?: string;
  last_log_time?: string;
  // Last 3 days checkins
  recent_checkins?: RecentCheckin[];
}

export interface RecentCheckin {
  date: string;
  checkin_time: string;
  checkout_time: string;
  status: "Present" | "Absent" | "Half Day" | "On Leave";
  log_type?: "IN" | "OUT";
}

export interface Notice {
  name: string;
  title: string;
  content: string;
  posting_date: string;
}

export interface AttendanceSummary {
  total_days: number;
  present: number;
  absent: number;
  days_off: number;
  late_arrivals: number;
}

export interface LatestRecords {
  latest_leaves?: LeaveRecord[];
  latest_expenses?: ExpenseRecord[];
}

export interface LeaveRecord {
  name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  status: string;
}

export interface ExpenseRecord {
  name: string;
  expense_type: string;
  amount: number;
  status: string;
}

export interface VersionInfo {
  app_version: string;
  frappe_version: string;
}

// ============================================
// Helper Functions
// ============================================

const getUserCredentials = (): { companyUrl: string; apiKey: string; apiSecret: string; employeeId: string } => {
  const savedUser = localStorage.getItem("ess_user");
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    if (userData.companyUrl && userData.apiKey && userData.apiSecret) {
      return {
        companyUrl: userData.companyUrl,
        apiKey: userData.apiKey,
        apiSecret: userData.apiSecret,
        employeeId: userData.employeeId || "",
      };
    }
  }
  throw new Error("Authentication credentials not found. Please login again.");
};

const getAuthHeader = (apiKey: string, apiSecret: string) => {
  return {
    Authorization: `token ${apiKey}:${apiSecret}`,
  };
};

const getMobileError = (error: any): { message: string; status: number } => {
  if (error?.response?.status) {
    return {
      message: error.response?.data?.exception || error.response?.data?.message || error.message || "Request failed",
      status: error.response.status,
    };
  }
  return {
    message: error?.message || "Network error",
    status: error?.status || 0,
  };
};

// ============================================
// GET Dashboard
// ============================================

export const getDashboard = async (): Promise<DashboardData> => {
  const { companyUrl, apiKey, apiSecret, employeeId } = getUserCredentials();
  
  console.log("[DashboardService] Fetching dashboard data");
  console.log("[DashboardSecurity] Employee ID:", employeeId);

  if (!employeeId) {
    console.error("[DashboardSecurity] No employee ID found");
    throw new Error("Employee ID not found");
  }

  if (DUMMY_MODE) {
    console.log("[DashboardService] DUMMY MODE - Returning fake dashboard data");
    return {
      notices: [
        {
          name: "NOT-001",
          title: "Office Closure",
          content: "Office will be closed on Friday for maintenance",
          posting_date: "2024-01-25",
        },
      ],
      attendance_summary: {
        total_days: 22,
        present: 20,
        absent: 2,
        days_off: 3,
        late_arrivals: 1,
      },
      latest_records: {
        latest_leaves: [
          {
            name: "LA-001",
            leave_type: "Annual Leave",
            from_date: "2024-02-10",
            to_date: "2024-02-15",
            status: "Approved",
          },
        ],
        latest_expenses: [
          {
            name: "EXP-001",
            expense_type: "Travel",
            amount: 250.00,
            status: "Approved",
          },
        ],
      },
      version_info: {
        app_version: "1.0.0",
        frappe_version: "14.0.0",
      },
      employee_image: "",
      recent_checkins: [
        {
          date: "2026-06-03",
          checkin_time: "09:00",
          checkout_time: "18:00",
          status: "Present",
        },
        {
          date: "2026-06-04",
          checkin_time: "09:15",
          checkout_time: "17:45",
          status: "Present",
        },
        {
          date: "2026-06-05",
          checkin_time: "09:05",
          checkout_time: "17:50",
          status: "Present",
        },
      ],
    };
  }

  const apiUrl = `${companyUrl.replace(/\/$/, "")}/api/method/employee_self_service.mobile.ess.get_dashboard`;
  console.log("[DashboardService] Full API URL:", apiUrl);

  try {
    const response = await api.get<DashboardData>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[DashboardService] Dashboard response:", response.data);
    
    // Fetch recent checkins for last 3 days
    const recentCheckins = await getRecentCheckins(employeeId);
    
    // Add recent checkins to dashboard data
    const enhancedData = {
      ...response.data,
      recent_checkins: recentCheckins,
    };
    
    console.log("[DashboardSecurity] Recent checkins fetched:", recentCheckins.length);
    
    return enhancedData;
  } catch (error: any) {
    console.error("[DashboardService] Failed to fetch dashboard:", error);
    const { message } = getMobileError(error);
    throw new Error(message || "Failed to fetch dashboard data");
  }
};

// Fetch recent checkins for last 3 days
const getRecentCheckins = async (employeeId: string): Promise<RecentCheckin[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  
  try {
    // Get checkins for the last 3 days
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 2); // Last 3 days including today
    
    const fromDate = threeDaysAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    const apiUrl = `${cleanUrl}/api/resource/Employee%20Checkin?filters=[["employee","=","${employeeId}"],["time","between","[${fromDate},${toDate}"]]]&fields=["time","log_type"]&order_by="time desc"`;
    
    console.log("[DashboardSecurity] Fetching checkins from:", apiUrl);
    
    const response = await api.get(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    
    const checkins = Array.isArray((response.data as any)?.data)
      ? (response.data as any).data
      : [] as CheckinListItem[];
    
    console.log("[DashboardSecurity] Raw checkins received:", checkins.length);
    
    // Group checkins by date and format
    const checkinsByDate: Record<string, CheckinListItem[]> = {};
    checkins.forEach((checkin: CheckinListItem) => {
      const date = checkin.time.split('T')[0];
      if (!checkinsByDate[date]) {
        checkinsByDate[date] = [];
      }
      checkinsByDate[date].push(checkin);
    });
    
    // Convert to recent checkins format
    const recentCheckins: RecentCheckin[] = [];
    const dates = Object.keys(checkinsByDate).sort().reverse(); // Most recent first
    
    for (const date of dates) {
      const dayCheckins = checkinsByDate[date];
      const checkIn = dayCheckins.find(c => c.log_type === "IN");
      const checkOut = dayCheckins.find(c => c.log_type === "OUT");
      
      let status: "Present" | "Absent" | "Half Day" | "On Leave" = "Absent";
      if (checkIn && checkOut) {
        status = "Present";
      } else if (checkIn && !checkOut) {
        status = "Half Day"; // Checked in but not out yet
      } else if (!checkIn && checkOut) {
        status = "Half Day"; // Checked out without checkin (edge case)
      }
      
      recentCheckins.push({
        date,
        checkin_time: checkIn ? new Date(checkIn.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : "",
        checkout_time: checkOut ? new Date(checkOut.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : "",
        status,
      });
    }
    
    console.log("[DashboardSecurity] Processed checkins by date:", recentCheckins.length);
    return recentCheckins;
  } catch (error: any) {
    console.error("[DashboardSecurity] Failed to fetch recent checkins:", error);
    // Return empty array on error - don't break dashboard
    return [];
  }
};
