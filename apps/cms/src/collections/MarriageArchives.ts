import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload';

const assignArchiveNumber: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (!data || operation !== 'create' || (data.nomorSurat && data.nomorUrut)) return data;

  const dateYear = data.tanggalSurat ? new Date(String(data.tanggalSurat)).getFullYear() : Number.NaN;
  const year = Number(data.tahunArsip) || dateYear;
  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    throw new Error('Tanggal surat atau tahun arsip tidak valid untuk membuat nomor surat.');
  }

  const { docs } = await req.payload.find({
    collection: 'arsip-nikah',
    where: { tahunArsip: { equals: year } },
    sort: '-nomorUrut',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    select: { nomorUrut: true },
  });
  const nextNumber = (Number(docs[0]?.nomorUrut) || 0) + 1;

  return {
    ...data,
    tahunArsip: year,
    nomorUrut: nextNumber,
    nomorSurat: `474.2 / ${String(nextNumber).padStart(3, '0')} / ${year}`,
  };
};

export const MarriageArchives: CollectionConfig = {
  slug: 'arsip-nikah',
  labels: {
    singular: 'Arsip Nikah',
    plural: 'Arsip Nikah',
  },
  admin: {
    useAsTitle: 'nomorSurat',
    defaultColumns: ['nomorSurat', 'jenisSurat', 'tanggalSurat', 'suamiNama', 'istriNama'],
    group: 'Data Arsip',
  },
  hooks: {
    beforeChange: [assignArchiveNumber],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'legacyId',
      type: 'text',
      unique: true,
      admin: { hidden: true },
    },
    {
      name: 'nomorSurat',
      type: 'text',
      label: 'Nomor Surat',
      required: true,
      unique: true,
      admin: { readOnly: true },
    },
    {
      name: 'nomorUrut',
      type: 'number',
      label: 'Nomor Urut',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'jenisSurat',
      type: 'select',
      label: 'Jenis Surat',
      required: true,
      options: [
        { label: 'N Masuk', value: 'N_MASUK' },
        { label: 'N Keluar', value: 'N_KELUAR' },
        { label: 'Isbat Nikah', value: 'ISBAT' },
        { label: 'Surat Wali', value: 'SURAT_WALI' },
        { label: 'Pembatalan', value: 'PEMBATALAN' },
      ],
    },
    {
      name: 'tanggalSurat',
      type: 'text',
      label: 'Tanggal Surat',
      required: true,
    },
    {
      name: 'tanggalAkad',
      type: 'text',
      label: 'Tanggal Akad',
    },
    {
      name: 'tahunArsip',
      type: 'number',
      label: 'Tahun Arsip',
      required: true,
    },
    {
      name: 'suamiNama',
      type: 'text',
      label: 'Nama Calon Suami',
      required: true,
    },
    {
      name: 'suamiNik',
      type: 'text',
      label: 'NIK Calon Suami',
    },
    {
      name: 'suamiBin',
      type: 'text',
      label: 'Bin',
    },
    {
      name: 'suamiDesa',
      type: 'text',
      label: 'Desa Calon Suami',
    },
    {
      name: 'suamiKecamatan',
      type: 'text',
      label: 'Kecamatan Calon Suami',
    },
    {
      name: 'istriNama',
      type: 'text',
      label: 'Nama Calon Istri',
      required: true,
    },
    {
      name: 'istriNik',
      type: 'text',
      label: 'NIK Calon Istri',
    },
    {
      name: 'istriBinti',
      type: 'text',
      label: 'Binti',
    },
    {
      name: 'istriDesa',
      type: 'text',
      label: 'Desa Calon Istri',
    },
    {
      name: 'istriKecamatan',
      type: 'text',
      label: 'Kecamatan Calon Istri',
    },
    {
      name: 'waliNama',
      type: 'text',
      label: 'Nama Wali',
    },
    {
      name: 'waliStatus',
      type: 'text',
      label: 'Status Wali',
    },
    {
      name: 'waliHubungan',
      type: 'text',
      label: 'Hubungan dengan Wali',
    },
    {
      name: 'isBatal',
      type: 'checkbox',
      label: 'Surat Dibatalkan',
      defaultValue: false,
    },
    {
      name: 'alasanBatal',
      type: 'textarea',
      label: 'Alasan Pembatalan',
    },
    {
      name: 'catatan',
      type: 'textarea',
      label: 'Catatan',
    },
    {
      name: 'lampiranFiles',
      type: 'json',
      label: 'Data Lampiran',
    },
    {
      name: 'createdById',
      type: 'text',
      label: 'ID Pembuat Lama',
      admin: { hidden: true },
    },
  ],
};
