import { useMemo } from "react";
import { HolidayItem } from "../../services/holiday.service";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface LeaveCalendarViewProps {
  fromDate: string;
  toDate: string;
  leaveType: string;
  totalLeaveDays: number;
  holidays?: HolidayItem[];
  t: (key: string) => string;
}

const parseLeaveDate = (dateStr: string): Date => {
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[2].length === 4) {
    const [d, m, y] = parts.map(Number);
    return new Date(y, m - 1, d);
  }
  if (dateStr.length >= 10) {
    const yr = Number(dateStr.slice(0, 4));
    const mo = Number(dateStr.slice(5, 7)) - 1;
    const dy = Number(dateStr.slice(8, 10));
    return new Date(yr, mo, dy);
  }
  return new Date(dateStr + "T00:00:00");
};

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

const buildDateRange = (from: Date, to: Date): Date[] => {
  const dates: Date[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const LeaveCalendarView = ({
  fromDate,
  toDate,
  leaveType,
  totalLeaveDays,
  holidays = [],
  t,
}: LeaveCalendarViewProps) => {
  const calendarData = useMemo(() => {
    const from = parseLeaveDate(fromDate);
    const to = parseLeaveDate(toDate);
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);

    const rangeDates = buildDateRange(from, to);
    const rangeKeys = new Set(rangeDates.map(toYMD));

    const holidayMap = new Map<string, HolidayItem>();
    holidays.forEach((h) => holidayMap.set(h.holiday_date, h));

    let weekendDays = 0;
    let publicHolidays = 0;

    rangeDates.forEach((date) => {
      const key = toYMD(date);
      const holiday = holidayMap.get(key);
      if (holiday?.weekly_off === 1) {
        weekendDays += 1;
      } else if (holiday && (holiday.public_holiday === 1 || holiday.weekly_off === 0)) {
        publicHolidays += 1;
      } else if (!holiday && (date.getDay() === 0 || date.getDay() === 6)) {
        weekendDays += 1;
      }
    });

    const calendarDays = rangeDates.length;
    const daysDeducted = totalLeaveDays ?? calendarDays - weekendDays - publicHolidays;

    const leaveDayKeys = new Set(rangeKeys);
    const weekStart = startOfWeek(from);
    const weekEnd = endOfWeek(to);
    const weeks: { date: Date | null; isLeaveDay: boolean }[][] = [];

    let cursor = new Date(weekStart);
    while (cursor <= weekEnd) {
      const week: { date: Date | null; isLeaveDay: boolean }[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(cursor);
        day.setDate(cursor.getDate() + i);
        week.push({
          date: day,
          isLeaveDay: leaveDayKeys.has(toYMD(day)),
        });
      }
      weeks.push(week);
      cursor = addDays(cursor, 7);
    }

    return {
      calendarDays,
      publicHolidays,
      weekendDays,
      daysDeducted,
      weeks,
    };
  }, [fromDate, toDate, totalLeaveDays, holidays]);

  const statCards = [
    {
      label: t("calendarDays") || "Calendar days",
      value: calendarData.calendarDays,
      bg: "bg-gray-100",
      text: "text-gray-700",
    },
    {
      label: t("publicHolidays") || "Public holidays",
      value: calendarData.publicHolidays,
      bg: "bg-red-50",
      text: "text-red-700",
    },
    {
      label: t("weekendDays") || "Weekend days",
      value: calendarData.weekendDays,
      bg: "bg-orange-50",
      text: "text-orange-700",
    },
    {
      label: t("daysDeducted") || "Days deducted",
      value: calendarData.daysDeducted,
      bg: "bg-green-50",
      text: "text-green-700",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.bg} rounded-lg px-2 py-3 text-center min-h-[72px] flex flex-col justify-center`}>
            <p className={`text-lg font-bold leading-none ${card.text}`}>{card.value}</p>
            <p className={`text-[10px] mt-1 leading-tight ${card.text} opacity-80`}>{card.label}</p>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
          {DAY_LABELS.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {calendarData.weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
            {week.map((cell, dayIdx) => (
              <div
                key={`${weekIdx}-${dayIdx}`}
                className="min-h-[72px] p-1.5 border-r border-gray-200 last:border-r-0 relative"
              >
                {cell.date && (
                  <>
                    <span className="text-xs text-gray-500">{cell.date.getDate()}</span>
                    {cell.isLeaveDay && (
                      <div className="absolute inset-x-1 bottom-1">
                        <span className="block text-[9px] leading-tight text-center font-medium text-orange-700 bg-orange-100 rounded px-1 py-1">
                          {leaveType}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveCalendarView;
