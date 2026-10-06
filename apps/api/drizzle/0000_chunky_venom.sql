CREATE TABLE `arsip_nikah` (
	`id` varchar(36) NOT NULL,
	`nomor_surat` varchar(100) NOT NULL,
	`nomor_urut` int NOT NULL,
	`jenis_surat` enum('N_MASUK','N_KELUAR','ISBAT','SURAT_WALI','PEMBATALAN') NOT NULL,
	`tanggal_surat` varchar(30) NOT NULL,
	`tanggal_akad` varchar(30),
	`tahun_arsip` int NOT NULL,
	`suami_nama` varchar(255) NOT NULL,
	`suami_nik` varchar(20),
	`suami_bin` varchar(255),
	`suami_desa` varchar(150),
	`suami_kecamatan` varchar(150),
	`istri_nama` varchar(255) NOT NULL,
	`istri_nik` varchar(20),
	`istri_binti` varchar(255),
	`istri_desa` varchar(150),
	`istri_kecamatan` varchar(150),
	`wali_nama` varchar(255),
	`wali_status` varchar(100),
	`wali_hubungan` varchar(100),
	`is_batal` varchar(10) NOT NULL DEFAULT 'false',
	`alasan_batal` text,
	`catatan` text,
	`lampiran_files` json DEFAULT ('[]'),
	`created_by_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `arsip_nikah_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`user_name` varchar(255),
	`action` varchar(50) NOT NULL,
	`entity_type` varchar(50) NOT NULL DEFAULT 'ARSIP_NIKAH',
	`entity_id` varchar(36),
	`changes_json` json,
	`ip_address` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surat_counter` (
	`id` varchar(36) NOT NULL,
	`tahun` int NOT NULL,
	`last_number` int NOT NULL DEFAULT 0,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surat_counter_id` PRIMARY KEY(`id`),
	CONSTRAINT `surat_counter_tahun_unique` UNIQUE(`tahun`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`username` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` text NOT NULL,
	`role` enum('SUPERADMIN','P3N','VIEWER') NOT NULL DEFAULT 'P3N',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
