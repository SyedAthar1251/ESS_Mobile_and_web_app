import { useTheme } from "../../store/ThemeContext";
import { motion } from "framer-motion";

interface HRDataTableProps {
  columns: string[];
  rows: (string | number | React.ReactNode)[][];
  loading?: boolean;
  emptyMessage?: string;
}

const HRDataTable = ({ columns, rows, loading, emptyMessage = "No data available" }: HRDataTableProps) => {
  const { themeColors } = useTheme();

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: themeColors.backgroundSecondary }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: themeColors.background }}>
                {columns.map((_, i) => (
                  <th key={i} className="px-4 py-3 animate-pulse">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((rowIdx) => (
                <tr key={rowIdx} className="border-b" style={{ borderColor: themeColors.border }}>
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-3 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        className="rounded-2xl shadow-sm p-12 text-center"
        style={{ background: themeColors.backgroundSecondary }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: themeColors.background }}>
          <svg className="w-8 h-8" style={{ color: themeColors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-base font-medium" style={{ color: themeColors.textSecondary }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: themeColors.backgroundSecondary }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: themeColors.background }}>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: themeColors.textSecondary }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <motion.tr
                key={rowIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: rowIdx * 0.03 }}
                className="border-b transition-colors hover:bg-black/5"
                style={{ borderColor: themeColors.border }}
              >
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 text-sm" style={{ color: themeColors.text }}>
                    {cell}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HRDataTable;
