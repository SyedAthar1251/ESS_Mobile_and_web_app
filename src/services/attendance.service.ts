import api from "./api";

// DUMMY MODE - Set to true to bypass API calls for development
const DUMMY_MODE = false;

// Employee Checkin type
export interface EmployeeCheckin {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  employee: string;
  employee_name: string;
  log_type: "IN" | "OUT";
  shift: string;
  custom_checkin_location: string;
  time: string;
  office_hours: string;
  lunch_break: string;
  skip_auto_attendance: number;
  latitude: number;
  longitude: number;
  geolocation: string;
  offshift: number;
  out_of_location_checkout: number;
  doctype: "Employee Checkin";
}

// Checkin list item (summary)
export interface CheckinListItem {
  name: string;
  time: string;
  log_type: "IN" | "OUT";
}

// Checkin list response
export interface CheckinListResponse {
  data: CheckinListItem[];
}

// Checkin detail response
export interface CheckinDetailResponse {
  data: EmployeeCheckin;
}

// Create employee log response
export interface CreateEmployeeLogResponse {
  message?: string;
  data?: EmployeeCheckin;
  exception?: string;
  error?: string;
}

// Attendance details dashboard response
export interface AttendanceDashboardData {
  total_days?: number;
  present?: number;
  absent?: number;
  days_off?: number;
  late_arrivals?: number;
}

// Get user credentials from localStorage
const getUserCredentials = (): { companyUrl: string; apiKey: string; apiSecret: string; employeeId: string } => {
  const savedUser = localStorage.getItem("ess_user");
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    if (userData.companyUrl && userData.apiKey && userData.apiSecret) {
      return {
        companyUrl: userData.companyUrl,
        apiKey: userData.apiKey,
        apiSecret: userData.apiSecret,
        employeeId: userData.employeeId,
      };
    }
  }
  throw new Error("Authentication credentials not found. Please login again.");
};

// Get authorization header with API key and secret
const getAuthHeader = (apiKey: string, apiSecret: string) => {
  // Frappe expects: "token api_key:api_secret"
  return {
    Authorization: `token ${apiKey}:${apiSecret}`,
  };
};

// ============================================
// PUNCH IN / PUNCH OUT API
// ============================================

