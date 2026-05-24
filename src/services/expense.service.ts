import api from "./api";

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

export const getUserCredentials = (): { companyUrl: string; apiKey: string; apiSecret: string; employeeId: string } => {
  const savedUser = localStorage.getItem("ess_user");
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    if (userData.companyUrl && userData.apiKey && userData.apiSecret) {
      return {
        companyUrl: userData.companyUrl,
        apiKey: userData.apiKey,
        apiSecret: userData.apiSecret,
        employeeId: userData.employeeId || userData.employee || "",
      };
    }
  }
  throw new Error("Authentication credentials not found. Please login again.");
};

export const getAuthHeader = (apiKey: string, apiSecret: string) => {
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

  console.log("[ExpenseService] Fetching expense types from Frappe Expense Claim Type");

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const fields = ["name", "expense_type", "description"];
  const apiUrl = `${cleanUrl}/api/resource/Expense%20Claim%20Type?fields=${encodeURIComponent(JSON.stringify(fields))}&limit_page_length=1000`;

  console.log("[ExpenseService] Full API URL:", apiUrl);

  try {
    const response = await api.get(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[ExpenseService] Expense types response:", response.data);

    const raw = response.data as any;
    const list = Array.isArray(raw?.data) ? raw.data : [];

    return list.map((item: any) => ({
      name: item.name || "",
      expense_type: item.expense_type || item.name || "",
      description: item.description || "",
    }));
  } catch (error: any) {
    console.error("[ExpenseService] Failed to fetch expense types from Frappe:", error);
    throw new Error(error.response?.data?.exception || error.message || "Failed to fetch expense types");
  }
};

// ============================================
// GET Expense List
// ============================================

export const getExpenseList = async (): Promise<ExpenseGroupedList[]> => {
  const { companyUrl, apiKey, apiSecret, employeeId } = getUserCredentials();

  console.log("[ExpenseService] Fetching expense claims directly from Frappe Expense Claim");

  const cleanUrl = companyUrl.replace(/\/$/, "");

  // Build direct Frappe resource API URL for Expense Claim
  const fields = [
    "name",
    "employee",
    "employee_name",
    "posting_date",
    "approval_status",
    "total_claimed_amount",
    "grand_total",
    "status",
    "creation",
    "expenses" // include child table for expense lines (type, description, amount)
  ];

  let apiUrl = `${cleanUrl}/api/resource/Expense%20Claim?fields=${encodeURIComponent(JSON.stringify(fields))}&order_by=creation desc&limit_page_length=1000`;

  if (employeeId) {
    const filter = [["employee", "=", employeeId]];
    apiUrl += `&filters=${encodeURIComponent(JSON.stringify(filter))}`;
  }

  console.log("[ExpenseService] Full API URL:", apiUrl);

  try {
    const response = await api.get(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[ExpenseService] Expense claims response from Frappe:", response.data);

    const raw = response.data as any;
    const claims = Array.isArray(raw?.data) ? raw.data : [];

    // Flatten child table "expenses" into individual ExpenseClaim records for UI compatibility
    const flatExpenses: ExpenseClaim[] = [];

    claims.forEach((claim: any) => {
      const lines = Array.isArray(claim.expenses) ? claim.expenses : [];

      if (lines.length > 0) {
        lines.forEach((line: any) => {
          flatExpenses.push({
            name: claim.name || "",
            employee: claim.employee || "",
            employee_name: claim.employee_name || "",
            expense_date: claim.posting_date || (claim.creation ? claim.creation.split(" ")[0] : ""),
            expense_type: line.expense_type || "General",
            description: line.description || line.expense_description || "",
            amount: Number(line.amount || line.claimed_amount || 0),
            status: claim.status || "",
            approval_status: claim.approval_status || "",
            posting_date: claim.posting_date || "",
            creation: claim.creation || "",
          });
        });
      } else {
        // Fallback: treat the whole claim as one entry (no child lines)
        flatExpenses.push({
          name: claim.name || "",
          employee: claim.employee || "",
          employee_name: claim.employee_name || "",
          expense_date: claim.posting_date || (claim.creation ? claim.creation.split(" ")[0] : ""),
          expense_type: "Expense Claim",
          description: "",
          amount: Number(claim.grand_total || claim.total_claimed_amount || 0),
          status: claim.status || "",
          approval_status: claim.approval_status || "",
          posting_date: claim.posting_date || "",
          creation: claim.creation || "",
        });
      }
    });

    // Group by month/year using expense_date (for UI grouped list)
    const groupsMap: Record<string, ExpenseClaim[]> = {};

    flatExpenses.forEach((exp) => {
      const dateStr = exp.expense_date || exp.posting_date || exp.creation || "";
      let monthYear = "Unknown";
      if (dateStr) {
        try {
          const d = new Date(dateStr.split(" ")[0]);
          monthYear = d.toLocaleString("en-US", { month: "long", year: "numeric" });
        } catch {
          monthYear = "Unknown";
        }
      }
      if (!groupsMap[monthYear]) groupsMap[monthYear] = [];
      groupsMap[monthYear].push(exp);
    });

    // Convert to array and sort groups by newest first (using first item's creation)
    const grouped: ExpenseGroupedList[] = Object.entries(groupsMap)
      .map(([month_year, expenses]) => ({ month_year, expenses }))
      .sort((a, b) => {
        const getTime = (g: ExpenseGroupedList) => {
          const dStr = g.expenses[0]?.creation || g.expenses[0]?.expense_date || "";
          return new Date(dStr).getTime() || 0;
        };
        return getTime(b) - getTime(a);
      });

    console.log("[ExpenseService] Grouped expenses by month:", grouped.map(g => g.month_year));

    return grouped;
  } catch (error: any) {
    console.error("[ExpenseService] Failed to fetch expense claims from Frappe:", error);
    throw new Error(error.response?.data?.exception || error.message || "Failed to fetch expense claims");
  }
};
