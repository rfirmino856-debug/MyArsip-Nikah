import { buildConfig } from 'payload';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { MediaFiles } from './collections/MediaFiles';
import { DocumentTemplates } from './collections/DocumentTemplates';
import path from 'path';

export default buildConfig({
  admin: {
    user: 'users',
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
  ],
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
