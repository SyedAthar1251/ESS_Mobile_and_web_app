import api from "./api";

// DUMMY MODE - Set to true to bypass API calls for development
const DUMMY_MODE = false;

// ============================================
// Types
// ============================================

export interface LeaveTypeBalance {
  leave_type: string;
  employee: string;
  employee_name: string;
  leaves_allocated: number;
  leaves_expired: number;
  opening_balance: number;
  leaves_taken: number;
  closing_balance: number;
  indent: number;
}


export interface LeaveApplication {
  name: string;
  leave_type: string;
  from_date: string;        // dd-MM-yyyy from API
  to_date: string;          // dd-MM-yyyy from API
  total_leave_days: number; // float / int from API
  description: string | null;
  status: string;
  posting_date?: string;    // optional â€” present in some API versions
}

export interface LeaveApplicationListResponse {
  message?: string;
  data?: {
    upcoming: LeaveApplication[];
    taken: LeaveApplication[];
    balance: LeaveTypeBalance[];
  };
}

// Leave type from get_leave_type API
export interface LeaveTypeResponse {
  leave_type: string;
  closing_balance: number;
}

// Create leave application request
export interface CreateLeaveApplicationRequest {
  leave_type: string;
  from_date: string;
  to_date: string;
  description?: string;
  half_day: boolean;
  half_day_date?: string;
  attachment?: File | null;
  custom_leave_intent?: string;
  hand_over_date?: string;
  first_day_report_to_work?: string;
  exclude_public_holidays?: boolean;
  custom_expected_delivery_date?: string;
  custom_child_birth_date?: string;
  custom_relationship_type?: string;
  custom_approved_leave_form?: File | null;
  custom_enrollment_proof?: File | null;
  custom_marriage_proof?: File | null;
  leave_approver?: string;
}

// Create leave application response
export interface CreateLeaveApplicationResponse {
  message?: string;
  data?: { name: string };
  _server_messages?: string;
  error?: string;
}

// ============================================
// Helper Functions
// ============================================

export const getUserCredentials = (): { companyUrl: string; apiKey: string; apiSecret: string; employeeId: string } => {
  const savedUser = localStorage.getItem("ess_user");
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    if (userData.companyUrl && userData.apiKey && userData.apiSecret) {
      return {
        companyUrl: userData.companyUrl,
        apiKey: userData.apiKey,
        apiSecret: userData.apiSecret,
        employeeId: userData.employeeId,
      };
    }
  }
  throw new Error("Authentication credentials not found. Please login again.");
};

export const getAuthHeader = (apiKey: string, apiSecret: string) => {
  // Frappe expects: "token api_key:api_secret"
  return {
    Authorization: `token ${apiKey}:${apiSecret}`,
  };
};

/** Fetch the leave_approver for the logged-in employee.
 *  Returns the approver user id (string) or null if missing/empty.
 */
export const getLeaveApprover = async (): Promise<string | null> => {
  const { companyUrl, apiKey, apiSecret, employeeId } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const url = `${cleanUrl}/api/resource/Employee/${encodeURIComponent(employeeId)}?fields=["leave_approver"]`;

  try {
    const res = await api.get(url, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    const data = (res.data as any)?.data;
    const approver = data?.leave_approver;
    return approver && approver.trim().length > 0 ? approver : null;
  } catch (err) {

    return null;
  }
};

// ============================================
// CENTRALISED FRAPPE ERROR HANDLER
// ============================================

/** Maps known Frappe exception class names â†’ user-friendly messages. */
const FRAPPE_EXCEPTION_MAP: Record<string, string> = {
  MandatoryError: "Required field missing",
  ValidationError: "Invalid data entered",
  PermissionError: "You don't have permission to perform this action",
  DuplicateEntryError: "Record already exists",
  LinkValidationError: "Invalid selected value",
  NotFoundError: "Record not found",
  DoesNotExistError: "Record not found",
  DataError: "Invalid data entered",
  TimeoutError: "Request timed out. Please try again",
  ConnectionError: "Network error. Please check your connection",
};

/** Removes traceback / stack sections from error text. */
const stripTraceback = (text: string): string =>
  text
    // Remove explicit "Traceback..." blocks
    .replace(/Traceback[\s\S]*/g, "")
    .replace(/\s*at\s+[\w.<>()-]+(?:\s+\([\w./\\:-]+(?::\d+)?\))?$/gm, "")
    // Strip Frappe noise
    .replace(/\bDocType\b[\w\s]*/gi, "")
    .replace(/\bDocument\b[\w\s]*/gi, "")
    .replace(/\bValue missing for [\w ]+:?\s*/gi, "")
    // Strip placeholder tokens, option footnotes, chains
    .replace(/:\s*\$\{[^}]+\}/g, "")
    .replace(/--\s*\[[^\]]*\]/g, "")
    .replace(/\[Caused by[^\]]*\]/gi, "")
    .trim();