// Create employee log (Punch In / Punch Out)
export const createEmployeeLog = async (
  logType: "IN" | "OUT",
  location?: string
): Promise<CreateEmployeeLogResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  
  console.log("[AttendanceService] Creating employee log:", logType);
  console.log("[AttendanceService] Location:", location);

  // DUMMY MODE - Return fake success for development
  if (DUMMY_MODE) {
    console.log("[AttendanceService] DUMMY MODE - Returning fake punch success");
    return {
      message: "Checkin recorded successfully",
      data: {
        name: "CHK-DUMMY-" + Date.now(),
        owner: "Administrator",
        creation: new Date().toISOString(),
        modified: new Date().toISOString(),
        modified_by: "Administrator",
        docstatus: 1,
        idx: 1,
        employee: "TS-EMP-00005",
        employee_name: "Test User",
        log_type: logType,
        shift: "test shift",
        custom_checkin_location:"Home",
        time: new Date().toISOString(),
        office_hours: "8",
        lunch_break: "1",
        skip_auto_attendance: 0,
        latitude: 0,
        longitude: 0,
        geolocation: "Home",
        offshift: 0,
        out_of_location_checkout: 0,
        doctype: "Employee Checkin",
      },
    };
  }

  const cleanUrl = companyUrl.replace(/\/$/, "");
  
  // Parse latitude and longitude from location string
  let latitude = 0;
  let longitude = 0;
  let locationName = "Office";
  
  if (location && location.includes(",")) {
    const parts = location.split(",").map(s => s.trim());
    latitude = parseFloat(parts[0]) || 0;
    longitude = parseFloat(parts[1]) || 0;
    locationName = "Home";
  } else if (location) {
    locationName = location;
  }

  // Use custom ESS API - it handles employee and shift automatically
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.create_employee_log`;
  console.log("[AttendanceService] Full API URL:", apiUrl);

  try {
    // Use form-urlencoded format for Frappe whitelist endpoints
    const formData = new URLSearchParams();
    formData.append("log_type", logType);
    formData.append("location", locationName);

    console.log("[AttendanceService] Form data:", formData.toString());

    const response = await api.post<CreateEmployeeLogResponse>(
      apiUrl,
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...getAuthHeader(apiKey, apiSecret),
        },
        timeout: 30000,
      }
    );

    console.log("[AttendanceService] Punch success:", response.data);
    return response.data;
  } catch (error: any) {
    console.log("[AttendanceService] Punch error details:", {
      status: error.response?.status,
      message: error.response?.data?.exception || error.response?.data?.error || error.message,
      fullError: error.response?.data,
    });

    if (error.response?.data?.exception) {
      throw new Error(error.response.data.exception);
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Request timed out. Please try again.");
    } else {
      throw new Error("Failed to record checkin. Please try again.");
    }
  }
};

// ============================================
// ATTENDANCE LIST API
// ============================================

// Attendance list types
export interface AttendanceDetails {
  days_in_month: number;
  present: number;
  absent: number;
  late: number;
}

export interface AttendanceListItem {
  attendance_date: string;
  working_hours: number;
  in_time: string | null;
  out_time: string | null;
  employee_checkin_detail: EmployeeCheckin[];
}

export interface AttendanceListResponse {
  message: string;
  data: {
    attendance_details: AttendanceDetails;
    attendance_list: AttendanceListItem[];
  };
}

// Get attendance list (monthly)
export const getAttendanceList = async (
  year: number,
  month: string
): Promise<AttendanceListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  
  console.log("[AttendanceService] Fetching attendance list:", year, month);

  // DUMMY MODE - Return fake data
  if (DUMMY_MODE) {
    console.log("[AttendanceService] DUMMY MODE - Returning fake attendance list");
    return {
      message: "Attendance data getting Successfully",
      data: {
        attendance_details: {
          days_in_month: 31,
          present: 20,
          absent: 8,
          late: 3,
        },
        attendance_list: [
          {
            attendance_date: "08 Sunday",
            working_hours: 8.5,
            in_time: "09:00:00",
            out_time: "17:30:00",
            employee_checkin_detail: [],
          },
          {
            attendance_date: "07 Saturday",
            working_hours: 0.0,
            in_time: null,
            out_time: null,
            employee_checkin_detail: [],
          },
          {
            attendance_date: "06 Friday",
            working_hours: 0.0,
            in_time: null,
            out_time: null,
            employee_checkin_detail: [],
          },
          {
            attendance_date: "05 Thursday",
            working_hours: 9.0,
            in_time: "08:30:00",
            out_time: "17:30:00",
            employee_checkin_detail: [],
          },
        ],
      },
    };
  }

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.get_attendance_list?year=${year}&month=${month}`;
  console.log("[AttendanceService] Full API URL:", apiUrl);

  try {
    // Use GET with query params as required by the API
    const response = await api.get<AttendanceListResponse>(
      apiUrl,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    console.log("[AttendanceService] Attendance list response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[AttendanceService] Failed to fetch attendance list:", error);
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(error.response?.data?.exception || error.message || "Failed to fetch attendance list");
  }
};

// ============================================
// ATTENDANCE DASHBOARD API
// ============================================

