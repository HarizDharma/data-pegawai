import type {
  Attendance,
  AttendanceListResponse,
  CreateAttendancePayload,
  CreateEmployeePayload,
  Employee,
  HolidayDetail,
  MonthlyReportResponse,
} from '@/types';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Permintaan gagal');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const buildQuery = (params?: Record<string, string | number | undefined>) => {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const api = {
  getHolidays: (params?: { year?: number; month?: string }) =>
    request<{ holidays: HolidayDetail[] }>(`/meta/holidays${buildQuery(params)}`),
  listEmployees: () => request<Employee[]>('/employees'),
  createEmployee: (payload: CreateEmployeePayload) =>
    request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateEmployee: (id: number, payload: Partial<CreateEmployeePayload>) =>
    request<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  removeEmployee: (id: number) => request<void>(`/employees/${id}`, { method: 'DELETE' }),

  listAttendance: (params?: { employeeId?: number; month?: string; page?: number; limit?: number }) =>
    request<AttendanceListResponse>(
      `/attendances${buildQuery(params as Record<string, string | number | undefined>)}`
    ),
  createAttendance: (payload: CreateAttendancePayload) =>
    request<Attendance>('/attendances', { method: 'POST', body: JSON.stringify(payload) }),
  removeAttendance: (id: number) => request<void>(`/attendances/${id}`, { method: 'DELETE' }),

  getMonthlyReport: (params: { month: string; employeeId?: number }) =>
    request<MonthlyReportResponse>(`/reports/monthly${buildQuery(params)}`),
};
