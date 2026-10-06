import { CollectionConfig } from 'payload';

export const MediaFiles: CollectionConfig = {
  slug: 'media-arsip',
  labels: {
    singular: 'Berkas Scan Dokumen',
    plural: 'Berkas Scan Dokumen',
  },
  admin: {
    useAsTitle: 'alt',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user), // Khusus internal petugas terotentikasi
  },
  upload: {
    staticDir: 'media-storage',
    mimeTypes: ['image/*', 'application/pdf'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Keterangan Berkas (Contoh: Scan KTP Suami / KK Istri)',
      required: true,
    },
    {
      name: 'nomorSuratTerkait',
      type: 'text',
      label: 'Nomor Surat Terkait (Contoh: 474.2 / 001 / 2026)',
    },
    {
      name: 'kategori',
      type: 'select',
      label: 'Jenis Berkas',
      options: [
        { label: 'KTP Calon Pengantin', value: 'KTP' },
        { label: 'Kartu Keluarga (KK)', value: 'KK' },
        { label: 'Akta Kelahiran', value: 'AKTA' },
        { label: 'Surat Pengantar RT/RW (N1-N4)', value: 'PENGANTAR' },
        { label: 'Surat Keterangan Wali', value: 'SURAT_WALI' },
        { label: 'Buku Nikah / Putusan Pengadilan', value: 'LEGALITAS' },
      ],
      defaultValue: 'PENGANTAR',
    },
  ],
};
