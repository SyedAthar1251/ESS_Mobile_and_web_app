import api from "./api";
import { extractErrorMessage } from "./leave.service";

// ============================================
// TYPES
// ============================================

/** Single holiday row inside the "holidays" child table of a Holiday List DocType */
export interface HolidayItem {
  holiday_date: string;   // e.g. "2026-01-01"
  description: string;     // e.g. "New Year's Day"
  weekly_off: number;      // 0 or 1
  public_holiday?: number; // 0 or 1 (may be absent on some instalments)
}

export interface HolidayListDoc {
  name: string;
  holidays?: HolidayItem[];
}

export interface HolidayListSummary {
  name: string;
}

// ============================================
// CREDENTIAL HELPERS
// ============================================

const getUserCredentials = (): { companyUrl: string; apiKey: string; apiSecret: string } => {
  const savedUser = localStorage.getItem("ess_user");
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    if (userData.companyUrl && userData.apiKey && userData.apiSecret) {
      return { companyUrl: userData.companyUrl, apiKey: userData.apiKey, apiSecret: userData.apiSecret };
    }
  }
  throw new Error("Authentication credentials not found. Please login again.");
};

const getAuthHeader = (apiKey: string, apiSecret: string) => ({
  Authorization: `token ${apiKey}:${apiSecret}`,
});

// ============================================
// GET HOLIDAY LISTS
// ============================================
// GET /api/resource/Holiday List
// Returns all Holiday List DocType records (name only)

export const getHolidayLists = async (): Promise<HolidayListSummary[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  console.log("[HolidayService] Fetching holiday lists");

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/resource/Holiday%20List`;
  console.log("[HolidayService] Full API URL:", apiUrl);

  try {
    const response = await api.get<{ data: { name: string }[] }>(apiUrl, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });

    console.log("[HolidayService] getHolidayLists raw response.data:", response.data);
    // Frappe list API: response.data = { data: [...], message: ... }
    const rawData = (response.data as any).data;
    const list: { name: string }[] = Array.isArray(rawData) ? rawData : [];
    console.log("[HolidayService] getHolidayLists parsed list:", list);
    return list.map(r => ({ name: r.name }));
  } catch (error: any) {
    console.error("[HolidayService] Failed to fetch holiday lists:", error.message);
    if (error.response?.status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(extractErrorMessage(error));
  }
};

// ============================================
// GET HOLIDAY LIST DETAILS
// ============================================
// GET /api/resource/Holiday List/{name}
// Returns the full document including the "holidays" child table

export const getHolidayListDetails = async (name: string): Promise<HolidayListDoc> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  console.log("[HolidayService] Fetching holiday list details for:", name);

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/resource/Holiday%20List/${encodeURIComponent(name)}`;
  console.log("[HolidayService] Full API URL:", apiUrl);

  try {
    const response = await api.get<{ data: HolidayListDoc }>(apiUrl, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });

    console.log("[HolidayService] getHolidayListDetails raw response.data:", response.data);
    console.log("[HolidayService] getHolidayListDetails holidays inside data:", (response.data as any)?.data?.holidays);
    return (response.data as any).data;
  } catch (error: any) {
    console.error("[HolidayService] Failed to fetch holiday list details:", error.message);
    if (error.response?.status === 401) throw new Error("Authentication failed. Please login again.");
    if (error.response?.status === 404) throw new Error(`Holiday List "${name}" not found`);
    throw new Error(extractErrorMessage(error));
  }
};
