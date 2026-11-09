import React from 'react';
import { SystemState, Jamaah, HajiPeriod, Payment, UserAccount } from '../types';
import { Users, ClipboardList, Wallet, Calendar, ArrowRight, UserCheck, AlertCircle, Globe } from 'lucide-react';

interface DashboardProps {
  state: SystemState;
  setActiveTab: (tab: 'dashboard' | 'jamaah' | 'periode' | 'pembayaran' | 'departure' | 'report' | 'settings') => void;
  currentUser: UserAccount;
  onOpenOnlineModal?: () => void;
}

export default function Dashboard({ state, setActiveTab, currentUser, onOpenOnlineModal }: DashboardProps) {
  // 1. Calculate dynamic statistics
  const totalJamaah = state.jamaahList?.length || 0;

  // Active periods with status 'buka'
  const openPeriods = (state.periodeList || []).filter(p => p && p.status === 'buka');
  const totalActiveQuota = openPeriods.reduce((sum, p) => sum + (Number(p?.kuota) || 0), 0);
  
  // Count jamaah in those open periods
  const jamaahInOpenPeriods = (state.jamaahList || []).filter(j => 
    j && openPeriods.some(p => p && p.tahun === j.periodeTahun)
  ).length;
  
  const remainingQuota = Math.max(0, totalActiveQuota - jamaahInOpenPeriods);

  // Total successful payments
  const successfulPayments = (state.paymentList || []).filter(p => p && p.status === 'Berhasil');
  const totalPaymentNominal = successfulPayments.reduce((sum, p) => sum + (Number(p?.nominal) || 0), 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // 2. Get latest registrations (max 3-5)
  const sortedJamaah = [...(state.jamaahList || [])]
    .filter((j): j is Jamaah => Boolean(j))
    .sort((a, b) => String(b?.id || '').localeCompare(String(a?.id || '')))
    .slice(0, 5);

  const getStatusBadge = (j: Jamaah) => {
    if (j.statusAdministrasi === 'Lengkap') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-150">
          Aktif
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-150">
          Menunggu
        </span>
      );
    }
  };

  return (
    <div id="dashboard-wrapper" className="space-y-6">
      
      {/* BANNER CARD */}
      <div 
        id="welcome-banner"
        className="relative overflow-hidden bg-gradient-to-r from-[#0b4d2c] via-[#0e5c35] to-[#126b3e] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-[#0d4729]/30"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs sm:text-sm font-medium text-emerald-200 tracking-wider uppercase">Selamat Datang</p>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
              Sistem Pendaftaran Haji Mandiri
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 font-medium">
              {state.lembaga.namaLembaga} — {state.lembaga.namaPengelola}
            </p>
          </div>
          {onOpenOnlineModal && (
            <button
              onClick={onOpenOnlineModal}
              className="self-start sm:self-center px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl text-xs font-bold backdrop-blur-xs border border-white/25 shadow-sm transition flex items-center gap-2 cursor-pointer flex-shrink-0"
            >
              <Globe size={16} className="text-[#f59e0b]" />
              <span>Akses Online & QR Code</span>
            </button>
          )}
        </div>
        
        {/* Abstract background graphics to mimic modern app decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-emerald-400/10 rounded-full -mb-8 blur-lg pointer-events-none" />
      </div>

      {/* STATS GRID */}
      <div id="stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Jamaah */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-xs flex items-center gap-4 hover:border-emerald-300 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Users size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Jamaah</p>
            <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{totalJamaah}</p>
            <p className="text-xs text-slate-500 mt-0.5">jamaah terdaftar</p>
          </div>
        </div>

        {/* Stat 2: Kuota Tersisa */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-xs flex items-center gap-4 hover:border-emerald-300 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kuota Tersisa</p>
            <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{remainingQuota}</p>
            <p className="text-xs text-slate-500 mt-0.5">dari {totalActiveQuota} kuota aktif</p>
          </div>
        </div>

        {/* Stat 3: Total Pembayaran */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-xs flex items-center gap-4 hover:border-emerald-300 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Wallet size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pembayaran</p>
            <p className="text-lg font-black text-slate-900 leading-tight mt-1 truncate" title={formatRupiah(totalPaymentNominal)}>
              {formatRupiah(totalPaymentNominal)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{successfulPayments.length} transaksi lunas</p>
          </div>
        </div>

        {/* Stat 4: Periode Aktif */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-xs flex items-center gap-4 hover:border-emerald-300 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Calendar size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Periode Aktif</p>
            <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{openPeriods.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">periode sedang buka</p>
          </div>
        </div>

      </div>

      {/* LOWER CONTENT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Pendaftaran Terbaru */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs flex flex-col lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 tracking-tight">Pendaftaran Terbaru</h3>
            <button 
              onClick={() => setActiveTab('jamaah')}
              className="text-xs font-bold text-[#0b4d2c] hover:text-[#0e5c35] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Lihat Semua <ArrowRight size={13} />
            </button>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {sortedJamaah.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3">Nama</th>
                    <th className="p-3">No. Porsi</th>
                    <th className="p-3">Tgl. Daftar</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sortedJamaah.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <div>
                          <p className="font-bold text-slate-800">{j.namaLengkap}</p>
                          <p className="text-[10px] font-sans text-slate-400 mt-0.5">{j.id}</p>
                        </div>
                      </td>
                      <td className="p-3 font-sans text-slate-600">
                        {j.noPorsi || <span className="text-slate-400 italic">Belum Ada</span>}
                      </td>
                      <td className="p-3 text-slate-500">
                        {j.tglPendaftaran}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(j)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <p className="font-medium">Belum ada data pendaftaran jamaah.</p>
                <button 
                  onClick={() => setActiveTab('jamaah')}
                  className="mt-2.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#0b4d2c] border border-emerald-150 rounded text-xs font-bold transition cursor-pointer"
                >
                  Tambah Jamaah Baru
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Kuota Per Periode */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 tracking-tight">Kuota Per Periode</h3>
            <button 
              onClick={() => setActiveTab('periode')}
              className="text-xs font-bold text-[#0b4d2c] hover:text-[#0e5c35] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Kelola <ArrowRight size={13} />
            </button>
          </div>
          
          <div className="p-4 flex-1 space-y-4">
            {(state.periodeList || []).length > 0 ? (
              [...(state.periodeList || [])]
                .filter((p): p is HajiPeriod => Boolean(p && p.tahun))
                .sort((a, b) => String(b?.tahun || '').localeCompare(String(a?.tahun || '')))
                .slice(0, 4)
                .map((period) => {
                  const filled = (state.jamaahList || []).filter(j => j && j.periodeTahun === period.tahun).length;
                  const ratio = Math.min(100, (Number(period.kuota) || 0) > 0 ? (filled / period.kuota) * 100 : 0);
                  const isClosed = period.status === 'tutup';
                  
                  return (
                    <div key={period.id} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-800">Haji {period.tahun}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isClosed 
                            ? 'bg-rose-50 text-rose-700 border-rose-150' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-150'
                        }`}>
                          {isClosed ? 'Tutup' : 'Buka'}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isClosed ? 'bg-rose-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>{filled} terisi</span>
                        <span>{period.kuota} kuota</span>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6 text-center">
                <p className="font-medium text-xs">Belum ada periode pendaftaran haji.</p>
                <button 
                  onClick={() => setActiveTab('periode')}
                  className="mt-2 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#0b4d2c] border border-emerald-150 rounded text-[11px] font-bold transition cursor-pointer"
                >
                  Tambah Periode
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
