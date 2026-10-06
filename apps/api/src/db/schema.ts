import { mysqlTable, varchar, text, int, timestamp, json, mysqlEnum } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// 1. Enum Peran Pengguna (RBAC)
export const userRoleEnum = ['SUPERADMIN', 'P3N', 'VIEWER'] as const;

// 2. Enum Jenis Surat Nikah
export const jenisSuratEnum = [
  'N_MASUK',
  'N_KELUAR',
  'ISBAT',
  'SURAT_WALI',
  'PEMBATALAN'
] as const;

// 3. Tabel Users
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: mysqlEnum('role', userRoleEnum).default('P3N').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// 4. Tabel Surat Counter (Penomoran Surat Satu Pintu Atomik)
export const suratCounter = mysqlTable('surat_counter', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tahun: int('tahun').unique().notNull(),
  lastNumber: int('last_number').default(0).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// 5. Tabel Utama Arsip Dokumen Nikah
export const arsipNikah = mysqlTable('arsip_nikah', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  nomorSurat: varchar('nomor_surat', { length: 100 }).notNull(), // Format: 474.2 / XXX / 2026
  nomorUrut: int('nomor_urut').notNull(),
  jenisSurat: mysqlEnum('jenis_surat', jenisSuratEnum).notNull(),
  tanggalSurat: varchar('tanggal_surat', { length: 30 }).notNull(), // YYYY-MM-DD
  tanggalAkad: varchar('tanggal_akad', { length: 30 }),             // YYYY-MM-DD
  tahunArsip: int('tahun_arsip').notNull(),

  // Data Calon Suami
  suamiNama: varchar('suami_nama', { length: 255 }).notNull(),
  suamiNik: varchar('suami_nik', { length: 20 }),
  suamiBin: varchar('suami_bin', { length: 255 }),
  suamiDesa: varchar('suami_desa', { length: 150 }),
  suamiKecamatan: varchar('suami_kecamatan', { length: 150 }),

  // Data Calon Istri
  istriNama: varchar('istri_nama', { length: 255 }).notNull(),
  istriNik: varchar('istri_nik', { length: 20 }),
  istriBinti: varchar('istri_binti', { length: 255 }),
  istriDesa: varchar('istri_desa', { length: 150 }),
  istriKecamatan: varchar('istri_kecamatan', { length: 150 }),

  // Data Wali (N Masuk / Surat Wali)
  waliNama: varchar('wali_nama', { length: 255 }),
  waliStatus: varchar('wali_status', { length: 100 }), // Misal: Nasab / Hakim
  waliHubungan: varchar('wali_hubungan', { length: 100 }), // Misal: Ayah Kandung, Kakak

  // Detail Tambahan & Pembatalan
  isBatal: varchar('is_batal', { length: 10 }).default('false').notNull(),
  alasanBatal: text('alasan_batal'),
  catatan: text('catatan'),

  // Lampiran Cloud Document (Scan KTP, KK, Pengantar, Buku Nikah)
  lampiranFiles: json('lampiran_files').$type<Array<{
    nama: string;
    url: string;
    tipe: string;
    size?: number;
    uploadedAt: string;
  }>>().default([]),

  // Audit Author
  createdById: varchar('created_by_id', { length: 36 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// 6. Tabel Audit Trail (Jejak Perubahan Hukum Arsip)
export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id', { length: 36 }),
  userName: varchar('user_name', { length: 255 }),
  action: varchar('action', { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, CANCEL
  entityType: varchar('entity_type', { length: 50 }).default('ARSIP_NIKAH').notNull(),
  entityId: varchar('entity_id', { length: 36 }),
  changesJson: json('changes_json'),
  ipAddress: varchar('ip_address', { length: 100 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// TypeScript Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ArsipNikah = typeof arsipNikah.$inferSelect;
export type NewArsipNikah = typeof arsipNikah.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
