import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import {
  getLoanApprovalDetail,
  approveLoanApplication,
  rejectLoanApplication,
  createLoanFromApplication,
  LoanApprovalDetail,
  AdminLoanItem,
} from "../../services/admin.service";

const LoanApprovalDetailPage = () => {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const location = useLocation();
  const stateData = (location.state as any) || {};
  const loansFromState: AdminLoanItem[] = Array.isArray(stateData.loans) ? stateData.loans : [];
  const applicationFromState = stateData.application || null;

  const [showSidebar, setShowSidebar] = useState(false);
  const [activeMenu, setActiveMenu] = useState("loan-approvals");
  const [detail, setDetail] = useState<LoanApprovalDetail | null>(applicationFromState);
  const [loading, setLoading] = useState(!applicationFromState);
  const [modalOpen, setModalOpen] = useState<"approve" | "reject" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [linkedLoan, setLinkedLoan] = useState<(AdminLoanItem & { rawStatus?: string }) | null>(null);

  // Create loan form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [repaymentStartDate, setRepaymentStartDate] = useState("");
  const [createResult, setCreateResult] = useState<{ success: boolean; message: string; loan: string; status: string } | null>(null);
  const [creatingLoan, setCreatingLoan] = useState(false);

  const findLinkedLoan = (): AdminLoanItem | null => {
    if (!detail) return null;
    return loansFromState.find((l) => l.loan_application === detail.name) || null;
  };

  useEffect(() => {
    if (loansFromState.length === 0 && name) {
      (async () => {
        try {
          const data = await getLoanApprovalDetail(decodeURIComponent(name));
          if (data) setDetail(data);
        } catch (err) {
          console.error("[LoanApprovalDetail] Fallback fetch failed:", err);
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    setLoading(false);
  }, [name, loansFromState.length]);

  useEffect(() => {
    const linked = findLinkedLoan();
    if (linked) {
      setLinkedLoan({ ...linked, rawStatus: linked.status });
    }
  }, [detail, loansFromState]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleApproveReject = async () => {
    if (!name || !modalOpen) return;
    try {
      setSubmitting(true);
      if (modalOpen === "approve") {
        await approveLoanApplication(decodeURIComponent(name), remarks || undefined);
      } else {
        await rejectLoanApplication(decodeURIComponent(name), remarks || undefined);
      }
      setModalOpen(null);
      setRemarks("");
      navigate("/admin/loan-approvals", { replace: true });
    } catch (err: any) {
      console.error("[LoanApprovalDetail] Action failed:", err);
      alert(err.message || "Failed to process request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLoan = async () => {
    if (!name || !repaymentStartDate) return;
    try {
      setCreatingLoan(true);
      const result = await createLoanFromApplication(decodeURIComponent(name), repaymentStartDate);
      setCreateResult(result);
      setShowCreateForm(false);
    } catch (err: any) {
      console.error("[LoanApprovalDetail] Create loan failed:", err);
      alert(err.message || "Failed to create loan");
    } finally {
      setCreatingLoan(false);
    }
  };

  const handleDisburse = async () => {
    if (!createResult?.loan) return;
    const disbursementDate = new Date().toISOString().split("T")[0];
    try {
      const result = await disburseLoan(createResult.loan, disbursementDate);
      setCreateResult((prev) => prev ? { ...prev, status: "Disbursed" } : prev);
      alert(`Disbursed successfully!\nDisbursement: ${result.disbursement}\nAmount: ${result.disbursed_amount?.toLocaleString() || "N/A"} SAR`);
    } catch (err: any) {
      console.error("[LoanApprovalDetail] Disburse failed:", err);
      alert(err.message || "Failed to disburse loan");
    }
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

  const displayStatus = linkedLoan ? linkedLoan.status : detail?.status || "Open";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <AdminHeader onMenuToggle={() => setShowSidebar(true)} title="Loan Approval Details" />
      <AdminSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      <div className="px-4 py-4 space-y-4 pb-8">
        <button onClick={() => navigate("/admin/loan-approvals")} className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Loan Approvals
        </button>

        {loading ? (
          <div className={`rounded-2xl p-6 animate-pulse ${cardStyle}`}>
            <div className="h-6 w-48 rounded mb-4" style={{ background: isDark ? "#374151" : "#e5e7eb" }} />
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i}><div className="h-3 w-20 rounded mb-1" style={{ background: isDark ? "#374151" : "#e5e7eb" }} /><div className="h-4 w-32 rounded" style={{ background: isDark ? "#374151" : "#e5e7eb" }} /></div>
              ))}
            </div>
          </div>
        ) : detail ? (
          <>
            <div className={`rounded-2xl p-5 ${cardStyle}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[displayStatus]?.bg || "bg-gray-100"} ${statusColors[displayStatus]?.text || "text-gray-700"}`}>
                  {displayStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Applicant</p><p className="text-sm font-semibold">{detail.applicant_name || detail.applicant}</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Company</p><p className="text-sm font-semibold">{detail.company}</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Loan Product</p><p className="text-sm font-semibold">{detail.loan_product}</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Loan Amount</p><p className="text-sm font-semibold">{detail.loan_amount.toLocaleString()} SAR</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Repayment Method</p><p className="text-sm font-semibold">{detail.repayment_method}</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Repayment Periods</p><p className="text-sm font-semibold">{detail.repayment_periods} months</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Monthly Repayment</p><p className="text-sm font-semibold">{detail.repayment_amount.toLocaleString()} SAR</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Total Payable</p><p className="text-sm font-semibold">{detail.total_payable_amount.toLocaleString()} SAR</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Total Interest</p><p className="text-sm font-semibold">{detail.total_payable_interest.toLocaleString()} SAR</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Secured Loan</p><p className="text-sm font-semibold">{detail.is_secured_loan ? "Yes" : "No"}</p></div>
                <div className="col-span-2"><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Description</p><p className="text-sm mt-1 whitespace-pre-wrap">{detail.description || "-"}</p></div>
              </div>
            </div>

            {linkedLoan && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-5 ${cardStyle}`}>
                <h3 className="font-semibold text-sm mb-3">Linked Loan</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Loan ID</p><p className="text-sm font-semibold">{linkedLoan.name}</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Loan Status</p><p className="text-sm font-semibold">{linkedLoan.status}</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Disbursed Amount</p><p className="text-sm font-semibold">{(linkedLoan.disbursed_amount || 0).toLocaleString()} SAR</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Monthly Repayment</p><p className="text-sm font-semibold">{(linkedLoan.monthly_repayment_amount || 0).toLocaleString()} SAR</p></div>
                </div>
              </motion.div>
            )}

            {displayStatus === "Open" && !linkedLoan && (
              <div className="flex gap-3">
                <button onClick={() => { setModalOpen("approve"); setRemarks(""); }} className="flex-1 py-3 px-6 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">Approve</button>
                <button onClick={() => { setModalOpen("reject"); setRemarks(""); }} className="flex-1 py-3 px-6 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">Reject</button>
              </div>
            )}

            {displayStatus === "Approved" && !linkedLoan && !createResult && (
              <div className={`rounded-2xl p-5 ${cardStyle}`}>
                <h3 className="font-semibold text-sm mb-3">Create Loan from Application</h3>
                {!showCreateForm ? (
                  <button onClick={() => setShowCreateForm(true)} className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                    Create Loan
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Repayment Start Date</label>
                      <input
                        type="date"
                        value={repaymentStartDate}
                        onChange={(e) => setRepaymentStartDate(e.target.value)}
                        className={`w-full p-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowCreateForm(false)} disabled={creatingLoan} className={`flex-1 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Cancel</button>
                      <button onClick={handleCreateLoan} disabled={creatingLoan || !repaymentStartDate} className="flex-1 py-3 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 bg-indigo-600 hover:bg-indigo-700">
                        {creatingLoan ? <span className="flex items-center justify-center gap-2"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</span> : "Create Loan"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {createResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-5 ${cardStyle}`}>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <h3 className="font-semibold text-sm text-green-700">Loan Created Successfully</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Loan ID</p><p className="text-sm font-semibold">{createResult.loan}</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Status</p><p className="text-sm font-semibold">{createResult.status}</p></div>
                </div>
                <button onClick={handleDisburse} className="w-full mt-4 py-3 px-6 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                  Disburse Loan
                </button>
              </motion.div>
            )}

            {displayStatus === "Sanctioned" && !linkedLoan && !createResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-5 ${cardStyle}`}>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>
                  <h3 className="font-semibold text-sm text-indigo-700">Loan Sanctioned</h3>
                </div>
                <p className="text-xs text-gray-500">The loan has been sanctioned. Please disburse to complete.</p>
              </motion.div>
            )}

            {displayStatus === "Disbursed" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-5 ${cardStyle}`}>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <h3 className="font-semibold text-sm text-green-700">Loan Disbursed</h3>
                </div>
                {linkedLoan && <p className="text-xs text-gray-500">Disbursed: {(linkedLoan.disbursed_amount || 0).toLocaleString()} SAR</p>}
              </motion.div>
            )}

            {displayStatus === "Closed" && (
              <div className={`rounded-2xl p-5 text-center ${cardStyle}`}>
                <svg className={`w-10 h-10 mx-auto mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <p className="text-sm font-medium text-gray-600">This loan has been closed</p>
              </div>
            )}

            {detail.status === "Rejected" && !linkedLoan && (
              <div className={`rounded-2xl p-5 text-center ${cardStyle}`}>
                <svg className={`w-10 h-10 mx-auto mb-2 ${isDark ? "text-red-400" : "text-red-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-medium text-red-600">This loan application has been rejected</p>
              </div>
            )}
          </>
        ) : (
          <div className={`rounded-2xl p-8 text-center ${cardStyle}`}>
            <p className="text-sm">Loan application not found</p>
          </div>
        )}
      </div>

      {/* Approve/Reject Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setModalOpen(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`fixed inset-0 z-50 flex items-center justify-center p-4`}>
              <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <h3 className="text-lg font-bold mb-2">{modalOpen === "approve" ? "Approve" : "Reject"} Loan Application</h3>
                <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Are you sure you want to {modalOpen} this loan application?</p>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks..." rows={3} className={`w-full p-3 rounded-xl border text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`} />
                <div className="flex gap-3">
                  <button onClick={() => setModalOpen(null)} disabled={submitting} className={`flex-1 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Cancel</button>
                  <button onClick={handleApproveReject} disabled={submitting} className={`flex-1 py-3 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 ${modalOpen === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                    {submitting ? <span className="flex items-center justify-center gap-2"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</span> : modalOpen === "approve" ? "Approve" : "Reject"}
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

export default LoanApprovalDetailPage;