/**
 * Centralised Frappe error extractor.
 * Picks the first non-empty source in priority order, strips noise,
 * maps known exception types, and returns a clean user-facing string.
 */
export const extractErrorMessage = (error: any): string => {
  const candidates: string[] = [
    error?.response?.data?._server_messages,
    error?.response?.data?.exception,
    error?.response?.data?.message,
    error?.response?.data?.exc_type,
    error?.message,
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  if (candidates.length === 0) {
    return "Something went wrong. Please try again";
  }

  // â”€â”€ Take the highest-priority candidate and strip lightweight noise â”€â”€â”€â”€â”€
  let cleaned = stripTraceback(candidates[0]).trim();

  // Frappe sometimes wraps the real error as a stringified JSON array:
  //   ["{\"message\":\"MandatoryError: Medical Certificate...\", ...}"]
  // Detect, decode and pull out the message field.
  if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
    try {
      const arr = JSON.parse(cleaned);
      if (Array.isArray(arr) && typeof arr[0] === "string") {
        try {
          const inner = JSON.parse(arr[0]);
          if (typeof inner.message === "string") cleaned = inner.message;
        } catch {
          cleaned = arr[0];
        }
      } else if (Array.isArray(arr) && typeof arr[0]?.message === "string") {
        cleaned = arr[0].message;
      }
    } catch {
      // not valid JSON — leave cleaned untouched
    }
  }

  // â”€â”€ Map known Frappe exception class names 
  const excMatch = cleaned.match(/\b(MandatoryError|ValidationError|PermissionError|DuplicateEntryError|LinkValidationError|NotFoundError|DoesNotExistError|DataError|TimeoutError|ConnectionError)\b/i);
  if (excMatch) {
    const mapped = FRAPPE_EXCEPTION_MAP[excMatch[1]];
    if (mapped) {
      // Still append any remaining field name that follows the error token
      const remainder = cleaned.replace(excMatch[0], "").replace(/^[:\s]+/, "");
      return remainder ? `${mapped}: ${remainder}` : mapped;
    }
  }

  // â”€â”€ Strip leading "Error:", "FrappeException:", etc 
  cleaned = cleaned.replace(/^(Error|FrappeException|HTTPError|ApiError)[:\s]+/i, "");

  // â”€â”€ Strip "Value missing for <DocType>" wrapper 
  cleaned = cleaned.replace(/^Value missing for (?:[\w\s]+):\s*/i, "");

  // â”€â”€ Strip internal IDs (e.g. DOC-00042, HR-LAP-2026-00001) 
  cleaned = cleaned.replace(/[\w]+-[A-Z]{2,}-\d{4}-\d{5,}/g, "[Record]");

  // â”€â”€ Collapse multiple spaces and final trim 
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  // â”€â”€ Final safety net: if everything was stripped 
  if (cleaned.length === 0) {
    return "Something went wrong. Please try again";
  }

  return cleaned;
};

// ============================================
// FILE UPLOAD HELPERS
// ============================================

