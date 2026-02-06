import { useEffect, useState } from 'react';
import { EmployeesSection } from '@/components/sections/EmployeesSection';
import AttendanceSection from '@/components/sections/AttendanceSection';
import ReportsSection from '@/components/sections/ReportsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/services/api';
import type { CreateEmployeePayload, Employee } from '@/types';

function App() {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    setError(null);
    try {
      const data = await api.listEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tidak dapat memuat pegawai');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async (payload: CreateEmployeePayload) => {
    try {
      await api.createEmployee(payload);
      setInfo('Pegawai berhasil ditambahkan');
      await fetchEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pegawai');
      throw err;
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    try {
      await api.removeEmployee(id);
      setInfo('Data pegawai terhapus');
      await fetchEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pegawai');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Dasbor Absensi Karyawan</h1>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>Akhir pekan & tanggal merah dikecualikan</p>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-6xl px-4">
        <Tabs className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="employees">Data Pegawai</TabsTrigger>
            <TabsTrigger value="attendance">Absensi</TabsTrigger>
            <TabsTrigger value="reports">Laporan</TabsTrigger>
          </TabsList>

          {(info || error) && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {error || info}
            </div>
          )}

          <TabsContent value="employees">
            <EmployeesSection
              employees={employees}
              isLoading={isLoadingEmployees}
              onCreate={handleCreateEmployee}
              onDelete={handleDeleteEmployee}
            />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceSection employees={employees} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsSection employees={employees} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
