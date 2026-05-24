import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../auth/useAuth";
import api from "../../services/api";
import { getUserCredentials, getAuthHeader } from "../../services/expense.service";

interface ExpenseFormProps {
  onClose: () => void;
}

interface ExpenseItem {
  expense_date: string;
  expense_type: string;
  default_account: string;
  amount: number;
  sanctioned_amount: number;
  cost_center: string;
  description?: string;
}

interface TaxItem {
  account_head: string;
  rate: number;
  tax_amount: number;
  description: string;
  cost_center: string;
}

interface FormData {
  posting_date: string;
  payable_account: string;
  cost_center: string;
  clearance_date: string;
  employee: string;
  expense_approver: string;
  expenses: ExpenseItem[];
  taxes: TaxItem[];
}

const ExpenseForm = ({ onClose }: ExpenseFormProps) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme !== "light";
  const { user } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    posting_date: new Date().toISOString().split("T")[0],
    payable_account: "",
    cost_center: "",
    clearance_date: new Date().toISOString().split("T")[0],
    employee: "",
    expense_approver: "",
    expenses: [],
    taxes: [],
  });

  const [payableAccounts, setPayableAccounts] = useState<string[]>([]);
  const [costCenters, setCostCenters] = useState<string[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<{ name: string; expense_type: string }[]>([]);
  const [accountHeads, setAccountHeads] = useState<string[]>([]);

  const [showExpenseItemSheet, setShowExpenseItemSheet] = useState(false);
  const [showTaxSheet, setShowTaxSheet] = useState(false);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState<number | null>(null);
  const [editingTaxIndex, setEditingTaxIndex] = useState<number | null>(null);

  const [currentExpenseItem, setCurrentExpenseItem] = useState<ExpenseItem>({
    expense_date: new Date().toISOString().split("T")[0],
    expense_type: "",
    default_account: "",
    amount: 0,
    sanctioned_amount: 0,
    cost_center: "",
    description: "",
  });

  const [currentTaxItem, setCurrentTaxItem] = useState<TaxItem>({
    account_head: "",
    rate: 0,
    tax_amount: 0,
    description: "",
    cost_center: "",
  });

  // Custom dropdown states (to match LeavePage style)
  const [payableAccountDropdownOpen, setPayableAccountDropdownOpen] = useState(false);
  const [costCenterDropdownOpen, setCostCenterDropdownOpen] = useState(false);
  const [expenseTypeDropdownOpen, setExpenseTypeDropdownOpen] = useState(false);
  const [accountHeadDropdownOpen, setAccountHeadDropdownOpen] = useState(false);

  const RiyalIcon = ({ size = "4" }: { size?: string }) => (
    <img
      src={isDark ? "/images/riyalwhite.png" : "/images/riyaldark.png"}
      alt="Riyal"
      className={`h-${size} w-${size} inline-block align-middle mr-1 flex-shrink-0`}
    />
  );

  // Calculations
  const totalClaimedAmount = formData.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalTaxes = formData.taxes.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
  const grandTotal = totalClaimedAmount + totalTaxes;

  // Fetch logged-in employee details and auto-populate fields
  useEffect(() => {
    const loadEmployeeDetails = async () => {
      if (!user?.employeeId) return;

      try {
        const { companyUrl, apiKey, apiSecret } = getUserCredentials();
        const cleanUrl = companyUrl.replace(/\/$/, "");
        const employeeId = user.employeeId;

        // Fetch Employee with common fields for expense claim defaults
        const empUrl = `${cleanUrl}/api/resource/Employee/${encodeURIComponent(employeeId)}?fields=["name","expense_approver","cost_center","company","default_payable_account"]`;
        const empRes = await api.get(empUrl, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(apiKey, apiSecret),
          },
        });

        const emp = (empRes.data as any)?.data;
        if (emp) {
          setFormData((prev) => ({
            ...prev,
            employee: emp.name || employeeId,
            expense_approver: emp.expense_approver || "",
            cost_center: emp.cost_center || prev.cost_center,
            payable_account: emp.default_payable_account || prev.payable_account,
          }));
        }
      } catch (err) {
        console.error("[ExpenseForm] Failed to fetch employee details for auto-populate", err);
      }
    };

    loadEmployeeDetails();
  }, [user]);

  // Fetch dropdown data from Frappe
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const { companyUrl, apiKey, apiSecret } = getUserCredentials();
        const cleanUrl = companyUrl.replace(/\/$/, "");
        const headers = {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        };

        // Payable Account + Default Account + Account Head (same query)
        const accountUrl = `${cleanUrl}/api/resource/Account?fields=["name"]&filters=[["is_group","=",0]]&limit_page_length=1000`;
        const accountRes = await api.get(accountUrl, { headers });
        const accounts = (accountRes.data as any)?.data?.map((a: any) => a.name) || [];
        setPayableAccounts(accounts);
        setAccountHeads(accounts);

        // Cost Center
        const ccUrl = `${cleanUrl}/api/resource/Cost%20Center?fields=["name"]&limit_page_length=1000`;
        const ccRes = await api.get(ccUrl, { headers });
        const ccs = (ccRes.data as any)?.data?.map((c: any) => c.name) || [];
        setCostCenters(ccs);

        // Expense Claim Type
        const typeUrl = `${cleanUrl}/api/resource/Expense%20Claim%20Type?fields=["name","expense_type"]&limit_page_length=1000`;
        const typeRes = await api.get(typeUrl, { headers });
        const types = (typeRes.data as any)?.data || [];
        setExpenseTypes(types);
      } catch (err) {
        console.error("[ExpenseForm] Failed to load dropdowns", err);
      }
    };

    loadDropdowns();
  }, []);

  // Open / Edit Expense Item
  const openExpenseItem = (index?: number) => {
    if (index !== undefined) {
      setEditingExpenseIndex(index);
      setCurrentExpenseItem({ ...formData.expenses[index] });
    } else {
      setEditingExpenseIndex(null);
      setCurrentExpenseItem({
        expense_date: new Date().toISOString().split("T")[0],
        expense_type: "",
        default_account: "",
        amount: 0,
        sanctioned_amount: 0,
        cost_center: "",
      });
    }
    setShowExpenseItemSheet(true);
  };

  const saveExpenseItem = () => {
    if (!currentExpenseItem.expense_date || !currentExpenseItem.expense_type || !currentExpenseItem.amount) {
      alert("Expense Date, Expense Type and Amount are required");
      return;
    }

    const updated = [...formData.expenses];
    if (editingExpenseIndex !== null) {
      updated[editingExpenseIndex] = { ...currentExpenseItem };
    } else {
      updated.push({ ...currentExpenseItem });
    }

    setFormData((prev) => ({ ...prev, expenses: updated }));
    setShowExpenseItemSheet(false);
    setEditingExpenseIndex(null);
  };

  const deleteExpenseItem = (index: number) => {
    if (!confirm("Delete this item?")) return;
    const updated = formData.expenses.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, expenses: updated }));
  };

  // Open / Edit Tax
  const openTax = (index?: number) => {
    if (index !== undefined) {
      setEditingTaxIndex(index);
      setCurrentTaxItem({ ...formData.taxes[index] });
    } else {
      setEditingTaxIndex(null);
      setCurrentTaxItem({
        account_head: "",
        rate: 0,
        tax_amount: 0,
        description: "",
        cost_center: "",
      });
    }
    setShowTaxSheet(true);
  };

  const saveTax = () => {
    if (!currentTaxItem.account_head) {
      alert("Account Head is required");
      return;
    }

    const updated = [...formData.taxes];
    if (editingTaxIndex !== null) {
      updated[editingTaxIndex] = { ...currentTaxItem };
    } else {
      updated.push({ ...currentTaxItem });
    }

    setFormData((prev) => ({ ...prev, taxes: updated }));
    setShowTaxSheet(false);
    setEditingTaxIndex(null);
  };

  const deleteTax = (index: number) => {
    if (!confirm("Delete this tax?")) return;
    const updated = formData.taxes.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, taxes: updated }));
  };

  // Custom dropdown handlers (matching LeavePage.tsx pattern)
  const handlePayableAccountSelect = (value: string) => {
    setFormData((p) => ({ ...p, payable_account: value }));
    setPayableAccountDropdownOpen(false);
  };

  const handleCostCenterSelect = (value: string) => {
    setFormData((p) => ({ ...p, cost_center: value }));
    setCostCenterDropdownOpen(false);
  };

  const handleExpenseTypeSelect = (value: string) => {
    setCurrentExpenseItem((p) => ({ ...p, expense_type: value }));
    setExpenseTypeDropdownOpen(false);
  };

  const handleAccountHeadSelect = (value: string) => {
    setCurrentTaxItem((p) => ({ ...p, account_head: value }));
    setAccountHeadDropdownOpen(false);
  };

  // Submit to Frappe
  const handleSubmit = async () => {
    if (formData.expenses.length === 0) {
      alert("Please add at least one expense item");
      return;
    }

    try {
      const { companyUrl, apiKey, apiSecret } = getUserCredentials();
      const cleanUrl = companyUrl.replace(/\/$/, "");

      const payload = {
        doctype: "Expense Claim",
        employee: formData.employee,
        expense_approver: formData.expense_approver,
        posting_date: formData.posting_date,
        payable_account: formData.payable_account,
        cost_center: formData.cost_center,
        clearance_date: formData.clearance_date,
        expenses: formData.expenses.map((item) => ({
          ...item,
          cost_center: formData.cost_center || item.cost_center,
          default_account: formData.payable_account || item.default_account,
        })),
        taxes: formData.taxes.map((item) => ({
          ...item,
          cost_center: formData.cost_center || item.cost_center,
        })),
      };

      const url = `${cleanUrl}/api/resource/Expense%20Claim`;
      await api.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
      });

      alert("Expense Claim submitted successfully!");
      onClose();
    } catch (error: any) {
      console.error("[ExpenseForm] Submit failed:", error);
      alert(error.message || "Failed to submit. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={`fixed inset-0 z-[200] flex flex-col ${isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}
    >
      {/* Header */}
      <div className={`flex items-center px-4 py-3 border-b flex-shrink-0 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-indigo-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex-1 text-center font-semibold">New Expense Claim</div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-32">
        {/* SECTION 1: Expense Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Expense Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Posting Date *</label>
              <input
                type="date"
                value={formData.posting_date}
                onChange={(e) => setFormData((p) => ({ ...p, posting_date: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Payable Account</label>
              <div className="relative w-full" data-dropdown>
                <button
                  type="button"
                  onClick={() => setPayableAccountDropdownOpen(!payableAccountDropdownOpen)}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-left flex items-center justify-between"
                >
                  <span className={formData.payable_account ? "text-gray-800" : "text-gray-400"}>
                    {formData.payable_account || "Select Account"}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${payableAccountDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {payableAccountDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {payableAccounts.length === 0 ? (
                      <p className="p-3 text-sm text-gray-400">No accounts available</p>
                    ) : (
                      payableAccounts.map((acc) => (
                        <div
                          key={acc}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handlePayableAccountSelect(acc);
                          }}
                          className={`w-full p-3 text-left hover:bg-indigo-50 transition-colors cursor-pointer ${
                            formData.payable_account === acc
                              ? "bg-indigo-50 text-indigo-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {acc}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Cost Center</label>
              <div className="relative w-full" data-dropdown>
                <button
                  type="button"
                  onClick={() => setCostCenterDropdownOpen(!costCenterDropdownOpen)}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-left flex items-center justify-between"
                >
                  <span className={formData.cost_center ? "text-gray-800" : "text-gray-400"}>
                    {formData.cost_center || "Select Cost Center"}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${costCenterDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {costCenterDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {costCenters.length === 0 ? (
                      <p className="p-3 text-sm text-gray-400">No cost centers available</p>
                    ) : (
                      costCenters.map((cc) => (
                        <div
                          key={cc}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleCostCenterSelect(cc);
                          }}
                          className={`w-full p-3 text-left hover:bg-indigo-50 transition-colors cursor-pointer ${
                            formData.cost_center === cc
                              ? "bg-indigo-50 text-indigo-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {cc}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Clearance Date</label>
              <input
                type="date"
                value={formData.clearance_date}
                onChange={(e) => setFormData((p) => ({ ...p, clearance_date: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Expense Items */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Expense Items</h3>
            <button
              onClick={() => openExpenseItem()}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg flex items-center gap-1"
            >
              + Add Item
            </button>
          </div>

          {formData.expenses.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500 border border-dashed rounded-xl">No items added</div>
          )}

          <div className="space-y-3">
            {formData.expenses.map((item, index) => (
              <div key={index} className={`p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{item.expense_type}</div>
                    <div className="text-xs text-gray-500">{item.default_account}</div>
                    <div className="text-xs mt-1 flex items-center gap-1">
                      {item.expense_date} • Claimed: <RiyalIcon size="4" /> {item.amount}
                      {item.sanctioned_amount > 0 && item.sanctioned_amount !== item.amount && (
                        <> • Sanctioned: <RiyalIcon size="4" /> {item.sanctioned_amount}</>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openExpenseItem(index)} className="text-indigo-600">✏️</button>
                    <button onClick={() => deleteExpenseItem(index)} className="text-red-500">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Taxes */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Taxes</h3>
            <button
              onClick={() => openTax()}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg flex items-center gap-1"
            >
              + Add Tax
            </button>
          </div>

          {formData.taxes.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500 border border-dashed rounded-xl">No taxes added</div>
          )}

          <div className="space-y-3">
            {formData.taxes.map((tax, index) => (
              <div key={index} className={`p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{tax.account_head}</div>
                    <div className="text-xs text-gray-500">{tax.description}</div>
                    <div className="text-xs mt-1 flex items-center gap-1">
                      <RiyalIcon size="4" /> {tax.tax_amount}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openTax(index)} className="text-indigo-600">✏️</button>
                    <button onClick={() => deleteTax(index)} className="text-red-500">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Summary */}
      <div className={`sticky bottom-0 p-4 border-t space-y-1 text-sm ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex justify-between">
          <span>Total Claimed Amount</span>
          <span className="font-medium flex items-center"><RiyalIcon size="4" />{totalClaimedAmount}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Taxes and Charges</span>
          <span className="font-medium flex items-center"><RiyalIcon size="4" />{totalTaxes}</span>
        </div>
        <div className="flex justify-between font-bold pt-2 border-t">
          <span>Grand Total</span>
          <span className="flex items-center"><RiyalIcon size="5" />{grandTotal}</span>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-3 w-full py-3 bg-indigo-600 text-white rounded-xl font-medium"
        >
          Submit Expense Claim
        </button>
      </div>

      {/* Bottom Sheet - Expense Item */}
      <AnimatePresence>
        {showExpenseItemSheet && (
          <>
            <div className="fixed inset-0 bg-black/50 z-[210]" onClick={() => setShowExpenseItemSheet(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`fixed bottom-0 left-0 right-0 z-[220] p-5 rounded-t-3xl ${isDark ? "bg-gray-900" : "bg-white"} max-h-[80vh] overflow-auto`}
            >
              <h4 className="font-semibold mb-4">{editingExpenseIndex !== null ? "Edit Item" : "Add Expense Item"}</h4>

              <div className="space-y-4">
                {/* Expense Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Expense Date *</label>
                  <input type="date" value={currentExpenseItem.expense_date} onChange={(e) => setCurrentExpenseItem(p => ({...p, expense_date: e.target.value}))} className="w-full p-3 border rounded-xl bg-gray-50" />
                </div>
                
                {/* Expense Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Expense Type *</label>
                  <div className="relative w-full" data-dropdown>
                    <button
                      type="button"
                      onClick={() => setExpenseTypeDropdownOpen(!expenseTypeDropdownOpen)}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-left flex items-center justify-between"
                    >
                      <span className={currentExpenseItem.expense_type ? "text-gray-800" : "text-gray-400"}>
                        {currentExpenseItem.expense_type || "Select Expense Type"}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expenseTypeDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expenseTypeDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {expenseTypes.length === 0 ? (
                          <p className="p-3 text-sm text-gray-400">No expense types available</p>
                        ) : (
                          expenseTypes.map((t) => (
                            <div
                              key={t.name}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleExpenseTypeSelect(t.expense_type);
                              }}
                              className={`w-full p-3 text-left hover:bg-indigo-50 transition-colors cursor-pointer ${
                                currentExpenseItem.expense_type === t.expense_type
                                  ? "bg-indigo-50 text-indigo-600 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              {t.expense_type}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Amount *</label>
                  <input type="number" placeholder="Amount *" value={currentExpenseItem.amount} onChange={(e) => setCurrentExpenseItem(p => ({...p, amount: parseFloat(e.target.value) || 0}))} className="w-full p-3 border rounded-xl bg-gray-50" />
                </div>

                {/* Sanctioned Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Sanctioned Amount</label>
                  <input 
                    type="number" 
                    placeholder="Sanctioned Amount" 
                    value={currentExpenseItem.sanctioned_amount} 
                    onChange={(e) => setCurrentExpenseItem(p => ({...p, sanctioned_amount: parseFloat(e.target.value) || 0}))} 
                    className="w-full p-3 border rounded-xl bg-gray-50" 
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                  <textarea 
                    placeholder="Description" 
                    value={currentExpenseItem.description || ""} 
                    onChange={(e) => setCurrentExpenseItem(p => ({...p, description: e.target.value}))} 
                    className="w-full p-3 border rounded-xl bg-gray-50 resize-y" 
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowExpenseItemSheet(false)} className="flex-1 py-3 border rounded-xl">Cancel</button>
                <button onClick={saveExpenseItem} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl">Save Item</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Sheet - Tax */}
      <AnimatePresence>
        {showTaxSheet && (
          <>
            <div className="fixed inset-0 bg-black/50 z-[210]" onClick={() => setShowTaxSheet(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`fixed bottom-0 left-0 right-0 z-[220] p-5 rounded-t-3xl ${isDark ? "bg-gray-900" : "bg-white"} max-h-[80vh] overflow-auto`}
            >
              <h4 className="font-semibold mb-4">{editingTaxIndex !== null ? "Edit Tax" : "Add Tax"}</h4>

              <div className="space-y-4">
                {/* Account Head */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Account Head *</label>
                  <div className="relative w-full" data-dropdown>
                    <button
                      type="button"
                      onClick={() => setAccountHeadDropdownOpen(!accountHeadDropdownOpen)}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-left flex items-center justify-between"
                    >
                      <span className={currentTaxItem.account_head ? "text-gray-800" : "text-gray-400"}>
                        {currentTaxItem.account_head || "Select Account Head"}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${accountHeadDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {accountHeadDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {accountHeads.length === 0 ? (
                          <p className="p-3 text-sm text-gray-400">No accounts available</p>
                        ) : (
                          accountHeads.map((a) => (
                            <div
                              key={a}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAccountHeadSelect(a);
                              }}
                              className={`w-full p-3 text-left hover:bg-indigo-50 transition-colors cursor-pointer ${
                                currentTaxItem.account_head === a
                                  ? "bg-indigo-50 text-indigo-600 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              {a}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tax Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tax Rate (%)</label>
                  <input type="number" placeholder="Rate (%)" value={currentTaxItem.rate} onChange={(e) => setCurrentTaxItem(p => ({...p, rate: parseFloat(e.target.value) || 0}))} className="w-full p-3 border rounded-xl bg-gray-50" />
                </div>

                {/* Tax Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tax Amount</label>
                  <input type="number" placeholder="Tax Amount" value={currentTaxItem.tax_amount} onChange={(e) => setCurrentTaxItem(p => ({...p, tax_amount: parseFloat(e.target.value) || 0}))} className="w-full p-3 border rounded-xl bg-gray-50" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                  <input type="text" placeholder="Description" value={currentTaxItem.description} onChange={(e) => setCurrentTaxItem(p => ({...p, description: e.target.value}))} className="w-full p-3 border rounded-xl bg-gray-50" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowTaxSheet(false)} className="flex-1 py-3 border rounded-xl">Cancel</button>
                <button onClick={saveTax} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl">Save Tax</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExpenseForm;
