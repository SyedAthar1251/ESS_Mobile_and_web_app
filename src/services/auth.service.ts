import { createContext, useEffect, useState, useCallback } from "react";
import api from "./api";

// Login credentials type
export interface LoginCredentials {
  companyUrl: string;
  userId: string;
  password: string;
}

// Login response type - updated to match actual Frappe response
export interface LoginResponse {
  message?: string;
  home_page?: string;
  full_name?: string;
  user?: string;
  employee_id?: string;
  key_details?: {
    api_key: string;
    api_secret: string;
  };
  exception?: string;
  error?: string;
}

// Get API URL
const getApiUrl = (companyUrl: string): string => {
  const cleanUrl = companyUrl.replace(/\/$/, "");
  return `${cleanUrl}/api/method/employee_self_service.mobile.ess.login`;
};

// DUMMY MODE - Set to true to bypass login for development
const DUMMY_MODE = false;

// Login function
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const { companyUrl, userId, password } = credentials;
  
  console.log("[AuthService] Login attempt for user:", userId);
  console.log("[AuthService] Company URL:", companyUrl);
  
  // DUMMY MODE - Return fake success for development
  if (DUMMY_MODE) {
    console.log("[AuthService] DUMMY MODE - Returning fake login success");
    return {
      message: "Logged In",
      home_page: "/apps",
      full_name: "Test User",
      user: userId,
      employee_id: "TS-EMP-00005",
      key_details: {
        api_key: "dummy_api_key_12345",
        api_secret: "dummy_api_secret_67890",
      },
    };
  }
  
  const apiUrl = getApiUrl(companyUrl);
  console.log("[AuthService] Full API URL:", apiUrl);
  
  try {
    const response = await api.post<LoginResponse>(
      apiUrl,
      {
        usr: userId,
        pwd: password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    
    console.log("[AuthService] Login successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.log("[AuthService] Login error details:", {
      status: error.response?.status,
      message: error.response?.data?.exception || error.response?.data?.error || error.message,
      fullError: error.response?.data,
    });
    
    if (error.response?.data?.exception) {
      throw new Error(error.response.data.exception);
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.response?.status === 401) {
      throw new Error("Invalid credentials. Please check your user ID and password.");
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Request timed out. Please try again.");
    } else {
      throw new Error("Login failed. Please try again.");
    }
  }
};

// Logout function
export const logout = async (companyUrl: string, sid: string): Promise<void> => {
  console.log("[AuthService] Logging out...");
  
  // DUMMY MODE - Skip actual logout
  if (DUMMY_MODE) {
    console.log("[AuthService] DUMMY MODE - Skipping actual logout");
    return;
  }
  
  try {
    const cleanUrl = companyUrl.replace(/\/$/, "");
    await api.post(
      `${cleanUrl}/api/method/logout`,
      {},
      {
        headers: {
          Cookie: `sid=${sid}`,
        },
      }
    );
    console.log("[AuthService] Logout successful");
  } catch (error) {
    console.log("[AuthService] Logout API call failed, but clearing local data anyway");
  }
};

// Change Password function
export interface ChangePasswordCredentials {
  companyUrl: string;
  currentPassword: string;
  newPassword: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface ChangePasswordResponse {
  message?: string;
  exception?: string;
  error?: string;
}

export const changePassword = async (credentials: ChangePasswordCredentials): Promise<ChangePasswordResponse> => {
  const { companyUrl, currentPassword, newPassword, apiKey, apiSecret } = credentials;
  
  console.log("[AuthService] Change password attempt");
  
  // DUMMY MODE - Return fake success for development
  if (DUMMY_MODE) {
    console.log("[AuthService] DUMMY MODE - Returning fake change password success");
    return {
      message: "Password changed successfully",
    };
  }
  
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.change_password`;
  console.log("[AuthService] Full API URL:", apiUrl);
  
  try {
    const response = await api.post<ChangePasswordResponse>(
      apiUrl,
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `token ${apiKey}:${apiSecret}`,
        },
        timeout: 30000,
      }
    );
    
    console.log("[AuthService] Change password successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.log("[AuthService] Change password error details:", {
      status: error.response?.status,
      message: error.response?.data?.exception || error.response?.data?.error || error.message,
      fullError: error.response?.data,
    });
    
    if (error.response?.data?.exception) {
      throw new Error(error.response.data.exception);
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.response?.status === 401) {
      throw new Error("Invalid current password. Please check and try again.");
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Request timed out. Please try again.");
    } else {
      throw new Error("Failed to change password. Please try again.");
    }
  }
};
