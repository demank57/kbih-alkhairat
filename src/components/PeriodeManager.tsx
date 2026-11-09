import React, { useState } from 'react';
import { HajiPeriod, Jamaah } from '../types';
import { Plus, ToggleLeft, ToggleRight, Calendar, Users, BarChart3, Edit2, Trash2 } from 'lucide-react';

interface PeriodeManagerProps {
  periodeList: HajiPeriod[];
  jamaahList: Jamaah[];
  onAddPeriode: (periode: HajiPeriod) => void;
  onUpdatePeriode: (periode: HajiPeriod) => void;
  onDeletePeriode: (id: string) => void;
}

export default function PeriodeManager({
  periodeList,
  jamaahList,
  onAddPeriode,
  onUpdatePeriode,
  onDeletePeriode
}: PeriodeManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPeriode, setEditingPeriode] = useState<HajiPeriod | null>(null);

  const [formState, setFormState] = useState<Partial<HajiPeriod>>({
    id: '',
    tahun: '',
    kuota: 200,
    status: 'buka'
  });

  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenCreate = () => {
    setEditingPeriode(null);
    const nextYear = String(new Date().getFullYear());
    setFormState({
      id: 'P-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      tahun: nextYear,
      kuota: 200,
      status: 'buka'
    });
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: HajiPeriod) => {
    setEditingPeriode(p);
    setFormState({ ...p });
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.tahun || !formState.kuota) {
      setErrorMsg('Tahun dan Kuota wajib diisi.');
      return;
    }
    
    if (isNaN(Number(formState.tahun)) || formState.tahun.length !== 4) {
      setErrorMsg('Tahun harus berupa 4 digit angka.');
      return;
    }

    if (Number(formState.kuota) <= 0) {
      setErrorMsg('Kuota harus bernilai positif.');
      return;
    }

    // Check for duplicate year in other records
    const isDuplicate = periodeList.some(p => p.tahun === formState.tahun && p.id !== formState.id);
    if (isDuplicate) {
      setErrorMsg(`Periode tahun ${formState.tahun} sudah ada di dalam sistem.`);
      return;
    }

    const finalPeriod: HajiPeriod = {
      ...(formState as HajiPeriod),
      kuota: Number(formState.kuota)
    };

    if (editingPeriode) {
      onUpdatePeriode(finalPeriod);
    } else {
      onAddPeriode(finalPeriod);
    }
    setIsFormOpen(false);
  };

  const handleToggleStatus = (p: HajiPeriod) => {
    onUpdatePeriode({
      ...p,
      status: p.status === 'buka' ? 'tutup' : 'buka'
    });
  };

  // Helper to count registered pilgrims for a specific year
  const getRegisteredCount = (tahun: string) => {
    return jamaahList.filter(j => j.periodeTahun === tahun).length;
  };

  return (
    <div id="periode-manager-section" className="space-y-4">
      {/* Header Panel */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Dashboard</span>
          <span className="text-slate-300 text-xs">/</span>
          <h1 className="text-[11px] font-bold text-blue-750 uppercase tracking-wider">Manajemen Periode Haji</h1>
        </div>
        <div>
          <button
            id="btn-tambah-periode"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-kbih-green hover:bg-kbih-green-hover text-white font-bold text-xs rounded transition duration-150 shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            + Tambah Periode
          </button>
        </div>
      </div>

      {/* Grid of current active year and stat limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {periodeList.map(p => {
          const registered = getRegisteredCount(p.tahun);
          const percent = Math.min(100, Math.round((registered / p.kuota) * 100));
          
          return (
            <div key={p.id} className="bg-white rounded-lg border border-slate-200/80 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              {/* background design accent */}
              <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 bg-blue-55 w-24 h-24 rounded-full opacity-45 pointer-events-none" />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 text-blue-800">
                    <Calendar size={15} />
                    <span className="font-bold text-xs text-slate-800">Keberangkatan {p.tahun}</span>
                  </div>
                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${p.status === 'buka' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-red-50 text-red-750 border border-red-105'}`}>
                    {p.status === 'buka' ? 'Aktiv / Buka' : 'Ditutup'}
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Terdaftar: <strong className="text-slate-900 font-bold font-sans">{registered}</strong> Jamaah</span>
                    <span>Kuota Maks: <strong className="text-slate-900 font-bold font-sans">{p.kuota}</strong></span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${percent > 90 ? 'bg-red-500' : percent > 50 ? 'bg-amber-500' : 'bg-blue-600'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Pemakaian Kuota: {percent}%</span>
                    <span>Sisa Slot: {p.kuota - registered}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleToggleStatus(p)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition cursor-pointer"
                  title="Ubah Status Registrasi"
                >
                  {p.status === 'buka' ? (
                    <>
                      <ToggleRight size={20} className="text-blue-600" />
                      <span>Ubah ke Tutup</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={20} className="text-slate-400" />
                      <span>Ubah ke Buka</span>
                    </>
                  )}
                </button>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 hover:bg-slate-50 rounded text-blue-600 transition"
                    title="Ubah Kuota"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus periode keberangkatan haji tahun ${p.tahun}? Ini tidak dapat dibatalkan.`)) {
                        onDeletePeriode(p.id);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 rounded text-rose-600 transition"
                    title="Hapus Periode"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FORM MODAL & TOGGLES */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded w-full max-w-md shadow-xl overflow-hidden transition-all border border-slate-200">
            <div className="px-6 py-4 bg-gradient-to-r from-kbih-green to-kbih-green-hover text-white font-sans flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                <Calendar size={18} />
                {editingPeriode ? 'Ubah Periode Haji' : 'Buat Periode Baru'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-white font-bold hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded text-rose-750 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tahun Keberangkatan Haji</label>
                <input
                  id="form-periode-tahun"
                  type="text"
                  placeholder="Contoh: 2026"
                  maxLength={4}
                  value={formState.tahun}
                  onChange={(e) => setFormState(prev => ({ ...prev, tahun: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kuota Maksimal (Jiwa)</label>
                <input
                  id="form-periode-kuota"
                  type="number"
                  placeholder="Contoh: 250"
                  value={formState.kuota || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, kuota: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Pembukaan</label>
                <select
                  id="form-periode-status"
                  value={formState.status}
                  onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value as 'buka' | 'tutup' }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                >
                  <option value="buka">Buka Registrasi (Aktif)</option>
                  <option value="tutup">Tutup Registrasi</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-simpan-periode"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-semibold rounded-xl transition"
                >
                  {editingPeriode ? 'Simpan' : 'Tambahkan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
