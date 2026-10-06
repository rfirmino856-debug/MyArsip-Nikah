import { db } from '../db/index.js';
import { arsipNikah, suratCounter, auditLogs } from '../db/schema.js';
import { eq, desc, and, or, like, sql as dSql } from 'drizzle-orm';
import crypto from 'crypto';

export const resolvers = {
  Query: {
    getArsipList: async (_: unknown, args: {
      jenis?: 'N_MASUK' | 'N_KELUAR' | 'ISBAT' | 'SURAT_WALI' | 'PEMBATALAN';
      tahun?: number;
      search?: string;
      limit?: number;
      offset?: number;
    }) => {
      const limit = args.limit || 20;
      const offset = args.offset || 0;
      const conditions = [];

      if (args.jenis) {
        conditions.push(eq(arsipNikah.jenisSurat, args.jenis));
      }
      if (args.tahun) {
        conditions.push(eq(arsipNikah.tahunArsip, args.tahun));
      }
      if (args.search && args.search.trim()) {
        const q = `%${args.search.trim()}%`;
        conditions.push(
          or(
            like(arsipNikah.nomorSurat, q),
            like(arsipNikah.suamiNama, q),
            like(arsipNikah.istriNama, q),
            like(arsipNikah.suamiNik, q),
            like(arsipNikah.istriNik, q)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select()
        .from(arsipNikah)
        .where(whereClause)
        .orderBy(desc(arsipNikah.nomorUrut), desc(arsipNikah.createdAt))
        .limit(limit)
        .offset(offset);

      const totalResult = await db
        .select({ count: dSql<number>`count(*)` })
        .from(arsipNikah)
        .where(whereClause);

      const totalCount = Number(totalResult[0]?.count || 0);

      return {
        items,
        totalCount,
        hasMore: offset + items.length < totalCount,
      };
    },

    getArsipById: async (_: unknown, { id }: { id: string }) => {
      const result = await db.select().from(arsipNikah).where(eq(arsipNikah.id, id));
      return result[0] || null;
    },

    getYearlyReport: async (_: unknown, { tahun }: { tahun: number }) => {
      const list = await db
        .select()
        .from(arsipNikah)
        .where(eq(arsipNikah.tahunArsip, tahun));

      return {
        tahun,
        totalSurat: list.length,
        totalNMasuk: list.filter((x) => x.jenisSurat === 'N_MASUK').length,
        totalNKeluar: list.filter((x) => x.jenisSurat === 'N_KELUAR').length,
        totalIsbat: list.filter((x) => x.jenisSurat === 'ISBAT').length,
        totalWali: list.filter((x) => x.jenisSurat === 'SURAT_WALI').length,
        totalBatal: list.filter((x) => x.isBatal === 'true' || x.jenisSurat === 'PEMBATALAN').length,
      };
    },

    getCabinetFolders: async () => {
      const rows = await db
        .select({
          tahun: arsipNikah.tahunArsip,
          count: dSql<number>`count(*)`,
        })
        .from(arsipNikah)
        .groupBy(arsipNikah.tahunArsip)
        .orderBy(desc(arsipNikah.tahunArsip));

      return rows.map((r) => ({
        tahun: Number(r.tahun),
        count: Number(r.count),
      }));
    },
  },

  Mutation: {
    createArsip: async (_: unknown, { input }: { input: any }) => {
      const tahun = input.tahunArsip || (input.tanggalSurat ? new Date(input.tanggalSurat).getFullYear() : new Date().getFullYear());

      // 1. Transaction Atomic Surat Counter
      let nextNumber = 1;
      const counterRow = await db.select().from(suratCounter).where(eq(suratCounter.tahun, tahun));

      if (counterRow.length === 0) {
        await db.insert(suratCounter).values({
          id: crypto.randomUUID(),
          tahun,
          lastNumber: 1
        });
        nextNumber = 1;
      } else {
        nextNumber = counterRow[0].lastNumber + 1;
        await db
          .update(suratCounter)
          .set({ lastNumber: nextNumber, updatedAt: new Date() })
          .where(eq(suratCounter.tahun, tahun));
      }

      const formattedNumber = String(nextNumber).padStart(3, '0');
      const nomorSurat = `474.2 / ${formattedNumber} / ${tahun}`;
      const newId = crypto.randomUUID();

      // 2. Insert Arsip Nikah (MySQL syntax compatible)
      await db.insert(arsipNikah).values({
        ...input,
        id: newId,
        nomorSurat,
        nomorUrut: nextNumber,
        tahunArsip: tahun,
        isBatal: 'false',
      });

      const [newRecord] = await db.select().from(arsipNikah).where(eq(arsipNikah.id, newId));

      // 3. Log Audit
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        action: 'CREATE',
        entityType: 'ARSIP_NIKAH',
        entityId: newId,
        changesJson: { nomorSurat, jenis: input.jenisSurat, suami: input.suamiNama, istri: input.istriNama },
      });

      return newRecord;
    },

    updateArsip: async (_: unknown, { id, input }: { id: string; input: any }) => {
      await db
        .update(arsipNikah)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(arsipNikah.id, id));

      const [updated] = await db.select().from(arsipNikah).where(eq(arsipNikah.id, id));

      if (updated) {
        await db.insert(auditLogs).values({
          id: crypto.randomUUID(),
          action: 'UPDATE',
          entityType: 'ARSIP_NIKAH',
          entityId: updated.id,
          changesJson: input,
        });
      }

      return updated;
    },

    deleteArsip: async (_: unknown, { id, alasan }: { id: string; alasan?: string }) => {
      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        action: 'DELETE',
        entityType: 'ARSIP_NIKAH',
        entityId: id,
        changesJson: { alasan: alasan || 'Dihapus oleh admin' },
      });

      await db.delete(arsipNikah).where(eq(arsipNikah.id, id));
      return true;
    },

    markAsBatal: async (_: unknown, { id, alasan }: { id: string; alasan: string }) => {
      await db
        .update(arsipNikah)
        .set({
          isBatal: 'true',
          alasanBatal: alasan,
          updatedAt: new Date(),
        })
        .where(eq(arsipNikah.id, id));

      const [updated] = await db.select().from(arsipNikah).where(eq(arsipNikah.id, id));

      await db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        action: 'CANCEL',
        entityType: 'ARSIP_NIKAH',
        entityId: updated.id,
        changesJson: { alasan },
      });

      return updated;
    },
  },
};
