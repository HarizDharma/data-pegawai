import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/services/api';
import type { AttendanceStatus, Employee, HolidayDetail, MonthlyReportResponse, MonthlyReportSummary } from '@/types';

interface Props {
  employees: Employee[];
}

const defaultMonth = format(new Date(), 'yyyy-MM');

const extractYear = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^(\d{4})/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
};

const detailPageOptions = ['7', '14', '21', '31'];

const ReportsSection = ({ employees }: Props) => {
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [report, setReport] = useState<MonthlyReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailSummary, setDetailSummary] = useState<MonthlyReportSummary | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecords, setDetailRecords] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [detailRecordsLoading, setDetailRecordsLoading] = useState(false);
  const [detailRecordsError, setDetailRecordsError] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(1);
  const [detailPageSize, setDetailPageSize] = useState('14');
  const weekendDays = [5, 6, 0];
  const [holidayDetails, setHolidayDetails] = useState<HolidayDetail[]>([]);
  const fetchedHolidayYears = useRef<Set<number>>(new Set());
  const mergeHolidayDetails = useCallback((incoming: HolidayDetail[] = []) => {
    if (!incoming || incoming.length === 0) return;
    setHolidayDetails((prev) => {
      const map = new Map(prev.map((item) => [item.date, item.name]));
      incoming.forEach((item) => {
        map.set(item.date, item.name);
      });
      return Array.from(map.entries()).map(([date, name]) => ({ date, name }));
    });
  }, []);
  const ensureHolidayYear = useCallback(
    async (year: number | null) => {
      if (!year || fetchedHolidayYears.current.has(year)) return;
      try {
        const data = await api.getHolidays({ year });
        mergeHolidayDetails(data.holidays ?? []);
        fetchedHolidayYears.current.add(year);
      } catch (err) {
        console.error(`Gagal memuat tanggal merah ${year}`, err);
      }
    },
    [mergeHolidayDetails]
  );

  useEffect(() => {
    ensureHolidayYear(new Date().getFullYear());
  }, [ensureHolidayYear]);

  useEffect(() => {
    const year = extractYear(selectedMonth);
    ensureHolidayYear(year);
  }, [selectedMonth, ensureHolidayYear]);

  const employeeOptions = useMemo(() => employees.map((emp) => ({ value: String(emp.id), label: emp.fullName })), [employees]);

  const fetchReport = async () => {
    if (!selectedMonth) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getMonthlyReport({
        month: selectedMonth,
        employeeId: selectedEmployee === 'all' ? undefined : Number(selectedEmployee),
      });
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil laporan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee, selectedMonth]);

  const openDetail = (summary: MonthlyReportSummary) => {
    setDetailSummary(summary);
    setDetailPage(1);
    setDetailOpen(true);
  };

  const normalizeNotes = (value?: string | null) => {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : '-';
  };

  useEffect(() => {
    if (!detailSummary) return;
    const loadAttendance = async () => {
      setDetailRecordsLoading(true);
      setDetailRecordsError(null);
      try {
        const response = await api.listAttendance({
          month: selectedMonth,
          employeeId: detailSummary.employee.id,
          page: 1,
          limit: 200,
        });
        const map: Record<string, { status: AttendanceStatus; notes: string }> = {};
        response.data.forEach((item) => {
          map[item.attendanceDate] = { status: item.status, notes: normalizeNotes(item.notes) };
        });
        setDetailRecords(map);
      } catch (err) {
        setDetailRecordsError('Gagal memuat detail absensi');
      } finally {
        setDetailRecordsLoading(false);
      }
    };
    loadAttendance();
  }, [detailSummary, selectedMonth]);

  const holidaySet = useMemo(() => new Set(report?.holidays ?? []), [report]);
  const holidayNameMap = useMemo(() => {
    const map = new Map<string, string>();
    holidayDetails.forEach((item) => map.set(item.date, item.name));
    return map;
  }, [holidayDetails]);

  type DetailRow = {
    date: Date;
    iso: string;
    status: AttendanceStatus | 'absent';
    notes: string;
    recorded: boolean;
    isHoliday: boolean;
    isWeekend: boolean;
    holidayName: string | null;
  };

  const summaryDetailMap = useMemo(
    () => new Map(detailSummary?.details.map((item) => [item.date, item]) ?? []),
    [detailSummary]
  );

  const detailRows: DetailRow[] = useMemo(() => {
    if (!detailSummary) return [];
    const base = parseISO(`${selectedMonth}-01`);
    const buildRecord = (iso: string, dateObj?: Date) => {
      const recordFromMap = detailRecords[iso];
      const fallback = summaryDetailMap.get(iso);
      const status = (recordFromMap?.status ?? fallback?.status ?? 'absent') as AttendanceStatus | 'absent';
      const notes = recordFromMap?.notes ?? normalizeNotes(fallback?.notes ?? null);
      const date = dateObj ?? (fallback ? parseISO(fallback.date) : parseISO(iso));
      return {
        date,
        iso,
        status,
        notes,
        recorded: Boolean(recordFromMap || fallback),
        isHoliday: holidaySet.has(iso),
        isWeekend: weekendDays.includes(date.getDay()),
        holidayName: holidayNameMap.get(iso) || null,
      };
    };

    if (Number.isNaN(base.getTime())) {
      const keys = Array.from(new Set([...Object.keys(detailRecords), ...summaryDetailMap.keys()])).sort();
      return keys.map((iso) => buildRecord(iso));
    }
    const interval = eachDayOfInterval({ start: startOfMonth(base), end: endOfMonth(base) });
    return interval.map((date) => buildRecord(format(date, 'yyyy-MM-dd'), date));
  }, [detailSummary, detailRecords, summaryDetailMap, holidaySet, selectedMonth, holidayNameMap]);

  const describeDetail = (detail: DetailRow) => {
    const dayName = detail.date.toLocaleDateString('id-ID', { weekday: 'long' });
    const reasons: string[] = [];
    if (detail.isHoliday) {
      reasons.push(`Tanggal merah: ${detail.holidayName || 'Libur nasional'}`);
    }
    if (detail.isWeekend) {
      reasons.push(`Akhir pekan (${dayName})`);
    }
    if (reasons.length > 0) {
      return {
        title: 'Tidak dihitung',
        detail: `${reasons.join(' • ')} – hanya arsip, tidak menambah total hadir`,
      };
    }
    if (!detail.recorded) {
      return {
        title: 'Belum ada absensi',
        detail: 'Belum ada catatan untuk hari ini',
      };
    }
    return {
      title: 'Dihitung',
      detail: 'Hari kerja dan tercatat di laporan',
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Laporan Bulanan</CardTitle>
            <CardDescription>Weekend dan tanggal merah otomatis dikecualikan dari rekap.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span className="text-sm font-medium text-slate-500">Filter</span>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="md:w-[200px]">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua pegawai</SelectItem>
                  {employeeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={fetchReport} type="button" variant="outline">
                Muat Ulang
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : report && report.summaries.length > 0 ? (
            <div className="space-y-4">
              <Badge variant="secondary" className="text-xs">
                Hari kerja: {report.totalWorkingDays}
              </Badge>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pegawai</TableHead>
                    <TableHead>Posisi</TableHead>
                    <TableHead>Hadir</TableHead>
                    <TableHead>Absen</TableHead>
                    <TableHead className="text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.summaries.map((summary) => (
                    <TableRow key={summary.employee.id}>
                      <TableCell className="font-medium">{summary.employee.fullName}</TableCell>
                      <TableCell>{summary.employee.position}</TableCell>
                      <TableCell>{summary.presentDays}</TableCell>
                      <TableCell>{summary.absentDays}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openDetail(summary)}>
                          Lihat Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Belum ada data untuk filter saat ini.</p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailSummary(null);
            setDetailPage(1);
          }
        }}
      >
        <DialogContent>
          {detailSummary && report && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{detailSummary.employee.fullName}</DialogTitle>
                <DialogDescription>
                  {detailSummary.employee.position} • {selectedMonth.replace('-', ' / ')}
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-4 text-sm text-slate-600">
                <Badge variant="success" className="text-xs">Hadir {detailSummary.presentDays}</Badge>
                <Badge variant="destructive" className="text-xs">Absen {detailSummary.absentDays}</Badge>
                <span>Total hari kerja: {report.totalWorkingDays}</span>
              </div>
              <p className="text-xs text-slate-500">
                Weekend & tanggal merah tetap muncul di tabel namun tidak masuk perhitungan total hadir/absen.
              </p>
              {detailRecordsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded border border-slate-100">
                  <div className="max-h-80 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead>Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailRows
                        .slice((detailPage - 1) * Number(detailPageSize), detailPage * Number(detailPageSize))
                        .map((detail) => {
                          const variant = detail.isHoliday || detail.isWeekend ? 'warning' : detail.status === 'present' ? 'success' : 'destructive';
                          const info = describeDetail(detail);
                          return (
                            <TableRow key={`${detailSummary.employee.id}-${detail.iso}`}>
                              <TableCell>{detail.date.toLocaleDateString('id-ID')}</TableCell>
                              <TableCell>
                                <Badge variant={variant}>{detail.status === 'present' ? 'Hadir' : 'Absen'}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-semibold text-slate-800">{info.title}</div>
                                <p className="text-xs text-slate-500">{info.detail}</p>
                              </TableCell>
                              <TableCell>{detail.notes}</TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              {detailRecordsError && <p className="text-sm text-red-600">{detailRecordsError}</p>}
              <div className="flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <span>
                    Menampilkan {Math.min((detailPage - 1) * Number(detailPageSize) + 1, detailRows.length)}-
                    {Math.min(detailPage * Number(detailPageSize), detailRows.length)} dari {detailRows.length} hari
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Baris per halaman</span>
                    <Select value={detailPageSize} onValueChange={(value) => {
                      setDetailPageSize(value);
                      setDetailPage(1);
                    }}>
                      <SelectTrigger className="h-8 w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {detailPageOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDetailPage((prev) => Math.max(prev - 1, 1))}
                    disabled={detailPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDetailPage((prev) =>
                        prev * Number(detailPageSize) < detailRows.length ? prev + 1 : prev
                      )
                    }
                    disabled={detailPage * Number(detailPageSize) >= detailRows.length}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsSection;
