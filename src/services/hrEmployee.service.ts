import api from "./api";

export interface HREmployee {
  name: string;
  employee_name: string;
  department?: string;
  designation?: string;
  status: string;
  employee_number?: string;
  company?: string;
  date_of_joining?: string;
  user_id?: string;
  image?: string;
}

export interface HREmployeeListResponse {
  message?: string;
  data?: HREmployee[];
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

export const getEmployees = async (
  page: number = 1,
  pageSize: number = 20
): Promise<HREmployeeListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const start = (page - 1) * pageSize;

  const apiUrl = `${cleanUrl}/api/resource/Employee?fields=["name","employee_name","department","designation","status","employee_number","company","date_of_joining","user_id","image"]&filters=[["status","=","Active"]]&limit_start=${start}&limit_page_length=${pageSize}&order_by=employee_name asc`;

  try {
    const response = await api.get<HREmployeeListResponse>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("[HREmployeeService] Failed to fetch employees:", error);
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(error.response?.data?.exception || error.message || "Failed to fetch employees");
  }
};

export const searchEmployees = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<HREmployeeListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const start = (page - 1) * pageSize;
  const searchFilter = [
    ["status", "=", "Active"],
    ["employee_name", "like", `%${query}%`]
  ];

  const apiUrl = `${cleanUrl}/api/resource/Employee?fields=["name","employee_name","department","designation","status","employee_number","company","date_of_joining","user_id","image"]&filters=${encodeURIComponent(JSON.stringify(searchFilter))}&limit_start=${start}&limit_page_length=${pageSize}&order_by=employee_name asc`;

  try {
    const response = await api.get<HREmployeeListResponse>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("[HREmployeeService] Failed to search employees:", error);
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(error.response?.data?.exception || error.message || "Failed to search employees");
  }
};
