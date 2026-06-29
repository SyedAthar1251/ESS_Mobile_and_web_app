import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import { getLoanApprovals, PendingLoanApproval, AdminLoanItem } from "../../services/admin.service";

const LoanApprovalsList = () => {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeMenu, setActiveMenu] = useState("loan-approvals");
  const [applications, setApplications] = useState<PendingLoanApproval[]>([]);
  const [loans, setLoans] = useState<AdminLoanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapApplicationStatus = (appStatus: string, linkedLoans: AdminLoanItem[]) => {
    if (appStatus === "Approved" && linkedLoans.length > 0) {
      const loanStatus = linkedLoans[0].status;
      if (loanStatus === "Disbursed") return "Disbursed";
      if (loanStatus === "Sanctioned") return "Sanctioned";
      if (loanStatus === "Closed") return "Closed";
    }
    return appStatus;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    Open: { bg: "bg-orange-100", text: "text-orange-700" },
    Approved: { bg: "bg-blue-100", text: "text-blue-700" },
    Rejected: { bg: "bg-red-100", text: "text-red-700" },
    Sanctioned: { bg: "bg-purple-100", text: "text-purple-700" },
    Disbursed: { bg: "bg-green-100", text: "text-green-700" },
    Closed: { bg: "bg-gray-100", text: "text-gray-700" },
    Pending: { bg: "bg-orange-100", text: "text-orange-700" },
  };

  const cardStyle = isDark ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm border border-gray-100";

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getLoanApprovals();
      console.log("[LoanApprovals] Fetched:", result);
      setApplications(result.applications);
      setLoans(result.loans);
    } catch (err: any) {
      console.error("[LoanApprovals] Fetch error:", err);
      setError(err.message || "Failed to fetch loan requests");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <AdminHeader onMenuToggle={() => setShowSidebar(true)} title="Loan Approvals" />
      <AdminSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      <div className="px-4 py-4 space-y-4 pb-8">
        <div>
          <h2 className="text-xl font-bold">Loan Applications & Loans</h2>
          <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {loading ? "Loading..." : `${applications.length} application${applications.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`rounded-2xl p-4 animate-pulse ${cardStyle}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`h-4 w-36 rounded mb-1 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className={`h-3 w-24 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
                  </div>
                  <div className={`h-6 w-16 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`h-3 w-28 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
                  <div className={`h-3 w-28 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
                </div>
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl p-8 text-center ${cardStyle}`}>
            <svg className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>No loan applications</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {applications.map((application, index) => {
              const linkedLoans = loans.filter((l) => l.loan_application === application.name);
              const displayStatus = mapApplicationStatus(application.status, linkedLoans);
              const applicationStatusColors = statusColors[application.status] || { bg: "bg-gray-100", text: "text-gray-700" };
              const loanStatusColors = displayStatus !== application.status ? (statusColors[displayStatus] || { bg: "bg-gray-100", text: "text-gray-700" }) : null;

              return (
                <motion.div
                  key={application.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/admin/loan-approvals/${encodeURIComponent(application.name)}`, { state: { application, loans } })}
                  className={`rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow ${cardStyle}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{application.applicant_name || application.applicant}</h3>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{application.loan_product}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${applicationStatusColors.bg} ${applicationStatusColors.text}`}>
                        {application.status}
                      </span>
                      {loanStatusColors && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${loanStatusColors.bg} ${loanStatusColors.text}`}>
                          Loan: {displayStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {linkedLoans.length > 0 && (
                    <div className="mb-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Linked Loan: {linkedLoans[0].name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status: {linkedLoans[0].status} | Disbursed: {linkedLoans[0].disbursed_amount?.toLocaleString()} SAR</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Loan Amount</p>
                      <p className="text-sm font-medium">{application.loan_amount.toLocaleString()} SAR</p>
                    </div>
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Posting Date</p>
                      <p className="text-sm font-medium">{formatDate(application.posting_date)}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Repayment</p>
                      <p className="text-sm font-medium">{application.repayment_periods} months</p>
                    </div>
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>EMI</p>
                      <p className="text-sm font-medium">{application.repayment_amount.toLocaleString()} SAR</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanApprovalsList;
