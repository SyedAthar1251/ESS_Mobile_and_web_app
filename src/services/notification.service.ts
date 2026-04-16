import api from "./api";

// Notification types
export interface NotificationItem {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  subject: string;
  content: string;
  type: string;
  read: number;
  for_user: string;
  from_user: string;
  reference_name: string | null;
  reference_doctype: string | null;
  doctype: "Notification Log";
}

// Notification list response
export interface NotificationListResponse {
  message: string;
  data: NotificationItem[];
}

// Get user credentials from localStorage
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

// Get authorization header
const getAuthHeader = (apiKey: string, apiSecret: string) => {
  return {
    Authorization: `token ${apiKey}:${apiSecret}`,
  };
};

// Get notification list
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
    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(error.response?.data?.exception || error.message || "Failed to fetch notifications");
  }
};

// Mark notification as read
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
          "Content-Type": "application/x-www-form-urlencoded",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    console.log("[NotificationService] Notification marked as read");
  } catch (error: any) {
    console.error("[NotificationService] Failed to mark notification as read:", error);
    // Don't throw error - just log it
  }
};