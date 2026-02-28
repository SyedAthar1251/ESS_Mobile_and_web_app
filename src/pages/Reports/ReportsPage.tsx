import { useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";

// Report types
interface Report {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
}

// Dropdown options
type ReportCategory = "attendance" | "finance" | "leave" | "all";

const reportCategories: { key: ReportCategory; label: string; icon: ReactNode }[] = [
  { key: "all", label: "All Reports", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { key: "attendance", label: "Attendance", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: "finance", label: "Finance", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: "leave", label: "Leave", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
];

const reports: Report[] = [
  {
    id: "RPT-001",
    name: "Monthly Attendance Report",
    type: "attendance",
    description: "Detailed monthly attendance summary with check-in/out times",
    icon: "📊",
  },
  {
    id: "RPT-002",
    name: "Attendance Calendar",
    type: "attendance",
    description: "Visual calendar view of attendance for the month",
    icon: "📅",
  },
  {
    id: "RPT-003",
    name: "Overtime Report",
    type: "attendance",
    description: "Overtime hours worked during the period",
    icon: "⏱️",
  },
  {
    id: "RPT-004",
    name: "Salary Slip",
    type: "finance",
    description: "Monthly salary breakdown and deductions",
    icon: "💵",
  },
  {
    id: "RPT-005",
    name: "Expense Summary",
    type: "finance",
    description: "Summary of all expense claims and reimbursements",
    icon: "💳",
  },
  {
    id: "RPT-006",
    name: "Leave Balance Report",
    type: "leave",
    description: "Current leave balances and usage",
    icon: "🏖️",
  },
  {
    id: "RPT-007",
    name: "Leave History",
    type: "leave",
    description: "Complete history of leave applications",
    icon: "📜",
  },
];

const ReportsPage = () => {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>("all");

  const filteredReports = reports.filter((report) => {
    if (selectedCategory === "all") return true;
    return report.type === selectedCategory;
  });

  // Calculate stats
  const totalReports = reports.length;
  const attendanceReports = reports.filter(r => r.type === "attendance").length;
  const financeReports = reports.filter(r => r.type === "finance").length;
  const leaveReports = reports.filter(r => r.type === "leave").length;

  // Dashboard stats cards
  const statsCards = [
    { label: t("totalReports"), value: totalReports, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, color: "bg-indigo-50", textColor: "text-indigo-600" },
    { label: t("attendance"), value: attendanceReports, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "bg-blue-50", textColor: "text-blue-600" },
    { label: t("finance"), value: financeReports, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: "bg-green-50", textColor: "text-green-600" },
    { label: t("leave"), value: leaveReports, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, color: "bg-purple-50", textColor: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("reportsLedger")}</h1>
          <span className="text-sm text-gray-500">{totalReports} {t("reports")}</span>
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

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {reportCategories.map((category) => (
          <button
            key={category.key}
            onClick={() => setSelectedCategory(category.key)}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.key
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl">
                {report.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{report.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                <button className="mt-3 text-indigo-600 text-sm font-medium flex items-center gap-1 hover:text-indigo-700">
                  <span>{t("viewReport")}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <p className="mt-2">{t("noReportsAvailable")}</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
