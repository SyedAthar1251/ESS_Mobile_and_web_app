import api from "./api";

// DUMMY MODE - Set to true to bypass API calls for development
const DUMMY_MODE = false;

// ============================================
// Types
// ============================================

export interface SalarySlip {
  name: string;
  employee: string;
  employee_name: string;
  company: string;
  posting_date: string;
  start_date: string;
  end_date: string;
  gross_pay: number;
  net_pay: number;
  status: string;
  creation: string;
}

export interface SalarySlipGrouped {
  month_year: string;
  salary_slips: SalarySlip[];
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
// GET Salary Slip List
// ============================================

export const getSalarySlipList = async (): Promise<SalarySlipGrouped[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  
  console.log("[SalaryService] Fetching salary slip list");

  if (DUMMY_MODE) {
    console.log("[SalaryService] DUMMY MODE - Returning fake salary slips");
    return [
      {
        month_year: "January 2024",
        salary_slips: [
          {
            name: "SAL-2024-00001",
            employee: "TS-EMP-00001",
            employee_name: "John Doe",
            company: "Test Company",
            posting_date: "2024-01-31",
            start_date: "2024-01-01",
            end_date: "2024-01-31",
            gross_pay: 15000.00,
            net_pay: 12000.00,
            status: "Paid",
            creation: "2024-01-31",
          },
        ],
      },
      {
        month_year: "December 2023",
        salary_slips: [
          {
            name: "SAL-2023-00012",
            employee: "TS-EMP-00001",
            employee_name: "John Doe",
            company: "Test Company",
            posting_date: "2023-12-31",
            start_date: "2023-12-01",
            end_date: "2023-12-31",
            gross_pay: 15000.00,
            net_pay: 12000.00,
            status: "Paid",
            creation: "2023-12-31",
          },
        ],
      },
    ];
  }

  const apiUrl = `${companyUrl.replace(/\/$/, "")}/api/method/employee_self_service.mobile.ess.get_salary_sllip`;
  console.log("[SalaryService] Full API URL:", apiUrl);

  try {
    const response = await api.get<SalarySlipGrouped[]>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    console.log("[SalaryService] Salary slip list response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[SalaryService] Failed to fetch salary slip list:", error);
    throw new Error(error.response?.data?.exception || "Failed to fetch salary slip list");
  }
};

// ============================================
// Download Salary Slip PDF
// ============================================

export const downloadSalarySlip = async (ssId: string): Promise<Blob> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  
  console.log("[SalaryService] Downloading salary slip:", ssId);

  const apiUrl = `${companyUrl.replace(/\/$/, "")}/api/method/employee_self_service.mobile.ess.download_salary_slip?ss_id=${ssId}`;
  console.log("[SalaryService] Full API URL:", apiUrl);

  try {
    const response = await api.get<Blob>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
      responseType: "blob",
    });

    console.log("[SalaryService] Salary slip download response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("[SalaryService] Failed to download salary slip:", error);
    throw new Error(error.response?.data?.exception || "Failed to download salary slip");
  }
};
