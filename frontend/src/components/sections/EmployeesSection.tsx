import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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
import type { CreateEmployeePayload, Employee } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface Props {
  employees: Employee[];
  isLoading: boolean;
  onCreate: (data: CreateEmployeePayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

type EmployeeFormState = {
  fullName: string;
  email: string;
  position: string;
  hireDate: string;
  status: 'active' | 'inactive';
};

const defaultForm = (): EmployeeFormState => ({
  fullName: '',
  email: '',
  position: '',
  hireDate: format(new Date(), 'yyyy-MM-dd'),
  status: 'active',
});

export function EmployeesSection({ employees, isLoading, onCreate, onDelete }: Props) {
  const [form, setForm] = useState<EmployeeFormState>(defaultForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(form);
      toast({ title: 'Berhasil', description: 'Pegawai berhasil disimpan' });
      setForm(defaultForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pegawai');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await onDelete(deleteTarget.id);
      toast({ title: 'Berhasil', description: 'Data pegawai dihapus' });
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tidak bisa menghapus pegawai');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Data Pegawai</CardTitle>
          <CardDescription>Formulir untuk menambah karyawan baru.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                placeholder="cth. Annisa Pratiwi"
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="annisa@contoh.com"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Posisi</Label>
              <Input
                id="position"
                placeholder="cth. Staf Keuangan"
                value={form.position}
                onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hireDate">Tanggal Bergabung</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={form.hireDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, hireDate: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as 'active' | 'inactive' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" disabled={submitting} type="submit">
              {submitting ? 'Menyimpan...' : 'Simpan Pegawai'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 text-sm text-slate-500">
          {error && <span className="text-red-600">{error}</span>}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pegawai</CardTitle>
          <CardDescription>Total {employees.length} pegawai terdaftar.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton className="h-10 w-full" key={index} />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada data, silakan tambah pegawai baru.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Mulai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.fullName}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{new Date(employee.hireDate).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === 'active' ? 'success' : 'secondary'}>
                        {employee.status === 'active' ? 'Aktif' : 'Tidak aktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(employee)}>
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => (!open ? setDeleteTarget(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data pegawai?</AlertDialogTitle>
            <AlertDialogDescription>
              Pegawai {deleteTarget?.fullName} akan dihapus secara permanen dari master data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Batal</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Menghapus...' : 'Hapus'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
