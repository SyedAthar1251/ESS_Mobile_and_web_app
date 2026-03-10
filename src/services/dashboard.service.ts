import api from "./api";

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

const getUserCredentials = (): { companyUrl: string; apiKey: string; apiSecret: string } => {
  const savedUser = localStorage.getItem("ess_user");
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    if (userData.companyUrl && userData.apiKey && userData.apiSecret) {
      return {
        companyUrl: userData.companyUrl,
        apiKey: userData.apiKey,
        apiSecret: userData.apiSecret,
      };
    }
  }
  throw new Error("Authentication credentials not found. Please login again.");
};

const getAuthHeader = (apiKey: string, apiSecret: string) => {
  // Frappe expects: "token api_key:api_secret"
  return {
    Authorization: `token ${apiKey}:${apiSecret}`,
  };
};

// ============================================
// GET Dashboard
// ============================================

export const getDashboard = async (): Promise<DashboardData> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  
  console.log("[DashboardService] Fetching dashboard data");

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
    return response.data;
  } catch (error: any) {
    console.error("[DashboardService] Failed to fetch dashboard:", error);
    throw new Error(error.response?.data?.exception || "Failed to fetch dashboard data");
  }
};
