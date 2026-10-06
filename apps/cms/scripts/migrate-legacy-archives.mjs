const cmsURL = (process.env.PAYLOAD_URL || 'http://localhost:3001').replace(/\/+$/, '');
const legacyGraphQLURL = process.env.LEGACY_GRAPHQL_URL || 'http://localhost:4000/graphql';
const adminEmail = process.env.PAYLOAD_ADMIN_EMAIL;
const adminPassword = process.env.PAYLOAD_ADMIN_PASSWORD;
const pageSize = 500;

if (!adminEmail || !adminPassword) {
  throw new Error('Set PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD before running the migration.');
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${url} failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

const login = await fetchJSON(`${cmsURL}/api/users/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});

if (!login.token) {
  throw new Error('Payload login did not return an access token.');
}

const authorization = `JWT ${login.token}`;

const legacyQuery = `
  query LegacyArchives($limit: Int!, $offset: Int!) {
    getArsipList(limit: $limit, offset: $offset) {
      totalCount
      items {
        id
        nomorSurat
        nomorUrut
        jenisSurat
        tanggalSurat
        tanggalAkad
        tahunArsip
        suamiNama
        suamiNik
        suamiBin
        suamiDesa
        suamiKecamatan
        istriNama
        istriNik
        istriBinti
        istriDesa
        istriKecamatan
        waliNama
        waliStatus
        waliHubungan
        isBatal
        alasanBatal
        catatan
        lampiranFiles {
          nama
          url
          tipe
          size
          uploadedAt
        }
        createdById
      }
    }
  }
`;

const legacyArchives = [];
let offset = 0;
let totalCount = 0;

do {
  const response = await fetchJSON(legacyGraphQLURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: legacyQuery,
      variables: { limit: pageSize, offset },
    }),
  });

  if (response.errors?.length) {
    throw new Error(`Legacy API query failed: ${response.errors[0].message}`);
  }

  const result = response.data?.getArsipList;
  if (!result || !Array.isArray(result.items)) {
    throw new Error('Legacy API returned an invalid archive list.');
  }

  totalCount = result.totalCount;
  legacyArchives.push(...result.items);
  offset += result.items.length;
  if (result.items.length === 0 && offset < totalCount) {
    throw new Error(`Legacy API returned no records at offset ${offset} of ${totalCount}.`);
  }
} while (offset < totalCount);

const existingLegacyIds = new Set();
let page = 1;
let totalPages = 1;

do {
  const url = new URL(`${cmsURL}/api/arsip-nikah`);
  url.searchParams.set('limit', String(pageSize));
  url.searchParams.set('page', String(page));
  url.searchParams.set('depth', '0');
  url.searchParams.set('select[legacyId]', 'true');

  const result = await fetchJSON(url, {
    headers: { Authorization: authorization },
  });
  totalPages = result.totalPages || 1;

  for (const archive of result.docs || []) {
    if (archive.legacyId) existingLegacyIds.add(String(archive.legacyId));
  }
  page += 1;
} while (page <= totalPages);

let imported = 0;
let skipped = 0;

for (const archive of legacyArchives) {
  if (!archive.id) {
    throw new Error('Legacy API returned an archive without an ID; migration stopped.');
  }

  const legacyId = String(archive.id);
  if (existingLegacyIds.has(legacyId)) {
    skipped += 1;
    continue;
  }

  if (!archive.nomorSurat || !archive.jenisSurat || !archive.tanggalSurat || !archive.suamiNama || !archive.istriNama) {
    throw new Error(`Legacy archive ${legacyId} is missing a required value; no further records were imported.`);
  }

  const payload = {
    legacyId,
    nomorSurat: archive.nomorSurat,
    nomorUrut: Number(archive.nomorUrut) || 0,
    jenisSurat: archive.jenisSurat,
    tanggalSurat: archive.tanggalSurat,
    tanggalAkad: archive.tanggalAkad || undefined,
    tahunArsip: Number(archive.tahunArsip) || new Date(archive.tanggalSurat).getFullYear(),
    suamiNama: archive.suamiNama,
    suamiNik: archive.suamiNik || undefined,
    suamiBin: archive.suamiBin || undefined,
    suamiDesa: archive.suamiDesa || undefined,
    suamiKecamatan: archive.suamiKecamatan || undefined,
    istriNama: archive.istriNama,
    istriNik: archive.istriNik || undefined,
    istriBinti: archive.istriBinti || undefined,
    istriDesa: archive.istriDesa || undefined,
    istriKecamatan: archive.istriKecamatan || undefined,
    waliNama: archive.waliNama || undefined,
    waliStatus: archive.waliStatus || undefined,
    waliHubungan: archive.waliHubungan || undefined,
    isBatal: archive.isBatal === 'true',
    alasanBatal: archive.alasanBatal || undefined,
    catatan: archive.catatan || undefined,
    lampiranFiles: archive.lampiranFiles || undefined,
    createdById: archive.createdById || undefined,
  };

  await fetchJSON(`${cmsURL}/api/arsip-nikah`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  existingLegacyIds.add(legacyId);
  imported += 1;
}

console.log(`Migration completed. Imported ${imported} of ${legacyArchives.length} archives; skipped ${skipped} already-imported records.`);
