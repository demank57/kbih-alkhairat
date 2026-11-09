import React, { useState } from 'react';
import { Jamaah, Payment, HajiPeriod, LembagaConfig } from '../types';
import { FileText, Printer, Calendar, CalendarDays, Search, Wallet, DollarSign, BarChart3, TrendingUp, Users, ArrowUpRight, CheckCircle2, Bookmark, FileSpreadsheet } from 'lucide-react';

interface ReportHistoryProps {
  jamaahList: Jamaah[];
  paymentList: Payment[];
  periodeList: HajiPeriod[];
  lembaga: LembagaConfig;
  onSelectPrintJamaah: (jamaah: Jamaah) => void;
  onSelectPrintReceipt: (payment: Payment) => void;
  onSelectPrintRegister: (list: Jamaah[], startDate: string, endDate: string) => void;
  onSelectPrintDirectory: (list: Jamaah[], year: string) => void;
}

export default function ReportHistory({
  jamaahList,
  paymentList,
  periodeList,
  lembaga,
  onSelectPrintJamaah,
  onSelectPrintReceipt,
  onSelectPrintRegister,
  onSelectPrintDirectory
}: ReportHistoryProps) {
  const [activeSubTab, setActiveSubTab] = useState<'laporan' | 'riwayat'>('laporan');
  
  // States for different filters
  const [selectedJamaahId, setSelectedJamaahId] = useState('');
  const [formSearchQuery, setFormSearchQuery] = useState('');

  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [selectedYear, setSelectedYear] = useState('250'); // or "2026"
  const [selectedPeriodYear, setSelectedPeriodYear] = useState('2026');

  // Currency formater
  const rupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const exportToCSV = (headers: string[], dataRows: any[][], filename: string) => {
    const escapeCell = (cell: any) => {
      if (cell === null || cell === undefined) return '';
      let val = String(cell).trim();
      
      // Prevent scientific notation (e.g. 3.27301E+15) and keep leading zeros in Excel/spreadsheets.
      // Prepending a tab character (\t) forces Excel to interpret long numeric strings (length >= 10 like NIK, No. Porsi)
      // or phone numbers (starting with 0) as text without affecting the display significantly.
      if (/^\d+$/.test(val) && (val.length >= 10 || val.startsWith('0'))) {
        val = `\t${val}`;
      }

      val = val.replace(/"/g, '""');
      if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r') || val.includes('\t')) {
        return `"${val}"`;
      }
      return val;
    };

    const csvRows = [];
    csvRows.push('sep=,');
    csvRows.push(headers.map(escapeCell).join(','));

    dataRows.forEach(row => {
      csvRows.push(row.map(escapeCell).join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter untuk Formulir Pendaftaran Mandiri (Section A)
  const filteredJamaahForForm = jamaahList.filter(j => {
    const q = formSearchQuery.trim().toLowerCase();
    return (
      !q ||
      j.namaLengkap.toLowerCase().includes(q) ||
      j.id.toLowerCase().includes(q) ||
      j.nik.toLowerCase().includes(q) ||
      (j.noPorsi && j.noPorsi.toLowerCase().includes(q))
    );
  });

  const selectedJamaahForForm = jamaahList.find(j => j.id === selectedJamaahId);

  // 1. Filter per-tanggal
  const jamaahByDateRange = jamaahList.filter(j => {
    return j.tglPendaftaran >= startDate && j.tglPendaftaran <= endDate;
  });

  // 2. Filter per-tahun
  const jamaahByYear = jamaahList.filter(j => j.periodeTahun === selectedPeriodYear);

  // 3. Overall statistic calculations
  const totalJamaahCount = jamaahList.length;
  const successfulPayments = paymentList.filter(p => p.status === 'Berhasil');
  const totalPaymentsAmount = successfulPayments.reduce((acc, curr) => acc + curr.nominal, 0);
  
  const completeDocsCount = jamaahList.filter(j => j.statusAdministrasi === 'Lengkap').length;
  const incompleteDocsCount = totalJamaahCount - completeDocsCount;

  // Print list function (triggers standard print after choosing layouts)
  const triggerPrintPage = () => {
    window.print();
  };

  return (
    <div id="report-history-section" className="space-y-4">
      {/* Tab Selectors */}
      <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-250">
        <button
          onClick={() => setActiveSubTab('laporan')}
          className={`flex-1 py-1 px-3 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'laporan'
              ? 'bg-kbih-green text-white shadow-xs'
              : 'text-slate-600 hover:bg-white/50'
          }`}
        >
          <FileText size={13} />
          Format Berkas & Surat Pendaftaran
        </button>
        <button
          onClick={() => setActiveSubTab('riwayat')}
          className={`flex-1 py-1 px-3 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'riwayat'
              ? 'bg-kbih-green text-white shadow-xs'
              : 'text-slate-600 hover:bg-white/50'
          }`}
        >
          <BarChart3 size={13} />
          Statistik & Evaluasi Kuota
        </button>
      </div>

      {activeSubTab === 'riwayat' ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-slate-200/85 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded bg-emerald-50 flex items-center justify-center text-emerald-800 flex-shrink-0">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Banyak Jamaah</p>
                <h3 className="text-sm font-black text-slate-900 font-sans mt-0.5">{totalJamaahCount} <span className="text-[10px] font-normal text-slate-400">Jiwa</span></h3>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200/85 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pembayaran</p>
                <h4 className="text-xs font-black text-slate-900 font-sans mt-0.5 truncate">{rupiah(totalPaymentsAmount)}</h4>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200/85 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded bg-indigo-50 flex items-center justify-center text-indigo-700 flex-shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Administrasi Lengkap</p>
                <h3 className="text-xs font-black text-slate-900 font-sans mt-0.5">{completeDocsCount} <span className="text-[10px] font-normal text-slate-400">Lengkap</span></h3>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200/85 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded bg-red-50 flex items-center justify-center text-red-650 flex-shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kekurangan Berkas</p>
                <h3 className="text-xs font-black text-slate-900 font-sans mt-0.5">{incompleteDocsCount} <span className="text-[10px] font-normal text-slate-400">Arsip</span></h3>
              </div>
            </div>
          </div>

          {/* Quick analytic charts / breakdown list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year distribution */}
            <div className="bg-white p-4 rounded-lg border border-slate-200/85 shadow-xs">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CalendarDays size={14} className="text-emerald-700" />
                Distribusi Jamaah per Tahun Haji
              </h3>
              <div className="space-y-3">
                {periodeList.map(p => {
                  const num = jamaahList.filter(j => j.periodeTahun === p.tahun).length;
                  const ratio = p.kuota > 0 ? Math.round((num / p.kuota) * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>Tahun `{p.tahun}</span>
                        <span>{num}/{p.kuota} ({ratio}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
                        <div className="bg-kbih-green h-full rounded" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Historical transaction logs */}
            <div className="bg-white p-4 rounded-lg border border-slate-200/85 shadow-xs">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Bookmark size={14} className="text-blue-750" />
                Ringkasan Transaksi Finansial Terbaru
              </h3>
              <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
                {paymentList.slice(0, 5).map(pay => {
                  const associatedJamaah = jamaahList.find(j => j.id === pay.jamaahId);
                  return (
                    <div key={pay.id} className="py-2 flex justify-between items-center text-[11px]">
                      <div>
                        <span className="font-bold font-sans text-blue-700 block">{pay.id}</span>
                        <span className="text-slate-700 font-bold">{associatedJamaah?.namaLengkap || 'Jamaah Mandiri'}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{pay.jenisSetoran} | {pay.tanggalTransaksi}</span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="font-black text-slate-900 block">{rupiah(pay.nominal)}</span>
                        <span className={`inline-block text-[9px] uppercase font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                          pay.status === 'Berhasil' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-100 text-amber-700'
                        }`}>{pay.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Laporan 1: Cetak Administrasi per Jamaah */}
          <div className="bg-white rounded-lg p-4 border border-slate-200/85 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <div className="inline-flex gap-1 items-center text-[9px] font-black uppercase tracking-wider text-blue-700">
                  <FileText size={12} />
                  Format Single Dossier
                </div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">A. Cetak Formulir Pendaftaran Mandiri</h3>
                <p className="text-[10px] text-slate-500">Cetak lembar data pendaftaran komplit untuk biodata, nomor porsi, kesehatan, imigrasi, dan tanda tangan KBIH.</p>
              </div>

              {formSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setFormSearchQuery('');
                  }}
                  className="text-[10px] text-rose-600 hover:text-rose-700 font-bold underline flex items-center gap-1 self-start md:self-auto"
                >
                  Reset Pencarian
                </button>
              )}
            </div>

            {/* Search Bar & Select Jamaah */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5 relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Nama, NIK, ID, No Porsi..."
                  value={formSearchQuery}
                  onChange={(e) => setFormSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-7 flex gap-2">
                <select
                  id="select-cetak-jamaah"
                  value={selectedJamaahId}
                  onChange={(e) => setSelectedJamaahId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
                >
                  <option value="">
                    {filteredJamaahForForm.length === 0
                      ? '-- Tidak Ditemukan Jamaah --'
                      : `-- Pilih Jamaah (${filteredJamaahForForm.length}) --`}
                  </option>
                  {filteredJamaahForForm.map(j => (
                    <option key={j.id} value={j.id}>
                      [{j.id}] {j.namaLengkap} ({j.periodeTahun})
                    </option>
                  ))}
                </select>

                <button
                  id="btn-cetak-per-jamaah"
                  disabled={!selectedJamaahId}
                  onClick={() => {
                    if (selectedJamaahForForm) onSelectPrintJamaah(selectedJamaahForForm);
                  }}
                  className={`py-1.5 px-3 rounded font-bold text-xs transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    selectedJamaahId
                      ? 'bg-kbih-green hover:bg-kbih-green-hover text-white shadow-xs cursor-pointer'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Printer size={13} />
                  Pratinjau & Cetak
                </button>
              </div>
            </div>

            {/* Info Box Jamaah Terpilih */}
            {selectedJamaahForForm && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[11px] font-sans">
                    {selectedJamaahForForm.id}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">{selectedJamaahForForm.namaLengkap}</span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      NIK: <span className="font-sans font-semibold text-slate-700">{selectedJamaahForForm.nik}</span> | No. Porsi: <span className="font-sans font-semibold text-blue-700">{selectedJamaahForForm.noPorsi || 'Belum Terbit'}</span> | Periode: <span className="font-semibold text-emerald-800">{selectedJamaahForForm.periodeTahun}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${selectedJamaahForForm.statusAdministrasi === 'Lengkap' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                    Berkas: {selectedJamaahForForm.statusAdministrasi}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedJamaahId('')}
                    className="text-[10px] text-slate-400 hover:text-slate-600 underline font-semibold"
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Laporan 2: Cetak Administrasi Per-Tanggal */}
          <div className="bg-white rounded-lg p-4 border border-slate-200/85 shadow-xs space-y-4">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
              <div>
                <div className="inline-flex gap-1 items-center text-[9px] font-black uppercase tracking-wider text-blue-755">
                  <Calendar size={12} />
                  Format Jurnal Register
                </div>
                <h3 className="text-xs font-bold text-slate-800 mt-0.5 uppercase tracking-wider">B. Cetak Rekapitulasi Jamaah Pasca Registrasi</h3>
                <p className="text-[10px] text-slate-500">Ekstrak sekumpulan jamaah yang mendaftarkan diri pada rentang tanggal kalender tertentu.</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  id="btn-export-excel-tanggal"
                  onClick={() => {
                    const headers = ['ID Jamaah', 'No. Porsi', 'Nama Lengkap', 'Bin/Binti', 'NIK', 'No. HP', 'Jenis Kelamin', 'Tanggal Lahir', 'Tempat Lahir', 'Status Administrasi', 'Tanggal Daftar'];
                    const rows = jamaahByDateRange.map(j => [
                      j.id,
                      j.noPorsi || '-',
                      j.namaLengkap,
                      j.binBinti || '-',
                      j.nik,
                      j.noHp,
                      j.jenisKelamin,
                      j.tanggalLahir || '-',
                      j.tempatLahir || '-',
                      j.statusAdministrasi,
                      j.tglPendaftaran
                    ]);
                    exportToCSV(headers, rows, `rekap_jamaah_pasca_registrasi_${startDate}_to_${endDate}.csv`);
                  }}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet size={13} />
                  Export Excel
                </button>
                <button
                  id="btn-cetak-per-tanggal"
                  onClick={() => onSelectPrintRegister(jamaahByDateRange, startDate, endDate)}
                  className="py-1.5 px-3 bg-kbih-green hover:bg-kbih-green-hover text-white rounded font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} />
                  Cetak Rekap Laporan ini
                </button>
              </div>
            </div>
            
            {/* Range Pickers */}
            <div className="flex flex-wrap gap-2.5 bg-slate-50 p-2 rounded-lg border border-slate-200/50 items-center">
              <div className="w-full sm:w-[150px]">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Mulai Tanggal</label>
                <input
                  id="filter-tanggal-mulai"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-0.5 bg-white border border-slate-250 rounded text-[11px] select-none outline-none font-sans"
                />
              </div>
              <div className="w-full sm:w-[150px]">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sampai Tanggal</label>
                <input
                  id="filter-tanggal-sampai"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-0.5 bg-white border border-slate-250 rounded text-[11px] select-none outline-none font-sans"
                />
              </div>
            </div>

            {/* List Preview */}
            <div className="border border-slate-205 rounded-lg overflow-hidden bg-white">
              <div className="bg-slate-50/70 p-2 text-[10px] font-bold text-slate-600 border-b border-slate-200 flex justify-between items-center">
                <span>Daftar Jamaah Registrasi Tgl: {startDate} s/d {endDate}</span>
                <span className="bg-kbih-green text-white px-2 py-0.5 rounded text-[9px] font-bold">{jamaahByDateRange.length} Data</span>
              </div>
              {jamaahByDateRange.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400">Tidak ada pendaftar pada rentang tanggal tersebut.</p>
              ) : (
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100/30 border-b border-slate-200">
                      <th className="p-2 font-bold text-slate-600">ID</th>
                      <th className="p-2 font-bold text-slate-600">No. Porsi</th>
                      <th className="p-2 font-bold text-slate-600">Nama Lengkap</th>
                      <th className="p-2 font-bold text-slate-600">NIK</th>
                      <th className="p-2 font-bold text-slate-600">No. HP</th>
                      <th className="p-2 font-bold text-slate-600">Tanggal Daftar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {jamaahByDateRange.map(j => (
                      <tr key={j.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 text-blue-750 font-bold">{j.id}</td>
                        <td className="p-2.5">{j.noPorsi || '-'}</td>
                        <td className="p-2.5 font-sans tracking-tight">{j.namaLengkap}</td>
                        <td className="p-2.5">{j.nik}</td>
                        <td className="p-2.5">{j.noHp}</td>
                        <td className="p-2.5 text-slate-500">{j.tglPendaftaran}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Laporan 3: Cetak Administrasi per Tahun (Sesuai Syarat User) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
              <div>
                <div className="inline-flex gap-1.5 items-center text-xs font-semibold uppercase tracking-wider text-blue-755">
                  <CalendarDays size={14} />
                  Format Direktori Tahunan (Per Tahun)
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">C. Cetak Administrasi Jamaah per Tahun Haji</h3>
                <p className="text-xs text-slate-500">Mencetak daftar utuh (seluruh jamaah) yang terregistrasi beserta data dokumen pendukung untuk tahun haji terpilih.</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  id="btn-export-excel-tahunan"
                  onClick={() => {
                    const headers = ['ID Jamaah', 'No. Porsi', 'Nama Lengkap', 'Bin/Binti', 'NIK', 'No. HP', 'Jenis Kelamin', 'Tanggal Lahir', 'Tempat Lahir', 'No. Paspor', 'Kantor Imigrasi', 'Masa Berlaku Paspor', 'Tinggi Badan (cm)', 'Berat Badan (kg)', 'Riwayat Penyakit', 'Nama Mahram', 'Hubungan Mahram', 'Status Administrasi', 'Status Aktif', 'Tahun Haji'];
                    const rows = jamaahByYear.map(j => [
                      j.id,
                      j.noPorsi || '-',
                      j.namaLengkap,
                      j.binBinti || '-',
                      j.nik,
                      j.noHp,
                      j.jenisKelamin,
                      j.tanggalLahir || '-',
                      j.tempatLahir || '-',
                      j.noPaspor || '-',
                      j.kantorImigrasi || '-',
                      j.tglHabisPaspor || '-',
                      j.tinggiBadan || '-',
                      j.beratBadan || '-',
                      j.riwayatPenyakit || '-',
                      j.namaMahram || '-',
                      j.hubunganMahram || 'Mandiri',
                      j.statusAdministrasi,
                      j.statusAktif || 'Aktif',
                      j.periodeTahun
                    ]);
                    exportToCSV(headers, rows, `administrasi_jamaah_tahun_haji_${selectedPeriodYear}.csv`);
                  }}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border border-emerald-700/30"
                >
                  <FileSpreadsheet size={14} />
                  Export Excel
                </button>
                <button
                  id="btn-cetak-per-tahun"
                  onClick={() => onSelectPrintDirectory(jamaahByYear, selectedPeriodYear)}
                  className="py-2 px-5 bg-kbih-green hover:bg-kbih-green-hover text-white rounded font-bold text-xs transition flex items-center gap-2 cursor-pointer border border-[#155a30]/30 pointer-events-auto"
                >
                  <Printer size={14} />
                  Cetak Daftar Tahunan
                </button>
              </div>
            </div>

            {/* Year Selector */}
            <div className="flex gap-3 bg-slate-50 p-4 rounded-xl items-center">
              <span className="text-xs font-bold text-slate-650 uppercase">Filter Tahun Haji:</span>
              <select
                id="select-cetak-periode-tahun"
                value={selectedPeriodYear}
                onChange={(e) => setSelectedPeriodYear(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none"
              >
                {periodeList.map(p => (
                  <option key={p.id} value={p.tahun}>Tahun Haji {p.tahun} (Kuota: {p.kuota})</option>
                ))}
              </select>
            </div>

            {/* Printable List Preview */}
            <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-50/50 p-3 text-xs font-bold text-slate-650 border-b border-slate-100 flex justify-between">
                <span>Daftar Seluruh Jamaah Administrasi - Tahun Haji {selectedPeriodYear}</span>
                <span>{jamaahByYear.length} Jamaah Tergabung</span>
              </div>
              {jamaahByYear.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400">Belum ada jamaah yang dialokasikan di kelompok tahun haji {selectedPeriodYear}.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-150">
                      <th className="p-2.5 font-bold text-slate-600">ID</th>
                      <th className="p-2.5 font-bold text-slate-600">Nama Jamaah (Bin/Binti)</th>
                      <th className="p-2.5 font-bold text-slate-600">No. Porsi</th>
                      <th className="p-2.5 font-bold text-slate-600">KTP NIK</th>
                      <th className="p-2.5 font-bold text-slate-600">Paspor</th>
                      <th className="p-2.5 font-bold text-slate-600">Mahram</th>
                      <th className="p-2.5 font-bold text-slate-600 text-center">Status Berkas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jamaahByYear.map(j => (
                      <tr key={j.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-sans text-blue-750 font-bold">{j.id}</td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-800">{j.namaLengkap}</div>
                          <div className="text-[10px] text-slate-400">Bin/Bint: {j.binBinti}</div>
                        </td>
                        <td className="p-2.5 font-sans text-slate-700">{j.noPorsi || '--'}</td>
                        <td className="p-2.5 font-sans text-slate-500">{j.nik}</td>
                        <td className="p-2.5 font-sans text-slate-600">{j.noPaspor || 'No Paspor'}</td>
                        <td className="p-2.5 text-slate-600">{j.namaMahram ? `${j.namaMahram} (${j.hubunganMahram})` : 'Mandiri'}</td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            j.statusAdministrasi === 'Lengkap' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>{j.statusAdministrasi}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Laporan 4: Cetak Riwayat Pembayaran (Kwitansi) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-4">
            <div>
              <div className="inline-flex gap-1.5 items-center text-xs font-semibold uppercase tracking-wider text-blue-750">
                <Printer size={14} />
                Format Transaksi Kwitansi Cash / Verifikasi Murni
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">D. Cetak Bukti Kwitansi Transaksi (Per Pembayaran)</h3>
              <p className="text-xs text-slate-500">Cetak slip resmi transaksi setoran awal piutang, angsuran manasik, maupun pelunasan BPIH lunas tunda dlm model Kwitansi KBIH.</p>
            </div>
            
            <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150">
                    <th className="p-3 font-bold text-slate-600">ID TX</th>
                    <th className="p-3 font-bold text-slate-600">Nama Haji / Jamaah</th>
                    <th className="p-3 font-bold text-slate-600">Tanggal</th>
                    <th className="p-3 font-bold text-slate-600">Setoran</th>
                    <th className="p-3 font-bold text-slate-600">Nominal</th>
                    <th className="p-3 font-bold text-slate-600 text-center">Status</th>
                    <th className="p-3 font-bold text-slate-600 text-right">Ambil Kwitansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {paymentList.filter(p => p.status === 'Berhasil').map(p => {
                    const jamaah = jamaahList.find(j => j.id === p.jamaahId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-blue-700">{p.id}</td>
                        <td className="p-3 font-sans font-medium text-slate-800">
                          {jamaah ? jamaah.namaLengkap : <span className="text-rose-500 italic">Unknown</span>}
                        </td>
                        <td className="p-3 text-slate-500">{p.tanggalTransaksi}</td>
                        <td className="p-3">
                          <span className="font-sans px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">{p.jenisSetoran}</span>
                        </td>
                        <td className="p-3 font-bold text-slate-950">{rupiah(p.nominal)}</td>
                        <td className="p-3 text-center">
                          <span className="font-sans text-emerald-700 font-bold">Sukses</span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onSelectPrintReceipt(p)}
                            className="px-3 py-1 bg-white border border-slate-200 text-blue-700 font-sans hover:bg-blue-50 rounded text-xs font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Printer size={12} />
                            Buka Kwitansi
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
