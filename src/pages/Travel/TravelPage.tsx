import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { useAuth } from "../../auth/useAuth";

// Travel types
interface TravelRequest {
  id: string;
  destination: string;
  from_location: string;
  to_location: string;
  start_date: string;
  end_date: string;
  total_days: number;
  purpose: string;
  travel_type: "Domestic" | "International";
  estimated_expense: number;
  advance_required: boolean;
  advance_amount: number;
  status: "Pending" | "Approved" | "Rejected" | "On Hold" | "Completed";
  remarks: string;
  submitted_date: string;
  manager_approved_date?: string;
  hr_approved_date?: string;
}

// View types
type TravelView = "my_requests" | "apply_travel";

const TravelPage = () => {
  const { language, t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<TravelView>("my_requests");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    purpose: "",
    travel_type: "Domestic" as "Domestic" | "International",
    from_location: "",
    to_location: "",
    start_date: "",
    end_date: "",
    estimated_expense: "",
    advance_required: false,
    advance_amount: "",
  });

  // Calculate days
  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  // Dummy travel requests data
  const travelRequests: TravelRequest[] = [
    {
      id: "TR-001",
      destination: "Riyadh",
      from_location: "Jeddah",
      to_location: "Riyadh",
      start_date: "2024-03-15",
      end_date: "2024-03-18",
      total_days: 4,
      purpose: "Client meeting with ABC Corporation",
      travel_type: "Domestic",
      estimated_expense: 2500,
      advance_required: true,
      advance_amount: 1000,
      status: "Approved",
      remarks: "Approved by manager",
      submitted_date: "2024-03-01",
      manager_approved_date: "2024-03-02",
      hr_approved_date: "2024-03-03",
    },
    {
      id: "TR-002",
      destination: "Dubai",
      from_location: "Jeddah",
      to_location: "Dubai",
      start_date: "2024-04-10",
      end_date: "2024-04-12",
      total_days: 3,
      purpose: "Tech conference attendance",
      travel_type: "International",
      estimated_expense: 5000,
      advance_required: true,
      advance_amount: 2000,
      status: "Pending",
      remarks: "",
      submitted_date: "2024-03-20",
    },
    {
      id: "TR-003",
      destination: "London",
      from_location: "Jeddah",
      to_location: "London",
      start_date: "2024-02-05",
      end_date: "2024-02-10",
      total_days: 6,
      purpose: "Training program",
      travel_type: "International",
      estimated_expense: 8000,
      advance_required: false,
      advance_amount: 0,
      status: "Completed",
      remarks: "All expenses submitted",
      submitted_date: "2024-01-15",
      manager_approved_date: "2024-01-16",
      hr_approved_date: "2024-01-17",
    },
  ];

  const travelOptions: { key: TravelView; label: string; icon: ReactNode }[] = [
    { key: "my_requests", label: t("myTravelRequests"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  ];

  const statusColors: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "bg-orange-100", text: "text-orange-700" },
    Approved: { bg: "bg-green-100", text: "text-green-700" },
    Rejected: { bg: "bg-red-100", text: "text-red-700" },
    "On Hold": { bg: "bg-yellow-100", text: "text-yellow-700" },
    Completed: { bg: "bg-blue-100", text: "text-blue-700" },
    Active: { bg: "bg-blue-100", text: "text-blue-700" },
    Closed: { bg: "bg-gray-100", text: "text-gray-700" },
  };

  const currentOption = travelOptions.find((opt) => opt.key === activeView);

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
    console.log("Travel request submitted:", formData);
    alert(t("requestSubmitted"));
    setFormData({
      purpose: "",
      travel_type: "Domestic",
      from_location: "",
      to_location: "",
      start_date: "",
      end_date: "",
      estimated_expense: "",
      advance_required: false,
      advance_amount: "",
    });
    setActiveView("my_requests");
  };

  if (showDetail && selectedRequest) {
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
          <h1 className="text-xl font-bold text-gray-800">{t("travelDetails")}</h1>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[selectedRequest.status]?.bg} ${statusColors[selectedRequest.status]?.text}`}>
            {t(selectedRequest.status.toLowerCase().replace(" ", ""))}
          </span>
        </div>

        {/* Travel Details Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{t("destination")}</p>
              <p className="font-semibold text-gray-800">{selectedRequest.destination}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("travelType")}</p>
              <p className="font-semibold text-gray-800">{t(selectedRequest.travel_type.toLowerCase())}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("fromLocation")}</p>
              <p className="font-semibold text-gray-800">{selectedRequest.from_location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("toLocation")}</p>
              <p className="font-semibold text-gray-800">{selectedRequest.to_location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("startDate")}</p>
              <p className="font-semibold text-gray-800">{formatDate(selectedRequest.start_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("endDate")}</p>
              <p className="font-semibold text-gray-800">{formatDate(selectedRequest.end_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("totalDays")}</p>
              <p className="font-semibold text-gray-800">{selectedRequest.total_days} {t("days")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("estimatedExpense")}</p>
              <p className="font-semibold text-gray-800">{selectedRequest.estimated_expense.toLocaleString()} SAR</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">{t("travelPurpose")}</p>
            <p className="font-semibold text-gray-800">{selectedRequest.purpose}</p>
          </div>

          {selectedRequest.advance_required && (
            <div className="bg-yellow-50 rounded-xl p-4">
              <p className="text-sm text-yellow-700">{t("advanceRequired")}: {selectedRequest.advance_amount.toLocaleString()} SAR</p>
            </div>
          )}
        </div>

        {/* Approval Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">{t("approvalTimeline")}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">{t("submitted")}</p>
                <p className="text-xs text-gray-500">{formatDate(selectedRequest.submitted_date)}</p>
              </div>
            </div>
            {selectedRequest.manager_approved_date && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{t("managerApproved")}</p>
                  <p className="text-xs text-gray-500">{formatDate(selectedRequest.manager_approved_date)}</p>
                </div>
              </div>
            )}
            {selectedRequest.hr_approved_date && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{t("hrApproved")}</p>
                  <p className="text-xs text-gray-500">{formatDate(selectedRequest.hr_approved_date)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Remarks */}
        {selectedRequest.remarks && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-2">{t("remarks")}</h3>
            <p className="text-gray-600">{selectedRequest.remarks}</p>
          </div>
        )}

        {/* Action Buttons */}
        {selectedRequest.status === "Approved" && (
          <div className="flex gap-3">
            <button
              className="flex-1 py-3 px-6 text-black rounded-xl font-semibold"
              style={{ backgroundColor: themeColors.primary }}
            >
              {t("markAsCompleted")}
            </button>
            <button
              className="flex-1 py-3 px-6 text-black rounded-xl font-semibold"
              style={{ backgroundColor: themeColors.accent }}
            >
              {t("submitExpense")}
            </button>
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
          <h1 className="text-xl font-bold text-gray-800">{t("travel")}</h1>
          <button
            onClick={() => setActiveView("apply_travel")}
            className="flex items-center gap-1 px-3 py-2 text-black rounded-lg transition-colors"
            style={{ backgroundColor: themeColors.primary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">{t("applyTravel")}</span>
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
                {travelOptions.map((option) => (
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

      {/* Apply Travel Form */}
      {activeView === "apply_travel" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-gray-800">{t("applyTravel")}</h2>
          
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

            {/* Travel Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("travelPurpose")}</label>
              <textarea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                required
              />
            </div>

            {/* Travel Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("travelType")}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, travel_type: "Domestic" })}
                  className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                    formData.travel_type === "Domestic"
                      ? "text-black"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  style={formData.travel_type === "Domestic" ? { backgroundColor: themeColors.primary } : {}}
                >
                  {t("domestic")}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, travel_type: "International" })}
                  className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                    formData.travel_type === "International"
                      ? "text-black"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  style={formData.travel_type === "International" ? { backgroundColor: themeColors.primary } : {}}
                >
                  {t("international")}
                </button>
              </div>
            </div>

            {/* From/To Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("fromLocation")}</label>
                <input
                  type="text"
                  value={formData.from_location}
                  onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("toLocation")}</label>
                <input
                  type="text"
                  value={formData.to_location}
                  onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Start/End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("startDate")}</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("endDate")}</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Number of Days (Auto Calculate) */}
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                {t("numberOfDays")}: <span className="font-bold">{calculateDays()}</span> {t("days")}
              </p>
            </div>

            {/* Estimated Expense */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("estimatedExpense")} (SAR)</label>
              <input
                type="number"
                value={formData.estimated_expense}
                onChange={(e) => setFormData({ ...formData, estimated_expense: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Advance Required Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="font-medium text-gray-700">{t("advanceRequired")}?</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, advance_required: !formData.advance_required })}
                className={`relative w-12 h-6 rounded-full transition-colors ${formData.advance_required ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.advance_required ? "translate-x-6" : ""}`} />
              </button>
            </div>

            {/* Advance Amount */}
            {formData.advance_required && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("advanceAmount")} (SAR)</label>
                <input
                  type="number"
                  value={formData.advance_amount}
                  onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

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

      {/* My Travel Requests List */}
      {activeView === "my_requests" && (
        <div className="space-y-4">
          {travelRequests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                setSelectedRequest(request);
                setShowDetail(true);
              }}
              className="bg-white rounded-2xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-800">{request.destination}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[request.status]?.bg} ${statusColors[request.status]?.text}`}>
                  {t(request.status.toLowerCase().replace(" ", ""))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{request.total_days} {t("days")}</span>
                <span className="font-bold text-gray-800">{request.estimated_expense.toLocaleString()} SAR</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TravelPage;