/** Upload a single file to Frappe; returns the public file URL on success.
 *  Frappe answers in several shapes depending on site version:
 *    { file_url: "/private/files/â€¦" },
 *    { file_data: { content_hash: "abcâ€¦" } }         â†’ rebuild URL from hash
 *    { file_data: { file_name: "x.pdf" } }            â†’ use file_name only (best-effort)
 *  Any field may be absent â€” callers (uploadLeaveAttachments) will skip
 *  the URL if nothing was returned. */
const uploadFrappeFile = async (
  file: File,
  apiKey: string,
  apiSecret: string,
  companyUrl: string
): Promise<string | null> => {
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const uploadUrl = `${cleanUrl}/api/method/upload_file`;

  // Frappe rejects filenames with spaces / special chars — strip them
  const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");

  const fd = new FormData();
  fd.append("file", file, safeName);
  fd.append("is_private", "1");

   try {
     const res = await api.post<{
       file_url?: string;
       message?: {
         file_url?: string;
         name?: string;
       };
       file_data?: {
         content_hash?: string;
         file_name?: string;
       };
     }>(
       uploadUrl,
       fd,
       {
         headers: {
           ...getAuthHeader(apiKey, apiSecret),
         },
         timeout: 60000,
       }
     );

     // Preferred: absolute/relative file URL (Frappe may nest it under .message)
     const fileUrl =
       res.data?.file_url ||
       res.data?.message?.file_url;
     if (fileUrl) return fileUrl;

    // Fallback 1: content_hash â†’ reconstruct /private/files/<hash>
    const hash = res.data?.file_data?.content_hash;
    if (hash) return `/private/files/${hash}`;

    // Fallback 2: file_name only â€” caller will store whatever string we return
    const fname = res.data?.file_data?.file_name;
    if (fname) return `/private/files/${fname}`;

    return null;
  } catch (err: any) {

    return null;
  }
};

/** Upload all three leave-attachment files in parallel; returns partial result. */
type AttachmentUrls = {
  custom_approved_leave_form?: string | null;
  custom_enrollment_proof?: string | null;
  custom_marriage_proof?: string | null;
};

const uploadLeaveAttachments = async (
  body: CreateLeaveApplicationRequest,
  apiKey: string,
  apiSecret: string,
  companyUrl: string
): Promise<AttachmentUrls> => {
  const uploads: Array<Promise<string | null>> = [];
  const keys: Array<keyof AttachmentUrls> = [];

  if (body.custom_approved_leave_form) {
    uploads.push(uploadFrappeFile(body.custom_approved_leave_form, apiKey, apiSecret, companyUrl));
    keys.push("custom_approved_leave_form");
  }
  if (body.custom_enrollment_proof) {
    uploads.push(uploadFrappeFile(body.custom_enrollment_proof, apiKey, apiSecret, companyUrl));
    keys.push("custom_enrollment_proof");
  }
  if (body.custom_marriage_proof) {
    uploads.push(uploadFrappeFile(body.custom_marriage_proof, apiKey, apiSecret, companyUrl));
    keys.push("custom_marriage_proof");
  }

  if (uploads.length === 0) return {};

  const results = await Promise.all(uploads);
  return results.reduce<AttachmentUrls>((acc, url, i) => {
    // null = upload failed → send null so Frappe mandatory-check is satisfied
    // string = upload succeeded → send the file URL
    acc[keys[i]] = url ?? null;
    return acc;
  }, {});
};

// ============================================
// LEAVE TYPES API
// ============================================
// POST: /api/method/employee_self_service.mobile.ess.get_leave_type
// NOTE: Frappe whitelist - requires POST (not GET) to avoid HTTP 417

