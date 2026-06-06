import api from "./api";

export interface HRExpenseClaim {
  name: string;
  employee: string;
  employee_name: string;
  posting_date: string;
  grand_total: number;
  total_claimed_amount: number;
  status: string;
  approval_status: string;
  creation: string;
  expenses?: {
    expense_type: string;
    description: string;
    amount: number;
  }[];
}

export interface HRExpenseListResponse {
  message?: string;
  data?: HRExpenseClaim[];
}

export interface ExpenseClaimDetail extends HRExpenseClaim {
  description: string | null;
  department: string | null;
  company: string | null;
  expense_approver: string;
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

export const getPendingExpenses = async (): Promise<HRExpenseListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify([
    "name", "employee", "employee_name", "posting_date",
    "grand_total", "total_claimed_amount", "status",
    "approval_status", "creation", "expenses",
  ]));

  const filters = encodeURIComponent(JSON.stringify([
    ["status", "=", "Draft"],
    ["approval_status", "=", "Pending"],
  ]));
  const apiUrl = `${cleanUrl}/api/resource/Expense%20Claim?fields=${fields}&filters=${filters}&order_by=creation desc&limit_page_length=100`;

  try {
    console.log("[HRExpenseService] Fetching pending expenses");
    const response = await api.get<{ data: HRExpenseClaim[] }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return { data: response.data?.data || [] };
  } catch (error: any) {
    console.error("[HRExpenseService] Failed to fetch pending expenses:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch pending expenses");
  }
};

export const getExpenseClaimDetail = async (name: string): Promise<ExpenseClaimDetail | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify([
    "name", "employee", "employee_name", "posting_date",
    "grand_total", "total_claimed_amount", "status",
    "approval_status", "creation", "expenses",
    "description", "department", "company", "expense_approver",
  ]));

  const apiUrl = `${cleanUrl}/api/resource/Expense%20Claim/${encodeURIComponent(name)}?fields=${fields}`;

  try {
    console.log("[HRExpenseService] Fetching expense detail:", name);
    const response = await api.get<{ data: ExpenseClaimDetail }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return response.data?.data || null;
  } catch (error: any) {
    console.error("[HRExpenseService] Failed to fetch expense detail:", error);
    return null;
  }
};

export const approveExpense = async (name: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/frappe.client.set_value`;

  try {
    console.log("[HRExpenseService] Approving expense:", name);
    const response = await api.post<{ message: any }>(
      apiUrl,
      {
        doctype: "Expense Claim",
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
    console.log("[HRExpenseService] Expense approved:", response.data);
    return { message: "Approved" };
  } catch (error: any) {
    console.error("[HRExpenseService] Failed to approve expense:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to approve expense");
  }
};

export const rejectExpense = async (name: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/frappe.client.set_value`;

  try {
    console.log("[HRExpenseService] Rejecting expense:", name);
    const response = await api.post<{ message: any }>(
      apiUrl,
      {
        doctype: "Expense Claim",
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
    console.log("[HRExpenseService] Expense rejected:", response.data);
    return { message: "Rejected" };
  } catch (error: any) {
    console.error("[HRExpenseService] Failed to reject expense:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to reject expense");
  }
};
