import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";

// Error type for categorized error handling
interface ErrorInfo {
  message: string;
  type: 'credentials' | 'employee' | 'network' | 'server' | 'validation';
}

// Parse error message and categorize it
const parseError = (errorMessage: string): ErrorInfo => {
  const lowerError = errorMessage.toLowerCase();
  
  // Check for employee-related errors
  if (
    lowerError.includes('employee') && 
    (lowerError.includes('not linked') || 
     lowerError.includes('not found') || 
     lowerError.includes('not associated') ||
     lowerError.includes('no employee') ||
     lowerError.includes('employee not found') ||
     lowerError.includes('employee not linked'))
  ) {
    return {
      message: errorMessage,
      type: 'employee'
    };
  }
  
  // Check for invalid credentials
  if (
    lowerError.includes('invalid') ||
    lowerError.includes('incorrect') ||
    lowerError.includes('wrong') ||
    lowerError.includes('failed') ||
    lowerError.includes('authentication') ||
    lowerError.includes('authorization') ||
    lowerError.includes('password') ||
    lowerError.includes('credential')
  ) {
    return {
      message: errorMessage,
      type: 'credentials'
    };
  }
  
  // Check for network errors
  if (
    lowerError.includes('timeout') ||
    lowerError.includes('network') ||
    lowerError.includes('connection') ||
    lowerError.includes('ECONNABORTED') ||
    lowerError.includes('fetch')
  ) {
    return {
      message: errorMessage,
      type: 'network'
    };
  }
  
  // Check for server errors
  if (
    lowerError.includes('500') ||
    lowerError.includes('502') ||
    lowerError.includes('503') ||
    lowerError.includes('504') ||
    lowerError.includes('server error') ||
    lowerError.includes('internal error')
  ) {
    return {
      message: errorMessage,
      type: 'server'
    };
  }
  
  // Default to validation/other
  return {
    message: errorMessage,
    type: 'validation'
  };
};

// Get user-friendly error message based on error type
const getUserFriendlyError = (errorInfo: ErrorInfo, t: (key: string) => string): string => {
  switch (errorInfo.type) {
    case 'credentials':
      return t('errorInvalidCredentials');
    case 'employee':
      return t('errorEmployeeNotLinked');
    case 'network':
      return t('errorNetwork');
    case 'server':
      return t('errorServer');
    default:
      return errorInfo.message;
  }
};

