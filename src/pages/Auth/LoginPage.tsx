import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useLanguage } from "../../i18n/LanguageContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const LoginPage = () => {
  const { login, loading: authLoading, error: authError } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [companyUrl, setCompanyUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-700 to-purple-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8"
      >
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
            ESS
          </div>
        </div>

        {/* Greeting */}
        <h1 className="text-center text-xl font-bold mb-1">
          {t("welcomeBack")}
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          {t("pleaseLogin")}
        </p>

        {/* Error Message */}
        {displayError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {displayError}
          </div>
        )}

        {/* Company URL */}
        <input
          type="url"
          placeholder={t("companyUrl")}
          value={companyUrl}
          onChange={(e) => setCompanyUrl(e.target.value)}
          className="w-full mb-3 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500"
          disabled={authLoading}
        />

        {/* User ID */}
        <input
          type="text"
          placeholder={t("employeeId")}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full mb-3 px-4 py-3 border rounded-xl"
          disabled={authLoading}
        />

        {/* Password */}
        <input
          type="password"
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-2 px-4 py-3 border rounded-xl"
          disabled={authLoading}
          onKeyPress={(e) => e.key === "Enter" && handleLogin()}
        />

        {/* Forgot password */}
        <div className="text-right mb-4">
          <button className="text-sm text-indigo-600 hover:underline disabled:opacity-50">
            {t("forgotPassword")}
          </button>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={authLoading}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-md active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
          <button className="text-indigo-600 font-medium hover:underline disabled:opacity-50">
            {t("createUser")}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
