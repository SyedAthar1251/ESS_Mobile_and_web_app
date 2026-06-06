import api from "./api";

export interface LeaveApplicationDetail {
  name: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: string;
  posting_date: string;
  description: string | null;
  half_day: number;
  half_day_date: string | null;
  leave_approver: string;
  department: string | null;
  company: string | null;
}

export interface HRApplication {
  name: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: string;
  posting_date: string;
  leave_approver: string;
  description?: string;
}

export interface HRLeaveListResponse {
  message?: string;
  data?: HRApplication[];
}

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

export const getPendingLeaves = async (): Promise<HRLeaveListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify([
    "name", "employee", "employee_name", "leave_type",
    "from_date", "to_date", "total_leave_days", "status",
    "posting_date", "description", "leave_approver",
  ]));

  const filters = encodeURIComponent(JSON.stringify([["status", "=", "Open"]]));
  const apiUrl = `${cleanUrl}/api/resource/Leave%20Application?fields=${fields}&filters=${filters}&order_by=posting_date desc&limit_page_length=100`;

  try {
    console.log("[HRLeaveService] Fetching pending leaves");
    const response = await api.get<{ data: HRApplication[] }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    console.log("[HRLeaveService] Pending leaves response:", response.data);
    return { data: response.data?.data || [] };
  } catch (error: any) {
    console.error("[HRLeaveService] Failed to fetch pending leaves:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch pending leaves");
  }
};

export const getLeaveApplicationDetail = async (name: string): Promise<LeaveApplicationDetail | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify([
    "name", "employee", "employee_name", "leave_type",
    "from_date", "to_date", "total_leave_days", "status",
    "posting_date", "description", "half_day", "half_day_date",
    "leave_approver", "department", "company",
  ]));

  const apiUrl = `${cleanUrl}/api/resource/Leave%20Application/${encodeURIComponent(name)}?fields=${fields}`;

  try {
    console.log("[HRLeaveService] Fetching leave detail:", name);
    const response = await api.get<{ data: LeaveApplicationDetail }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return response.data?.data || null;
  } catch (error: any) {
    console.error("[HRLeaveService] Failed to fetch leave detail:", error);
    return null;
  }
};

export const approveLeave = async (name: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/frappe.client.set_value`;

  try {
    console.log("[HRLeaveService] Approving leave:", name);
    const response = await api.post<{ message: any }>(
      apiUrl,
      {
        doctype: "Leave Application",
        name: name,
        fieldname: "status",
        value: "Approved",
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    console.log("[HRLeaveService] Leave approved:", response.data);
    return { message: "Approved" };
  } catch (error: any) {
    console.error("[HRLeaveService] Failed to approve leave:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to approve leave");
  }
};

export const rejectLeave = async (name: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/frappe.client.set_value`;

  try {
    console.log("[HRLeaveService] Rejecting leave:", name);
    const response = await api.post<{ message: any }>(
      apiUrl,
      {
        doctype: "Leave Application",
        name: name,
        fieldname: "status",
        value: "Rejected",
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    console.log("[HRLeaveService] Leave rejected:", response.data);
    return { message: "Rejected" };
  } catch (error: any) {
    console.error("[HRLeaveService] Failed to reject leave:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to reject leave");
  }
};