export const getLeaveTypes = async (): Promise<{ data: LeaveTypeResponse[] }> => {
  const { companyUrl, apiKey, apiSecret, employeeId } = getUserCredentials();

  if (DUMMY_MODE) {

    return {
      data: [
        { leave_type: "Casual Leave", closing_balance: 5 },
        { leave_type: "Sick Leave", closing_balance: 3 },
        { leave_type: "Annual Leave", closing_balance: 15 },
        { leave_type: "Maternity Leave", closing_balance: 90 },
      ],
    };
  }

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.get_leave_type`;

  try {
    const formData = new URLSearchParams();
    const response = await api.post<{ data: LeaveTypeResponse[] }>(
      apiUrl,
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...getAuthHeader(apiKey, apiSecret),
        },
      }
    );

    return response.data;
  } catch (error: any) {

    return { data: [] };
  }
};

// ============================================
// CREATE LEAVE APPLICATION
// ============================================
// POST: /api/resource/Leave Application (Frappe core API)

export const createLeaveApplication = async (
  body: CreateLeaveApplicationRequest
): Promise<CreateLeaveApplicationResponse> => {
  const { companyUrl, apiKey, apiSecret, employeeId } = getUserCredentials();

  if (DUMMY_MODE) {

    return {
      message: "Leave application submitted successfully",
      data: {
        name: "LEAVE-APP-DUMMY-" + Date.now(),
      },
    };
  }

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/resource/Leave Application`;

  try {
    // Step 1  upload attachment files in parallel (non-blocking for non-file requests)
    const fileUrls = await uploadLeaveAttachments(body, apiKey, apiSecret, companyUrl);

    // Step 2 â€” build pure JSON payload (matches target Frappe schema)
    const payload: Record<string, any> = {
      doctype: "Leave Application",
      employee: employeeId,
      leave_type: body.leave_type,
      from_date: body.from_date,
      to_date: body.to_date,
      // reason set conditionally below to avoid sending empty string
      half_day: body.half_day ? 1 : 0,
      exclude_public_holidays: body.exclude_public_holidays ? 1 : 0,
    };

    if (body.description) payload.reason = body.description;
    if (body.custom_leave_intent) payload.custom_leave_intent = body.custom_leave_intent;
    if (body.hand_over_date) payload.hand_over_date = body.hand_over_date;
    if (body.first_day_report_to_work) payload.first_day_report_to_work = body.first_day_report_to_work;

    if (body.half_day_date) payload.half_day_date = body.half_day_date;
    if (body.custom_expected_delivery_date) payload.custom_expected_delivery_date = body.custom_expected_delivery_date;
    if (body.custom_child_birth_date) payload.custom_child_birth_date = body.custom_child_birth_date;
    if (body.custom_relationship_type) payload.custom_relationship_type = body.custom_relationship_type;
    if (body.leave_approver) payload.leave_approver = body.leave_approver;

    // Inject uploaded file URLs (Frappe stores them as /private/files/<name>)
    // !== undefined (not just truthy) so we send null when upload failed —
    // this satisfies Frappe's mandatory-field check so the ENTIRE submission
    // is not rejected just because one file could not be uploaded.
    if (fileUrls.custom_approved_leave_form !== undefined)
      payload.custom_approved_leave_form = fileUrls.custom_approved_leave_form;
    if (fileUrls.custom_enrollment_proof !== undefined)
      payload.custom_enrollment_proof = fileUrls.custom_enrollment_proof;
    if (fileUrls.custom_marriage_proof !== undefined)
      payload.custom_marriage_proof = fileUrls.custom_marriage_proof;



    const response = await api.post<CreateLeaveApplicationResponse>(
      apiUrl,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
        timeout: 30000,
      }
    );

    if (!response.data?.data || Array.isArray(response.data.data)) {
      throw new Error(extractErrorMessage(response.data || response));
    }

    return response.data;
  } catch (error: any) {

    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(extractErrorMessage(error));
  }
};

// ============================================
// GET Leave Application List
// ============================================
// API: employee_self_service.mobile.ess.get_leave_application_list

