import api from "./api";
import { getUserCredentials, getAuthHeader } from "./leave.service";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Company {
  name: string;
  company_name: string;
}

export interface PrintFormat {
  name: string;
  disabled: number;
}

export interface CompanyPrintSetting {
  company: string;
  salary_slip_print_format: string;
}

// ── API base helper ────────────────────────────────────────────────────────

const getBaseUrl = (): string => {
  const { companyUrl } = getUserCredentials();
  return companyUrl.replace(/\/$/, "");
};

// ── Service Methods ────────────────────────────────────────────────────────

export const getCompanies = async (): Promise<Company[]> => {
  const { apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = getBaseUrl();

  const url = `${cleanUrl}/api/resource/Company?fields=["name","company_name"]&limit_page_length=100`;

  console.log("[PrintFormatService] Fetching companies...");

  try {
    const response = await api.get(url, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    const data = Array.isArray((response.data as any)?.data)
      ? (response.data as any).data
      : [];

    console.log("[PrintFormatService] Companies fetched:", data.length);
    return data;
  } catch (error: any) {
    console.error("[PrintFormatService] Failed to fetch companies:", error);
    return [];
  }
};

export const getPrintFormats = async (): Promise<PrintFormat[]> => {
  const { apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = getBaseUrl();

  const url = `${cleanUrl}/api/method/frappe.client.get_list`;

  console.log("[PrintFormatService] Fetching print formats...");

  try {
    const response = await api.post(
      url,
      {
        doctype: "Print Format",
        filters: [["doc_type", "=", "Salary Slip"]],
        fields: ["name", "disabled"],
        limit_page_length: 100,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    const data = Array.isArray((response.data as any)?.message)
      ? (response.data as any).message
      : [];

    console.log("[PrintFormatService] Print formats fetched:", data.length);
    return data;
  } catch (error: any) {
    console.error("[PrintFormatService] Failed to fetch print formats:", error);
    return [];
  }
};

export const getCompanyPrintSetting = async (
  company: string
): Promise<CompanyPrintSetting | null> => {
  const { apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = getBaseUrl();

  const url = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_company_print_setting`;

  console.log("[PrintFormatService] Fetching setting for company:", company);

  try {
    const response = await api.post(
      url,
      { company },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    const data = (response.data as any)?.message;
    console.log("[PrintFormatService] Company setting fetched:", data);
    return data || null;
  } catch (error: any) {
    console.error("[PrintFormatService] No setting found for company:", company);
    return null;
  }
};

export const saveCompanyPrintSetting = async (data: {
  company: string;
  salary_slip_print_format: string;
}): Promise<{ success: boolean; message: string }> => {
  const { apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = getBaseUrl();

  const url = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.save_company_print_setting`;

  console.log("[PrintFormatService] Saving print setting:", data);

  try {
    const response = await api.post(
      url,
      {
        company: data.company,
        salary_slip_print_format: data.salary_slip_print_format,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    const result = (response.data as any)?.message;
    console.log("[PrintFormatService] Save result:", result);
    return { success: true, message: result || "Saved successfully" };
  } catch (error: any) {
    console.error("[PrintFormatService] Failed to save setting:", error);
    const errorMsg =
      error?.response?.data?.exception ||
      error?.response?.data?.error ||
      "Failed to save setting";
    return { success: false, message: errorMsg };
  }
};
