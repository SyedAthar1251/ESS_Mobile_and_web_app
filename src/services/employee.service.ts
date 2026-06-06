import api from "./api";

const getUserCredentials = (): { companyUrl: string; apiKey: string; apiSecret: string } => {
  const savedUser = localStorage.getItem("ess_user");
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    if (userData.companyUrl && userData.apiKey && userData.apiSecret) {
      return {
        companyUrl: userData.companyUrl,
        apiKey: userData.apiKey,
        apiSecret: userData.apiSecret,
      };
    }
  }
  throw new Error("Authentication credentials not found. Please login again.");
};

const getAuthHeader = (apiKey: string, apiSecret: string) => {
  return {
    Authorization: `token ${apiKey}:${apiSecret}`,
  };
};

const getMobileError = (error: any): { message: string; status: number } => {
  if (error?.response?.status) {
    return {
      message: error.response?.data?.exception || error.response?.data?.message || error.message || "Request failed",
      status: error.response.status,
    };
  }
  return {
    message: error?.message || "Network error",
    status: error?.status || 0,
  };
};

export interface EmployeeProfile {
  id: string;
  employeeName: string;
  firstName: string;
  lastName: string;
  nameInArabic: string;
  gender: string;
  dateOfBirth: string;
  dateOfJoining: string;
  status: string;
  nationality: string;
  religion: string;
  maritalStatus: string;
  bloodGroup: string;
  designation: string;
  designationInArabic: string;
  department: string;
  company: string;
  employmentType: string;
  reportsTo: string;
  userEmail: string;
  personalEmail: string;
  preferredEmail: string;
  image: string;
  leaveApprover: string;
  expenseApprover: string;
  shiftRequestApprover: string;
  holidayList: string;
  defaultShift: string;
  contractStartDate: string;
  contractEndDate: string;
  probationPeriod: string;
  probationEndDate: string;
  contractStatus: string;
  noticeNumberOfDays: number;
  dateOfRetirement: string;
  salaryCurrency: string;
  salaryMode: string;
  ctc: number;
  basicSalary: number;
  totalEarnings: number;
  totalDeductions: number;
  totalPay: number;
}

export const getEmployeeProfile = async (employeeId: string): Promise<EmployeeProfile | null> => {
  if (!employeeId) {
    console.warn("[EmployeeService] No employeeId provided");
    return null;
  }

  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify([
    "name", "employee_name", "first_name", "last_name", "name_in_arabic",
    "gender", "date_of_birth", "date_of_joining", "status", "nationality",
    "custom_religion_type", "marital_status", "blood_group",
    "designation", "designation_in_arabic", "department", "company",
    "employment_type", "reports_to", "user_id", "personal_email", "prefered_email",
    "image", "leave_approver", "expense_approver", "shift_request_approver",
    "holiday_list", "default_shift",
    "custom_contract_start_date", "contract_end_date", "custom_probation_period",
    "custom_probation_end_date", "custom_contract_status", "notice_number_of_days",
    "date_of_retirement",
    "salary_currency", "salary_mode", "ctc", "basic_salary",
    "custom_total_earnings", "custom_total_deductions", "custom_total_pay",
  ]));

  const apiUrl = `${cleanUrl}/api/resource/Employee/${encodeURIComponent(employeeId)}?fields=${fields}`;

  try {
    console.log("[EmployeeService] Fetching employee profile for:", employeeId);
    const response = await api.get<{ data: any }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    const emp = response.data?.data;
    if (!emp) {
      console.warn("[EmployeeService] Empty employee response");
      return null;
    }

    const profile: EmployeeProfile = {
      id: emp.name || employeeId,
      employeeName: emp.employee_name || "",
      firstName: emp.first_name || "",
      lastName: emp.last_name || "",
      nameInArabic: emp.name_in_arabic || "",
      gender: emp.gender || "",
      dateOfBirth: emp.date_of_birth || "",
      dateOfJoining: emp.date_of_joining || "",
      status: emp.status || "",
      nationality: emp.nationality || "",
      religion: emp.custom_religion_type || "",
      maritalStatus: emp.marital_status || "",
      bloodGroup: emp.blood_group || "",
      designation: emp.designation || "",
      designationInArabic: emp.designation_in_arabic || "",
      department: emp.department || "",
      company: emp.company || "",
      employmentType: emp.employment_type || "",
      reportsTo: emp.reports_to || "",
      userEmail: emp.user_id || "",
      personalEmail: emp.personal_email || "",
      preferredEmail: emp.prefered_email || "",
      image: emp.image || "",
      leaveApprover: emp.leave_approver || "",
      expenseApprover: emp.expense_approver || "",
      shiftRequestApprover: emp.shift_request_approver || "",
      holidayList: emp.holiday_list || "",
      defaultShift: emp.default_shift || "",
      contractStartDate: emp.custom_contract_start_date || "",
      contractEndDate: emp.contract_end_date || "",
      probationPeriod: emp.custom_probation_period || "",
      probationEndDate: emp.custom_probation_end_date || "",
      contractStatus: emp.custom_contract_status || "",
      noticeNumberOfDays: emp.notice_number_of_days || 0,
      dateOfRetirement: emp.date_of_retirement || "",
      salaryCurrency: emp.salary_currency || "",
      salaryMode: emp.salary_mode || "",
      ctc: emp.ctc || 0,
      basicSalary: emp.basic_salary || 0,
      totalEarnings: emp.custom_total_earnings || 0,
      totalDeductions: emp.custom_total_deductions || 0,
      totalPay: emp.custom_total_pay || 0,
    };

    console.log("[EmployeeService] Employee profile loaded:", profile.employeeName);
    return profile;
  } catch (error: any) {
    console.error("[EmployeeService] Failed to fetch employee profile:", error?.message || error);
    return null;
  }
};
