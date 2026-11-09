import React, { useState } from 'react';
import { Payment, Jamaah } from '../types';
import { Plus, Search, HelpCircle, Receipt, Trash2, Edit2, CheckCircle, Clock, AlertTriangle, Printer, CreditCard } from 'lucide-react';

interface PembayaranManagerProps {
  paymentList: Payment[];
  jamaahList: Jamaah[];
  onAddPayment: (payment: Payment) => void;
  onUpdatePayment: (payment: Payment) => void;
  onDeletePayment: (id: string) => void;
  onSelectPrintReceipt: (payment: Payment) => void;
}

export default function PembayaranManager({
  paymentList,
  jamaahList,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onSelectPrintReceipt
}: PembayaranManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('Semua');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<Payment>>({
    id: '',
    jamaahId: '',
    jenisSetoran: 'Setoran Awal',
    nominal: 25000000,
    tanggalTransaksi: new Date().toISOString().split('T')[0],
    status: 'Berhasil',
    keterangan: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Currency Formatter
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handleOpenCreateForm = () => {
    setEditingPayment(null);
    const txId = 'TX-' + Math.floor(100000 + Math.random() * 900000);
    setFormState({
      id: txId,
      jamaahId: jamaahList[0]?.id || '',
      jenisSetoran: 'Setoran Awal',
      nominal: 25000000,
      tanggalTransaksi: new Date().toISOString().split('T')[0],
      status: 'Berhasil',
      keterangan: 'Setoran porsi awal Haji Mandiri s.d. porsi aman'
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (p: Payment) => {
    setEditingPayment(p);
    setFormState({ ...p });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formState.jamaahId) errors.jamaahId = 'Pilih jamaah terlebih dahulu';
    if (!formState.nominal || Number(formState.nominal) <= 0) {
      errors.nominal = 'Nominal transaksi harus bernilai positif';
    }
    if (!formState.tanggalTransaksi) errors.tanggalTransaksi = 'Pilih tanggal transaksi';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalPayment: Payment = {
      ...(formState as Payment),
      nominal: Number(formState.nominal)
    };

    if (editingPayment) {
      onUpdatePayment(finalPayment);
    } else {
      onAddPayment(finalPayment);
    }
    setIsFormOpen(false);
  };

  // Filter List
  const filteredPayments = paymentList.filter(p => {
    const jamaah = jamaahList.find(j => j.id === p.jamaahId);
    const namaJamaah = jamaah ? jamaah.namaLengkap.toLowerCase() : '';
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.jamaahId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      namaJamaah.includes(searchQuery.toLowerCase()) ||
      (p.keterangan || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'Semua' || p.jenisSetoran === filterType;

    return matchesSearch && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Berhasil':
        return <CheckCircle className="text-emerald-600" size={16} />;
      case 'Pending':
        return <Clock className="text-amber-500" size={16} />;
      default:
        return <AlertTriangle className="text-red-500" size={16} />;
    }
  };

  return (
    <div id="pembayaran-manager-section" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Dashboard</span>
          <span className="text-slate-300 text-xs">/</span>
          <h1 className="text-[11px] font-bold text-blue-750 uppercase tracking-wider">Manajemen Pembayaran (BPIH)</h1>
        </div>
        <div>
          <button
            id="btn-tambah-pembayaran"
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-kbih-green hover:bg-kbih-green-hover text-white font-bold text-xs rounded transition duration-155 shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            + Transaksi Baru
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-3 rounded-lg shadow-xs border border-slate-200/80 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            id="input-cari-pembayaran"
            type="text"
            placeholder="Cari transaksi berdasarkan ID, nama jamaah, atau keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500/30 font-sans transition"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jenis Setoran:</span>
          <select
            id="select-filter-setoran"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 outline-none"
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Setoran Awal">Setoran Awal</option>
            <option value="Cicilan">Cicilan</option>
            <option value="Pelunasan">Pelunasan</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Riwayat Setoran ({filteredPayments.length})</h2>
          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            SISKOHAT LIVE BANK SYNC
          </span>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-10 text-center">
            <CreditCard className="mx-auto text-slate-300 mb-2" size={36} />
            <h3 className="text-xs font-bold text-slate-700">Tidak ada riwayat pembayaran</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">Silakan klik tombol transaksi di atas untuk menginput setoran murni haji jamaah.</p>
          </div>
        ) : (
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600">
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID Transaksi</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama & ID Jamaah</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Pembayaran</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nominal</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-755">
                {filteredPayments.map((p) => {
                  const s = jamaahList.find(j => j.id === p.jamaahId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition">
                      <td className="p-2.5 font-sans font-bold text-blue-700">{p.id}</td>
                      <td className="p-2.5">
                        {s ? (
                          <div>
                            <div className="font-bold text-slate-800">{s.namaLengkap}</div>
                            <div className="text-[10px] text-slate-500 font-sans">{s.id} | Porsi: {s.noPorsi || '--'}</div>
                          </div>
                        ) : (
                          <span className="text-red-500 italic">Jamaah terhapus / tidak ditemukan</span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-500 font-sans">{p.tanggalTransaksi}</td>
                      <td className="p-2.5">
                        <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          p.jenisSetoran === 'Setoran Awal' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          p.jenisSetoran === 'Cicilan' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-emerald-100 text-emerald-850 border border-emerald-200'
                        }`}>
                          {p.jenisSetoran}
                        </span>
                      </td>
                      <td className="p-2.5 font-sans font-bold text-slate-900">{formatRupiah(p.nominal)}</td>
                      <td className="p-2.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          {p.status === 'Berhasil' ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold">LUNAS SUKSES</span>
                          ) : p.status === 'Pending' ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-bold">PROSES BANK</span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-bold">GAGAL</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5 text-right">
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            onClick={() => onSelectPrintReceipt(p)}
                            title="Cetak Bukti Kwitansi"
                            className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-blue-700 transition cursor-pointer"
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenEditForm(p)}
                            title="Edit Data Keuangan"
                            className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition cursor-pointer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus data transaksi ${p.id}?`)) {
                                onDeletePayment(p.id);
                              }
                            }}
                            title="Hapus Transaksi"
                            className="p-1 rounded text-slate-500 hover:bg-rose-50 hover:text-red-650 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DIALOG TRANSACTION FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded w-full max-w-lg shadow-xl overflow-hidden transition-all border border-slate-200">
            <div className="px-5 py-3 bg-gradient-to-r from-kbih-green to-kbih-green-hover text-white font-sans flex justify-between items-center border-b border-slate-200/50">
              <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-white">
                <Receipt size={14} />
                {editingPayment ? 'Ubah Data Setoran BPIH' : 'Input Transaksi Setoran Haji'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-white font-bold hover:text-slate-200 text-xs cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">ID Transaksi Unik</label>
                <input
                  type="text"
                  value={formState.id}
                  disabled
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-sans text-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pilih Jamaah Haji (Terdaftar) <span className="text-red-500">*</span></label>
                <select
                  id="form-pembayaran-jamaah"
                  value={formState.jamaahId}
                  onChange={(e) => setFormState(prev => ({ ...prev, jamaahId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${formErrors.jamaahId ? 'border-red-500 font-bold' : 'border-slate-200 font-medium'}`}
                >
                  <option value="">-- Pilih Jamaah --</option>
                  {jamaahList.map(j => (
                    <option key={j.id} value={j.id}>{j.namaLengkap} - NIK: {j.nik} ({j.periodeTahun})</option>
                  ))}
                </select>
                {formErrors.jamaahId && <p className="text-[10px] text-red-500 mt-1">{formErrors.jamaahId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Jenis Setoran BPIH</label>
                  <select
                    id="form-pembayaran-jenis"
                    value={formState.jenisSetoran}
                    onChange={(e) => setFormState(prev => ({ ...prev, jenisSetoran: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Setoran Awal">Setoran Awal (Porsi)</option>
                    <option value="Cicilan">Cicilan Pelengkap</option>
                    <option value="Pelunasan">Pelunasan BPIH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Keuangan</label>
                  <select
                    id="form-pembayaran-status"
                    value={formState.status}
                    onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Berhasil">Berhasil (Sukses)</option>
                    <option value="Pending">Pending (Verifikasi Bank)</option>
                    <option value="Gagal text-red-500 font-bold">Gagal / Ditolak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nominal Setoran (Rupiah) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold">Rp</div>
                  <input
                    id="form-pembayaran-nominal"
                    type="number"
                    value={formState.nominal || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, nominal: Number(e.target.value) }))}
                    placeholder="25000000"
                    className={`w-full pl-10 pr-4 py-1.5 border rounded text-xs font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 ${formErrors.nominal ? 'border-red-500' : 'border-slate-200'}`}
                  />
                </div>
                {formErrors.nominal ? (
                  <p className="text-[10px] text-red-500 mt-1">{formErrors.nominal}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">Saran: Rp 25.000.000 untuk setoran porsi awal Kemenag</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tanggal Transaksi Setor <span className="text-red-500">*</span></label>
                <input
                  id="form-pembayaran-tanggal"
                  type="date"
                  value={formState.tanggalTransaksi}
                  onChange={(e) => setFormState(prev => ({ ...prev, tanggalTransaksi: e.target.value }))}
                  className={`w-full px-3 py-1.5 border rounded text-xs font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 ${formErrors.tanggalTransaksi ? 'border-red-500' : 'border-slate-200'}`}
                />
                {formErrors.tanggalTransaksi && <p className="text-[10px] text-red-550 mt-1">{formErrors.tanggalTransaksi}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Keterangan / Berita Acara</label>
                <textarea
                  id="form-pembayaran-keterangan"
                  rows={2}
                  placeholder="Keterangan tambahan untuk slip KBIH"
                  value={formState.keterangan || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, keterangan: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-simpan-pembayaran"
                  className="px-5 py-2 bg-kbih-green hover:bg-kbih-green-hover text-white text-xs font-bold rounded transition cursor-pointer"
                >
                  {editingPayment ? 'Simpan' : 'Tambahkan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
