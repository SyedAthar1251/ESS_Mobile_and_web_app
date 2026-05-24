/**
 * SalarySlipPdfTemplate
 *
 * A hidden off-screen React component whose DOM is captured by html2canvas
 * and then stitched into a PDF page with jspdf.
 *
 * All styles are inline so that html2canvas faithfully reproduces the layout
 * without any build-time CSS dependency.
 */

import React from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PdfCompanyInfo {
  name: string;
  logo?: string;   // data-url or URL
  address: string;
  phone?: string;
  email?: string;
}

export interface PdfEarningItem {
  component: string;
  amount: number;
}

export interface PdfSalaryData {
  employeeName: string;
  employeeId: string;
  department?: string;
  designation?: string;
  salarySlipId: string;
  period: string;             // e.g. "May 2026"
  grossPay: number;
  netPay: number;
  earnings: PdfEarningItem[];
  deductions: PdfEarningItem[];
  postingDate?: string;       // ISO date
  paymentDays?: number | string;
  leaveWithoutPay?: number | string;
  status?: string;
}

interface SalarySlipPdfTemplateProps {
  company: PdfCompanyInfo;
  salary: PdfSalaryData;
  generatedOn: string;
  language?: "en" | "ar";
}

// Map language → Intl locale used by CURRENCY(n, locale)
const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  ar: "ar-SA",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const CURRENCY = (n: number, locale: string) => `₹${n.toLocaleString(locale)}`;

/** Minimal, white-background, A4-proportions stylesheet embedded in the render */
const PDF_WRAPPER: React.CSSProperties = {
  width: "595px",           // A4 width at 72dpi approx
  minHeight: "842px",
  backgroundColor: "#ffffff",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "12px",
  color: "#1a1a1a",
  padding: "28px 32px",
  boxSizing: "border-box",
  position: "relative",
};

const hr = (color = "#d0d0d0") => ({
  border: "none" as const,
  borderTop: `1px solid ${color}`,
  margin: 0,
});

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    background: "#1e3a5f",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "11px",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    padding: "5px 10px",
    margin: "14px 0 6px",
  }}>
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    padding: "3px 0",
    borderBottom: "1px dashed #e8e8e8",
  }}>
    <span style={{ color: "#555", fontSize: "11px" }}>{label}</span>
    <span style={{
      fontWeight: "bold",
      color: "#1a1a1a",
      fontSize: "11px",
      textAlign: "right" as const,
      maxWidth: "60%",
      wordBreak: "break-word" as const
    }}>
      {value}
    </span>
  </div>
);

const AmountRow: React.FC<{ label: string; amount: number; locale: string }> = ({ label, amount, locale }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    borderBottom: "1px solid #e8e8e8",
  }}>
    <span style={{ color: "#333", fontSize: "11px" }}>{label}</span>
    <span style={{ fontWeight: "bold", color: "#1a1a1a", fontSize: "11px" }}>{CURRENCY(amount, locale)}</span>
  </div>
);

// ── Component ────────────────────────────────────────────────────────────────