const LoginPage = () => {
  const { login, loading: authLoading, error: authError } = useAuth();
  const { t, language } = useLanguage();
  const { themeColors, theme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"url" | "qr">("url");
  const [companyUrl, setCompanyUrl] = useState(() => localStorage.getItem("ess_remember_company") || "");
  const [userId, setUserId] = useState(() => localStorage.getItem("ess_remember_user") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem("ess_remember_me");
    return saved === "true";
  });
  const [localError, setLocalError] = useState<ErrorInfo | null>(null);

  // Check if light theme (for white text on certain elements)
  const isLightTheme = theme === "light";

  const handleLogin = async () => {
    // Validate inputs
    if (!companyUrl.trim()) {
      setLocalError({
        message: t('errorCompanyUrlRequired'),
        type: 'validation'
      });
      return;
    }
    if (!userId.trim()) {
      setLocalError({
        message: t('errorUserIdRequired'),
        type: 'validation'
      });
      return;
    }
    if (!password.trim()) {
      setLocalError({
        message: t('errorPasswordRequired'),
        type: 'validation'
      });
      return;
    }

    // Clear errors
    setLocalError(null);

    // Handle Remember Me
    if (rememberMe) {
      localStorage.setItem("ess_remember_me", "true");
      localStorage.setItem("ess_remember_company", companyUrl);
      localStorage.setItem("ess_remember_user", userId);
    } else {
      localStorage.removeItem("ess_remember_me");
      localStorage.removeItem("ess_remember_company");
      localStorage.removeItem("ess_remember_user");
    }

    try {
      console.log("[LoginPage] Calling login API...");
      await login({ companyUrl, userId, password });
      console.log("[LoginPage] Login successful, redirecting to dashboard...");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.log("[LoginPage] Login failed:", err.message);
      // Parse and set the error with proper categorization
      const parsedError = parseError(err.message);
      setLocalError(parsedError);
    }
  };

  // Get display error - combine local and auth errors
  const getDisplayError = useCallback((): ErrorInfo | null => {
    if (localError) return localError;
    if (authError) return parseError(authError);
    return null;
  }, [localError, authError]);

  const displayError = getDisplayError();
  
  // Get error icon based on error type
  const getErrorIcon = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'credentials':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'employee':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'network':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        );
      case 'server':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
    }
  };
  
  // Get error styling based on error type
  const getErrorStyle = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'credentials':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'employee':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'network':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'server':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };
  
  // Get error icon styling based on error type
  const getErrorIconStyle = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'credentials':
        return 'text-red-500';
      case 'employee':
        return 'text-amber-500';
      case 'network':
        return 'text-blue-500';
      case 'server':
        return 'text-purple-500';
      default:
        return 'text-red-500';
    }
  };

  const handleCreateAccount = () => {
    // Open in mobile browser
    window.open("https://alphaxerp.com/", "_system");
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: theme === 'corporate-blue' 
          ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.primaryLight} 100%)`
          : `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl p-6 sm:p-8"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: theme === 'neon-green' 
            ? '0 0 40px rgba(0, 255, 136, 0.4), 0 0 80px rgba(0, 255, 136, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div 
            className="h-14 w-14 rounded-2xl text-white flex items-center justify-center font-bold text-xl shadow-lg"
            style={{ backgroundColor: themeColors.primary }}
          >
            ESS
          </div>
        </div>

        {/* Greeting */}
        <h1 className="text-center text-xl font-bold mb-1 text-white">
          {t("welcomeBack")}
        </h1>
        <p className="text-center text-white/80 mb-6 text-sm">
          {t("pleaseLogin")}
        </p>

        {/* Error Message */}
        {displayError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-xl px-4 py-3 mb-4 ${getErrorStyle(displayError.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-0.5 ${getErrorIconStyle(displayError.type)}`}>
                {getErrorIcon(displayError.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {getUserFriendlyError(displayError, t)}
                </p>
                {/* Show original error for employee and server errors for debugging (optional) */}
                {(displayError.type === 'employee' || displayError.type === 'server') && displayError.message !== getUserFriendlyError(displayError, t) && (
                  <p className="text-xs mt-1 opacity-75">
                    {displayError.message}
                  </p>
                )}
              </div>
              {/* Close button */}
              <button 
                onClick={() => setLocalError(null)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Help text for specific error types */}
            {displayError.type === 'credentials' && (
              <p className="text-xs mt-2 opacity-75">
                {t('errorCredentialsHelp')}
              </p>
            )}
            {displayError.type === 'employee' && (
              <p className="text-xs mt-2 opacity-75">
                {t('errorEmployeeHelp')}
              </p>
            )}
            {displayError.type === 'network' && (
              <p className="text-xs mt-2 opacity-75">
                {t('errorNetworkHelp')}
              </p>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex rounded-xl bg-white/20 p-1 mb-6">
          <button
            onClick={() => setActiveTab("url")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "url" 
                ? "bg-white text-gray-900 shadow-md" 
                : "text-white hover:bg-white/10"
            }`}
          >
            {t("loginWithUrl")}
          </button>
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === "qr" 
                ? "bg-white text-gray-900 shadow-md" 
                : "text-white hover:bg-white/10"
            }`}
          >
            {t("loginWithQr")}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "url" ? (
          <div>
            {/* Company URL */}
            <input
              type="url"
              placeholder={t("companyUrl")}
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              className="w-full mb-3 px-4 py-3 border rounded-xl bg-white/90 text-gray-900 placeholder-gray-500"
              disabled={authLoading}
            />

            {/* User ID */}
            <input
              type="text"
              placeholder={t("employeeId")}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full mb-3 px-4 py-3 border rounded-xl bg-white/90 text-gray-900 placeholder-gray-500"
              disabled={authLoading}
            />

            {/* Password */}
            <div className="relative mb-2">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("password")}
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                onKeyDown={(e: any) => e.key === "Enter" && handleLogin()}
                className="w-full px-4 py-3 pr-12 border rounded-xl bg-white/90 text-gray-900 placeholder-gray-500"
                disabled={authLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Remember Me & Forgot Password - Same Line */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label 
                  htmlFor="rememberMe" 
                  className={`ml-2 text-sm ${isLightTheme ? "text-white" : "text-gray-800"}`}
                >
                  Remember Me
                </label>
              </div>
              <button 
                className="text-sm hover:underline disabled:opacity-100"
                style={{ color: isLightTheme ? "#ffffff" : themeColors.primary }}
              >
                {t("forgotPassword")}
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="w-full py-3 text-white rounded-xl font-semibold shadow-md active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{ backgroundColor: themeColors.primary }}
            >
              {authLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t("loading")}
                </span>
              ) : (
                t("login")
              )}
            </button>

            {/* Create account */}
            {/* <div className="text-center mt-6 text-sm">
              {t("createAccount")}{" "}
              <button 
                onClick={handleCreateAccount}
                className="font-medium hover:underline disabled:opacity-50"
                style={{ color: isLightTheme ? "#ffffff" : themeColors.primary }}
              >
                {t("createUser")}
              </button>
            </div> */}
          </div>
        ) : (
          <div className="py-8">
            {/* QR Code Login Section */}
            <div className="text-center">
              <p className="text-white mb-4">Scan QR to Login</p>
              <div className="flex justify-center items-center gap-2">
                {/* Dummy QR Code */}
                <div className="w-40 h-40 bg-white rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center mx-auto">
                  <svg className="w-28 h-28 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m10 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
              </div>
              <span 
                className="inline-block mt-4 px-3 py-1 text-xs font-semibold text-white bg-amber-500 rounded-full"
              >
                Coming Soon
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPage;
