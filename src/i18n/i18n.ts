import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enLogin from "./locales/en/login.json";
import enAttendance from "./locales/en/attendance.json";
import enLeave from "./locales/en/leave.json";
import enExpense from "./locales/en/expense.json";
import enSalary from "./locales/en/salary.json";
import enTask from "./locales/en/task.json";
import enDocuments from "./locales/en/documents.json";
import enNotifications from "./locales/en/notifications.json";
import enHoliday from "./locales/en/holiday.json";
import enReports from "./locales/en/reports.json";
import enProfile from "./locales/en/profile.json";
import arCommon from "./locales/ar/common.json";
import arDashboard from "./locales/ar/dashboard.json";
import arLogin from "./locales/ar/login.json";
import arAttendance from "./locales/ar/attendance.json";
import arLeave from "./locales/ar/leave.json";
import arExpense from "./locales/ar/expense.json";
import arSalary from "./locales/ar/salary.json";
import arTask from "./locales/ar/task.json";
import arDocuments from "./locales/ar/documents.json";
import arNotifications from "./locales/ar/notifications.json";
import arHoliday from "./locales/ar/holiday.json";
import arReports from "./locales/ar/reports.json";
import arProfile from "./locales/ar/profile.json";

// Merge all translations into one namespace
const enTranslation = { 
  ...enCommon, 
  ...enDashboard, 
  ...enLogin, 
  ...enAttendance, 
  ...enLeave,
  ...enExpense,
  ...enSalary,
  ...enTask,
  ...enDocuments,
  ...enNotifications,
  ...enHoliday,
  ...enReports,
  ...enProfile 
};
const arTranslation = { 
  ...arCommon, 
  ...arDashboard, 
  ...arLogin, 
  ...arAttendance, 
  ...arLeave,
  ...arExpense,
  ...arSalary,
  ...arTask,
  ...arDocuments,
  ...arNotifications,
  ...arHoliday,
  ...arReports,
  ...arProfile 
};

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslation,
    },
    ar: {
      translation: arTranslation,
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
