import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { getHolidayLists, getHolidayListDetails, HolidayItem, HolidayListSummary } from "../../services/holiday.service";

// ─────────────────────────────────────────────
//   TYPES
// ─────────────────────────────────────────────

interface HolidayRow {
  holiday_date: string;
  description: string;
  weekly_off: number;
}

// ─────────────────────────────────────────────
//   CONSTANTS
// ─────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const DAY_ABBREV = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─────────────────────────────────────────────
//   UTILS
// ─────────────────────────────────────────────

function parseYMD(dateStr: string): Date {
  // API returns "YYYY-MM-DD" (ISO)
  if (dateStr.length >= 10) {
    const yr = Number(dateStr.slice(0, 4));
    const mo = Number(dateStr.slice(5, 7)) - 1;
    const dy = Number(dateStr.slice(8, 10));
    return new Date(yr, mo, dy);
  }
  return new Date(dateStr + "T00:00:00");
}

function isToday(d: Date, today: Date): boolean {
  return d.getFullYear() === today.getFullYear()
    && d.getMonth() === today.getMonth()
    && d.getDate() === today.getDate();
}

function isUpcoming(d: Date, today: Date): boolean {
  return d >= today;
}

function dateStrYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────
//   SKELETONS
// ─────────────────────────────────────────────

const SummaryCardSkeleton = () => (
  <div className="bg-gray-100 rounded-2xl p-4 text-center animate-pulse">
    <div className="h-6 w-12 bg-gray-200 rounded mx-auto mb-2" />
    <div className="h-3 w-20 bg-gray-200 rounded mx-auto" />
  </div>
);

