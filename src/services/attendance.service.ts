import api from "./api";

// DUMMY MODE - Set to true to bypass API calls for development
const DUMMY_MODE = true;

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

// Get authorization header with API key and secret
const getAuthHeader = (apiKey: string, apiSecret: string) => {
  const credentials = `${apiKey}:${apiSecret}`;
  const encodedCredentials = btoa(credentials);
  return {
    Authorization: `Basic ${encodedCredentials}`,
  };
};

// Get list of checkin records (summary only)
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
      shift: "Morning Shift",
      custom_checkin_location: "Office",
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
