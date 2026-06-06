import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useNavigate, useParams } from "react-router-dom";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import {
  getEmployeeDetails,
  getEmployeeLeaveHistory,
  getEmployeeAttendanceHistory,
  getEmployeeTaskHistory,
  EmployeeDetail,
  EmployeeLeaveHistory,
  EmployeeAttendanceHistory,
  EmployeeTaskHistory,
} from "../../services/admin.service";

type Tab = "profile" | "leave" | "attendance" | "tasks";

const EmployeeDetailsPage = () => {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();

  const [showSidebar, setShowSidebar] = useState(false);
  const [activeMenu, setActiveMenu] = useState("employees");
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<EmployeeLeaveHistory[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<EmployeeAttendanceHistory[]>([]);
  const [taskHistory, setTaskHistory] = useState<EmployeeTaskHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!name) return;
      try {
        setLoading(true);
        const data = await getEmployeeDetails(decodeURIComponent(name));
        setDetail(data);
      } catch (err) {
        console.error("[EmployeeDetails] Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [name]);

  const fetchTabData = async (tab: Tab) => {
    if (!name) return;
    try {
      setTabLoading(true);
      const empName = decodeURIComponent(name);
      if (tab === "leave") {
        const data = await getEmployeeLeaveHistory(empName);
        setLeaveHistory(data);
      } else if (tab === "attendance") {
        const data = await getEmployeeAttendanceHistory(empName);
        setAttendanceHistory(data);
      } else if (tab === "tasks") {
        const data = await getEmployeeTaskHistory(empName);
        setTaskHistory(data);
      }
    } catch (err) {
      console.error(`[EmployeeDetails] Failed to fetch ${tab}:`, err);
    } finally {
      setTabLoading(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    fetchTabData(tab);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    Active: { bg: "bg-green-100", text: "text-green-700" },
    Inactive: { bg: "bg-red-100", text: "text-red-700" },
    Present: { bg: "bg-green-100", text: "text-green-700" },
    Absent: { bg: "bg-red-100", text: "text-red-700" },
    "Half Day": { bg: "bg-yellow-100", text: "text-yellow-700" },
    "On Leave": { bg: "bg-blue-100", text: "text-blue-700" },
    Pending: { bg: "bg-orange-100", text: "text-orange-700" },
    Approved: { bg: "bg-green-100", text: "text-green-700" },
    Rejected: { bg: "bg-red-100", text: "text-red-700" },
    Open: { bg: "bg-gray-100", text: "text-gray-700" },
    Working: { bg: "bg-blue-100", text: "text-blue-700" },
    Completed: { bg: "bg-green-100", text: "text-green-700" },
    Closed: { bg: "bg-green-100", text: "text-green-700" },
    Cancelled: { bg: "bg-red-100", text: "text-red-700" },
  };

  const priorityColors: Record<string, { bg: string; text: string }> = {
    Low: { bg: "bg-gray-100", text: "text-gray-600" },
    Medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
    High: { bg: "bg-orange-100", text: "text-orange-700" },
    Urgent: { bg: "bg-red-100", text: "text-red-700" },
  };

  const cardStyle = isDark ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm border border-gray-100";
  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "leave", label: "Leave History" },
    { key: "attendance", label: "Attendance" },
    { key: "tasks", label: "Tasks" },
  ];

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <AdminHeader onMenuToggle={() => setShowSidebar(true)} title="Employee Details" />
      <AdminSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      <div className="px-4 py-4 space-y-4 pb-8">
        <button onClick={() => navigate("/admin/employees")} className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Employees
        </button>

        {loading ? (
          <div className={`rounded-2xl p-6 animate-pulse ${cardStyle}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
              <div><div className={`h-5 w-40 rounded mb-2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} /><div className={`h-3 w-24 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i}><div className={`h-3 w-20 rounded mb-1 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} /><div className={`h-4 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} /></div>)}
            </div>
          </div>
        ) : detail ? (
          <>
            <div className={`rounded-2xl p-5 ${cardStyle}`}>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${isDark ? "bg-indigo-600/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                  {detail.employee_name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold truncate">{detail.employee_name}</h2>
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{detail.employee} • {detail.designation || "-"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[detail.status]?.bg || "bg-gray-100"} ${statusColors[detail.status]?.text || "text-gray-700"}`}>{detail.status}</span>
                    <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{detail.department || "-"} • {detail.company || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl p-1 flex gap-1 ${cardStyle}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors ${activeTab === tab.key ? "bg-indigo-600 text-white" : isDark ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "profile" && (
              <div className={`rounded-2xl p-5 ${cardStyle}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Employee ID</p><p className="text-sm font-semibold">{detail.employee}</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Department</p><p className="text-sm font-semibold">{detail.department || "-"}</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Designation</p><p className="text-sm font-semibold">{detail.designation || "-"}</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Company</p><p className="text-sm font-semibold">{detail.company || "-"}</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Email</p><p className="text-sm font-semibold">{detail.email || "-"}</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Phone</p><p className="text-sm font-semibold">{detail.phone || "-"}</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Date of Joining</p><p className="text-sm font-semibold">{formatDate(detail.date_of_joining || "")}</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Date of Birth</p><p className="text-sm font-semibold">{formatDate(detail.date_of_birth || "")}</p></div>
                </div>
              </div>
            )}

            {activeTab === "leave" && (
              tabLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className={`rounded-2xl p-4 animate-pulse ${cardStyle}`}><div className={`h-4 w-32 rounded mb-2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} /><div className={`h-3 w-24 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} /></div>)}</div>
              ) : leaveHistory.length === 0 ? (
                <div className={`rounded-2xl p-8 text-center ${cardStyle}`}><p className="text-sm">No leave history</p></div>
              ) : (
                <div className="space-y-3">
                  {leaveHistory.map((item, idx) => (
                    <motion.div key={item.name || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className={`rounded-2xl p-4 ${cardStyle}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{item.leave_type}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[item.status]?.bg || "bg-gray-100"} ${statusColors[item.status]?.text || "text-gray-700"}`}>{item.status}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{formatDate(item.from_date)} — {formatDate(item.to_date)}</span>
                        <span className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{item.total_leave_days} days</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {activeTab === "attendance" && (
              tabLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className={`rounded-2xl p-4 animate-pulse ${cardStyle}`}><div className={`h-4 w-32 rounded mb-2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} /><div className={`h-3 w-24 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} /></div>)}</div>
              ) : attendanceHistory.length === 0 ? (
                <div className={`rounded-2xl p-8 text-center ${cardStyle}`}><p className="text-sm">No attendance history</p></div>
              ) : (
                <div className="space-y-3">
                  {attendanceHistory.map((item, idx) => (
                    <motion.div key={item.name || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className={`rounded-2xl p-4 ${cardStyle}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{formatDate(item.attendance_date)}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[item.status]?.bg || "bg-gray-100"} ${statusColors[item.status]?.text || "text-gray-700"}`}>{item.status}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Working Hours: {item.working_hours || 0}h</span>
                        {(item.check_in || item.check_out) && (
                          <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{item.check_in || "-"} → {item.check_out || "-"}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {activeTab === "tasks" && (
              tabLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className={`rounded-2xl p-4 animate-pulse ${cardStyle}`}><div className={`h-4 w-32 rounded mb-2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} /><div className={`h-3 w-24 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} /></div>)}</div>
              ) : taskHistory.length === 0 ? (
                <div className={`rounded-2xl p-8 text-center ${cardStyle}`}><p className="text-sm">No task history</p></div>
              ) : (
                <div className="space-y-3">
                  {taskHistory.map((item, idx) => (
                    <motion.div key={item.name || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className={`rounded-2xl p-4 ${cardStyle}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm flex-1 min-w-0 truncate">{item.subject}</h3>
                        <div className="flex gap-1.5 ml-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityColors[item.priority]?.bg || "bg-gray-100"} ${priorityColors[item.priority]?.text || "text-gray-700"}`}>{item.priority}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[item.status]?.bg || "bg-gray-100"} ${statusColors[item.status]?.text || "text-gray-700"}`}>{item.status}</span>
                        </div>
                      </div>
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Due: {formatDate(item.due_date)}</span>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </>
        ) : (
          <div className={`rounded-2xl p-8 text-center ${cardStyle}`}><p className="text-sm">Employee not found</p></div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailsPage;
