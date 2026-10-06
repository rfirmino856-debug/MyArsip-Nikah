export const typeDefs = /* GraphQL */ `
  enum UserRole {
    SUPERADMIN
    P3N
    VIEWER
  }

  enum JenisSurat {
    N_MASUK
    N_KELUAR
    ISBAT
    SURAT_WALI
    PEMBATALAN
  }

  type User {
    id: ID!
    name: String!
    username: String!
    email: String!
    role: UserRole!
    createdAt: String!
  }

  type LampiranFile {
    nama: String!
    url: String!
    tipe: String!
    size: Int
    uploadedAt: String
  }

  type ArsipNikah {
    id: ID!
    nomorSurat: String!
    nomorUrut: Int!
    jenisSurat: JenisSurat!
    tanggalSurat: String!
    tanggalAkad: String
    tahunArsip: Int!
    suamiNama: String!
    suamiNik: String
    suamiBin: String
    suamiDesa: String
    suamiKecamatan: String
    istriNama: String!
    istriNik: String
    istriBinti: String
    istriDesa: String
    istriKecamatan: String
    waliNama: String
    waliStatus: String
    waliHubungan: String
    isBatal: String!
    alasanBatal: String
    catatan: String
    lampiranFiles: [LampiranFile!]
    createdById: ID
    createdAt: String!
    updatedAt: String!
  }

  type PaginatedArsip {
    items: [ArsipNikah!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type YearlySummary {
    tahun: Int!
    totalSurat: Int!
    totalNMasuk: Int!
    totalNKeluar: Int!
    totalIsbat: Int!
    totalWali: Int!
    totalBatal: Int!
  }

  type CabinetFolder {
    tahun: Int!
    count: Int!
  }

  input CreateArsipInput {
    jenisSurat: JenisSurat!
    tanggalSurat: String!
    tanggalAkad: String
    tahunArsip: Int
    suamiNama: String!
    suamiNik: String
    suamiBin: String
    suamiDesa: String
    suamiKecamatan: String
    istriNama: String!
    istriNik: String
    istriBinti: String
    istriDesa: String
    istriKecamatan: String
    waliNama: String
    waliStatus: String
    waliHubungan: String
    catatan: String
  }

  input UpdateArsipInput {
    tanggalSurat: String
    tanggalAkad: String
    suamiNama: String
    suamiNik: String
    suamiBin: String
    suamiDesa: String
    suamiKecamatan: String
    istriNama: String
    istriNik: String
    istriBinti: String
    istriDesa: String
    istriKecamatan: String
    waliNama: String
    waliStatus: String
    waliHubungan: String
    catatan: String
  }

  type Query {
    getArsipList(
      jenis: JenisSurat
      tahun: Int
      search: String
      limit: Int = 20
      offset: Int = 0
    ): PaginatedArsip!
    
    getArsipById(id: ID!): ArsipNikah
    getYearlyReport(tahun: Int!): YearlySummary!
    getCabinetFolders: [CabinetFolder!]!
  }

  type Mutation {
    createArsip(input: CreateArsipInput!): ArsipNikah!
    updateArsip(id: ID!, input: UpdateArsipInput!): ArsipNikah!
    deleteArsip(id: ID!, alasan: String): Boolean!
    markAsBatal(id: ID!, alasan: String!): ArsipNikah!
  }
`;
