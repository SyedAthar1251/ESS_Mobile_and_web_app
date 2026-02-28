import { createContext, useEffect, useState, useCallback } from "react";
import { LoginCredentials, LoginResponse, login as loginApi, logout as logoutApi } from "../services/auth.service";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  user: {
    userId: string;
    fullName: string;
    employeeId: string;
    companyUrl: string;
    apiKey?: string;
    apiSecret?: string;
  } | null;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{
    userId: string;
    fullName: string;
    employeeId: string;
    companyUrl: string;
    apiKey?: string;
    apiSecret?: string;
  } | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("ess_user");
    const savedAuthenticated = localStorage.getItem("ess_logged_in");
    
    if (savedUser && savedAuthenticated === "true") {
      const userData = JSON.parse(savedUser);
      console.log("[AuthContext] Found existing session for:", userData.userId);
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      console.log("[AuthContext] No existing session found");
    }
    
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    console.log("[AuthContext] Starting login process...");
    setLoading(true);
    setError(null);

    try {
      const response = await loginApi(credentials);
      console.log("[AuthContext] Login API response:", response);

      // Check if login was successful - Frappe returns message: "Logged In" or "No App" (success but no app access)
      if (response.message === "Logged In" || response.message === "No App" || response.home_page) {
        // Login successful
        const userData = {
          userId: response.user || credentials.userId,
          fullName: response.full_name || "",
          employeeId: response.employee_id || "",
          companyUrl: credentials.companyUrl,
          apiKey: response.key_details?.api_key || "",
          apiSecret: response.key_details?.api_secret || "",
        };

        // Store user data
        localStorage.setItem("ess_user", JSON.stringify(userData));
        localStorage.setItem("ess_logged_in", "true");

        setUser(userData);
        setIsAuthenticated(true);
        console.log("[AuthContext] Login successful for user:", userData.userId);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.log("[AuthContext] Login failed:", err.message);
      setError(err.message);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log("[AuthContext] Starting logout process...");
    
    // Get company URL for logout call
    const savedUser = localStorage.getItem("ess_user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      try {
        await logoutApi(userData.companyUrl, "");
      } catch (err) {
        console.log("[AuthContext] Logout API call failed, but continuing with local logout");
      }
    }

    // Clear local storage
    localStorage.removeItem("ess_user");
    localStorage.removeItem("ess_logged_in");

    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    console.log("[AuthContext] Logout complete");
  }, []);

  // Show loading while checking session
  if (loading) {
    return (
      <AuthContext.Provider value={{ 
        isAuthenticated: false, 
        login, 
        logout, 
        loading: true,
        error: null,
        user: null 
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      loading: false,
      error,
      user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
