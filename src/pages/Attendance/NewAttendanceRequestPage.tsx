import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { createAttendanceRequest, updateAttendanceRequest, getAttendanceRequest, AttendanceRequestDetail, CreateAttendanceRequestPayload, UpdateAttendanceRequestPayload, getShiftTypes } from "../../services/attendanceRequest.service";
import { getEmployeeProfile } from "../../services/employee.service";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
} from "../../utils/pageCardStyles";
import SearchableSelect from "../../components/common/SearchableSelect";

const NewAttendanceRequestPage = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const isEditMode = !!name;

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [shift, setShift] = useState("");
  const [shiftTypes, setShiftTypes] = useState<Array<{ label: string; value: string }>>([]);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [shiftDropdownOpen, setShiftDropdownOpen] = useState(false);
  const [reasonDropdownOpen, setReasonDropdownOpen] = useState(false);
  const [halfDay, setHalfDay] = useState(false);
  const [includeHolidays, setIncludeHolidays] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<{
    employee: string;
    employee_name: string;
    department: string;
    company: string;
  } | null>(null);
  const [loading, setLoading] = useState(isEditMode);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    visible: boolean;
  }>({ message: "", type: "success", visible: false });

  useEffect(() => {
    if (!toast.visible) return;
    const duration = toast.type === "error" ? 0 : 5000;
    const timer = duration > 0
      ? setTimeout(() => setToast((p) => ({ ...p, visible: false })), duration)
      : undefined;
    return () => { if (timer) clearTimeout(timer); };
  }, [toast.visible, toast.type]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true });
  };

  useEffect(() => {
    const fetchEmployee = async () => {
      const savedUser = localStorage.getItem("ess_user");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.employeeId) {
          const profile = await getEmployeeProfile(userData.employeeId);
          if (profile) {
            setEmployeeInfo({
              employee: profile.id,
              employee_name: profile.employeeName,
              department: profile.department || "",
              company: profile.company || "",
            });
          }
        }
      }
    };
    fetchEmployee();
  }, []);

  useEffect(() => {
    if (!name || !isEditMode) return;

    const fetchRequest = async () => {
      try {
        setLoading(true);
        const data = await getAttendanceRequest(name);
        if (data) {
          setFromDate(data.from_date);
          setToDate(data.to_date);
          setReason(data.reason || "");
          setShift(data.shift || "");
        } else {
          setFormError("Request not found");
        }
      } catch {
        setFormError("Failed to load request");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [name, isEditMode]);

  useEffect(() => {
    const fetchShiftTypes = async () => {
      setShiftLoading(true);
      const types = await getShiftTypes();
      setShiftTypes(types);
      setShiftLoading(false);
    };
    fetchShiftTypes();
  }, []);

  const handleSubmit = async () => {
    setFormError(null);

    if (!fromDate) {
      setFormError("From date is required");
      return;
    }
    if (!toDate) {
      setFormError("To date is required");
      return;
    }
    if (toDate < fromDate) {
      setFormError("To date cannot be before from date");
      return;
    }
    if (!reason.trim()) {
      setFormError("Reason is required");
      return;
    }
    if (!shift) {
      setFormError("Shift is required");
      return;
    }

    try {
      setSubmitting(true);

      if (isEditMode && name) {
        const updatePayload: UpdateAttendanceRequestPayload = {
          from_date: fromDate,
          to_date: toDate,
          reason: reason.trim(),
          shift: shift.trim(),
          half_day: halfDay ? 1 : 0,
          include_holidays: includeHolidays ? 1 : 0,
          explanation: explanation.trim() || undefined,
        };
        await updateAttendanceRequest(name, updatePayload);
        showToast("Attendance request updated successfully", "success");
      } else {
        const createPayload: CreateAttendanceRequestPayload = {
          from_date: fromDate,
          to_date: toDate,
          reason: reason.trim(),
          shift: shift.trim(),
          half_day: halfDay ? 1 : 0,
          include_holidays: includeHolidays ? 1 : 0,
          explanation: explanation.trim() || undefined,
        };
        await createAttendanceRequest(createPayload);
        showToast("Attendance request submitted successfully", "success");
      }

      setTimeout(() => navigate("/attendance/requests"), 1500);
    } catch (err: any) {
      showToast(err.message || "Failed to submit attendance request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/attendance/requests")}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">{t("attendanceRequests") || "Attendance Requests"}</span>
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-bold text-gray-800">
            {isEditMode ? (t("editAttendanceRequest") || "Edit Attendance Request") : (t("newAttendanceRequest") || "New Attendance Request")}
          </h1>
        </div>

        <div className={`${getPageCardStyle(theme)} p-4 space-y-4`}>
          <h2 className="font-semibold text-gray-800">{t("requestDetails") || "Request Details"}</h2>

          <div className={`${getPageCardStyle(theme)} p-4`}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t("employee") || "Employee"}
            </h3>
            <div className="space-y-1">
              <DetailRow label={t("employee") || "Employee"} value={employeeInfo?.employee || "-"} />
              <DetailRow label={t("employeeName") || "Employee Name"} value={employeeInfo?.employee_name || "-"} />
              <DetailRow label={t("department") || "Department"} value={employeeInfo?.department || "-"} />
              <DetailRow label={t("company") || "Company"} value={employeeInfo?.company || "-"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t("fromDate")}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  if (toDate && e.target.value > toDate) setToDate("");
                }}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 [color-scheme:light]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t("toDate")}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 [color-scheme:light]"
              />
            </div>
          </div>

          <SearchableSelect
            label={t("shift")}
            required
            placeholder={t("selectShift") || "Select Shift"}
            searchPlaceholder={t("search") || "Search..."}
            value={shift}
            options={shiftTypes}
            isOpen={shiftDropdownOpen}
            onOpenChange={setShiftDropdownOpen}
            onSelect={setShift}
            emptyMessage={t("noShiftTypes") || "No shift types available"}
          />

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="halfDay"
                checked={halfDay}
                onChange={(e) => setHalfDay(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="halfDay" className="ml-2 text-sm text-gray-600">
                {t("halfDay") || "Half Day"}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeHolidays"
                checked={includeHolidays}
                onChange={(e) => setIncludeHolidays(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="includeHolidays" className="ml-2 text-sm text-gray-600">
                {t("includeHolidays") || "Include Holidays"}
              </label>
            </div>
          </div>

          <SearchableSelect
            label={t("reason") || "Reason"}
            required
            placeholder={t("selectReason") || "Select Reason"}
            searchPlaceholder={t("search") || "Search..."}
            value={reason}
            options={[
              { value: "Work From Home", label: t("workFromHome") || "Work From Home" },
              { value: "On Duty", label: t("onDuty") || "On Duty" },
            ]}
            isOpen={reasonDropdownOpen}
            onOpenChange={setReasonDropdownOpen}
            onSelect={setReason}
            emptyMessage={t("noReasons") || "No reasons available"}
          />

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {t("explanation") || "Explanation"}
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              placeholder={t("enterExplanation") || "Enter explanation (optional)"}
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 resize-none"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (t("submitting") || "Submitting…") : t("save") || "Save"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          >
            <div className="w-full max-w-sm rounded-2xl shadow-2xl p-5 bg-white">
              <p className={`text-sm font-semibold text-${toast.type === "error" ? "red" : "green"}-600`}>
                {toast.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <p className="text-xs text-gray-400">{label}</p>
    <p className="text-xs font-medium text-gray-800">{value}</p>
  </div>
);

export default NewAttendanceRequestPage;