const SalarySlipPdfTemplate: React.FC<SalarySlipPdfTemplateProps> = ({
  company,
  salary,
  generatedOn,
  language="en"
}) => {

const isArabic = language==="ar";

const t = {
salarySlip:isArabic ? "قسيمة الراتب" : "SALARY SLIP",
employeeName:isArabic ? "اسم الموظف" : "Employee Name",
employeeId:isArabic ? "رقم الموظف" : "Employee ID",
salarySlipId:isArabic ? "رقم قسيمة الراتب" : "Salary Slip ID",
period:isArabic ? "الفترة" : "Period",
department:isArabic ? "القسم" : "Department",
designation:isArabic ? "المنصب" : "Designation",
postingDate:isArabic ? "تاريخ الإنشاء" : "Posting Date",
paymentDays:isArabic ? "أيام العمل" : "Payment Days",
leaveWithoutPay:isArabic ? "إجازة بدون راتب" : "Leave Without Pay",
status:isArabic ? "الحالة" : "Status",
earnings:isArabic ? "البدلات" : "Earnings",
deductions:isArabic ? "الاستقطاعات" : "Deductions",
grossPay:isArabic ? "إجمالي الراتب" : "Gross Pay",
totalDeductions:isArabic ? "إجمالي الاستقطاعات" : "Total Deductions",
netPay:isArabic ? "صافي الراتب" : "Net Pay",
takeHome:isArabic ? "صافي الراتب المستلم" : "Net Take Home Pay",
generated:isArabic ? "تم الإنشاء" : "Generated on",
footer:isArabic
? "هذه قسيمة راتب منشأة آلياً ولا تحتاج توقيعاً"
: "This is a system generated salary slip. Signature not required."
};

  const locale = LOCALE_MAP[language] || "en-US";

  const totalEarnings = salary.earnings.reduce((s, i) => s + i.amount, 0);
  const totalDeductions = salary.deductions.reduce((s, i) => s + i.amount, 0);

  return (
    <div
      style={{
        ...PDF_WRAPPER,
        fontFamily: "Arial, Helvetica, sans-serif",
        direction: isArabic ? "rtl" : "ltr",
        textAlign: isArabic ? "right" : "left",
      }}
    >
      {/* ── Column helper ── */}
      <div style={{ display: "flex", gap: "20px" }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ flex: "1 1 62%", minWidth: 0 }}>

          {/* Logo */}
          {company.logo && (
            <img
              src={company.logo}
              alt={company.name}
              style={{ height: "52px", width: "auto", objectFit: "contain" as const, marginBottom: "8px" }}
              crossOrigin="anonymous"
            />
          )}

          {/* Company name */}
          <div style={{
            fontSize: "15px",
            fontWeight: "bold",
            color: "#1e3a5f",
            marginBottom: "2px",
          }}>
            {company.name}
          </div>

          {/* Address */}
          <div style={{ fontSize: "10px", color: "#666", marginBottom: "10px", lineHeight: "1.5" }}>
            {company.address}
          </div>

          <hr style={{ ...hr("#cccccc"), marginBottom: "10px" }} />

          {/* Salary Slip heading */}
          <div style={{
            textAlign: "center" as const,
            fontSize: "18px",
            fontWeight: "bold",
            color: "#1e3a5f",
            letterSpacing: "0.12em",
            padding: "8px 0",
            marginBottom: "4px",
          }}>
            {t.salarySlip}
          </div>

          <hr style={{ ...hr("#cccccc"), marginBottom: "12px" }} />

          {/* Employee details grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px 16px",
          }}>
            <Row label={t.employeeName}    value={salary.employeeName} />
            <Row label={t.salarySlipId}   value={salary.salarySlipId} />
            <Row label={t.employeeId}      value={salary.employeeId} />
            <Row label={t.period}           value={salary.period} />
            {salary.department && (
              <Row label={t.department}     value={salary.department} />
            )}
            {salary.designation && (
              <Row label={t.designation}    value={salary.designation} />
            )}
            {salary.postingDate && (
              <Row label={t.postingDate}   value={salary.postingDate} />
            )}
            {salary.paymentDays !== undefined && (
              <Row label={t.paymentDays}   value={String(salary.paymentDays)} />
            )}
            {salary.leaveWithoutPay !== undefined && (
              <Row label={t.leaveWithoutPay} value={String(salary.leaveWithoutPay)} />
            )}
            {salary.status && (
              <Row label={t.status}         value={salary.status} />
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: pay summary ── */}
        <div style={{ flex: "0 0 32%", minWidth: "150px" }}>
          <div style={{
            background: "#f0f4fa",
            borderRadius: "6px",
            padding: "12px 14px",
            marginTop: "26px",
          }}>
            <div style={{
              textAlign: "center" as const,
              fontSize: "11px",
              color: "#555",
              fontWeight: "bold",
              letterSpacing: "0.05em",
              textTransform: "uppercase" as const,
              marginBottom: "8px",
            }}>
              Pay Summary
            </div>

            <div style={{ marginBottom: "6px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
                color: "#666",
              }}>
                <span>{t.grossPay}</span>
                <span style={{ fontWeight: "bold", color: "#1e40af" }}>{CURRENCY(salary.grossPay, locale)}</span>
              </div>
            </div>

            <hr style={{ ...hr("#c0cce8"), margin: "6px 0" }} />

            <div style={{ marginBottom: "6px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
                color: "#666",
              }}>
                <span>{t.totalDeductions}</span>
                <span style={{ fontWeight: "bold", color: "#b91c1c" }}>{CURRENCY(totalDeductions, locale)}</span>
              </div>
            </div>

            <hr style={{ ...hr("#c0cce8"), margin: "6px 0" }} />

            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center" as const,
              }}>
                <span style={{ fontSize: "11px", color: "#1e3a5f", fontWeight: "bold" }}>{t.netPay}</span>
                <span style={{ fontSize: "17px", fontWeight: "bold", color: "#1e3a5f" }}>
                  {CURRENCY(salary.netPay, locale)}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Separator ── */}
      <hr style={{ ...hr("#cccccc"), margin: "10px 0 6px" }} />

      {/* ── Earnings ── */}
      <SectionTitle>{t.earnings}</SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "0 12px",
        padding: "0 4px",
      }}>
        {salary.earnings.map((item, i) => (
          <React.Fragment key={`e${i}`}>
            <span style={{ fontSize: "11px", color: "#444" }}>{item.component}</span>
            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#1a1a1a", textAlign: "right" as const }}>
              {CURRENCY(item.amount, locale)}
            </span>
          </React.Fragment>
        ))}
        <div style={{
          borderTop: "1px solid #c0cce8",
          gridColumn: "1 / -1",
          margin: "3px 0",
        }} />
        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#555" }}>Total Earnings</span>
        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#1e3a5f", textAlign: "right" as const }}>
          {CURRENCY(totalEarnings, locale)}
        </span>
      </div>

      {/* ── Deductions ── */}
      <SectionTitle>{t.deductions}</SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "0 12px",
        padding: "0 4px",
      }}>
        {salary.deductions.map((item, i) => (
          <React.Fragment key={`d${i}`}>
            <span style={{ fontSize: "11px", color: "#444" }}>{item.component}</span>
            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#1a1a1a", textAlign: "right" as const }}>
              {CURRENCY(item.amount, locale)}
            </span>
          </React.Fragment>
        ))}
        <div style={{
          borderTop: "1px solid #f0b0b0",
          gridColumn: "1 / -1",
          margin: "3px 0",
        }} />
        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#555" }}>Total Deductions</span>
        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#b91c1c", textAlign: "right" as const }}>
          {CURRENCY(totalDeductions, locale)}
        </span>
      </div>

      <hr style={{ ...hr("#1e3a5f"), margin: "10px 0" }} />

      {/* ── Net Pay bar ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#eef2ff",
        borderRadius: "6px",
        padding: "8px 16px",
        marginBottom: "14px",
      }}>
        <span style={{ fontSize: "13px", fontWeight: "bold", color: "#1e3a5f" }}>{t.takeHome}</span>
        <span style={{ fontSize: "16px", fontWeight: "bold", color: "#1e3a5f" }}>{CURRENCY(salary.netPay, locale)}</span>
      </div>

      {/* ── Generated On ── */}
      <div style={{
        fontSize: "10px",
        color: "#888",
        marginBottom: "8px",
        textAlign: "right" as const,
      }}>
        {t.generated}: {generatedOn}
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: "1px solid #cccccc",
        paddingTop: "8px",
        fontSize: "10px",
        color: "#888",
        lineHeight: "1.6",
        textAlign: "center" as const,
      }}>
        <div>{t.footer}</div>
        <div style={{ marginTop: "4px", fontWeight: "bold", color: "#999" }}>
          Generated by AlphaX Workforce ESS
        </div>
      </div>

    </div>
  );
};

export default SalarySlipPdfTemplate;
