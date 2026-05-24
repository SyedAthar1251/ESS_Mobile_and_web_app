import api from "./api";
import { extractErrorMessage } from "./leave.service";

// ============================================
// TYPES
// ============================================

/** Single earning row inside an earnings child table */
export interface SalarySlipEarning {
  salary_component: string;
  amount: number;
}

/** Single deduction row inside a deductions child table */
export interface SalarySlipDeduction {
  salary_component: string;
  amount: number;
}

/** Optional employee / company fields that may or may not be present in the Frappe response */
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

/** Full salary slip detail returned by
 * /api/resource/Salary Slip/{name}
 * Includes extra optional fields so the screen only needs a single API call. */
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

  /** Optional — present when the salary slip docType carries these fields */
  department?: string;
  designation?: string;
  company?: string;
  branch?: string;
  posting_date?: string;
  payment_days?: number;
  leave_without_pay?: number;
  status?: string;
}

/** Summary row used in the Salary Slip list dropdown */
export interface SalarySlipSummary {
  name: string;
  start_date: string;
}

/** Company document returned by
 *  GET /api/resource/Company/{name}
 *  when embedded=true  →  key=value pairs  (default doc UN-wrapped)
 *  when embedded=false →  list wrapper      (not used here) */
export interface CompanyDetails {
  name: string;
  company_name: string;
  abbr?: string;
  country?: string;
  default_currency?: string;
  logo_as_square_url?: string;
  logo_as_url?: string;
  logo_web_url?: string;
  company_logo_url?: string;   // ERPNext uses this key
  email?: string;
  phone_no?: string;
  company_logo_data?: string; // data:image/… data-uri
}

// ============================================
// CREDENTIAL HELPERS
// ============================================

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

// ============================================
// UNWRAP FRAPPE RESPONSE
// ============================================
//
// Frappe Resource docs embedded=true return:
//   { message: { key: value, ... } }
// Frappe Resource list calls return:
//   { data: { data: [...], ... } }
// Frappe Resource single call returns:
//   { data: { data: { key: value, ... } } }
//
// Helper unwraps to the innermost object/array so callers never need to
// remember how many layers deep the payload is.

const unwrap = <T>(resp: any): T => {
  // single embedded doc
  if (resp?.data && !Array.isArray(resp.data) && typeof resp.data === "object") {
    return resp.data as T;
  };
  // list wrapper
  if (resp?.data?.data) {
    return resp.data.data as T;
  }
  // plain payload
  return resp?.data as T ?? ({} as T);
};

// ============================================
// CACHE CONSTANTS
// ============================================

const CACHE_KEY_COMPANY = "__ess_cache_company_details__";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

interface CachedCompanyPayload {
  data: CompanyDetails;
  timestamp: number;
}

// ============================================
// GET COMPANY DETAILS  (cache-first, fetch-once)
// ============================================

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

/**
 * Fetch company details from the ERP.
 *
 * Strategy:
 *  1. Check localStorage cache (24 h TTL). Return immediately if fresh.
 *  2. Try `GET /api/resource/Company` to recover the tenant name.
 *  3. Fall back to `GET /api/resource/Company/{companyName}`.
 *  4. Cache the good response in localStorage for subsequent calls.
 */
export const getCompanyDetails = async (): Promise<CompanyDetails> => {

  // ==========================
  // CACHE CHECK
  // ==========================

  const cached = readCompanyCache();

  if (cached?.data) {
    console.log("[Company] Using cached company details");
    return cached.data;
  }

  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  const cleanUrl = companyUrl.replace(/\/$/, "");

  try {

    // ==========================
    // STEP 1
    // GET COMPANY LIST
    // ==========================

    const listResponse = await api.get(
      `${cleanUrl}/api/resource/Company?fields=["name"]&limit_page_length=1`,
      {
        headers: {
          "Content-Type":"application/json",
          ...getAuthHeader(apiKey, apiSecret)
        }
      }
    );

    console.log(
      "[Company List Response]",
      listResponse.data
    );

    const companyList =
      Array.isArray(
        (listResponse.data as any)?.data
      )
      ? (listResponse.data as any).data
      : [];

    if(companyList.length===0){
      throw new Error("No company found");
    }

    const companyName =
      companyList[0].name;

    console.log(
      "[Company Name]",
      companyName
    );

    // ==========================
    // STEP 2
    // FETCH COMPANY DOC
    // ==========================

    const companyResponse =
      await api.get(
        `${cleanUrl}/api/resource/Company/${encodeURIComponent(companyName)}`,
        {
          headers:{
            "Content-Type":"application/json",
            ...getAuthHeader(apiKey,apiSecret)
          }
        }
      );

    console.log(
      "[Company Details]",
      companyResponse.data
    );

    const company =
      (companyResponse.data as any)?.data;

    localStorage.setItem(
      CACHE_KEY_COMPANY,
      JSON.stringify({
        data: company,
        timestamp: Date.now()
      })
    );

    return company;

  } catch(error:any){

    console.error(
      "[Company Fetch Error]",
      error
    );

    throw new Error(
      extractErrorMessage(error)
    );
  }
};

// ============================================
// GET SALARY SLIP LIST
// ============================================
// GET /api/resource/Salary Slip
// Returns all salary slip records

export const getSalarySlips = async (): Promise<SalarySlipSummary[]> => {

  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  const cleanUrl = companyUrl.replace(/\/$/, "");

  const apiUrl =
    `${cleanUrl}/api/resource/Salary%20Slip?fields=["name","employee","employee_name","start_date","end_date","gross_pay","net_pay","status"]`;

  console.log(
    "[Salary Service] API URL:",
    apiUrl
  );

  try {

    const response =
      await api.get(apiUrl,{
        headers:{
          "Content-Type":"application/json",
          ...getAuthHeader(apiKey, apiSecret)
        }
      });

    console.log(
      "[Salary Service] Raw response:",
      response.data
    );

    const list =
      Array.isArray(
        (response.data as any)?.data
      )
      ? (response.data as any).data
      : [];

    console.log(
      "[Salary Service] Parsed list:",
      list
    );

    return list as SalarySlipSummary[];

  } catch(error:any){

    console.error(
      "[Salary Service Error]",
      error
    );

    throw error;
  }
};

// ============================================
// GET SALARY SLIP DETAILS
// ============================================
// GET /api/resource/Salary Slip/{name}
// Returns the full salary slip document

export const getSalarySlipDetails =
async(name:string):Promise<SalarySlipDetails>=>{

  const {
    companyUrl,
    apiKey,
    apiSecret
  } = getUserCredentials();

  const cleanUrl =
    companyUrl.replace(/\/$/,"");

  const apiUrl=
    `${cleanUrl}/api/resource/Salary%20Slip/${encodeURIComponent(name)}`;

  console.log(
    "[Salary Details URL]",
    apiUrl
  );

  const response=
    await api.get(apiUrl,{
      headers:{
        "Content-Type":"application/json",
        ...getAuthHeader(apiKey, apiSecret)
      }
    });

  console.log(
    "[Salary Details]",
    response.data
  );

  return (response.data as any).data;
};
