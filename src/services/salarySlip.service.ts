import api from "./api";
import { extractErrorMessage } from "./leave.service";

export interface SalarySlipEarning {
  salary_component: string;
  amount: number;
}

export interface SalarySlipDeduction {
  salary_component: string;
  amount: number;
}

export interface SalarySlipExtraFields {
  department?: string;
  designation?: string;
  company?: string;
  branch?: string;
  posting_date?: string;
  payment_days?: number;
  leave_without_pay?: number;
  status?: string;
}

export interface SalarySlipDetails {
  name: string;
  employee: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  gross_pay: number;
  total_deduction: number;
  net_pay: number;
  earnings: SalarySlipEarning[];
  deductions: SalarySlipDeduction[];
  department?: string;
  designation?: string;
  company?: string;
  branch?: string;
  posting_date?: string;
  payment_days?: number;
  leave_without_pay?: number;
  status?: string;
}

export interface SalarySlipSummary {
  name: string;
  start_date: string;
}

export interface CompanyDetails {
  name: string;
  company_name: string;
  abbr?: string;
  country?: string;
  default_currency?: string;
  logo_as_square_url?: string;
  logo_as_url?: string;
  logo_web_url?: string;
  company_logo_url?: string;
  email?: string;
  phone_no?: string;
  company_logo_data?: string;
}

const getUserCredentials = (): {
  companyUrl: string;
  apiKey: string;
  apiSecret: string;
} => {
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

const getAuthHeader = (apiKey: string, apiSecret: string) => ({
  Authorization: `token ${apiKey}:${apiSecret}`,
});

const getBaseUrl = (): string => {
  const { companyUrl } = getUserCredentials();
  return companyUrl.replace(/\/$/, "");
};

const CACHE_KEY_COMPANY = "__ess_cache_company_details__";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedCompanyPayload {
  data: CompanyDetails;
  timestamp: number;
}

const readCompanyCache = (): CachedCompanyPayload | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY_COMPANY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
      return parsed as CachedCompanyPayload;
    }
    localStorage.removeItem(CACHE_KEY_COMPANY);
  } catch { /* stale or corrupt – ignore */ }
  return null;
};

export const getCompanyDetails = async (): Promise<CompanyDetails> => {
  const cached = readCompanyCache();
  if (cached?.data) {
    console.log("[Company] Using cached company details");
    return cached.data;
  }

  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  try {
    const listResponse = await api.get(
      `${cleanUrl}/api/resource/Company?fields=["name"]&limit_page_length=1`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    const companyList = Array.isArray((listResponse.data as any)?.data)
      ? (listResponse.data as any).data
      : [];

    if (companyList.length === 0) {
      throw new Error("No company found");
    }

    const companyName = companyList[0].name;

    const companyResponse = await api.get(
      `${cleanUrl}/api/resource/Company/${encodeURIComponent(companyName)}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    const company = (companyResponse.data as any)?.data;

    localStorage.setItem(
      CACHE_KEY_COMPANY,
      JSON.stringify({ data: company, timestamp: Date.now() })
    );

    return company;
  } catch (error: any) {
    console.error("[Company Fetch Error]", error);
    throw new Error(extractErrorMessage(error));
  }
};

export const getSalarySlips = async (): Promise<SalarySlipSummary[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/resource/Salary%20Slip?fields=["name","employee","employee_name","start_date","end_date","gross_pay","net_pay","status"]`;

  try {
    const response = await api.get(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    const list = Array.isArray((response.data as any)?.data)
      ? (response.data as any).data
      : [];

    return list as SalarySlipSummary[];
  } catch (error: any) {
    console.error("[Salary Service Error]", error);
    throw error;
  }
};

export const getSalarySlipDetails = async (name: string): Promise<SalarySlipDetails> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/resource/Salary%20Slip/${encodeURIComponent(name)}`;

  const response = await api.get(apiUrl, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(apiKey, apiSecret),
    },
  });

  return (response.data as any).data;
};

export const getSalarySlipPrintFormat = async (
  salarySlipName: string,
  language: string
): Promise<string | null> => {
  const { apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = getBaseUrl();
  const url = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_salary_slip_print_format`;

  console.log("[SalaryPrint] Salary:", salarySlipName);
  console.log("[SalaryPrint] Language:", language);

  try {
    const payload = new URLSearchParams();
    payload.append("salary_slip", salarySlipName);
    payload.append("language", language);

    const response = await api.post(url, payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    const printFormat = (response.data as any)?.message?.print_format || null;
    console.log("[SalaryPrint] Selected format:", printFormat);
    return printFormat;
  } catch (error: any) {
    console.error("[SalaryPrint] Failed to fetch print format:", error);
    return null;
  }
};

export const getSalarySlipPrintHtml = async (
  name: string,
  printFormat: string,
  language: string
): Promise<string | null> => {
  const { apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = getBaseUrl();

  const params = new URLSearchParams({
    doctype: "Salary Slip",
    name: name,
    format: printFormat,
    _lang: language,
    as_pdf: "0",
  });

  const apiUrl = `${cleanUrl}/printview?${params.toString()}`;

  console.log("[SalaryPrint] === Fetching Print HTML for Preview ===");
  console.log("[SalaryPrint] Printview URL:", apiUrl);

  try {
    const headers: Record<string, string> = {
      ...getAuthHeader(apiKey, apiSecret),
    };

    const { Capacitor } = await import("@capacitor/core");
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        console.error("[SalaryPrint] HTTP Error:", response.status, response.statusText);
        return null;
      }

      const html = await response.text();

      if (!html || html.length < 100) {
        console.warn("[SalaryPrint] Received very small/empty HTML from printview.");
        return null;
      }

      console.log("[SalaryPrint] Successfully fetched HTML preview. Length:", html.length);
      return html;
    } else {
      const response = await api.get(apiUrl, {
        headers,
        responseType: "text",
      });

      const html = response.data as string;

      if (!html || html.length < 100) {
        console.warn("[SalaryPrint] Received very small/empty HTML from printview.");
        return null;
      }

      console.log("[SalaryPrint] Successfully fetched HTML preview. Length:", html.length);
      return html;
    }
  } catch (error: any) {
    console.error("[SalaryPrint] Failed to fetch Print HTML:", error);
    return null;
  }
};

export const downloadSalarySlipPrintPdf = async (
  name: string,
  printFormat: string,
  language: string
): Promise<Blob | null> => {
  const { apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = getBaseUrl();
  const apiUrl = `${cleanUrl}/api/method/frappe.utils.print_format.download_pdf`;

  console.log("[SalaryPrint] === Downloading PDF via Print Format ===");
  console.log("[SalaryPrint] URL:", apiUrl);

  try {
    const payload = {
      doctype: "Salary Slip",
      name: name,
      format: printFormat,
      _lang: language,
    };

    console.log("[SalaryPrint] POST payload:", JSON.stringify(payload));

    const response = await api.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
      responseType: "blob",
    });

    const blob = response.data as Blob;
    console.log("[SalaryPrint] PDF blob received. Size:", blob.size, "bytes");
    return blob;
  } catch (error: any) {
    console.error("[SalaryPrint] Failed to download PDF via Print Format:", error);
    return null;
  }
};
