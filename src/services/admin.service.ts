import api from "./api";
import { getUserCredentials, getAuthHeader } from "./leave.service";

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

export interface EssAdminDetails {
  is_admin: boolean;
  admin_id?: string;
  role?: string;
  email?: string;
  full_name?: string;
}

export interface AdminDashboardStats {
  totalEmployees: number;
  totalCompanies: number;
  adminUsers: number;
  pendingLeaves: number;
  pendingAttendance: number;
  pendingTravel: number;
  pendingTasks: number;
}

export interface PendingLeaveApproval {
  name: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: string;
  creation: string;
}

export interface PendingTravelApproval {
  name: string;
  employee: string;
  employee_name: string;
  purpose: string;
  from_date: string;
  to_date: string;
  status: string;
  creation: string;
}

export interface PendingTaskMonitoring {
  name: string;
  subject: string;
  priority: string;
  status: string;
  due_date: string;
  assigned_by: string;
  creation: string;
}

export interface LeaveApprovalDetail {
  name: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: string;
  reason: string;
  description: string;
  creation: string;
}

export interface TravelApprovalDetail {
  name: string;
  employee: string;
  employee_name: string;
  purpose: string;
  travel_type: string;
  from_date: string;
  to_date: string;
  from_location: string;
  to_location: string;
  destination: string;
  description: string;
  status: string;
  creation: string;
}

export interface EssAdminUserCheckResponse {
  success: boolean;
  message: string;
  data: {
    user: string;
    full_name: string;
    email: string;
    role: string;
    is_active: number;
    allowed_companies: Array<{ company: string }>;
  } | null;
}

