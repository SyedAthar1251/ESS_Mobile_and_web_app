import { useState, useEffect, ReactNode, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import {
  getLeaveApplicationList,
  createLeaveApplication,
  getLeaveApprover,
  LeaveApplicationListResponse,
  LeaveApplication,
  LeaveTypeBalance,
  CreateLeaveApplicationRequest,
} from "../../services/leave.service";
import { translateBatch, translateDynamic, shouldTranslate, LANGUAGES } from "../../services/translation.service";

const StatCardSkeleton = () => (
  <div className="bg-gray-100 rounded-2xl p-4 text-center animate-pulse">
    <div className="h-6 w-8 bg-gray-200 rounded mx-auto mb-2" />
    <div className="h-3 w-16 bg-gray-200 rounded mx-auto" />
  </div>
);

const BalanceCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-lg p-4 animate-pulse"
  >
    <div className="h-4 w-28 bg-gray-200 rounded mb-3" />
    <div className="grid grid-cols-4 gap-2 mb-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="h-3 w-10 bg-gray-200 rounded mx-auto mb-1" />
          <div className="h-5 w-6 bg-gray-200 rounded mx-auto" />
        </div>
      ))}
    </div>
    <div className="h-2 bg-gray-100 rounded-full" />
  </motion.div>
);

const LeaveRowSkeleton = () => (
  <div className="p-4 animate-pulse">
    <div className="flex items-start justify-between mb-2">
      <div>
        <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded-full" />
    </div>
    <div className="h-3 w-44 bg-gray-200 rounded mb-1" />
    <div className="h-3 w-16 bg-gray-200 rounded" />
  </div>
);

const ApplyFormSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-5 w-44 bg-gray-200 rounded mb-2" />
    <div className="h-11 bg-gray-100 rounded-xl" />
    <div className="h-11 w-28 bg-gray-100 rounded-full" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-11 bg-gray-100 rounded-xl" />
      <div className="h-11 bg-gray-100 rounded-xl" />
    </div>
    <div className="h-20 bg-gray-100 rounded-xl" />
    <div className="h-12 bg-gray-100 rounded-xl" />
  </div>
);

