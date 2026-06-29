import api from "./api";

// DUMMY MODE - Set to true to bypass API calls for development
const DUMMY_MODE = false;

// Get user credentials from localStorage
const getUserCredentials = (): { companyUrl: string; apiKey: string; apiSecret: string; employeeId: string } => {
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

// ============================================
// TYPES
// ============================================

export interface LoanProduct {
  name: string;
  is_term_loan: number;
  rate_of_interest: number;
  maximum_loan_amount: number;
}

export interface LoanApplicationItem {
  name: string;
  loan_product: string;
  loan_amount: number;
  status: string;
  posting_date: string;
  repayment_periods: number;
  repayment_amount: number;
}

export interface LoanItem {
  name: string;
  loan_product: string;
  loan_amount: number;
  disbursed_amount: number;
  status: string;
  total_payment: number;
  total_principal_paid: number;
  monthly_repayment_amount: number;
  loan_application: string;
}

export interface MyLoansResponse {
  applications: LoanApplicationItem[];
  loans: LoanItem[];
}

export interface LoanDetail {
  name: string;
  applicant: string;
  applicant_name: string | null;
  loan_product: string;
  loan_amount: number;
  status: string;
  rate_of_interest: number;
  is_term_loan: number;
  repayment_method: string;
  repayment_periods: number;
  monthly_repayment_amount: number;
  repayment_start_date: string | null;
  disbursement_date: string | null;
  disbursed_amount: number;
  total_payment: number;
  total_interest_payable: number;
  total_principal_paid: number;
  total_amount_paid: number;
  closure_date: string | null;
  days_past_due: number;
  is_npa: number;
  loan_application: string;
}

export interface RepaymentScheduleRow {
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  total_payment: number;
  balance_loan_amount: number;
  is_accrued: number;
}

// ============================================
// LOAN PRODUCTS API
// ============================================

export const getLoanProducts = async (): Promise<LoanProduct[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  console.log("[LoanService] Fetching loan products");

  if (DUMMY_MODE) {
    console.log("[LoanService] DUMMY MODE - Returning fake loan products");
    return [];
  }

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan.get_loan_products`;

  try {
    const response = await api.get<{ message: string; data: LoanProduct[] }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[LoanService] Loan products response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("[LoanService] Failed to fetch loan products:", error);

    const { message, status } = getMobileError(error);

    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }

    throw new Error(message || "Failed to fetch loan products");
  }
};

// ============================================
// MY LOANS API
// ============================================

export const getMyLoans = async (): Promise<MyLoansResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  console.log("[LoanService] Fetching my loans");

  if (DUMMY_MODE) {
    console.log("[LoanService] DUMMY MODE - Returning fake my loans");
    return { applications: [], loans: [] };
  }

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan.get_my_loans`;

  try {
    const response = await api.get<{ message: string; data: MyLoansResponse }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[LoanService] My loans response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("[LoanService] Failed to fetch my loans:", error);

    const { message, status } = getMobileError(error);

    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }

    throw new Error(message || "Failed to fetch my loans");
  }
};

// ============================================
// LOAN DETAIL API
// ============================================

export const getLoanDetail = async (loanName: string): Promise<LoanDetail> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  console.log("[LoanService] Fetching loan detail:", loanName);

  if (DUMMY_MODE) {
    console.log("[LoanService] DUMMY MODE - Returning fake loan detail");
    return {
      name: "",
      applicant: "",
      applicant_name: null,
      loan_product: "",
      loan_amount: 0,
      status: "",
      rate_of_interest: 0,
      is_term_loan: 0,
      repayment_method: "",
      repayment_periods: 0,
      monthly_repayment_amount: 0,
      repayment_start_date: null,
      disbursement_date: null,
      disbursed_amount: 0,
      total_payment: 0,
      total_interest_payable: 0,
      total_principal_paid: 0,
      total_amount_paid: 0,
      closure_date: null,
      days_past_due: 0,
      is_npa: 0,
      loan_application: "",
    };
  }

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan.get_loan_detail?loan=${encodeURIComponent(loanName)}`;

  try {
    const response = await api.get<{ message: string; data: LoanDetail }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[LoanService] Loan detail response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("[LoanService] Failed to fetch loan detail:", error);

    const { message, status } = getMobileError(error);

    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }

    throw new Error(message || "Failed to fetch loan detail");
  }
};

// ============================================
// REPAYMENT SCHEDULE API
// ============================================

export const getRepaymentSchedule = async (loanName: string): Promise<RepaymentScheduleRow[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  console.log("[LoanService] Fetching repayment schedule:", loanName);

  if (DUMMY_MODE) {
    console.log("[LoanService] DUMMY MODE - Returning fake repayment schedule");
    return [];
  }

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan.get_repayment_schedule?loan=${encodeURIComponent(loanName)}`;

  try {
    const response = await api.get<{ message: string; data: RepaymentScheduleRow[] }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[LoanService] Repayment schedule response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("[LoanService] Failed to fetch repayment schedule:", error);

    const { message, status } = getMobileError(error);

    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }

    throw new Error(message || "Failed to fetch repayment schedule");
  }
};

// ============================================
// APPLY LOAN API
// ============================================

export const applyLoan = async (payload: {
  loan_product: string;
  loan_amount: number;
  repayment_method: string;
  repayment_periods?: number;
  repayment_amount?: number;
  description?: string;
}): Promise<{ name: string; status: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  console.log("[LoanService] Applying for loan:", payload);

  if (DUMMY_MODE) {
    console.log("[LoanService] DUMMY MODE - Returning fake apply loan response");
    return { name: "ACC-LOAP-TEST-00001", status: "Open" };
  }

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan.apply_loan`;

  try {
    const response = await api.post<{ message: string; data: { name: string; status: string } }>(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[LoanService] Apply loan response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.error("[LoanService] Failed to apply loan:", error);

    const { message, status } = getMobileError(error);

    if (status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }

    throw new Error(message || "Failed to apply for loan");
  }
};
