"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  FileText, 
  Send, 
  BookOpen, 
  UserCheck, 
  XCircle, 
  FolderArchive, 
  BarChart3, 
  PlusCircle, 
  Search, 
  Palette, 
  Printer,
  Trash2,
  Ban,
  Eye,
  Edit,
  ExternalLink
} from "lucide-react";
import { fetchGraphQL } from "@/lib/graphql";
import { SuratPrintView, PrintData } from "@/components/SuratPrintView";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [theme, setTheme] = useState<string>("white");
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<PrintData[]>([]);
  const [cabinetFolders, setCabinetFolders] = useState<Array<{ tahun: number; count: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatalModal, setShowBatalModal] = useState(false);
  const [selectedRecordForBatal, setSelectedRecordForBatal] = useState<PrintData | null>(null);
  const [alasanBatalInput, setAlasanBatalInput] = useState("");
  const [printRecord, setPrintRecord] = useState<PrintData | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    jenisSurat: "N_MASUK",
    tanggalSurat: new Date().toISOString().split("T")[0],
    suamiNama: "",
    suamiNik: "",
    suamiBin: "",
    suamiDesa: "Pelang Kidul",
    istriNama: "",
    istriNik: "",
    istriBinti: "",
    istriDesa: "Pelang Kidul",
    waliNama: "",
    waliStatus: "Nasab",
    waliHubungan: "Ayah Kandung",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchGraphQL(`
        query {
          getArsipList(limit: 100) {
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
            }
          }
          getCabinetFolders {
            tahun
            count
          }
        }
      `);
      if (data?.getArsipList?.items) {
        setRecords(data.getArsipList.items);
      }
      if (data?.getCabinetFolders) {
        setCabinetFolders(data.getCabinetFolders);
      }
    } catch (err) {
      console.error("Gagal memuat data dari API GraphQL:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (newTheme === "white") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const mutation = `
        mutation Create($input: CreateArsipInput!) {
          createArsip(input: $input) {
            id
            nomorSurat
            suamiNama
            istriNama
          }
        }
      `;
      await fetchGraphQL(mutation, { input: formData });
      setShowAddModal(false);
      setFormData({
        jenisSurat: "N_MASUK",
        tanggalSurat: new Date().toISOString().split("T")[0],
        suamiNama: "",
        suamiNik: "",
        suamiBin: "",
        suamiDesa: "Pelang Kidul",
        istriNama: "",
        istriNik: "",
        istriBinti: "",
        istriDesa: "Pelang Kidul",
        waliNama: "",
        waliStatus: "Nasab",
        waliHubungan: "Ayah Kandung",
      });
      await loadData();
    } catch (err: any) {
      alert("Gagal menambahkan arsip: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nomorSurat: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data arsip ${nomorSurat}?`)) return;
    try {
      setLoading(true);
      const mutation = `
        mutation Del($id: ID!) {
          deleteArsip(id: $id)
        }
      `;
      await fetchGraphQL(mutation, { id });
      await loadData();
    } catch (err: any) {
      alert("Gagal menghapus arsip: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkBatal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForBatal) return;
    try {
      setLoading(true);
      const mutation = `
        mutation Batal($id: ID!, $alasan: String!) {
          markAsBatal(id: $id, alasan: $alasan) {
            id
            isBatal
            alasanBatal
          }
        }
      `;
      await fetchGraphQL(mutation, { id: selectedRecordForBatal.id, alasan: alasanBatalInput });
      setShowBatalModal(false);
      setSelectedRecordForBatal(null);
      setAlasanBatalInput("");
      await loadData();
    } catch (err: any) {
      alert("Gagal membatalkan arsip: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (activeTab === "data" && r.jenisSurat !== "N_MASUK") return false;
    if (activeTab === "rekomendasi" && r.jenisSurat !== "N_KELUAR") return false;
    if (activeTab === "isbat" && r.jenisSurat !== "ISBAT") return false;
    if (activeTab === "wali" && r.jenisSurat !== "SURAT_WALI") return false;
    if (activeTab === "pembatalan" && r.isBatal !== "true" && r.jenisSurat !== "PEMBATALAN") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.nomorSurat?.toLowerCase().includes(q) ||
        r.suamiNama?.toLowerCase().includes(q) ||
        r.istriNama?.toLowerCase().includes(q) ||
        r.suamiNik?.includes(q) ||
        r.istriNik?.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex min-h-screen">
      {/* Pratinjau Cetak Surat Modal */}
      {printRecord && (
        <SuratPrintView data={printRecord} onClose={() => setPrintRecord(null)} />
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shadow-sm print:hidden">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-100 mb-4">
            <Image src="/maskot.png" alt="Maskot" width={42} height={42} className="rounded-lg shadow-sm" />
            <div>
              <h1 className="font-bold text-slate-800 text-base leading-tight">MyArsip Nikah</h1>
              <p className="text-xs text-slate-500 font-medium">Desa Pelang Kidul</p>
            </div>
          </div>

          {/* Navigasi */}
          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Beranda", icon: BarChart3 },
              { id: "data", label: "N Masuk", icon: FileText },
              { id: "rekomendasi", label: "N Keluar", icon: Send },
              { id: "isbat", label: "Isbat Nikah", icon: BookOpen },
              { id: "wali", label: "Surat Wali", icon: UserCheck },
              { id: "pembatalan", label: "Pembatalan", icon: XCircle },
              { id: "arsip", label: "Lemari Arsip", icon: FolderArchive },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-teal-700 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Tautan ke Payload CMS */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <a
              href="http://localhost:3001/admin"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
            >
              <span>Payload CMS Admin</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Tema & Footer */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
              <Palette className="w-3.5 h-3.5" /> Pilih Tema Tampilan
            </label>
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-700"
            >
              <option value="white">⚪ Putih Bersih</option>
              <option value="matcha">🍵 Tema Matcha</option>
              <option value="mega-mendung">☁️ Mega Mendung</option>
              <option value="vintage">📜 Vintage Antik</option>
              <option value="office">🏢 Modern Office</option>
            </select>
          </div>
          <div className="text-[11px] text-slate-400 text-center">
            Next.js App Router + GraphQL + Drizzle
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 print:p-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm print:hidden">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, NIK, atau nomor surat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Arsip</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 space-y-6 overflow-y-auto">
          {/* Header Ringkasan */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {activeTab === "dashboard" ? "Beranda Administrasi Nikah" : `Kelola Data: ${activeTab.toUpperCase()}`}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Desa Pelang Kidul • Sistem Satu Pintu Nomor Surat Otomatis
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2 text-center">
                <span className="text-xs font-semibold text-teal-700 block">Total Arsip Terdaftar</span>
                <span className="text-xl font-extrabold text-teal-900">{records.length}</span>
              </div>
            </div>
          </div>

          {/* Tampilan Lemari Arsip (Folder per Tahun) */}
          {activeTab === "arsip" && (
            <div className="grid grid-cols-4 gap-4">
              {cabinetFolders.map((c) => (
                <div key={c.tahun} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-teal-500 transition">
                  <FolderArchive className="w-10 h-10 text-teal-600 mb-2" />
                  <h3 className="font-bold text-slate-800 text-lg">Tahun {c.tahun}</h3>
                  <p className="text-xs text-slate-500 mt-1">{c.count} Dokumen Tersimpan</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabel Data Arsip */}
          {activeTab !== "arsip" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Daftar Dokumen Surat Nikah</h3>
                <span className="text-xs font-medium text-slate-500">
                  Menampilkan {filteredRecords.length} dokumen
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200 uppercase">
                    <tr>
                      <th className="px-4 py-3">No. Surat</th>
                      <th className="px-4 py-3">Jenis</th>
                      <th className="px-4 py-3">Calon Suami</th>
                      <th className="px-4 py-3">Calon Istri</th>
                      <th className="px-4 py-3">Tanggal Surat</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Aksi / Cetak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                          Memuat data dari GraphQL API...
                        </td>
                      </tr>
                    ) : filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                          Belum ada data arsip yang sesuai.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3.5 font-semibold text-teal-800 font-mono text-xs">
                            {r.nomorSurat}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {r.jenisSurat}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-slate-900">{r.suamiNama}</div>
                            {r.suamiNik && <div className="text-[11px] text-slate-400 font-mono">NIK: {r.suamiNik}</div>}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-slate-900">{r.istriNama}</div>
                            {r.istriNik && <div className="text-[11px] text-slate-400 font-mono">NIK: {r.istriNik}</div>}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 text-xs">{r.tanggalSurat}</td>
                          <td className="px-4 py-3.5 text-center">
                            {r.isBatal === "true" ? (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-700" title={r.alasanBatal || ""}>
                                Dibatalkan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-700">
                                Terdaftar
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Tombol Cetak Dokumen */}
                              <button
                                onClick={() => setPrintRecord(r)}
                                title="Cetak Surat / PDF Resmi"
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded shadow-sm transition"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak</span>
                              </button>

                              {/* Tombol Pembatalan */}
                              {r.isBatal !== "true" && (
                                <button
                                  onClick={() => {
                                    setSelectedRecordForBatal(r);
                                    setShowBatalModal(true);
                                  }}
                                  title="Tandai Batal"
                                  className="p-1 text-amber-600 hover:bg-amber-50 rounded border border-amber-200 transition"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Tombol Hapus */}
                              <button
                                onClick={() => handleDelete(r.id, r.nomorSurat)}
                                title="Hapus Arsip"
                                className="p-1 text-red-600 hover:bg-red-50 rounded border border-red-200 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Tandai Pembatalan */}
      {showBatalModal && selectedRecordForBatal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-red-700">Pembatalan Surat Nikah</h3>
              <button onClick={() => setShowBatalModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <p className="text-xs text-slate-600">
              Menandai pembatalan untuk dokumen <span className="font-bold text-slate-800">{selectedRecordForBatal.nomorSurat}</span> ({selectedRecordForBatal.suamiNama} & {selectedRecordForBatal.istriNama}).
            </p>
            <form onSubmit={handleMarkBatal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Pembatalan</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Salah satu pihak mengundurkan diri / persyaratan administrasi tidak terpenuhi..."
                  value={alasanBatalInput}
                  onChange={(e) => setAlasanBatalInput(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowBatalModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition"
                >
                  {loading ? "Menyimpan..." : "Konfirmasi Pembatalan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Data */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Tambah Data Arsip Nikah Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Surat</label>
                <select
                  value={formData.jenisSurat}
                  onChange={(e) => setFormData({ ...formData, jenisSurat: e.target.value })}
                  className="w-full border rounded-lg p-2 bg-slate-50"
                >
                  <option value="N_MASUK">N Masuk (Pernikahan di Desa Pelang Kidul)</option>
                  <option value="N_KELUAR">N Keluar (Rekomendasi Nikah ke Luar Desa)</option>
                  <option value="ISBAT">Isbat Nikah</option>
                  <option value="SURAT_WALI">Surat Wali (Khusus Luar Desa)</option>
                  <option value="PEMBATALAN">Pembatalan Nikah</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Surat</label>
                <input
                  type="date"
                  value={formData.tanggalSurat}
                  onChange={(e) => setFormData({ ...formData, tanggalSurat: e.target.value })}
                  required
                  className="w-full border rounded-lg p-2 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Calon Suami</label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={formData.suamiNama}
                    onChange={(e) => setFormData({ ...formData, suamiNama: e.target.value })}
                    required
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK Calon Suami</label>
                  <input
                    type="text"
                    placeholder="16 Digit NIK"
                    value={formData.suamiNik}
                    onChange={(e) => setFormData({ ...formData, suamiNik: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bin (Nama Ayah Suami)</label>
                  <input
                    type="text"
                    placeholder="Bin..."
                    value={formData.suamiBin}
                    onChange={(e) => setFormData({ ...formData, suamiBin: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Desa Asal Suami</label>
                  <input
                    type="text"
                    placeholder="Desa Asal"
                    value={formData.suamiDesa}
                    onChange={(e) => setFormData({ ...formData, suamiDesa: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Calon Istri</label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={formData.istriNama}
                    onChange={(e) => setFormData({ ...formData, istriNama: e.target.value })}
                    required
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK Calon Istri</label>
                  <input
                    type="text"
                    placeholder="16 Digit NIK"
                    value={formData.istriNik}
                    onChange={(e) => setFormData({ ...formData, istriNik: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Binti (Nama Ayah Istri)</label>
                  <input
                    type="text"
                    placeholder="Binti..."
                    value={formData.istriBinti}
                    onChange={(e) => setFormData({ ...formData, istriBinti: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Desa Asal Istri</label>
                  <input
                    type="text"
                    placeholder="Desa Asal"
                    value={formData.istriDesa}
                    onChange={(e) => setFormData({ ...formData, istriDesa: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              {(formData.jenisSurat === "SURAT_WALI" || formData.jenisSurat === "N_MASUK") && (
                <div className="border-t pt-3 space-y-3">
                  <h4 className="font-bold text-xs text-slate-700 uppercase">Informasi Wali Nikah</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Wali</label>
                      <input
                        type="text"
                        placeholder="Nama Wali"
                        value={formData.waliNama}
                        onChange={(e) => setFormData({ ...formData, waliNama: e.target.value })}
                        className="w-full border rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Hubungan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Ayah Kandung"
                        value={formData.waliHubungan}
                        onChange={(e) => setFormData({ ...formData, waliHubungan: e.target.value })}
                        className="w-full border rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                      <select
                        value={formData.waliStatus}
                        onChange={(e) => setFormData({ ...formData, waliStatus: e.target.value })}
                        className="w-full border rounded-lg p-2 text-xs bg-slate-50"
                      >
                        <option value="Nasab">Nasab</option>
                        <option value="Hakim">Hakim</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg"
                >
                  {loading ? "Menyimpan..." : "Simpan Arsip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
