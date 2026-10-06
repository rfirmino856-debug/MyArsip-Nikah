import React from "react";
import Image from "next/image";

export type PrintData = {
  id: string;
  nomorSurat: string;
  nomorUrut?: number;
  jenisSurat: string;
  tanggalSurat: string;
  tanggalAkad?: string;
  tahunArsip: number;
  suamiNama: string;
  suamiNik?: string;
  suamiBin?: string;
  suamiDesa?: string;
  suamiKecamatan?: string;
  istriNama: string;
  istriNik?: string;
  istriBinti?: string;
  istriDesa?: string;
  istriKecamatan?: string;
  waliNama?: string;
  waliStatus?: string;
  waliHubungan?: string;
  isBatal?: string;
  alasanBatal?: string;
  catatan?: string;
};

interface SuratPrintProps {
  data: PrintData;
  onClose: () => void;
}

export const SuratPrintView: React.FC<SuratPrintProps> = ({ data, onClose }) => {
  const getJudulSurat = (jenis: string) => {
    switch (jenis) {
      case "N_MASUK":
        return "SURAT KETERANGAN NIKAH (MODEL N1)";
      case "N_KELUAR":
        return "SURAT PENGANTAR REKOMENDASI NIKAH (N KELUAR)";
      case "ISBAT":
        return "SURAT KETERANGAN ISBAT NIKAH";
      case "SURAT_WALI":
        return "SURAT KETERANGAN SUSUNAN WALI NIKAH";
      case "PEMBATALAN":
        return "SURAT KETERANGAN PEMBATALAN PERNIKAHAN";
      default:
        return "SURAT KETERANGAN ADMINISTRASI NIKAH";
    }
  };

  const formatTanggalIndonesia = (dateStr: string) => {
    if (!dateStr) return "....................";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto flex flex-col items-center p-4 print:p-0 print:bg-white print:static">
      {/* Control Bar (Hidden when Printing) */}
      <div className="w-full max-w-[210mm] bg-white rounded-t-xl p-4 border-b border-slate-200 flex items-center justify-between shadow-md print:hidden mb-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-sm">Pratinjau Cetak Surat Resmi</span>
          <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2.5 py-0.5 rounded">
            {data.nomorSurat}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak / Simpan PDF
          </button>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Lembar Kertas Dokumen Standar A4 */}
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-[20mm] font-serif shadow-2xl print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full print:border-none print:min-h-0">
        
        {/* Kop Surat Resmi Desa Pelang Kidul */}
        <div className="flex items-center gap-4 border-b-[3px] border-black pb-3 mb-4">
          <div className="w-20 h-20 relative flex-shrink-0 flex items-center justify-center">
            <Image
              src="/maskot.png"
              alt="Logo Desa Pelang Kidul"
              width={75}
              height={75}
              className="object-contain"
            />
          </div>
          <div className="text-center flex-1">
            <h3 className="text-base font-bold tracking-wider uppercase m-0 leading-tight">
              Pemerintah Kabupaten Ngawi
            </h3>
            <h4 className="text-sm font-bold tracking-wider uppercase m-0 leading-tight">
              Kecamatan Kedunggalar
            </h4>
            <h2 className="text-lg font-extrabold tracking-widest uppercase m-0 mt-1 leading-tight">
              Kantor Kepala Desa Pelang Kidul
            </h2>
            <p className="text-xs font-sans text-gray-700 m-0 mt-1">
              Jl. Raya Pelang Kidul - Kedunggalar, Kode Pos 63254, Ngawi, Jawa Timur
            </p>
          </div>
        </div>

        {/* Garis Ganda Kop */}
        <div className="border-b border-black mb-6 -mt-3"></div>

        {/* Judul & Nomor Surat */}
        <div className="text-center mb-6">
          <h2 className="text-sm font-bold uppercase underline tracking-wide">
            {getJudulSurat(data.jenisSurat)}
          </h2>
          <p className="text-xs mt-1 font-sans">
            Nomor: <span className="font-semibold">{data.nomorSurat}</span>
          </p>
        </div>

        {/* Isi Pembuka */}
        <p className="text-xs leading-relaxed mb-4 text-justify font-sans">
          Yang bertanda tangan di bawah ini, Kepala Desa Pelang Kidul, Kecamatan Kedunggalar, Kabupaten Ngawi, menerangkan dengan sesungguhnya bahwa:
        </p>

        {/* Data Calon Suami */}
        <div className="mb-4 font-sans text-xs">
          <div className="font-bold underline mb-1">I. CALON SUAMI:</div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-48 py-0.5">1. Nama Lengkap</td>
                <td className="w-4">:</td>
                <td className="font-bold uppercase py-0.5">{data.suamiNama || "—"}</td>
              </tr>
              <tr>
                <td className="py-0.5">2. Bin</td>
                <td>:</td>
                <td>{data.suamiBin || "—"}</td>
              </tr>
              <tr>
                <td className="py-0.5">3. NIK / No. KTP</td>
                <td>:</td>
                <td className="font-mono">{data.suamiNik || "—"}</td>
              </tr>
              <tr>
                <td className="py-0.5">4. Tempat Tinggal / Desa</td>
                <td>:</td>
                <td>{data.suamiDesa || "Pelang Kidul"}, Kec. {data.suamiKecamatan || "Kedunggalar"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Data Calon Istri */}
        <div className="mb-4 font-sans text-xs">
          <div className="font-bold underline mb-1">II. CALON ISTRI:</div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-48 py-0.5">1. Nama Lengkap</td>
                <td className="w-4">:</td>
                <td className="font-bold uppercase py-0.5">{data.istriNama || "—"}</td>
              </tr>
              <tr>
                <td className="py-0.5">2. Binti</td>
                <td>:</td>
                <td>{data.istriBinti || "—"}</td>
              </tr>
              <tr>
                <td className="py-0.5">3. NIK / No. KTP</td>
                <td>:</td>
                <td className="font-mono">{data.istriNik || "—"}</td>
              </tr>
              <tr>
                <td className="py-0.5">4. Tempat Tinggal / Desa</td>
                <td>:</td>
                <td>{data.istriDesa || "Pelang Kidul"}, Kec. {data.istriKecamatan || "Kedunggalar"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Data Wali jika Surat Wali atau diisi */}
        {(data.jenisSurat === "SURAT_WALI" || data.waliNama) && (
          <div className="mb-4 font-sans text-xs">
            <div className="font-bold underline mb-1">III. SUSUNAN WALI NIKAH:</div>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="w-48 py-0.5">1. Nama Wali</td>
                  <td className="w-4">:</td>
                  <td className="font-bold uppercase py-0.5">{data.waliNama || "—"}</td>
                </tr>
                <tr>
                  <td className="py-0.5">2. Hubungan Wali</td>
                  <td>:</td>
                  <td>{data.waliHubungan || "Ayah Kandung"}</td>
                </tr>
                <tr>
                  <td className="py-0.5">3. Status Wali</td>
                  <td>:</td>
                  <td>{data.waliStatus || "Nasab"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Status Pembatalan jika ada */}
        {data.isBatal === "true" && (
          <div className="my-3 p-2 border border-red-500 bg-red-50 text-red-700 text-xs font-sans rounded">
            <strong>KETERANGAN PEMBATALAN:</strong> Berkas/pernikahan ini telah dibatalkan dengan alasan: {data.alasanBatal || "Tidak ada keterangan tambahan."}
          </div>
        )}

        {/* Penutup */}
        <p className="text-xs leading-relaxed mt-4 mb-8 text-justify font-sans">
          Demikian surat keterangan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya dan sesuai dengan ketentuan peraturan perundang-undangan administrasi pencatatan perkawinan yang berlaku.
        </p>

        {/* Tanda Tangan */}
        <div className="flex justify-between items-start font-sans text-xs pt-4">
          <div className="text-center w-56">
            <p className="invisible">Tanggal</p>
            <p className="font-semibold mb-16">Petugas Registrasi / P3N,</p>
            <p className="font-bold underline uppercase">( ........................................ )</p>
          </div>

          <div className="text-center w-64">
            <p>Pelang Kidul, {formatTanggalIndonesia(data.tanggalSurat)}</p>
            <p className="font-semibold mb-16">Kepala Desa Pelang Kidul,</p>
            <p className="font-bold underline uppercase">SLAMET</p>
            <p className="text-[11px] text-gray-600">NIP. ....................................</p>
          </div>
        </div>

      </div>
    </div>
  );
};
