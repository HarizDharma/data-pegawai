import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/services/api';
import type { Attendance, AttendanceStatus, Employee, HolidayDetail, PaginationMeta } from '@/types';

interface Props {
  employees: Employee[];
}

const today = format(new Date(), 'yyyy-MM-dd');
const currentMonth = format(new Date(), 'yyyy-MM');

const pageSizeOptions = ['10', '20', '50', '100'];

const extractYear = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^(\d{4})/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
};

const AttendanceSection = ({ employees }: Props) => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<HolidayDetail[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('10');
  const [deleteAttendanceTarget, setDeleteAttendanceTarget] = useState<Attendance | null>(null);
  const [deleteAttendanceLoading, setDeleteAttendanceLoading] = useState(false);
  const weekendDays = [5, 6, 0];
  const loadedHolidayYears = useRef<Set<number>>(new Set());
  const mergeHolidayDetails = useCallback((incoming: HolidayDetail[] = []) => {
    if (!incoming || incoming.length === 0) return;
    setHolidays((prev) => {
      const map = new Map(prev.map((item) => [item.date, item.name]));
      incoming.forEach((item) => {
        map.set(item.date, item.name);
      });
      return Array.from(map.entries()).map(([date, name]) => ({ date, name }));
    });
  }, []);
  const ensureHolidayYear = useCallback(
    async (year: number | null) => {
      if (!year || loadedHolidayYears.current.has(year)) return;
      try {
        const data = await api.getHolidays({ year });
        mergeHolidayDetails(data.holidays ?? []);
        loadedHolidayYears.current.add(year);
      } catch (err) {
        console.error(`Gagal memuat tanggal merah ${year}`, err);
      }
    },
    [mergeHolidayDetails]
  );
  const holidaySet = useMemo(() => new Set(holidays.map((item) => item.date)), [holidays]);
  const holidayNameMap = useMemo(() => {
    const map = new Map<string, string>();
    holidays.forEach((item) => map.set(item.date, item.name));
    return map;
  }, [holidays]);
  const [form, setForm] = useState({
    employeeId: '',
    attendanceDate: today,
    status: 'present' as AttendanceStatus,
    notes: '',
  });
  const toast = useToast();

  const employeeOptions = useMemo(() => employees.map((item) => ({ value: String(item.id), label: item.fullName })), [employees]);

  const fetchAttendance = async () => {
    if (!selectedMonth) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listAttendance({
        month: selectedMonth,
        employeeId: selectedEmployee === 'all' ? undefined : Number(selectedEmployee),
        page,
        limit: Number(pageSize),
      });
      setAttendance(response.data);
      setPagination(response.pagination);
      if (response.pagination.totalPages > 0 && page > response.pagination.totalPages) {
        setPage(response.pagination.totalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat absensi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee, selectedMonth, page, pageSize]);

  useEffect(() => {
    if (!form.employeeId && employeeOptions.length > 0) {
      setForm((prev) => ({ ...prev, employeeId: employeeOptions[0].value }));
    }
  }, [employeeOptions, form.employeeId]);

  useEffect(() => {
    ensureHolidayYear(new Date().getFullYear());
  }, [ensureHolidayYear]);

  useEffect(() => {
    const year = extractYear(selectedMonth);
    ensureHolidayYear(year);
  }, [selectedMonth, ensureHolidayYear]);

  useEffect(() => {
    const year = extractYear(form.attendanceDate);
    ensureHolidayYear(year);
  }, [form.attendanceDate, ensureHolidayYear]);


  const handleFilterResetPage = () => {
    setPage(1);
  };

  const handleEmployeeFilterChange = (value: string) => {
    setSelectedEmployee(value);
    handleFilterResetPage();
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    handleFilterResetPage();
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(value);
    handleFilterResetPage();
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && page < pagination.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const rangeStart = pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const rangeEnd = pagination && pagination.total > 0 ? rangeStart + attendance.length - 1 : 0;


  const getAttendanceStatusVariant = (dateIso: string, status: AttendanceStatus) => {
    const day = new Date(dateIso);
    const isWeekendDay = weekendDays.includes(day.getDay());
    const isHolidayDay = holidaySet.has(dateIso);
    if (isWeekendDay || isHolidayDay) return 'warning' as const;
    return status === 'present' ? 'success' : 'destructive';
  };

  const describeDate = (iso: string) => {
    const day = new Date(iso);
    if (Number.isNaN(day.getTime())) {
      return { title: '-', detail: 'Tanggal tidak valid', excluded: false };
    }
    const dayName = day.toLocaleDateString('id-ID', { weekday: 'long' });
    const isWeekendDay = weekendDays.includes(day.getDay());
    const holidayName = holidayNameMap.get(iso);
    const reasons: string[] = [];
    if (holidayName) {
      reasons.push(`Tanggal merah: ${holidayName}`);
    }
    if (isWeekendDay) {
      reasons.push(`Akhir pekan (${dayName})`);
    }
    if (reasons.length === 0) {
      return { title: 'Dihitung', detail: 'Hari kerja biasa', excluded: false };
    }
    return {
      title: 'Tidak dihitung',
      detail: `${reasons.join(' • ')} – hanya arsip, tidak masuk rekap`,
      excluded: true,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.employeeId) {
      setError('Pilih pegawai terlebih dahulu');
      return;
    }
    const parsedDate = parseISO(form.attendanceDate);
    if (Number.isNaN(parsedDate.getTime())) {
      setError('Tanggal tidak valid.');
      return;
    }
    const holidayName = holidayNameMap.get(form.attendanceDate);
    if (holidayName) {
      toast({ title: 'Tanggal merah', description: `${holidayName} – tidak dihitung di laporan.` });
    }
    if (weekendDays.includes(parsedDate.getDay())) {
      const dayName = parsedDate.toLocaleDateString('id-ID', { weekday: 'long' });
      toast({ title: 'Akhir pekan', description: `${dayName} – tidak dihitung di laporan.` });
    }
    const duplicateExists = attendance.some(
      (item) =>
        item.employeeId === Number(form.employeeId) && item.attendanceDate === form.attendanceDate
    );
    if (duplicateExists) {
      setError('Absensi untuk pegawai ini pada tanggal tersebut sudah tersimpan.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createAttendance({
        employeeId: Number(form.employeeId),
        attendanceDate: form.attendanceDate,
        status: form.status,
        notes: form.notes,
      });
      toast({ title: 'Berhasil', description: 'Absensi tersimpan' });
      setForm((prev) => ({ ...prev, notes: '' }));
      fetchAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan absensi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttendance = async () => {
    if (!deleteAttendanceTarget) return;
    setDeleteAttendanceLoading(true);
    try {
      await api.removeAttendance(deleteAttendanceTarget.id);
      toast({ title: 'Berhasil', description: 'Data absensi dihapus' });
      setDeleteAttendanceTarget(null);
      fetchAttendance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus');
    } finally {
      setDeleteAttendanceLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Catat Absensi</CardTitle>
          <CardDescription>Tandai pegawai yang hadir atau absen.</CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-sm text-slate-500">Tambahkan pegawai dulu sebelum melakukan absensi.</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Pilih Pegawai</Label>
                <Select
                  value={form.employeeId || undefined}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, employeeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pegawai" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendanceDate">Tanggal</Label>
                <Input
                  id="attendanceDate"
                  type="date"
                  value={form.attendanceDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, attendanceDate: event.target.value }))}
                />
                <p className="text-xs text-slate-500">Tanggal libur tetap tersimpan namun tidak dihitung di laporan.</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as AttendanceStatus }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Hadir</SelectItem>
                    <SelectItem value="absent">Absen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Input
                  placeholder="opsional"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
              <Button className="w-full" disabled={submitting} type="submit">
                {submitting ? 'Menyimpan...' : 'Simpan Absensi'}
              </Button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Riwayat Absensi</CardTitle>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span className="text-sm font-medium text-slate-500">Filter</span>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input type="month" value={selectedMonth} onChange={(event) => handleMonthChange(event.target.value)} />
              <Select value={selectedEmployee} onValueChange={handleEmployeeFilterChange}>
                <SelectTrigger className="md:w-[200px]">
                  <SelectValue placeholder="Pegawai" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {employeeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={pageSize} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="md:w-[120px]">
                <SelectValue placeholder="Jumlah" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
              <Button onClick={fetchAttendance} type="button" variant="outline">
                Segarkan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-slate-500">
            Catatan: Absensi pada hari Sabtu/Minggu atau tanggal merah tetap tersimpan namun tidak
            dihitung di laporan bulanan (ditandai warna kuning).
          </p>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : attendance.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada data untuk filter saat ini.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pegawai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((item) => {
                  const badgeVariant = getAttendanceStatusVariant(item.attendanceDate, item.status);
                  const dateInfo = describeDate(item.attendanceDate);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{new Date(item.attendanceDate).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{item.employee?.fullName ?? employees.find((emp) => emp.id === item.employeeId)?.fullName}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant}>
                          {item.status === 'present' ? 'Hadir' : 'Absen'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold text-slate-800">{dateInfo.title}</div>
                        <p className="text-xs text-slate-500">{dateInfo.detail}</p>
                      </TableCell>
                      <TableCell>{item.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setDeleteAttendanceTarget(item)}>
                          Hapus
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {pagination && (
            <div className="mt-4 flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
              <div>
                {pagination.total === 0 ? (
                  <span>Tidak ada data absensi.</span>
                ) : (
                  <span>
                    Menampilkan {rangeStart}-{rangeEnd} dari {pagination.total} baris
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handlePrevPage} size="sm" variant="outline" disabled={page <= 1}>
                  Sebelumnya
                </Button>
                <span>
                  Halaman {pagination.totalPages === 0 ? 0 : page} / {pagination.totalPages || 1}
                </span>
                <Button
                  onClick={handleNextPage}
                  size="sm"
                  variant="outline"
                  disabled={!pagination || page >= pagination.totalPages}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteAttendanceTarget}
        onOpenChange={(open: boolean) => (!open ? setDeleteAttendanceTarget(null) : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data absensi?</AlertDialogTitle>
            <AlertDialogDescription>
              Absensi tanggal{' '}
              {deleteAttendanceTarget
                ? new Date(deleteAttendanceTarget.attendanceDate).toLocaleDateString('id-ID')
                : ''}{' '}
              akan dihapus dari riwayat pegawai ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Batal</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleDeleteAttendance}
                disabled={deleteAttendanceLoading}
              >
                {deleteAttendanceLoading ? 'Menghapus...' : 'Hapus'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttendanceSection;
