import type { Endpoint } from 'payload';

const ARCHIVE_TYPES = ['N_MASUK', 'N_KELUAR', 'ISBAT', 'SURAT_WALI', 'PEMBATALAN'] as const;

export const publicArchiveStats: Endpoint = {
  path: '/public/stats',
  method: 'get',
  handler: async (req) => {
    const stats = {
      total: 0,
      canceled: 0,
      byType: Object.fromEntries(ARCHIVE_TYPES.map((type) => [type, 0])) as Record<
        (typeof ARCHIVE_TYPES)[number],
        number
      >,
      byYear: {} as Record<string, number>,
    };

    let page = 1;
    let totalPages = 1;

    do {
      const result = await req.payload.find({
        collection: 'arsip-nikah',
        depth: 0,
        limit: 1000,
        page,
        pagination: true,
        overrideAccess: true,
        select: {
          jenisSurat: true,
          tahunArsip: true,
          isBatal: true,
        },
      });

      totalPages = result.totalPages;

      for (const archive of result.docs) {
        stats.total += 1;
        if (archive.isBatal || archive.jenisSurat === 'PEMBATALAN') {
          stats.canceled += 1;
        }
        const archiveType = ARCHIVE_TYPES.find((type) => type === archive.jenisSurat);
        if (archiveType) {
          stats.byType[archiveType] += 1;
        }
        if (archive.tahunArsip) {
          const year = String(archive.tahunArsip);
          stats.byYear[year] = (stats.byYear[year] ?? 0) + 1;
        }
      }

      page += 1;
    } while (page <= totalPages);

    const byYear = Object.entries(stats.byYear)
      .map(([year, count]) => ({ year: Number(year), count }))
      .sort((a, b) => b.year - a.year);

    return Response.json({
      total: stats.total,
      canceled: stats.canceled,
      byType: stats.byType,
      byYear,
      generatedAt: new Date().toISOString(),
    });
  },
};
