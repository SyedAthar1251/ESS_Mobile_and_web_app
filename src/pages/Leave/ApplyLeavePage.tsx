import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { getLeaveApplicationList, createLeaveApplication, type CreateLeaveApplicationRequest } from "../../services/leave.service";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
} from "../../utils/pageCardStyles";

const ApplyLeavePage = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // ── State ──
  const [leaveTypes, setLeaveTypes] = useState<{ leave_type: string; closing_balance: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formLeaveType, setFormLeaveType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [halfDayDate, setHalfDayDate] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [leaveTypeOpen, setLeaveTypeOpen] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    visible: boolean;
  }>({ message: "", type: "success", visible: false });

  useEffect(() => {
    if (!toast.visible) return;
    // Errors persist until user closes them; success auto-dismisses after 5 s.
    const duration = toast.type === "error" ? 0 : 5000;
    const timer = duration > 0
      ? setTimeout(() => setToast((p) => ({ ...p, visible: false })), duration)
      : undefined;
    return () => { if (timer) clearTimeout(timer); };
  }, [toast.visible, toast.type]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true });
  };

  // Reusable Sick Leave detection — covers all variants (Full Pay, 75% Pay, Unpaid, etc.)
  const isSickLeave = formLeaveType
    ?.trim()
    .toLowerCase()
    .includes("sick leave");

  // ── Dedicated handler for leave-type selection ──
  const handleLeaveTypeSelect = (leaveType: string) => {
    console.log("================================");
    console.log("[HANDLE SELECT CALLED]");
    console.log("Selected value:", leaveType);
    console.log("================================");
    console.log("[ApplyLeavePage] RAW SELECTED:", leaveType);
    console.log("[ApplyLeavePage] JSON:", JSON.stringify(leaveType));
    console.log("[ApplyLeavePage] Trimmed:", leaveType.trim());
    console.log("[ApplyLeavePage] Lowercase:", leaveType.trim().toLowerCase());

    const sickCheck = leaveType
      .trim()
      .toLowerCase()
      .includes("sick leave");

    console.log("[ApplyLeavePage] Sick check:", sickCheck);

    setFormLeaveType(leaveType);
    setLeaveTypeOpen(false);
  };

  // Log when user picks a leave type so we can inspect the raw value
  useEffect(() => {
    console.log("================================");
    console.log("[STATE CHANGED]");
    console.log("formLeaveType =", formLeaveType);

    const sickCheck = formLeaveType
      ?.trim()
      .toLowerCase()
      .includes("sick leave");

    console.log("isSickLeave =", sickCheck);
  }, [formLeaveType]);

  // Log when attachment changes
  useEffect(() => {
    if (attachment) {
      console.log("[ApplyLeavePage] attachment selected:", attachment.name, attachment.type, attachment.size, "bytes");
    }
  }, [attachment]);

  // ── Fetch leave types from get_leave_application_list > balance[] ──
  useEffect(() => {
    let cancelled = false;

    const fetchTypes = async () => {
      try {
        setLoading(true);
        // get_leave_application_list returns balance[] with leave_type + closing_balance.
        // get_leave_type is a broken backend endpoint (HTTP 500) so we skip it.
        const res = await getLeaveApplicationList();
        if (cancelled) return;
        if (res.data?.balance) {
          const derived = res.data.balance
            .filter((b) => b.closing_balance > 0)
            .map((b) => ({
              leave_type: b.leave_type,
              closing_balance: b.closing_balance,
            }));
          console.log("[ApplyLeavePage] Derived leave types from API:", derived);
          setLeaveTypes((prev) => {
            console.log("[ApplyLeavePage] leaveTypes STATE UPDATED — count:", derived.length, "values:", derived.map(d => JSON.stringify(d.leave_type)));
            return derived;
          });
        }
      } catch (err: any) {
        console.error("[ApplyLeavePage] Fetch error:", err);
        if (!cancelled) setLoadError(err.message || "Failed to load leave types");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTypes();
    return () => { cancelled = true; };
  }, []);

  // ── Submit ──
  const handleSubmit = async () => {
    console.log("=================================");
    console.log("[APPLY BUTTON CLICKED]");
    console.log("Current form values:");

    console.log({
      leaveType: formLeaveType,
      fromDate,
      toDate,
      reason,
      halfDay,
      halfDayDate,
      attachment: attachment?.name || null,
    });

    setFormError(null);

    if (!formLeaveType) {
      setFormError("Leave type is required");
      return;
    }
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
    if (halfDay && !halfDayDate) {
      setFormError("Half-day date is required when half-day is enabled");
      return;
    }

    // Treat ALL Sick Leave variants (Sick Leave - Full Pay, Sick Leave - 75% Pay, etc.)
    // as requiring an attachment.
    if (isSickLeave && !attachment) {
      console.log("[ApplyLeavePage] BLOCKED — Sick Leave selected but no attachment");
      setFormError("Sick Leave requires an attachment");
      return;
    }

    console.log("[ApplyLeavePage] Submit body:", {
      leave_type: formLeaveType,
      from_date: fromDate,
      to_date: toDate,
      description: reason.trim() || undefined,
      half_day: halfDay,
      half_day_date: halfDay ? halfDayDate || fromDate : undefined,
      attachment: attachment ? attachment.name : undefined,
    } as any);

    const body: CreateLeaveApplicationRequest = {
      leave_type: formLeaveType,
      from_date: fromDate,
      to_date: toDate,
      ...(reason.trim() ? { description: reason.trim() } : {}),
      half_day: halfDay,
      ...(halfDay ? { half_day_date: halfDayDate || fromDate } : {}),
      ...(attachment ? { attachment } : {}),
    };

    try {
      setSubmitting(true);
      const res = await createLeaveApplication(body);

      if (res.data?.name) {
        showToast("Leave application submitted successfully", "success");
        setFormLeaveType("");
        setFromDate("");
        setToDate("");
        setReason("");
        setHalfDay(false);
        setHalfDayDate("");
        setAttachment(null);
        setTimeout(() => navigate("/leave"), 1500);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to submit leave application", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──
  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/leave")}
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">{t("leave") || "Leave"}</span>
        </button>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-bold text-gray-800">{t("applyLeave")}</h1>
      </div>

      {/* ── Form Card ── */}
      <div className={`${getPageCardStyle(theme)} p-4 space-y-4`}>
        <h2 className="font-semibold text-gray-800">{t("newLeaveApplication")}</h2>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-11 bg-gray-100 rounded-xl" />
            <div className="h-11 w-28 bg-gray-100 rounded-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-11 bg-gray-100 rounded-xl" />
              <div className="h-11 bg-gray-100 rounded-xl" />
            </div>
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-12 bg-gray-100 rounded-xl" />
          </div>
        ) : (
          <>
            {/* ── Leave Type ── */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t("leaveType")}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  console.log("[ApplyLeavePage] Dropdown toggle clicked — wasOpen:", leaveTypeOpen);
                  setLeaveTypeOpen(!leaveTypeOpen);
                }}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-left flex items-center justify-between"
              >
                <span className={formLeaveType ? "text-gray-800" : "text-gray-400"}>
                  {formLeaveType || `${t("selectLeaveType")}`}
                  {formLeaveType &&
                    (() => {
                      const lt = leaveTypes.find((l) => l.leave_type === formLeaveType);
                      return lt != null ? `  (Available: ${lt.closing_balance})` : "";
                    })()}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${leaveTypeOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {leaveTypeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                      className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                    >
                      {(() => {
                        console.log("[ApplyLeavePage] Dropdown rendered — leaveTypes count:", leaveTypes.length, "leaveTypeOpen:", leaveTypeOpen);
                        return null;
                      })()}
                      {leaveTypes.length === 0 ? (
                      <p className="p-3 text-sm text-gray-400">No leave types available</p>
                    ) : (
                      leaveTypes.map((lt) => (
                        <div
                          key={lt.leave_type}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleLeaveTypeSelect(lt.leave_type);
                          }}
                          className={`w-full p-3 text-left hover:bg-indigo-50 transition-colors flex justify-between items-center cursor-pointer ${
                            formLeaveType === lt.leave_type
                              ? "bg-indigo-50 text-indigo-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <span>{lt.leave_type}</span>

                          <span className="text-xs text-gray-400">
                            Available: {lt.closing_balance}
                          </span>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Debug: leave type detection ── */}
            <p className="text-xs text-red-500">Selected: {formLeaveType}</p>
            <p className="text-xs text-blue-500">Is Sick Leave: {String(isSickLeave)}</p>

            {/* ── Half Day toggle ── */}
            <div className="flex items-center justify-between py-2 w-full">
              <span className="text-sm text-gray-600 truncate">
                {t("halfDay") || "Half Day"}
              </span>
              <div className="shrink-0 ml-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={halfDay}
                  onClick={() => setHalfDay((v) => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors touch-none ${
                    halfDay ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <motion.div
                    animate={{ x: halfDay ? 26 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{
                      position: "absolute",
                      top: 2,
                      left: 0,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "white",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      willChange: "transform",
                    }}
                  />
                </button>
              </div>
            </div>

            {/* ── Half Day Date (conditional) ── */}
            {halfDay && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {t("halfDayDate") || "Half-Day Date"}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    value={halfDayDate}
                    onChange={(e) => setHalfDayDate(e.target.value)}
                    min={fromDate || undefined}
                    max={toDate || undefined}
                    className="w-full p-3 border border-gray-200 rounded-xl text-gray-900 bg-gray-50 [color-scheme:light]"
                  />
                </motion.div>
              </AnimatePresence>
            )}

            {/* ── From / To Date ── */}
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

            {/* ── Reason ── */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t("reason")}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 resize-none"
                placeholder={t("enterReason")}
              />
            </div>

            {/* ── Attachment (mandatory for Sick Leave) ── */}
            {isSickLeave && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {t("attachment")}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <label className="block w-full p-3 border border-gray-200 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      console.log("[ApplyLeavePage] attachment onChange — file:", file ? file.name : "null");
                      setAttachment(file);
                    }}
                  />
                  <span className="text-sm text-gray-600">
                    {attachment
                      ? attachment.name
                      : t("chooseFile")}
                  </span>
                </label>
                {attachment && (
                  <p className="mt-1 text-xs text-green-600">
                    {attachment.name}
                  </p>
                )}
              </div>
            )}

            {loadError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{loadError}</p>
            )}

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
            )}

            <button
              type="button"
              onClick={() => {
                console.log("=================================");
                console.log("[SUBMIT BUTTON PRESSED]");
                handleSubmit();
              }}
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (t("submitting") || "Submitting…") : t("submitApplication")}
            </button>
          </>
        )}
      </div>

      {/* ── Toast / Error modal notification ── */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            role="dialog"
            aria-label={toast.type === "error" ? "Error" : "Success"}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          >
            <motion.div
              layout
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-2xl shadow-2xl p-5 ${
                toast.type === "error"
                  ? "bg-white"
                  : "bg-white text-slate-900 border border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className={`mt-0.5 text-sm font-semibold leading-snug ${
                  toast.type === "error"
                    ? "text-red-600"
                    : "text-green-600"
                }`}>
                  {toast.message}
                </p>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => setToast((p) => ({ ...p, visible: false }))}
                  className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApplyLeavePage;