export const checkESSAdminUser = async (userId: string): Promise<EssAdminUserCheckResponse> => {
  const { companyUrl } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.employee_self_service.doctype.ess_admin_user.ess_admin_user.get_admin_user?user=${encodeURIComponent(userId)}`;

  try {
    const response = await api.get<{ message: EssAdminUserCheckResponse }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data?.message || { success: false, message: "Invalid response", data: null };
  } catch (error: any) {
    console.error("[AdminService] Failed to check ESS admin user:", error);
    return { success: false, message: error?.message || "Request failed", data: null };
  }
};

export const checkIfUserIsEssAdmin = async (): Promise<EssAdminDetails> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_ess_admin_details`;

  try {
    const response = await api.post(apiUrl, {}, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    const data = (response.data as any)?.message || { is_admin: false };
    return { is_admin: data.is_admin || false, admin_id: data.admin_id, role: data.role, email: data.email, full_name: data.full_name };
  } catch (error: any) {
    console.error("[AdminService] Failed to check admin status:", error);
    return { is_admin: false };
  }
};

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_admin_dashboard_stats`;

  try {
    const response = await api.post<{ message: AdminDashboardStats }>(apiUrl, {}, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || { totalEmployees: 0, totalCompanies: 0, adminUsers: 0, pendingLeaves: 0, pendingAttendance: 0, pendingTravel: 0, pendingTasks: 0 };
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch admin dashboard stats:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to fetch admin dashboard stats");
  }
};

export const getPendingLeaveApprovals = async (): Promise<PendingLeaveApproval[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_pending_leave_approvals`;

  try {
    const response = await api.post<{ message: PendingLeaveApproval[] }>(apiUrl, {}, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || [];
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch pending leave approvals:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to fetch pending leave approvals");
  }
};

export const getPendingTravelApprovals = async (): Promise<PendingTravelApproval[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_pending_travel_approvals`;

  try {
    const response = await api.post<{ message: PendingTravelApproval[] }>(apiUrl, {}, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || [];
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch pending travel approvals:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to fetch pending travel approvals");
  }
};

export const getPendingTaskMonitoring = async (): Promise<PendingTaskMonitoring[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_pending_task_monitoring`;

  try {
    const response = await api.post<{ message: PendingTaskMonitoring[] }>(apiUrl, {}, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || [];
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch pending task monitoring:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to fetch pending task monitoring");
  }
};

export const getLeaveApprovalDetail = async (name: string): Promise<LeaveApprovalDetail | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_leave_approval_details`;

  try {
    const response = await api.post<{ message: LeaveApprovalDetail }>(apiUrl, { leave_name: name }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || null;
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch leave approval detail:", error);
    return null;
  }
};

export const approveLeaveRequest = async (name: string, remarks?: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.approve_leave_request`;

  try {
    const response = await api.post<{ message: string }>(apiUrl, { leave_name: name, ...(remarks ? { remarks } : {}) }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return { message: response.data?.message || "Leave approved" };
  } catch (error: any) {
    console.error("[AdminService] Failed to approve leave request:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to approve leave request");
  }
};

export const rejectLeaveRequest = async (name: string, remarks?: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.reject_leave_request`;

  try {
    const response = await api.post<{ message: string }>(apiUrl, { leave_name: name, ...(remarks ? { remarks } : {}) }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return { message: response.data?.message || "Leave rejected" };
  } catch (error: any) {
    console.error("[AdminService] Failed to reject leave request:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to reject leave request");
  }
};

export const getTravelApprovalDetail = async (name: string): Promise<TravelApprovalDetail | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_travel_approval_details`;

  try {
    const response = await api.post<{ message: TravelApprovalDetail }>(apiUrl, { travel_name: name }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || null;
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch travel approval detail:", error);
    return null;
  }
};

export const approveTravelRequest = async (name: string, remarks?: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.approve_travel_request`;

  try {
    const response = await api.post<{ message: string }>(apiUrl, { travel_name: name, ...(remarks ? { remarks } : {}) }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return { message: response.data?.message || "Travel approved" };
  } catch (error: any) {
    console.error("[AdminService] Failed to approve travel request:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to approve travel request");
  }
};

export const rejectTravelRequest = async (name: string, remarks?: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.reject_travel_request`;

  try {
    const response = await api.post<{ message: string }>(apiUrl, { travel_name: name, ...(remarks ? { remarks } : {}) }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return { message: response.data?.message || "Travel rejected" };
  } catch (error: any) {
    console.error("[AdminService] Failed to reject travel request:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to reject travel request");
  }
};

export interface PendingAttendanceApproval {
  name: string;
  employee: string;
  employee_name: string;
  department: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: string;
  creation: string;
}

export interface AttendanceApprovalDetail {
  name: string;
  employee: string;
  employee_name: string;
  department: string;
  company: string;
  from_date: string;
  to_date: string;
  half_day: boolean;
  half_day_date: string;
  reason: string;
  explanation: string;
  shift: string;
  include_holidays: boolean;
  status: string;
  creation: string;
}

export const getPendingAttendanceApprovals = async (): Promise<PendingAttendanceApproval[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_pending_attendance_approvals`;

  try {
    const response = await api.post<{ message: PendingAttendanceApproval[] }>(apiUrl, {}, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || [];
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch pending attendance approvals:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to fetch pending attendance approvals");
  }
};

export const getAttendanceApprovalDetail = async (name: string): Promise<AttendanceApprovalDetail | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_attendance_approval_details`;

  try {
    const response = await api.post<{ message: AttendanceApprovalDetail }>(apiUrl, { attendance_name: name }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || null;
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch attendance approval detail:", error);
    return null;
  }
};

export const approveAttendanceRequest = async (name: string, remarks?: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.approve_attendance_request`;

  try {
    const response = await api.post<{ message: string }>(apiUrl, { attendance_name: name, ...(remarks ? { remarks } : {}) }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return { message: response.data?.message || "Attendance approved" };
  } catch (error: any) {
    console.error("[AdminService] Failed to approve attendance request:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to approve attendance request");
  }
};

export const rejectAttendanceRequest = async (name: string, remarks?: string): Promise<{ message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.reject_attendance_request`;

  try {
    const response = await api.post<{ message: string }>(apiUrl, { attendance_name: name, ...(remarks ? { remarks } : {}) }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return { message: response.data?.message || "Attendance rejected" };
  } catch (error: any) {
    console.error("[AdminService] Failed to reject attendance request:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to reject attendance request");
  }
};

export interface Employee {
  name: string;
  employee_name: string;
  employee: string;
  department: string;
  designation: string;
  company: string;
  status: string;
  image?: string;
}

export interface EmployeeDetail {
  name: string;
  employee_name: string;
  employee: string;
  department: string;
  designation: string;
  company: string;
  status: string;
  image?: string;
  email?: string;
  phone?: string;
  date_of_joining?: string;
  date_of_birth?: string;
}

export interface EmployeeLeaveHistory {
  name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: string;
}

export interface EmployeeAttendanceHistory {
  name: string;
  attendance_date: string;
  status: string;
  working_hours: number;
  check_in?: string;
  check_out?: string;
}

export interface EmployeeTaskHistory {
  name: string;
  subject: string;
  priority: string;
  status: string;
  due_date: string;
}

export const getEmployeeList = async (search?: string): Promise<Employee[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_employee_list`;

  try {
    const response = await api.post<{ message: Employee[] }>(apiUrl, search ? { search } : {}, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || [];
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch employee list:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to fetch employee list");
  }
};

export const getEmployeeDetails = async (name: string): Promise<EmployeeDetail | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_employee_details`;

  try {
    const response = await api.post<{ message: EmployeeDetail }>(apiUrl, { employee_name: name }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || null;
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch employee details:", error);
    return null;
  }
};

export const getEmployeeLeaveHistory = async (name: string): Promise<EmployeeLeaveHistory[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_employee_leave_history`;

  try {
    const response = await api.post<{ message: EmployeeLeaveHistory[] }>(apiUrl, { employee_name: name }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || [];
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch employee leave history:", error);
    return [];
  }
};

export const getEmployeeAttendanceHistory = async (name: string): Promise<EmployeeAttendanceHistory[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_employee_attendance_history`;

  try {
    const response = await api.post<{ message: EmployeeAttendanceHistory[] }>(apiUrl, { employee_name: name }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || [];
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch employee attendance history:", error);
    return [];
  }
};

export const getEmployeeTaskHistory = async (name: string): Promise<EmployeeTaskHistory[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess_admin.get_employee_task_history`;

  try {
    const response = await api.post<{ message: EmployeeTaskHistory[] }>(apiUrl, { employee_name: name }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || [];
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch employee task history:", error);
    return [];
  }
};

// ============================================
// LOAN APPROVAL INTERFACES
// ============================================

export interface PendingLoanApproval {
  name: string;
  applicant: string;
  applicant_name: string | null;
  loan_product: string;
  loan_amount: number;
  posting_date: string;
  repayment_method: string;
  repayment_periods: number;
  repayment_amount: number;
  description: string;
  status: string;
}

export interface LoanApprovalDetail {
  name: string;
  applicant: string;
  applicant_name: string | null;
  company: string;
  loan_product: string;
  loan_amount: number;
  posting_date: string;
  repayment_method: string;
  repayment_periods: number;
  repayment_amount: number;
  total_payable_amount: number;
  total_payable_interest: number;
  description: string;
  status: string;
  is_secured_loan: number;
}

export interface AdminLoanItem {
  name: string;
  applicant: string;
  applicant_name: string;
  loan_product: string;
  loan_amount: number;
  disbursed_amount: number;
  status: string;
  monthly_repayment_amount: number;
  total_payment: number;
  total_principal_paid: number;
  loan_application: string;
}

export interface LoanApprovalsWithLoansResponse {
  applications: PendingLoanApproval[];
  loans: AdminLoanItem[];
}

// ============================================
// LOAN APPROVAL FUNCTIONS
// ============================================

export const getLoanApprovals = async (): Promise<LoanApprovalsWithLoansResponse> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan_admin.get_pending_loan_approvals`;

  try {
    const response = await api.get<{ message: string; data: { applications: PendingLoanApproval[]; loans: AdminLoanItem[] } }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    const applications = response.data?.data?.applications || [];
    const loans = response.data?.data?.loans || [];
    console.log("[AdminService] getLoanApprovals applications count:", applications.length, "loans count:", loans.length);
    console.log("[AdminService] getLoanApprovals statuses:", [...new Set(applications.map((a: PendingLoanApproval) => a.status))]);
    return { applications, loans };
  } catch (error: any) {
    console.error("[AdminService] getLoanApprovals failed:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to fetch loan approvals");
  }
};

export const getLoanApprovalDetail = async (name: string): Promise<LoanApprovalDetail | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan_admin.get_loan_application_approval_details?name=${encodeURIComponent(name)}`;

  try {
    const response = await api.get<{ message: LoanApprovalDetail }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    console.log("[AdminService] getLoanApprovalDetail raw response:", response.data);
    return response.data?.message || null;
  } catch (error: any) {
    console.error("[AdminService] getLoanApprovalDetail failed:", error);
    return null;
  }
};

export const approveLoanApplication = async (name: string, remarks?: string): Promise<{ success: boolean; message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan_admin.approve_loan_application`;

  try {
    const response = await api.post<{ message: { success: boolean; message: string } }>(apiUrl, { name, ...(remarks ? { remarks } : {}) }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    const result = response.data?.message || {};
    return { success: result.success ?? false, message: result.message || "Loan application approved" };
  } catch (error: any) {
    console.error("[AdminService] Failed to approve loan application:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to approve loan application");
  }
};

export const rejectLoanApplication = async (name: string, remarks?: string): Promise<{ success: boolean; message: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan_admin.reject_loan_application`;

  try {
    const response = await api.post<{ message: { success: boolean; message: string } }>(apiUrl, { name, ...(remarks ? { remarks } : {}) }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    const result = response.data?.message || {};
    return { success: result.success ?? false, message: result.message || "Loan application rejected" };
  } catch (error: any) {
    console.error("[AdminService] Failed to reject loan application:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to reject loan application");
  }
};

export const createLoanFromApplication = async (name: string, repayment_start_date: string): Promise<{ success: boolean; message: string; loan: string; status: string }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan_admin.create_loan_from_application`;

  try {
    const response = await api.post<{ message: { success: boolean; message: string; loan: string; status: string } }>(apiUrl, { name, repayment_start_date }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    const result = response.data?.message || {};
    return { success: result.success ?? false, message: result.message || "Loan created", loan: result.loan || "", status: result.status || "" };
  } catch (error: any) {
    console.error("[AdminService] Failed to create loan from application:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to create loan from application");
  }
};

export const disburseLoan = async (loan: string, disbursement_date: string, disbursed_amount?: number): Promise<{ success: boolean; message: string; disbursement: string; disbursed_amount: number }> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan_admin.disburse_loan`;

  try {
    const response = await api.post<{ message: { success: boolean; message: string; disbursement: string; disbursed_amount: number } }>(apiUrl, { loan, disbursement_date, ...(disbursed_amount !== undefined ? { disbursed_amount } : {}) }, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    const result = response.data?.message || {};
    return { success: result.success ?? false, message: result.message || "Loan disbursed", disbursement: result.disbursement || "", disbursed_amount: result.disbursed_amount ?? disbursed_amount ?? 0 };
  } catch (error: any) {
    console.error("[AdminService] Failed to disburse loan:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to disburse loan");
  }
};

export const getLoanAdminList = async (): Promise<AdminLoanItem[]> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.loan_admin.get_loan_admin_list`;

  try {
    const response = await api.get<{ message: AdminLoanItem[] }>(apiUrl, {
      headers: { "Content-Type": "application/json", ...getAuthHeader(apiKey, apiSecret) },
    });
    return response.data?.message || [];
  } catch (error: any) {
    console.error("[AdminService] Failed to fetch loan admin list:", error);
    const { message, status } = getMobileError(error);
    if (status === 401) throw new Error("Authentication failed. Please login again.");
    throw new Error(message || "Failed to fetch loan admin list");
  }
};
