import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { useAuth } from "../../auth/useAuth";

// Loan types
interface LoanRequest {
  id: string;
  loan_type: "Personal Loan" | "Emergency Loan" | "Salary Advance";
  requested_amount: number;
  emi_amount: number;
  duration_months: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Active" | "Closed";
  approved_amount?: number;
  remaining_balance?: number;
  total_paid?: number;
  remaining_months?: number;
  submitted_date: string;
  remarks: string;
}

interface RepaymentSchedule {
  month: string;
  amount: number;
  status: "Paid" | "Pending";
}

// View types
type LoanView = "my_loans" | "apply_loan";

const LoanPage = () => {
  const { language, t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<LoanView>("my_loans");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    loan_type: "Personal Loan" as "Personal Loan" | "Emergency Loan" | "Salary Advance",
    requested_amount: "",
    reason: "",
    duration_months: "12",
    preferred_emi: "",
  });

  // Calculate EMI
  const calculateEMI = () => {
    if (formData.requested_amount && formData.duration_months) {
      const principal = parseFloat(formData.requested_amount);
      const months = parseInt(formData.duration_months);
      const interestRate = 0.05; // 5% annual interest
      const monthlyRate = interestRate / 12;
      const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      return emi.toFixed(2);
    }
    return "0";
  };

  // Dummy loan requests data
  const loanRequests: LoanRequest[] = [
    {
      id: "LN-001",
      loan_type: "Personal Loan",
      requested_amount: 20000,
      emi_amount: 1800,
      duration_months: 12,
      reason: "Home renovation",
      status: "Active",
      approved_amount: 20000,
      remaining_balance: 12000,
      total_paid: 8000,
      remaining_months: 7,
      submitted_date: "2024-01-15",
      remarks: "Approved",
    },
    {
      id: "LN-002",
      loan_type: "Salary Advance",
      requested_amount: 5000,
      emi_amount: 1000,
      duration_months: 5,
      reason: "Emergency expenses",
      status: "Pending",
      submitted_date: "2024-03-10",
      remarks: "",
    },
    {
      id: "LN-003",
      loan_type: "Emergency Loan",
      requested_amount: 10000,
      emi_amount: 900,
      duration_months: 12,
      reason: "Medical emergency",
      status: "Closed",
      approved_amount: 10000,
      remaining_balance: 0,
      total_paid: 10800,
      remaining_months: 0,
      submitted_date: "2023-01-10",
      remarks: "Loan fully paid",
    },
  ];

  // Dummy repayment schedule
  const repaymentSchedule: RepaymentSchedule[] = [
    { month: "Jan 2024", amount: 1800, status: "Paid" },
    { month: "Feb 2024", amount: 1800, status: "Paid" },
    { month: "Mar 2024", amount: 1800, status: "Paid" },
    { month: "Apr 2024", amount: 1800, status: "Paid" },
    { month: "May 2024", amount: 1800, status: "Pending" },
    { month: "Jun 2024", amount: 1800, status: "Pending" },
    { month: "Jul 2024", amount: 1800, status: "Pending" },
  ];

  const loanOptions: { key: LoanView; label: string; icon: ReactNode }[] = [
    { key: "my_loans", label: t("myLoanRequests"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "bg-orange-100", text: "text-orange-700" },
    Approved: { bg: "bg-green-100", text: "text-green-700" },
    Rejected: { bg: "bg-red-100", text: "text-red-700" },
    Active: { bg: "bg-blue-100", text: "text-blue-700" },
    Closed: { bg: "bg-gray-100", text: "text-gray-700" },
  };

  const currentOption = loanOptions.find((opt) => opt.key === activeView);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Loan request submitted:", formData);
    alert(t("requestSubmitted"));
    setFormData({
      loan_type: "Personal Loan",
      requested_amount: "",
      reason: "",
      duration_months: "12",
      preferred_emi: "",
    });
    setActiveView("my_loans");
  };

  if (showDetail && selectedLoan) {
    return (
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDetail(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">{t("loanDetails")}</h1>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[selectedLoan.status]?.bg} ${statusColors[selectedLoan.status]?.text}`}>
            {t(selectedLoan.status.toLowerCase())}
          </span>
        </div>

        {/* Loan Details Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{t("loanType")}</p>
              <p className="font-semibold text-gray-800">{selectedLoan.loan_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("duration")}</p>
              <p className="font-semibold text-gray-800">{selectedLoan.duration_months} {t("months")}</p>
            </div>
            {selectedLoan.approved_amount && (
              <>
                <div>
                  <p className="text-sm text-gray-500">{t("approvedAmount")}</p>
                  <p className="font-semibold text-gray-800">{selectedLoan.approved_amount.toLocaleString()} SAR</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("emiAmount")}</p>
                  <p className="font-semibold text-gray-800">{selectedLoan.emi_amount.toLocaleString()} SAR</p>
                </div>
              </>
            )}
            {selectedLoan.remaining_balance !== undefined && (
              <>
                <div>
                  <p className="text-sm text-gray-500">{t("remainingBalance")}</p>
                  <p className="font-semibold text-gray-800">{selectedLoan.remaining_balance.toLocaleString()} SAR</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("totalPaid")}</p>
                  <p className="font-semibold text-gray-800">{selectedLoan.total_paid?.toLocaleString()} SAR</p>
                </div>
              </>
            )}
          </div>

          {selectedLoan.reason && (
            <div>
              <p className="text-sm text-gray-500">{t("reason")}</p>
              <p className="font-semibold text-gray-800">{selectedLoan.reason}</p>
            </div>
          )}
        </div>

        {/* Repayment Schedule - Only show for Active loans */}
        {selectedLoan.status === "Active" && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4">{t("repaymentSchedule")}</h3>
            <div className="space-y-2">
              {repaymentSchedule.map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-700">{schedule.month}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800">{schedule.amount.toLocaleString()} SAR</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${schedule.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {t(schedule.status.toLowerCase())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closed Loan Message */}
        {selectedLoan.status === "Closed" && (
          <div className="bg-green-50 rounded-2xl p-6 text-center">
            <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-700 font-semibold">{t("loanFullyPaid")}</p>
          </div>
        )}

        {/* Remarks */}
        {selectedLoan.remarks && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-2">{t("remarks")}</h3>
            <p className="text-gray-600">{selectedLoan.remarks}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("loan")}</h1>
          <button
            onClick={() => setActiveView("apply_loan")}
            className="flex items-center gap-1 px-3 py-2 text-black rounded-lg transition-colors"
            style={{ backgroundColor: themeColors.primary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">{t("applyLoan")}</span>
          </button>
        </div>
      </div>

      {/* Dropdown Selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`w-full shadow-lg p-4 flex items-center justify-between ${theme === 'neon-green' ? 'neon-card' : 'bg-white rounded-2xl'}`}
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
                {loanOptions.map((option) => (
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
                      <span className="text-xl">{option.icon}</span>
                      <span className="font-medium text-gray-800">{option.label}</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Apply Loan Form */}
      {activeView === "apply_loan" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-gray-800">{t("applyLoan")}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Info - Auto Fetched */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm text-gray-500">{t("employeeName")}</p>
                <p className="font-semibold text-gray-800">{user?.fullName || "John Doe"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("employeeId")}</p>
                <p className="font-semibold text-gray-800">{user?.employeeId || "EMP-001"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("department")}</p>
                <p className="font-semibold text-gray-800">IT Department</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("reportingManager")}</p>
                <p className="font-semibold text-gray-800">Ahmed Al-Rashid</p>
              </div>
            </div>

            {/* Loan Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("loanType")}</label>
              <select
                value={formData.loan_type}
                onChange={(e) => setFormData({ ...formData, loan_type: e.target.value as any })}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Personal Loan">{t("personalLoan")}</option>
                <option value="Emergency Loan">{t("emergencyLoan")}</option>
                <option value="Salary Advance">{t("salaryAdvance")}</option>
              </select>
            </div>

            {/* Requested Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("requestedAmount")} (SAR)</label>
              <input
                type="number"
                value={formData.requested_amount}
                onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Reason for Loan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("reasonForLoan")}</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                required
              />
            </div>

            {/* Repayment Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("repaymentDuration")}</label>
              <select
                value={formData.duration_months}
                onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="3">3 {t("months")}</option>
                <option value="6">6 {t("months")}</option>
                <option value="12">12 {t("months")}</option>
                <option value="18">18 {t("months")}</option>
                <option value="24">24 {t("months")}</option>
              </select>
            </div>

            {/* EMI Calculation Preview */}
            {formData.requested_amount && (
              <div className="p-4 bg-blue-50 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">{t("estimatedEMI")}:</span>
                  <span className="font-bold text-blue-700">{calculateEMI()} SAR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">{t("tentativeDeductionPerMonth")}:</span>
                  <span className="font-bold text-blue-700">{calculateEMI()} SAR</span>
                </div>
              </div>
            )}

            {/* Preferred EMI (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("preferredEMI")} ({t("optional")}) (SAR)</label>
              <input
                type="number"
                value={formData.preferred_emi}
                onChange={(e) => setFormData({ ...formData, preferred_emi: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-6 text-black rounded-xl font-semibold transition-colors"
              style={{ backgroundColor: themeColors.primary }}
            >
              {t("submitRequest")}
            </button>
          </form>
        </motion.div>
      )}

      {/* My Loan Requests List */}
      {activeView === "my_loans" && (
        <div className="space-y-4">
          {loanRequests.map((loan) => (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setSelectedLoan(loan);
                setShowDetail(true);
              }}
              className="bg-white rounded-2xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-800">{loan.loan_type}</h3>
                  <p className="text-sm text-gray-500">{loan.duration_months} {t("months")}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[loan.status]?.bg} ${statusColors[loan.status]?.text}`}>
                  {t(loan.status.toLowerCase())}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{loan.emi_amount.toLocaleString()} SAR/{t("month")}</span>
                <span className="font-bold text-gray-800">{loan.requested_amount.toLocaleString()} SAR</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoanPage;
