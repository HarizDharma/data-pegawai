# Data Pegawai

Sistem mini untuk mengelola master data pegawai, absensi harian, serta laporan bulanan tanpa menghitung akhir pekan maupun tanggal merah. Frontend dibuat dengan React + Vite menggunakan komponen shadcn/ui, backend memakai Node.js Express dengan Sequelize menuju database MySQL.

## Fitur Utama
- **Master data pegawai**: tambah, baca, dan hapus pegawai lengkap dengan tanggal bergabung dan status aktif.
- **Module absensi**: input hadir/absen per tanggal, filter berdasarkan bulan maupun pegawai, dan hapus entri jika salah.
- **Laporan bulanan**: rekap jumlah hari kerja, hari hadir, dan hari absen per pegawai dengan detail per tanggal, otomatis mengabaikan weekend dan tanggal merah.

## Struktur Proyek
```
source/
├── backend/        # Express API + Sequelize (MySQL)
├── frontend/       # React + Vite + shadcn UI
└── soal.txt        # Deskripsi soal teknikal tes
```

## Kebutuhan Sistem
- Node.js **22.14.0** (versi yang dipakai saat pengembangan) beserta npm 10+
- Database MySQL 8+ yang dapat diakses secara lokal

## Backend
1. Masuk ke folder backend dan instal dependency:
   ```bash
   cd backend
   npm install
   ```
2. Salin file contoh environment dan sesuaikan kredensial MySQL. Nilai default sudah diarahkan ke server lokal umum:
   - `DB_HOST=localhost`
   - `DB_PORT=3306`
   - `DB_NAME=test`
   - `DB_USER=root`
   - `DB_PASS=root`
   ```bash
   cp .env.example .env
   # lalu edit .env jika perlu menyesuaikan environment
   ```
3. Buat database kosong bernama **test** (atau sesuai `DB_NAME`).
4. Jalankan server:
   ```bash
   npm run dev
   ```
   Saat start pertama kali, Sequelize otomatis membuat tabel `employees` dan `attendances`.

> API tanggal merah nasional Indonesia diambil secara dinamis dari `https://libur.deno.dev/api`. Backend melakukan cache 24 jam agar permintaan lebih efisien.

### Ringkasan Endpoint
| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| GET | `/employees` | ambil semua pegawai yang sudah tersimpan |
| POST | `/employees` | tambah pegawai baru beserta info jabatan/hire date |
| PUT | `/employees/:id` | perbarui data pegawai tertentu |
| DELETE | `/employees/:id` | hapus pegawai |
| GET | `/attendances?month=YYYY-MM&employeeId=` | tarik daftar absensi (bisa difilter bulan & pegawai) |
| POST | `/attendances` | simpan absensi (hindari duplikasi per tanggal/pegawai) |
| DELETE | `/attendances/:id` | hapus entri absensi |
| GET | `/reports/monthly?month=YYYY-MM&employeeId=` | rekap harian + total hadir/absen setelah weekend & tanggal merah disaring |
| GET | `/meta/holidays` | expose daftar tanggal merah Indonesia hasil fetch libur.deno.dev |

## Halaman Frontend (.tsx)
- `frontend/src/components/sections/EmployeesSection.tsx` – halaman master data pegawai (form tambah + tabel daftar pegawai).
- `frontend/src/components/sections/AttendanceSection.tsx` – halaman absensi harian dan riwayat absensi per bulan.
- `frontend/src/components/sections/ReportsSection.tsx` – halaman laporan bulanan, ringkasan hadir/absen, lengkap dengan dialog detail.

## Frontend
1. Masuk ke folder frontend dan instal dependency:
   ```bash
   cd frontend
   npm install
   ```
2. Salin environment agar frontend tahu alamat API:
   ```bash
   cp .env.example .env
   ```
3. Jalankan mode pengembangan:
   ```bash
   npm run dev
   ```
4. Build production (opsional):
   ```bash
   npm run build
   npm run preview
   ```

### Teknologi Frontend
- React 19 + Vite
- TailwindCSS + komponen shadcn (Button, Card, Table, Tabs, Select, dsb)
- Pengambilan data libur nasional otomatis dari API eksternal `https://libur.deno.dev/api`
