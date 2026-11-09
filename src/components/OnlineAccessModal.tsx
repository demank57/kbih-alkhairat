import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Laptop,
  Cloud,
  Share2,
  Download,
  Info,
  X,
  ShieldCheck,
  Wifi,
  Sparkles,
  Code2,
  Layers,
  FileCode,
  LayoutTemplate
} from 'lucide-react';

interface OnlineAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  lembagaName: string;
  isCloudSynced: boolean;
  onConnectCloud?: () => void;
}

export default function OnlineAccessModal({
  isOpen,
  onClose,
  lembagaName,
  isCloudSynced,
  onConnectCloud
}: OnlineAccessModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'link' | 'blogspot' | 'guide'>('link');
  const [embedType, setEmbedType] = useState<'iframe' | 'floating' | 'sidebar'>('iframe');

  // Production / Shared cloud run URL provided by Google AI Studio hosting
  const defaultOnlineUrl = 'https://ais-pre-ieg36ahrnxmejzfswgnnbn-942347892030.asia-southeast1.run.app';
  
  // Use current window origin if it's already an online https domain, else default to the shared app URL
  const currentUrl = typeof window !== 'undefined' && window.location.origin.startsWith('https://')
    ? window.location.origin
    : defaultOnlineUrl;

  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0b4d2c',
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR Code:', err));
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopySnippetText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 3000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qrcode_akses_online_${lembagaName.replace(/\s+/g, '_').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Blogspot Code Snippets
  const iframeSnippet = `<!-- ======================================================== -->
<!-- KODE EMBED PENDAFTARAN HAJI MANDIRI UNTUK BLOGGER        -->
<!-- Pasang di: Halaman -> Buat Halaman Baru -> Tampilan HTML -->
<!-- ======================================================== -->
<div style="width:100%;max-width:1200px;margin:0 auto;padding:10px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="position:relative;width:100%;height:92vh;min-height:780px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1);border-radius:16px;overflow:hidden;border:1px solid #cbd5e1;background:#f8fafc;">
    <iframe 
      src="${currentUrl}" 
      style="width:100%;height:100%;border:none;display:block;"
      title="Sistem Pendaftaran Haji Mandiri - ${lembagaName}"
      allow="clipboard-write; camera"
      loading="lazy">
    </iframe>
  </div>
  <p style="text-align:center;font-size:12px;color:#64748b;margin-top:12px;">
    &copy; ${lembagaName} &bull; Sistem Pendaftaran Haji Mandiri Online &bull; Cloud Server SSL 24/7
  </p>
</div>`;

  const floatingSnippet = `<!-- ======================================================== -->
<!-- WIDGET TOMBOL MELAYANG DAFTAR HAJI UNTUK BLOGGER         -->
<!-- Pasang di: Tata Letak -> Tambah Gadget -> HTML/JavaScript -->
<!-- ======================================================== -->
<div id="kbih-haji-floating" style="position:fixed;bottom:25px;right:25px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <a href="${currentUrl}" 
     target="_blank" 
     rel="noopener noreferrer" 
     style="display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#0b4d2c 0%,#15803d 100%);color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:50px;font-weight:700;font-size:14px;box-shadow:0 10px 25px rgba(11,77,44,0.4);border:2px solid #ffffff;transition:all 0.3s ease;">
    <span style="font-size:20px;line-height:1;">🕋</span>
    <span>Daftar Haji Online</span>
    <span style="background:#f59e0b;color:#0f172a;font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;letter-spacing:0.5px;">ONLINE</span>
  </a>
</div>
<style>
  #kbih-haji-floating a:hover {
    transform:translateY(-3px) scale(1.03);
    box-shadow:0 15px 30px rgba(11,77,44,0.55);
  }
</style>`;

  const sidebarSnippet = `<!-- ======================================================== -->
<!-- WIDGET BANNER SIDEBAR DAFTAR HAJI UNTUK BLOGGER          -->
<!-- Pasang di: Tata Letak -> Sidebar -> HTML/JavaScript      -->
<!-- ======================================================== -->
<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 15px -2px rgba(0,0,0,0.06);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin-bottom:20px;text-align:center;">
  <div style="background:linear-gradient(135deg,#0b4d2c 0%,#0f683b 100%);color:#ffffff;padding:20px 16px;">
    <div style="font-size:32px;margin-bottom:6px;">🕋</div>
    <h3 style="margin:0;font-size:16px;font-weight:800;letter-spacing:-0.2px;">Pendaftaran Haji Mandiri</h3>
    <p style="margin:4px 0 0;font-size:12px;color:#a7f3d0;font-weight:500;">${lembagaName}</p>
  </div>
  <div style="padding:18px 16px;color:#475569;font-size:13px;line-height:1.5;">
    <p style="margin:0 0 14px;color:#334155;font-weight:500;">
      Daftarkan diri & keluarga secara resmi, cetak formulir mandiri, dan pantau status porsi haji Anda.
    </p>
    <a href="${currentUrl}" 
       target="_blank" 
       rel="noopener noreferrer" 
       style="display:block;background:#0b4d2c;color:#ffffff;text-decoration:none;font-weight:700;padding:11px 16px;border-radius:12px;font-size:13px;box-shadow:0 4px 12px rgba(11,77,44,0.3);transition:background 0.2s;">
      Buka Aplikasi Pendaftaran &rarr;
    </a>
  </div>
</div>`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#0b4d2c] via-[#0f683b] to-[#14532d] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-[#f59e0b]">
              <Globe size={22} className="text-[#f59e0b]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Cloud Hosted 24/7
                </span>
                {isCloudSynced && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40">
                    Realtime Sync Aktif
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5 font-serif">
                Akses & Integrasi Online
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            title="Tutup Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer flex-shrink-0 ${
              activeTab === 'link'
                ? 'border-[#0b4d2c] text-[#0b4d2c]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 size={15} />
            <span>Tautan & QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('blogspot')}
            className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer flex-shrink-0 ${
              activeTab === 'blogspot'
                ? 'border-[#0b4d2c] text-[#0b4d2c]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 size={15} />
            <span className="flex items-center gap-1.5">
              <span>Hubungkan ke Blogspot</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-800 rounded font-black">Blogger</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer flex-shrink-0 ${
              activeTab === 'guide'
                ? 'border-[#0b4d2c] text-[#0b4d2c]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone size={15} />
            <span>Petunjuk HP / Laptop</span>
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
          {activeTab === 'link' ? (
            <>
              {/* STATUS BANNER */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <Wifi size={18} className="text-[#0b4d2c] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-emerald-950 text-xs">
                    Aplikasi Sudah Siap Diakses Online
                  </p>
                  <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                    Aplikasi pendaftaran haji mandiri <span className="font-semibold text-emerald-900">{lembagaName}</span> telah aktif online di cloud server. Anda, panitia, maupun staf dapat membukanya langsung melalui link publik di bawah tanpa instalasi khusus.
                  </p>
                </div>
              </div>

              {/* URL COPY BOX */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Tautan Aplikasi Publik (Bisa Diakses Siapa Saja)
                </label>
                <div className="flex items-stretch gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-[11px] text-slate-800 truncate select-all flex items-center shadow-inner">
                    {currentUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs shadow-sm cursor-pointer ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#0b4d2c] hover:bg-[#072412] text-white active:scale-95'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* QR CODE & QUICK ACCESS */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
                <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 flex-shrink-0">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code Akses Aplikasi Online"
                      className="w-36 h-36 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-slate-400">
                      Memuat QR...
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center justify-center sm:justify-start gap-1.5">
                      <Smartphone size={16} className="text-[#0b4d2c]" />
                      Scan dengan Kamera Smartphone
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Arahkan kamera HP (Android / iPhone) ke kode QR ini untuk langsung membuka aplikasi pendaftaran haji di browser ponsel Anda.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    <button
                      onClick={handleDownloadQR}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Download size={13} />
                      <span>Unduh Gambar QR</span>
                    </button>
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition shadow-xs"
                    >
                      <ExternalLink size={13} />
                      <span>Buka di Tab Baru</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* CLOUD SYNC CALLOUT */}
              <div className="border border-amber-200 bg-amber-50/60 rounded-2xl p-4 flex items-start gap-3">
                <Cloud size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-amber-950 text-xs">
                      Sinkronisasi Multi-Perangkat Realtime (Cloud Firestore)
                    </h4>
                  </div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    {isCloudSynced
                      ? '✓ Database Cloud Firestore aktif. Setiap perubahan data jemaah, pembayaran, dan kuota akan otomatis tersinkron ke semua perangkat operator yang online.'
                      : 'Untuk menghubungkan database secara realtime antar perangkat (misal: input di laptop otomatis terlihat di HP petugas lapangan), silakan hubungkan dengan Akun Google (Cloud Sync).'}
                  </p>
                  {!isCloudSynced && onConnectCloud && (
                    <button
                      onClick={onConnectCloud}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Sparkles size={12} />
                      <span>Aktifkan Cloud Sync (Google Login)</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : activeTab === 'blogspot' ? (
            <>
              {/* BLOGSPOT / BLOGGER INTEGRATION TAB */}
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black flex-shrink-0 text-sm">
                    B
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-950 text-xs">
                      Pilih Model Tampilan untuk Blogspot (Blogger)
                    </p>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      Salin salah satu kode HTML di bawah ini lalu tempelkan ke akun <strong>Blogger.com</strong> Anda. Pengunjung blog Anda dapat langsung mendaftar haji secara online.
                    </p>
                  </div>
                </div>

                {/* EMBED TYPE SELECTOR */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setEmbedType('iframe')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      embedType === 'iframe'
                        ? 'border-[#0b4d2c] bg-emerald-50/70 text-[#0b4d2c] shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <LayoutTemplate size={16} />
                      <span className="font-bold text-xs">1. Halaman Penuh</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2">
                      Menu Halaman Blogger. Seluruh formulir menyatu di dalam blog.
                    </p>
                  </button>

                  <button
                    onClick={() => setEmbedType('floating')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      embedType === 'floating'
                        ? 'border-[#0b4d2c] bg-emerald-50/70 text-[#0b4d2c] shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Layers size={16} />
                      <span className="font-bold text-xs">2. Tombol Melayang</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2">
                      Tombol hijau elegan di pojok kanan bawah setiap postingan blog.
                    </p>
                  </button>

                  <button
                    onClick={() => setEmbedType('sidebar')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      embedType === 'sidebar'
                        ? 'border-[#0b4d2c] bg-emerald-50/70 text-[#0b4d2c] shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileCode size={16} />
                      <span className="font-bold text-xs">3. Banner Sidebar</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2">
                      Kartu widget untuk kolom samping (Sidebar) Tata Letak.
                    </p>
                  </button>
                </div>

                {/* CURRENT ACTIVE SNIPPET BOX */}
                <div className="border border-slate-200 rounded-2xl bg-slate-900 text-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <Code2 size={13} />
                      {embedType === 'iframe'
                        ? 'Kode HTML (Iframe Halaman Penuh)'
                        : embedType === 'floating'
                        ? 'Kode HTML (Tombol Melayang / Floating)'
                        : 'Kode HTML (Widget Banner Sidebar)'}
                    </span>
                    <button
                      onClick={() =>
                        handleCopySnippetText(
                          embedType === 'iframe'
                            ? iframeSnippet
                            : embedType === 'floating'
                            ? floatingSnippet
                            : sidebarSnippet,
                          embedType
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        copiedSnippet === embedType
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-700 hover:bg-emerald-600 text-white active:scale-95'
                      }`}
                    >
                      {copiedSnippet === embedType ? (
                        <>
                          <Check size={13} />
                          <span>Kode Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Salin Kode HTML</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto font-mono text-[10px] text-emerald-200/90 leading-relaxed bg-black/40 p-3 rounded-xl border border-slate-800 select-all whitespace-pre-wrap">
                    {embedType === 'iframe'
                      ? iframeSnippet
                      : embedType === 'floating'
                      ? floatingSnippet
                      : sidebarSnippet}
                  </div>
                </div>

                {/* STEP BY STEP BLOGGER INSTALL GUIDE */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Info size={15} className="text-[#0b4d2c]" />
                    Cara Pasang di Blogger.com:
                  </h4>
                  {embedType === 'iframe' ? (
                    <ol className="text-[11px] text-slate-600 list-decimal pl-5 space-y-1.5 leading-relaxed">
                      <li>Buka <strong>Blogger.com</strong> dan pilih blog Anda.</li>
                      <li>Di menu sebelah kiri, klik menu <strong>Halaman (Pages)</strong> &gt; klik <strong>+ Halaman Baru (+ New Page)</strong>.</li>
                      <li>Beri judul halaman, misalnya: <em>Pendaftaran Haji Mandiri Online</em>.</li>
                      <li>Klik ikon pensil di pojok kiri atas area ketik, lalu ganti dari <em>Tampilan Menulis (Compose view)</em> ke <strong>Tampilan HTML (HTML view)</strong>.</li>
                      <li>Tempelkan (Paste) kode yang sudah disalin di atas ke dalam kolom tersebut.</li>
                      <li>Klik <strong>Publikasikan (Publish)</strong>. Sekarang pengunjung blog dapat mengisi formulir langsung di blog Anda!</li>
                    </ol>
                  ) : (
                    <ol className="text-[11px] text-slate-600 list-decimal pl-5 space-y-1.5 leading-relaxed">
                      <li>Buka <strong>Blogger.com</strong> dan pilih blog Anda.</li>
                      <li>Di menu sebelah kiri, klik menu <strong>Tata Letak (Layout)</strong>.</li>
                      <li>
                        {embedType === 'floating'
                          ? 'Cari bagian Footer atau Bilah Sisi (Sidebar), lalu klik'
                          : 'Cari bagian Bilah Sisi (Sidebar) atau Kolom Samping, lalu klik'}{' '}
                        <strong>+ Tambahkan Gadget (+ Add a Gadget)</strong>.
                      </li>
                      <li>Pilih jenis gadget: <strong>HTML/JavaScript</strong>.</li>
                      <li>
                        {embedType === 'sidebar' && 'Beri judul (misal: "Pendaftaran Haji"), lalu '}
                        Tempelkan (Paste) kode yang disalin di atas ke dalam kotak <strong>Konten</strong>.
                      </li>
                      <li>Klik <strong>Simpan (Save)</strong>, lalu klik ikon disket di pojok kanan bawah untuk menyimpan Tata Letak.</li>
                    </ol>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* GUIDE TAB CONTENT */}
              <div className="space-y-4">
                {/* 1. Android / iPhone PWA */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#0b4d2c] flex items-center justify-center text-[11px] font-black">
                      1
                    </div>
                    <span>Jadikan Aplikasi di Layar Utama HP (Android & iPhone)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-8 leading-relaxed">
                    Aplikasi ini dirancang sebagai <strong>Progressive Web App (PWA)</strong>:
                  </p>
                  <ul className="text-[11px] text-slate-600 pl-11 list-disc space-y-1 leading-relaxed">
                    <li><strong>Google Chrome (Android):</strong> Buka link di atas, ketuk ikon titik tiga (⋮) di pojok kanan atas, lalu pilih <em>"Tambahkan ke Layar Utama" (Add to Home screen)</em> atau <em>"Pasang Aplikasi"</em>.</li>
                    <li><strong>Safari (iPhone/iPad):</strong> Buka link di atas, ketuk tombol <em>Share / Bagikan</em> (ikon kotak dengan panah atas), lalu pilih <em>"Tambahkan ke Layar Utama" (Add to Home Screen)</em>.</li>
                    <li>Ikon aplikasi KBIH akan otomatis muncul di layar HP Anda seperti aplikasi native tanpa perlu Play Store!</li>
                  </ul>
                </div>

                {/* 2. Laptop & PC Operator */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-black">
                      2
                    </div>
                    <span>Akses Staf & Operator di Kantor / Laptop</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-8 leading-relaxed">
                    Bagikan tautan publik ke seluruh petugas registrasi atau bendahara KBIH. Semua komputer yang membuka link ini dapat melakukan pencarian jemaah, input berkas porsi, serta mencetak formulir & kuitansi langsung melalui printer kantor.
                  </p>
                </div>

                {/* 3. Keamanan Data & Backup */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-black">
                      3
                    </div>
                    <span>Pencadangan Data Rutin (Backup JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-8 leading-relaxed">
                    Untuk menjamin arsip jemaah selalu aman, lakukan pencadangan berkala melalui menu <strong>Pengaturan &gt; C. Kendali Utilitas Database &gt; Ekspor Database (.JSON)</strong>. File ini dapat disimpan di flashdisk atau Google Drive Anda.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck size={14} className="text-emerald-700" />
            Tersimpan Aman di Google Cloud Platform
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
