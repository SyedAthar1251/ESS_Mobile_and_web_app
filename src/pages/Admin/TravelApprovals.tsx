import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import { getPendingTravelApprovals, PendingTravelApproval } from "../../services/admin.service";

const TravelApprovals = () => {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeMenu, setActiveMenu] = useState("travel-approvals");
  const [travels, setTravels] = useState<PendingTravelApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getPendingTravelApprovals();
      setTravels(data);
    } catch (err) {
      console.error("[TravelApprovals] Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "bg-orange-100", text: "text-orange-700" },
    Approved: { bg: "bg-green-100", text: "text-green-700" },
    Rejected: { bg: "bg-red-100", text: "text-red-700" },
    Draft: { bg: "bg-gray-100", text: "text-gray-700" },
  };

  const cardStyle = isDark ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm border border-gray-100";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <AdminHeader onMenuToggle={() => setShowSidebar(true)} title="Travel Approvals" />
      <AdminSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      <div className="px-4 py-4 space-y-4 pb-8">
        <div>
          <h2 className="text-xl font-bold">Pending Travel Approvals</h2>
          <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {loading ? "Loading..." : `${travels.length} pending approval${travels.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`rounded-2xl p-4 animate-pulse ${cardStyle}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`h-4 w-36 rounded mb-1 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className={`h-3 w-48 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
                  </div>
                  <div className={`h-6 w-16 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`h-3 w-28 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
                  <div className={`h-3 w-28 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
                </div>
              </div>
            ))}
          </div>
        ) : travels.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl p-8 text-center ${cardStyle}`}>
            <svg className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>No pending travel approvals</p>
            <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>All travel requests have been processed</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {travels.map((travel, index) => (
              <motion.div
                key={travel.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/admin/travel-approvals/${encodeURIComponent(travel.name)}`)}
                className={`rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow ${cardStyle}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{travel.employee_name || travel.employee}</h3>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{travel.purpose}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[travel.status]?.bg || "bg-gray-100"} ${statusColors[travel.status]?.text || "text-gray-700"}`}>
                    {travel.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>From Date</p>
                    <p className="text-sm font-medium">{formatDate(travel.from_date)}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>To Date</p>
                    <p className="text-sm font-medium">{formatDate(travel.to_date)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelApprovals;
