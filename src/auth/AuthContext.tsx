import { createContext, useEffect, useState, useCallback } from "react";
import { LoginCredentials, LoginResponse, login as loginApi, logout as logoutApi } from "../services/auth.service";
import { getUserRoles, hasAdminManagerRole } from "../services/userRole.service";
import { getEmployeeProfile, EmployeeProfile } from "../services/employee.service";
import { checkESSAdminUser } from "../services/admin.service";
import { useNotificationStore } from "../store/notificationStore";
import { registerForPushNotifications } from "../services/push.service";
import { requestLocationPermissions } from "../services/location.service";

type AuthContextType = {
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isCompanyAdmin: boolean;
  user: {
    userId: string;
    fullName: string;
    employeeId: string;
    companyUrl: string;
    apiKey?: string;
    apiSecret?: string;
    userType?: string;
    roles?: string[];
    isCompanyAdmin?: boolean;
  } | null;
  employee: EmployeeProfile | null;
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
    userType?: string;
    roles?: string[];
    isCompanyAdmin?: boolean;
  } | null>(null);

  const [isCompanyAdmin, setIsCompanyAdmin] = useState<boolean>(false);

  const [employee, setEmployee] = useState<EmployeeProfile | null>(() => {
    const saved = localStorage.getItem("ess_employee");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const startPolling = useNotificationStore((s) => s.startPolling);
  const clearAll = useNotificationStore((s) => s.clearAll);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("ess_user");
    const savedAuthenticated = localStorage.getItem("ess_logged_in");
    
    if (savedUser && savedAuthenticated === "true") {
      const userData = JSON.parse(savedUser);
      console.log("[AuthContext] Found existing session for:", userData.userId);
      setUser(userData);
      setIsAuthenticated(true);
      // Try to refresh roles if not present
      if (!userData.roles || userData.roles.length === 0) {
        getUserRoles().then((roles) => {
          if (roles.length > 0) {
            const updatedUser = { ...userData, roles };
            localStorage.setItem("ess_user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            console.log("[AuthContext] Refreshed user roles:", roles);
          }
        }).catch(() => {});
      }
      // Refresh employee data if not already in memory
      if (!employee && userData.employeeId) {
        fetchAndStoreEmployee(userData.employeeId);
      }
      // Restore notification polling for existing session
      startPolling();
      fetchNotifications();
      registerForPushNotifications();
      requestLocationPermissions();
    } else {
      console.log("[AuthContext] No existing session found");
    }
    
    setLoading(false);
  }, []);

  const fetchAndStoreEmployee = useCallback(async (employeeId: string) => {
    if (!employeeId) return;
    try {
      const profile = await getEmployeeProfile(employeeId);
      if (profile) {
        setEmployee(profile);
        localStorage.setItem("ess_employee", JSON.stringify(profile));
        console.log("[AuthContext] Employee data loaded:", profile.employeeName);
      }
    } catch (err) {
      console.log("[AuthContext] Employee fetch failed:", err);
    }
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
          userType: response.user_type || "employee",
        };

        // Store user data
        localStorage.setItem("ess_user", JSON.stringify(userData));
        localStorage.setItem("ess_logged_in", "true");

        setUser(userData);
        setIsAuthenticated(true);
        console.log("[AuthContext] Login successful for user:", userData.userId);

        // Fetch user roles for HR dashboard access
        try {
          const roles = await getUserRoles();
          let updatedUser = { ...userData, roles, isCompanyAdmin: false };
          
          // Check ESS Admin User doctype if user has ESS Admin Manager role
          if (hasAdminManagerRole(roles)) {
            try {
              const adminCheck = await checkESSAdminUser(userData.userId);
              const isAdmin = adminCheck.success === true && adminCheck.data?.role === "Company Admin";
              updatedUser.isCompanyAdmin = isAdmin;
              setIsCompanyAdmin(isAdmin);
              console.log("[AuthContext] ESS Admin User check:", isAdmin, adminCheck.data);
            } catch (adminErr) {
              console.log("[AuthContext] ESS Admin User check failed:", adminErr);
              updatedUser.isCompanyAdmin = false;
              setIsCompanyAdmin(false);
            }
          } else {
            updatedUser.isCompanyAdmin = false;
            setIsCompanyAdmin(false);
          }
          
          if (roles.length > 0) {
            localStorage.setItem("ess_user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            console.log("[AuthContext] Roles fetched:", roles);
          }
        } catch (roleErr) {
          console.log("[AuthContext] Role fetch failed, continuing without roles:", roleErr);
        }

        // Fetch employee profile
        if (userData.employeeId) {
          await fetchAndStoreEmployee(userData.employeeId);
        }

        // Fetch notifications and start polling
        await fetchNotifications();
        startPolling();
        registerForPushNotifications();
        requestLocationPermissions();
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
    localStorage.removeItem("ess_employee");

    setUser(null);
    setEmployee(null);
    setIsAuthenticated(false);
    setIsCompanyAdmin(false);
    setError(null);

    // Clear notifications and stop polling
    clearAll();
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
        user: null,
        employee: null,
        isCompanyAdmin: false
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
      user,
      employee,
      isCompanyAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
};
