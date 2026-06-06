import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import EmployeeCard from "../../components/hr/EmployeeCard";
import { getEmployees, searchEmployees, HREmployee } from "../../services/hrEmployee.service";

const PAGE_SIZE = 20;

const Employees = () => {
  const { themeColors } = useTheme();
  const [employees, setEmployees] = useState<HREmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = debouncedQuery
        ? await searchEmployees(debouncedQuery, page, PAGE_SIZE)
        : await getEmployees(page, PAGE_SIZE);
      const data = response.data || [];
      if (page === 1) {
        setEmployees(data);
      } else {
        setEmployees((prev) => [...prev, ...data]);
      }
      setHasMore(data.length >= PAGE_SIZE);
    } catch (err: any) {
      setError(err.message || "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const filteredEmployees = useMemo(() => {
    if (!debouncedQuery) return employees;
    const q = debouncedQuery.toLowerCase();
    return employees.filter(
      (e) =>
        e.employee_name?.toLowerCase().includes(q) ||
        e.name?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q)
    );
  }, [employees, debouncedQuery]);

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: themeColors.text }}>Employee Directory</h1>
            <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
              {loading && page === 1
                ? "Loading..."
                : `${filteredEmployees.length} employee${filteredEmployees.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => {
              setPage(1);
              fetchEmployees();
            }}
            className="p-2 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: themeColors.textSecondary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: themeColors.textSecondary }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-colors focus:outline-none"
            style={{
              background: themeColors.backgroundSecondary,
              color: themeColors.text,
              border: `1px solid ${themeColors.border}`,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5"
              style={{ color: themeColors.textSecondary }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchEmployees} className="ml-auto text-sm text-red-600 font-medium hover:underline">Retry</button>
        </motion.div>
      )}

      {/* Employee List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {loading && page === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl shadow-sm p-4 animate-pulse"
                style={{ background: themeColors.backgroundSecondary }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-gray-200 rounded-full" />
                      <div className="h-5 w-20 bg-gray-200 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div
            className="rounded-2xl shadow-sm p-12 text-center"
            style={{ background: themeColors.backgroundSecondary }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: themeColors.background }}>
              <svg className="w-8 h-8" style={{ color: themeColors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-base font-medium" style={{ color: themeColors.textSecondary }}>
              {debouncedQuery ? "No employees found matching your search" : "No employees found"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredEmployees.map((employee, index) => (
                <EmployeeCard key={employee.name || index} employee={employee} />
              ))}
            </div>

            {hasMore && !debouncedQuery && (
              <div className="mt-4 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: themeColors.primary,
                    color: "#ffffff",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Loading..." : "Load More"}
                </motion.button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Employees;
