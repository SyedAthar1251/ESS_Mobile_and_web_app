import api from "./api";

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

export interface AttendanceReportItem {
  date: string;
  working_hours: number;
  in_time: string | null;
  out_time: string | null;
  status: string;
  late_entry: number;
  early_exit: number;
}

export interface CheckinReportItem {
  employee_name: string;
  time: string;
  log_type: "IN" | "OUT";
  shift: string;
  location: string | null;
}

export const getAttendanceReport = async (fromDate?: string, toDate?: string): Promise<AttendanceReportItem[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const today = new Date();
  const defaultToDate = today.toISOString().split('T')[0];
  const defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  
  const finalFromDate = fromDate || defaultFromDate;
  const finalToDate = toDate || defaultToDate;

  const apiUrl = `${cleanUrl}/api/method/employee_self_service.api.reports.get_attendance_report?from_date=${encodeURIComponent(finalFromDate)}&to_date=${encodeURIComponent(finalToDate)}`;

  try {
    const response = await api.get<any>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    console.log("[ReportService] Attendance report response:", response.data);
    const rawData = response.data?.data?.attendance;
    if (Array.isArray(rawData)) return rawData;
    return [];
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch attendance report");
  }
};

export const getEmployeeCheckins = async (fromDate?: string, toDate?: string): Promise<CheckinReportItem[]> => {
  const { companyUrl, apiKey, apiSecret, employeeId } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const today = new Date();
  const defaultToDate = today.toISOString().split('T')[0];
  const defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  
  const finalFromDate = fromDate || defaultFromDate;
  const finalToDate = toDate || defaultToDate;

  const apiUrl = `${cleanUrl}/api/method/employee_self_service.api.reports.get_employee_checkins?employee_id=${encodeURIComponent(employeeId)}&from_date=${encodeURIComponent(finalFromDate)}&to_date=${encodeURIComponent(finalToDate)}`;

  try {
    const response = await api.get<any>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    console.log("[ReportService] Checkin report response:", response.data);
    const rawData = response.data?.data?.checkins;
    if (Array.isArray(rawData)) return rawData;
    return [];
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch employee checkins");
  }
};

export interface AttendanceReportResponse {
  data?: {
    summary: {
      present_count: number;
      absent_count: number;
      leave_count: number;
      half_day_count: number;
      total: number;
    };
    attendance: AttendanceReportItem[];
  };
  message?: string;
}

export interface CheckinReportResponse {
  data?: {
    checkins: CheckinReportItem[];
  };
  message?: string;
}