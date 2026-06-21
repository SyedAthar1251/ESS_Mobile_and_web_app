import { useMemo } from "react";
import {
  LeaveCalendarResponse,
  LeaveCalendarPublicHoliday,
  LeaveCalendarWeeklyOff,
  LeaveCalendarLeaveDetail,
} from "../../services/leave.service";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export interface LeaveCalendarViewProps {
  data: LeaveCalendarResponse | null;
  compact?: boolean;
  showSummary?: boolean;
  showBridgePolicy?: boolean;
  showSickSlab?: boolean;
  loading?: boolean;
  error?: string | null;
}

interface CalendarCell {
  date: Date;
  isInRange: boolean;
  isLeaveDay: boolean;
  isWeekend: boolean;
  isPublicHoliday: boolean;
  isBridgeDay: boolean;
  holidayDescription: string | null;
  leaveDetail: LeaveCalendarLeaveDetail | null;
}

const toYMD = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfWeek = (date: Date): Date => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const endOfWeek = (date: Date): Date => {
  const end = new Date(date);
  end.setDate(end.getDate() + (6 - end.getDay()));
  return end;
};

const parseAPIDate = (dateStr: string): Date => {
  if (!dateStr) return new Date(NaN);
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const [d, m, y] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
    if (parts[0].length === 4) {
      const [y, m, d] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
  }
  return new Date(dateStr + "T00:00:00");
};

const formatMonthHeader = (from: Date, to: Date): string => {
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return "";
  const fromMonth = from.getMonth();
  const fromYear = from.getFullYear();
  const toMonth = to.getMonth();
  const toYear = to.getFullYear();

  if (fromYear === toYear && fromMonth === toMonth) {
    return `${MONTH_LABELS[fromMonth]} ${fromYear}`;
  }
  if (fromYear === toYear) {
    return `${MONTH_SHORT[fromMonth]} - ${MONTH_SHORT[toMonth]} ${fromYear}`;
  }
  return `${MONTH_SHORT[fromMonth]} ${fromYear} - ${MONTH_SHORT[toMonth]} ${toYear}`;
};

const LeaveCalendarSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="grid grid-cols-4 gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-100 rounded-lg px-2 py-3 text-center min-h-[72px] flex flex-col justify-center">
          <div className="h-5 w-8 bg-gray-200 rounded mx-auto mb-1" />
          <div className="h-2 w-16 bg-gray-200 rounded mx-auto" />
        </div>
      ))}
    </div>
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="h-8 bg-gray-100 border-b border-gray-200" />
      <div className="h-6 bg-gray-50 border-b border-gray-200" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="grid grid-cols-7 border-b border-gray-200">
          {Array.from({ length: 7 }).map((_, j) => (
            <div key={j} className="min-h-[72px] bg-gray-50 border-r border-gray-200 last:border-r-0" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const LeaveCalendarView = ({
  data,
  compact = false,
  showSummary = true,
  showBridgePolicy = true,
  showSickSlab = true,
  loading = false,
  error = null,
}: LeaveCalendarViewProps) => {
  const calendarData = useMemo(() => {






    if (!data) return null;

    const leaveInfo = data.leave_details;
    const fromRaw = leaveInfo?.from_date || data.from_date || "";
    const toRaw = leaveInfo?.to_date || data.to_date || "";

    if (!fromRaw || !toRaw) {

      return null;
    }

    const from = parseAPIDate(fromRaw);
    const to = parseAPIDate(toRaw);
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {

      return null;
    }

    const publicHolidayMap = new Map<string, LeaveCalendarPublicHoliday>();
    (data.public_holidays || []).forEach((h) => {
      if (h.date) publicHolidayMap.set(h.date, h);
    });

    const weeklyOffSet = new Set<string>();
    (data.weekly_offs || []).forEach((w) => {
      if (w.date) weeklyOffSet.add(w.date);
    });

    const leaveDetailMap = new Map<string, LeaveCalendarLeaveDetail>();
    if (leaveInfo?.date) {
      leaveDetailMap.set(leaveInfo.date, leaveInfo);
    }
    if (Array.isArray(data.existing_leaves)) {
      data.existing_leaves.forEach((ld) => {
        if (ld.date) leaveDetailMap.set(ld.date, ld);
      });
    }

    const bridgeDateSet = new Set<string>();
    if (data.bridge_policy_data?.bridge_dates) {
      data.bridge_policy_data.bridge_dates.forEach((d) => bridgeDateSet.add(d));
    }

    const rangeDates: Date[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      rangeDates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    let weekendDays = 0;
    let publicHolidayCount = 0;

    rangeDates.forEach((date) => {
      const key = toYMD(date);
      if (weeklyOffSet.has(key)) {
        weekendDays += 1;
      } else if (publicHolidayMap.has(key)) {
        publicHolidayCount += 1;
      }
    });

    const calendarDays = rangeDates.length;
    const effectiveLeaveDays = data.effective_leave_days ?? calendarDays - weekendDays - publicHolidayCount;

    const weekStart = startOfWeek(from);
    const weekEnd = endOfWeek(to);
    const weeks: CalendarCell[][] = [];

    let gridCursor = new Date(weekStart);
    while (gridCursor <= weekEnd) {
      const week: CalendarCell[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(gridCursor);
        day.setDate(gridCursor.getDate() + i);
        day.setHours(0, 0, 0, 0);
        const key = toYMD(day);
        const isInRange = day >= from && day <= to;
        const hasLeaveInfo = !!(leaveInfo?.from_date && leaveInfo?.to_date);
        const isLeaveDay = isInRange && hasLeaveInfo;
        const isWeekend = isInRange && weeklyOffSet.has(key);
        const isPublicHoliday = isInRange && publicHolidayMap.has(key);
        const holidayDescription = isPublicHoliday ? (publicHolidayMap.get(key)?.description || null) : null;
        const leaveDetail = leaveInfo || null;
        const isBridgeDay = isInRange && bridgeDateSet.has(key);

        week.push({
          date: day,
          isInRange,
          isLeaveDay,
          isWeekend,
          isPublicHoliday,
          isBridgeDay,
          holidayDescription,
          leaveDetail,
        });
      }
      weeks.push(week);
      gridCursor = addDays(gridCursor, 7);
    }

    return {
      calendarDays,
      publicHolidays: publicHolidayCount,
      weekendDays,
      effectiveLeaveDays,
      weeks,
      monthHeader: formatMonthHeader(from, to),
      bridgePolicy: data.bridge_policy_data || null,
      sickLeaveSlab: data.sick_leave_slab ? [data.sick_leave_slab] : [],
      existingLeaves: data.existing_leaves || [],
      leaveType: leaveInfo?.leave_type || data.leave_type || "",
    };
  }, [data]);





  if (calendarData) {







  }

  if (loading) {
    return <LeaveCalendarSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!data || !calendarData) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">No calendar data available</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Calendar Days",
      value: String(calendarData.calendarDays),
      bg: "bg-gray-100",
      text: "text-gray-700",
    },
    {
      label: "Public Holidays",
      value: calendarData.publicHolidays > 0 ? `-${calendarData.publicHolidays}` : "0",
      bg: "bg-red-50",
      text: "text-red-700",
    },
    {
      label: "Weekly Offs",
      value: calendarData.weekendDays > 0 ? `-${calendarData.weekendDays}` : "0",
      bg: "bg-orange-50",
      text: "text-orange-700",
    },
    {
      label: "Effective Leave Days",
      value: String(calendarData.effectiveLeaveDays),
      bg: "bg-green-50",
      text: "text-green-700",
    },
  ];

  return (
    <div className="space-y-3">
      {showSummary && (
        <div className={`grid ${compact ? "grid-cols-2" : "grid-cols-4"} gap-2`}>
          {statCards.map((card) => (
            <div key={card.label} className={`${card.bg} rounded-lg px-2 py-3 text-center min-h-[60px] flex flex-col justify-center`}>
              <p className={`text-base font-bold leading-none ${card.text}`}>{card.value}</p>
              <p className={`text-[9px] mt-1 leading-tight ${card.text} opacity-80`}>{card.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-center">
          <span className="text-sm font-semibold text-gray-700">{calendarData.monthHeader}</span>
        </div>

        <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
          {DAY_LABELS.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {calendarData.weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
            {week.map((cell, dayIdx) => {
              let cellBg = "";
              if (cell.isPublicHoliday) {
                cellBg = "bg-red-50";
              } else if (cell.isWeekend) {
                cellBg = "bg-orange-50";
              } else if (cell.isLeaveDay) {
                cellBg = "bg-green-50";
              } else if (cell.isBridgeDay) {
                cellBg = "bg-purple-50";
              }

              return (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className={`min-h-[60px] p-1 border-r border-gray-200 last:border-r-0 relative ${cellBg} ${compact ? "min-h-[48px]" : ""}`}
                >
                  <span className={`text-xs ${cell.isInRange ? "text-gray-700" : "text-gray-300"}`}>
                    {cell.date.getDate()}
                  </span>

                  {cell.isPublicHoliday && cell.holidayDescription && (
                    <div className="mt-0.5">
                      <span className="block text-[7px] leading-tight text-center font-medium text-red-600 bg-red-100 rounded px-0.5 py-0.5 truncate">
                        {cell.holidayDescription}
                      </span>
                    </div>
                  )}

                  {cell.isWeekend && !cell.isPublicHoliday && (
                    <div className="mt-0.5">
                      <span className="block text-[7px] leading-tight text-center font-medium text-orange-600 bg-orange-100 rounded px-0.5 py-0.5">
                        Weekend
                      </span>
                    </div>
                  )}

                  {cell.isLeaveDay && (
                    <div className="mt-0.5">
                      <span className="block text-[7px] leading-tight text-center font-medium text-green-700 bg-green-100 rounded px-0.5 py-0.5 truncate">
                        {cell.leaveDetail?.leave_type || calendarData.leaveType || "Leave"}
                      </span>
                    </div>
                  )}

                  {cell.isBridgeDay && !cell.isLeaveDay && !cell.isPublicHoliday && !cell.isWeekend && (
                    <div className="mt-0.5">
                      <span className="block text-[7px] leading-tight text-center font-medium text-purple-600 bg-purple-100 rounded px-0.5 py-0.5">
                        Bridge
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {showBridgePolicy && (calendarData.bridgePolicy?.bridge_applies || calendarData.bridgePolicy?.bridge_fires) && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-purple-700">Bridge Policy Applied</p>
              {calendarData.bridgePolicy.bridge_message && (
                <p className="text-xs text-purple-600 mt-0.5">{calendarData.bridgePolicy.bridge_message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showSickSlab && calendarData.sickLeaveSlab.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-semibold text-blue-700 mb-2">Sick Leave Slab</p>
          <div className="space-y-1">
            {calendarData.sickLeaveSlab.map((slab, idx) => (
              <div key={idx}>
                {slab.full_pay_allowed != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">Full Pay</span>
                    <span className="text-xs font-medium text-blue-700">
                      {slab.full_pay_used ?? 0} / {slab.full_pay_allowed} days
                    </span>
                  </div>
                )}
                {slab.partial_pay_allowed != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">Partial Pay</span>
                    <span className="text-xs font-medium text-blue-700">
                      {slab.partial_pay_used ?? 0} / {slab.partial_pay_allowed} days
                    </span>
                  </div>
                )}
                {slab.unpaid_allowed != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">Unpaid</span>
                    <span className="text-xs font-medium text-blue-700">
                      {slab.unpaid_used ?? 0} / {slab.unpaid_allowed} days
                    </span>
                  </div>
                )}
                {slab.description && (
                  <p className="text-xs text-blue-500 mt-1">{slab.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {calendarData.existingLeaves.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Existing Leaves in Range</p>
          <div className="space-y-1">
            {calendarData.existingLeaves.map((el, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{el.date}</span>
                <span className="text-xs font-medium text-gray-700">
                  {el.leave_type} {el.status ? `(${el.status})` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveCalendarView;
