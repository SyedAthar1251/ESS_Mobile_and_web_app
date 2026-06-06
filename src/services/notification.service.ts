import api from "./api";

export interface NotificationItem {
  name: string;
  subject: string;
  message: string;
  read: number;
  creation: string;
  document_type?: string;
  reference_document?: string;
  reference_name?: string;
}

export interface NotificationListResponse {
  message: string;
  data: NotificationItem[];
}

const getUserCredentials = () => {
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

export const getNotificationList = async (): Promise<NotificationListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  console.log("[NotificationService] Fetching notification list");

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.notification_list`;
  console.log("[NotificationService] Full API URL:", apiUrl);

  try {
    const response = await api.get<NotificationListResponse>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[NotificationService] Notification list response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[NotificationService] Failed to fetch notifications:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch notifications");
  }
};

export const markNotificationAsRead = async (notificationName: string): Promise<void> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  console.log("[NotificationService] Marking notification as read:", notificationName);

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.mark_notification_read`;

  try {
    await api.post(apiUrl,
      { notification_name: notificationName },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    console.log("[NotificationService] Notification marked as read");
  } catch (error: any) {
    console.error("[NotificationService] Failed to mark notification as read:", error);
    throw error;
  }
};
