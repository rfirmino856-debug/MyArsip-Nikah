# MyArsip Nikah — Desa Pelang Kidul

Sistem pengarsipan administrasi pernikahan Desa Pelang Kidul. **Payload CMS** menjadi satu-satunya tempat untuk menambah, mengedit, dan menghapus arsip. Aplikasi web hanya menampilkan statistik agregat.

## Komponen

| Aplikasi | Fungsi | Alamat lokal |
| --- | --- | --- |
| `apps/cms` | Login petugas, pengelolaan arsip, template surat, dan berkas scan melalui Payload CMS | `http://localhost:3001/admin` |
| `apps/web` | Dashboard statistik agregat; tidak menampilkan data pribadi atau menyediakan CRUD arsip | `http://localhost:3000` |
| `apps/api` | API GraphQL lama, hanya dipertahankan sebagai sumber untuk migrasi arsip lama | `http://localhost:4000/graphql` |

Prototype HTML/JavaScript statis sudah dihapus. Untuk penggunaan normal, `apps/api` tidak perlu dijalankan.

## Prasyarat

- Node.js **20.9 atau lebih baru** dan npm.
- MySQL hanya jika perlu mengakses sumber data API lama untuk migrasi.

Payload memakai SQLite secara default, sehingga MySQL tidak dibutuhkan untuk instalasi dan operasi normal. Lihat [panduan CMS](apps/cms/README.md) untuk pengaturan database alternatif.

## Menjalankan CMS dan dashboard

Jalankan Payload CMS:

```powershell
cd apps/cms
npm install
npm run dev
```

Buka [http://localhost:3001/admin](http://localhost:3001/admin). Buat akun pertama melalui alur Payload jika belum ada akun. Setelah login, buka koleksi **Arsip Nikah**. Nomor surat dibuat otomatis berdasarkan tahun arsip.

Di terminal terpisah, jalankan dashboard:

```powershell
cd apps/web
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Dashboard mengambil jumlah total, distribusi jenis surat dan tahun, serta ringkasan pembatalan dari endpoint statistik Payload. Endpoint tersebut hanya mengembalikan data agregat.

Jika alamat CMS berbeda dari `http://localhost:3001`, salin `apps/web/.env.example` menjadi `apps/web/.env.local`, lalu sesuaikan:

- `PAYLOAD_URL` untuk koneksi server dashboard ke CMS.
- `NEXT_PUBLIC_CMS_URL` untuk tautan **Buka CMS**.

## Build dan migrasi skema CMS

Sebelum menjalankan CMS produksi pada database yang sudah ada, buat backup database dan terapkan migrasi skema:

```powershell
cd apps/cms
npm run migrate
npm run build
npm run start
```

## Migrasi arsip lama

Migrasi opsional ini memerlukan API lama dan MySQL sumber yang sudah dikonfigurasi serta Payload CMS yang sedang berjalan. API lama hanya dibutuhkan untuk membaca data; mutation arsipnya telah dinonaktifkan. Skrip migrasi mempertahankan ID lama, melewati data yang sudah pernah diimpor, dan tidak menghapus data sumber.

Ikuti [panduan migrasi CMS](apps/cms/README.md#memigrasikan-arsip-lama-dari-api) untuk menyiapkan API, environment, dan kredensial admin Payload. Kemudian, dari folder `apps/cms`, jalankan:

```powershell
npm run migrate:legacy-archives
```

Verifikasi jumlah data yang diimpor dan statistik dashboard sebelum menghentikan sumber API lama.

## Dokumentasi

- [Panduan Payload CMS dan migrasi data](apps/cms/README.md)
- [Arsitektur dan alur migrasi](MIGRATION_PLAN.md)

---

Hak Cipta © 2026.
