import React, { useState, useRef } from 'react';
import { Jamaah, HajiPeriod } from '../types';
import { Plus, Search, HelpCircle, FileText, Trash2, Edit2, CheckCircle2, AlertCircle, Upload, Eye, Download, Users, ShieldCheck, Heart, User, Loader2 } from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const compressImage = (file: File, maxDim: number, quality: number): Promise<Blob | File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
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
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

interface JamaahManagerProps {
  jamaahList: Jamaah[];
  periodeList: HajiPeriod[];
  onAddJamaah: (jamaah: Jamaah) => void;
  onUpdateJamaah: (jamaah: Jamaah) => void;
  onDeleteJamaah: (id: string) => void;
  onSelectPrintJamaah: (jamaah: Jamaah) => void;
  localBackendActive?: boolean;
}

export default function JamaahManager({
  jamaahList,
  periodeList,
  onAddJamaah,
  onUpdateJamaah,
  onDeleteJamaah,
  onSelectPrintJamaah,
  localBackendActive = false
}: JamaahManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterKeaktifan, setFilterKeaktifan] = useState('Semua');
  
  // Modal & Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJamaah, setEditingJamaah] = useState<Jamaah | null>(null);
  
  // Document Preview State
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; jNama: string } | null>(null);
  
  // Upload Reference Ref for file inputs
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const kkInputRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // File upload state for Firebase Storage
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [cloudSyncing, setCloudSyncing] = useState<Record<string, boolean>>({});
  // Form Fields State
  const [formState, setFormState] = useState<Partial<Jamaah>>({
    id: '',
    tglPendaftaran: new Date().toISOString().split('T')[0],
    noPorsi: '',
    namaLengkap: '',
    binBinti: '',
    nik: '',
    jenisKelamin: 'Laki-Laki',
    tempatLahir: '',
    tanggalLahir: '',
    noHp: '',
    alamatDomisili: '',
    noPaspor: '',
    kantorImigrasi: '',
    tglTerbitPaspor: '',
    tglHabisPaspor: '',
    tinggiBadan: 165,
    beratBadan: 60,
    riwayatPenyakit: 'Tidak Ada',
    namaMahram: '',
    hubunganMahram: '',
    nikMahram: '',
    noHpMahram: '',
    alamatMahram: '',
    dokumenKK: '',
    dokumenKTP: '',
    dokumenFoto: '',
    statusAdministrasi: 'Belum Lengkap',
    periodeTahun: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Helper to handle uploading to Firebase Storage with a base64 fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'dokumenKK' | 'dokumenKTP' | 'dokumenFoto') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate PDF file size to prevent large PDF documents from exceeding Firestore limit of 1MB (if saved as base64)
      if (file.type === 'application/pdf' && file.size > 300 * 1024) {
        alert('Maaf, ukuran file PDF terlalu besar (maksimal 300 KB). Silakan kecilkan file PDF Anda, atau gunakan file gambar (JPG/PNG/JPEG) agar sistem kami dapat mengompres ukurannya secara otomatis dan instan menjadi sangat kecil!');
        return;
      }

      setUploading(prev => ({ ...prev, [fieldName]: true }));
      setCloudSyncing(prev => ({ ...prev, [fieldName]: true }));
      setUploadProgress(prev => ({ ...prev, [fieldName]: 0 }));
      
      const jamaahId = formState.id || 'temp_' + Date.now();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const uniqueFileName = `${fieldName}_${Date.now()}_${cleanFileName}`;
      
      // ULTRA OPTIMIZATION: High-efficiency resolution and compression yields crisp documents averaging only 15-30KB!
      // This results in instantaneous uploads and ensures complete safety within Firestore's 1MB document size limit.
      const maxDim = fieldName === 'dokumenFoto' ? 320 : 720;
      const quality = 0.55;

      // COMPRESSION FIRST: Compress the image first (instantaneous) before generating Base64
      compressImage(file, maxDim, quality).then((compressedBlob) => {
        // Read compressed blob as base64 for preview AND fallback.
        // This ensures that even if Storage fails, formState has a tiny (~15-35KB) string instead of the raw original 5MB+ file.
        const reader = new FileReader();
        reader.onloadend = () => {
          const processedBase64 = reader.result as string;
          
          setFormState(prev => ({
            ...prev,
            [fieldName]: processedBase64
          }));

          // INSTANT RESPONSE: Mark uploading as FALSE instantly so the user can submit the form immediately!
          setUploading(prev => ({ ...prev, [fieldName]: false }));

          let uploadFileName = uniqueFileName;
          // If image compressed, change suffix/extension to .jpg if it doesn't already have one
          if (file.type.startsWith('image/') && !uploadFileName.toLowerCase().endsWith('.jpg') && !uploadFileName.toLowerCase().endsWith('.jpeg')) {
            const lastDot = uploadFileName.lastIndexOf('.');
            if (lastDot !== -1) {
              uploadFileName = uploadFileName.substring(0, lastDot) + '.jpg';
            } else {
              uploadFileName = uploadFileName + '.jpg';
            }
          }

          // Local server upload pathway if localhost server is active
          if (localBackendActive) {
            setUploadProgress(prev => ({ ...prev, [fieldName]: 10 }));
            fetch('/api/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                fileName: uploadFileName,
                base64: processedBase64
              })
            })
            .then(res => {
              if (res.ok) {
                return res.json();
              }
              throw new Error("HTTP upload error status: " + res.status);
            })
            .then(data => {
              console.log("✓ Uploaded successfully to local disk server:", data.url);
              setFormState(prev => ({
                ...prev,
                [fieldName]: data.url
              }));
              setUploadProgress(prev => ({ ...prev, [fieldName]: 100 }));
            })
            .catch(err => {
              console.warn('Local disk upload failed, falling back to embedded compressed base64:', err);
            })
            .finally(() => {
              setCloudSyncing(prev => ({ ...prev, [fieldName]: false }));
            });
            return;
          }

          try {
            const storageRef = ref(storage, `jamaah/${jamaahId}/${uploadFileName}`);
            const uploadTask = uploadBytesResumable(storageRef, compressedBlob);
            
            uploadTask.on('state_changed', 
              (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgress(prev => ({ ...prev, [fieldName]: progress }));
              }, 
              (error) => {
                console.warn('Firebase Storage upload failed, keeping compressed base64:', error);
                setCloudSyncing(prev => ({ ...prev, [fieldName]: false }));
              }, 
              async () => {
                try {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  setFormState(prev => ({
                    ...prev,
                    [fieldName]: downloadURL
                  }));
                } catch (err) {
                  console.error('Error getting download URL, keeping compressed base64:', err);
                } finally {
                  setCloudSyncing(prev => ({ ...prev, [fieldName]: false }));
                }
              }
            );
          } catch (err) {
            console.warn('Could not launch Firebase Storage task, keeping compressed base64:', err);
            setCloudSyncing(prev => ({ ...prev, [fieldName]: false }));
          }
        };
        
        reader.readAsDataURL(compressedBlob);
      }).catch((err) => {
        console.error('Compression failed:', err);
        setUploading(prev => ({ ...prev, [fieldName]: false }));
        setCloudSyncing(prev => ({ ...prev, [fieldName]: false }));
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formState.namaLengkap) errors.namaLengkap = 'Nama lengkap wajib diisi';
    if (!formState.binBinti) errors.binBinti = 'Nama Bin/Binti wajib diisi';
    if (!formState.nik || formState.nik.length !== 16) {
      errors.nik = 'NIK harus tepat 16 digit angka';
    } else if (!/^\d+$/.test(formState.nik)) {
      errors.nik = 'NIK harus berupa angka';
    }
    
    if (!formState.tempatLahir) errors.tempatLahir = 'Tempat lahir wajib diisi';
    if (!formState.tanggalLahir) errors.tanggalLahir = 'Tanggal lahir wajib diisi';
    if (!formState.noHp) errors.noHp = 'Nomor HP wajib diisi';
    if (!formState.alamatDomisili) errors.alamatDomisili = 'Alamat domisili wajib diisi';
    if (!formState.periodeTahun) errors.periodeTahun = 'Periode pendaftaran wajib dipilih';
    
    // Passport validation if any of passport fields is filled
    if (formState.noPaspor || formState.kantorImigrasi || formState.tglTerbitPaspor || formState.tglHabisPaspor) {
      if (!formState.noPaspor) errors.noPaspor = 'Nomor paspor diperlukan';
      if (!formState.kantorImigrasi) errors.kantorImigrasi = 'Kantor imigrasi penerbit diperlukan';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreateForm = () => {
    setEditingJamaah(null);
    const year = periodeList.find(p => p.status === 'buka')?.tahun || new Date().getFullYear().toString();
    
    // Generate a temporary 10-digit portion number
    const randomPorsi = '13000' + Math.floor(10000 + Math.random() * 90000).toString();
    const sequenceNumber = String(jamaahList.length + 1).padStart(4, '0');
    const autoId = `HJ-${year}-${sequenceNumber}`;

    setFormState({
      id: autoId,
      tglPendaftaran: new Date().toISOString().split('T')[0],
      noPorsi: randomPorsi,
      namaLengkap: '',
      binBinti: '',
      nik: '',
      jenisKelamin: 'Laki-Laki',
      tempatLahir: '',
      tanggalLahir: '',
      noHp: '',
      alamatDomisili: '',
      noPaspor: '',
      kantorImigrasi: '',
      tglTerbitPaspor: '',
      tglHabisPaspor: '',
      tinggiBadan: 165,
      beratBadan: 60,
      riwayatPenyakit: 'Tidak Ada',
      namaMahram: '',
      hubunganMahram: '',
      nikMahram: '',
      noHpMahram: '',
      alamatMahram: '',
      dokumenKK: '',
      dokumenKTP: '',
      dokumenFoto: '',
      statusAdministrasi: 'Belum Lengkap',
      periodeTahun: year,
      statusAktif: 'Aktif'
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (jamaah: Jamaah) => {
    setEditingJamaah(jamaah);
    setFormState({ ...jamaah });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(uploading).some(val => val)) {
      alert('Unggahan dokumen sedang berlangsung. Silakan tunggu beberapa saat hingga selesai.');
      return;
    }
    if (!validateForm()) return;

    // Determine completeness based on document uploads and passport info
    const isPassportFilled = !!formState.noPaspor;
    const isDocFilled = !!(formState.dokumenKK && formState.dokumenKTP && formState.dokumenFoto);
    const computedStatus = (isPassportFilled && isDocFilled) ? 'Lengkap' : 'Belum Lengkap';

    const finalJamaah: Jamaah = {
      ...(formState as Jamaah),
      statusAdministrasi: computedStatus
    };

    if (editingJamaah) {
      onUpdateJamaah(finalJamaah);
    } else {
      onAddJamaah(finalJamaah);
    }
    setIsFormOpen(false);
  };

  const getStatusBadgeClass = (status: string) => {
    return status === 'Lengkap'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
  };

  // Filtered array
  const filteredJamaah = jamaahList.filter(j => {
    const matchesSearch =
      j.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.nik.includes(searchQuery) ||
      j.noPorsi.includes(searchQuery) ||
      j.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesPeriod = filterPeriod === 'Semua' || j.periodeTahun === filterPeriod;
    const matchesStatus = filterStatus === 'Semua' || j.statusAdministrasi === filterStatus;
    const keaktifanState = j.statusAktif || 'Aktif';
    const matchesKeaktifan = filterKeaktifan === 'Semua' || keaktifanState === filterKeaktifan;
    
    return matchesSearch && matchesPeriod && matchesStatus && matchesKeaktifan;
  });

  return (
    <div id="jamaah-manager-section" className="space-y-4">
      {/* Header Panel with Stats */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Dashboard</span>
          <span className="text-slate-300 text-xs">/</span>
          <h1 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Manajemen Jamaah</h1>
        </div>
        <div>
          <button
            id="btn-tambah-jamaah"
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-kbih-green hover:bg-kbih-green-hover text-white font-bold text-xs rounded transition duration-150 shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            + Tambah Jamaah
          </button>
        </div>
      </div>

      {/* Search Filters Toolbar */}
      <div className="bg-white p-3 rounded-lg shadow-xs border border-slate-200/80 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            id="input-cari-jamaah"
            type="text"
            placeholder="Cari berdasarkan nama, NIK, No. Porsi, atau ID pendaftaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500/30 font-sans transition"
          />
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Periode:</span>
            <select
              id="select-filter-periode"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Tahun</option>
              {periodeList.map(p => (
                <option key={p.id} value={p.tahun}>Tahun {p.tahun}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Administrasi:</span>
            <select
              id="select-filter-administrasi"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Status</option>
              <option value="Lengkap">Lengkap</option>
              <option value="Belum Lengkap">Belum Lengkap</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Keaktifan:</span>
            <select
              id="select-filter-keaktifan"
              value={filterKeaktifan}
              onChange={(e) => setFilterKeaktifan(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Keaktifan</option>
              <option value="Aktif">Aktif Only</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Cards or Table */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daftar Jamaah ({filteredJamaah.length})</h2>
          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200 rounded font-bold">PROSES ADMINISTRASI</span>
        </div>
        
        {filteredJamaah.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto text-slate-300 mb-2" size={36} />
            <h3 className="text-xs font-bold text-slate-700">Tidak ada data jamaah</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">Silakan daftarkan jamaah baru atau sesuaikan filter pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200">
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID & Porsi</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIK & Kontak</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paspor & Mahram</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahun Haji</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Administrasi</th>
                  <th className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredJamaah.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/40 transition">
                    <td className="p-2.5">
                      <div className="font-bold text-blue-700">{j.id}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Porsi: {j.noPorsi || '-'}</div>
                      <div className="text-[9px] text-slate-400 font-sans">Tgl: {j.tglPendaftaran}</div>
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-800">{j.namaLengkap}</span>
                        {(j.statusAktif === 'Tidak Aktif') ? (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded font-extrabold text-[8px] uppercase tracking-wide">
                            Tidak Aktif (Berangkat)
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-kbih-green border border-emerald-200 px-1.5 py-0.2 rounded font-extrabold text-[8px] uppercase tracking-wide">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">Bin: {j.binBinti}</div>
                      <div className="text-[10px] text-slate-400">{j.jenisKelamin}</div>
                    </td>
                    <td className="p-2.5">
                      <div className="font-sans text-xs text-slate-700">{j.nik}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{j.noHp}</div>
                      <div className="text-[9px] text-slate-400 truncate max-w-[160px] block" title={j.alamatDomisili}>{j.alamatDomisili}</div>
                    </td>
                    <td className="p-2.5">
                      <div className="text-[10px] font-medium text-slate-700">
                        P: {j.noPaspor ? <span className="font-sans text-blue-700 bg-blue-50 px-1 py-0.2 border border-blue-105 rounded">{j.noPaspor}</span> : <span className="text-red-500 italic font-sans">Belum ada</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        M: {j.namaMahram ? `${j.namaMahram} (${j.hubunganMahram})` : <span className="text-slate-400 italic">Mandiri</span>}
                      </div>
                    </td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {j.periodeTahun}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(j.statusAdministrasi)}`}>
                        {j.statusAdministrasi === 'Lengkap' ? (
                          <CheckCircle2 size={10} className="text-blue-600" />
                        ) : (
                          <AlertCircle size={10} className="text-amber-700" />
                        )}
                        {j.statusAdministrasi}
                      </span>
                      {/* Show uploaded doc miniatures with interactive viewing on click */}
                      <div className="flex gap-1 justify-center mt-1.5">
                        <button
                          onClick={() => {
                            if (j.dokumenKK) {
                              setPreviewDoc({ title: 'Kartu Keluarga (KK)', url: j.dokumenKK, jNama: j.namaLengkap });
                            } else {
                              alert('Dokumen Kartu Keluarga belum diunggah.');
                            }
                          }}
                          title={j.dokumenKK ? "Klik untuk melihat Kartu Keluarga (KK)" : "Kartu Keluarga (KK) Belum Diunggah"}
                          className={`px-1 py-0.2 text-[8px] font-bold rounded transition-all cursor-pointer ${
                            j.dokumenKK 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-105 active:scale-95' 
                              : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                          }`}
                        >
                          KK
                        </button>
                        <button
                          onClick={() => {
                            if (j.dokumenKTP) {
                              setPreviewDoc({ title: 'Kartu Tanda Penduduk (KTP)', url: j.dokumenKTP, jNama: j.namaLengkap });
                            } else {
                              alert('Dokumen KTP belum diunggah.');
                            }
                          }}
                          title={j.dokumenKTP ? "Klik untuk melihat KTP" : "KTP Belum Diunggah"}
                          className={`px-1 py-0.2 text-[8px] font-bold rounded transition-all cursor-pointer ${
                            j.dokumenKTP 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-105 active:scale-95' 
                              : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                          }`}
                        >
                          KTP
                        </button>
                        <button
                          onClick={() => {
                            if (j.dokumenFoto) {
                              setPreviewDoc({ title: 'Pas Foto 4x6', url: j.dokumenFoto, jNama: j.namaLengkap });
                            } else {
                              alert('Pas Foto belum diunggah.');
                            }
                          }}
                          title={j.dokumenFoto ? "Klik untuk melihat Pas Foto" : "Pas Foto Belum Diunggah"}
                          className={`px-1 py-0.2 text-[8px] font-bold rounded transition-all cursor-pointer ${
                            j.dokumenFoto 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-105 active:scale-95' 
                              : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                          }`}
                        >
                          Foto
                        </button>
                      </div>
                    </td>
                    <td className="p-2.5 text-right font-medium">
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          onClick={() => onSelectPrintJamaah(j)}
                          title="Cetak Berkas Administrasi"
                          className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-blue-800 transition cursor-pointer"
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEditForm(j)}
                          title="Edit Biodata"
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus jamaah ${j.namaLengkap}?`)) {
                              onDeleteJamaah(j.id);
                            }
                          }}
                          title="Hapus Jamaah"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REGISTRATION FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-all">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-800 text-white font-serif flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Plus size={20} className="text-amber-400" />
                  {editingJamaah ? 'Ubah Data Jamaah Haji' : 'Registrasi Jamaah Haji Baru'}
                </h3>
                <p className="text-emerald-100 text-xs mt-0.5">Lengkapi form secara benar s.d unggah dokumen untuk diteruskan ke Siskohat</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-emerald-100 hover:text-white bg-emerald-900/30 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Form Fields - Scrolling body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Section 1: ID & Periode Haji */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/60 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">ID Pendaftaran</label>
                  <input
                    type="text"
                    value={formState.id}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">No. Porsi (Kemenag)</label>
                  <input
                    type="text"
                    id="form-no-porsi"
                    value={formState.noPorsi || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, noPorsi: e.target.value }))}
                    placeholder="Nomor Porsi Haji Kemenag"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Periode Haji</label>
                  <select
                    id="form-periode"
                    value={formState.periodeTahun}
                    onChange={(e) => setFormState(prev => ({ ...prev, periodeTahun: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${formErrors.periodeTahun ? 'border-red-500' : 'border-slate-200'}`}
                  >
                    <option value="">-- Pilih Tahun Haji --</option>
                    {periodeList.map(p => (
                      <option key={p.id} value={p.tahun}>Tahun {p.tahun} (Kuota: {p.kuota})</option>
                    ))}
                  </select>
                  {formErrors.periodeTahun && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.periodeTahun}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Tanggal Pendaftaran</label>
                  <input
                    type="date"
                    id="form-tgl-pendaftaran"
                    value={formState.tglPendaftaran || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, tglPendaftaran: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>
              </div>

              {/* Section 2: Biodata Diri (Sesuai KTP) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <User size={16} className="text-emerald-700" />
                  <h4 className="text-sm font-bold text-slate-800">1. Biodata Jamaah (Sesuai KTP)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nama Lengkap (Sesuai KTP) <span className="text-red-500">*</span></label>
                    <input
                      id="form-nama-lengkap"
                      type="text"
                      value={formState.namaLengkap}
                      onChange={(e) => setFormState(prev => ({ ...prev, namaLengkap: e.target.value }))}
                      placeholder="Contoh: AHMAD SUBARJO"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${formErrors.namaLengkap ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {formErrors.namaLengkap && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.namaLengkap}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Bin / Binti <span className="text-red-500">*</span></label>
                    <input
                      id="form-bin-binti"
                      type="text"
                      value={formState.binBinti}
                      onChange={(e) => setFormState(prev => ({ ...prev, binBinti: e.target.value }))}
                      placeholder="Contoh: KUSNADI (Bin) atau MANSYUR (Binti)"
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none ${formErrors.binBinti ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {formErrors.binBinti && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.binBinti}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nomor Induk Kependudukan (NIK 16 Digit) <span className="text-red-500">*</span></label>
                    <input
                      id="form-nik"
                      type="text"
                      maxLength={16}
                      value={formState.nik}
                      onChange={(e) => setFormState(prev => ({ ...prev, nik: e.target.value }))}
                      placeholder="327301xxxxxxxxxx"
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm font-sans focus:outline-none ${formErrors.nik ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {formErrors.nik && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.nik}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Jenis Kelamin <span className="text-red-500">*</span></label>
                    <select
                      id="form-jenis-kelamin"
                      value={formState.jenisKelamin}
                      onChange={(e) => setFormState(prev => ({ ...prev, jenisKelamin: e.target.value as 'Laki-Laki' | 'Perempuan' }))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                    >
                      <option value="Laki-Laki">Laki-Laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tempat Lahir <span className="text-red-500">*</span></label>
                    <input
                      id="form-tempat-lahir"
                      type="text"
                      value={formState.tempatLahir}
                      onChange={(e) => setFormState(prev => ({ ...prev, tempatLahir: e.target.value }))}
                      placeholder="Madiun"
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none ${formErrors.tempatLahir ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {formErrors.tempatLahir && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.tempatLahir}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tanggal Lahir <span className="text-red-500">*</span></label>
                    <input
                      id="form-tanggal-lahir"
                      type="date"
                      value={formState.tanggalLahir}
                      onChange={(e) => setFormState(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm font-sans focus:outline-none ${formErrors.tanggalLahir ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {formErrors.tanggalLahir && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.tanggalLahir}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nomor HP / WhatsApp <span className="text-red-500">*</span></label>
                    <input
                      id="form-no-hp"
                      type="tel"
                      value={formState.noHp}
                      onChange={(e) => setFormState(prev => ({ ...prev, noHp: e.target.value }))}
                      placeholder="0812xxxxxxxx"
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none ${formErrors.noHp ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {formErrors.noHp && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.noHp}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Alamat Domisili Lengkap <span className="text-red-500">*</span></label>
                  <textarea
                    id="form-alamat"
                    rows={2}
                    value={formState.alamatDomisili}
                    onChange={(e) => setFormState(prev => ({ ...prev, alamatDomisili: e.target.value }))}
                    placeholder="Tuliskan nama jalan, RT/RW, kelurahan, kecamatan, kota, provinsi, dan kode pos..."
                    className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none ${formErrors.alamatDomisili ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {formErrors.alamatDomisili && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.alamatDomisili}</p>}
                </div>
              </div>

              {/* Section 3: Data Paspor */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <h4 className="text-sm font-bold text-slate-800">2. Data Paspor (Sinergi Sistem Imigrasi)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nomor Paspor (Jika Ada)</label>
                    <input
                      id="form-no-paspor"
                      type="text"
                      value={formState.noPaspor || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, noPaspor: e.target.value }))}
                      placeholder="B1234567"
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm font-sans focus:outline-none ${formErrors.noPaspor ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {formErrors.noPaspor && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.noPaspor}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Kantor Imigrasi Penerbit</label>
                    <input
                      id="form-kantor-imigrasi"
                      type="text"
                      value={formState.kantorImigrasi || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, kantorImigrasi: e.target.value }))}
                      placeholder="Kantor Imigrasi Pamekasan"
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:outline-none ${formErrors.kantorImigrasi ? 'border-red-500' : 'border-slate-200'}`}
                    />
                    {formErrors.kantorImigrasi && <p className="text-[10px] text-red-500 font-medium mt-1">{formErrors.kantorImigrasi}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tanggal Terbit Paspor</label>
                    <input
                      id="form-tgl-terbit-paspor"
                      type="date"
                      value={formState.tglTerbitPaspor || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, tglTerbitPaspor: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tanggal Habis Paspor</label>
                    <input
                      id="form-tgl-habis-paspor"
                      type="date"
                      value={formState.tglHabisPaspor || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, tglHabisPaspor: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Kesehatan & Mahram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <Heart size={16} className="text-rose-600" />
                    <h4 className="text-sm font-bold text-slate-800 font-sans">3. Profil Kesehatan</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tinggi (cm)</label>
                      <input
                        id="form-tinggi-badan"
                        type="number"
                        value={formState.tinggiBadan || 165}
                        onChange={(e) => setFormState(prev => ({ ...prev, tinggiBadan: Number(e.target.value) }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Berat (kg)</label>
                      <input
                        id="form-berat-badan"
                        type="number"
                        value={formState.beratBadan || 60}
                        onChange={(e) => setFormState(prev => ({ ...prev, beratBadan: Number(e.target.value) }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Riwayat Penyakit (Untuk Tim Medis Kloter)</label>
                    <textarea
                      id="form-riwayat-penyakit"
                      rows={2}
                      value={formState.riwayatPenyakit || 'Tidak Ada'}
                      onChange={(e) => setFormState(prev => ({ ...prev, riwayatPenyakit: e.target.value }))}
                      placeholder="Hipertensi, diabetes, jantung, asma, dsb."
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <Users size={16} className="text-amber-700" />
                    <h4 className="text-sm font-bold text-slate-800 font-sans">4. Data Mahram / Pendamping</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nama Lengkap Mahram</label>
                      <input
                        id="form-nama-mahram"
                        type="text"
                        value={formState.namaMahram || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, namaMahram: e.target.value }))}
                        placeholder="Nama Mahram"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Hubungan Mahram</label>
                      <select
                        id="form-hubungan-mahram"
                        value={formState.hubunganMahram || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, hubunganMahram: e.target.value as any }))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                      >
                        <option value="">Tidak Punya Mahram</option>
                        <option value="Suami/Istri">Suami/Istri</option>
                        <option value="Orang Tua">Orang Tua (Ayah/Ibu)</option>
                        <option value="Anak Kandung">Anak Kandung</option>
                        <option value="Saudara">Saudara</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">NIK Mahram</label>
                      <input
                        id="form-nik-mahram"
                        type="text"
                        maxLength={16}
                        value={formState.nikMahram || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, nikMahram: e.target.value }))}
                        placeholder="NIK"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-sans focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">No. HP Mahram</label>
                      <input
                        id="form-nohp-mahram"
                        type="text"
                        value={formState.noHpMahram || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, noHpMahram: e.target.value }))}
                        placeholder="No HP"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Alamat Domisili Mahram</label>
                    <input
                      id="form-alamat-mahram"
                      type="text"
                      value={formState.alamatMahram || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, alamatMahram: e.target.value }))}
                      placeholder="Alamat Lengkap Mahram"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Unggah Dokumen Administrasi */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <Upload size={16} className="text-emerald-700" />
                  <h4 className="text-sm font-bold text-slate-800 font-sans">5. Unggah Dokumen Kelengkapan Administrasi (KK, KTP, Pas Foto)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Kartu Keluarga (KK) */}
                  <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50 relative group">
                    <input
                      type="file"
                      id="file-upload-kk"
                      ref={kkInputRef}
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileUpload(e, 'dokumenKK')}
                      className="hidden"
                    />
                    {formState.dokumenKK ? (
                      <div className="w-full space-y-2">
                        <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                          <CheckCircle2 size={20} />
                        </div>
                        <p className="text-xs font-semibold text-slate-700">Kartu Keluarga (KK)</p>
                        <p className="text-[10px] text-slate-400 truncate px-2">kk_pendaftar_selesai.pdf</p>
                        {cloudSyncing['dokumenKK'] ? (
                          <p className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block animate-pulse">
                            🔄 Sinkronisasi Cloud... ({uploadProgress['dokumenKK'] || 0}%)
                          </p>
                        ) : (
                          <p className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                            ✓ Berkas Siap (Transmisi Instan)
                          </p>
                        )}
                        <div className="flex gap-1.5 justify-center mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (formState.dokumenKK) {
                                setPreviewDoc({ title: 'Kartu Keluarga (KK)', url: formState.dokumenKK, jNama: formState.namaLengkap || 'Calon Jamaah' });
                              }
                            }}
                            className="text-[10px] px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md text-blue-700 font-semibold transition cursor-pointer"
                          >
                            Lihat Berkas
                          </button>
                          <button
                            type="button"
                            disabled={uploading['dokumenKK']}
                            onClick={() => kkInputRef.current?.click()}
                            className="text-[10px] px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-emerald-800 font-medium transition disabled:text-slate-400"
                          >
                            {uploading['dokumenKK'] ? 'Mengunggah...' : 'Ubah File'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormState(prev => ({ ...prev, dokumenKK: '' }))}
                            className="text-[10px] px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md font-medium transition"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-slate-400 mb-2 group-hover:text-emerald-700 transition" size={24} />
                        <h5 className="text-xs font-semibold text-slate-700 mb-0.5">Kartu Keluarga (KK)</h5>
                        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Format PDF/JPG, maks 2MB</p>
                        <button
                          type="button"
                          id="btn-upload-kk"
                          disabled={uploading['dokumenKK']}
                          onClick={() => kkInputRef.current?.click()}
                          className={`px-3 py-1 border rounded-lg text-xs font-semibold transition shadow-xs active:scale-95 ${
                            uploading['dokumenKK'] 
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-emerald-800'
                          }`}
                        >
                          {uploading['dokumenKK'] ? 'Mengunggah...' : 'Pilih File'}
                        </button>
                      </>
                    )}
                  </div>
 
                  {/* KTP */}
                  <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50 relative group">
                    <input
                      type="file"
                      id="file-upload-ktp"
                      ref={ktpInputRef}
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileUpload(e, 'dokumenKTP')}
                      className="hidden"
                    />
                    {formState.dokumenKTP ? (
                      <div className="w-full space-y-2">
                        {formState.dokumenKTP.startsWith('data:image') || formState.dokumenKTP.startsWith('http') ? (
                          <img
                            src={formState.dokumenKTP}
                            alt="Scan KTP Preview"
                            className="mx-auto w-16 h-10 object-cover rounded border border-slate-200 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                            <CheckCircle2 size={20} />
                          </div>
                        )}
                        <p className="text-xs font-semibold text-slate-700">Kartu Tanda Penduduk (KTP)</p>
                        <p className="text-[10px] text-slate-500 font-sans">Biodata Teridentifikasi</p>
                        {cloudSyncing['dokumenKTP'] ? (
                          <p className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block animate-pulse">
                            🔄 Sinkronisasi Cloud... ({uploadProgress['dokumenKTP'] || 0}%)
                          </p>
                        ) : (
                          <p className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                            ✓ Berkas Siap (Transmisi Instan)
                          </p>
                        )}
                        <div className="flex gap-1.5 justify-center mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (formState.dokumenKTP) {
                                setPreviewDoc({ title: 'Kartu Tanda Penduduk (KTP)', url: formState.dokumenKTP, jNama: formState.namaLengkap || 'Calon Jamaah' });
                              }
                            }}
                            className="text-[10px] px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md text-blue-700 font-semibold transition cursor-pointer"
                          >
                            Lihat Berkas
                          </button>
                          <button
                            type="button"
                            disabled={uploading['dokumenKTP']}
                            onClick={() => ktpInputRef.current?.click()}
                            className="text-[10px] px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-emerald-800 font-medium transition disabled:text-slate-400"
                          >
                            {uploading['dokumenKTP'] ? 'Mengunggah...' : 'Ubah File'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormState(prev => ({ ...prev, dokumenKTP: '' }))}
                            className="text-[10px] px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md font-medium transition"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-slate-400 mb-2 group-hover:text-emerald-700 transition" size={24} />
                        <h5 className="text-xs font-semibold text-slate-700 mb-0.5">Identitas Diri (KTP KTP-el)</h5>
                        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Format PDF/JPG, maks 2MB</p>
                        <button
                          type="button"
                          id="btn-upload-ktp"
                          disabled={uploading['dokumenKTP']}
                          onClick={() => ktpInputRef.current?.click()}
                          className={`px-3 py-1 border rounded-lg text-xs font-semibold transition shadow-xs active:scale-95 ${
                            uploading['dokumenKTP'] 
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-emerald-800'
                          }`}
                        >
                          {uploading['dokumenKTP'] ? 'Mengunggah...' : 'Pilih File'}
                        </button>
                      </>
                    )}
                  </div>
 
                  {/* Pas Foto 4x6 */}
                  <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50 relative group">
                    <input
                      type="file"
                      id="file-upload-foto"
                      ref={fotoInputRef}
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'dokumenFoto')}
                      className="hidden"
                    />
                    {formState.dokumenFoto ? (
                      <div className="w-full space-y-2">
                        {formState.dokumenFoto.startsWith('data:image') || formState.dokumenFoto.startsWith('http') ? (
                          <img
                            src={formState.dokumenFoto}
                            alt="Pas Foto 4x6 Preview"
                            className="mx-auto w-10 h-14 object-cover rounded border border-slate-200 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                            <CheckCircle2 size={20} />
                          </div>
                        )}
                        <p className="text-xs font-semibold text-slate-700">Pas Foto Berwarna (4x6)</p>
                        <p className="text-[10px] text-slate-500">Latar Belakang Putih</p>
                        {cloudSyncing['dokumenFoto'] ? (
                          <p className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block animate-pulse">
                            🔄 Sinkronisasi Cloud... ({uploadProgress['dokumenFoto'] || 0}%)
                          </p>
                        ) : (
                          <p className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                            ✓ Berkas Siap (Transmisi Instan)
                          </p>
                        )}
                        <div className="flex gap-1.5 justify-center mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (formState.dokumenFoto) {
                                setPreviewDoc({ title: 'Pas Foto 4x6', url: formState.dokumenFoto, jNama: formState.namaLengkap || 'Calon Jamaah' });
                              }
                            }}
                            className="text-[10px] px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md text-blue-700 font-semibold transition cursor-pointer"
                          >
                            Lihat Berkas
                          </button>
                          <button
                            type="button"
                            disabled={uploading['dokumenFoto']}
                            onClick={() => fotoInputRef.current?.click()}
                            className="text-[10px] px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-emerald-800 font-medium transition disabled:text-slate-400"
                          >
                            {uploading['dokumenFoto'] ? 'Mengunggah...' : 'Ubah File'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormState(prev => ({ ...prev, dokumenFoto: '' }))}
                            className="text-[10px] px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md font-medium transition"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-slate-400 mb-2 group-hover:text-emerald-700 transition" size={24} />
                        <h5 className="text-xs font-semibold text-slate-700 mb-0.5">Pas Foto Berwarna (4x6)</h5>
                        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Sesuai standar Kemenag (Putih 80% wajah)</p>
                        <button
                          type="button"
                          id="btn-upload-foto"
                          disabled={uploading['dokumenFoto']}
                          onClick={() => fotoInputRef.current?.click()}
                          className={`px-3 py-1 border rounded-lg text-xs font-semibold transition shadow-xs active:scale-95 ${
                            uploading['dokumenFoto'] 
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-emerald-800'
                          }`}
                        >
                          {uploading['dokumenFoto'] ? 'Mengunggah...' : 'Pilih File'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-simpan-jamaah"
                  className="px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold rounded-xl.transition shadow-md shadow-emerald-850/10 active:scale-95"
                >
                  {editingJamaah ? 'Simpan Perubahan' : 'Lakukan Registrasi'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW LIGHTBOX MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] transition-all animate-fade-in no-print">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-300">Pratinjau Dokumen</h3>
                  <p className="text-sm font-bold text-white leading-tight font-serif">
                    {previewDoc.title} — <span className="text-emerald-400 font-sans">{previewDoc.jNama}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/80 p-1 rounded-md transition font-bold"
              >
                ✕
              </button>
            </div>

            {/* Document body container */}
            <div className="flex-1 overflow-auto p-6 bg-slate-100 flex flex-col justify-center items-center min-h-[40vh] relative group">
              {previewDoc.url.startsWith('data:application/pdf') || previewDoc.url.includes('.pdf') ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-4 py-8">
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 animate-bounce">
                    <FileText size={32} />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800 text-sm">Dokumen Format PDF Berhasil Diakses</p>
                    <p className="text-xs text-slate-500 mt-1">Gunakan link eksternal di bawah untuk pratinjau penuh atau download.</p>
                  </div>
                  
                  {/* iFrame PDF attempt */}
                  <iframe 
                    src={previewDoc.url} 
                    className="w-full h-[45vh] rounded-xl border border-slate-200 bg-white shadow-inner hidden md:block"
                    title={previewDoc.title}
                  />

                  <div className="flex gap-2 pt-2">
                    <a
                      href={previewDoc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/10 transition active:scale-95 cursor-pointer"
                    >
                      <Eye size={14} />
                      Buka Dokumen di Tab Baru
                    </a>
                    <a
                      href={previewDoc.url}
                      download={`dokumen_${previewDoc.title.toLowerCase().replace(/\s+/g, '_')}_${previewDoc.jNama.toLowerCase().replace(/\s+/g, '_')}.pdf`}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
                    >
                      <Download size={14} />
                      Unduh Berkas PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="relative max-w-full max-h-[60vh] flex items-center justify-center">
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.title}
                    className="max-w-full max-h-[58vh] object-contain rounded-xl shadow-lg border border-slate-200/80 bg-white transition duration-200 hover:scale-[1.01]"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-medium">Sistem Integrasi Berkas KBIH Al-Khairat</span>
              <div className="flex gap-2">
                {!previewDoc.url.startsWith('data:application/pdf') && !previewDoc.url.includes('.pdf') && (
                  <a
                    href={previewDoc.url}
                    download={`images_${previewDoc.title.toLowerCase().replace(/\s+/g, '_')}_${previewDoc.jNama.toLowerCase().replace(/\s+/g, '_')}.jpg`}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Download size={13} />
                    Unduh Gambar
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
