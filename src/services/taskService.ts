import api from "./api";

export interface Task {
  name: string;
  subject: string;
  project: string;
  priority: string;
  status: string;
  description: string;
  assigned_by: string;
  assigned_users: string;
  due_date: string;
  creation: string;
  modified: string;
  comments?: TaskComment[];
}

export interface TaskComment {
  name: string;
  comment: string;
  comment_by: string;
  comment_email: string;
  creation: string;
  modified: string;
}

export interface TaskListResponse {
  data: Task[];
}

export interface TaskDashboardStats {
  total: number;
  open: number;
  working: number;
  completed: number;
  overdue: number;
}

export interface TaskStatus {
  name: string;
  label: string;
}

export interface AddTaskCommentRequest {
  task_name: string;
  comment: string;
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

export const getTaskList = async (): Promise<TaskListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify([
    "name", "subject", "project", "priority", "status", "description",
    "assigned_by", "assigned_users", "due_date", "creation", "modified",
  ]));

  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.get_task_list`;

  try {
    console.log("[TaskService] Fetching task list");
    const response = await api.post<{ message: Task[] }>(
      apiUrl,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    return { data: response.data?.message || [] };
  } catch (error: any) {
    console.error("[TaskService] Failed to fetch task list:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch task list");
  }
};

export const getTaskById = async (name: string): Promise<Task | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.get_task_by_id`;

  try {
    console.log("[TaskService] Fetching task by id:", name);
    const response = await api.post<{ message: Task }>(
      apiUrl,
      { task_name: name },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    return response.data?.message || null;
  } catch (error: any) {
    console.error("[TaskService] Failed to fetch task by id:", error);
    return null;
  }
};

export const updateTaskStatus = async (taskName: string, status: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.update_task_status`;

  try {
    console.log("[TaskService] Updating task status:", taskName, status);
    const response = await api.post<{ message: string }>(
      apiUrl,
      { task_name: taskName, status },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    return { message: response.data?.message || "Status updated" };
  } catch (error: any) {
    console.error("[TaskService] Failed to update task status:", error);
    const { message, status: errStatus } = getMobileError(error);
    if (errStatus === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to update task status");
  }
};

export const getTaskStatusList = async (): Promise<TaskStatus[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.get_task_status_list`;

  try {
    console.log("[TaskService] Fetching task status list");
    const response = await api.post<{ message: TaskStatus[] }>(
      apiUrl,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    return response.data?.message || [];
  } catch (error: any) {
    console.error("[TaskService] Failed to fetch task status list:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch task status list");
  }
};

export const getTaskDashboardStats = async (): Promise<TaskDashboardStats> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.get_task_list`;

  try {
    console.log("[TaskService] Fetching task dashboard stats");
    const response = await api.post<{ message: Task[] }>(
      apiUrl,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    const tasks = response.data?.message || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats: TaskDashboardStats = {
      total: tasks.length,
      open: tasks.filter((t: Task) => t.status === "Open").length,
      working: tasks.filter((t: Task) => t.status === "Working" || t.status === "In Progress").length,
      completed: tasks.filter((t: Task) => t.status === "Completed" || t.status === "Closed").length,
      overdue: tasks.filter((t: Task) => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today && t.status !== "Completed" && t.status !== "Closed";
      }).length,
    };
    return stats;
  } catch (error: any) {
    console.error("[TaskService] Failed to fetch task dashboard stats:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch task dashboard stats");
  }
};

export const addTaskComment = async (taskName: string, comment: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.add_task_comment`;

  try {
    console.log("[TaskService] Adding task comment:", taskName);
    const response = await api.post<{ message: string }>(
      apiUrl,
      { task_name: taskName, comment },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );
    return { message: response.data?.message || "Comment added" };
  } catch (error: any) {
    console.error("[TaskService] Failed to add task comment:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to add task comment");
  }
};
