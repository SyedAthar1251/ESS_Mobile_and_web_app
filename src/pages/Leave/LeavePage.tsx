import { useState, useEffect, useMemo, ReactNode, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import {
  getLeaveApplicationList,
  createLeaveApplication,
  getLeaveApprover,
  getLeaveApplicationDetail,
  getUserDisplayName,
  getLeaveCalendarDetails,
  getLeaveCalendarPreview,
  LeaveApplicationListResponse,
  LeaveApplication,
  LeaveApplicationDetail,
  LeaveTypeBalance,
  CreateLeaveApplicationRequest,
  LeaveCalendarResponse,
  LeaveCalendarSickLeaveSlab,
} from "../../services/leave.service";
import { translateBatch, translateDynamic, shouldTranslate, LANGUAGES } from "../../services/translation.service";
import LeaveApprovalFlow from "../../components/leave/LeaveApprovalFlow";
import LeaveCalendarView from "../../components/leave/LeaveCalendarView";
import LeaveCalendarPreviewSection from "../../components/leave/LeaveCalendarPreviewSection";
import { getHolidayListDetails, HolidayItem } from "../../services/holiday.service";
import { getEmployeeProfile } from "../../services/employee.service";
import { getUserCredentials } from "../../services/leave.service";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getPageCardStyle,
  getListItemCardClass,
} from "../../utils/pageCardStyles";
import SearchableSelect from "../../components/common/SearchableSelect";
import DatePickerField from "../../components/common/DatePickerField";
import { useLocation } from "react-router-dom";

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
    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse"
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
  const location = useLocation();

  const [activeView, setActiveView] = useState<"list" | "balance" | "apply">("list");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statsLeaveTypeDropdownOpen, setStatsLeaveTypeDropdownOpen] = useState(false);
  const [formLeaveTypeDropdownOpen, setFormLeaveTypeDropdownOpen] = useState(false);
  const [leaveIntentDropdownOpen, setLeaveIntentDropdownOpen] = useState(false);
  const [relationshipTypeDropdownOpen, setRelationshipTypeDropdownOpen] = useState(false);

  const [leaveApprover, setLeaveApprover] = useState<string | null>(null);
  const [showNoApproverModal, setShowNoApproverModal] = useState(false);

  const [leaveTypes, setLeaveTypes] = useState<{ leave_type: string; closing_balance: number }[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveTypeBalance[]>([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");
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
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        setStatsLeaveTypeDropdownOpen(false);
        setFormLeaveTypeDropdownOpen(false);
        setLeaveIntentDropdownOpen(false);
        setRelationshipTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [leaveApplicationDetail, setLeaveApplicationDetail] = useState<LeaveApplicationDetail | null>(null);
  const [approverDisplayName, setApproverDisplayName] = useState("");
  const [approvalFlowLoading, setApprovalFlowLoading] = useState(false);
  const [leaveHolidays, setLeaveHolidays] = useState<HolidayItem[]>([]);
  const [leaveCalendarData, setLeaveCalendarData] = useState<LeaveCalendarResponse | null>(null);
  const [leaveCalendarLoading, setLeaveCalendarLoading] = useState(false);
  const [leaveCalendarError, setLeaveCalendarError] = useState<string | null>(null);
  const [leavePreviewData, setLeavePreviewData] = useState<LeaveCalendarResponse | null>(null);
  const [leavePreviewLoading, setLeavePreviewLoading] = useState(false);
  const [leavePreviewError, setLeavePreviewError] = useState<string | null>(null);
  const [showLeaveConflictModal, setShowLeaveConflictModal] = useState(false);
  const [conflictingLeave, setConflictingLeave] = useState<LeaveApplication | null>(null);
  const [sickLeaveSlab, setSickLeaveSlab] = useState<LeaveCalendarSickLeaveSlab | null>(null);
  const [sickSlabLoading, setSickSlabLoading] = useState(false);

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
        // translation error suppressed
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

        // console.log("[LeavePage] Full API Response:", JSON.stringify(listRes, null, 2));
        // console.log("[LeavePage] Leave Balance (types):", JSON.stringify(listRes.data?.balance, null, 2));
        // console.log("[LeavePage] Upcoming leaves:", JSON.stringify(listRes.data?.upcoming, null, 2));
        // console.log("[LeavePage] Taken leaves:", JSON.stringify(listRes.data?.taken, null, 2));

        if (cancelled) return;

        if (listRes.data) {
          setLeaveBalance(listRes.data.balance || []);
          setLeaveApplications([...(listRes.data.upcoming || []), ...(listRes.data.taken || [])]);
          const derivedTypes = (listRes.data.balance || []).map((b: LeaveTypeBalance) => ({
            leave_type: b.leave_type,
            closing_balance: b.closing_balance,
          }));
          setLeaveTypes(derivedTypes);

          if (listRes.data.balance && listRes.data.balance.length > 0) {
            const annualLeave = listRes.data.balance.find(
              (b: LeaveTypeBalance) => b.leave_type?.toLowerCase().includes("annual")
            );
            setSelectedLeaveType(annualLeave ? annualLeave.leave_type : listRes.data.balance[0].leave_type);
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        // fetch error suppressed
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

  useEffect(() => {
    if (!location.state?.openLeaveDetail || !location.state?.leaveId) return;

    const leaveId = location.state.leaveId as string | undefined;
    if (!leaveId) return;

    const found = leaveApplications.find((app) => app.name === leaveId);
    if (found) {




      setSelectedLeave(found);
      setShowDetail(true);
    } else {
      showToast("Unable to load leave details", "error");
    }

    window.history.replaceState({}, document.title);
  }, [location.state, leaveApplications]);

  useEffect(() => {
    if (!showDetail || !selectedLeave?.name) {
      setLeaveApplicationDetail(null);
      setApproverDisplayName("");
      return;
    }


    let cancelled = false;

    const fetchApprovalFlow = async () => {
      setApprovalFlowLoading(true);
      try {
        const detail = await getLeaveApplicationDetail(selectedLeave.name);







        if (cancelled) return;

        setLeaveApplicationDetail(detail);

        if (detail?.leave_approver) {
          const name = await getUserDisplayName(detail.leave_approver);
          if (!cancelled) setApproverDisplayName(name);
        } else {
          setApproverDisplayName("");
        }
      } catch {
        if (!cancelled) {
          setLeaveApplicationDetail(null);
          setApproverDisplayName("");
        }
      } finally {
        if (!cancelled) setApprovalFlowLoading(false);
      }
    };

    fetchApprovalFlow();
    return () => { cancelled = true; };
  }, [showDetail, selectedLeave?.name]);

  useEffect(() => {
    if (!showDetail || !selectedLeave) {
      setLeaveHolidays([]);
      return;
    }

    let cancelled = false;

    const fetchHolidays = async () => {
      try {
        const { employeeId } = getUserCredentials();
        const profile = await getEmployeeProfile(employeeId);
        if (cancelled || !profile?.holidayList) return;

        const details = await getHolidayListDetails(profile.holidayList);
        if (cancelled) return;



        setLeaveHolidays(details.holidays || []);
      } catch {
        if (!cancelled) setLeaveHolidays([]);
      }
    };

    fetchHolidays();
    return () => { cancelled = true; };
  }, [showDetail, selectedLeave]);

  useEffect(() => {
    if (!showDetail || !selectedLeave?.name) {
      setLeaveCalendarData(null);
      setLeaveCalendarError(null);
      return;
    }

    let cancelled = false;

    const fetchCalendar = async () => {
      setLeaveCalendarLoading(true);
      setLeaveCalendarError(null);
      try {



        const data = await getLeaveCalendarDetails(selectedLeave.name);












        if (cancelled) return;
        setLeaveCalendarData(data);
        if (!data) {
          setLeaveCalendarError("Failed to load calendar details");
        }
      } catch (err: any) {

        if (!cancelled) {
          setLeaveCalendarError(err.message || "Failed to load calendar details");
          setLeaveCalendarData(null);
        }
      } finally {
        if (!cancelled) setLeaveCalendarLoading(false);
      }
    };

    fetchCalendar();
    return () => { cancelled = true; };
  }, [showDetail, selectedLeave?.name]);

  useEffect(() => {


    if (selectedLeave) {

    }

  }, [selectedLeave]);

  useEffect(() => {
    if (!showDetail) return;



    if (selectedLeave) {

    }

  }, [showDetail]);

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

  const isSickLeaveFullPay = formLeaveType
    ?.trim()
    .toLowerCase()
    .includes("sick leave") && !formLeaveType?.toLowerCase().includes("partial") && !formLeaveType?.toLowerCase().includes("unpaid");

  const isSickLeavePartialPay = formLeaveType
    ?.trim()
    .toLowerCase()
    .includes("sick leave") && formLeaveType?.toLowerCase().includes("partial");

  const isSickLeaveUnpaid = formLeaveType
    ?.trim()
    .toLowerCase()
    .includes("sick leave") && formLeaveType?.toLowerCase().includes("unpaid");

  const shouldShowAttachments =
    isSickLeaveFullPay ||
    isSickLeave ||
    isMaternityLeave ||
    isExaminationLeave ||
    isMarriageLeave;

  const handleLeaveTypeSelect = (leaveType: string) => {
    setFormLeaveType(leaveType);
    setFormLeaveTypeDropdownOpen(false);
  };

  useEffect(() => {
    const sickCheck = formLeaveType
      ?.trim()
      .toLowerCase()
      .includes("sick leave");
  }, [formLeaveType]);

  const fetchSickLeaveSlab = async (leaveType: string, from: string, to: string) => {
    if (!isSickLeave || !leaveType || !from || !to) {
      setSickLeaveSlab(null);
      return;
    }
    setSickSlabLoading(true);
    try {
      const data = await getLeaveCalendarPreview({ leave_type: leaveType, from_date: from, to_date: to });
      if (data?.sick_leave_slab) {
        setSickLeaveSlab(data.sick_leave_slab);
      } else {
        setSickLeaveSlab(null);
      }
    } catch (err) {
      setSickLeaveSlab(null);
    } finally {
      setSickSlabLoading(false);
    }
  };

  useEffect(() => {
    if (isSickLeave && formLeaveType && fromDate && toDate) {
      fetchSickLeaveSlab(formLeaveType, fromDate, toDate);
    }
  }, [isSickLeave, formLeaveType, fromDate, toDate]);

  const handleApplyClick = async () => {
    setDropdownOpen(false);

    try {
      const approver = await getLeaveApprover();
      if (!approver) {
        setShowNoApproverModal(true);
        return;
      }
      setLeaveApprover(approver);

      setLeavePreviewLoading(true);
      setLeavePreviewError(null);
      setLeavePreviewData(null);

      try {
        const listRes = await getLeaveApplicationList();
        const allLeaves = [
          ...(listRes.data?.upcoming || []),
          ...(listRes.data?.taken || []),
        ];
        if (allLeaves.length > 0) {
          const latestLeave = allLeaves[0];
          const calendarData = await getLeaveCalendarDetails(latestLeave.name);
          setLeavePreviewData(calendarData);
          if (!calendarData) {
            setLeavePreviewError("Failed to load calendar details");
          }
        }
      } catch (err: any) {
        setLeavePreviewError(err.message || "Failed to load calendar preview");
      } finally {
        setLeavePreviewLoading(false);
      }

      setActiveView("apply");
    } catch (err) {
      setShowNoApproverModal(true);
    }
  };

  // --- Submit leave application ---
  const handleSubmit = async () => {



  

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

    const isSickLeaveVariant = isSickLeaveFullPay || isSickLeavePartialPay || isSickLeaveUnpaid || isMaternityLeave;
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

    if (sickLeaveSlab && (isSickLeaveFullPay || isSickLeavePartialPay || isSickLeaveUnpaid)) {
      const fullRemaining = (sickLeaveSlab.full_pay_allowed ?? 0) - (sickLeaveSlab.full_pay_used ?? 0);
      const partialRemaining = (sickLeaveSlab.partial_pay_allowed ?? 0) - (sickLeaveSlab.partial_pay_used ?? 0);
      const unpaidRemaining = (sickLeaveSlab.unpaid_allowed ?? 0) - (sickLeaveSlab.unpaid_used ?? 0);
      
      if (isSickLeavePartialPay && fullRemaining > 0) {
        setFormError(t("sickLeaveSequenceError") || "Please apply for Full Pay Sick Leave first before applying for Partial Pay");
        return;
      }
      
      if (isSickLeaveUnpaid && (fullRemaining > 0 || partialRemaining > 0)) {
        setFormError(t("sickLeaveSequenceUnpaidError") || "Please exhaust Full Pay and Partial Pay Sick Leave before applying for Unpaid");
        return;
      }
      
      if (isSickLeaveFullPay && fullRemaining <= 0) {
        setFormError(t("sickLeaveFullPayExhausted") || "Full Pay Sick Leave balance is exhausted. Please apply for Partial Pay instead.");
        return;
      }
      
      if (isSickLeavePartialPay && partialRemaining <= 0) {
        setFormError(t("sickLeavePartialPayExhausted") || "Partial Pay Sick Leave balance is exhausted. Please apply for Unpaid instead.");
        return;
      }
      
      if (isSickLeaveUnpaid && unpaidRemaining <= 0) {
        setFormError(t("sickLeaveUnpaidExhausted") || "Unpaid Sick Leave balance is exhausted.");
        return;
      }
    }
    
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

      setFormError(err.message || t("leaveSubmitError") || "Failed to submit leave application");
    } finally {
      setSubmitting(false);
    }
  };

  const parseAPIDate = (dateStr: string): Date => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const first = parseInt(parts[0], 10);
      const second = parseInt(parts[1], 10);
      const third = parseInt(parts[2], 10);
      if (first > 31) {
        return new Date(first, second - 1, third);
      }
      return new Date(third, second - 1, first);
    }
    return new Date(dateStr + "T00:00:00");
  };

  const parsePickerDate = (dateStr: string): Date => {
    if (!dateStr) return new Date(NaN);
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(NaN);
  };

  const checkDateOverlap = (fromDate: string, toDate: string): LeaveApplication | null => {
    if (!fromDate || !toDate) return null;
    const newFrom = parsePickerDate(fromDate);
    const newTo = parsePickerDate(toDate);
    for (const app of leaveApplications) {
      const existingFrom = parseAPIDate(app.from_date);
      const existingTo = parseAPIDate(app.to_date);
      if (newFrom <= existingTo && newTo >= existingFrom) {
        return app;
      }
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    const date = parseAPIDate(dateStr);
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
    (a) => a.from_date && parseAPIDate(a.from_date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );
  const takenApplications = leaveApplications.filter(
    (a) => a.from_date && parseAPIDate(a.from_date) < new Date(new Date().setHours(0, 0, 0, 0))
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
              (item.closing_balance && item.closing_balance > 0) ||
              (item.leaves_expired && item.leaves_expired > 0),
          )
          .map((item) => ({
            ...item,
            allocated: item.opening_balance ?? 0,
            used: item.leaves_taken ?? 0,
            remaining: item.closing_balance ?? 0,
            leave_type: item.leave_type,
          }))
      : [];

  const allLeaveTypesForDropdown =
    leaveBalance.length > 0
      ? leaveBalance.map((item) => ({
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

  const selectedBalance = selectedLeaveType
    ? allLeaveTypesForDropdown.find((b) => b.leave_type === selectedLeaveType) || null
    : null;

  const selAllocated  = selectedBalance?.allocated  ?? 0;
  const selUsed       = selectedBalance?.used       ?? 0;
  const selExpired    = selectedBalance ? ((selectedBalance as LeaveTypeBalance).leaves_expired ?? 0) : 0;
  const selRemaining  = selectedBalance?.remaining  ?? 0;

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

  const cardStyle = getPageCardStyle(theme);
  const listItemCardClass = getListItemCardClass(theme);

  const statsLeaveTypeOptions = useMemo(
    () =>
      allLeaveTypesForDropdown.map((item) => ({
        value: item.leave_type,
        label: item.leave_type,
        searchText: `${item.leave_type} ${getTranslatedLeaveType(item.leave_type)}`,
      })),
    [allLeaveTypesForDropdown, translatedLeaveTypes, language]
  );

  const formLeaveTypeOptions = useMemo(
    () =>
      leaveTypes.map((lt) => ({
        value: lt.leave_type,
        label: getTranslatedLeaveType(lt.leave_type),
        sublabel: `${t("available") || "Available"}: ${lt.closing_balance}`,
        searchText: `${lt.leave_type} ${getTranslatedLeaveType(lt.leave_type)}`,
      })),
    [leaveTypes, translatedLeaveTypes, language, t]
  );

  const viewSelectOptions = useMemo(
    () => [
      { value: "list", label: t("myRequests") },
      { value: "balance", label: t("leaveBalance") },
    ],
    [t, language]
  );

  const relationshipOptions = useMemo(
    () => [
      { value: "Spouse", label: t("spouse") || "Spouse" },
      { value: "Parent", label: t("parent") || "Parent" },
      { value: "Grandparent", label: t("grandparent") || "Grandparent" },
      { value: "Child", label: t("child") || "Child" },
      { value: "Grandchild", label: t("grandchild") || "Grandchild" },
      { value: "Sibling", label: t("sibling") || "Sibling" },
    ],
    [t, language]
  );

  const formLeaveTypeDisplay = formLeaveType
    ? (() => {
        const lt = leaveTypes.find((l) => l.leave_type === formLeaveType);
        const balance = lt != null ? ` (${t("available") || "Available"}: ${lt.closing_balance})` : "";
        return `${getTranslatedLeaveType(formLeaveType)}${balance}`;
      })()
    : undefined;

  return (
    <div className={EMPLOYEE_PAGE_CONTAINER}>

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

        {/* Leave Type selector */}
        {!loading && allLeaveTypesForDropdown.length > 0 && (
          <SearchableSelect
            variant="card"
            placeholder={t("selectLeaveType") || "Select Leave Type"}
            searchPlaceholder={t("search") || "Search..."}
            value={selectedLeaveType}
            displayValue={selectedLeaveType || undefined}
            options={statsLeaveTypeOptions}
            isOpen={statsLeaveTypeDropdownOpen}
            onOpenChange={setStatsLeaveTypeDropdownOpen}
            onSelect={setSelectedLeaveType}
            triggerClassName={`w-full ${cardStyle} p-4 flex items-center justify-between`}
            emptyMessage={t("noLeaveRequests")}
          />
        )}

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
              className="bg-indigo-50 rounded-2xl p-4 text-center shadow-sm"
            >
              <p className="text-xl font-bold text-indigo-600">
                {selectedLeaveType ? selAllocated : totalAllocated}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("totalAllocated")}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-indigo-50 rounded-2xl p-4 text-center shadow-sm"
            >
              <p className="text-xl font-bold text-indigo-600">
                {selectedLeaveType ? selUsed : totalUsed}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("used")}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-indigo-50 rounded-2xl p-4 text-center shadow-sm"
            >
              <p className="text-xl font-bold text-indigo-600">
                {selectedLeaveType ? selExpired : Math.max(totalAllocated - totalUsed - totalRemaining, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("expired") || "Expired"}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-indigo-50 rounded-2xl p-4 text-center shadow-sm"
            >
              <p className="text-xl font-bold text-indigo-600">
                {selectedLeaveType ? selRemaining : totalRemaining}
              </p>
              <p className="text-xs text-gray-500 mt-1">{t("remaining")}</p>
            </motion.div>
          </div>
        ) : null}

        {/* Dropdown for view selection */}
        <SearchableSelect
          variant="card"
          placeholder={t("myRequests")}
          searchPlaceholder={t("search") || "Search..."}
          value={activeView === "apply" ? "list" : activeView}
          displayValue={viewOptions[0].label}
          options={viewSelectOptions}
          isOpen={dropdownOpen}
          onOpenChange={setDropdownOpen}
          onSelect={(v) => setActiveView(v as "list" | "balance")}
          triggerClassName={`w-full ${cardStyle} p-4 flex items-center justify-between`}
          leadingIcon={<span className="text-indigo-600">{viewOptions[0].icon}</span>}
        />
      </div>

      {/* ══════════════════════════════════════ */}
      {/* SECTION 1 & 2: Leave Requests Mini-List */}
      {/* ══════════════════════════════════════ */}

      {activeView === "list" && !loading && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t("upcomingLeave") || "Upcoming Leave"}
            </h3>
            {upcomingApplications.length === 0 ? (
              <div className={`${cardStyle} p-8 text-center text-gray-500`}>
                <p className="text-sm">{t("noLeaveRequests")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedUpcoming.map((app, idx) => (
                  <motion.div
                    key={app.name || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {




                      setSelectedLeave(app);
                      setShowDetail(true);
                    }}
                    className={listItemCardClass}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-gray-800 text-sm">{getTranslatedLeaveType(app.leave_type)}</h4>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(app.from_date)} – {formatDate(app.to_date)}
                    </p>
                  </motion.div>
                ))}

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
            )}
          </div>

          {takenApplications.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {t("takenLeave") || "Taken Leave"}
              </h3>
              <div className="space-y-3">
                {takenApplications.map((app, idx) => (
                  <div
                    key={app.name || idx}
                    onClick={() => {




                      setSelectedLeave(app);
                      setShowDetail(true);
                    }}
                    className={listItemCardClass}
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
            <div className={`${cardStyle} p-8 text-center text-gray-500`}>
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
                  className={`${cardStyle} p-4`}
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
        <div className={cardStyle}>
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

                <SearchableSelect
                  label={t("leaveType")}
                  required
                  placeholder={t("selectLeaveType")}
                  searchPlaceholder={t("search") || "Search..."}
                  value={formLeaveType}
                  displayValue={formLeaveTypeDisplay}
                  options={formLeaveTypeOptions}
                  isOpen={formLeaveTypeDropdownOpen}
                  onOpenChange={setFormLeaveTypeDropdownOpen}
                  onSelect={handleLeaveTypeSelect}
                  emptyMessage={t("noLeaveRequests")}
                />

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

                 <LeaveCalendarPreviewSection
                    data={leavePreviewData}
                    loading={leavePreviewLoading}
                    error={leavePreviewError}
                    t={t}
                  />

                 <div className="border-b border-gray-100 pb-4">
                   <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                     {t("leaveDates") || "Leave Dates"}
                   </h3>

<div className="grid grid-cols-2 gap-4 mt-3">
                      <DatePickerField
                        label={t("fromDate")}
                        required
                        value={fromDate}
                        onChange={(val) => {
                          setFromDate(val);
                          if (toDate && val > toDate) setToDate("");
                          if (val && toDate) {
                            const overlap = checkDateOverlap(val, toDate);
                            if (overlap) {
                              setConflictingLeave(overlap);
                              setShowLeaveConflictModal(true);
                            }
                          }
                        }}
                        placeholder={t("selectDate") || "Select date"}
                      />
                       <DatePickerField
                         label={t("toDate")}
                         required
                         value={toDate}
                         min={fromDate || undefined}
                         onChange={(val) => {
                           setToDate(val);
                           if (fromDate && val) {
                             const overlap = checkDateOverlap(fromDate, val);
                             if (overlap) {
                               setConflictingLeave(overlap);
                               setShowLeaveConflictModal(true);
                             }
                           }
                         }}
                         placeholder={t("selectDate") || "Select date"}
                       />
                   </div>

                  <div>
                      <DatePickerField
                        label={t("handOverDate") || "Hand Over Date"}
                        required
                        value={handOverDate}
                        onChange={setHandOverDate}
                        placeholder={t("selectDate") || "Select date"}
                      />
                   </div>

                  <div className="mt-3">
                     <DatePickerField
                       label={t("firstDayReportToWork") || "First Day Report to Work"}
                       required
                       value={firstDayReportToWork}
                       onChange={setFirstDayReportToWork}
                       placeholder={t("selectDate") || "Select date"}
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
                      <DatePickerField
                        label={t("halfDayDate") || "Half-Day Date"}
                        required
                        value={halfDayDate}
                        onChange={setHalfDayDate}
                        min={fromDate || undefined}
                        max={toDate || undefined}
                        placeholder={t("selectDate") || "Select date"}
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
                      <DatePickerField
                        label={t("expectedDeliveryDate") || "Expected Delivery Date"}
                        required
                        value={customExpectedDeliveryDate}
                        onChange={setCustomExpectedDeliveryDate}
                        placeholder={t("selectDate") || "Select date"}
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
                      <DatePickerField
                        label={t("childBirthDate") || "Child Birth Date"}
                        required
                        value={customChildBirthDate}
                        onChange={setCustomChildBirthDate}
                        placeholder={t("selectDate") || "Select date"}
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
         {showLeaveConflictModal && conflictingLeave && (
           <>
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.2 }}
               className="fixed inset-0 z-[210] flex items-center justify-center px-4 bg-black/40"
               onClick={() => setShowLeaveConflictModal(false)}
             >
               <motion.div
                 layout
                 onClick={(e) => e.stopPropagation()}
                 className="w-full max-w-sm rounded-2xl shadow-2xl p-6 bg-white"
             >
                 <div className="text-center">
                   <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                     </svg>
                   </div>
                   <h3 className="text-lg font-semibold text-gray-800 mb-2">
                     {t("leaveAlreadyExists") || "Leave Already Exists"}
                   </h3>
                   <p className="text-sm text-gray-700 font-medium mb-1">
                     {conflictingLeave.leave_type}
                   </p>
                   <p className="text-sm text-gray-500 mb-6">
                     {formatDate(conflictingLeave.from_date)} → {formatDate(conflictingLeave.to_date)}
                   </p>
                   <p className="text-xs text-gray-600 leading-relaxed mb-6">
                     {t("leaveAlreadyAppliedMessage") || "You already have a leave application for these dates."}
                   </p>
                   <button
                     type="button"
                     onClick={() => setShowLeaveConflictModal(false)}
                     className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                   >
                     OK
                   </button>
                 </div>
               </motion.div>
             </motion.div>
           </>
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
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
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

                <div className="px-5 py-4 border-b border-gray-100 max-h-[60vh] overflow-y-auto">
                  <LeaveCalendarView
                    data={leaveCalendarData}
                    loading={leaveCalendarLoading}
                    error={leaveCalendarError}
                    showSummary={true}
                    showBridgePolicy={true}
                    showSickSlab={true}
                  />
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

                {/* Approval Flow */}
                <div className="px-5 py-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">{t("approvalTimeline") || "Approval Timeline"}</h4>
                  <LeaveApprovalFlow
                    loading={approvalFlowLoading}
                    createdBy={leaveApplicationDetail?.employee_name || "-"}
                    approverName={approverDisplayName}
                    documentStatus={selectedLeave.status}
                    createdAt={selectedLeave.posting_date ? formatDate(selectedLeave.posting_date) : undefined}
                    labels={{
                      createdBy: t("createdBy") || "Created By",
                      leaveApprover: t("leaveApprover") || "Leave Approver",
                      completed: t("completed") || "Completed",
                      pending: t("pendingStatus") || "Pending",
                      approved: t("approved") || "Approved",
                      rejected: t("rejected") || "Rejected",
                    }}
                  />
                  {!approvalFlowLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        import("jspdf").then(({ jsPDF }) => {
                          const doc = new jsPDF();
                          const lineHeight = 7;
                          let y = 20;

                          doc.setFontSize(14);
                          doc.text("Leave Application Timeline", 14, y);
                          y += lineHeight + 4;

                          doc.setFontSize(10);
                          doc.text(`Application: ${selectedLeave.name || "-"}`, 14, y);
                          y += lineHeight;
                          doc.text(`Leave Type: ${selectedLeave.leave_type || "-"}`, 14, y);
                          y += lineHeight;
                          doc.text(`From: ${selectedLeave.from_date || "-"}`, 14, y);
                          y += lineHeight;
                          doc.text(`To: ${selectedLeave.to_date || "-"}`, 14, y);
                          y += lineHeight;
                          doc.text(`Status: ${selectedLeave.status || "-"}`, 14, y);
                          y += lineHeight + 4;

                          doc.setFontSize(11);
                          doc.text(t("approvalTimeline") || "Approval Timeline", 14, y);
                          y += lineHeight + 2;

                          doc.setFontSize(9);
                          doc.text(`${t("createdBy") || "Created By"}: ${leaveApplicationDetail?.employee_name || "-"}`, 20, y);
                          y += lineHeight;
                          doc.text(`  ${t("completed") || "Completed"}`, 24, y);
                          y += lineHeight + 2;
                          doc.text(`${t("leaveApprover") || "Leave Approver"}: ${approverDisplayName || "-"}`, 20, y);
                          y += lineHeight;
                          doc.text(`  ${selectedLeave.status || "-"}`, 24, y);

                          const fileName = `Leave_Timeline_${selectedLeave.name || ""}.pdf`;
                          doc.save(fileName);
                        });
                      }}
                      className="mt-4 w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      {t("downloadTimeline") || "Download Timeline"}
                    </button>
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
