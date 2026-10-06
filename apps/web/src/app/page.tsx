import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  FileText,
  Files,
  FolderArchive,
  Send,
  UserRoundCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const ARCHIVE_TYPES = [
  { key: 'N_MASUK', label: 'N Masuk', icon: FileText },
  { key: 'N_KELUAR', label: 'N Keluar', icon: Send },
  { key: 'ISBAT', label: 'Isbat Nikah', icon: BookOpen },
  { key: 'SURAT_WALI', label: 'Surat Wali', icon: UserRoundCheck },
  { key: 'PEMBATALAN', label: 'Pembatalan', icon: XCircle },
] as const satisfies ReadonlyArray<{
  key: keyof ArchiveStats['byType'];
  label: string;
  icon: LucideIcon;
}>;

type ArchiveStats = {
  total: number;
  canceled: number;
  byType: Record<'N_MASUK' | 'N_KELUAR' | 'ISBAT' | 'SURAT_WALI' | 'PEMBATALAN', number>;
  byYear: Array<{ year: number; count: number }>;
  generatedAt: string;
};

function isArchiveStats(value: unknown): value is ArchiveStats {
  if (!value || typeof value !== 'object') return false;
  const stats = value as Partial<ArchiveStats>;

  return (
    typeof stats.total === 'number' &&
    typeof stats.canceled === 'number' &&
    typeof stats.generatedAt === 'string' &&
    Boolean(stats.byType && typeof stats.byType === 'object') &&
    Array.isArray(stats.byYear) &&
    stats.byYear.every(
      (item) =>
        item &&
        typeof item.year === 'number' &&
        typeof item.count === 'number',
    )
  );
}

async function loadArchiveStats(): Promise<{ stats?: ArchiveStats; error?: string }> {
  const cmsURL = (process.env.PAYLOAD_URL || process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3001')
    .replace(/\/+$/, '');

  try {
    const response = await fetch(`${cmsURL}/api/public/stats`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`CMS merespons dengan status ${response.status}.`);
    }

    const result: unknown = await response.json();
    if (!isArchiveStats(result)) {
      throw new Error('Format statistik yang diterima dari CMS tidak sesuai.');
    }

    return { stats: result };
  } catch (error) {
    console.error('Gagal memuat statistik arsip dari Payload CMS:', error);
    return {
      error: error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.',
    };
  }
}

const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);

export default async function DashboardPage() {
  const { stats, error } = await loadArchiveStats();
  const cmsAdminURL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3001/admin';
  const latestYear = stats?.byYear[0];
  const highestYearCount = Math.max(1, ...(stats?.byYear.map(({ count }) => count) ?? []));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
              Desa Pelang Kidul
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Statistik Arsip Nikah
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Ringkasan data arsip. Penambahan, perubahan, dan penghapusan arsip dikelola melalui Payload CMS.
            </p>
          </div>
          <a
            href={cmsAdminURL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:self-auto"
          >
            Buka CMS
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </a>
        </header>

        {error ? (
          <section
            aria-live="polite"
            className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950"
          >
            <h2 className="font-semibold">Statistik belum dapat dimuat</h2>
            <p className="mt-1 text-sm">
              Pastikan Payload CMS berjalan dan URL CMS telah dikonfigurasi dengan benar. {error}
            </p>
          </section>
        ) : stats ? (
          <>
            <section aria-label="Ringkasan utama" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard
                label="Total arsip"
                value={stats.total}
                detail="Seluruh arsip yang tercatat"
                icon={Files}
                accent="teal"
              />
              <SummaryCard
                label="Tahun terbaru"
                value={latestYear ? formatNumber(latestYear.count) : '—'}
                detail={latestYear ? `Arsip pada tahun ${latestYear.year}` : 'Belum ada arsip'}
                icon={CalendarDays}
                accent="blue"
              />
              <SummaryCard
                label="Arsip dibatalkan"
                value={stats.canceled}
                detail="Termasuk surat jenis pembatalan"
                icon={XCircle}
                accent="amber"
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5">
                  <h2 className="text-lg font-bold">Arsip per jenis surat</h2>
                  <p className="mt-1 text-sm text-slate-500">Jumlah keseluruhan menurut kategori</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {ARCHIVE_TYPES.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                          <Icon aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <span className="truncate text-sm font-medium text-slate-700">{label}</span>
                      </div>
                      <span className="text-lg font-bold tabular-nums">{formatNumber(stats.byType[key] ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                    <FolderArchive aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold">Arsip per tahun</h2>
                    <p className="text-sm text-slate-500">Distribusi jumlah dokumen</p>
                  </div>
                </div>
                {stats.byYear.length ? (
                  <ul className="space-y-4">
                    {stats.byYear.map(({ year, count }) => (
                      <li key={year}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{year}</span>
                          <span className="tabular-nums text-slate-500">{formatNumber(count)}</span>
                        </div>
                        <div
                          className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                          role="img"
                          aria-label={`${count} arsip pada tahun ${year}`}
                        >
                          <div
                            className="h-full rounded-full bg-teal-600"
                            style={{ width: `${Math.max(2, (count / highestYearCount) * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    Belum ada data arsip per tahun.
                  </p>
                )}
              </div>
            </section>

            <p className="text-right text-xs text-slate-400">
              Statistik diperbarui {new Date(stats.generatedAt).toLocaleString('id-ID')}
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
  accent: 'teal' | 'blue' | 'amber';
}) {
  const accents = {
    teal: 'bg-teal-50 text-teal-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{typeof value === 'number' ? formatNumber(value) : value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${accents[accent]}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}
