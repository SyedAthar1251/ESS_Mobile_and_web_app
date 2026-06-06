import api from "./api";

export interface HRNotificationItem {
  name: string;
  subject: string;
  message: string;
  read: number;
  creation: string;
  reference_document?: string;
  reference_name?: string;
  notification_type?: string;
}

export interface HRNotificationListResponse {
  message?: string;
  data?: HRNotificationItem[];
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

export const getHRNotifications = async (): Promise<HRNotificationListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.notification_list`;

  try {
    const response = await api.get<HRNotificationListResponse>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("[HRNotificationService] Failed to fetch notifications:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch notifications");
  }
};

export const markHRNotificationAsRead = async (notificationName: string): Promise<void> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.mark_notification_read`;

  try {
    await api.post(
      apiUrl,
      { notification_name: notificationName },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
  } catch (error: any) {
    console.error("[HRNotificationService] Failed to mark notification as read:", error);
    throw error;
  }
};
