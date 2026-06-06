import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useNavigate, useParams } from "react-router-dom";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import {
  getTravelApprovalDetail,
  approveTravelRequest,
  rejectTravelRequest,
  TravelApprovalDetail,
} from "../../services/admin.service";

const TravelApprovalDetailPage = () => {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();

  const [showSidebar, setShowSidebar] = useState(false);
  const [activeMenu, setActiveMenu] = useState("travel-approvals");
  const [detail, setDetail] = useState<TravelApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState<"approve" | "reject" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!name) return;
      try {
        setLoading(true);
        const data = await getTravelApprovalDetail(decodeURIComponent(name));
        setDetail(data);
      } catch (err) {
        console.error("[TravelApprovalDetail] Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [name]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleAction = async () => {
    if (!name || !modalOpen) return;
    try {
      setSubmitting(true);
      if (modalOpen === "approve") {
        await approveTravelRequest(decodeURIComponent(name), remarks || undefined);
      } else {
        await rejectTravelRequest(decodeURIComponent(name), remarks || undefined);
      }
      setModalOpen(null);
      setRemarks("");
      navigate("/admin/travel-approvals", { replace: true });
    } catch (err: any) {
      console.error("[TravelApprovalDetail] Action failed:", err);
      alert(err.message || "Failed to process request");
    } finally {
      setSubmitting(false);
    }
  };

  const cardStyle = isDark ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm border border-gray-100";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <AdminHeader onMenuToggle={() => setShowSidebar(true)} title="Travel Approval Details" />
      <AdminSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      <div className="px-4 py-4 space-y-4 pb-8">
        <button onClick={() => navigate("/admin/travel-approvals")} className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Travel Approvals
        </button>

        {loading ? (
          <div className={`rounded-2xl p-6 animate-pulse ${cardStyle}`}>
            <div className="h-6 w-48 rounded mb-4" style={{ background: isDark ? "#374151" : "#e5e7eb" }} />
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i}><div className="h-3 w-20 rounded mb-1" style={{ background: isDark ? "#374151" : "#e5e7eb" }} /><div className="h-4 w-32 rounded" style={{ background: isDark ? "#374151" : "#e5e7eb" }} /></div>
              ))}
            </div>
          </div>
        ) : detail ? (
          <>
            <div className={`rounded-2xl p-5 ${cardStyle}`}>
              <div className="grid grid-cols-2 gap-4">
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Employee</p><p className="text-sm font-semibold">{detail.employee_name || detail.employee}</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Travel Type</p><p className="text-sm font-semibold">{detail.travel_type}</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>From Date</p><p className="text-sm font-semibold">{formatDate(detail.from_date)}</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>To Date</p><p className="text-sm font-semibold">{formatDate(detail.to_date)}</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>From</p><p className="text-sm font-semibold">{detail.from_location || "-"}</p></div>
                <div><p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>To</p><p className="text-sm font-semibold">{detail.destination || detail.to_location || "-"}</p></div>
              </div>
              <div className="mt-4">
                <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Purpose</p>
                <p className="text-sm mt-1">{detail.purpose}</p>
              </div>
              {detail.description && (
                <div className="mt-4">
                  <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>Description</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{detail.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setModalOpen("approve"); setRemarks(""); }} className="flex-1 py-3 px-6 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">Approve</button>
              <button onClick={() => { setModalOpen("reject"); setRemarks(""); }} className="flex-1 py-3 px-6 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">Reject</button>
            </div>
          </>
        ) : (
          <div className={`rounded-2xl p-8 text-center ${cardStyle}`}>
            <p className="text-sm">Travel request not found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setModalOpen(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                <h3 className="text-lg font-bold mb-2">{modalOpen === "approve" ? "Approve" : "Reject"} Travel Request</h3>
                <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Are you sure you want to {modalOpen} this travel request?</p>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks..." rows={3} className={`w-full p-3 rounded-xl border text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`} />
                <div className="flex gap-3">
                  <button onClick={() => setModalOpen(null)} disabled={submitting} className={`flex-1 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Cancel</button>
                  <button onClick={handleAction} disabled={submitting} className={`flex-1 py-3 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 ${modalOpen === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                    {submitting ? <span className="flex items-center justify-center gap-2"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing...</span> : modalOpen === "approve" ? "Approve" : "Reject"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TravelApprovalDetailPage;
