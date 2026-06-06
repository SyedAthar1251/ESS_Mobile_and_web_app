import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";
import { getEmployeeList, Employee } from "../../services/admin.service";

const EmployeeList = () => {
  const { theme } = useTheme();
  const isDark = theme !== "light";
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeMenu, setActiveMenu] = useState("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      const data = await getEmployeeList(query);
      setEmployees(data);
    } catch (err) {
      console.error("[EmployeeList] Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.length >= 2) {
      fetchData(value);
    } else if (value.length === 0) {
      fetchData();
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    Active: { bg: "bg-green-100", text: "text-green-700" },
    Inactive: { bg: "bg-red-100", text: "text-red-700" },
    Suspended: { bg: "bg-yellow-100", text: "text-yellow-700" },
  };

  const cardStyle = isDark ? "bg-gray-800 border border-gray-700" : "bg-white shadow-sm border border-gray-100";

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <AdminHeader onMenuToggle={() => setShowSidebar(true)} title="Employees" />
      <AdminSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      <div className="px-4 py-4 space-y-4 pb-8">
        <div>
          <h2 className="text-xl font-bold">Employee Management</h2>
          <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {loading ? "Loading..." : `${employees.length} employee${employees.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className={`rounded-2xl p-3 ${cardStyle}`}>
          <div className="relative">
            <svg className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search employees..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`rounded-2xl p-4 animate-pulse ${cardStyle}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className="flex-1">
                    <div className={`h-4 w-36 rounded mb-1 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className={`h-3 w-24 rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
                  </div>
                  <div className={`h-5 w-16 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
              </div>
            ))}
          </div>
        ) : employees.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl p-8 text-center ${cardStyle}`}>
            <svg className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <p className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>No employees found</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {employees.map((emp, index) => (
              <motion.div
                key={emp.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => navigate(`/admin/employees/${encodeURIComponent(emp.name)}`)}
                className={`rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow ${cardStyle}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? "bg-indigo-600/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                    {emp.employee_name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{emp.employee_name}</h3>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{emp.employee} • {emp.department || "-"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[emp.status]?.bg || "bg-gray-100"} ${statusColors[emp.status]?.text || "text-gray-700"}`}>
                      {emp.status}
                    </span>
                    <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{emp.designation || "-"}</span>
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

export default EmployeeList;
