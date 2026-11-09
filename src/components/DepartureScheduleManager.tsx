import React, { useState } from 'react';
import { DepartureSchedule, Jamaah } from '../types';
import { Plus, Calendar, Users, Edit2, Trash2, CheckCircle2, AlertCircle, Search, FileText, Check, Undo2 } from 'lucide-react';

interface DepartureScheduleManagerProps {
  departureScheduleList: DepartureSchedule[];
  jamaahList: Jamaah[];
  onAddSchedule: (schedule: DepartureSchedule) => void;
  onUpdateSchedule: (schedule: DepartureSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onMarkAsDeparted: (scheduleId: string, jamaahId: string, departState: boolean) => void;
}

export default function DepartureScheduleManager({
  departureScheduleList = [],
  jamaahList = [],
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onMarkAsDeparted
}: DepartureScheduleManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DepartureSchedule | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Form states
  const [formState, setFormState] = useState<Partial<DepartureSchedule>>({
    id: '',
    jamaahId: '',
    tanggalKeberangkatan: '',
    tahunKeberangkatan: '',
    status: 'Draft',
    keterangan: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill year of flight based on chosen pilgrim
  const handleJamaahChange = (jId: string) => {
    const pilgrim = jamaahList.find(j => j.id === jId);
    setFormState(prev => ({
      ...prev,
      jamaahId: jId,
      tahunKeberangkatan: pilgrim ? pilgrim.periodeTahun : prev.tahunKeberangkatan || String(new Date().getFullYear())
    }));
  };

  const handleOpenCreate = () => {
    setEditingSchedule(null);
    
    // First active pilgrim as initial choice if available
    const activePilgrims = jamaahList.filter(j => j.statusAktif !== 'Tidak Aktif');
    const firstActiveId = activePilgrims.length > 0 ? activePilgrims[0].id : '';
    const initialYear = activePilgrims.length > 0 ? activePilgrims[0].periodeTahun : String(new Date().getFullYear());

    setFormState({
      id: 'DS-' + Math.floor(100000 + Math.random() * 900000).toString(),
      jamaahId: firstActiveId,
      tanggalKeberangkatan: new Date().toISOString().split('T')[0],
      tahunKeberangkatan: initialYear,
      status: 'Draft',
      keterangan: ''
    });
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ds: DepartureSchedule) => {
    setEditingSchedule(ds);
    setFormState({ ...ds });
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.jamaahId) {
      setErrorMsg('Pilih Jamaah terlebih dahulu.');
      return;
    }
    if (!formState.tanggalKeberangkatan) {
      setErrorMsg('Tanggal keberangkatan wajib diisi.');
      return;
    }
    if (!formState.tahunKeberangkatan || formState.tahunKeberangkatan.length !== 4 || isNaN(Number(formState.tahunKeberangkatan))) {
      setErrorMsg('Tahun keberangkatan harus berupa 4 digit angka.');
      return;
    }

    const finalSchedule: DepartureSchedule = {
      id: formState.id || 'DS-' + Math.floor(100000 + Math.random() * 900000).toString(),
      jamaahId: formState.jamaahId,
      tanggalKeberangkatan: formState.tanggalKeberangkatan,
      tahunKeberangkatan: formState.tahunKeberangkatan,
      status: formState.status as 'Draft' | 'Diberangkatkan' || 'Draft',
      keterangan: formState.keterangan || ''
    };

    if (editingSchedule) {
      onUpdateSchedule(finalSchedule);
    } else {
      onAddSchedule(finalSchedule);
    }
    setIsFormOpen(false);
  };

  const handleToggleDepartStatus = (ds: DepartureSchedule) => {
    const isDeparting = ds.status === 'Draft';
    const confirmMsg = isDeparting
      ? `Apakah Anda yakin ingin memberangkatkan jamaah ${getJamaahName(ds.jamaahId)}?\nSetelah diberangkatkan, status keaktifan jamaah ini akan otomatis berubah menjadi TIDAK AKTIF.`
      : `Batalkan status keberangkatan jamaah ${getJamaahName(ds.jamaahId)}?\nStatus keaktifan jamaah akan dikembalikan menjadi AKTIF.`;
    
    if (window.confirm(confirmMsg)) {
      onMarkAsDeparted(ds.id, ds.jamaahId, isDeparting);
    }
  };

  const handleRemove = (id: string, jamaahId: string, status: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jadwal keberangkatan ini?')) {
      // If deleted while already Diberangkatkan, make the pilgrim active again
      if (status === 'Diberangkatkan') {
        onMarkAsDeparted(id, jamaahId, false);
      }
      onDeleteSchedule(id);
    }
  };

  // Helpers
  const getJamaahName = (jId: string) => {
    const p = jamaahList.find(j => j.id === jId);
    return p ? p.namaLengkap : 'Tidak Ditemukan';
  };

  const getJamaahDetail = (jId: string) => {
    const p = jamaahList.find(j => j.id === jId);
    if (!p) return null;
    return {
      nik: p.nik,
      noPorsi: p.noPorsi,
      binBinti: p.binBinti,
      noHp: p.noHp
    };
  };

  // Get unique flight years present in scheduled list for filters
  const uniqueYears = Array.from(new Set((departureScheduleList || []).map(item => item?.tahunKeberangkatan).filter(Boolean))).sort();

  // Filter schedules
  const filteredSchedules = departureScheduleList.filter(item => {
    const pilgrimName = getJamaahName(item.jamaahId).toLowerCase();
    const matchesSearch = pilgrimName.includes(searchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = filterYear === 'Semua' || item.tahunKeberangkatan === filterYear;
    const matchesStatus = filterStatus === 'Semua' || item.status === filterStatus;
    
    return matchesSearch && matchesYear && matchesStatus;
  });

  // Stats calculation
  const totalSchedules = departureScheduleList.length;
  const totalDraft = departureScheduleList.filter(s => s.status === 'Draft').length;
  const totalDeparted = departureScheduleList.filter(s => s.status === 'Diberangkatkan').length;

  // Filter pilgrim list for the dropdown select inside modal
  // To keep it healthy, we allow active pilgrims, plus the pilgrim currently selected for this schedule in edit mode
  const eligiblePilgrims = jamaahList.filter(j => {
    if (j.statusAktif !== 'Tidak Aktif') return true;
    if (editingSchedule && j.id === editingSchedule.jamaahId) return true;
    return false;
  });

  return (
    <div id="schedule-manager-section" className="space-y-4">
      {/* Header Panel with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white px-4 py-3 rounded-lg shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-kbih-green flex items-center justify-center border border-emerald-150">
            <Calendar size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight">Jadwal Keberangkatan</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Sistem Pengaturan Keberangkatan Haji & Mutasi Keaktifan</p>
          </div>
        </div>
        
        {/* Actions */}
        <button
          id="btn-tambah-jadwal"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-kbih-green hover:bg-kbih-green-hover text-white font-bold text-xs rounded transition duration-150 shadow-xs cursor-pointer self-start md:self-auto"
        >
          <Plus size={14} />
          + Tambah Jadwal
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Terdaftar Jadwal</p>
            <h3 className="text-lg font-black text-slate-800 leading-tight">{totalSchedules} <span className="text-xs text-slate-500 font-normal">Jamaah</span></h3>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <FileText size={18} />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Status Draft</p>
            <h3 className="text-lg font-black text-slate-800 leading-tight">{totalDraft} <span className="text-xs text-slate-500 font-normal">Belum Berangkat</span></h3>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-kbih-green rounded-lg">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sudah Diberangkatkan</p>
            <h3 className="text-lg font-black text-slate-800 leading-tight">{totalDeparted} <span className="text-xs text-slate-500 font-normal">Sudah Berangkat</span></h3>
          </div>
        </div>
      </div>

      {/* Control Filters panel */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
          <input
            id="input-cari-jadwal"
            type="text"
            placeholder="Cari berdasarkan nama jamaah atau ID jadwal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500/30 font-sans transition"
          />
        </div>
        <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tahun Terbang:</span>
            <select
              id="select-filter-tahun-terbang"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Tahun</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>Tahun {year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status:</span>
            <select
              id="select-filter-status-keberangkatan"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Status</option>
              <option value="Draft">Draft (Belum Berangkat)</option>
              <option value="Diberangkatkan">Sudah Diberangkatkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table List representation */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Jadwal Penerbangan ({filteredSchedules.length} Daftar)</h2>
          <span className="text-[10px] bg-emerald-50 text-kbih-green px-2 py-0.5 border border-emerald-200 rounded font-bold uppercase">Mutasi Status Keberangkatan</span>
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="p-10 text-center">
            <Calendar className="mx-auto text-slate-300 mb-2" size={36} />
            <h3 className="text-xs font-bold text-slate-700">Tidak ada jadwal keberangkatan</h3>
            <p className="text-slate-400 text-xs mt-1">Silakan klik Tambah Jadwal untuk mengatur penerbangan jamaah.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200">
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID Jadwal</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profil Jamaah</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keberangkatan</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keterangan</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredSchedules.map((ds) => {
                  const details = getJamaahDetail(ds.jamaahId);
                  return (
                    <tr key={ds.id} className="hover:bg-slate-50/30 transition">
                      <td className="p-2.5">
                        <span className="font-sans font-bold text-slate-700 bg-slate-100/80 px-1.5 py-0.5 border border-slate-200 rounded text-[10px]">
                          {ds.id}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <div>
                          <span className="font-bold text-slate-800 text-xs leading-none">
                            {getJamaahName(ds.jamaahId)}
                          </span>
                          {details && (
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-sans leading-tight">
                              Bin/Binti: <span className="font-medium text-slate-600">{details.binBinti || '-'}</span> | NIK: <span className="font-sans text-slate-500">{details.nik}</span>
                            </span>
                          )}
                        </div>
                        {details && (
                          <div className="text-[10px] text-blue-700 mt-1 flex items-center gap-1 leading-none font-bold">
                            <span className="bg-blue-50 border border-blue-200 px-1 rounded text-[9px]">Porsi: {details.noPorsi || '-'}</span>
                            <span className="text-slate-400 font-normal">Telp: {details.noHp}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-2.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 leading-tight">Tanggal: {ds.tanggalKeberangkatan}</span>
                          <span className="text-[10px] text-slate-400 font-bold mt-0.5">Tahun Penerbangan: {ds.tahunKeberangkatan}</span>
                        </div>
                      </td>
                      <td className="p-2.5 text-center">
                        {ds.status === 'Diberangkatkan' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-kbih-green border border-emerald-250 uppercase tracking-wider">
                            <CheckCircle2 size={10} />
                            Sudah Berangkat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                            <AlertCircle size={10} />
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span className="text-slate-500 block max-w-[200px] truncate" title={ds.keterangan}>
                          {ds.keterangan || <span className="text-slate-300 italic">Tidak ada catatan</span>}
                        </span>
                      </td>
                      <td className="p-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Action button to trigger departing mutasi */}
                          {ds.status === 'Draft' ? (
                            <button
                              onClick={() => handleToggleDepartStatus(ds)}
                              title="Tandai Sudah Diberangkatkan (Mutasi Tidak Aktif)"
                              className="px-2 py-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95 rounded flex items-center gap-1 transition cursor-pointer"
                            >
                              <Check size={12} />
                              Berangkatkan
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleDepartStatus(ds)}
                              title="Kembalikan status ke Draft & Aktifkan Kembali Jamaah"
                              className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-205 border border-slate-300 rounded flex items-center gap-1 transition cursor-pointer"
                            >
                              <Undo2 size={12} />
                              Batalkan
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(ds)}
                            className="p-1 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Ubah Jadwal"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleRemove(ds.id, ds.jamaahId, ds.status)}
                            className="p-1 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Hapus Jadwal"
                          >
                            <Trash2 size={12} />
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

      {/* Creation & Editing Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded w-full max-w-md shadow-xl overflow-hidden transition-all border border-slate-200">
            <div className="px-6 py-4 bg-gradient-to-r from-kbih-green to-kbih-green-hover text-white font-sans flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                <Calendar size={18} />
                {editingSchedule ? 'Ubah Rencana Keberangkatan' : 'Tambah Rencana Keberangkatan'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-white hover:text-slate-200 text-sm font-bold bg-white/10 hover:bg-white/20 w-6 h-6 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-650 border border-red-200 text-xs font-bold rounded flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Pilgrim/Jamaah Pick Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Jamaah Haji
                </label>
                <select
                  disabled={!!editingSchedule}
                  value={formState.jamaahId}
                  onChange={(e) => handleJamaahChange(e.target.value)}
                  className="w-full px-2.5 py-1.8 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 font-bold disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer"
                >
                  <option value="" disabled>-- Pilih Jamaah --</option>
                  {eligiblePilgrims.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.namaLengkap} - {j.id} ({j.statusAktif === 'Tidak Aktif' ? 'Tidak Aktif' : 'Aktif'})
                    </option>
                  ))}
                  {eligiblePilgrims.length === 0 && (
                    <option value="" disabled>Tidak ada jamaah aktif tersedia</option>
                  )}
                </select>
                <p className="text-[9px] text-slate-400 mt-1">
                  * Hanya mendaftar jamaah yang saat ini berstatus **AKTIF** (belum pernah diberangkatkan).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Tanggal Keberangkatan */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal Terbang
                  </label>
                  <input
                    type="date"
                    value={formState.tanggalKeberangkatan}
                    onChange={(e) => setFormState({ ...formState, tanggalKeberangkatan: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                </div>

                {/* Tahun Keberangkatan */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tahun Terbang (Haji)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="YYYY"
                    value={formState.tahunKeberangkatan}
                    onChange={(e) => setFormState({ ...formState, tahunKeberangkatan: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Current Status Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Status Awal Rencana
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Draft"
                      checked={formState.status === 'Draft'}
                      onChange={() => setFormState({ ...formState, status: 'Draft' })}
                      className="accent-emerald-650"
                    />
                    <span>Draft</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Diberangkatkan"
                      checked={formState.status === 'Diberangkatkan'}
                      onChange={() => setFormState({ ...formState, status: 'Diberangkatkan' })}
                      className="accent-emerald-650"
                    />
                    <span>Langsung Berangkatkan</span>
                  </label>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Keterangan / Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={formState.keterangan || ''}
                  onChange={(e) => setFormState({ ...formState, keterangan: e.target.value })}
                  placeholder="Misal: Kloter 10 Embarkasi Jakarta, Maskapai Garuda Indonesia GA-812..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-simpan-jadwal"
                  className="px-5 py-2 bg-kbih-green hover:bg-kbih-green-hover text-white text-xs font-bold rounded transition cursor-pointer"
                >
                  {editingSchedule ? 'Simpan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
