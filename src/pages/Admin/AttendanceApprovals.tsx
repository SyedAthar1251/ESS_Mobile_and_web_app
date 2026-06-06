import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import { getPendingAttendanceApprovals, PendingAttendanceApproval } from "../../services/admin.service";

const AttendanceApprovals = () => {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeMenu, setActiveMenu] = useState("attendance-approvals");
  const [attendances, setAttendances] = useState<PendingAttendanceApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({ message: "", type: "success", visible: false });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPendingAttendanceApprovals();
      setAttendances(data);
    } catch (err: any) {
      console.error("[AttendanceApprovals] Failed to fetch:", err);
      setSnackbar({ message: err.message || "Failed to fetch", type: "error", visible: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!snackbar.visible) return;
    const timer = setTimeout(() => setSnackbar(p => ({ ...p, visible: false })), 3000);
    return () => clearTimeout(timer);
  }, [snackbar.visible]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  const cardStyle = isDark ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm border border-gray-100";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <AdminHeader onMenuToggle={() => setShowSidebar(true)} title="Attendance Approvals" />
      <AdminSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      <AnimatePresence>
        {snackbar.visible && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] rounded-xl px-5 py-3.5 text-sm font-medium shadow-2xl ${snackbar.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
            <span className="inline-flex items-center gap-2">
              {snackbar.type === "success" ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
              {snackbar.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-4 space-y-4 pb-8">
        <div>
          <h2 className="text-xl font-bold">Pending Attendance Approvals</h2>
          <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {loading ? "Loading..." : `${attendances.length} pending approval${attendances.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => (
            <div key={i} className={`rounded-2xl p-4 animate-pulse ${cardStyle}`}>
              <div className="flex items-start justify-between mb-3"><div><div className={`h-4 w-36 rounded mb-1 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} /><div className={`h-3 w-24 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} /></div></div>
              <div className="grid grid-cols-2 gap-3"><div className={`h-3 w-28 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} /><div className={`h-3 w-28 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} /></div>
            </div>
          ))}</div>
        ) : attendances.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl p-8 text-center ${cardStyle}`}>
            <svg className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>No pending attendance approvals</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {attendances.map((item, index) => (
              <motion.div key={item.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/admin/attendance-approvals/${encodeURIComponent(item.name)}`)}
                className={`rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow ${cardStyle}`}>
                <div className="flex items-start justify-between mb-2">
                  <div><h3 className="font-semibold text-sm">{item.employee_name || item.employee}</h3><p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{item.department || "-"}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>From</p><p className="text-xs font-medium">{formatDate(item.from_date)}</p></div>
                  <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>To</p><p className="text-xs font-medium">{formatDate(item.to_date)}</p></div>
                </div>
                {item.reason && <p className={`text-xs mt-2 line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{item.reason}</p>}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceApprovals;
