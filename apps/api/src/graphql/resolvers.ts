import { db } from '../db/index.js';
import { arsipNikah } from '../db/schema.js';
import { eq, desc, and, or, like, sql as dSql } from 'drizzle-orm';

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
};
