import { CollectionConfig } from 'payload';

export const DocumentTemplates: CollectionConfig = {
  slug: 'template-surat',
  labels: {
    singular: 'Format & Template Surat',
    plural: 'Format & Template Surat',
  },
  admin: {
    useAsTitle: 'namaSurat',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user), // Khusus internal petugas
  },
  fields: [
    {
      name: 'namaSurat',
      type: 'text',
      label: 'Nama Jenis Surat (Contoh: Surat Pengantar N1, Surat Rekomendasi Nikah N Keluar)',
      required: true,
    },
    {
      name: 'kodeSurat',
      type: 'text',
      label: 'Kode Klasifikasi (Contoh: 474.2)',
      defaultValue: '474.2',
      required: true,
    },
    {
      name: 'kopSurat',
      type: 'textarea',
      label: 'Header / Kop Resmi Surat',
      defaultValue: 'PEMERINTAH KABUPATEN NGAWI\nKECAMATAN KEDUNGGALAR\nKANTOR KEPALA DESA PELANG KIDUL',
    },
    {
      name: 'persyaratanDokumen',
      type: 'textarea',
      label: 'Daftar Syarat Berkas yang Wajib Dipenuhi Warga',
    },
    {
      name: 'pejabatPenandatangan',
      type: 'text',
      label: 'Jabatan Penandatangan Standar (Contoh: Kepala Desa Pelang Kidul / Petugas P3N)',
      defaultValue: 'Kepala Desa Pelang Kidul',
    },
  ],
};
