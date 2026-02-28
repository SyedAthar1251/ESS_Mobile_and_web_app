import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";

// Holiday types
interface Holiday {
  id: string;
  name: string;
  date: string;
  day: string;
  is_past: boolean;
}

interface Activity {
  id: string;
  title: string;
  date: string;
  type: string;
  description: string;
}

// Dropdown options
type ViewType = "holidays" | "activities";

const HolidayActivityPage = () => {
  const { language, t } = useLanguage();
  const [activeView, setActiveView] = useState<ViewType>("holidays");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const viewOptions: { key: ViewType; label: string; icon: string }[] = [
    { key: "holidays", label: t("holidays"), icon: "🎉" },
    { key: "activities", label: t("activities"), icon: "🎯" },
  ];

  // Dummy holiday data
  const holidays: Holiday[] = [
    { id: "HOL-001", name: "National Day", date: "2024-09-23", day: "Monday", is_past: false },
    { id: "HOL-002", name: "Founding Day", date: "2024-02-22", day: "Thursday", is_past: true },
    { id: "HOL-003", name: "Eid Al-Fitr", date: "2024-04-10", day: "Wednesday", is_past: false },
    { id: "HOL-004", name: "Eid Al-Adha", date: "2024-06-16", day: "Sunday", is_past: false },
    { id: "HOL-005", name: "New Year", date: "2024-01-01", day: "Monday", is_past: true },
  ];

  // Dummy activity data
  const activities: Activity[] = [
    {
      id: "ACT-001",
      title: "Team Building Event",
      date: "2024-03-15",
      type: "Event",
      description: "Annual team building and outdoor activities",
    },
    {
      id: "ACT-002",
      title: "Training Workshop",
      date: "2024-02-28",
      type: "Training",
      description: "Professional development training session",
    },
    {
      id: "ACT-003",
      title: "Town Hall Meeting",
      date: "2024-02-25",
      type: "Meeting",
      description: "Monthly company-wide town hall",
    },
    {
      id: "ACT-004",
      title: "Sports Day",
      date: "2024-04-05",
      type: "Event",
      description: "Inter-department sports competition",
    },
  ];

  // Calculate stats
  const upcomingHolidays = holidays.filter((h) => !h.is_past);
  const pastHolidays = holidays.filter((h) => h.is_past);
  const upcomingActivities = activities.filter((a) => new Date(a.date) >= new Date());
  const totalEvents = activities.length;

  // Dashboard stats cards
  const statsCards = [
    { label: t("totalHolidays"), value: holidays.length, icon: "🎉", color: "bg-purple-50", textColor: "text-purple-600" },
    { label: t("upcoming"), value: upcomingHolidays.length, icon: "📅", color: "bg-green-50", textColor: "text-green-600" },
    { label: t("activities"), value: totalEvents, icon: "🎯", color: "bg-blue-50", textColor: "text-blue-600" },
    { label: t("thisMonth"), value: upcomingActivities.length, icon: "📆", color: "bg-indigo-50", textColor: "text-indigo-600" },
  ];

  const currentOption = viewOptions.find((opt) => opt.key === activeView);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("holidayActivity")}</h1>
          <span className="text-sm text-gray-500">{holidays.length} {t("holidaysCount")}</span>
        </div>

        {/* Dashboard Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.color} rounded-2xl p-4 text-center`}
            >
              <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dropdown Selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentOption?.icon}</span>
            <span className="font-semibold text-gray-800">{currentOption?.label}</span>
          </div>
          <motion.span animate={{ rotate: dropdownOpen ? 180 : 0 }} className="text-gray-400">
            ▼
          </motion.span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <motion.ul
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl z-20 overflow-hidden"
              >
                {viewOptions.map((option) => (
                  <li key={option.key}>
                    <button
                      onClick={() => {
                        setActiveView(option.key);
                        setDropdownOpen(false);
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${
                        activeView === option.key ? "bg-indigo-50" : ""
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-gray-800">{option.label}</span>
                      {activeView === option.key && <span className="ml-auto text-indigo-600">✓</span>}
                    </button>
                  </li>
                ))}
              </motion.ul>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Holidays View */}
      {activeView === "holidays" && (
        <div className="space-y-6">
          {/* Upcoming Holidays */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t("upcomingHolidays")}</h2>
            <div className="space-y-3">
              {upcomingHolidays.map((holiday, index) => (
                <motion.div
                  key={holiday.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4"
                >
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-purple-600">
                      {new Date(holiday.date).getDate()}
                    </span>
                    <span className="text-xs text-purple-500">
                      {new Date(holiday.date).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{holiday.name}</h4>
                    <p className="text-sm text-gray-500">{holiday.day}</p>
                  </div>
                  <span className="text-2xl">🎉</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Past Holidays */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t("pastHolidays")}</h2>
            <div className="space-y-3">
              {pastHolidays.map((holiday, index) => (
                <motion.div
                  key={holiday.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 opacity-60"
                >
                  <div className="h-14 w-14 rounded-xl bg-gray-100 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-gray-600">
                      {new Date(holiday.date).getDate()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(holiday.date).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-600">{holiday.name}</h4>
                    <p className="text-sm text-gray-400">{holiday.day}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activities View */}
      {activeView === "activities" && (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-800">{activity.title}</h4>
                  <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full">
                    {activity.type}
                  </span>
                </div>
                <span className="text-sm text-gray-400">{formatDate(activity.date)}</span>
              </div>
              <p className="text-sm text-gray-600">{activity.description}</p>
              <button className="mt-3 text-indigo-600 text-sm font-medium hover:text-indigo-700">
                View Details →
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HolidayActivityPage;
