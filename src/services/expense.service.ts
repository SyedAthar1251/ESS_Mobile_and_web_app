import api from "./api";

// DUMMY MODE - Set to true to bypass API calls for development
const DUMMY_MODE = false;

// ============================================
// Types
// ============================================

export interface ExpenseType {
  name: string;
  expense_type: string;
  description: string;
}

export interface ExpenseClaim {
  name: string;
  employee: string;
  employee_name: string;
  expense_date: string;
  expense_type: string;
  description: string;
  amount: number;
  status: string;
  approval_status: string;
  posting_date: string;
  creation: string;
}

export interface ExpenseGroupedList {
  month_year: string;
  expenses: ExpenseClaim[];
}

// ============================================
// Helper Functions
// ============================================

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
  // Frappe expects: "token api_key:api_secret"
  return {
    Authorization: `token ${apiKey}:${apiSecret}`,
  };
};

// ============================================
// GET Expense Type
// ============================================

export const getExpenseType = async (): Promise<ExpenseType[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  
  console.log("[ExpenseService] Fetching expense types");

  if (DUMMY_MODE) {
    console.log("[ExpenseService] DUMMY MODE - Returning fake expense types");
    return [
      { name: "EXP-001", expense_type: "Travel", description: "Travel expenses" },
      { name: "EXP-002", expense_type: "Meals", description: "Meal expenses" },
      { name: "EXP-003", expense_type: "Accommodation", description: "Hotel stay" },
      { name: "EXP-004", expense_type: "Transportation", description: "Local transport" },
    ];
  }

  const apiUrl = `${companyUrl.replace(/\/$/, "")}/api/method/employee_self_service.mobile.ess.get_expense_type`;
  console.log("[ExpenseService] Full API URL:", apiUrl);

  try {
    const response = await api.get<ExpenseType[]>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[ExpenseService] Expense types response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[ExpenseService] Failed to fetch expense types:", error);
    throw new Error(error.response?.data?.exception || "Failed to fetch expense types");
  }
};

// ============================================
// GET Expense List
// ============================================

export const getExpenseList = async (): Promise<ExpenseGroupedList[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  
  console.log("[ExpenseService] Fetching expense list");

  if (DUMMY_MODE) {
    console.log("[ExpenseService] DUMMY MODE - Returning fake expense list");
    return [
      {
        month_year: "January 2024",
        expenses: [
          {
            name: "EXP-2024-001",
            employee: "TS-EMP-00001",
            employee_name: "John Doe",
            expense_date: "2024-01-15",
            expense_type: "Travel",
            description: "Client meeting travel",
            amount: 250.00,
            status: "Submitted",
            approval_status: "Approved",
            posting_date: "2024-01-16",
            creation: "2024-01-15",
          },
          {
            name: "EXP-2024-002",
            employee: "TS-EMP-00001",
            employee_name: "John Doe",
            expense_date: "2024-01-20",
            expense_type: "Meals",
            description: "Team lunch",
            amount: 85.50,
            status: "Submitted",
            approval_status: "Pending",
            posting_date: "2024-01-21",
            creation: "2024-01-20",
          },
        ],
      },
    ];
  }

  const apiUrl = `${companyUrl.replace(/\/$/, "")}/api/method/employee_self_service.mobile.ess.get_expense_list`;
  console.log("[ExpenseService] Full API URL:", apiUrl);

  try {
    const response = await api.get<ExpenseGroupedList[]>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[ExpenseService] Expense list response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[ExpenseService] Failed to fetch expense list:", error);
    throw new Error(error.response?.data?.exception || "Failed to fetch expense list");
  }
};
