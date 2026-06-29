import api from "./api";

export interface HRLoanApplication {
  name: string;
  applicant: string;
  applicant_name: string;
  loan_product: string;
  loan_amount: number;
  posting_date: string;
  repayment_method: string;
  repayment_periods: number;
  repayment_amount: number;
  description: string | null;
  status: string;
}

export interface HRLoanItem {
  name: string;
  loan_product: string;
  loan_amount: number;
  disbursed_amount: number;
  status: string;
  monthly_repayment_amount: number;
  total_payment: number;
  total_principal_paid: number;
  loan_application: string;
}

export interface HRLoanListResponse {
  applications: HRLoanApplication[];
  loans: HRLoanItem[];
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

export const getPendingLoans = async (): Promise<HRLoanListResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan_admin.get_pending_loan_approvals`;

  try {
    console.log("[HRLoanService] Fetching loan applications");
    const response = await api.get<{ data: { applications: HRLoanApplication[]; loans: HRLoanItem[] } }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    console.log("[HRLoanService] Pending loans raw response:", response.data);
    const applications = response.data?.data?.applications || [];
    const loans = response.data?.data?.loans || [];
    return { applications, loans };
  } catch (error: any) {
    console.error("[HRLoanService] Failed to fetch pending loans:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(message || "Failed to fetch pending loans");
  }
};