const LeavePage = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();

  const [activeView, setActiveView] = useState<"list" | "balance" | "apply">("list");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [leaveTypes, setLeaveTypes] = useState<{ leave_type: string; closing_balance: number }[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveTypeBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [listDisplayLimit, setListDisplayLimit] = useState(10);

  const [formLeaveType, setFormLeaveType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [customLeaveIntent, setCustomLeaveIntent] = useState("");
  const [handOverDate, setHandOverDate] = useState("");
  const [firstDayReportToWork, setFirstDayReportToWork] = useState("");
  const [excludePublicHolidays, setExcludePublicHolidays] = useState(true);
  const [halfDay, setHalfDay] = useState(false);
  const [halfDayDate, setHalfDayDate] = useState("");
  const [customExpectedDeliveryDate, setCustomExpectedDeliveryDate] = useState("");
  const [customChildBirthDate, setCustomChildBirthDate] = useState("");
  const [customRelationshipType, setCustomRelationshipType] = useState("");
  const [customApprovedLeaveForm, setCustomApprovedLeaveForm] = useState<File | null>(null);
  const [customEnrollmentProof, setCustomEnrollmentProof] = useState<File | null>(null);
  const [customMarriageProof, setCustomMarriageProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [leaveTypeDropdownOpen, setLeaveTypeDropdownOpen] = useState(false);
  const [leaveIntentDropdownOpen, setLeaveIntentDropdownOpen] = useState(false);
  const [relationshipTypeDropdownOpen, setRelationshipTypeDropdownOpen] = useState(false);

  const [leaveApprover, setLeaveApprover] = useState<string | null>(null);
  const [showNoApproverModal, setShowNoApproverModal] = useState(false);

  // ═══════════════════════════════════════════════════════════
  //  TRANSLATION STATE  (dynamic API values only)
  // ═══════════════════════════════════════════════════════════

  const [translatedLeaveTypes, setTranslatedLeaveTypes] = useState<Record<string, string>>({});
  const [translatedStatuses, setTranslatedStatuses] = useState<Record<string, string>>({});
  const prevLangRef = useRef<string>(language);
  const prevDataKeyRef = useRef<string>("");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setLeaveTypeDropdownOpen(false);
        setLeaveIntentDropdownOpen(false);
        setRelationshipTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [showDetail, setShowDetail] = useState(false);

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

   // ── Translate dynamic API values ────────────────────────────
  useEffect(() => {
    if (language === LANGUAGES.EN) {
      setTranslatedLeaveTypes({});
      setTranslatedStatuses({});
      return;
    }

    // Build a unique set of leave_type and status values to translate
    const allLeaveTypes = new Set<string>();
    const allStatuses = new Set<string>();

    leaveApplications.forEach((app) => {
      if (app.leave_type) allLeaveTypes.add(app.leave_type);
      if (app.status) allStatuses.add(app.status);
    });
    leaveBalance.forEach((b) => {
      if (b.leave_type) allLeaveTypes.add(b.leave_type);
    });

    const dataKey = `${language}|${[...allLeaveTypes].sort().join(",")}|${[...allStatuses].sort().join(",")}`;
    if (dataKey === prevDataKeyRef.current) return;
    prevDataKeyRef.current = dataKey;

    if (allLeaveTypes.size === 0 && allStatuses.size === 0) return;

    let cancelled = false;

    const doTranslate = async () => {
      try {
        const typesToTranslate = [...allLeaveTypes].filter(shouldTranslate);
        const statusesToTranslate = [...allStatuses].filter(shouldTranslate);

        const [typeMap, statusMap] = await Promise.all([
          typesToTranslate.length > 0 ? translateBatch(typesToTranslate, language) : Promise.resolve(new Map<string, string>()),
          statusesToTranslate.length > 0 ? translateBatch(statusesToTranslate, language) : Promise.resolve(new Map<string, string>()),
        ]);

        if (cancelled) return;

        const ltResult: Record<string, string> = {};
        typeMap.forEach((v, k) => { ltResult[k] = v; });
        setTranslatedLeaveTypes(ltResult);

        const stResult: Record<string, string> = {};
        statusMap.forEach((v, k) => { stResult[k] = v; });
        setTranslatedStatuses(stResult);
      } catch (err) {
        console.error("[LeavePage Translation Error]", err);
        if (!cancelled) {
          setTranslatedLeaveTypes({});
          setTranslatedStatuses({});
        }
      }
    };

    doTranslate();
    return () => { cancelled = true; };
  }, [leaveApplications, leaveBalance, language]);

  // ── Helper to get translated leave type ─────────────────────
  const getTranslatedLeaveType = (original: string): string => {
    if (language === LANGUAGES.EN || !original) return original;
    return translatedLeaveTypes[original] || original;
  };

  // ── Helper to get translated status ─────────────────────────
  const getTranslatedStatus = (original: string): string => {
    if (language === LANGUAGES.EN || !original) return original;
    return translatedStatuses[original] || original;
  };

    // --- Fetch all leave data on mount ---
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (activeView !== "list") return;
      try {
        setLoading(true);
        setLoadError(null);

        const listRes = await getLeaveApplicationList();

        if (cancelled) return;

        if (listRes.data) {
          setLeaveBalance(listRes.data.balance || []);
          setLeaveApplications([...(listRes.data.upcoming || []), ...(listRes.data.taken || [])]);
          const derivedTypes = (listRes.data.balance || []).map((b: LeaveTypeBalance) => ({
            leave_type: b.leave_type,
            closing_balance: b.closing_balance,
          }));
          setLeaveTypes(derivedTypes);
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error("[LeavePage] Fetch error:", err);
        setLoadError(err.message || t("loadError") || "Failed to load leave data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [activeView]);

  useEffect(() => {
    setListDisplayLimit(10);
  }, [leaveApplications.length]);

  const isSickLeave = formLeaveType
    ?.trim()
    .toLowerCase()
    .includes("sick leave");

  const isMaternityLeave = formLeaveType === "Maternity Leave";

  const isPaternityLeave = formLeaveType === "Paternity Leave";

  const isBereavementLeave =
    formLeaveType === "Bereavement Leave" || formLeaveType === "Bereavement Leave (Sibling)";

  const isExaminationLeave =
    formLeaveType === "Examination Leave" || formLeaveType === "Examination Leave (Repeat Year)";

  const isMarriageLeave = formLeaveType === "Marriage leave";

  const isHalfDayDateRequired = halfDay && fromDate && toDate && fromDate !== toDate;

  const shouldShowAttachments =
    isSickLeave ||
    isMaternityLeave ||
    isExaminationLeave ||
    isMarriageLeave;

  const handleLeaveTypeSelect = (leaveType: string) => {
    setFormLeaveType(leaveType);
    setLeaveTypeDropdownOpen(false);
  };

  useEffect(() => {
    const sickCheck = formLeaveType
      ?.trim()
      .toLowerCase()
      .includes("sick leave");
  }, [formLeaveType]);

  const handleApplyClick = async () => {
    console.log("[LeavePage] Apply button clicked — checking leave approver...");
    setDropdownOpen(false);

    try {
      const approver = await getLeaveApprover();
      if (!approver) {
        console.warn("[LeavePage] No leave_approver found for employee");
        setShowNoApproverModal(true);
        return;
      }
      setLeaveApprover(approver);
      console.log("[LeavePage] Leave approver fetched successfully:", approver);
      setActiveView("apply");
    } catch (err) {
      console.error("[LeavePage] Error while fetching leave approver:", err);
      setShowNoApproverModal(true);
    }
  };

  // --- Submit leave application ---
  const handleSubmit = async () => {
    console.log("=================================");
    console.log("[APPLY BUTTON CLICKED]");
    console.log("Current form values:");

    console.log({
      leaveType: formLeaveType,
      fromDate,
      toDate,
      customLeaveIntent,
      handOverDate,
      firstDayReportToWork,
      reason,
      halfDay,
      halfDayDate,
      excludePublicHolidays,
      isMaternityLeave,
      isPaternityLeave,
      isBereavementLeave,
      customExpectedDeliveryDate,
      customChildBirthDate,
      customRelationshipType,
    });

    setFormError(null);

    if (!formLeaveType) {
      setFormError(t("leaveTypeRequired") || "Leave type is required");
      return;
    }
    if (!fromDate) {
      setFormError(t("fromDateRequired") || "From date is required");
      return;
    }
    if (!toDate) {
      setFormError(t("toDateRequired") || "To date is required");
      return;
    }
    if (toDate < fromDate) {
      setFormError(t("toDateError") || "To date cannot be before from date");
      return;
    }
    if (!customLeaveIntent) {
      setFormError(t("customLeaveIntentRequired") || "Leave intent is required");
      return;
    }
    if (!handOverDate) {
      setFormError(t("handOverDateRequired") || "Hand over date is required");
      return;
    }
    if (!firstDayReportToWork) {
      setFormError(t("firstDayReportToWorkRequired") || "First day report to work is required");
      return;
    }

    if (isHalfDayDateRequired && !halfDayDate) {
      setFormError(t("halfDayDateRequired") || "Half-day date is required");
      return;
    }

    if (isMaternityLeave && !customExpectedDeliveryDate) {
      setFormError(t("expectedDeliveryDateRequired") || "Expected delivery date is required");
      return;
    }

    if (isPaternityLeave && !customChildBirthDate) {
      setFormError(t("childBirthDateRequired") || "Child birth date is required");
      return;
    }

    if (isBereavementLeave && !customRelationshipType) {
      setFormError(t("relationshipTypeRequired") || "Relationship type is required");
      return;
    }

    const isSickLeaveVariant = isSickLeave || isMaternityLeave;
    if (isSickLeaveVariant && !customApprovedLeaveForm) {
      setFormError("Medical Certificate Proof is required");
      return;
    }

    if (isExaminationLeave && !customEnrollmentProof) {
      setFormError("Enrollment Proof is required");
      return;
    }

    if (isMarriageLeave && !customMarriageProof) {
      setFormError("Marriage Proof is required");
      return;
    }

    console.log("[LeavePage] Submit body:", {
      leave_type: formLeaveType,
      from_date: fromDate,
      to_date: toDate,
      custom_leave_intent: customLeaveIntent,
      hand_over_date: handOverDate,
      first_day_report_to_work: firstDayReportToWork,
      description: reason.trim() || undefined,
      exclude_public_holidays: excludePublicHolidays,
      half_day: halfDay,
      half_day_date: halfDay ? halfDayDate || fromDate : undefined,
      custom_expected_delivery_date: isMaternityLeave ? customExpectedDeliveryDate : undefined,
      custom_child_birth_date: isPaternityLeave ? customChildBirthDate : undefined,
      custom_relationship_type: isBereavementLeave ? customRelationshipType : undefined,
      leave_approver: leaveApprover || undefined,
    });

    const body: CreateLeaveApplicationRequest = {
      leave_type: formLeaveType,
      from_date: fromDate,
      to_date: toDate,
      custom_leave_intent: customLeaveIntent,
      hand_over_date: handOverDate,
      first_day_report_to_work: firstDayReportToWork,
      ...(reason.trim() ? { description: reason.trim() } : {}),
      exclude_public_holidays: excludePublicHolidays,
      half_day: halfDay,
      ...(halfDay ? { half_day_date: halfDayDate || fromDate } : {}),
      ...(isMaternityLeave ? { custom_expected_delivery_date: customExpectedDeliveryDate } : {}),
      ...(isPaternityLeave ? { custom_child_birth_date: customChildBirthDate } : {}),
      ...(isBereavementLeave ? { custom_relationship_type: customRelationshipType } : {}),
      ...(customApprovedLeaveForm ? { custom_approved_leave_form: customApprovedLeaveForm } : {}),
      ...(customEnrollmentProof ? { custom_enrollment_proof: customEnrollmentProof } : {}),
      ...(customMarriageProof ? { custom_marriage_proof: customMarriageProof } : {}),
      leave_approver: leaveApprover || undefined,
    };

    try {
      setSubmitting(true);
      if (customApprovedLeaveForm || customEnrollmentProof || customMarriageProof) {
        const { createLeaveApplication: createWithFiles } = await import("../../services/leave.service");
        await createWithFiles(body);
      } else {
        await createLeaveApplication(body);
      }

      showToast(t("leaveSubmitted") || "Leave application submitted successfully", "success");

      setFormLeaveType("");
      setFromDate("");
      setToDate("");
      setReason("");
      setCustomLeaveIntent("");
      setHandOverDate("");
      setFirstDayReportToWork("");
      setHalfDay(false);
      setHalfDayDate("");
      setCustomExpectedDeliveryDate("");
      setCustomChildBirthDate("");
      setCustomRelationshipType("");
      setCustomApprovedLeaveForm(null);
      setCustomEnrollmentProof(null);
      setCustomMarriageProof(null);

      setActiveView("list");
    } catch (err: any) {
      console.error("[LeavePage] Submit error:", err);
      setFormError(err.message || t("leaveSubmitError") || "Failed to submit leave application");
    } finally {
      setSubmitting(false);
    }
  };

  const parseDDMMYYYY = (dateStr: string): Date => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [d, m, y] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(dateStr + "T00:00:00");
  };

  const formatDate = (dateStr: string) => {
    const date = parseDDMMYYYY(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let label = status;
    let bg = "";
    let text = "";

    if (s === "approved" || s === "معتمد") {
      label = t("approved") || "Approved";
      bg = "bg-green-100";
      text = "text-green-700";
    } else if (s === "rejected" || s === "مرفوض") {
      label = t("rejected") || "Rejected";
      bg = "bg-red-100";
      text = "text-red-700";
    } else {
      label = t("pendingStatus") || "Pending";
      bg = "bg-yellow-100";
      text = "text-yellow-700";
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const upcomingApplications = leaveApplications.filter(
    (a) => a.from_date && parseDDMMYYYY(a.from_date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );
  const takenApplications = leaveApplications.filter(
    (a) => a.from_date && parseDDMMYYYY(a.from_date) < new Date(new Date().setHours(0, 0, 0, 0))
  );

  const allListItems = [...upcomingApplications, ...takenApplications];
  const totalItems = allListItems.length;
  const displayedUpcoming = upcomingApplications.slice(0, listDisplayLimit);
  const hasMore = totalItems > listDisplayLimit;
  const hitLimit = listDisplayLimit >= totalItems;

  const displayBalances =
    leaveBalance.length > 0
      ? leaveBalance
          .filter(
            (item) =>
              (item.opening_balance && item.opening_balance > 0) ||
              (item.leaves_taken && item.leaves_taken > 0) ||
              (item.closing_balance && item.closing_balance > 0),
          )
          .map((item) => ({
            ...item,
            allocated: item.opening_balance ?? 0,
            used: item.leaves_taken ?? 0,
            remaining: item.closing_balance ?? 0,
            leave_type: item.leave_type,
          }))
      : [];

  const pendingLeaves =
    leaveApplications
      .filter((app) => app.status?.toLowerCase() === "open")
      .reduce((sum, app) => sum + (app.total_leave_days || 0), 0);

  const totalAllocated = (displayBalances?.reduce((sum, item) => sum + (item.allocated || 0), 0) || 0);
  const totalUsed      = (displayBalances?.reduce((sum, item) => sum + (item.used      || 0), 0) || 0);
  const totalRemaining = (displayBalances?.reduce((sum, item) => sum + (item.remaining || 0), 0) || 0);

  const viewOptions = [
    {
      key: activeView,
      label: t(activeView === "list" ? "myRequests" : activeView === "balance" ? "leaveBalance" : "applyLeave"),
      icon: activeView === "list"
        ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
        : activeView === "balance"
        ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
        : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
    },
  ];

  return (
    <div className="p-4 space-y-6">

      {/* ── Header ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">{t("leave") || "Leave"}</h1>
          {activeView !== "apply" && (
            <button
              type="button"
              onClick={handleApplyClick}
              className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">{t("applyLeave")}</span>
            </button>
          )}
        </div>

        {/* Stats cards from API balance totals */}
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : displayBalances.length > 0 || pendingLeaves > 0 ? (
          <div className="grid grid-cols-4 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="bg-indigo-50 rounded-2xl p-4 text-center"
            >
              <p className="text-xl font-bold text-indigo-600">
                {totalAllocated}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("totalAllocated")}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-indigo-50 rounded-2xl p-4 text-center"
            >
              <p className="text-xl font-bold text-indigo-600">
                {totalUsed}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("used")}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-indigo-50 rounded-2xl p-4 text-center"
            >
              <p className="text-xl font-bold text-indigo-600">
                {Math.max(totalAllocated - totalUsed - totalRemaining, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("pending")}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-indigo-50 rounded-2xl p-4 text-center"
            >
              <p className="text-xl font-bold text-indigo-600">
                {totalRemaining}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("remaining")}</p>
            </motion.div>
          </div>
        ) : null}

        {/* Dropdown for view selection */}
        <div className="relative" data-dropdown>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-indigo-600">{viewOptions[0].icon}</span>
              <span className="font-medium text-gray-800">{viewOptions[0].label}</span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
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
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        console.log("[LeavePage] View selected: myRequests");
                        setActiveView("list");
                        setDropdownOpen(false);
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${
                        activeView === "list" ? "bg-indigo-50" : ""
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-medium text-gray-800">{t("myRequests")}</span>
                      {activeView === "list" && <span className="ml-auto text-indigo-600">✓</span>}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        console.log("[LeavePage] View selected: leaveBalance");
                        setActiveView("balance");
                        setDropdownOpen(false);
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors ${
                        activeView === "balance" ? "bg-indigo-50" : ""
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="font-medium text-gray-800">{t("leaveBalance")}</span>
                      {activeView === "balance" && <span className="ml-auto text-indigo-600">✓</span>}
                    </button>
                  </li>
                </motion.ul>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════════════ */}
      {/* SECTION 1 & 2: Leave Requests Mini-List */}
      {/* ══════════════════════════════════════ */}

      {activeView === "list" && !loading && (
        <div className={`shadow-lg ${theme === "neon-green" ? "neon-card" : "bg-white rounded-2xl"}`}>
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {t("upcomingLeave") || "Upcoming Leave"}
            </h3>
            {upcomingApplications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {t("noLeaveRequests")}
              </p>
            ) : (
              displayedUpcoming.map((app, idx) => (
                <motion.div
                  key={app.name || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    setSelectedLeave(app);
                    setShowDetail(true);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-colors hover:bg-indigo-50 ${idx < displayedUpcoming.length - 1 ? "" : ""}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-gray-800 text-sm">{getTranslatedLeaveType(app.leave_type)}</h4>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(app.from_date)} – {formatDate(app.to_date)}
                  </p>
                </motion.div>
              ))
            )}

            {hasMore && (
              <button
                type="button"
                onClick={() => setListDisplayLimit(hitLimit ? 10 : totalItems)}
                className="w-full text-sm text-indigo-600 font-medium py-2 hover:bg-indigo-50 rounded-xl transition-colors"
              >
                {hitLimit
                  ? t("showLess") || "Show Less"
                  : t("loadMore") || `Load More (${totalItems - listDisplayLimit} remaining)`}
              </button>
            )}
          </div>

          {takenApplications.length > 0 && (
            <div className="p-4 border-t border-gray-100 space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {t("takenLeave") || "Taken Leave"}
              </h3>
              {takenApplications.map((app, idx) => (
                <div
                  key={app.name || idx}
                  onClick={() => {
                    setSelectedLeave(app);
                    setShowDetail(true);
                  }}
                  className="p-3 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-gray-800 text-sm">{getTranslatedLeaveType(app.leave_type)}</h4>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(app.from_date)} – {formatDate(app.to_date)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {app.total_leave_days} {t("days")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* SECTION 3: Leave Balance               */}
      {/* ══════════════════════════════════════ */}
      {activeView === "balance" && (
        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map((i) => <BalanceCardSkeleton key={i} />)
          ) : !displayBalances || displayBalances.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500">
              <p>{t("noLeaveRequests")}</p>
            </div>
          ) : (
            displayBalances.map((balance, index) => {
              const pct = balance.allocated > 0 ? (balance.used / balance.allocated) * 100 : 0;
              return (
                <motion.div
                  key={balance.leave_type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-4"
                >
                  <h3 className="font-semibold text-gray-800 mb-3">
                    {getTranslatedLeaveType(balance.leave_type)}
                  </h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">{t("allocated")}</p>
                      <p className="font-bold text-gray-800">{balance.allocated}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <p className="text-xs text-red-400">{t("used")}</p>
                      <p className="font-bold text-red-600">{balance.used}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2">
                      <p className="text-xs text-yellow-400">{t("pending")}</p>
                      <p className="font-bold text-yellow-600">
                        {Math.max(balance.allocated - balance.used - balance.remaining, 0)}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-xs text-green-400">{t("remaining")}</p>
                      <p className="font-bold text-green-600">{balance.remaining}</p>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-indigo-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* SECTION 4: Apply Leave Form             */}
      {/* ══════════════════════════════════════ */}
      {activeView === "apply" && (
        <div className={`shadow-lg ${theme === "neon-green" ? "neon-card" : "bg-white rounded-2xl"}`}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setActiveView("list")}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-800">{t("applyLeave")}</h2>
            </div>

            {loading ? (
              <ApplyFormSkeleton />
            ) : (
              <div className="space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {t("leaveDetails") || "Leave Details"}
                </h3>

                <div className="relative w-full" data-dropdown>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {t("leaveType")}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setLeaveTypeDropdownOpen(!leaveTypeDropdownOpen)}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-left flex items-center justify-between"
                  >
                    <span className={formLeaveType ? "text-gray-800" : "text-gray-400"}>
                      {formLeaveType ? getTranslatedLeaveType(formLeaveType) : t("selectLeaveType")}
                      {formLeaveType && (() => {
                        const lt = leaveTypes.find((l) => l.leave_type === formLeaveType);
                        return lt != null ? ` (${t("available") || "Available"}: ${lt.closing_balance})` : "";
                      })()}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${leaveTypeDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {leaveTypeDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {leaveTypes.length === 0 ? (
                        <p className="p-3 text-sm text-gray-400">{t("noLeaveRequests")}</p>
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
                            {getTranslatedLeaveType(lt.leave_type)}
                            <span className="float-right text-xs text-gray-400 mt-0.5">
                              {t("available") || "Available"}: {lt.closing_balance}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                   <div className="mt-3 relative w-full" data-dropdown>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                         {t("customLeaveIntent") || "Leave Intent"}
                         <span className="text-red-500 ml-1">*</span>
                      </label>
                      <button
                         type="button"
                         onClick={() => setLeaveIntentDropdownOpen(!leaveIntentDropdownOpen)}
                         className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-left flex items-center justify-between"
                      >
                        <span className={customLeaveIntent ? "text-gray-800" : "text-gray-400"}>
                          {customLeaveIntent || t("selectLeaveIntent") || "Select Leave Intent"}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${leaveIntentDropdownOpen ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {leaveIntentDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {[
                            { value: "Planned", label: t("planned") || "Planned" },
                            { value: "Vacation", label: t("vacation") || "Vacation" },
                          ].map((opt) => (
                            <div
                              key={opt.value}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setCustomLeaveIntent(opt.value);
                                setLeaveIntentDropdownOpen(false);
                              }}
                              className={`w-full p-3 text-left hover:bg-indigo-50 transition-colors cursor-pointer ${
                                customLeaveIntent === opt.value
                                  ? "bg-indigo-50 text-indigo-600 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              {opt.label}
                            </div>
                          ))}
                        </div>
                      )}
                   </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      {t("reason")}
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="w-full p-3 border text-black rounded-xl bg-gray-50 resize-none"
                      placeholder={t("enterReason")}
                    />
                  </div>
                </div>

                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {t("leaveDates") || "Leave Dates"}
                  </h3>

                 <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                       {t("handOverDate") || "Hand Over Date"}
                       <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                       type="date"
                       value={handOverDate}
                       onChange={(e) => setHandOverDate(e.target.value)}
                       className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 [color-scheme:light]"
                    />
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

                 <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                       {t("firstDayReportToWork") || "First Day Report to Work"}
                       <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                       type="date"
                       value={firstDayReportToWork}
                       onChange={(e) => setFirstDayReportToWork(e.target.value)}
                       className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 [color-scheme:light]"
                    />
                 </div>

                <div className="flex items-center justify-between py-2 mt-3">
                  <span className="text-sm text-gray-600">{t("halfDay") || "Half Day"}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={halfDay}
                    onClick={() => setHalfDay(!halfDay)}
                    className={`relative w-12 h-6 rounded-full transition-colors overflow-hidden ${
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

                <AnimatePresence>
                  {isHalfDayDateRequired && (
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
                        className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 [color-scheme:light]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between py-2 mt-3">
                  <span className="text-sm text-gray-600">{t("excludePublicHolidays") || "Exclude Public Holidays"}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={excludePublicHolidays}
                    onClick={() => setExcludePublicHolidays(!excludePublicHolidays)}
                    className={`relative w-12 h-6 rounded-full transition-colors overflow-hidden ${
                      excludePublicHolidays ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  >
                    <motion.div
                      animate={{ x: excludePublicHolidays ? 26 : 2 }}
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

                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {t("additionalInformation") || "Additional Information"}
                  </h3>

                <AnimatePresence>
                  {isMaternityLeave && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {t("expectedDeliveryDate") || "Expected Delivery Date"}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="date"
                        value={customExpectedDeliveryDate}
                        onChange={(e) => setCustomExpectedDeliveryDate(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 [color-scheme:light]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isPaternityLeave && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {t("childBirthDate") || "Child Birth Date"}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="date"
                        value={customChildBirthDate}
                        onChange={(e) => setCustomChildBirthDate(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 [color-scheme:light]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isBereavementLeave && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="relative w-full" data-dropdown>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          {t("relationshipType") || "Relationship Type"}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setRelationshipTypeDropdownOpen(!relationshipTypeDropdownOpen)}
                          className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-left flex items-center justify-between"
                        >
                          <span className={customRelationshipType ? "text-gray-800" : "text-gray-400"}>
                            {customRelationshipType || t("selectRelationshipType") || "Select Relationship Type"}
                          </span>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${relationshipTypeDropdownOpen ? "rotate-180" : ""}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {relationshipTypeDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {[
                              { value: "Spouse", label: t("spouse") || "Spouse" },
                              { value: "Parent", label: t("parent") || "Parent" },
                              { value: "Grandparent", label: t("grandparent") || "Grandparent" },
                              { value: "Child", label: t("child") || "Child" },
                              { value: "Grandchild", label: t("grandchild") || "Grandchild" },
                              { value: "Sibling", label: t("sibling") || "Sibling" },
                            ].map((opt) => (
                              <div
                                key={opt.value}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setCustomRelationshipType(opt.value);
                                  setRelationshipTypeDropdownOpen(false);
                                }}
                                className={`w-full p-3 text-left hover:bg-indigo-50 transition-colors cursor-pointer ${
                                  customRelationshipType === opt.value ? "bg-indigo-50 text-indigo-600 font-medium" : "text-gray-700"
                                }`}
                              >
                                {opt.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>

              <AnimatePresence>
                {shouldShowAttachments && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-b border-gray-100 pb-4"
                  >
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      {t("attachments") || "Attachments"}
                    </h3>

                  <AnimatePresence>
                    {(isSickLeave || isMaternityLeave) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-3"
                      >
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          {t("medicalCertificateProof") || "Medical Certificate Proof"}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <label className="block w-full p-3 border border-gray-200 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              console.log("[LeavePage] medical certificate onChange — file:", file ? file.name : "null");
                              setCustomApprovedLeaveForm(file);
                            }}
                          />
                          <span className="text-sm text-gray-600">
                            {customApprovedLeaveForm ? customApprovedLeaveForm.name : t("chooseFile")}
                          </span>
                        </label>
                        {customApprovedLeaveForm && (
                          <p className="mt-1 text-xs text-green-600">
                            {customApprovedLeaveForm.name}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isExaminationLeave && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-3"
                      >
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          {t("enrollmentProof") || "Enrollment Proof"}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <label className="block w-full p-3 border border-gray-200 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              console.log("[LeavePage] enrollment proof onChange — file:", file ? file.name : "null");
                              setCustomEnrollmentProof(file);
                            }}
                          />
                          <span className="text-sm text-gray-600">
                            {customEnrollmentProof ? customEnrollmentProof.name : t("chooseFile")}
                          </span>
                        </label>
                        {customEnrollmentProof && (
                          <p className="mt-1 text-xs text-green-600">
                            {customEnrollmentProof.name}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isMarriageLeave && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-3"
                      >
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          {t("marriageProof") || "Marriage Proof"}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <label className="block w-full p-3 border border-gray-200 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              console.log("[LeavePage] marriage proof onChange — file:", file ? file.name : "null");
                              setCustomMarriageProof(file);
                            }}
                          />
                          <span className="text-sm text-gray-600">
                            {customMarriageProof ? customMarriageProof.name : t("chooseFile")}
                          </span>
                        </label>
                        {customMarriageProof && (
                          <p className="mt-1 text-xs text-green-600">
                            {customMarriageProof.name}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? t("submitting") || "Submitting..."
                  : t("submitApplication")}
                </button>
              </div>
            )}
         </div>
        </div>
      )}

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

      <AnimatePresence>
        {showNoApproverModal && (
          <motion.div
            role="dialog"
            aria-label="Leave Approver Missing"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[210] flex items-center justify-center px-4 bg-black/40"
            onClick={() => setShowNoApproverModal(false)}
          >
            <motion.div
              layout
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl shadow-2xl p-6 bg-white"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Leave Approver Not Found
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  Leave approver is not assigned for your employee record. Please contact HR.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNoApproverModal(false)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetail && selectedLeave && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[15vh] px-4 pb-4 overflow-y-auto"
              onClick={() => setShowDetail(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-base">
                      {getTranslatedLeaveType(selectedLeave.leave_type)}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedLeave.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetail(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-5 py-4 space-y-3">
                  <DetailRow label={t("leaveType") || "Leave Type"} value={getTranslatedLeaveType(selectedLeave.leave_type)} />
                  <DetailRow
                    label={t("status") || "Status"}
                    value={<span className={selectedLeave.status === "Approved" ? "text-green-600" : selectedLeave.status === "Rejected" ? "text-red-600" : "text-yellow-600"}>{getTranslatedStatus(selectedLeave.status)}</span>}
                  />
                  <DetailRow
                    label={t("fromDate") || "From"}
                    value={formatDate(selectedLeave.from_date)}
                  />
                  <DetailRow
                    label={t("toDate") || "To"}
                    value={formatDate(selectedLeave.to_date)}
                  />
                  <DetailRow
                    label={t("days") || "Days"}
                    value={`${selectedLeave.total_leave_days} ${t("days") || "days"}`}
                  />
                  {selectedLeave.description && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">{t("reason") || "Reason"}</p>
                      <p className="text-sm text-gray-700">{selectedLeave.description}</p>
                    </div>
                  )}
                  {selectedLeave.posting_date && (
                    <DetailRow
                      label={t("appliedOn") || "Applied On"}
                      value={formatDate(selectedLeave.posting_date)}
                    />
                  )}
               </div>
            </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between">
    <p className="text-xs text-gray-400">{label}</p>
    <p className="text-sm text-gray-800 font-medium">{value}</p>
  </div>
);

export default LeavePage;
