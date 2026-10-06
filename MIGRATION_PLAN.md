# 📋 Migration Plan: MyArsip Nikah (Next.js + Tailwind + PostgreSQL/MySQL + Drizzle + GraphQL + Payload CMS)

Dokumen ini adalah rencana teknis dan arsitektur migrasi **MyArsip Nikah - Desa Pelang Kidul** sebagai **Sistem Arsip & Backoffice Internal Tertutup (Non-Publik)** yang dikhususkan bagi petugas P3N dan staf desa.

---

## 🎯 Karakteristik Sistem: Backoffice Tertutup (Internal Officer Only)
- **Tidak ada akses publik / warga:** Seluruh modul (Next.js & Payload CMS) berada di balik pintu autentikasi ketat (login-wall).
- **Fokus Utama:** Manajemen dan pengarsipan data pernikahan, penerbitan surat nikah satu pintu, lemari arsip digital, dan upload scan berkas legal.
- **Peran Payload CMS:** Panel Content Management System khusus petugas untuk mengelola master dokumen, template format surat resmi desa, SOP persyaratan nikah, dan pengarsipan media/dokumen scan.

---

## 1. Arsitektur Sistem Terpisah (Decoupled Architecture)

```mermaid
graph TD
    subgraph "Aktor & Hak Akses (Internal Tertutup)"
        Petugas[Petugas P3N / Admin Desa (Login Wall Wajib)]
    end

    Petugas -->|Akses Dashboard Kerja| NextApp[Frontend Next.js: Form Input & Cetak Surat]
    Petugas -->|Akses Panel Pengarsipan & Media| PayloadAdmin[Payload CMS Admin Panel]
    
    NextApp -->|GraphQL API| Backend[Backend API Service: Drizzle ORM]
    PayloadAdmin -->|REST / GraphQL| PayloadBackend[Payload Headless Engine]
    
    subgraph "Database & Storage Layer"
        Backend --> DB[(Database: MySQL Lokal ➔ PostgreSQL Cloud)]
        PayloadBackend --> DB
        PayloadBackend --> Storage[Cloud / Local Storage Dokumen Scan]
    end
```

---

## 2. Tech Stack Detail & Peran

| Komponen | Pilihan Teknologi | Peran dalam Sistem Internal |
| :--- | :--- | :--- |
| **Frontend Petugas** | **Next.js (App Router)** + **Tailwind CSS** | Antarmuka kerja petugas: Form input cepat, lemari arsip visual, pencarian instan, dan pratinjau cetak PDF. |
| **Backend Core** | Node.js + **GraphQL Yoga** + **Drizzle ORM** | Mesin penghitung nomor surat satu pintu otomatis (atomic counter), transaksi data nikah, dan audit log. |
| **Internal CMS** | **Payload CMS** | Mengelola master template surat, berkas media scan (KTP, KK, Akta), regulasi/SOP desa, serta manajemen arsip konten. |
| **Database** | **MySQL (Lokal)** ➔ **PostgreSQL (Supabase/Neon)** | Penyimpanan data relasional aman dengan Drizzle ORM. |
| **Keamanan** | **Session / JWT Auth + RBAC** | Memastikan sistem 100% tertutup dari publik. Hanya petugas terdaftar yang bisa masuk. |

---

## 3. Desain Skema Database (Drizzle ORM)

### A. Tabel Autentikasi Internal & Audit:
- `users`: `id`, `name`, `username`, `email`, `password_hash`, `role` (`SUPERADMIN`, `P3N`, `VIEWER`), `created_at`
- `audit_logs`: `id`, `user_id`, `action` (`CREATE`, `UPDATE`, `DELETE`), `entity_type`, `entity_id`, `changes_json`, `created_at`

### B. Tabel Utama Arsip Nikah:
- `surat_counter`: Mengelola nomor urut surat satu pintu otomatis per tahun (`tahun`, `last_number`, `format_template`).
- `arsip_nikah`:
  - `id` (UUID / Primary Key)
  - `nomor_surat` (Indexed, format resmi per tahun)
  - `jenis_surat` (`N_MASUK`, `N_KELUAR`, `ISBAT`, `SURAT_WALI`, `PEMBATALAN`)
  - `tanggal_surat`, `tanggal_akad`, `tahun_arsip` (Indexed)
  - **Calon Suami**: `suami_nama`, `suami_nik`, `suami_desa`, `suami_kecamatan`, `suami_bin`
  - **Calon Istri**: `istri_nama`, `istri_nik`, `istri_desa`, `istri_kecamatan`, `istri_binti`
  - **Data Wali**: `wali_nama`, `wali_status`, `wali_hubungan`
  - **Lampiran Dokumen**: `lampiran_files` (JSON array berkas scan dari CMS/Storage)
  - **Status & Pembatalan**: `is_batal` (Boolean), `alasan_batal`, `catatan`
  - `created_by`, `updated_by`, `created_at`, `updated_at`

---

## 4. Desain Collections pada Payload CMS (Khusus Petugas)

Payload CMS difokuskan untuk mengelola aset dan dokumen pengarsipan:
1. **`document-templates`**: Menyimpan template kop surat, format baku N1-N7, format surat keterangan wali.
2. **`archive-media`**: Manajemen berkas scan dokumen warga (KTP, KK, Akta Lahir, Pengantar RT/RW).
3. **`village-sop`**: Pedoman alur persyaratan nikah untuk panduan kerja petugas desa.
4. **`officers`**: Data identitas & nomor SK petugas P3N aktif Desa Pelang Kidul.

---

## 5. Rencana Tahapan Eksekusi Migrasi (Phases)

- [x] **Fase 1: Setup Backend API & Database (Selesai)**: Drizzle ORM + MySQL Lokal + GraphQL Yoga + Auto Counter.
- [ ] **Fase 2: Setup Headless CMS (Payload CMS)**: Inisialisasi CMS di `apps/cms` untuk manajemen master template surat & berkas scan dokumen.
- [x] **Fase 3: Frontend Next.js + Tailwind (Selesai Awal)**: Dashboard kerja petugas, integrasi GraphQL mutation/query, sistem multi-tema.
- [ ] **Fase 4: Cetak Dokumen PDF Resmi & Integrasi Berkas Lampiran**: Cetak surat format resmi kop desa langsung dari aplikasi.
- [ ] **Fase 5: Migrasi ke Cloud (Opsional Saat Siap)**: Migrasi database dari MySQL ke PostgreSQL Supabase/Neon.
