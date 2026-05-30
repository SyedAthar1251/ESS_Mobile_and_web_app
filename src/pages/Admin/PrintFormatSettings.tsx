import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import SettingCard from "./components/SettingCard";
import {
  getCompanies,
  getPrintFormats,
  getCompanyPrintSetting,
  saveCompanyPrintSetting,
  Company,
  PrintFormat,
  CompanyPrintSetting,
} from "../../services/printFormat.service";

const PrintFormatSettings = () => {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  const [showSidebar, setShowSidebar] = useState(false);
  const [activeMenu, setActiveMenu] = useState("print-formats");

  // Data state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [printFormats, setPrintFormats] = useState<PrintFormat[]>([]);
  const [configuredSettings, setConfiguredSettings] = useState<CompanyPrintSetting[]>([]);

  // Form state
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [loadingSetting, setLoadingSetting] = useState(false);

  // Page loading
  const [pageLoading, setPageLoading] = useState(true);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });

  // Abort controller for race conditions
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Load data on mount
  useEffect(() => {
    const controller = new AbortController();
    setAbortController(controller);

    loadData(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const loadData = async (signal?: AbortSignal) => {
    setPageLoading(true);
    try {
      const [companiesData, formatsData] = await Promise.all([
        getCompanies(),
        getPrintFormats(),
      ]);

      if (signal?.aborted) return;

      setCompanies(companiesData);
      setPrintFormats(formatsData.filter((f: PrintFormat) => !f.disabled));

      // Load configured settings for each company
      const settings: CompanyPrintSetting[] = [];
      for (const company of companiesData) {
        if (signal?.aborted) return;
        const setting = await getCompanyPrintSetting(company.name);
        if (setting) {
          settings.push(setting);
        }
      }
      if (!signal?.aborted) {
        setConfiguredSettings(settings);
      }
    } catch (error) {
      if (!signal?.aborted) {
        console.error("[PrintFormatSettings] Failed to load data:", error);
        showSnackbar("Failed to load data", "error");
      }
    } finally {
      if (!signal?.aborted) {
        setPageLoading(false);
      }
    }
  };

  const showSnackbar = useCallback((message: string, type: "success" | "error") => {
    setSnackbar({ visible: true, message, type });
    setTimeout(() => setSnackbar((p) => ({ ...p, visible: false })), 3000);
  }, []);

  // When company is selected, fetch its saved setting and auto-select format
  const handleCompanyChange = async (companyName: string) => {
    setSelectedCompany(companyName);
    setSelectedFormat("");

    if (!companyName) return;

    setLoadingSetting(true);
    try {
      const setting = await getCompanyPrintSetting(companyName);
      if (setting?.salary_slip_print_format) {
        setSelectedFormat(setting.salary_slip_print_format);
      }
    } catch (error) {
      console.error("[PrintFormatSettings] Failed to load company setting:", error);
    } finally {
      setLoadingSetting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCompany || !selectedFormat) {
      showSnackbar("Please select company and print format", "error");
      return;
    }

    setFormLoading(true);
    try {
      const result = await saveCompanyPrintSetting({
        company: selectedCompany,
        salary_slip_print_format: selectedFormat,
      });

      if (result.success) {
        showSnackbar("Settings saved successfully", "success");
        setSelectedCompany("");
        setSelectedFormat("");
        // Reload configured settings
        await loadData();
      } else {
        showSnackbar(result.message, "error");
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to save", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (company: string) => {
    setSelectedCompany(company);
    setLoadingSetting(true);
    try {
      const setting = await getCompanyPrintSetting(company);
      if (setting) {
        setSelectedFormat(setting.salary_slip_print_format);
      }
    } catch (error) {
      console.error("[PrintFormatSettings] Failed to load setting:", error);
    } finally {
      setLoadingSetting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <AdminHeader
        onMenuToggle={() => setShowSidebar(true)}
        title="Print Format Settings"
      />

      {/* Sidebar */}
      <AdminSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
      />

      {/* Snackbar */}
      <AnimatePresence>
        {snackbar.visible && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] rounded-xl px-5 py-3.5 text-sm font-medium shadow-2xl ${
              snackbar.type === "error"
                ? "bg-red-600 text-white"
                : isDark
                ? "bg-green-600 text-white"
                : "bg-gray-800 text-white"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {snackbar.type === "success" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {snackbar.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="px-4 py-4 space-y-6 pb-8">
        {/* Page Title */}
        <div>
          <h2 className="text-xl font-bold">Print Format Settings</h2>
          <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Configure salary slip print formats for each company
          </p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl p-5 ${
            isDark
              ? "bg-gray-800 border border-gray-700"
              : "bg-white shadow-sm border border-gray-100"
          }`}
        >
          <h3 className="text-base font-semibold mb-4">Configure Print Format</h3>

          {pageLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className={`h-11 rounded-xl ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
              <div className={`h-11 rounded-xl ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
              <div className={`h-11 rounded-xl w-32 ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Company Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className={`w-full p-3 rounded-xl border transition-colors appearance-none ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white focus:border-indigo-500"
                      : "bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-500"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company.name} value={company.name}>
                      {company.company_name || company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Print Format Dropdown */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Salary Slip Print Format
                  {loadingSetting && (
                    <span className="ml-2 inline-flex items-center text-xs text-indigo-500">
                      <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </span>
                  )}
                </label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  disabled={!selectedCompany || loadingSetting}
                  className={`w-full p-3 rounded-xl border transition-colors appearance-none disabled:opacity-50 ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white focus:border-indigo-500"
                      : "bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-500"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                >
                  <option value="">
                    {!selectedCompany
                      ? "Select a company first"
                      : loadingSetting
                      ? "Loading saved format..."
                      : "Select Print Format"}
                  </option>
                  {printFormats.map((format) => (
                    <option key={format.name} value={format.name}>
                      {format.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={formLoading || !selectedCompany || !selectedFormat || loadingSetting}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {formLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Configured Settings Section */}
        <div>
          <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Configured Settings
          </h3>

          {pageLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-4 animate-pulse ${isDark ? "bg-gray-800" : "bg-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className={`h-4 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                      <div className={`h-3 w-48 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
                    </div>
                    <div className={`h-8 w-8 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : configuredSettings.length > 0 ? (
            <div className="space-y-3">
              {configuredSettings.map((setting, idx) => (
                <SettingCard
                  key={setting.company}
                  title={setting.company}
                  subtitle={`Format: ${setting.salary_slip_print_format}`}
                  status="active"
                  onEdit={() => handleEdit(setting.company)}
                  delay={idx * 0.05}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`rounded-2xl p-8 text-center ${
                isDark ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm"
              }`}
            >
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}>
                <svg className={`w-6 h-6 ${isDark ? "text-gray-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
              <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                No print format settings configured yet
              </p>
              <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Use the form above to configure print formats for each company
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrintFormatSettings;