export const getLeaveApplicationList = async (): Promise<LeaveApplicationListResponse> => {
  const { companyUrl, apiKey, apiSecret, employeeId } = getUserCredentials();

  if (DUMMY_MODE) {

    return {
      message: "leave data getting successfully",
      data: {
        upcoming: [
          {
            name: "HR-LAP-2026-00001",
            leave_type: "Hajj Leave",
            from_date: "22-05-2026",
            to_date: "01-06-2026",
            total_leave_days: 11.0,
            description: null,
            status: "Approved",
            posting_date: "17-05-2026",
          },
        ],
        taken: [],
        balance: [
          { leave_type: "Additional Annual Leave",       employee: "TS-EMP-00001", employee_name: "Test User", leaves_allocated: 0, leaves_expired: 0, opening_balance: 0, leaves_taken: 0, closing_balance: 0,  indent: 1 },
          { leave_type: "Annual Leave",                   employee: "TS-EMP-00001", employee_name: "Test User", leaves_allocated: 15, leaves_expired: 0, opening_balance: 15, leaves_taken: 0, closing_balance: 15, indent: 1 },
          { leave_type: "Bereavement Leave",              employee: "TS-EMP-00001", employee_name: "Test User", leaves_allocated: 0, leaves_expired: 0, opening_balance: 0, leaves_taken: 0, closing_balance: 0,  indent: 1 },
          { leave_type: "Bereavement Leave (Sibling)",    employee: "TS-EMP-00001", employee_name: "Test User", leaves_allocated: 3,  leaves_expired: 0, opening_balance: 3,  leaves_taken: 0, closing_balance: 3,  indent: 1 },
          { leave_type: "Casual Leave",                   employee: "TS-EMP-00001", employee_name: "Test User", leaves_allocated: 5,  leaves_expired: 0, opening_balance: 5,  leaves_taken: 0, closing_balance: 5,  indent: 1 },
          { leave_type: "Compensatory Off",               employee: "TS-EMP-00001", employee_name: "Test User", leaves_allocated: 0, leaves_expired: 0, opening_balance: 0, leaves_taken: 0, closing_balance: 0,  indent: 1 },
          { leave_type: "Sick Leave",                     employee: "TS-EMP-00001", employee_name: "Test User", leaves_allocated: 10, leaves_expired: 0, opening_balance: 10, leaves_taken: 0, closing_balance: 10, indent: 1 },
        ],
      },
    };
  }

  const apiUrl = `${companyUrl.replace(/\/$/, "")}/api/method/employee_self_service.mobile.ess.get_leave_application_list`;

  try {
    const response = await api.get<LeaveApplicationListResponse>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });

    return response.data;
  } catch (error: any) {

    if (error.response?.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    }
    throw new Error(extractErrorMessage(error));
  }
};

// ============================================
// Leave Application Detail
// ============================================

export interface LeaveApplicationDetail {
  name: string;
  employee: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  total_leave_days: number;
  status: string;
  posting_date: string;
  description: string | null;
  leave_approver: string;
}

export const getLeaveApplicationDetail = async (
  name: string,
): Promise<LeaveApplicationDetail | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");

  const fields = encodeURIComponent(JSON.stringify([
    "name", "employee", "employee_name", "leave_type",
    "from_date", "to_date", "total_leave_days", "status",
    "posting_date", "description", "leave_approver",
  ]));

  const apiUrl = `${cleanUrl}/api/resource/Leave%20Application/${encodeURIComponent(name)}?fields=${fields}`;

  try {
    const response = await api.get<{ data: LeaveApplicationDetail }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return response.data?.data || null;
  } catch (error: any) {

    return null;
  }
};

export const getUserDisplayName = async (userId: string): Promise<string> => {
  if (!userId) return "";
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();
  const cleanUrl = companyUrl.replace(/\/$/, "");
  const fields = encodeURIComponent(JSON.stringify(["full_name"]));
  const apiUrl = `${cleanUrl}/api/resource/User/${encodeURIComponent(userId)}?fields=${fields}`;

  try {
    const response = await api.get<{ data: { full_name?: string } }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
    });
    return response.data?.data?.full_name || userId;
  } catch {
    return userId;
  }
};

// ============================================
// Workflow Timeline
// ============================================