const HolidayCardSkeleton = () => (
  <div className="shadow-lg p-4 rounded-2xl animate-pulse">
    <div className="flex items-start gap-3">
      <div className="h-14 w-14 bg-gray-200 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full mt-1" />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
//   MAIN COMPONENT
// ─────────────────────────────────────────────

const HolidayActivityPage = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ── State ──────────────────────────────────
  const [allLists, setAllLists] = useState<HolidayListSummary[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);         // false = holidays only (weekly_off=0)
  const [listDisplayLimit, setListDisplayLimit] = useState(10);

  // ── Fetch holiday lists on mount ────────────
  // Wrap in setTimeout(0) so it runs AFTER React has flushed initial render
  // and any auth context updates — prevents a race where the GET fires before credentials are ready
  const fetchLists = useCallback(async (retries = 2) => {
    try {
      setLoading(true);
      const lists = await getHolidayLists();
      if (lists.length === 0 && retries > 0) {
        // Empty response likely means auth wasn't ready — retry once
        await new Promise(r => setTimeout(r, 400));
        return fetchLists(retries - 1);
      }
      if (lists.length === 0) {
        // Auth still not ready after retries — fall back to local data so dropdown is never empty
        const yr = String(CURRENT_YEAR);
        setAllLists([{ name: yr }]);
        setSelectedName(yr);
        return;
      }
      setAllLists(lists);
      const yearStr = String(CURRENT_YEAR);
      const match = lists.find(l => l.name.trim() === yearStr);
      setSelectedName(match ? match.name : (lists[0]?.name || ""));
    } catch (err: any) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 400));
        return fetchLists(retries - 1);
      }
      if (err.message?.includes("Authentication")) {
        // Auth not ready — fall back to local data so dropdown is never empty
        const yr = String(CURRENT_YEAR);
        setAllLists([{ name: yr }]);
        setSelectedName(yr);
        return;
      }
      console.error("[HolidayPage] Fetch lists error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // ── Reset page when list / filter changes ───
  useEffect(() => {
    setListDisplayLimit(10);
  }, [selectedName, viewAll]);

  // ── Fetch details when selectedName changes ─
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [weekdayOff, setWeekdayOff] = useState<string>("");

  useEffect(() => {
    if (!selectedName) return;
    let cancelled = false;

    const fetchDetails = async () => {
      try {
        const details = await getHolidayListDetails(selectedName);
        if (cancelled) return;

        const rawHolidays = details.holidays || [];
        console.log("[HolidayPage] rawHolidays count:", rawHolidays.length, rawHolidays.slice(0, 3));

        const items: HolidayRow[] = rawHolidays.map((h: HolidayItem) => ({
          holiday_date: h.holiday_date,
          description: h.description,
          weekly_off: h.weekly_off ?? 0,
        }));

        // Extract year from selected list name (e.g. "2026" or "Saudi Holiday List 2027")
        const yearMatch = selectedName.match(/\d{4}/);
        const selectedYear = yearMatch ? Number(yearMatch[0]) : Number(selectedName) || CURRENT_YEAR;

        // Sort ascending regardless
        const sorted = items
          .filter(h => {
            const d = parseYMD(h.holiday_date);
            return d.getFullYear() === selectedYear;
          })
          .sort(
            (a, b) =>
              parseYMD(a.holiday_date).getTime() -
              parseYMD(b.holiday_date).getTime()
          );

        // Store full year-sorted list; the display filter & pagination are
        // handled reactively by useMemo / viewAll so there are no stale closures.
        setHolidays(sorted);

        // Derive most-frequent weekday off label (weekly off rows)
        const weeklyOffRows = rawHolidays.filter((h: HolidayItem) => h.weekly_off === 1);
        if (weeklyOffRows.length > 0) {
          const dayCounts: Record<string, number> = {};
          weeklyOffRows.forEach(h => {
            const day = DAY_ABBREV[parseYMD(h.holiday_date).getDay()];
            dayCounts[day] = (dayCounts[day] || 0) + 1;
          });
          const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
          setWeekdayOff(topDay ? topDay[0] : "");
        } else {
          setWeekdayOff("");
        }
      } catch (err: any) {
        if (!cancelled) console.error("[HolidayPage] Fetch details error:", err.message);
      }
    };

    fetchDetails();
    return () => { cancelled = true; };
  }, [selectedName]);

  // ── Derived stats & display slice ─────────
  const displayedHolidays = useMemo(() => {
    return viewAll
      ? holidays
      : holidays.filter(h => h.weekly_off === 0);
  }, [holidays, viewAll]);

  const hasMore = displayedHolidays.length > 10;
  const isExpanded = listDisplayLimit >= displayedHolidays.length;
  const displayItems = useMemo(
    () => displayedHolidays.slice(0, listDisplayLimit),
    [displayedHolidays, listDisplayLimit]
  );

  const stats = useMemo(() => ({
    total: holidays.length,
    weeklyOff: weekdayOff || null,
  }), [holidays.length, weekdayOff]);

  // ── Render helpers ───────────────────────────
  const locale = language === "ar" ? "ar-SA" : "en-US";

  const formatDate = (dateStr: string) => {
    const d = parseYMD(dateStr);
    return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
  };

  const formatDay = (dateStr: string) => {
    return DAY_ABBREV[parseYMD(dateStr).getDay()];
  };

  // ─────────────────────────────────────────────
  //   RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="p-4 space-y-6 overflow-x-hidden">

      {/* ════════════════════════════════
          HEADER
      ════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{t("holidays") || "Holidays"}</h1>
        <span className="text-xs text-gray-400">
          {CURRENT_YEAR}
        </span>
      </div>

      {/* ════════════════════════════════
          HOLIDAY LIST DROPDOWN
      ════════════════════════════════ */}
      <div className="relative" data-dropdown>
        <button
          type="button"
          onClick={() => setDropdownOpen(o => !o)}
          className="w-full shadow-lg p-4 flex items-center justify-between bg-white rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold text-gray-800">{selectedName || (t("holidays") || "Holidays")}</span>
          </div>
          <motion.span animate={{ rotate: dropdownOpen ? 180 : 0 }} className="text-gray-400">▼</motion.span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-20 overflow-hidden max-h-56 overflow-y-auto"
              >
                {allLists.map((list) => (
                  <li key={list.name}>
                    <button
                      type="button"
                      onClick={() => { setSelectedName(list.name); setDropdownOpen(false); }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-indigo-50 transition-colors ${
                        list.name === selectedName ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      {list.name}
                    </button>
                  </li>
                ))}
                {allLists.length === 0 && (
                  <li className="px-4 py-3 text-sm text-gray-400">{t("noHolidaysAvailable") || "No holidays available"}</li>
                )}
              </motion.ul>
            </>
          )}
        </AnimatePresence>
      </div>

      {selectedName && (
        <p className="text-[11px] text-gray-400 text-center -mt-2">
          {(t("viewing") || "Viewing")}: {selectedName}
        </p>
      )}

      {/* ════════════════════════════════
          SUMMARY CARDS
      ════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t("totalHolidays") || "Holidays"}
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => <SummaryCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="bg-indigo-50 rounded-2xl p-4 text-center"
            >
              <p className="text-xl font-bold text-indigo-600">{stats.total}</p>
              <p className="text-[10px] text-gray-500 mt-1">{t("totalHolidays") || "Total Holidays"}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="bg-orange-50 rounded-2xl p-4 text-center"
            >
              <p className="text-xl font-bold text-orange-600">{stats.weeklyOff || "—"}</p>
              <p className="text-[10px] text-gray-500 mt-1">{t("weeklyOff") || "Weekly Off"}</p>
            </motion.div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════
          HOLIDAY LIST
      ════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t("upcomingHolidays") || "Holidays"}
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <HolidayCardSkeleton key={i} />)}
          </div>
        ) : holidays.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg p-10 text-center"
          >
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-400">{t("noHolidaysAvailable") || "No holidays found"}</p>
          </motion.div>
        ) : (
          <>
            {/* Toggle: Holidays Only ⇄ View All */}
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => {
                  setViewAll(v => !v);
                  setListDisplayLimit(10);
                }}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                {viewAll
                  ? (t("holidaysOnly") || "Holidays Only")
                  : (t("viewAll") || "View All")}
              </button>
            </div>

            <div className="space-y-3">
              {displayItems.map((holiday, idx) => {
                const d = parseYMD(holiday.holiday_date);
                const isHoliday = holiday.weekly_off === 0;
                const isPast = !isUpcoming(d, today);
                const badgeLabel = isHoliday ? "Holiday" : "Weekly Off";
                const badgeColor = isHoliday
                  ? "bg-blue-100 text-blue-700"
                  : "bg-emerald-100 text-emerald-700";

                return (
                  <motion.div
                    key={holiday.holiday_date + idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`shadow-lg p-4 rounded-2xl ${isPast ? "opacity-55" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Date badge */}
                      <div className={`h-14 w-14 flex-shrink-0 rounded-xl flex flex-col items-center justify-center ${
                        isToday(d, today)
                          ? "bg-indigo-600"
                          : isHoliday
                            ? "bg-gradient-to-br from-blue-50 to-indigo-100"
                            : "bg-gradient-to-br from-emerald-50 to-teal-100"
                      }`}>
                        <span className={`text-base font-bold ${
                          isToday(d, today) ? "text-white" : isHoliday ? "text-indigo-700" : "text-emerald-700"
                        }`}>{d.getDate()}</span>
                        <span className={`text-[10px] -mt-0.5 leading-none ${
                          isToday(d, today) ? "text-indigo-200" : isHoliday ? "text-indigo-500" : "text-emerald-500"
                        }`}>
                          {d.toLocaleDateString(locale, { month: "short" })}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 text-sm truncate">{holiday.description}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">{formatDay(holiday.holiday_date)}</p>

                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                          {isToday(d, today) && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-700">
                              {t("today") || "Today"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Upcoming arrow */}
                      {isUpcoming(d, today) && (
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Load More / Show Less */}
            {hasMore && (
              <button
                type="button"
                onClick={() => setListDisplayLimit(isExpanded ? 10 : displayedHolidays.length)}
                className="w-full text-sm text-indigo-600 font-medium py-2 hover:bg-indigo-50 rounded-xl transition-colors"
              >
                {isExpanded
                  ? (t("showLess") || "Show Less")
                  : (t("loadMore") || `Load More (${displayedHolidays.length - listDisplayLimit} remaining)`)}
              </button>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default HolidayActivityPage;
