import api from "./api";

export interface TravelRequest {
  name: string;
  employee: string;
  employee_name: string;
  purpose: string;
  travel_type: string;
  from_date: string;
  to_date: string;
  from_location: string;
  to_location: string;
  destination: string;
  total_days: number;
  estimated_expense: number;
  advance_required: boolean;
  advance_amount: number;
  status: string;
  approval_status: string;
  remarks: string;
  submitted_date: string;
  manager_approved_date?: string;
  hr_approved_date?: string;
  creation: string;
  modified: string;
}

export interface TravelListResponse {
  data: TravelRequest[];
}

export interface TravelDashboardStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface CreateTravelRequest {
  purpose: string;
  travel_type: string;
  from_date: string;
  to_date: string;
  from_location: string;
  to_location: string;
  destination: string;
  estimated_expense?: number;
  advance_required?: boolean;
  advance_amount?: number;
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

export const getTravelRequests = async (): Promise<TravelListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify([
    "name", "employee", "employee_name", "purpose", "travel_type",
    "from_date", "to_date", "from_location", "to_location", "destination",
    "total_days", "estimated_expense", "advance_required", "advance_amount",
    "status", "approval_status", "remarks", "submitted_date",
    "manager_approved_date", "hr_approved_date", "creation", "modified",
  ]));

  const filters = encodeURIComponent(JSON.stringify([
    ["employee", "=", JSON.parse(localStorage.getItem("ess_user") || "{}").employee || ""],
  ]));

  const apiUrl = `${cleanUrl}/api/resource/Travel%20Request?fields=${fields}&filters=${filters}&order_by=creation desc&limit_page_length=100`;

  try {
    console.log("[TravelService] Fetching travel requests");
    const response = await api.get<{ data: TravelRequest[] }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return { data: response.data?.data || [] };
  } catch (error: any) {
    console.error("[TravelService] Failed to fetch travel requests:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch travel requests");
  }
};

export const getTravelRequestDetails = async (name: string): Promise<TravelRequest | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify([
    "name", "employee", "employee_name", "purpose", "travel_type",
    "from_date", "to_date", "from_location", "to_location", "destination",
    "total_days", "estimated_expense", "advance_required", "advance_amount",
    "status", "approval_status", "remarks", "submitted_date",
    "manager_approved_date", "hr_approved_date", "creation", "modified",
  ]));

  const apiUrl = `${cleanUrl}/api/resource/Travel%20Request/${encodeURIComponent(name)}?fields=${fields}`;

  try {
    console.log("[TravelService] Fetching travel request details:", name);
    const response = await api.get<{ data: TravelRequest }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return response.data?.data || null;
  } catch (error: any) {
    console.error("[TravelService] Failed to fetch travel request details:", error);
    return null;
  }
};

export const createTravelRequest = async (data: CreateTravelRequest): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/resource/Travel%20Request`;

  try {
    console.log("[TravelService] Creating travel request");
    const response = await api.post<{ data: TravelRequest }>(
      apiUrl,
      {
        purpose: data.purpose,
        travel_type: data.travel_type,
        from_date: data.from_date,
        to_date: data.to_date,
        from_location: data.from_location,
        to_location: data.to_location,
        destination: data.destination,
        estimated_expense: data.estimated_expense || 0,
        advance_required: data.advance_required || false,
        advance_amount: data.advance_amount || 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    console.log("[TravelService] Travel request created:", response.data);
    return { message: "Travel request submitted successfully" };
  } catch (error: any) {
    console.error("[TravelService] Failed to create travel request:", error);
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(error.response?.data?.exception || error.message || "Failed to create travel request");
  }
};

export const cancelTravelRequest = async (name: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/frappe.client.set_value`;

  try {
    console.log("[TravelService] Cancelling travel request:", name);
    const response = await api.post<{ message: any }>(
      apiUrl,
      {
        doctype: "Travel Request",
        name: name,
        fieldname: "status",
        value: "Cancelled",
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    console.log("[TravelService] Travel request cancelled:", response.data);
    return { message: "Travel request cancelled" };
  } catch (error: any) {
    console.error("[TravelService] Failed to cancel travel request:", error);
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(error.response?.data?.exception || error.message || "Failed to cancel travel request");
  }
};

export const getTravelDashboardStats = async (): Promise<TravelDashboardStats> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify(["name", "status"]));
  const filters = encodeURIComponent(JSON.stringify([
    ["employee", "=", JSON.parse(localStorage.getItem("ess_user") || "{}").employee || ""],
  ]));

  const apiUrl = `${cleanUrl}/api/resource/Travel%20Request?fields=${fields}&filters=${filters}&limit_page_length=500`;

  try {
    console.log("[TravelService] Fetching travel dashboard stats");
    const response = await api.get<{ data: { name: string; status: string }[] }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    const requests = response.data?.data || [];
    const stats: TravelDashboardStats = {
      total: requests.length,
      approved: requests.filter((r) => r.status === "Approved").length,
      pending: requests.filter((r) => r.status === "Pending" || r.status === "Draft").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
    };
    return stats;
  } catch (error: any) {
    console.error("[TravelService] Failed to fetch travel dashboard stats:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch travel dashboard stats");
  }
};
