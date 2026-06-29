import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { useAuth } from "../../auth/useAuth";
import { getLoanProducts, applyLoan, getMyLoans, getLoanDetail, getRepaymentSchedule, LoanProduct, LoanApplicationItem, LoanItem, LoanDetail, RepaymentScheduleRow } from "../../services/loan.service";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getListItemCardClass,
  getPageCardStyle,
} from "../../utils/pageCardStyles";
import SearchableSelect from "../../components/common/SearchableSelect";

// View types
type LoanView = "my_loans" | "apply_loan";

const LoanPage = () => {
  const { language, t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<LoanView>("my_loans");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loanProductOpen, setLoanProductOpen] = useState(false);
  const [repaymentMethodOpen, setRepaymentMethodOpen] = useState(false);
  const [repaymentDurationOpen, setRepaymentDurationOpen] = useState(false);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);

   useEffect(() => {
    const fetchLoanProducts = async () => {
      try {
        const result = await getLoanProducts();
        setLoanProducts(result || []);
      } catch (error) {
        console.error("Failed to fetch loan products:", error);
        setLoanProducts([]);
      }
    };
    fetchLoanProducts();
  }, []);

  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    loan_product: "",
    requested_amount: "",
    reason: "",
    repayment_periods: "6",
    repayment_amount: "",
    repayment_method: "Repay Over Number of Periods" as "Repay Over Number of Periods" | "Repay Fixed Amount per Period",
  });

  // Calculate EMI (zero interest for company loans)
  const calculateEMI = () => {
    if (formData.requested_amount && formData.repayment_periods) {
      const principal = parseFloat(formData.requested_amount);
      const months = parseInt(formData.repayment_periods);
      return (principal / months).toFixed(2);
    }
    return "0";
  };

  const loanOptions: { key: LoanView; label: string; icon: ReactNode }[] = [
    { key: "my_loans", label: t("myLoanRequests"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002-2H7a2 2 0 00-2-2V7a2 2 0 002-2h2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { key: "apply_loan", label: t("applyLoan"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "bg-orange-100", text: "text-orange-700" },
    Approved: { bg: "bg-green-100", text: "text-green-700" },
    Rejected: { bg: "bg-red-100", text: "text-red-700" },
    Active: { bg: "bg-blue-100", text: "text-blue-700" },
    Closed: { bg: "bg-gray-100", text: "text-gray-700" },
    Open: { bg: "bg-indigo-100", text: "text-indigo-700" },
    Sanctioned: { bg: "bg-purple-100", text: "text-purple-700" },
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

  const [myLoanApplications, setMyLoanApplications] = useState<LoanApplicationItem[]>([]);
  const [myLoans, setMyLoans] = useState<LoanItem[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [loanDetailData, setLoanDetailData] = useState<LoanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [schedule, setSchedule] = useState<RepaymentScheduleRow[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

   useEffect(() => {
    const fetchMyLoans = async () => {
      if (activeView !== "my_loans") return;
      try {
        setLoadingLoans(true);
        const result = await getMyLoans();
        setMyLoanApplications(result.applications);
        setMyLoans(result.loans);
      } catch (error) {
        console.error("Failed to fetch my loans:", error);
      } finally {
        setLoadingLoans(false);
      }
    };
    fetchMyLoans();
  }, [activeView]);

  useEffect(() => {
    const fetchLoanDetail = async () => {
      if (!selectedLoan) return;
      try {
        setDetailLoading(true);
        const detail = await getLoanDetail(selectedLoan.name);
        setLoanDetailData(detail);
      } catch (error) {
        console.error("Failed to fetch loan detail:", error);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchLoanDetail();
  }, [selectedLoan]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const applyLoanPayload = {
        loan_product: formData.loan_product,
        loan_amount: parseFloat(formData.requested_amount),
        repayment_method: formData.repayment_method,
        repayment_periods: formData.repayment_method === "Repay Over Number of Periods" ? parseInt(formData.repayment_periods) : undefined,
        repayment_amount: formData.repayment_method === "Repay Fixed Amount per Period" ? parseFloat(formData.repayment_amount) : undefined,
        description: formData.reason,
      };
      console.log("[LoanPage] Applying for loan with payload:", applyLoanPayload);
      await applyLoan(applyLoanPayload);
      alert(t("requestSubmitted"));
      setFormData({
        loan_product: "",
        requested_amount: "",
        reason: "",
        repayment_periods: "6",
        repayment_amount: "",
        repayment_method: "Repay Over Number of Periods",
      });
      setActiveView("my_loans");
    } catch (error: any) {
      alert(error?.message || "Failed to submit loan application");
    } finally {
      setSubmitting(false);
    }
  };

  if (showDetail && selectedLoan) {
    return (
      <div className={EMPLOYEE_PAGE_CONTAINER}>
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setShowDetail(false);
              setShowSchedule(false);
              setSchedule([]);
              setLoanDetailData(null);
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">{t("loanDetails")}</h1>
        </div>

        {/* Status Badge */}
        {(loanDetailData?.status || selectedLoan?.status) && (
          <div className="flex justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[loanDetailData?.status || selectedLoan?.status || ""]?.bg} ${statusColors[loanDetailData?.status || selectedLoan?.status || ""]?.text}`}>
              {t((loanDetailData?.status || selectedLoan?.status || "").toLowerCase())}
            </span>
          </div>
        )}

        {/* Card 1 — Loan Application Details */}
        {selectedLoan && (
          <div className={`${getPageCardStyle(theme)} p-6 space-y-4`}>
            <h2 className="font-semibold text-gray-800">{t("applyLoan")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t("applicationId")}</p>
                <p className="font-semibold text-gray-800">{selectedLoan.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("loanType")}</p>
                <p className="font-semibold text-gray-800">{selectedLoan.loan_product || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("requestedAmount")}</p>
                <p className="font-semibold text-gray-800">{(selectedLoan.loan_amount || 0).toLocaleString()} SAR</p>
              </div>
              {selectedLoan.repayment_method && (
                <div>
                  <p className="text-sm text-gray-500">{t("repaymentMethod")}</p>
                  <p className="font-semibold text-gray-800">{selectedLoan.repayment_method}</p>
                </div>
              )}
              {selectedLoan.repayment_periods && (
                <div>
                  <p className="text-sm text-gray-500">{t("repaymentDuration")}</p>
                  <p className="font-semibold text-gray-800">{selectedLoan.repayment_periods} {t("months")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card 2 — Loan Detail */}
        {loanDetailData && (
          <div className={`${getPageCardStyle(theme)} p-6 space-y-4`}>
            <h2 className="font-semibold text-gray-800">{t("loanDetails")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t("applicationId")}</p>
                <p className="font-semibold text-gray-800">{loanDetailData.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("applicant")}</p>
                <p className="font-semibold text-gray-800">{loanDetailData.applicant_name || loanDetailData.applicant || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("loanType")}</p>
                <p className="font-semibold text-gray-800">{loanDetailData.loan_product || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("loanAmount")}</p>
                <p className="font-semibold text-gray-800">{(loanDetailData.loan_amount || 0).toLocaleString()} SAR</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("repaymentMethod")}</p>
                <p className="font-semibold text-gray-800">{loanDetailData.repayment_method || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("repaymentDuration")}</p>
                <p className="font-semibold text-gray-800">{loanDetailData.repayment_periods ? `${loanDetailData.repayment_periods} ${t("months")}` : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("monthlyRepayment")}</p>
                <p className="font-semibold text-gray-800">{(loanDetailData.monthly_repayment_amount || 0).toLocaleString()} SAR</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("interestRate")}</p>
                <p className="font-semibold text-gray-800">{loanDetailData.rate_of_interest ?? 0}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("repaymentStartDate")}</p>
                <p className="font-semibold text-gray-800">{loanDetailData.repayment_start_date ? formatDate(loanDetailData.repayment_start_date) : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("disbursementDate")}</p>
                <p className="font-semibold text-gray-800">{loanDetailData.disbursement_date ? formatDate(loanDetailData.disbursement_date) : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("disbursedAmount")}</p>
                <p className="font-semibold text-gray-800">{(loanDetailData.disbursed_amount || 0).toLocaleString()} SAR</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("totalPayment")}</p>
                <p className="font-semibold text-gray-800">{(loanDetailData.total_payment || 0).toLocaleString()} SAR</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("totalInterest")}</p>
                <p className="font-semibold text-gray-800">{(loanDetailData.total_interest_payable || 0).toLocaleString()} SAR</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("totalPrincipalPaid")}</p>
                <p className="font-semibold text-gray-800">{(loanDetailData.total_principal_paid || 0).toLocaleString()} SAR</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("totalAmountPaid")}</p>
                <p className="font-semibold text-gray-800">{(loanDetailData.total_amount_paid || 0).toLocaleString()} SAR</p>
              </div>
              {loanDetailData.closure_date && (
                <div>
                  <p className="text-sm text-gray-500">{t("closureDate")}</p>
                  <p className="font-semibold text-gray-800">{formatDate(loanDetailData.closure_date)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">{t("daysPastDue")}</p>
                <p className="font-semibold text-gray-800">{loanDetailData.days_past_due ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("isNpa")}</p>
                <p className="font-semibold text-gray-800">{t(loanDetailData.is_npa ? "yes" : "no")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Card 3 — Repayment Schedule */}
        {!showSchedule ? (
          <button
            onClick={async () => {
              if (!selectedLoan) return;
              setScheduleLoading(true);
              setShowSchedule(true);
              try {
                const result = await getRepaymentSchedule(selectedLoan.name);
                setSchedule(result);
              } catch (error) {
                console.error("Failed to fetch repayment schedule:", error);
                setSchedule([]);
              } finally {
                setScheduleLoading(false);
              }
            }}
            className={`w-full ${getPageCardStyle(theme)} p-4 text-center text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors`}
          >
            {t("repaymentSchedule")}
          </button>
        ) : scheduleLoading ? (
          <div className={`${getPageCardStyle(theme)} p-8 text-center`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : schedule.length === 0 || !loanDetailData?.repayment_start_date ? (
          <div className={`${getPageCardStyle(theme)} p-6 text-center text-gray-500`}>
            <p>Repayment schedule not yet available</p>
          </div>
        ) : (
          <div className={`${getPageCardStyle(theme)} p-6 space-y-4`}>
            <h2 className="font-semibold text-gray-800">{t("repaymentSchedule")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">{t("paymentDate")}</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">{t("principalAmount")}</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">{t("interestAmount")}</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">{t("totalPayment")}</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">{t("balanceLoanAmount")}</th>
                    <th className="text-center py-2 px-3 text-gray-500 font-medium">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row: RepaymentScheduleRow, index: number) => (
                    <tr key={index} className={index > 0 ? "border-b border-gray-100" : ""}>
                      <td className="py-3 px-3 text-gray-800">{row.payment_date ? formatDate(row.payment_date) : "-"}</td>
                      <td className="py-3 px-3 text-right text-gray-800">{(row.principal_amount || 0).toLocaleString()} SAR</td>
                      <td className="py-3 px-3 text-right text-gray-800">{(row.interest_amount || 0).toLocaleString()} SAR</td>
                      <td className="py-3 px-3 text-right text-gray-800">{(row.total_payment || 0).toLocaleString()} SAR</td>
                      <td className="py-3 px-3 text-right text-gray-800">{(row.balance_loan_amount || 0).toLocaleString()} SAR</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          row.is_accrued
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {row.is_accrued ? t("paid") : t("pending")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
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
          className={`w-full ${getPageCardStyle(theme)} p-4 flex items-center justify-between`}
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
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              
              {/* Menu */}
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
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-gray-800">{option.label}</span>
                      {activeView === option.key && (
                        <span className="ml-auto text-indigo-600">✓</span>
                      )}
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
          className={`${getPageCardStyle(theme)} p-6 space-y-4`}
        >
          <h2 className="text-lg font-bold text-gray-800">{t("applyLoan")}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Info - Auto Fetched */}
            {/* <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
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
            </div> */}

            {/* Loan Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("loanType")} <span className="text-red-500">*</span></label>
              <SearchableSelect
                label=""
                placeholder={t("selectOption")}
                value={formData.loan_product}
                options={loanProducts.map((p) => ({ value: p.name, label: p.name }))}
                isOpen={loanProductOpen}
                onOpenChange={setLoanProductOpen}
                onSelect={(val) => setFormData({ ...formData, loan_product: val })}
                variant="form"
              />
            </div>

            {/* Repayment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("repaymentMethod")} <span className="text-red-500">*</span></label>
              <SearchableSelect
                label=""
                placeholder={t("selectOption")}
                value={formData.repayment_method}
                options={[
                  { value: "Repay Over Number of Periods", label: t("repayOverNumberOfPeriods") },
                  { value: "Repay Fixed Amount per Period", label: t("repayFixedAmountPerPeriod") },
                ]}
                isOpen={repaymentMethodOpen}
                onOpenChange={setRepaymentMethodOpen}
                onSelect={(val) => setFormData({ ...formData, repayment_method: val as any })}
                variant="form"
              />
            </div>

            {/* Requested Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("requestedAmount")} (SAR) <span className="text-red-500">*</span></label>
                <input
                type="number"
                value={formData.requested_amount}
                onChange={(e) => {
                  const raw = e.target.value;
                  setFormData({ ...formData, requested_amount: raw });
                }}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Reason for Loan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("reasonForLoan")} <span className="text-red-500">*</span></label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                required
              />
            </div>

            {formData.repayment_method === "Repay Over Number of Periods" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("repaymentDuration")} <span className="text-red-500">*</span></label>
                <SearchableSelect
                  label=""
                  placeholder={t("selectOption")}
                  value={formData.repayment_periods}
                  options={[
                    { value: "3", label: `3 ${t("months")}` },
                    { value: "6", label: `6 ${t("months")}` },
                    { value: "12", label: `12 ${t("months")}` },
                    { value: "18", label: `18 ${t("months")}` },
                    { value: "24", label: `24 ${t("months")}` },
                  ]}
                  isOpen={repaymentDurationOpen}
                  onOpenChange={setRepaymentDurationOpen}
                  onSelect={(val) => setFormData({ ...formData, repayment_periods: val })}
                  variant="form"
                />
              </div>
            )}

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

            {formData.repayment_method === "Repay Fixed Amount per Period" && (
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("preferredEMI")} (SAR) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={formData.repayment_amount}
                  onChange={(e) => setFormData({ ...formData, repayment_amount: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 text-black rounded-xl font-semibold transition-colors"
              style={{ backgroundColor: themeColors.primary }}
            >
              {submitting ? (t("submitting") || "Submitting...") : t("submitRequest")}
            </button>
          </form>
        </motion.div>
      )}

      {/* My Loan Requests List */}
      {activeView === "my_loans" && (
        <div className="space-y-6">
          {loadingLoans ? (
            <div className={`${getPageCardStyle(theme)} p-8 text-center`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Pending Applications */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">{t("pending")} {t("loan")}s</h2>
                {myLoanApplications.length === 0 ? (
                  <div className={`${getPageCardStyle(theme)} p-6 text-center text-gray-500`}>
                    <p>No pending applications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myLoanApplications.map((app) => (
                      <div key={app.name} className={`${getListItemCardClass(theme)} opacity-75`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-gray-800">{app.loan_product}</h3>
                            <p className="text-sm text-gray-500">{app.repayment_periods} {t("months")}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[app.status]?.bg || "bg-gray-100"} ${statusColors[app.status]?.text || "text-gray-700"}`}>
                            {t(app.status.toLowerCase() || "")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{app.repayment_amount.toLocaleString()} SAR/{t("month")}</span>
                          <span className="font-bold text-gray-800">{app.loan_amount.toLocaleString()} SAR</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{app.posting_date ? formatDate(app.posting_date) : ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Loans */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">{t("active")} {t("loan")}s</h2>
                {myLoans.length === 0 ? (
                  <div className={`${getPageCardStyle(theme)} p-6 text-center text-gray-500`}>
                    <p>No active loans</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myLoans.map((loan) => (
                      <motion.div
                        key={loan.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setSelectedLoan({
                            name: loan.name,
                            loan_product: loan.loan_product,
                            loan_amount: loan.loan_amount,
                            status: loan.status,
                          } as LoanDetail);
                          setShowDetail(true);
                          setShowSchedule(false);
                          setSchedule([]);
                        }}
                        className={getListItemCardClass(theme)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-gray-800">{loan.loan_product}</h3>
                            <p className="text-sm text-gray-500">{loan.monthly_repayment_amount.toLocaleString()} SAR/{t("month")}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[loan.status]?.bg || "bg-gray-100"} ${statusColors[loan.status]?.text || "text-gray-700"}`}>
                            {t(loan.status?.toLowerCase() || "")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {(loan.total_principal_paid || 0).toLocaleString()} / {loan.loan_amount.toLocaleString()} SAR {t("paid")}
                          </span>
                          <span className="font-bold text-gray-800">{loan.disbursed_amount.toLocaleString()} SAR</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full"
                            style={{ width: `${Math.min((loan.total_principal_paid / loan.loan_amount) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LoanPage;
