import api from "./api";

// DUMMY MODE - Set to true to bypass API calls for development
const DUMMY_MODE = false;

// ============================================
// Types - Updated based on actual API response
// ============================================

export interface LeaveTypeBalance {
  leave_type: string;
  employee: string;
  employee_name: string;
  leaves_allocated: number;
  leaves_expired: number;
  opening_balance: number;
  leaves_taken: number;
  closing_balance: number;
  indent: number;
}

export interface LeaveApplication {
  name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  status: string;
  description: string;
  total_leave_days: number;
  creation: string;
}

export interface LeaveApplicationListResponse {
  message?: string;
  data?: {
    upcoming: LeaveApplication[];
    taken: LeaveApplication[];
    balance: LeaveTypeBalance[];
  };
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
// GET Leave Application List (includes leave types with balance)
// API: employee_self_service.mobile.ess.get_leave_application_list
// ============================================

export const getLeaveApplicationList = async (): Promise<LeaveApplicationListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  
  console.log("[LeaveService] Fetching leave application list");

  if (DUMMY_MODE) {
    console.log("[LeaveService] DUMMY MODE - Returning fake leave applications");
    return {
      message: "leave data getting successfully",
      data: {
        upcoming: [],
        taken: [],
        balance: [
          { leave_type: "Annual Leave", employee: "TS-EMP-00001", employee_name: "Test User", leaves_allocated: 20, leaves_expired: 0, opening_balance: 20, leaves_taken: 5, closing_balance: 15, indent: 1 },
          { leave_type: "Sick Leave", employee: "TS-EMP-00001", employee_name: "Test User", leaves_allocated: 10, leaves_expired: 0, opening_balance: 10, leaves_taken: 2, closing_balance: 8, indent: 1 },
        ],
      },
    };
  }

  const apiUrl = `${companyUrl.replace(/\/$/, "")}/api/method/employee_self_service.mobile.ess.get_leave_application_list`;
  console.log("[LeaveService] Full API URL:", apiUrl);

  try {
    const response = await api.get<LeaveApplicationListResponse>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[LeaveService] Leave applications response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[LeaveService] Failed to fetch leave applications:", error);
    throw new Error(error.response?.data?.exception || "Failed to fetch leave applications");
  }
};
