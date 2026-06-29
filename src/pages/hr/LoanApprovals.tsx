import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getPendingLoans, HRLoanApplication, HRLoanItem } from "../../services/hrLoan.service";
import { getPageCardStyle, getListItemCardClass } from "../../utils/pageCardStyles";

const LoanApprovals = () => {
  const { theme, themeColors } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [applications, setApplications] = useState<HRLoanApplication[]>([]);
  const [loans, setLoans] = useState<HRLoanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPendingLoans();
      console.log("[HRLoanApprovals] Fetched:", response);
      setApplications(response.applications);
      setLoans(response.loans);
    } catch (err: any) {
      console.error("[HRLoanApprovals] Fetch error:", err);
      setError(err.message || "Failed to fetch loan requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const showSnackbar = (message: string, type: "success" | "error") => {
    setSnackbar({ message, type });
    setTimeout(() => setSnackbar(null), 3000);
  };

  const mapApplicationStatus = (appStatus: string, linkedLoans: HRLoanItem[]) => {
    if (appStatus === "Approved" && linkedLoans.length > 0) {
      const loanStatus = linkedLoans[0].status;
      if (loanStatus === "Disbursed") return "Disbursed";
      if (loanStatus === "Sanctioned") return "Sanctioned";
      if (loanStatus === "Closed") return "Closed";
    }
    return appStatus;
  };

  const getStatusStyle = (status: string) => {
    if (status === "Open" || status === "Pending")
      return { background: "#fef3c7", color: "#92400e" };
    if (status === "Approved" || status === "Sanctioned")
      return { background: "#dbeafe", color: "#1e40af" };
    if (status === "Rejected")
      return { background: "#fee2e2", color: "#991b1b" };
    if (status === "Disbursed" || status === "Active")
      return { background: "#d1fae5", color: "#065f46" };
    if (status === "Closed")
      return { background: "#f3f4f6", color: "#374151" };
    return { background: "#f3f4f6", color: "#374151" };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: themeColors.text }}>Loan Applications</h1>
            <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
              {loading ? "Loading..." : `${applications.length} application${applications.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={fetchLoans}
            className="p-2 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: themeColors.textSecondary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchLoans} className="ml-auto text-sm text-red-600 font-medium hover:underline">Retry</button>
        </motion.div>
      )}

      {/* Loan List */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className={`${getPageCardStyle(theme)} p-4 animate-pulse`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </div>
              <div className="h-3 w-44 bg-gray-200 rounded" />
            </div>
          ))
        ) : applications.length === 0 ? (
          <div className={`${getPageCardStyle(theme)} p-8 text-center text-gray-500`}>
            <p className="text-sm">No loan applications</p>
          </div>
        ) : (
          applications.map((application, idx) => {
            const linkedLoans = loans.filter((l) => l.loan_application === application.name);
            const displayStatus = mapApplicationStatus(application.status, linkedLoans);
            const appStatusColors = getStatusStyle(application.status);
            const loanStatusColors = displayStatus !== application.status ? getStatusStyle(displayStatus) : null;

            return (
              <motion.div
                key={application.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/hr-dashboard/loan-approvals/${encodeURIComponent(application.name)}`, { state: { application, loans } })}
                className={getListItemCardClass(theme)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm">{application.applicant_name || application.applicant}</h4>
                    <p className="text-xs text-gray-500">{application.loan_product}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={appStatusColors}
                    >
                      {application.status}
                    </span>
                    {loanStatusColors && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={loanStatusColors}
                      >
                        Loan: {displayStatus}
                      </span>
                    )}
                  </div>
                </div>

                {linkedLoans.length > 0 && (
                  <div className="mt-2 mb-2 p-2 rounded-lg bg-gray-50">
                    <p className="text-xs font-medium text-gray-700">Linked Loan: {linkedLoans[0].name}</p>
                    <p className="text-xs text-gray-500">Status: {linkedLoans[0].status} | Disbursed: {linkedLoans[0].disbursed_amount?.toLocaleString()} SAR</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{application.repayment_periods} months · EMI {application.repayment_amount.toLocaleString()} SAR</span>
                  <span className="text-sm font-semibold text-gray-800">{application.loan_amount.toLocaleString()} SAR</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Snackbar */}
      <AnimatePresence>
        {snackbar && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg z-50 ${
              snackbar.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {snackbar.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoanApprovals;