// Get attendance details dashboard
export const getAttendanceDetailsDashboard = async (): Promise<AttendanceDashboardData> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  
  console.log("[AttendanceService] Fetching attendance dashboard");

  // DUMMY MODE - Return fake data
  if (DUMMY_MODE) {
    console.log("[AttendanceService] DUMMY MODE - Returning fake dashboard data");
    return {
      total_days: 22,
      present: 20,
      absent: 2,
      days_off: 3,
      late_arrivals: 1,
    };
  }

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.get_attendance_details_dashboard`;
  console.log("[AttendanceService] Full API URL:", apiUrl);

  try {
    const response = await api.get<AttendanceDashboardData>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[AttendanceService] Dashboard response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[AttendanceService] Failed to fetch dashboard:", error);
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(error.response?.data?.exception || error.message || "Failed to fetch attendance dashboard");
  }
};

// ============================================
// LEGACY API FUNCTIONS (Direct Resource Access)
// ============================================

// Get API URL for Employee Checkin list
const getCheckinListUrl = (companyUrl: string, employeeId: string): string => {
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const encodedId = encodeURIComponent(employeeId);
  // Get name, time, and log_type for the list
  return `${cleanUrl}/api/resource/Employee%20Checkin?filters=[["employee","=","${encodedId}"]]&fields=["name","time","log_type"]&order_by=time desc`;
};

// Get API URL for single checkin detail
const getCheckinDetailUrl = (companyUrl: string, checkinName: string): string => {
  const cleanUrl = companyUrl.replace(/\/$/, "");
  return `${cleanUrl}/api/resource/Employee%20Checkin/${checkinName}`;
};

// Get list of checkin records (summary only) - Using direct resource API
export const getEmployeeCheckinList = async (employeeId: string): Promise<CheckinListItem[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const apiUrl = getCheckinListUrl(companyUrl, employeeId);

  console.log("[AttendanceService] Fetching checkin list for employee:", employeeId);
  console.log("[AttendanceService] API URL:", apiUrl);

  // DUMMY MODE - Return fake data for development
  if (DUMMY_MODE) {
    console.log("[AttendanceService] DUMMY MODE - Returning fake checkin list");
    return [
      { name: "CHK-001", time: "2024-01-15 09:00:00", log_type: "IN" },
      { name: "CHK-002", time: "2024-01-15 17:30:00", log_type: "OUT" },
      { name: "CHK-003", time: "2024-01-16 08:55:00", log_type: "IN" },
      { name: "CHK-004", time: "2024-01-16 17:45:00", log_type: "OUT" },
      { name: "CHK-005", time: "2024-01-17 09:10:00", log_type: "IN" },
    ];
  }

  try {
    const response = await api.get<CheckinListResponse>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[AttendanceService] Checkin list response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("[AttendanceService] Failed to fetch checkin list:", error);
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    } else if (error.response?.status === 403) {
      throw new Error("Permission denied. You don't have access to this data.");
    }
    throw new Error(error.response?.data?.exception || error.message || "Failed to fetch attendance list");
  }
};

// Get full details of a specific checkin record
export const getCheckinDetail = async (checkinName: string): Promise<EmployeeCheckin> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const apiUrl = getCheckinDetailUrl(companyUrl, checkinName);

  console.log("[AttendanceService] Fetching checkin detail:", checkinName);
  console.log("[AttendanceService] API URL:", apiUrl);

  // DUMMY MODE - Return fake data for development
  if (DUMMY_MODE) {
    console.log("[AttendanceService] DUMMY MODE - Returning fake checkin detail");
    return {
      name: checkinName,
      owner: "Administrator",
      creation: "2024-01-15 09:00:00",
      modified: "2024-01-15 09:00:00",
      modified_by: "Administrator",
      docstatus: 1,
      idx: 1,
      employee: "TS-EMP-00005",
      employee_name: "Test User",
      log_type: "IN",
      shift: "test shift",
      custom_checkin_location: "Home",
      time: "2024-01-15 09:00:00",
      office_hours: "8",
      lunch_break: "1",
      skip_auto_attendance: 0,
      latitude: 24.7136,
      longitude: 46.6753,
      geolocation: "Riyadh",
      offshift: 0,
      out_of_location_checkout: 0,
      doctype: "Employee Checkin",
    };
  }

  try {
    const response = await api.get<CheckinDetailResponse>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[AttendanceService] Checkin detail response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("[AttendanceService] Failed to fetch checkin detail:", error);
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    } else if (error.response?.status === 403) {
      throw new Error("Permission denied. You don't have access to this data.");
    }
    throw new Error(error.response?.data?.exception || error.message || "Failed to fetch checkin details");
  }
};

