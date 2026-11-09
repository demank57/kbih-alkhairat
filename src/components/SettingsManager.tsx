import React, { useState, useRef } from 'react';
import { LembagaConfig, UserAccount, SystemState } from '../types';
import { Shield, Plus, Building, UserCheck, Trash2, Database, Download, Upload, CheckCircle2, AlertCircle, Edit2, Image, X, Globe, QrCode, ExternalLink, Copy, Check } from 'lucide-react';

interface SettingsManagerProps {
  lembaga: LembagaConfig;
  accounts: UserAccount[];
  onUpdateLembaga: (config: LembagaConfig) => void;
  onAddAccount: (acc: UserAccount) => void;
  onUpdateAccount: (acc: UserAccount) => void;
  onDeleteAccount: (id: string) => void;
  onExportDB: () => void;
  onImportDB: (importedState: SystemState) => void;
  onClearDB: () => void;
  onOpenOnlineAccess?: () => void;
}

export default function SettingsManager({
  lembaga,
  accounts,
  onUpdateLembaga,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onExportDB,
  onImportDB,
  onClearDB,
  onOpenOnlineAccess
}: SettingsManagerProps) {
  // Config state
  const [instName, setInstName] = useState(lembaga.namaLembaga);
  const [instLeader, setInstLeader] = useState(lembaga.namaPengelola);
  const [instPhone, setInstPhone] = useState(lembaga.noHp);
  const [instAddress, setInstAddress] = useState(lembaga.alamat);
  const [instLogo, setInstLogo] = useState(lembaga.logo || '');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Compress & Resize image to keep Firestore doc small and fast
  const resizeAndSetLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setInstLogo(compressedBase64);
        } else {
          setInstLogo(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa berkas gambar (PNG/JPG/JPEG).');
        return;
      }
      resizeAndSetLogo(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa berkas gambar (PNG/JPG/JPEG).');
        return;
      }
      resizeAndSetLogo(file);
    }
  };

  // Account edit/add states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedEditAccount, setSelectedEditAccount] = useState<UserAccount | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newRealName, setNewRealName] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Pengelola'>('Pengelola');
  const [accountError, setAccountError] = useState('');

  // File import reference
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateLembagaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName || !instLeader || !instPhone) {
      alert('Nama Lembaga, Nama Pengelola, dan No HP wajib diisi.');
      return;
    }
    onUpdateLembaga({
      namaLembaga: instName,
      namaPengelola: instLeader,
      noHp: instPhone,
      alamat: instAddress,
      logo: instLogo
    });
    setSaveSuccessMsg('Informasi lembaga KBIH berhasil diperbarui.');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleOpenAddModal = () => {
    setSelectedEditAccount(null);
    setNewUsername('');
    setNewRealName('');
    setNewRole('Pengelola');
    setAccountError('');
    setIsAccountModalOpen(true);
  };

  const handleOpenEditModal = (acc: UserAccount) => {
    setSelectedEditAccount(acc);
    setNewUsername(acc.username);
    setNewRealName(acc.nama);
    setNewRole(acc.peran);
    setAccountError('');
    setIsAccountModalOpen(true);
  };

  const handleAccountFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newRealName) {
      setAccountError('Semua kolom wajib diisi.');
      return;
    }

    const isDuplicate = accounts.some(a => 
      (!selectedEditAccount || a.id !== selectedEditAccount.id) && 
      a.username.toLowerCase() === newUsername.toLowerCase()
    );

    if (isDuplicate) {
      setAccountError('Username sudah terdaftar.');
      return;
    }

    if (selectedEditAccount) {
      onUpdateAccount({
        id: selectedEditAccount.id,
        username: newUsername,
        nama: newRealName,
        peran: newRole
      });
    } else {
      onAddAccount({
        id: 'ACC-' + Math.floor(Math.random() * 100).toString().padStart(2, '0'),
        username: newUsername,
        nama: newRealName,
        peran: newRole
      });
    }

    setNewUsername('');
    setNewRealName('');
    setNewRole('Pengelola');
    setAccountError('');
    setSelectedEditAccount(null);
    setIsAccountModalOpen(false);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          // Simple validation of parsed keys
          if (parsed.jamaahList && parsed.periodeList && parsed.paymentList) {
            onImportDB(parsed);
            alert('Database berhasil diimpor! Seluruh data pendaftaran dan keuangan telah disinkronkan.');
          } else {
            alert('Gagal mengimpor file: Struktur berkas cadangan database tidak valid.');
          }
        } catch (err) {
          alert('Format JSON cadangan cacat atau rusak.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div id="settings-manager-section" className="space-y-4 font-sans">
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Dashboard</span>
          <span className="text-slate-300 text-xs">/</span>
          <h1 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Pengaturan Sistem (Administratif)</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: KBIH Profile */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 text-blue-700">
            <Building size={15} />
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800">A. Lembaga KBIH / Yayasan</h2>
          </div>

          <form onSubmit={handleUpdateLembagaSubmit} className="space-y-3">
            {saveSuccessMsg && (
              <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-855 text-[11px] font-semibold rounded flex items-center gap-1">
                <CheckCircle2 size={12} />
                {saveSuccessMsg}
              </div>
            )}

            {/* Logo Upload & Preview Zone */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Logo Lembaga / KBIH / Yayasan</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => logoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3.5 flex flex-col justify-center items-center gap-2 cursor-pointer transition ${
                  isDragOver ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                
                {instLogo ? (
                  <div className="relative group/logo w-24 h-24 flex items-center justify-center bg-white rounded-lg border border-slate-200 p-1">
                    <img
                      src={instLogo}
                      alt="Logo Lembaga"
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInstLogo('');
                        if (logoInputRef.current) logoInputRef.current.value = '';
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1.5 shadow-md transition transform hover:scale-115"
                      title="Hapus Logo"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center py-1.5">
                    <Image size={22} className="text-slate-400 group-hover:scale-105 transition" />
                    <span className="text-[10px] font-bold text-blue-700">Tarik gambar logo ke sini atau klik untuk memilih</span>
                    <span className="text-[9px] text-slate-400 font-medium">Format: PNG, JPG, JPEG (Akan dikompresi otomatis)</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Nama Lembaga KBIH / Yayasan</label>
              <input
                id="input-setting-nama"
                type="text"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="Misal: KBIH Al-Mabrur Mandiri"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Nama Pengelola / Ketua KBIH</label>
              <input
                id="input-setting-pengelola"
                type="text"
                value={instLeader}
                onChange={(e) => setInstLeader(e.target.value)}
                placeholder="Misal: H. Mustofa Kamal, M.Ag"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Nomor Handphone Kantor KBIH</label>
              <input
                id="input-setting-hp"
                type="text"
                value={instPhone}
                onChange={(e) => setInstPhone(e.target.value)}
                placeholder="Misal: 081122339900"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Alamat Lembaga Utama</label>
              <textarea
                id="input-setting-alamat"
                rows={2}
                value={instAddress}
                onChange={(e) => setInstAddress(e.target.value)}
                placeholder="Tuliskan nama jalan, kota, provinsi"
                className="w-full px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
              />
            </div>

            <button
              id="btn-simpan-instansi"
              type="submit"
              className="w-full py-2 bg-kbih-green hover:bg-kbih-green-hover text-white font-bold text-xs rounded transition duration-150 cursor-pointer"
            >
              Simpan Profil KBIH
            </button>
          </form>
        </div>

        {/* Section 2: Account Managers */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 text-blue-755">
            <div className="flex items-center gap-2">
              <Shield size={15} />
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800">B. Operator & Pengelola Akun</h2>
            </div>
            <button
              id="btn-tambah-akun"
              onClick={handleOpenAddModal}
              className="px-2 py-1 text-xs font-bold text-white bg-kbih-green hover:bg-kbih-green-hover rounded flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              Akun Baru
            </button>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">Berikut adalah daftar pejabat pendaftaran yang diizinkan memproses data atau menyinkronkan data dengan sistem Siskohat Kemenag.</p>

          <div className="divide-y divide-slate-150">
            {accounts.map(acc => (
              <div key={acc.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                    {acc.nama}
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      acc.peran === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>{acc.peran}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-sans">@{acc.username}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(acc)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Ubah Data / Peran Operator"
                  >
                    <Edit2 size={13} />
                  </button>
                  {accounts.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Hapus hak akses operator ${acc.nama}?`)) onDeleteAccount(acc.id);
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Hapus Hak Akses"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Database control sector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-blue-700">
          <Database size={18} className="text-indigo-700" />
          <h2 className="font-bold text-base font-serif text-slate-900">C. Kendali Utilitas Database (Offline Persistence)</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Semua transaksi pendaftaran haji mandiri disimpan di database lokal browser anda secara real-time. Untuk keamanan, disarankan untuk melakukan ekspor cadangan secara rutin.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
          {/* Export button */}
          <button
            id="btn-ekspor-db"
            onClick={onExportDB}
            className="p-4 border border-blue-100 bg-blue-50/40 hover:bg-blue-55 rounded-xl flex flex-col items-center justify-center text-center transition group active:scale-95 cursor-pointer"
          >
            <Download className="text-blue-700 mb-2 group-hover:scale-110 transition" size={24} />
            <h4 className="text-xs font-bold text-slate-800">Ekspor Database (.JSON)</h4>
            <p className="text-[10px] text-slate-400 mt-1">Unduh seluruh berkas jamaah & riwayat pembayaran</p>
          </button>

          {/* Import trigger */}
          <button
            id="btn-impor-db"
            onClick={() => importInputRef.current?.click()}
            className="p-4 border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl flex flex-col items-center justify-center text-center transition group active:scale-95"
          >
            <input
              type="file"
              ref={importInputRef}
              accept=".json"
              onChange={handleImportFileChange}
              className="hidden"
            />
            <Upload className="text-indigo-700 mb-2 group-hover:scale-110 transition" size={24} />
            <h4 className="text-xs font-bold text-slate-800">Impor Database</h4>
            <p className="text-[10px] text-slate-400 mt-1">Unggah berkas cadangan berseri haji mandiri</p>
          </button>

          {/* Clear trigger */}
          <button
            id="btn-hapus-db"
            onClick={() => {
              if (confirm('⚠️ PERINGATAN: Menghapus database akan membersihkan seluruh data jamaah, tahun, kuota, dan transaksi pembayaran. Data tidak dapat dipulihkan. Apakah Anda yakin?')) {
                onClearDB();
              }
            }}
            className="p-4 border border-rose-100 bg-rose-50/50 hover:bg-rose-50 rounded-xl flex flex-col items-center justify-center text-center transition group active:scale-95"
          >
            <Trash2 className="text-rose-600 mb-2 group-hover:scale-110 transition" size={24} />
            <h4 className="text-xs font-bold text-rose-700">Hapus Database (Reset)</h4>
            <p className="text-[10px] text-rose-450 mt-1">Kosongkan seluruh data kembali ke kondisi awal</p>
          </button>
        </div>
      </div>

      {/* Online Access & Cloud Hosting Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-emerald-700">
            <Globe size={18} className="text-[#0b4d2c]" />
            <h2 className="font-bold text-base font-serif text-slate-900">D. Akses & Tautan Online (Cloud Hosting)</h2>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Aktif 24/7 di Cloud
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Aplikasi ini dapat dibuka secara online dari perangkat mana saja (HP Android, iPhone, iPad, Laptop, PC kantor) tanpa perlu instalasi aplikasi tambahan.
        </p>

        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider">Tautan Publik Online:</p>
            <p className="font-mono text-xs text-emerald-800 break-all select-all font-semibold">
              https://ais-pre-ieg36ahrnxmejzfswgnnbn-942347892030.asia-southeast1.run.app
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onOpenOnlineAccess && (
              <button
                type="button"
                onClick={onOpenOnlineAccess}
                className="px-4 py-2 bg-[#0b4d2c] hover:bg-[#072412] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <QrCode size={14} />
                <span>Lihat QR Code & Kode Blogspot</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ACCOUNT MODAL */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden transition-all border border-slate-100">
            <div className="px-6 py-4 bg-gradient-to-r from-kbih-green to-kbih-green-hover text-white font-serif flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <UserCheck size={18} />
                {selectedEditAccount ? 'Ubah Operator Akun' : 'Tambah Operator Akun'}
              </h3>
              <button type="button" onClick={() => { setIsAccountModalOpen(false); setSelectedEditAccount(null); }} className="text-blue-100 font-bold hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAccountFormSubmit} className="p-6 space-y-4">
              {accountError && (
                <div className="p-2 bg-rose-50 border border-rose-100 rounded text-rose-700 text-xs font-medium flex items-center gap-1">
                  <AlertCircle size={14} />
                  {accountError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Username Operator</label>
                <input
                  id="form-username"
                  type="text"
                  placeholder="Misal: andi_kbih"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.trim())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap Pejabat</label>
                <input
                  id="form-realname"
                  type="text"
                  placeholder="Misal: H. Andi Hermawan"
                  value={newRealName}
                  onChange={(e) => setNewRealName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Jabatan Peran</label>
                <select
                  id="form-roles"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                >
                  <option value="Pengelola">Pengelola Lapangan / Operator</option>
                  <option value="Admin">Administrator Sistem Utama</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAccountModalOpen(false); setSelectedEditAccount(null); }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-705 text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-simpan-akun"
                  className="px-5 py-2 bg-kbih-green hover:bg-kbih-green-hover text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {selectedEditAccount ? 'Simpan Perubahan' : 'Tambahkan Akun'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
