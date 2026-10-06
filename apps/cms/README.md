# Pengelolaan arsip dengan Payload CMS

Kelola arsip nikah melalui koleksi **Arsip Nikah** di Payload Admin. Koleksi ini hanya dapat dibaca dan diubah oleh pengguna CMS yang sudah login. Aplikasi web Next.js hanya menerima ringkasan statistik agregat; endpoint statistik tidak mengirim data nama, NIK, atau isi arsip.

## Menjalankan aplikasi

Jalankan API lama selama proses migrasi data:

```powershell
cd apps/api
npm run dev
```

Di terminal lain, jalankan Payload CMS:

```powershell
cd apps/cms
npm run dev
```

Login di `http://localhost:3001/admin`, kemudian kelola arsip pada menu **Arsip Nikah**. Nomor surat dibuat otomatis berdasarkan tahun arsip.

Untuk menampilkan statistik, jalankan aplikasi web:

```powershell
cd apps/web
npm run dev
```

Salin `apps/web/.env.example` ke `.env.local` jika alamat CMS bukan `http://localhost:3001`.

Sebelum menjalankan build CMS produksi terhadap database yang sudah ada, terapkan migrasi skema:

```powershell
npm run migrate
```

Migrasi pertama ini hanya menambahkan tabel arsip dan relasi Payload yang diperlukan; tetap buat backup database sebelum menjalankannya.

## Memigrasikan arsip lama dari API

Migrasi menyalin arsip yang belum ada di Payload, mempertahankan ID sumber pada field internal `legacyId`, dan aman dijalankan ulang untuk melewati data yang sudah diimpor. Migrasi tidak menghapus data sumber.

Atur kredensial pengguna admin Payload dan alamat layanan bila berbeda dari bawaan:

```powershell
$env:PAYLOAD_ADMIN_EMAIL = "admin@example.com"
$env:PAYLOAD_ADMIN_PASSWORD = "password-admin"
$env:PAYLOAD_URL = "http://localhost:3001"
$env:LEGACY_GRAPHQL_URL = "http://localhost:4000/graphql"
npm run migrate:legacy-archives
```

Pastikan API lama dan Payload CMS aktif saat migrasi dijalankan. Periksa jumlah arsip yang diimpor dan statistik web sebelum memutuskan apakah sumber lama dapat dihentikan.

## Statistik publik

Payload menyediakan `GET /api/public/stats` untuk aplikasi web. Endpoint ini hanya mengembalikan jumlah total, jumlah pembatalan, distribusi jenis surat, dan distribusi tahun; akses baca ke dokumen arsip tetap memerlukan login.
