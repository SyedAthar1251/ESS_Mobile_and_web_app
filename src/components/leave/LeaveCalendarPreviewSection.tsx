import { useState, useCallback } from "react";
import { LeaveCalendarResponse } from "../../services/leave.service";
import LeaveCalendarView from "../leave/LeaveCalendarView";

interface LeaveCalendarPreviewSectionProps {
  data: LeaveCalendarResponse | null;
  loading: boolean;
  error: string | null;
  t: (key: string) => string;
}

const LeaveCalendarPreviewSection = ({
  data,
  loading,
  error,
  t,
}: LeaveCalendarPreviewSectionProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!data && !loading && !error) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={useCallback(() => setExpanded((prev) => !prev), [])}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">
          {t("leaveCalendarPreview") || "Leave Calendar Preview"}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {data && !loading && !error && (
        <div className="border-t border-gray-200">
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              expanded ? "max-h-[80vh]" : "max-h-[180px]"
            }`}
          >
            <LeaveCalendarView
              data={data}
              compact={!expanded}
              showSummary={true}
              showBridgePolicy={expanded}
              showSickSlab={expanded}
              loading={false}
              error={null}
            />
          </div>

          {!expanded && (
            <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-center">
              <span className="text-[10px] text-gray-400">
                {t("tapToExpand") || "Tap to expand"}
              </span>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg px-2 py-3 text-center min-h-[60px] flex flex-col justify-center">
                  <div className="h-5 w-8 bg-gray-200 rounded mx-auto mb-1" />
                  <div className="h-2 w-16 bg-gray-200 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 border-t border-gray-200">
          <p className="text-xs text-red-500 text-center">{error}</p>
        </div>
      )}
    </div>
  );
};

export default LeaveCalendarPreviewSection;
