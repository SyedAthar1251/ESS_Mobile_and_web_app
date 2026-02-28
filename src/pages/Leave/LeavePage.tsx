import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";

// Leave types
interface LeaveRequest {
  id: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_days: number;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
}

interface LeaveBalance {
  leave_type: string;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
  color: string;
}

// Dropdown options
type LeaveView = "leave_balance" | "my_requests" | "apply_leave";

const LeavePage = () => {
  const { language, t } = useLanguage();
  const [activeView, setActiveView] = useState<LeaveView>("leave_balance");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);

  const leaveOptions: { key: LeaveView; label: string; icon: ReactNode }[] = [
    { key: "leave_balance", label: t("leaveBalance"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    { key: "my_requests", label: t("myRequests"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { key: "apply_leave", label: t("applyLeave"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
  ];

  // Dummy data for leave balance with colors
  const leaveBalances: LeaveBalance[] = [
    { leave_type: t("annualLeave"), allocated: 20, used: 5, pending: 2, remaining: 13, color: "indigo" },
    { leave_type: t("sickLeave"), allocated: 10, used: 2, pending: 0, remaining: 8, color: "red" },
    { leave_type: t("casualLeave"), allocated: 5, used: 1, pending: 1, remaining: 3, color: "amber" },
    { leave_type: t("maternityLeave"), allocated: 90, used: 0, pending: 0, remaining: 90, color: "pink" },
  ];

  // Dummy data for leave requests
  const leaveRequests: LeaveRequest[] = [
    {
      id: "LR-001",
      leave_type: t("annualLeave"),
      from_date: "2024-02-15",
      to_date: "2024-02-20",
      total_days: 5,
      status: "Pending",
      reason: "Family vacation",
    },
    {
      id: "LR-002",
      leave_type: t("sickLeave"),
      from_date: "2024-01-10",
      to_date: "2024-01-11",
      total_days: 2,
      status: "Approved",
      reason: "Medical appointment",
    },
    {
      id: "LR-003",
      leave_type: t("casualLeave"),
      from_date: "2024-01-05",
      to_date: "2024-01-05",
      total_days: 1,
      status: "Rejected",
      reason: "Personal work",
    },
  ];

  // Calculate totals
  const totalAllocated = leaveBalances.reduce((sum, b) => sum + b.allocated, 0);
  const totalUsed = leaveBalances.reduce((sum, b) => sum + b.used, 0);
  const totalPending = leaveBalances.reduce((sum, b) => sum + b.pending, 0);
  const totalRemaining = leaveBalances.reduce((sum, b) => sum + b.remaining, 0);

  const statusColors: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
    Approved: { bg: "bg-green-100", text: "text-green-700" },
    Rejected: { bg: "bg-red-100", text: "text-red-700" },
  };

  // Dashboard stats cards
  const statsCards = [
    { label: t("totalAllocated"), value: totalAllocated, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, color: "bg-indigo-50", textColor: "text-indigo-600" },
    { label: t("used"), value: totalUsed, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "bg-red-50", textColor: "text-red-600" },
    { label: t("pending"), value: totalPending, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "bg-yellow-50", textColor: "text-yellow-600" },
    { label: t("remaining"), value: totalRemaining, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>, color: "bg-green-50", textColor: "text-green-600" },
  ];

  const currentOption = leaveOptions.find((opt) => opt.key === activeView);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("leave") || "Leave"}</h1>
          <span className="text-sm text-gray-500">{leaveRequests.length} {t("requests")}</span>
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
              <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
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
                {leaveOptions.map((option) => (
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

      {/* Leave Balance View */}
      {activeView === "leave_balance" && (
        <div className="space-y-4">
          {leaveBalances.map((balance, index) => (
            <motion.div
              key={balance.leave_type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-4"
            >
              <h3 className="font-semibold text-gray-800 mb-3">{balance.leave_type}</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-400">Allocated</p>
                  <p className="font-bold text-gray-800">{balance.allocated}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-xs text-red-400">Used</p>
                  <p className="font-bold text-red-600">{balance.used}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2">
                  <p className="text-xs text-yellow-400">Pending</p>
                  <p className="font-bold text-yellow-600">{balance.pending}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs text-green-400">Remaining</p>
                  <p className="font-bold text-green-600">{balance.remaining}</p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${(balance.used / balance.allocated) * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* My Requests View */}
      {activeView === "my_requests" && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {leaveRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>{t("noLeaveRequests")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {leaveRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-800">{request.leave_type}</h4>
                      <p className="text-sm text-gray-500">{request.id}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[request.status].bg
                      } ${statusColors[request.status].text}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      {formatDate(request.from_date)} - {formatDate(request.to_date)}
                    </p>
                    <p className="text-gray-400">{request.total_days} day(s)</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Apply Leave View */}
      {activeView === "apply_leave" && (
        <div className="bg-white rounded-2xl shadow-lg p-4 space-y-4">
          <h2 className="font-semibold text-gray-800 mb-4">{t("newLeaveApplication")}</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("leaveType")}</label>
            <select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50">
              <option>{t("annualLeave")}</option>
              <option>{t("sickLeave")}</option>
              <option>{t("casualLeave")}</option>
              <option>{t("unpaidLeave")}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t("fromDate")}</label>
              <input type="date" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t("toDate")}</label>
              <input type="date" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t("reason")}</label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50"
              placeholder={t("enterReason")}
            />
          </div>

          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            {t("submitApplication")}
          </button>
        </div>
      )}
    </div>
  );
};

export default LeavePage;
