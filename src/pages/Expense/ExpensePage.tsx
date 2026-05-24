import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  getExpenseType,
  getExpenseList,
  ExpenseType,
  ExpenseGroupedList,
  ExpenseClaim,
} from "../../services/expense.service";
import ExpenseForm from "./ExpenseForm";

// ── Skeleton Loaders (styled like LeavePage) ────────────────────────────────
const StatCardSkeleton = () => (
  <div className="bg-gray-100 rounded-2xl p-4 text-center animate-pulse">
    <div className="h-6 w-8 bg-gray-200 rounded mx-auto mb-2" />
    <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
  </div>
);

const ExpenseRowSkeleton = () => (
  <div className="p-4 animate-pulse">
    <div className="flex items-start justify-between mb-2">
      <div>
        <div className="h-4 w-28 bg-gray-200 rounded mb-1" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded-full" />
    </div>
    <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
    <div className="h-3 w-12 bg-gray-200 rounded" />
  </div>
);

// ── Icons ────────────────────────────────────────────────────────────────
const Icons = {
  add: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  search: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  empty: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  chevronRight: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  travel: "✈️",
  meals: "🍽️",
  office: "📎",
  communication: "📱",
  accommodation: "🏨",
  other: "💰",
};

const getCategoryIcon = (type: string): string => {
  const lower = type.toLowerCase();
  if (lower.includes("travel")) return Icons.travel;
  if (lower.includes("meal") || lower.includes("food")) return Icons.meals;
  if (lower.includes("office") || lower.includes("stationery")) return Icons.office;
  if (lower.includes("communi") || lower.includes("phone") || lower.includes("internet")) return Icons.communication;
  if (lower.includes("accommodation") || lower.includes("hotel")) return Icons.accommodation;
  return Icons.other;
};

