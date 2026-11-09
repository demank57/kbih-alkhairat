import React from 'react';
import { Jamaah, Payment, LembagaConfig } from '../types';
import { terbilang } from '../helpers/terbilang';
import { Printer, Download, X, Stamp, ShieldAlert, Heart, ClipboardCheck } from 'lucide-react';

interface PrintPreviewProps {
  type: 'dossier' | 'receipt' | 'register' | 'directory' | null;
  selectedJamaah: Jamaah | null;
  selectedPayment: Payment | null;
  selectedList?: Jamaah[];
  title?: string;
  subTitle?: string;
  lembaga: LembagaConfig;
  onClose: () => void;
}

export default function PrintPreview({
  type,
  selectedJamaah,
  selectedPayment,
  selectedList,
  title,
  subTitle,
  lembaga,
  onClose
}: PrintPreviewProps) {
  if (!type) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentFormattedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print-preview-backdrop">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col my-4 print-modal-box">
        {/* Modal Controller Bar (Hidden in @media print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center no-print">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 font-sans">
              <Printer size={16} className="text-blue-400" />
              SISTEM PRATINJAU DOKUMEN CETAK
            </h3>
            <p className="text-[11px] text-slate-300">Konfirmasi kesesuaian data formulir Anda lalu cetak atau simpan sebagai dokumen PDF.</p>
          </div>
          <div className="flex gap-2">
            <button
              id="btn-print-dokumen"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-kbih-green hover:bg-kbih-green-hover text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Printer size={14} />
              Cetak
            </button>
            <button
              id="btn-close-print"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <X size={13} />
              Cancel
            </button>
          </div>
        </div>

        {/* PRINT CONTENT CANVAS */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50 flex justify-center">
          
          {/* Real simulated paper size */}
          <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-black print-card font-serif leading-relaxed text-sm relative">
            
            {/* 1. DOSSIER VIEW */}
            {type === 'dossier' && selectedJamaah && (
              <div className="space-y-6">
                {/* Kop Surat KBIH */}
                <div className="flex items-center gap-4 pb-4 border-b-2 double border-blue-700">
                  {lembaga.logo ? (
                    <img
                      src={lembaga.logo}
                      alt="Logo"
                      className="w-16 h-16 object-contain flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div className="flex-1 text-center">
                    <h1 className="text-xl font-bold uppercase tracking-tight text-blue-900 font-serif">
                      {lembaga.namaLembaga}
                    </h1>
                    <p className="text-[11px] italic text-slate-600 font-sans mt-0.5 leading-tight">
                      Penyelenggara Bimbingan Ibadah Haji dan Umroh Mandiri & Berizin Kemenag RI
                    </p>
                    <p className="text-[10px] text-slate-500 font-sans leading-tight mt-1">
                      {lembaga.alamat} | HP/WA: {lembaga.noHp}
                    </p>
                  </div>
                  {lembaga.logo ? <div className="w-16 h-16 pointer-events-none opacity-0 flex-shrink-0" /> : null}
                </div>

                {/* Judul Formulir */}
                <div className="text-center py-2">
                  <h2 className="text-md font-bold underline tracking-wide">
                    FORMULIR KELENGKAPAN ADMINISTRASI PENDAFTARAN HAJI
                  </h2>
                  <p className="text-xs font-sans text-slate-600 font-bold mt-1">
                    No Registration: {selectedJamaah.id} | Tahun Haji: {selectedJamaah.periodeTahun}
                  </p>
                </div>

                {/* SECTION 1: BIODATA DIRI */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase font-sans border-b border-slate-300 pb-0.5 text-slate-802 flex justify-between">
                    <span>I. DATA IDENTITAS & BIODATA DIRI</span>
                    <span className="font-sans text-[10px]">No Porsi: {selectedJamaah.noPorsi || 'BELUM TERBIT'}</span>
                  </h3>
                  
                  <div className="grid grid-cols-12 gap-y-1 gap-x-2 text-xs font-sans">
                    <span className="col-span-4 text-slate-500">Nama Lengkap (KTP)</span>
                    <span className="col-span-8 font-semibold">: {selectedJamaah.namaLengkap}</span>

                    <span className="col-span-4 text-slate-500">Bin / Binti</span>
                    <span className="col-span-8">: {selectedJamaah.binBinti}</span>

                    <span className="col-span-4 text-slate-500">No Induk Kependudukan</span>
                    <span className="col-span-8 font-sans">: {selectedJamaah.nik}</span>

                    <span className="col-span-4 text-slate-500">Jenis Kelamin</span>
                    <span className="col-span-8">: {selectedJamaah.jenisKelamin}</span>

                    <span className="col-span-4 text-slate-500">Tempat, Tgl Lahir</span>
                    <span className="col-span-8">: {selectedJamaah.tempatLahir}, {selectedJamaah.tanggalLahir}</span>

                    <span className="col-span-4 text-slate-500">No. Handphone</span>
                    <span className="col-span-8">: {selectedJamaah.noHp}</span>

                    <span className="col-span-4 text-slate-500">Alamat Lengkap</span>
                    <span className="col-span-8">: {selectedJamaah.alamatDomisili}</span>
                  </div>
                </div>

                {/* SECTION 2: DATA INTEGRASI PASPOR */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase font-sans border-b border-slate-300 pb-0.5 text-slate-800">
                    II. DATA INTEGRASI PASPOR & IMIGRASI
                  </h3>
                  <div className="grid grid-cols-12 gap-y-1 gap-x-2 text-xs font-sans">
                    <span className="col-span-4 text-slate-500">Nomor Paspor</span>
                    <span className="col-span-8 font-semibold font-sans">: {selectedJamaah.noPaspor || 'BELUM MEMILIKI PASPOR'}</span>

                    <span className="col-span-4 text-slate-500">Kantor Imigrasi Penerbit</span>
                    <span className="col-span-8">: {selectedJamaah.kantorImigrasi || '-'}</span>

                    <span className="col-span-4 text-slate-500">Masa Berlaku Paspor</span>
                    <span className="col-span-8">: {selectedJamaah.tglTerbitPaspor ? `${selectedJamaah.tglTerbitPaspor} s/d ${selectedJamaah.tglHabisPaspor}` : '-'}</span>
                  </div>
                </div>

                {/* SECTION 3: PROFIL KESEHATAN */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase font-sans border-b border-slate-300 pb-0.5 text-slate-800">
                    III. PROFIL DIAGNOSIS MEDIS / KESEHATAN
                  </h3>
                  <div className="grid grid-cols-12 gap-y-1 gap-x-2 text-xs font-sans">
                    <span className="col-span-4 text-slate-500">Dimensi Fisik</span>
                    <span className="col-span-8">: Tinggi {selectedJamaah.tinggiBadan} cm | Berat {selectedJamaah.beratBadan} kg</span>

                    <span className="col-span-4 text-slate-500">Riwayat Penyakit</span>
                    <span className="col-span-8 font-semibold text-rose-800">: {selectedJamaah.riwayatPenyakit || 'Tidak Ada'}</span>
                  </div>
                </div>

                {/* SECTION 4: MAHRAM */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase font-sans border-b border-slate-300 pb-0.5 text-slate-800">
                    IV. DATA MAHRAM / PENDAMPING SAFAR
                  </h3>
                  <div className="grid grid-cols-12 gap-y-1 gap-x-2 text-xs font-sans">
                    <span className="col-span-4 text-slate-500">Nama Lengkap Mahram</span>
                    <span className="col-span-8 font-semibold">: {selectedJamaah.namaMahram || 'Perjalanan Mandiri / Tidak Ada'}</span>

                    {selectedJamaah.namaMahram && (
                      <>
                        <span className="col-span-4 text-slate-500">Hubungan Mahram</span>
                        <span className="col-span-8">: {selectedJamaah.hubunganMahram}</span>

                        <span className="col-span-4 text-slate-500">NIK Mahram</span>
                        <span className="col-span-8 font-sans">: {selectedJamaah.nikMahram}</span>

                        <span className="col-span-4 text-slate-500">No. HP & Alamat</span>
                        <span className="col-span-8">: {selectedJamaah.noHpMahram} | {selectedJamaah.alamatMahram}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* SECTION 5: VERIFIKASI DOKUMEN FISIK */}
                <table className="w-full text-xs font-sans border border-slate-300 text-left mt-4 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300">
                      <th className="p-1 px-2 border-r border-slate-300">Nomor Berkas</th>
                      <th className="p-1 px-2 border-r border-slate-300">Jenis Dokumen Persyaratan</th>
                      <th className="p-1 px-2">Status Fisik & Digital</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="p-1 px-2 border-r border-slate-300">A-1</td>
                      <td className="p-1 px-2 border-r border-slate-300">Fotokopi / Scan Kartu Keluarga (KK)</td>
                      <td className="p-1 px-2 font-semibold text-emerald-800">{selectedJamaah.dokumenKK ? '✓ LENGKAP' : '✗ BELUM DIUNGGAH'}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="p-1 px-2 border-r border-slate-300">A-2</td>
                      <td className="p-1 px-2 border-r border-slate-300">Fotokopi / Scan Kartu Tanda Penduduk (KTP)</td>
                      <td className="p-1 px-2 font-semibold text-emerald-800">{selectedJamaah.dokumenKTP ? '✓ LENGKAP' : '✗ BELUM DIUNGGAH'}</td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 border-r border-slate-300">A-3</td>
                      <td className="p-1 px-2 border-r border-slate-300">Pas Foto Berwarna 4x6 Kemenag latar belakang putih</td>
                      <td className="p-1 px-2 font-semibold text-emerald-800">{selectedJamaah.dokumenFoto ? '✓ LENGKAP' : '✗ BELUM DIUNGGAH'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Tanda Tangan */}
                <div className="pt-8 grid grid-cols-2 text-xs font-sans text-center gap-4">
                  <div>
                    <p className="opacity-0 mb-0.5 select-none pointer-events-none" aria-hidden="true">&nbsp;</p>
                    <p className="mb-14 text-slate-600">Calon Jamaah Haji,</p>
                    <p className="font-bold underline uppercase">{selectedJamaah.namaLengkap}</p>
                    <p className="text-[10px] text-slate-400">NIK: {selectedJamaah.nik}</p>
                  </div>
                  <div>
                    <p className="text-slate-550 mb-0.5">Pamekasan, {currentFormattedDate}</p>
                    <p className="mb-14">Petugas Verifikasi KBIH,</p>
                    <p className="font-bold underline uppercase">{lembaga.namaPengelola}</p>
                    <p className="text-[10px] text-slate-400">Ketua Harian & Pengelola</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RECEIPT / KWITANSI VIEW (TAMPILAN EXCLUSIVE SEPERTI KWITANSI ASLI) */}
            {type === 'receipt' && selectedPayment && (
              <div className="space-y-6 border-4 border-double border-amber-600 p-6 rounded-lg bg-amber-50/10 relative">
                
                {/* Vintage kop surat */}
                <div className="flex justify-between items-start pb-4 border-b border-amber-600 gap-3">
                  <div className="flex items-start gap-3">
                    {lembaga.logo ? (
                      <img
                        src={lembaga.logo}
                        alt="Logo"
                        className="w-12 h-12 object-contain flex-shrink-0 bg-white p-0.5 border border-amber-350 rounded"
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                    <div>
                      <h1 className="text-md font-serif font-black uppercase text-amber-900 tracking-tight leading-tight">
                        {lembaga.namaLembaga}
                      </h1>
                      <p className="text-[10px] font-sans text-slate-600 leading-normal mt-0.5">
                        {lembaga.alamat}
                      </p>
                      <p className="text-[9px] font-sans text-slate-500 leading-tight">
                        Telepon: {lembaga.noHp}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 font-sans font-bold rounded border border-amber-300 text-xs tracking-wider">
                      KWITANSI ASLI (SLIP BPIH)
                    </span>
                    <p className="text-xs font-sans font-bold text-slate-700 mt-2">
                      ID Transaksi: {selectedPayment.id}
                    </p>
                  </div>
                </div>

                {/* KWITANSI TABLE GRID STYLE */}
                <div className="space-y-4 py-2 font-sans text-xs">
                  {/* Row 1 */}
                  <div className="grid grid-cols-12 pb-2 border-b border-dashed border-slate-200">
                    <span className="col-span-3 text-slate-500 uppercase tracking-wide font-bold">Telah Terima Dari</span>
                    <span className="col-span-9 font-serif font-bold text-sm text-slate-900 uppercase">
                      : {(() => {
                        const j = selectedPayment ? selectedPayment.jamaahId : '';
                        return j; // The component handles mapping or displays the string
                      })() || 'Jamaah Haji Murni'}
                      {/* Subtitle with detail */}
                      <span className="text-[10px] text-slate-600 block pl-2 font-sans normal-case italic mt-0.5">
                        (Atas nama KTP Terlampir, Terdaftar haji murni Siskohat)
                      </span>
                    </span>
                  </div>

                  {/* Row 2: Terbilang */}
                  <div className="grid grid-cols-12 pb-2 border-b border-dashed border-slate-200 items-center">
                    <span className="col-span-3 text-slate-500 uppercase tracking-wide font-bold">Uang Sejumlah</span>
                    <span className="col-span-9 bg-amber-50/50 p-2.5 rounded border border-amber-100 italic font-semibold text-amber-900 text-xs">
                      # {terbilang(selectedPayment.nominal)} #
                    </span>
                  </div>

                  {/* Row 3: Untuk Pembayaran */}
                  <div className="grid grid-cols-12 pb-2 border-b border-dashed border-slate-200">
                    <span className="col-span-3 text-slate-500 uppercase tracking-wide font-bold">Untuk Pembayaran</span>
                    <span className="col-span-9">
                      : <strong className="text-blue-800 uppercase text-xs">{selectedPayment.jenisSetoran}</strong> - {selectedPayment.keterangan || 'Setoran aman porsi Haji Mandiri'}
                    </span>
                  </div>
                </div>

                {/* Row 4: Nominal Stamp area and authority signs */}
                <div className="pt-4 grid grid-cols-12 gap-4 items-center">
                  
                  {/* Huge Nominal block */}
                  <div className="col-span-6 bg-slate-900 text-amber-400 p-3 px-5 rounded-lg border-2 border-amber-600 font-sans text-lg font-black tracking-wider flex items-center gap-2">
                    <span>RP.</span>
                    <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(selectedPayment.nominal)},-</span>
                  </div>

                  {/* Sign-off location */}
                  <div className="col-span-6 text-center text-xs font-sans text-slate-800 relative">
                    <p className="text-slate-500">Pamekasan, {selectedPayment.tanggalTransaksi}</p>
                    <p className="font-bold text-slate-700 mt-1 mb-12">Penerima Kas KBIH,</p>
                    
                    {/* Retro Stamp Mock element in preview */}
                    <div className="absolute right-4 top-4 opacity-50 pointer-events-none text-blue-800 border-2 border-blue-700 border-dashed p-1 rounded font-bold text-[8px] transform rotate-12 flex flex-col items-center">
                      <span>LUNAS BAYAR</span>
                      <span className="text-[6px] tracking-wide font-sans font-normal">KBIH AL-MABRUR</span>
                    </div>

                    <p className="font-bold underline text-slate-900 uppercase">{lembaga.namaPengelola}</p>
                    <p className="text-[9px] text-slate-400">Authorized signature</p>
                  </div>

                </div>

                {/* Important notice footer */}
                <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-2 font-sans italic">
                  Note: Lembar kwitansi ini merupakan bukti setoran sah bank murni untuk nomor porsi pendaftaran ibadah haji mandiri. Harap disimpan dengan baik.
                </div>

              </div>
            )}

            {/* 3. REGISTER / JOURNAL VIEW */}
            {type === 'register' && selectedList && (
              <div className="space-y-6 w-full">
                {/* Kop Surat KBIH */}
                <div className="flex items-center gap-4 pb-4 border-b-2 border-double border-blue-700">
                  {lembaga.logo ? (
                    <img
                      src={lembaga.logo}
                      alt="Logo"
                      className="w-16 h-16 object-contain flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div className="flex-1 text-center">
                    <h1 className="text-xl font-bold uppercase tracking-tight text-blue-900 font-serif">
                      {lembaga.namaLembaga}
                    </h1>
                    <p className="text-[11px] italic text-slate-600 font-sans mt-0.5 leading-tight">
                      Penyelenggara Bimbingan Ibadah Haji dan Umroh Mandiri & Berizin Kemenag RI
                    </p>
                    <p className="text-[10px] text-slate-500 font-sans leading-tight mt-1">
                      {lembaga.alamat} | HP/WA: {lembaga.noHp}
                    </p>
                  </div>
                  {lembaga.logo ? <div className="w-16 h-16 pointer-events-none opacity-0 flex-shrink-0" /> : null}
                </div>

                {/* Judul Laporan */}
                <div className="text-center py-2">
                  <h2 className="text-md font-bold underline tracking-wide uppercase">
                    {title || 'LAPORAN REKAPITULASI REGISTER JAMAAH'}
                  </h2>
                  <p className="text-xs font-sans text-slate-600 mt-1">
                    {subTitle}
                  </p>
                </div>

                {/* Table Data */}
                <table className="w-full text-xs font-sans border border-slate-300 text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase">
                      <th className="p-2 border-r border-slate-300 w-12 text-center">No</th>
                      <th className="p-2 border-r border-slate-300 w-24">ID Rek</th>
                      <th className="p-2 border-r border-slate-300">Nama Lengkap</th>
                      <th className="p-2 border-r border-slate-300">NIK / KTP</th>
                      <th className="p-2 border-r border-slate-300">No. Porsi</th>
                      <th className="p-2">Tgl Daftar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400 italic">Tidak ada pendaftar pada rentang tanggal tersebut.</td>
                      </tr>
                    ) : (
                      selectedList.map((j, i) => (
                        <tr key={j.id} className="border-b border-slate-200">
                          <td className="p-2 border-r border-slate-200 text-center">{i + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-sans font-bold text-blue-800">{j.id}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold">{j.namaLengkap}</td>
                          <td className="p-2 border-r border-slate-200 font-sans">{j.nik}</td>
                          <td className="p-2 border-r border-slate-200 font-sans">{j.noPorsi || '--'}</td>
                          <td className="p-2 font-sans">{j.tglPendaftaran}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Ringkasan */}
                <p className="text-xs text-slate-500 font-sans italic">
                  * Total Jemaah terkapitulasi dalam laporan ini: {selectedList.length} Jiwa.
                </p>

                {/* Tanda Tangan */}
                <div className="pt-8 flex justify-end text-xs font-sans text-center">
                  <div className="w-64">
                    <p className="text-slate-550 mb-0.5">Pamekasan, {currentFormattedDate}</p>
                    <p className="mb-14">Ketua Harian KBIH,</p>
                    <p className="font-bold underline uppercase">{lembaga.namaPengelola}</p>
                    <p className="text-[10px] text-slate-400">Authorized signature</p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. DIRECTORY / TAHUNAN VIEW */}
            {type === 'directory' && selectedList && (
              <div className="space-y-6 w-full">
                {/* Kop Surat KBIH */}
                <div className="flex items-center gap-4 pb-4 border-b-2 border-double border-blue-700">
                  {lembaga.logo ? (
                    <img
                      src={lembaga.logo}
                      alt="Logo"
                      className="w-16 h-16 object-contain flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div className="flex-1 text-center">
                    <h1 className="text-xl font-bold uppercase tracking-tight text-blue-900 font-serif">
                      {lembaga.namaLembaga}
                    </h1>
                    <p className="text-[11px] italic text-slate-600 font-sans mt-0.5 leading-tight">
                      Penyelenggara Bimbingan Ibadah Haji dan Umroh Mandiri & Berizin Kemenag RI
                    </p>
                    <p className="text-[10px] text-slate-500 font-sans leading-tight mt-1">
                      {lembaga.alamat} | HP/WA: {lembaga.noHp}
                    </p>
                  </div>
                  {lembaga.logo ? <div className="w-16 h-16 pointer-events-none opacity-0 flex-shrink-0" /> : null}
                </div>

                {/* Judul Laporan */}
                <div className="text-center py-2">
                  <h2 className="text-md font-bold underline tracking-wide uppercase">
                    {title || 'DIREKTORI ADMINISTRASI DAFTAR JAMAAH'}
                  </h2>
                  <p className="text-xs font-sans text-slate-600 mt-1">
                    {subTitle}
                  </p>
                </div>

                {/* Table Data */}
                <table className="w-full text-xs font-sans border border-slate-300 text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase">
                      <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                      <th className="p-2 border-r border-slate-300 w-20">ID Rek</th>
                      <th className="p-2 border-r border-slate-300">Nama Jemaah</th>
                      <th className="p-2 border-r border-slate-300">No. Porsi</th>
                      <th className="p-2 border-r border-slate-300">Paspor</th>
                      <th className="p-2 border-r border-slate-300">Mahram</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-400 italic">Belum ada jemaah terpilih.</td>
                      </tr>
                    ) : (
                      selectedList.map((j, i) => (
                        <tr key={j.id} className="border-b border-slate-200">
                          <td className="p-2 border-r border-slate-200 text-center">{i + 1}</td>
                          <td className="p-2 border-r border-slate-200 font-sans font-bold text-blue-800">{j.id}</td>
                          <td className="p-2 border-r border-slate-200">
                            <span className="font-semibold block">{j.namaLengkap}</span>
                            <span className="text-[10px] text-slate-500 font-normal">Bin/Bi: {j.binBinti}</span>
                          </td>
                          <td className="p-2 border-r border-slate-200 font-sans">{j.noPorsi || '--'}</td>
                          <td className="p-2 border-r border-slate-200 font-sans">{j.noPaspor || '--'}</td>
                          <td className="p-2 border-r border-slate-200 text-[10px]">{j.namaMahram ? `${j.namaMahram} (${j.hubunganMahram})` : 'Mandiri'}</td>
                          <td className="p-2 text-center">
                            <span className="font-bold text-[10px] text-emerald-800">{j.statusAdministrasi}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Ringkasan */}
                <p className="text-xs text-slate-500 font-sans italic">
                  * Total Jemaah terdaftar aktif tahun keberangkatan: {selectedList.length} Jiwa.
                </p>

                {/* Tanda Tangan */}
                <div className="pt-8 flex justify-end text-xs font-sans text-center">
                  <div className="w-64">
                    <p className="text-slate-550 mb-0.5">Pamekasan, {currentFormattedDate}</p>
                    <p className="mb-14">Ketua Harian KBIH,</p>
                    <p className="font-bold underline uppercase">{lembaga.namaPengelola}</p>
                    <p className="text-[10px] text-slate-400">Authorized signature</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>



      </div>
    </div>
  );
}
