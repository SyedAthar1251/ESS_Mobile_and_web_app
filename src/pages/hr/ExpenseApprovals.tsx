import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import {
  getPendingExpenses,
  getExpenseClaimDetail,
  approveExpense,
  rejectExpense,
  HRExpenseClaim,
  ExpenseClaimDetail,
} from "../../services/hrExpense.service";
import { getPageCardStyle, getListItemCardClass } from "../../utils/pageCardStyles";

const ExpenseApprovals = () => {
  const { theme, themeColors } = useTheme();
  const [expenses, setExpenses] = useState<HRExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseClaimDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPendingExpenses();
      setExpenses(response.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch expense claims");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const showSnackbar = (message: string, type: "success" | "error") => {
    setSnackbar({ message, type });
    setTimeout(() => setSnackbar(null), 3000);
  };

  const handleView = async (expense: HRExpenseClaim) => {
    setDetailLoading(true);
    try {
      const detail = await getExpenseClaimDetail(expense.name);
      if (detail) {
        setSelectedExpense(detail);
        setShowDetail(true);
      }
    } catch (err: any) {
      showSnackbar("Failed to load expense details", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (name: string) => {
    setProcessingId(name);
    try {
      await approveExpense(name);
      showSnackbar("Expense claim approved successfully", "success");
      setExpenses((prev) => prev.filter((e) => e.name !== name));
      setShowDetail(false);
      setSelectedExpense(null);
    } catch (err: any) {
      showSnackbar(err.message || "Failed to approve expense", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (name: string) => {
    setProcessingId(name);
    try {
      await rejectExpense(name);
      showSnackbar("Expense claim rejected successfully", "success");
      setExpenses((prev) => prev.filter((e) => e.name !== name));
      setShowDetail(false);
      setSelectedExpense(null);
    } catch (err: any) {
      showSnackbar(err.message || "Failed to reject expense", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const getStatusStyle = (status: string) => {
    if (status === "Pending")
      return { background: "#fef3c7", color: "#92400e" };
    if (status === "Approved")
      return { background: "#d1fae5", color: "#065f46" };
    return { background: "#fee2e2", color: "#991b1b" };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: themeColors.text }}>Expense Approvals</h1>
            <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
              {loading ? "Loading..." : `${expenses.length} pending claim${expenses.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={fetchExpenses}
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
          <button onClick={fetchExpenses} className="ml-auto text-sm text-red-600 font-medium hover:underline">Retry</button>
        </motion.div>
      )}

      {/* Expense List — individual cards like LeavePage */}
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
        ) : expenses.length === 0 ? (
          <div className={`${getPageCardStyle(theme)} p-8 text-center text-gray-500`}>
            <p className="text-sm">No pending expense claims</p>
          </div>
        ) : (
          expenses.map((expense, idx) => (
            <motion.div
              key={expense.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleView(expense)}
              className={getListItemCardClass(theme)}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h4 className="font-medium text-gray-800 text-sm">{expense.employee_name}</h4>
                  <p className="text-xs text-gray-500">{expense.employee}</p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={getStatusStyle(expense.approval_status || expense.status)}
                >
                  {expense.approval_status || expense.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {expense.posting_date} · {formatAmount(expense.grand_total || expense.total_claimed_amount)}
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal — same style as LeavePage */}
      <AnimatePresence>
        {showDetail && selectedExpense && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[15vh] px-4 pb-4 overflow-y-auto"
              onClick={() => { setShowDetail(false); setSelectedExpense(null); }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-base">
                      {selectedExpense.employee_name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedExpense.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowDetail(false); setSelectedExpense(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-400">Employee</span>
                    <span className="text-sm font-semibold text-gray-800">{selectedExpense.employee}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-400">Status</span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: (selectedExpense.approval_status || selectedExpense.status) === "Approved" ? "#16a34a" : (selectedExpense.approval_status || selectedExpense.status) === "Rejected" ? "#dc2626" : "#d97706" }}
                    >
                      {selectedExpense.approval_status || selectedExpense.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-400">Posting Date</span>
                    <span className="text-sm font-semibold text-gray-800">{selectedExpense.posting_date}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-400">Amount</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {formatAmount(selectedExpense.grand_total || selectedExpense.total_claimed_amount)}
                    </span>
                  </div>
                  {selectedExpense.department && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-xs text-gray-400">Department</span>
                      <span className="text-sm font-semibold text-gray-800">{selectedExpense.department}</span>
                    </div>
                  )}

                  {/* Expense Lines */}
                  {selectedExpense.expenses && selectedExpense.expenses.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">Expense Lines</p>
                      <div className="space-y-2">
                        {selectedExpense.expenses.map((line, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-b-0">
                            <div>
                              <p className="text-sm font-medium text-gray-700">{line.expense_type}</p>
                              {line.description && (
                                <p className="text-xs text-gray-400">{line.description}</p>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-gray-800">{formatAmount(line.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Approve / Reject Buttons */}
                <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleApprove(selectedExpense.name)}
                    disabled={processingId === selectedExpense.name}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ background: "#16a34a", opacity: processingId === selectedExpense.name ? 0.6 : 1 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleReject(selectedExpense.name)}
                    disabled={processingId === selectedExpense.name}
                    className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ background: "#dc2626", opacity: processingId === selectedExpense.name ? 0.6 : 1 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Snackbar */}
      <AnimatePresence>
        {snackbar && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl text-white text-sm font-medium"
            style={{ background: snackbar.type === "success" ? "#16a34a" : "#dc2626" }}
          >
            {snackbar.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseApprovals;
