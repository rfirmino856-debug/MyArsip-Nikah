# 🏛️ MyArsip Nikah - Desa Pelang Kidul

Sistem Pengarsipan dan Administrasi Pernikahan Digital untuk **Desa Pelang Kidul**.  
Aplikasi ini dirancang untuk mendigitalkan, menertibkan nomor surat satu pintu, dan mempermudah pencarian arsip pernikahan (N Masuk, N Keluar, Isbat Nikah, Surat Wali, dan Pembatalan Nikah).

---

## 📂 Struktur Proyek

```text
MyArsip-Nikah/
├── apps/
│   ├── api/                    # 🚀 Backend API (GraphQL Yoga + Drizzle ORM + MySQL)
│   │   ├── src/
│   │   │   ├── db/             # Skema tabel & koneksi database Drizzle
│   │   │   ├── graphql/        # TypeDefs & Resolvers GraphQL
│   │   │   └── index.ts        # Entry point server GraphQL
│   │   ├── drizzle/            # File migrasi SQL otomatis
│   │   ├── .env.example        # Template konfigurasi environment API
│   │   └── package.json
│   ├── web/                    # 💻 Frontend Next.js + Tailwind (Fase 3)
│   └── cms/                    # 📦 Headless CMS Payload (Fase 2)
│
├── css/                        # Stylesheet antarmuka versi prototype
├── js/                         # Script client-side versi prototype
│   ├── app.js
│   └── config.js
├── index.html                  # Antarmuka web prototype (aktif saat ini)
├── server.js                   # Web server lokal Node.js ringan (Port 3000)
├── MIGRATION_PLAN.md           # Dokumen arsitektur & rencana migrasi modern stack
└── README.md                   # Panduan instalasi dan menjalankan aplikasi
```

---

## 🛠️ Prasyarat Sistem

Sebelum memulai instalasi, pastikan sistem Anda sudah terpasang:
1. **Node.js** (Versi 18+ atau yang lebih baru, direkomendasikan v20+)
2. **MySQL Server** (Aktif di port `3306`, misalnya via XAMPP, Laragon, atau MySQL Installer)
3. **Git**

---

## 🚀 Panduan Menjalankan Aplikasi

Aplikasi memiliki dua mode yang dapat dijalankan:

### 1. Menjalankan Frontend Prototype (Port 3000)
Halaman web statis siap pakai yang langsung dapat diakses di browser:

```bash
# Jalankan server lokal dari root direktori proyek
node server.js
```
- Buka browser di: **[http://localhost:3000](http://localhost:3000)**
- **Kredensial Login Demo:**
  - Email / Username: `admin@myarsipnikah.id` (atau cukup ketik `admin`)
  - Password: `admin123`

---

### 2. Menjalankan Backend API GraphQL & Drizzle ORM (Port 4000)
Backend modern yang terhubung ke database **MySQL lokal**:

#### Langkah A: Masuk ke folder API
```bash
cd apps/api
```

#### Langkah B: Install Dependensi
```bash
npm install
```

#### Langkah C: Konfigurasi Environment (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
# Windows PowerShell:
Copy-Item .env.example .env

# Atau salin manual:
cp .env.example .env
```
Sesuaikan isi kredensial MySQL Anda di file `.env`:
```env
DATABASE_URL="mysql://root:root@localhost:3306/myarsip_nikah"
PORT=4000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_myarsip_nikah_pelang_kidul_2026_key
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"
```

#### Langkah D: Migrasi Database
Jalankan migrasi Drizzle untuk membuat database dan tabel otomatis di MySQL:
```bash
npm run db:migrate
```
*(Tabel `arsip_nikah`, `surat_counter`, `users`, dan `audit_logs` akan otomatis terbentuk di MySQL).*

#### Langkah E: Jalankan Server API
```bash
npm run dev
```
- Server API aktif di: **[http://localhost:4000/graphql](http://localhost:4000/graphql)**
- Buka tautan tersebut di browser untuk mengakses antarmuka interaktif **GraphiQL**.

---

## 🧪 Contoh Pengujian GraphQL (GraphiQL)

Anda dapat mencoba Query dan Mutation langsung pada GraphiQL di `http://localhost:4000/graphql`:

### ➕ Tambah Data Arsip Nikah (Mutation)
```graphql
mutation {
  createArsip(input: {
    jenisSurat: N_MASUK
    tanggalSurat: "2026-10-06"
    suamiNama: "Ahmad Dahlan"
    suamiNik: "3521012345670001"
    suamiBin: "Mansyur"
    suamiDesa: "Pelang Kidul"
    istriNama: "Fatimah Azzahra"
    istriNik: "3521012345670002"
    istriBinti: "Zainuddin"
    istriDesa: "Pelang Kidul"
    waliNama: "Zainuddin"
    waliStatus: "Nasab"
    waliHubungan: "Ayah Kandung"
  }) {
    id
    nomorSurat
    nomorUrut
    suamiNama
    istriNama
    tahunArsip
  }
}
```

### 🔍 Ambil Daftar Arsip & Rekap Folder (Query)
```graphql
query {
  getArsipList(limit: 10) {
    totalCount
    items {
      nomorSurat
      jenisSurat
      suamiNama
      istriNama
      tanggalSurat
    }
  }
  getCabinetFolders {
    tahun
    count
  }
}
```

---

## 📋 Roadmap & Isu Pengembangan

Dokumen perencanaan dan pelacakan migrasi dapat dilihat pada:
- **Dokumen Teknis:** [MIGRATION_PLAN.md](MIGRATION_PLAN.md)
- **GitHub Issues:**
  - [#1 [EPIC] Rencana Migrasi Modern Stack](https://github.com/rfirmino856-debug/MyArsip-Nikah/issues/1)
  - [#2 Fase 1: Setup Backend API & Database (Selesai)](https://github.com/rfirmino856-debug/MyArsip-Nikah/issues/2)
  - [#3 Fase 2: Setup Headless CMS Payload](https://github.com/rfirmino856-debug/MyArsip-Nikah/issues/3)
  - [#4 Fase 3: Frontend Next.js + Tailwind CSS](https://github.com/rfirmino856-debug/MyArsip-Nikah/issues/4)
  - [#5 Fase 4: Migrasi Data & Cetak PDF Resmi](https://github.com/rfirmino856-debug/MyArsip-Nikah/issues/5)

---

## 📄 Lisensi
Hak Cipta © 2026.
