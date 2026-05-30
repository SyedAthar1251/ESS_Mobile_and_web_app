import api from "./api";
import { getUserCredentials, getAuthHeader } from "./leave.service";

export interface EssAdminDetails {
  is_admin: boolean;
  admin_id?: string;
  role?: string;
  email?: string;
  full_name?: string;
}

/**
 * Checks if the currently logged-in user is an ESS Admin.
 * This calls the backend whitelisted method get_ess_admin_details.
 */
export const checkIfUserIsEssAdmin = async (): Promise<EssAdminDetails> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_ess_admin_details`;

  console.log("[AdminService] Checking if user is ESS Admin...");
  console.log("[AdminService] API URL:", apiUrl);

  try {
    const response = await api.post(
      apiUrl,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    const data = (response.data as any)?.message || { is_admin: false };
    console.log("[AdminService] Admin check result:", data);

    return {
      is_admin: data.is_admin || false,
      admin_id: data.admin_id,
      role: data.role,
      email: data.email,
      full_name: data.full_name,
    };
  } catch (error: any) {
    console.error("[AdminService] Failed to check admin status:", error);
    return { is_admin: false };
  }
};
