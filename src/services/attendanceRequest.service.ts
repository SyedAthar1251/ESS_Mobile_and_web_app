import api from "./api";
import type {
  AttendanceRequest,
  AttendanceRequestListItem,
  AttendanceRequestDetail,
  CreateAttendanceRequestPayload,
  UpdateAttendanceRequestPayload,
  AttendanceRequestListResponse,
  CreateAttendanceRequestResponse,
} from "../types/attendanceRequest";

export type {
  AttendanceRequest,
  AttendanceRequestListItem,
  AttendanceRequestDetail,
  CreateAttendanceRequestPayload,
  UpdateAttendanceRequestPayload,
  AttendanceRequestListResponse,
  CreateAttendanceRequestResponse,
};

const DUMMY_MODE = false;

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

export const mapDocstatusToStatus = (docstatus: number): string => {
  switch (docstatus) {
    case 0:
      return "Draft";
    case 1:
      return "Approved";
    case 2:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

export const getAttendanceRequests = async (): Promise<AttendanceRequestListResponse> => {
  const { companyUrl, apiKey, apiSecret, employeeId } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify([
    "name", "employee", "employee_name", "from_date", "to_date",
    "reason", "shift", "docstatus", "creation", "modified",
  ]));

  const filters = encodeURIComponent(JSON.stringify([["employee", "=", employeeId]]));
  const apiUrl = `${cleanUrl}/api/resource/Attendance%20Request?fields=${fields}&filters=${filters}&order_by=creation desc&limit_page_length=100`;

  try {
    const response = await api.get<{ data: AttendanceRequestListItem[] }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return { data: response.data?.data || [] };
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch attendance requests");
  }
};

export const getAttendanceRequest = async (name: string): Promise<AttendanceRequestDetail | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify([
    "name", "employee", "employee_name", "from_date", "to_date",
    "reason", "shift", "docstatus", "creation", "modified", "half_day", "explanation"
  ]));

  const apiUrl = `${cleanUrl}/api/resource/Attendance%20Request/${encodeURIComponent(name)}?fields=${fields}`;

  try {
    const response = await api.get<{ data: AttendanceRequest }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    const data = response.data?.data;
    if (!data) return null;

    return {
      ...data,
      status: mapDocstatusToStatus(data.docstatus),
    };
  } catch (error: any) {
    return null;
  }
};

export const createAttendanceRequest = async (
  data: CreateAttendanceRequestPayload
): Promise<CreateAttendanceRequestResponse> => {
  const { companyUrl, apiKey, apiSecret, employeeId } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/resource/Attendance%20Request`;

  try {
    const payload: Record<string, any> = {
      doctype: "Attendance Request",
      employee: employeeId,
      from_date: data.from_date,
      to_date: data.to_date,
      reason: data.reason,
    };

    if (data.shift) {
      payload.shift = data.shift;
    }

    const response = await api.post<CreateAttendanceRequestResponse>(
      apiUrl,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    if (!response.data?.data) {
      throw new Error(response.data?.message || "Failed to create attendance request");
    }

    return response.data;
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to create attendance request");
  }
};

export const updateAttendanceRequest = async (
  name: string,
  data: UpdateAttendanceRequestPayload
): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/resource/Attendance%20Request/${encodeURIComponent(name)}`;

  try {
    const payload: Record<string, any> = {};

    if (data.from_date) payload.from_date = data.from_date;
    if (data.to_date) payload.to_date = data.to_date;
    if (data.reason !== undefined) payload.reason = data.reason;
    if (data.shift !== undefined) payload.shift = data.shift;

    const response = await api.post<{ message: string }>(
      apiUrl,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    return { message: "Attendance request updated successfully" };
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to update attendance request");
  }
};

export const cancelAttendanceRequest = async (name: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/frappe.client.set_value`;

  try {
    const response = await api.post<{ message: any }>(
      apiUrl,
      {
        doctype: "Attendance Request",
        name: name,
        fieldname: "docstatus",
        value: 2,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    return { message: "Attendance request cancelled successfully" };
  } catch (error: any) {
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to cancel attendance request");
  }
};

export interface ShiftType {
  name: string;
}

export const getShiftTypes = async (): Promise<{ label: string; value: string }[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify(["name"]));
  const apiUrl = `${cleanUrl}/api/resource/Shift%20Type?fields=${fields}`;

  try {
    const response = await api.get<{ data: ShiftType[] }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return (response.data?.data || []).map(st => ({
      label: st.name,
      value: st.name
    }));
  } catch (error: any) {
    return [];
  }
};