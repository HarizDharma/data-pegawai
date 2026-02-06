export type EmploymentStatus = 'active' | 'inactive';
export type AttendanceStatus = 'present' | 'absent';

export interface HolidayDetail {
  date: string;
  name: string;
}

export interface Employee {
  id: number;
  fullName: string;
  email: string;
  position: string;
  hireDate: string;
  status: EmploymentStatus;
  createdAt?: string;
}

export interface Attendance {
  id: number;
  employeeId: number;
  attendanceDate: string;
  status: AttendanceStatus;
  notes?: string | null;
  employee?: Employee;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AttendanceListResponse {
  data: Attendance[];
  pagination: PaginationMeta;
}

export interface CreateEmployeePayload {
  fullName: string;
  email: string;
  position: string;
  hireDate: string;
  status?: EmploymentStatus;
}

export interface CreateAttendancePayload {
  employeeId: number;
  attendanceDate: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface MonthlyReportDetail {
  date: string;
  status: AttendanceStatus | 'absent';
  notes: string | null;
}

export interface MonthlyReportSummary {
  employee: Pick<Employee, 'id' | 'fullName' | 'position'>;
  presentDays: number;
  absentDays: number;
  details: MonthlyReportDetail[];
}

export interface MonthlyReportResponse {
  month: string;
  totalWorkingDays: number;
  holidays: string[];
  summaries: MonthlyReportSummary[];
}
