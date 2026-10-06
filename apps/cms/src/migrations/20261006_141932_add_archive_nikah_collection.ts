import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`arsip_nikah\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`legacy_id\` text,
    \`nomor_surat\` text NOT NULL,
    \`nomor_urut\` numeric NOT NULL,
    \`jenis_surat\` text NOT NULL,
    \`tanggal_surat\` text NOT NULL,
    \`tanggal_akad\` text,
    \`tahun_arsip\` numeric NOT NULL,
    \`suami_nama\` text NOT NULL,
    \`suami_nik\` text,
    \`suami_bin\` text,
    \`suami_desa\` text,
    \`suami_kecamatan\` text,
    \`istri_nama\` text NOT NULL,
    \`istri_nik\` text,
    \`istri_binti\` text,
    \`istri_desa\` text,
    \`istri_kecamatan\` text,
    \`wali_nama\` text,
    \`wali_status\` text,
    \`wali_hubungan\` text,
    \`is_batal\` integer DEFAULT false,
    \`alasan_batal\` text,
    \`catatan\` text,
    \`lampiran_files\` text,
    \`created_by_id\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`);
  await db.run(sql`CREATE UNIQUE INDEX \`arsip_nikah_legacy_id_idx\` ON \`arsip_nikah\` (\`legacy_id\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`arsip_nikah_nomor_surat_idx\` ON \`arsip_nikah\` (\`nomor_surat\`);`);
  await db.run(sql`CREATE INDEX \`arsip_nikah_updated_at_idx\` ON \`arsip_nikah\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`arsip_nikah_created_at_idx\` ON \`arsip_nikah\` (\`created_at\`);`);
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`arsip_nikah_id\` integer REFERENCES \`arsip_nikah\`(\`id\`) ON UPDATE no action ON DELETE cascade;`);
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_arsip_nikah_id_idx\` ON \`payload_locked_documents_rels\` (\`arsip_nikah_id\`);`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`payload_locked_documents_rels_arsip_nikah_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`arsip_nikah_id\`;`);
  await db.run(sql`DROP INDEX \`arsip_nikah_legacy_id_idx\`;`);
  await db.run(sql`DROP INDEX \`arsip_nikah_nomor_surat_idx\`;`);
  await db.run(sql`DROP INDEX \`arsip_nikah_updated_at_idx\`;`);
  await db.run(sql`DROP INDEX \`arsip_nikah_created_at_idx\`;`);
  await db.run(sql`DROP TABLE \`arsip_nikah\`;`);
}