// ── Main Component ───────────────────────────────────────────────────────
const ExpensePage = () => {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const isDark = theme !== "light";

  // State
  const [loading, setLoading] = useState(true);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [expenseGroups, setExpenseGroups] = useState<ExpenseGroupedList[]>([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseClaim | null>(null);

  // Fetch data (only existing service methods)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [types, groups] = await Promise.all([
          getExpenseType(),
          getExpenseList(),
        ]);
        setExpenseTypes(types || []);
        setExpenseGroups(groups || []);
      } catch (error) {
        console.error("[ExpensePage] Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Flat list for calculations (existing data only)
  const allExpenses = useMemo(() => {
    if (!Array.isArray(expenseGroups)) return [];
    return expenseGroups.flatMap((group) => group?.expenses ?? []);
  }, [expenseGroups]);

  // Summary calculations from existing getExpenseList data
  const totalExpenses = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Helper to normalize status (Draft counts as Pending)
  const getNormalizedStatus = (expense: any) => {
    const s = (expense.approval_status || expense.status || "").toLowerCase().trim();
    if (s === "draft") return "pending";
    return s;
  };

  const pendingAmount = allExpenses.filter((e) => getNormalizedStatus(e) === "pending").reduce((sum, e) => sum + (e.amount || 0), 0);
  const approvedAmount = allExpenses.filter((e) => getNormalizedStatus(e) === "approved").reduce((sum, e) => sum + (e.amount || 0), 0);
  const rejectedAmount = allExpenses.filter((e) => getNormalizedStatus(e) === "rejected").reduce((sum, e) => sum + (e.amount || 0), 0);

  // No client-side filtering (search & filters removed as per request)
  // We render directly from the grouped data returned by the service

  // Status badge with spec colors (Pending=orange, Approved=green, Rejected=red, Submitted=blue)
  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "approved") {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Approved</span>;
    }
    if (s === "rejected") {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejected</span>;
    }
    if (s === "pending" || s === "draft") {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Pending</span>;
    }
    if (s === "submitted") {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Submitted</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status || "Unknown"}</span>;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Riyal icon (exact helper from requirements, light/dark aware)
  const RiyalIcon = ({ size = "4" }: { size?: string }) => (
    <img
      src={isDark ? "/images/riyalwhite.png" : "/images/riyaldark.png"}
      alt="Riyal"
      className={`h-${size} w-${size} inline-block align-middle mr-1 flex-shrink-0`}
    />
  );

  // Detail row helper (matches LeavePage)
  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between py-1">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {/* ── Header Row (exactly like Leave) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("expense") || "Expenses"}</h1>
          <button
            type="button"
            onClick={() => setShowApplyForm(true)}
            className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {Icons.add}
            <span className="text-sm font-medium">Create Expense</span>
          </button>
        </div>

        {/* ── Summary Cards (4 cards like Leave, using existing data) ── */}
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {/* Total */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="bg-indigo-50 rounded-2xl p-4 text-center"
            >
              <p className="text-xl font-bold text-indigo-600 flex items-center justify-center gap-1">
                <RiyalIcon size="5" />
                {totalExpenses.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total</p>
            </motion.div>

            {/* Pending */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-orange-50 rounded-2xl p-4 text-center"
            >
              <p className="text-xl font-bold text-orange-600 flex items-center justify-center gap-1">
                <RiyalIcon size="5" />
                {pendingAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Pending</p>
            </motion.div>

            {/* Approved */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-green-50 rounded-2xl p-4 text-center"
            >
              <p className="text-xl font-bold text-green-600 flex items-center justify-center gap-1">
                <RiyalIcon size="5" />
                {approvedAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Approved</p>
            </motion.div>

            {/* Rejected */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-red-50 rounded-2xl p-4 text-center"
            >
              <p className="text-xl font-bold text-red-600 flex items-center justify-center gap-1">
                <RiyalIcon size="5" />
                {rejectedAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Rejected</p>
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Expense List - styled exactly like LeavePage requests list ── */}
      <div className={`shadow-lg ${theme === "neon-green" ? "neon-card" : "bg-white rounded-2xl"}`}>
        <div className="p-4 space-y-4">
          {expenseGroups.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No expense claims found</p>
          ) : (
            expenseGroups.map((group) => (
              <div key={group.month_year}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {group.month_year}
                </h3>
                <div className="space-y-2">
                  {group.expenses.map((expense, idx) => (
                    <motion.div
                      key={expense.name || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedExpense(expense)}
                      className="p-3 rounded-xl cursor-pointer transition-colors hover:bg-indigo-50 border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCategoryIcon(expense.expense_type)}</span>
                          <span className="font-medium text-gray-800 text-sm">{expense.expense_type}</span>
                        </div>
                        {getStatusBadge(expense.approval_status || expense.status)}
                      </div>

                      {expense.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mb-1">{expense.description}</p>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{formatDate(expense.expense_date)}</span>
                        <span className="font-semibold text-gray-800 flex items-center gap-1">
                          <RiyalIcon size="4" />
                          {expense.amount?.toLocaleString() || "0"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>



      {/* ── Full-screen Expense Creation Form (mobile-first slide-in) ── */}
      <AnimatePresence>
        {showApplyForm && (
          <ExpenseForm onClose={() => setShowApplyForm(false)} />
        )}
      </AnimatePresence>

      {/* ── Expense Detail Modal (matches Leave style) ── */}
      <AnimatePresence>
        {selectedExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[15vh] px-4 pb-4 overflow-y-auto"
            onClick={() => setSelectedExpense(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold text-gray-800 text-base">
                    {selectedExpense.expense_type}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedExpense.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedExpense(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Details */}
              <div className="px-5 py-4 space-y-1">
                <DetailRow label="Type" value={selectedExpense.expense_type} />
                <DetailRow label="Date" value={formatDate(selectedExpense.expense_date)} />
                <DetailRow
                  label="Amount"
                  value={
                    <span className="font-semibold flex items-center gap-1">
                      <RiyalIcon size="4" />
                      {selectedExpense.amount?.toLocaleString() || "0"}
                    </span>
                  }
                />
                <DetailRow
                  label="Status"
                  value={
                    <span
                      className={
                        selectedExpense.approval_status === "Approved"
                          ? "text-green-600"
                          : selectedExpense.approval_status === "Rejected"
                          ? "text-red-600"
                          : selectedExpense.approval_status === "Pending"
                          ? "text-orange-600"
                          : "text-blue-600"
                      }
                    >
                      {selectedExpense.approval_status || selectedExpense.status}
                    </span>
                  }
                />
                {selectedExpense.description && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Description</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedExpense.description}</p>
                  </div>
                )}
                {selectedExpense.employee_name && (
                  <DetailRow label="Employee" value={selectedExpense.employee_name} />
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="w-full py-3 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpensePage;
