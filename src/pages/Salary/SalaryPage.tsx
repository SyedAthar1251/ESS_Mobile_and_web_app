import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";

// Salary Slip types
interface SalarySlip {
  id: string;
  month: string;
  year: number;
  net_pay: number;
  status: "Paid" | "Pending";
  basic_salary: number;
  allowances: number;
  deductions: number;
}

// Dropdown options
type SalaryView = "salary_slips" | "salary_details";

const SalaryPage = () => {
  const { language, t } = useLanguage();
  const [activeView, setActiveView] = useState<SalaryView>("salary_slips");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

  const salaryOptions: { key: SalaryView; label: string; icon: ReactNode }[] = [
    { key: "salary_slips", label: t("salarySlips"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { key: "salary_details", label: t("salaryDetails"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  // Dummy salary data
  const salarySlips: SalarySlip[] = [
    {
      id: "SS-2024-01",
      month: "January",
      year: 2024,
      net_pay: 8500,
      status: "Paid",
      basic_salary: 7000,
      allowances: 2000,
      deductions: 500,
    },
    {
      id: "SS-2023-12",
      month: "December",
      year: 2023,
      net_pay: 8200,
      status: "Paid",
      basic_salary: 7000,
      allowances: 1800,
      deductions: 600,
    },
    {
      id: "SS-2023-11",
      month: "November",
      year: 2023,
      net_pay: 8500,
      status: "Paid",
      basic_salary: 7000,
      allowances: 2000,
      deductions: 500,
    },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    Paid: { bg: "bg-green-100", text: "text-green-700" },
    Pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  };

  const currentOption = salaryOptions.find((opt) => opt.key === activeView);

  // Get translated month name
  const getMonthName = (month: string) => {
    const months: Record<string, string> = {
      "January": t("january"),
      "February": t("february"),
      "March": t("march"),
      "April": t("april"),
      "May": t("may"),
      "June": t("june"),
      "July": t("july"),
      "August": t("august"),
      "September": t("september"),
      "October": t("october"),
      "November": t("november"),
      "December": t("december"),
    };
    return months[month] || month;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  // Calculate totals
  const totalPaid = salarySlips.filter(s => s.status === "Paid").reduce((sum, s) => sum + s.net_pay, 0);
  const totalPending = salarySlips.filter(s => s.status === "Pending").reduce((sum, s) => sum + s.net_pay, 0);
  const avgSalary = Math.round(totalPaid / salarySlips.length);
  const totalDeductions = salarySlips.reduce((sum, s) => sum + s.deductions, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("salary")}</h1>
          <span className="text-sm text-gray-500">{salarySlips.length} {t("slips")}</span>
        </div>
      </div>

      {/* Main Summary Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <p className="text-sm opacity-80">{t("currentMonthNetPay")}</p>
        <p className="text-4xl font-bold mt-1">{formatCurrency(salarySlips[0].net_pay)}</p>
        <p className="text-sm opacity-80 mt-2">{getMonthName(salarySlips[0].month)} {salarySlips[0].year}</p>
      </div>

      {/* Dropdown Selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentOption?.icon}</span>
            <span className="font-semibold text-gray-800">{currentOption?.label}</span>
          </div>
          <motion.span animate={{ rotate: dropdownOpen ? 180 : 0 }} className="text-gray-400">
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-20 overflow-hidden"
              >
                {salaryOptions.map((option) => (
                  <li key={option.key}>
                    <button
                      onClick={() => {
                        setActiveView(option.key);
                        setDropdownOpen(false);
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${
                        activeView === option.key ? "bg-indigo-50" : ""
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-gray-800">{option.label}</span>
                      {activeView === option.key && <span className="ml-auto text-indigo-600">✓</span>}
                    </button>
                  </li>
                ))}
              </motion.ul>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Salary Slips View */}
      {activeView === "salary_slips" && (
        <div className="space-y-4">
          {salarySlips.map((slip, index) => (
            <motion.div
              key={slip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedSlip(slip)}
              className="bg-white rounded-2xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{getMonthName(slip.month)} {slip.year}</h4>
                  <p className="text-sm text-gray-500">{slip.id}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[slip.status].bg
                  } ${statusColors[slip.status].text}`}
                >
                  {slip.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t("netPay")}</p>
                <p className="text-xl font-bold text-indigo-600">{formatCurrency(slip.net_pay)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Salary Details View */}
      {activeView === "salary_details" && (
        <div className="bg-white rounded-2xl shadow-lg p-4 space-y-6 overflow-x-hidden">
          <h2 className="font-semibold text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">{t("salaryBreakdown")}</h2>

          {/* Earnings */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">{t("earnings")}</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-2 min-w-0">
                <span className="text-gray-600 truncate">{t("basicSalary")}</span>
                <span className="font-medium whitespace-nowrap">{formatCurrency(salarySlips[0].basic_salary)}</span>
              </div>
              <div className="flex justify-between items-center gap-2 min-w-0">
                <span className="text-gray-600 truncate">{t("allowances")}</span>
                <span className="font-medium whitespace-nowrap">{formatCurrency(salarySlips[0].allowances)}</span>
              </div>
              <div className="flex justify-between items-center gap-2 min-w-0 border-t pt-2">
                <span className="font-semibold truncate">{t("totalEarnings")}</span>
                <span className="font-bold text-green-600 whitespace-nowrap">{formatCurrency(salarySlips[0].basic_salary + salarySlips[0].allowances)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">{t("deductions")}</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-2 min-w-0">
                <span className="text-gray-600 truncate">{t("tax")}</span>
                <span className="font-medium whitespace-nowrap">{formatCurrency(salarySlips[0].deductions)}</span>
              </div>
              <div className="flex justify-between items-center gap-2 min-w-0 border-t pt-2">
                <span className="font-semibold truncate">{t("totalDeductions")}</span>
                <span className="font-bold text-red-600 whitespace-nowrap">{formatCurrency(salarySlips[0].deductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="bg-indigo-50 rounded-xl p-4 overflow-x-hidden">
            <div className="flex justify-between items-center gap-2 min-w-0">
              <span className="font-semibold text-indigo-800 truncate">{t("netPay")}</span>
              <span className="text-xl font-bold text-indigo-600 whitespace-nowrap">{formatCurrency(salarySlips[0].net_pay)}</span>
            </div>
          </div>

          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
            <span>{t("downloadPayslip")}</span>
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSlip && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSlip(null)}
              className="fixed inset-0 bg-black/30 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    {getMonthName(selectedSlip.month)} {selectedSlip.year}
                  </h3>
                  <button onClick={() => setSelectedSlip(null)} className="text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Basic Salary</p>
                      <p className="font-medium">{formatCurrency(selectedSlip.basic_salary)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Allowances</p>
                      <p className="font-medium">{formatCurrency(selectedSlip.allowances)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Deductions</p>
                      <p className="font-medium">{formatCurrency(selectedSlip.deductions)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Net Pay</p>
                      <p className="font-bold text-indigo-600">{formatCurrency(selectedSlip.net_pay)}</p>
                    </div>
                  </div>
                  <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium">
                    Download PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalaryPage;
