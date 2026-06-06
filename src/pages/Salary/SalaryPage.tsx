import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../store/ThemeContext";
import { useLanguage } from "../../i18n/LanguageContext";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import {
  getSalarySlips,
  getSalarySlipDetails,
  getCompanyDetails,
  getSalarySlipPrintFormat,
  getSalarySlipPrintHtml,
  downloadSalarySlipPrintPdf,
  SalarySlipSummary,
  SalarySlipDetails,
  CompanyDetails,
} from "../../services/salarySlip.service";
import SalarySlipPdfTemplate, {
  PdfCompanyInfo,
  PdfSalaryData,
} from "../../components/Salary/SalarySlipPdfTemplate";
import { translateDynamic, translateArrayField, translateObjectFields, shouldTranslate } from "../../services/translation.service";
import { LANGUAGES } from "../../i18n/languages";
import {
  EMPLOYEE_PAGE_CONTAINER,
  getDarkPageCardStyle,
} from "../../utils/pageCardStyles";

const SummaryCardSkeleton = ({ isDark }: { isDark: boolean }) => (
  <div className={`rounded-2xl p-4 text-center animate-pulse ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
    <div className={`h-6 w-12 mx-auto mb-2 ${isDark ? "bg-gray-700" : "bg-gray-200"} rounded`} />
    <div className={`h-3 w-16 mx-auto ${isDark ? "bg-gray-700" : "bg-gray-200"} rounded`} />
  </div>
);

const DetailSkeleton = ({ isDark }: { isDark: boolean }) => (
  <div className={`${getDarkPageCardStyle(isDark)} p-5 animate-pulse`}>
    <div className={`h-5 w-40 mb-4 ${isDark ? "bg-gray-700" : "bg-gray-200"} rounded`} />
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex justify-between">
          <div className={`h-3 w-28 ${isDark ? "bg-gray-700" : "bg-gray-200"} rounded`} />
          <div className={`h-3 w-20 ${isDark ? "bg-gray-700" : "bg-gray-200"} rounded`} />
        </div>
      ))}
    </div>
  </div>
);

const ButtonSkeleton = ({ isDark }: { isDark: boolean }) => (
  <div className={`rounded-2xl h-11 animate-pulse ${isDark ? "bg-gray-800" : "bg-gray-100"}`} />
);

interface EarningRowSkeletonProps {
  isDark: boolean;
  index?: number;
}

const EarningRowSkeleton = ({ isDark, index = 0 }: EarningRowSkeletonProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.05 }}
    className="flex justify-between animate-pulse py-2"
  >
    <div className={`h-3 w-28 ${isDark ? "bg-gray-700" : "bg-gray-200"} rounded`} />
    <div className={`h-3 w-20 ${isDark ? "bg-gray-700" : "bg-gray-200"} rounded`} />
  </motion.div>
);

const Icons = {
  download: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  share: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  doc: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  clock: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  person: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  refresh: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  emptyDoc: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  wallet: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
};

const SalaryPage = () => {

  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const isDark = theme !== "light";

  const [salaryList, setSalaryList] = useState<SalarySlipSummary[]>([]);
  const [selectedSalary, setSelectedSalary] = useState("");
  const [salaryDetails, setSalaryDetails] = useState<SalarySlipDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [printPreviewHtml, setPrintPreviewHtml] = useState<string | null>(null);
  const [printPreviewLoading, setPrintPreviewLoading] = useState(false);
  const [usingPrintFormat, setUsingPrintFormat] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });

  useEffect(() => {
    if (!toast.visible) return;
    const duration = toast.type === "error" ? 0 : 5000;
    const timeout = setTimeout(() => setToast((p) => ({ ...p, visible: false })), duration);
    return () => clearTimeout(timeout);
  }, [toast.visible, toast.type]);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ visible: true, message, type });

  // ═══════════════════════════════════════════════════════════
  //  TRANSLATION STATE  (dynamic API values only)
  // ═══════════════════════════════════════════════════════════

  const [translatedEmployeeName, setTranslatedEmployeeName] = useState<string>("");
  const [translatedEarnings, setTranslatedEarnings] = useState<{ component: string; amount: number }[]>([]);
  const [translatedDeductions, setTranslatedDeductions] = useState<{ component: string; amount: number }[]>([]);
  const [translatedStatus, setTranslatedStatus] = useState<string>("");
  const [translatedDept, setTranslatedDept] = useState<string>("");
  const [translatedDesig, setTranslatedDesig] = useState<string>("");

  const prevLangRef = useRef<string>(language);
  const prevDetailsIdRef = useRef<string>("");

  // ── Translate dynamic values when salaryDetails or language changes ──
  useEffect(() => {
    if (!salaryDetails) {
      setTranslatedEmployeeName("");
      setTranslatedEarnings([]);
      setTranslatedDeductions([]);
      setTranslatedStatus("");
      setTranslatedDept("");
      setTranslatedDesig("");
      return;
    }

    const detailsId = salaryDetails.name;
    const langChanged = prevLangRef.current !== language;
    const detailsChanged = prevDetailsIdRef.current !== detailsId;

    if (!langChanged && !detailsChanged) return;

    prevLangRef.current = language;
    prevDetailsIdRef.current = detailsId;

    // English → use originals directly
    if (language === LANGUAGES.EN) {
      setTranslatedEmployeeName(salaryDetails.employee_name || "");
      setTranslatedEarnings(
        (salaryDetails.earnings ?? []).map((e) => ({ component: e.salary_component, amount: e.amount })),
      );
      setTranslatedDeductions(
        (salaryDetails.deductions ?? []).map((d) => ({ component: d.salary_component, amount: d.amount })),
      );
      setTranslatedStatus((salaryDetails as any)?.status || "");
      setTranslatedDept((salaryDetails as any)?.department || "");
      setTranslatedDesig((salaryDetails as any)?.designation || "");
      return;
    }

    // Arabic → translate
    let cancelled = false;

    const doTranslate = async () => {
      try {
        const status = (salaryDetails as any)?.status || "";
        const dept = (salaryDetails as any)?.department || "";
        const desig = (salaryDetails as any)?.designation || "";

        const [nameResult, earningsResult, deductionsResult] = await Promise.all([
          shouldTranslate(salaryDetails.employee_name || "")
            ? translateDynamic(salaryDetails.employee_name || "", language)
            : Promise.resolve(salaryDetails.employee_name || ""),
          translateArrayField(
            (salaryDetails.earnings ?? []).map((e) => ({ salary_component: e.salary_component, amount: e.amount })),
            "salary_component" as any,
            language,
          ),
          translateArrayField(
            (salaryDetails.deductions ?? []).map((d) => ({ salary_component: d.salary_component, amount: d.amount })),
            "salary_component" as any,
            language,
          ),
        ]);

        if (cancelled) return;

        setTranslatedEmployeeName(nameResult);
        setTranslatedEarnings(
          earningsResult.map((e: any) => ({ component: e.salary_component, amount: e.amount })),
        );
        setTranslatedDeductions(
          deductionsResult.map((d: any) => ({ component: d.salary_component, amount: d.amount })),
        );

        // Translate optional single fields
        const [statusResult, deptResult, desigResult] = await Promise.all([
          status && shouldTranslate(status) ? translateDynamic(status, language) : Promise.resolve(status),
          dept && shouldTranslate(dept) ? translateDynamic(dept, language) : Promise.resolve(dept),
          desig && shouldTranslate(desig) ? translateDynamic(desig, language) : Promise.resolve(desig),
        ]);

        if (cancelled) return;
        setTranslatedStatus(statusResult);
        setTranslatedDept(deptResult);
        setTranslatedDesig(desigResult);
      } catch (err) {
        console.error("[SalaryPage Translation Error]", err);
        if (!cancelled) {
          setTranslatedEmployeeName(salaryDetails.employee_name || "");
          setTranslatedEarnings(
            (salaryDetails.earnings ?? []).map((e) => ({ component: e.salary_component, amount: e.amount })),
          );
          setTranslatedDeductions(
            (salaryDetails.deductions ?? []).map((d) => ({ component: d.salary_component, amount: d.amount })),
          );
          setTranslatedStatus((salaryDetails as any)?.status || "");
          setTranslatedDept((salaryDetails as any)?.department || "");
          setTranslatedDesig((salaryDetails as any)?.designation || "");
        }
      }
    };

    doTranslate();
    return () => { cancelled = true; };
  }, [salaryDetails, language]);

  // ── PDF blob generation ───────────────────
  const pdfSaveAsBlob = useCallback(
    async (
      company: CompanyDetails,
      salary: SalarySlipDetails,
      lang: "en" | "ar" = "en",
      translated?: {
        employeeName: string;
        earnings: { component: string; amount: number }[];
        deductions: { component: string; amount: number }[];
        status: string;
        department: string;
        designation: string;
      },
    ): Promise<Blob> => {
      const period =
        `${new Date(salary.start_date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", year: "numeric" })} – ${new Date(salary.end_date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", year: "numeric" })}`.trim();
      const generatedOn = new Date().toLocaleString(
        lang === "ar" ? "ar-SA" : "en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const companyName =
        (company as any)?.company_name || (company as any)?.name || "Unknown";
      const companyLogo: string | undefined =
        (company as any)?.company_logo_url ||
        (company as any)?.logo_web_url ||
        (company as any)?.logo_url ||
        (company as any)?.company_logo ||
        (company as any)?.logo_as_url ||
        (company as any)?.logo_as_square_url ||
        undefined;

      const companyAddress = (company as any)?.name || "";
      const companyPhone = (company as any)?.phone_no || "";
      const companyEmail = (company as any)?.email || "";

      const companyData: PdfCompanyInfo = {
        name: companyName,
        logo: companyLogo,
        address: companyAddress,
        phone: companyPhone,
        email: companyEmail,
      };

      const totalEarnings = (salary.earnings ?? []).reduce(
        (s, i) => s + (i.amount ?? 0),
        0,
      );
      const totalDeductions = (salary.deductions ?? []).reduce(
        (s, i) => s + (i.amount ?? 0),
        0,
      );

      const pdfSalary: PdfSalaryData = {
        employeeName: translated?.employeeName ?? salary.employee_name ?? "",
        employeeId: salary.employee ?? "",
        department: translated?.department || (salary as any)?.department || (salary as any)?.department,
        designation: translated?.designation || (salary as any)?.designation || (salary as any)?.designation,
        salarySlipId: salary.name,
        period,
        grossPay: salary.gross_pay ?? 0,
        netPay: salary.net_pay ?? 0,
        earnings: translated?.earnings?.length
          ? translated.earnings.map((e) => ({ component: e.component, amount: e.amount }))
          : (salary.earnings ?? []).map((e) => ({ component: e.salary_component, amount: e.amount })),
        deductions: translated?.deductions?.length
          ? translated.deductions.map((d) => ({ component: d.component, amount: d.amount }))
          : (salary.deductions ?? []).map((d) => ({ component: d.salary_component, amount: d.amount })),
        postingDate: (salary as any)?.posting_date
          ? new Date((salary as any).posting_date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : undefined,
        paymentDays: (salary as any)?.payment_days,
        leaveWithoutPay: (salary as any)?.leave_without_pay,
        status: translated?.status || (salary as any)?.status,
      };

      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.top = "-9999px";
      wrapper.style.left = "-9999px";
      wrapper.style.zIndex = "-1";
      document.body.appendChild(wrapper);

      wrapper.innerHTML = `<div id="__pdf_render_root__"></div>`;
      const root = wrapper.querySelector("#__pdf_render_root__") as HTMLElement;

      let err: unknown;
      try {
        const { createRoot } = await import("react-dom/client");
        const r = createRoot(root);
        r.render(
          <SalarySlipPdfTemplate
            company={companyData}
            salary={pdfSalary}
            generatedOn={generatedOn}
            language={lang}
          />,
        );
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const canvas = await html2canvas(root, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: false,
          useCORS: true,
        });

        const imgData = canvas.toDataURL("image/png", 1.0);

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
        });

        const PAGE_W = 595.276;
        const PAGE_H = 841.890;
        const pxToPt = (px: number) => (px * 72) / 96;
        const imgW = pxToPt(canvas.width);
        const imgH = pxToPt(canvas.height);

        const ratio = Math.min(PAGE_W / imgW, PAGE_H / imgH);
        const drawW = imgW * ratio;
        const drawH = imgH * ratio;
        const x = (PAGE_W - drawW) / 2;
        const y = 0;

        pdf.addImage(imgData, "PNG", x, y, drawW, drawH);
        const blob: Blob = pdf.output("blob");
        return blob;
      } catch (e) {
        err = e;
        throw e;
      } finally {
        try { document.body.removeChild(wrapper); } catch { /* noop */ }
      }
    },
    [],
  );

  const labelCls = `text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`;
  const valueCls = `font-bold ${isDark ? "text-white" : "text-gray-800"}`;
  const titleCls = `text-xl font-bold ${isDark ? "text-white" : "text-gray-800"}`;
  const cardCls = `${getDarkPageCardStyle(isDark)} p-5 transition-all`;

  const monthOptions = useMemo(() => {
    const uniqueMonths = new Map<string, { label: string; value: string }>();

    salaryList.forEach((item) => {
      const date = new Date(item.start_date);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { month: "short", year: "numeric" });

      if (!uniqueMonths.has(value)) {
        uniqueMonths.set(value, { label, value });
      }
    });

    return Array.from(uniqueMonths.values());
  }, [salaryList, language]);

  const filteredSalaryList = useMemo(() => {
    return salaryList.filter((item) => {
      if (!selectedMonth) return true;
      const date = new Date(item.start_date);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return value === selectedMonth;
    });
  }, [salaryList, selectedMonth]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [list, details] = await Promise.all([
        getSalarySlips(),
        selectedSalary ? getSalarySlipDetails(selectedSalary) : Promise.resolve(null as any),
      ]);
      setSalaryList(list);
      if (list.length > 0) {
        const latest = list.slice().sort(
          (a, b) =>
            new Date(b.start_date).getTime() -
            new Date(a.start_date).getTime(),
        )[0];
        const date = new Date(latest.start_date);
        setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
        setSelectedSalary(latest.name);
      }
      if (details) setSalaryDetails(details);
    } catch (error) {
      console.error("[Salary Refresh Error]", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSalary]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedSalary || refreshing) return;
    let cancelled = false;
    const load = async () => {
      try {
        const details = await getSalarySlipDetails(selectedSalary);
        if (!cancelled) setSalaryDetails(details);
      } catch (err) {
        console.error("[Salary Details Error]", err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedSalary, refreshing]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  const getUserCredentials = () => {
    const saved = localStorage.getItem("ess_user");
    if (saved) {
      const d = JSON.parse(saved);
      if (d.companyUrl && d.apiKey && d.apiSecret) return d;
    }
    throw new Error("Authentication credentials not found.");
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handlePrintPreview = async () => {
    if (!selectedSalary || !salaryDetails) {
      console.warn("[SalaryPrint] Cannot open preview — no salary slip selected");
      return;
    }

    console.log("[SalaryPrint] === PREVIEW BUTTON CLICKED ===");
    console.log("[SalaryPrint] Selected Salary Slip:", selectedSalary);

    setPrintPreviewLoading(true);
    setPrintPreviewHtml(null);
    setShowPrintPreviewModal(true);

    try {
      const printFormat = await getSalarySlipPrintFormat(selectedSalary, language);

      if (!printFormat) {
        console.warn("[SalaryPrint] No Print Format returned from backend. Closing preview.");
        setPrintPreviewLoading(false);
        showToast("No Print Format configured for this company. Please contact admin.", "error");
        setShowPrintPreviewModal(false);
        return;
      }

      console.log("[SalaryPrint] Using Print Format for preview:", printFormat);

      const html = await getSalarySlipPrintHtml(selectedSalary, printFormat, language);

      if (!html) {
        console.error("[SalaryPrint] Failed to get HTML from printview. Closing preview modal.");
        setShowPrintPreviewModal(false);
        setPrintPreviewLoading(false);
        showToast("Failed to load official preview. Try Download instead.", "error");
        return;
      }

      setPrintPreviewHtml(html);
      setUsingPrintFormat(true);
      console.log("[SalaryPrint] Preview HTML loaded successfully into modal.");

    } catch (err) {
      console.error("[SalaryPrint] Unexpected error during preview:", err);
      setShowPrintPreviewModal(false);
      showToast("Preview failed. Using fallback PDF generation.", "error");
    } finally {
      setPrintPreviewLoading(false);
    }
  };

  const saveAndShareBlob = async (blob: Blob, fileName: string, title: string, text: string) => {
    const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
    if (isNativeAndroid) {
      const base64 = await blobToBase64(blob);
      const result = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      await Share.share({ title, text, files: [result.uri] });
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 1000);
    }
  };

  

  const handleDownloadUsingPrintFormat = async () => {
    if (!selectedSalary || !salaryDetails) {
      showToast("No salary slip selected", "error");
      return;
    }
    console.log("[SalaryPrint] === DOWNLOAD CLICKED ===");
    setDownloading(true);
    try {
      const printFormat = await getSalarySlipPrintFormat(selectedSalary, language);
      console.log("[SalaryPrint] printFormat:", printFormat);
      if (!printFormat) {
        console.log("[SalaryPrint] No format, using fallback");
        await handleDownload();
        return;
      }
      console.log("[SalaryPrint] Downloading PDF from server...");
      const blob = await downloadSalarySlipPrintPdf(selectedSalary, printFormat, language);
      console.log("[SalaryPrint] blob:", blob ? "size=" + blob.size : "NULL");
      if (!blob || blob.size < 100) {
        console.log("[SalaryPrint] Bad blob, using fallback");
        await handleDownload();
        return;
      }
      const periodLabel = new Date(salaryDetails.start_date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { month: "long", year: "numeric" });
      const fileName = "SalarySlip-" + periodLabel.replace(/ /g, "_") + ".pdf";
      await saveAndShareBlob(blob, fileName, "Salary Slip", "Salary Slip PDF");
      showToast(t("salaryDownloaded"), "success");
      setUsingPrintFormat(true);
    } catch (e) {
      console.error("[SalaryPrint] Download error:", e);
      await handleDownload();
    } finally {
      setDownloading(false);
    }
  };

  const handleDownload = async () => {
    if (!salaryDetails) return;
    console.log("[SalaryPrint] === CLIENT-SIDE DOWNLOAD ===");
    try {
      setDownloading(true);
      console.log("[SalaryPrint] Fetching company...");
      const company = await getCompanyDetails();
      console.log("[SalaryPrint] Company:", company?.company_name);

      const translatedForPdf = {
        employeeName: translatedEmployeeName || salaryDetails.employee_name || "",
        earnings: translatedEarnings.length ? translatedEarnings : (salaryDetails.earnings ?? []).map((e) => ({ component: e.salary_component, amount: e.amount })),
        deductions: translatedDeductions.length ? translatedDeductions : (salaryDetails.deductions ?? []).map((d) => ({ component: d.salary_component, amount: d.amount })),
        status: translatedStatus || (salaryDetails as any)?.status || "",
        department: translatedDept || (salaryDetails as any)?.department || "",
        designation: translatedDesig || (salaryDetails as any)?.designation || "",
      };

      console.log("[SalaryPrint] Generating PDF...");
      const blob = await pdfSaveAsBlob(company, salaryDetails, language as "en" | "ar", language === LANGUAGES.AR ? translatedForPdf : undefined);
      if (!blob) { showToast(t("unableToGenerateSalarySlip"), "error"); return; }
      console.log("[SalaryPrint] PDF size:", blob.size);

      const slipMonth = new Date(salaryDetails.start_date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { month: "long", year: "numeric" });
      const fileName = "SalarySlip-" + slipMonth.replace(/ /g, "_") + ".pdf";
      await saveAndShareBlob(blob, fileName, "Salary Slip", "Salary Slip PDF");
      showToast(t("salaryDownloaded"), "success");
    } catch (e) {
      console.error("[Download Error]", e);
      showToast(t("unableToGenerateSalarySlip"), "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!salaryDetails) return;
    console.log("[SalaryShare] === SHARE CLICKED ===");
    try {
      setSharing(true);
      let blob: Blob | null = null;
      if (selectedSalary) {
        const printFormat = await getSalarySlipPrintFormat(selectedSalary, language);
        if (printFormat) {
          blob = await downloadSalarySlipPrintPdf(selectedSalary, printFormat, language);
          console.log("[SalaryShare] Print format blob:", blob ? "size=" + blob.size : "null");
        }
      }
      if (!blob || blob.size < 100) {
        console.log("[SalaryShare] Client-side PDF...");
        const company = await getCompanyDetails();
        const translatedForPdf = {
          employeeName: translatedEmployeeName || salaryDetails.employee_name || "",
          earnings: translatedEarnings.length ? translatedEarnings : (salaryDetails.earnings ?? []).map((e) => ({ component: e.salary_component, amount: e.amount })),
          deductions: translatedDeductions.length ? translatedDeductions : (salaryDetails.deductions ?? []).map((d) => ({ component: d.salary_component, amount: d.amount })),
          status: translatedStatus || (salaryDetails as any)?.status || "",
          department: translatedDept || (salaryDetails as any)?.department || "",
          designation: translatedDesig || (salaryDetails as any)?.designation || "",
        };
        blob = await pdfSaveAsBlob(company, salaryDetails, language as "en" | "ar", language === LANGUAGES.AR ? translatedForPdf : undefined);
      }
      if (!blob || blob.size < 100) {
        showToast(t("unableToShareSalarySlip"), "error");
        return;
      }
      const slipMonth = new Date(salaryDetails.start_date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { month: "long", year: "numeric" });
      const fileName = "SalarySlip-" + slipMonth.replace(/ /g, "_") + ".pdf";
      const displayName = translatedEmployeeName || salaryDetails.employee_name || "";
      await saveAndShareBlob(blob, fileName, t("salarySlip"), t("salarySlip") + " - " + displayName);
      showToast(t("salaryShared"), "success");
    } catch (e) {
      console.error("[Share Error]", e);
      showToast(t("unableToShareSalarySlip"), "error");
    } finally {
      setSharing(false);
    }
  };

const getStatusStyle = (status: string) => {
    const m: Record<string, { bg: string; text: string }> = {
      Submitted:  { bg: isDark ? "bg-green-900/40" : "bg-green-100", text: isDark ? "text-green-400"   : "text-green-700"   },
      Draft:      { bg: isDark ? "bg-yellow-900/40": "bg-yellow-100", text: isDark ? "text-yellow-400"  : "text-yellow-700"  },
      Cancelled:  { bg: isDark ? "bg-red-900/40"  : "bg-red-100",   text: isDark ? "text-red-400"     : "text-red-700"     },
    };
    return m[status] || m.Submitted;
  };

  const riyalImg = (cls: string) =>
    <img src={isDark ? "/images/riyalwhite.png" : "/images/riyaldark.png"} alt="Riyal" className={`h-${cls} w-${cls} inline-block align-middle mr-0.5`} />;

  const riyalCard = (size = "5") =>
    <img src={isDark ? "/images/riyalwhite.png" : "/images/riyaldark.png"} alt="Riyal" className={`h-${size} w-${size} inline-block align-middle mr-0.5`} />;

  const extraDetails: { label: string; value: React.ReactNode }[] = [
    {
      label: t("employeeId"),
      value: (salaryDetails as any)?.employee || "—",
    },
    {
      label: t("postingDate"),
      value: (salaryDetails as any)?.posting_date
        ? new Date((salaryDetails as any).posting_date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
    },
    {
      label: t("paymentDays"),
      value: (salaryDetails as any)?.payment_days ?? "—",
    },
    {
      label: t("leaveWithoutPay"),
      value: (salaryDetails as any)?.leave_without_pay ?? "—",
    },
  ];

  // Use translated name in display
  const displayName = translatedEmployeeName || salaryDetails?.employee_name || "—";
  const displayEarnings = translatedEarnings.length ? translatedEarnings : (salaryDetails?.earnings ?? []).map((e) => ({ component: e.salary_component, amount: e.amount }));
  const displayDeductions = translatedDeductions.length ? translatedDeductions : (salaryDetails?.deductions ?? []).map((d) => ({ component: d.salary_component, amount: d.amount }));
  const displayStatus = translatedStatus || (salaryDetails as any)?.status || "";

  return (
    <div className={`${EMPLOYEE_PAGE_CONTAINER} min-h-screen overflow-x-hidden transition-all ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>

      <div className="flex items-center justify-between">
        <h1 className={titleCls}>{t("salarySlip")}</h1>
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"} disabled:opacity-40`}
          aria-label={t("refresh")}
        >
          <span className={`inline-block h-5 w-5 ${refreshing ? "animate-spin" : ""}`}>
            {Icons.refresh}
          </span>
        </button>
      </div>

      {salaryDetails && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, type: "spring", stiffness: 300, damping: 24 }}
          className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-2xl p-6 text-center shadow-xl"
        >
          <p className="text-sm opacity-80 mb-3">{t("takeHomePay")}</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl font-bold">{riyalImg("6")}{(salaryDetails.net_pay || 0).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-sm opacity-90 mb-1">
            <span className="h-4 w-4 flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
              {Icons.person}
            </span>
            <span>{displayName}</span>
          </div>
          <p className="text-xs opacity-75 flex items-center justify-center gap-1">
            <span className="h-4 w-4 flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
              {Icons.calendar}
            </span>
            <span>
              {new Date(salaryDetails.start_date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { month: "short", year: "numeric" })}
              {" – "}
              {new Date(salaryDetails.end_date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { month: "short", year: "numeric" })}
            </span>
          </p>
        </motion.div>
      )}

      {salaryDetails && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          <button
            type="button"
            onClick={handlePrintPreview}
            disabled={downloading || sharing || printPreviewLoading}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium shadow-md transition-all hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none ${
              isDark
                ? "bg-amber-700/80 text-white hover:bg-amber-600"
                : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            <span className={`h-4 w-4 ${printPreviewLoading ? "animate-spin" : ""}`}>
              {printPreviewLoading ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                </svg>
              ) : (
                Icons.doc
              )}
            </span>
            {printPreviewLoading ? "Loading..." : "Preview"}
          </button>

          <button
            type="button"
            onClick={handleDownloadUsingPrintFormat}
            disabled={downloading || sharing}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium shadow-md transition-all hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none ${
              isDark
                ? "bg-indigo-700/80 text-white hover:bg-indigo-600"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}
          >
            <span className={`h-4 w-4 ${downloading ? "animate-spin" : ""}`}>
              {downloading ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                </svg>
              ) : (
                Icons.download
              )}
            </span>
            {downloading ? t("generating") : t("downloadSalarySlip")}
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={downloading || sharing}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium shadow-md transition-all hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none ${
              isDark
                ? "bg-emerald-700/80 text-white hover:bg-emerald-600"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            <span className={`h-4 w-4 ${sharing ? "animate-spin" : ""}`}>
              {sharing ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                </svg>
              ) : (
                Icons.share
              )}
            </span>
            {sharing ? t("preparing") : t("share")}
          </button>
        </motion.div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-3">
          <ButtonSkeleton isDark={isDark} />
          <ButtonSkeleton isDark={isDark} />
        </div>
      )}

      <div className="relative" data-dropdown>
        <button
          type="button"
          onClick={() => setMonthDropdownOpen((v) => !v)}
          className={`w-full ${getDarkPageCardStyle(isDark)} p-4 flex justify-between items-center`}
        >
          <span className="font-medium truncate">{monthOptions.find(m => m.value === selectedMonth)?.label || t("selectMonth")}</span>
          <span className="text-gray-400 flex-shrink-0 ml-2">▼</span>
        </button>

        <div className="relative">
          <AnimatePresence>
            {monthDropdownOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 mt-2 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto bg-inherit"
              >
                {monthOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(item.value);
                      setMonthDropdownOpen(false);
                    }}
                    className={`w-full p-3 text-left hover:bg-indigo-50 ${
                      item.value === selectedMonth ? "bg-indigo-50 text-indigo-600 font-medium" : ""
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative" data-dropdown>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className={`w-full ${getDarkPageCardStyle(isDark)} p-4 flex justify-between items-center`}
        >
          <span className="font-medium truncate">{selectedSalary || t("selectSalarySlip")}</span>
          <span className="text-gray-400 flex-shrink-0 ml-2">▼</span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className={`absolute left-0 right-0 mt-2 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto ${isDark ? "bg-gray-800" : "bg-white"}`}
              >
                {filteredSalaryList.map((salary) =>
                  <button
                    key={salary.name}
                    type="button"
                    onClick={() => { setSelectedSalary(salary.name); setDropdownOpen(false); }}
                    className={`w-full p-3 text-left hover:bg-indigo-50 break-all ${selectedSalary === salary.name ? "bg-indigo-50 text-indigo-600 font-medium" : ""}`}
                  >
                    {salary.name}
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {!loading && filteredSalaryList.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-8 text-center space-y-3 ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <div className={`mx-auto h-14 w-14 ${isDark ? "text-gray-600" : "text-gray-300"}`}>{Icons.emptyDoc}</div>
          <p className={`font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>{t("noSalarySlipsFound")}</p>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {t("noSalarySlipsForMonth")}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className={`mt-2 mx-auto rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] ${
              isDark
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4">{Icons.refresh}</span>
              {t("refresh")}
            </span>
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          <SummaryCardSkeleton isDark={isDark} />
          <SummaryCardSkeleton isDark={isDark} />
        </div>
      ) : salaryDetails ? (
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
            className={`rounded-2xl p-4 text-center hover:scale-[1.02] transition-all shadow-sm ${isDark ? "bg-gray-800" : "bg-indigo-50"}`}
          >
            <p className={`text-xl font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
               {riyalCard("5")}
               {(salaryDetails.gross_pay || 0).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
            </p>
            <p className={labelCls}>{t("grossPay")}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className={`rounded-2xl p-4 text-center hover:scale-[1.02] transition-all shadow-sm ${isDark ? "bg-gray-800" : "bg-emerald-50"}`}
          >
            <p className={`text-xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
               {riyalCard("5")}
               {(salaryDetails.net_pay || 0).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
            </p>
            <p className={labelCls}>{t("netPay")}</p>
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-2xl p-4 text-center ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
            <p className={`text-xl font-bold ${isDark ? "text-gray-300" : "text-gray-400"}`}>0</p>
            <p className={labelCls}>{t("grossPay")}</p>
          </div>
          <div className={`rounded-2xl p-4 text-center ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
            <p className={`text-xl font-bold ${isDark ? "text-gray-300" : "text-gray-400"}`}>0</p>
            <p className={labelCls}>{t("netPay")}</p>
          </div>
        </div>
      )}

      {loading ? (
        <DetailSkeleton isDark={isDark} />
      ) : salaryDetails ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={cardCls}
        >
          <p className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {t("salaryDetails")}
          </p>
          <div className="space-y-3">
            <div className="flex justify-between gap-2">
              <span className={labelCls}>{t("employeeName")}</span>
              <span className={`${valueCls} text-right break-all`}>{displayName}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={labelCls}>{t("employeeId")}</span>
              <span className={`${valueCls} text-right font-mono text-xs break-all`}>
                {(salaryDetails as any)?.employee || "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={labelCls}>{t("salarySlipId")}</span>
              <span className={`text-xs font-mono ${isDark ? "text-gray-300" : "text-gray-700"} text-right break-all`}>{salaryDetails.name}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={labelCls}>{t("postingDate")}</span>
              <span className={valueCls}>
                {(salaryDetails as any)?.posting_date
                  ? new Date((salaryDetails as any).posting_date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { day: "2-digit", month: "short", year: "numeric" })
                  : "—"}
              </span>
            </div>
            {translatedDept && (
              <div className="flex justify-between gap-2">
                <span className={labelCls}>{t("department") || "Department"}</span>
                <span className={valueCls}>{translatedDept}</span>
              </div>
            )}
            {translatedDesig && (
              <div className="flex justify-between gap-2">
                <span className={labelCls}>{t("designation") || "Designation"}</span>
                <span className={valueCls}>{translatedDesig}</span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className={labelCls}>{t("startDate")}</span>
              <span className={valueCls}>{salaryDetails.start_date || "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={labelCls}>{t("endDate")}</span>
              <span className={valueCls}>{salaryDetails.end_date || "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={labelCls}>{t("paymentDays")}</span>
              <span className={valueCls}>{(salaryDetails as any)?.payment_days ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className={labelCls}>{t("leaveWithoutPay")}</span>
              <span className={valueCls}>{(salaryDetails as any)?.leave_without_pay ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-2 items-center">
              <span className={labelCls}>{t("status")}</span>
              {(() => {
                const style = getStatusStyle(displayStatus);
                return (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${style.bg} ${style.text}`}>
                    {displayStatus}
                  </span>
                );
              })()}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className={cardCls}>
          <p className={`text-sm text-center py-4 ${isDark ? "text-gray-400" : "text-gray-400"}`}>{t("noSalaryDetails")}</p>
        </div>
      )}

      {loading && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
          <p className={`text-sm font-semibold uppercase tracking-wide mb-3 ${labelCls}`}>{t("earnings")}</p>
          <hr className={`${isDark ? "border-gray-700" : "border-gray-200"}`} />
          <div className="space-y-0 pt-1">
            <EarningRowSkeleton isDark={isDark} index={0} />
            <EarningRowSkeleton isDark={isDark} index={1} />
            <EarningRowSkeleton isDark={isDark} index={2} />
          </div>
        </motion.div>
      )}

      {loading && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
          <p className={`text-sm font-semibold uppercase tracking-wide mb-3 ${labelCls}`}>{t("deductions")}</p>
          <hr className={`${isDark ? "border-gray-700" : "border-gray-200"}`} />
          <div className="space-y-0 pt-1">
            <EarningRowSkeleton isDark={isDark} index={0} />
            <EarningRowSkeleton isDark={isDark} index={1} />
            <EarningRowSkeleton isDark={isDark} index={2} />
          </div>
        </motion.div>
      )}

      {loading ? null : displayEarnings?.length ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={cardCls}
        >
          <p className={`text-sm font-semibold uppercase tracking-wide mb-3 ${labelCls}`}>{t("earnings")}</p>
          <hr className={isDark ? "border-gray-700" : "border-gray-200"} />
          <div className="space-y-0 pt-1">
            {displayEarnings.map((item, idx) => (
              <motion.div key={`earn-${idx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex justify-between py-2.5 hover:bg-indigo-50/50 -mx-5 px-5 rounded-lg transition-colors"
              >
                <span className={labelCls}>{item.component}</span>
                <span className={valueCls}>
                  {riyalImg("4")}
                  {item.amount.toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : null}

      {loading ? null : displayDeductions?.length ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={cardCls}
        >
          <p className={`text-sm font-semibold uppercase tracking-wide mb-3 ${labelCls}`}>{t("deductions")}</p>
          <hr className={isDark ? "border-gray-700" : "border-gray-200"} />
          <div className="space-y-0 pt-1">
            {displayDeductions.map((item, idx) => (
              <motion.div key={`ded-${idx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex justify-between py-2.5 hover:bg-indigo-50/50 -mx-5 px-5 rounded-lg transition-colors"
              >
                <span className={labelCls}>{item.component}</span>
                <span className={valueCls}>
                  {riyalImg("4")}
                  {item.amount.toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : null}

      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25 }}
            onClick={() => toast.type === "error" && setToast((p) => ({ ...p, visible: false }))}
            className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] rounded-xl px-5 py-3.5 text-sm font-medium shadow-2xl ${
              toast.type === "error"
                ? "bg-red-600 text-white cursor-pointer"
                : isDark
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-white"
            }`}
          >
            {toast.type === "error" && (
              <span className="inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                {toast.message}
              </span>
            )}
            {toast.type !== "error" && (
              <span className="inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><polyline points="20 6 9 17 4 12" /></svg>
                {toast.message}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrintPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4"
            onClick={() => {
              setShowPrintPreviewModal(false);
              setPrintPreviewHtml(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl ${
                isDark ? "bg-gray-900" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="font-semibold text-lg">Salary Slip Preview</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {usingPrintFormat ? "Using official Print Format" : "Fallback view"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPrintPreviewModal(false);
                    setPrintPreviewHtml(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 max-h-[70vh] overflow-auto bg-white">
                {printPreviewLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Loading official preview...</span>
                  </div>
                ) : printPreviewHtml ? (
                  <iframe
                    srcDoc={printPreviewHtml}
                    className="w-full min-h-[500px] border border-gray-200 rounded-lg"
                    style={{ background: "white" }}
                    title="Salary Slip Print Preview"
                  />
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    Failed to load preview from Print Format.
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <button
                  onClick={() => {
                    setShowPrintPreviewModal(false);
                    setPrintPreviewHtml(null);
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    setShowPrintPreviewModal(false);
                    await handleDownloadUsingPrintFormat();
                  }}
                  disabled={downloading}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {downloading ? "Generating PDF..." : "Download PDF"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SalaryPage;