export interface WorkflowTimelineResponse {
  success: boolean;
  has_workflow: boolean;
  workflow_name?: string;
  current_state?: string;
  current_status?: string;
  timeline?: {
    state: string;
    status: "completed" | "current" | "pending";
    action_by?: string | null;
    action_at?: string | null;
  }[];
  pending_roles?: string[];
  is_final_state?: boolean;
}

export const getWorkflowTimeline = async (
  doctype: string,
  docname: string
): Promise<WorkflowTimelineResponse | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.get_workflow_timeline?doctype=${encodeURIComponent(doctype)}&docname=${encodeURIComponent(docname)}`;

  try {
    const response = await api.get<{ message: WorkflowTimelineResponse }>(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(apiKey, apiSecret),
      },
      timeout: 15000,
    });
    return response.data.message;
  } catch (error: any) {

    return null;
  }
};

// ============================================
// Leave Calendar Details
// ============================================
// GET /api/method/employee_self_service.mobile.ess.get_leave_calendar_details

export interface LeaveCalendarLeaveDetail {
  name?: string;
  date?: string;
  from_date?: string;
  to_date?: string;
  leave_type?: string;
  status?: string;
  half_day?: number;
  total_leave_days?: number;
}

export interface LeaveCalendarPublicHoliday {
  date: string;
  description: string;
}

export interface LeaveCalendarWeeklyOff {
  date: string;
  day: string;
}

export interface LeaveCalendarBridgePolicy {
  bridge_applies?: boolean;
  bridge_fires?: boolean;
  bridge_message?: string;
  bridge_dates?: string[];
  previous_leave?: string | null;
}

export interface LeaveCalendarSickLeaveSlab {
  slab_type?: string;
  days?: number;
  percentage?: number;
  description?: string;
  full_pay_allowed?: number;
  full_pay_used?: number;
  partial_pay_allowed?: number;
  partial_pay_used?: number;
  unpaid_allowed?: number;
  unpaid_used?: number;
}

export interface LeaveCalendarResponse {
  leave_details?: LeaveCalendarLeaveDetail;
  calendar_days?: number;
  public_holidays?: LeaveCalendarPublicHoliday[];
  weekly_offs?: LeaveCalendarWeeklyOff[];
  effective_leave_days?: number;
  bridge_policy_data?: LeaveCalendarBridgePolicy;
  existing_leaves?: LeaveCalendarLeaveDetail[];
  sick_leave_slab?: LeaveCalendarSickLeaveSlab;
  from_date?: string;
  to_date?: string;
  leave_type?: string;
  message?: string;
}

export const getLeaveCalendarDetails = async (
  leaveApplicationName: string
): Promise<LeaveCalendarResponse | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.get_leave_calendar_details?leave_application=${encodeURIComponent(leaveApplicationName)}`;

  try {
    const response = await api.get<{ message: LeaveCalendarResponse }>(
      apiUrl,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
        timeout: 30000,
      }
    );

    return (response.data as any)?.data || null;
  } catch (error: any) {

    return null;
  }
};

// ============================================
// Leave Calendar Preview (for Apply Leave)
// ============================================

export interface LeaveCalendarPreviewRequest {
  leave_type: string;
  from_date: string;
  to_date: string;
}

export const getLeaveCalendarPreview = async (
  body: LeaveCalendarPreviewRequest
): Promise<LeaveCalendarResponse | null> => {
  const { companyUrl, apiKey, apiSecret } = getUserCredentials();

  const cleanUrl = companyUrl.replace(/\/$/, "");
  const apiUrl = `${cleanUrl}/api/method/employee_self_service.mobile.ess.get_leave_calendar_preview?leave_type=${encodeURIComponent(body.leave_type)}&from_date=${encodeURIComponent(body.from_date)}&to_date=${encodeURIComponent(body.to_date)}`;

  try {
    const response = await api.get<{ message: LeaveCalendarResponse }>(
      apiUrl,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(apiKey, apiSecret),
        },
        timeout: 30000,
      }
    );

    return (response.data as any)?.data || null;
  } catch (error: any) {

    return null;
  }
};

