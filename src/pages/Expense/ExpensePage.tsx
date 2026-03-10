import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { getExpenseType, getExpenseList, ExpenseType, ExpenseGroupedList } from "../../services/expense.service";

// Expense types
interface ExpenseClaim {
  id: string;
  expense_type: string;
  amount: number;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
  description: string;
}

// Dropdown options
type ExpenseView = "my_expenses" | "apply_expense" | "expense_types";

const ExpensePage = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const [activeView, setActiveView] = useState<ExpenseView>("my_expenses");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // API Data state
  const [apiExpenseTypes, setApiExpenseTypes] = useState<ExpenseType[]>([]);
  const [expenseList, setExpenseList] = useState<ExpenseGroupedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch expense data on mount
  useEffect(() => {
    const fetchExpenseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("[ExpensePage] Fetching expense data...");
        
        // Fetch all expense data in parallel
        const [types, expenses] = await Promise.all([
          getExpenseType(),
          getExpenseList()
        ]);
        
        console.log("[ExpensePage] Expense types:", types);
        console.log("[ExpensePage] Expense list:", expenses);
        
        setApiExpenseTypes(types);
        setExpenseList(expenses);
      } catch (err: any) {
        console.error("[ExpensePage] Failed to fetch expense data:", err);
        setError(err.message || "Failed to load expense data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpenseData();
  }, []);

  const expenseOptions: { key: ExpenseView; label: string; icon: ReactNode }[] = [
    { key: "my_expenses", label: t("myExpenses"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { key: "expense_types", label: t("expenseTypes"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
  ];

  // Dummy expense data
  const expenses: ExpenseClaim[] = [
    {
      id: "EXP-001",
      expense_type: "Travel",
      amount: 250,
      date: "2024-01-15",
      status: "Approved",
      description: "Client meeting travel expenses",
    },
    {
      id: "EXP-002",
      expense_type: "Meals",
      amount: 85,
      date: "2024-01-18",
      status: "Pending",
      description: "Team lunch",
    },
    {
      id: "EXP-003",
      expense_type: "Office Supplies",
      amount: 120,
      date: "2024-01-20",
      status: "Rejected",
      description: "Stationery items",
    },
  ];

  const expenseTypes = [
    { name: "Travel", icon: "✈️", description: "Flight, taxi, fuel costs" },
    { name: "Meals", icon: "🍽️", description: "Business meals" },
    { name: "Office Supplies", icon: "📎", description: "Stationery and office items" },
    { name: "Communication", icon: "📱", description: "Phone and internet bills" },
    { name: "Accommodation", icon: "🏨", description: "Hotel and lodging" },
    { name: "Training", icon: "📚", description: "Courses and certifications" },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
    Approved: { bg: "bg-green-100", text: "text-green-700" },
    Rejected: { bg: "bg-red-100", text: "text-red-700" },
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const currentOption = expenseOptions.find((opt) => opt.key === activeView);

  // Calculate totals
  const totalApproved = expenses
    .filter((e) => e.status === "Approved")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPending = expenses
    .filter((e) => e.status === "Pending")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalRejected = expenses
    .filter((e) => e.status === "Rejected")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalClaims = expenses.length;

  // Dashboard stats cards
  const statsCards = [
    { label: t("approved"), value: `${totalApproved}`, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "bg-green-50", textColor: "text-green-600" },
    { label: t("pending"), value: `${totalPending}`, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "bg-yellow-50", textColor: "text-yellow-600" },
    { label: t("rejected"), value: `${totalRejected}`, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "bg-red-50", textColor: "text-red-600" },
    { label: t("totalClaims"), value: totalClaims, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, color: "bg-indigo-50", textColor: "text-indigo-600" },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("expense")}</h1>
          <button
            onClick={() => setActiveView("apply_expense")}
            className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-black rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">{t("applyExpense")}</span>
          </button>
        </div>

        {/* Dashboard Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.color} rounded-2xl p-4 text-center`}
            >
              <p className={`text-lg font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
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
                {expenseOptions.map((option) => (
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

      {/* My Expenses View */}
      {activeView === "my_expenses" && (
        <div className={`shadow-lg overflow-hidden ${theme === 'neon-green' ? 'neon-card' : 'bg-white rounded-2xl'}`}>
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>{t("noExpenseClaims")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {expenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-800">{expense.expense_type}</h4>
                      <p className="text-sm text-gray-500">{expense.id}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[expense.status].bg
                      } ${statusColors[expense.status].text}`}
                    >
                      {expense.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">{formatDate(expense.date)}</p>
                    <p className="font-bold text-gray-800">${expense.amount}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{expense.description}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Apply Expense View */}
      {activeView === "apply_expense" && (
        <div className={`shadow-lg p-4 space-y-4 ${theme === 'neon-green' ? 'neon-card' : 'bg-white rounded-2xl'}`}>
          <h2 className="font-semibold text-gray-800 mb-4">{t("newExpenseClaim")}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("expenseType")}</label>
            <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50">
              {expenseTypes.map((type) => (
                <option key={type.name}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("amount")}</label>
            <input
              type="number"
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              placeholder={t("enterAmount")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("date")}</label>
            <input type="date" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("description")}</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              placeholder={t("enterDescription")}
            />
          </div>

          <button className="w-full bg-indigo-600 text-black py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            {t("submitClaim")}
          </button>
        </div>
      )}

      {/* Expense Types View */}
      {activeView === "expense_types" && (
        <div className="space-y-4">
          {expenseTypes.map((type, index) => (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4"
            >
              <span className="text-3xl">{type.icon}</span>
              <div>
                <h4 className="font-medium text-gray-800">{type.name}</h4>
                <p className="text-sm text-gray-500">{type.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpensePage;
