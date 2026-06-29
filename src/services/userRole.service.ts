import api from "./api";

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

const HR_ROLE_NAMES = ["HR Manager", "Leave Approver", "Expense Approver"];
const ADMIN_MANAGER_ROLE_NAMES = ["ESS Admin Manager", "Ess Admin Manager", "Admin Manager"];

export const getUserRoles = async (): Promise<string[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.v1.permission.get_current_user_roles`;

  try {
    console.log("[RoleService] Fetching roles...");
    const response = await api.post<{ message: string[] }>(
      apiUrl,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    console.log("[RoleService] Roles response:", response.data);

    const roles = response.data?.message || [];
    if (!Array.isArray(roles)) {
      console.warn("[RoleService] Roles response is not an array:", roles);
      return [];
    }
    return roles.filter((r: any) => typeof r === "string");
  } catch (error: any) {
    console.error("[RoleService] Failed to fetch user roles:", error?.message || error);
    return [];
  }
};

export const hasHRRole = (roles: string[]): boolean => {
  return roles.some((role) => HR_ROLE_NAMES.includes(role));
};

export const hasAdminManagerRole = (roles: string[]): boolean => {
  return roles.some((role) => ADMIN_MANAGER_ROLE_NAMES.includes(role));
};
