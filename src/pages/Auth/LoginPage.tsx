import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const LoginPage = () => {
  const { login, loading: authLoading, error: authError } = useAuth();
  const { t } = useLanguage();
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
  const [localError, setLocalError] = useState("");

  // Check if light theme (for white text on certain elements)
  const isLightTheme = theme === "light";

  const handleLogin = async () => {
    // Validate inputs
    if (!companyUrl.trim()) {
      setLocalError("Please enter your company URL");
      return;
    }
    if (!userId.trim()) {
      setLocalError("Please enter your user ID");
      return;
    }
    if (!password.trim()) {
      setLocalError("Please enter your password");
      return;
    }

    // Clear errors
    setLocalError("");

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
      setLocalError(err.message);
    }
  };

  const displayError = localError || authError;

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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {displayError}
          </div>
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
            <div className="text-center mt-6 text-sm">
              {t("createAccount")}{" "}
              <button 
                onClick={handleCreateAccount}
                className="font-medium hover:underline disabled:opacity-50"
                style={{ color: isLightTheme ? "#ffffff" : themeColors.primary }}
              >
                {t("createUser")}
              </button>
            </div>
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
