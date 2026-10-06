import { buildConfig } from 'payload';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { MediaFiles } from './collections/MediaFiles';
import { DocumentTemplates } from './collections/DocumentTemplates';
import { MarriageArchives } from './collections/MarriageArchives';
import { publicArchiveStats } from './endpoints/publicArchiveStats';
import path from 'path';

export default buildConfig({
  admin: {
    user: 'users',
    meta: {
      titleSuffix: ' | MyArsip Nikah',
    },
    components: {
      beforeDashboard: ['@/components/AdminWelcome#AdminWelcome'],
      graphics: {
        Icon: '@/components/AdminBrand#AdminBrandIcon',
        Logo: '@/components/AdminBrand#AdminBrandLogo',
      },
    },
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      labels: {
        singular: 'Akun Petugas',
        plural: 'Akun Petugas',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Nama Petugas',
          required: true,
        },
      ],
    },
    MediaFiles,
    DocumentTemplates,
    MarriageArchives,
  ],
  endpoints: [publicArchiveStats],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'super_secret_payload_cms_pelang_kidul_2026',
  typescript: {
    outputFile: path.resolve(process.cwd(), 'src/payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./cms-storage.db',
    },
  }),
});
