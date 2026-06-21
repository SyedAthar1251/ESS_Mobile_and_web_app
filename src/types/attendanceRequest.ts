export interface AttendanceRequest {
  name: string;
  employee: string;
  employee_name: string;
  from_date: string;
  to_date: string;
  reason: string;
  shift: string;
  docstatus: number;
  creation: string;
  modified: string;
  half_day?: 0 | 1;
  explanation?: string;
}

export interface AttendanceRequestListItem {
  name: string;
  employee: string;
  employee_name: string;
  from_date: string;
  to_date: string;
  reason: string;
  shift: string;
  docstatus: number;
  creation: string;
  modified: string;
  half_day?: 0 | 1;
  explanation?: string;
}

export interface AttendanceRequestDetail extends AttendanceRequest {
  status: string;
}

export interface CreateAttendanceRequestPayload {
  from_date: string;
  to_date: string;
  reason: string;
  shift?: string;
  half_day?: 0 | 1;
  include_holidays?: 0 | 1;
  explanation?: string;
}

export interface UpdateAttendanceRequestPayload {
  from_date?: string;
  to_date?: string;
  reason?: string;
  shift?: string;
  half_day?: 0 | 1;
  include_holidays?: 0 | 1;
  explanation?: string;
}

export interface AttendanceRequestListResponse {
  message?: string;
  data?: AttendanceRequestListItem[];
}

export interface CreateAttendanceRequestResponse {
  message?: string;
  data?: { name: string };
  error?: string;
}