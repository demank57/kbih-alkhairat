# Panduan Database JSON Localhost (KBIH Al-Mabrur Mandiri)

Aplikasi manajemen pendaftaran haji KBIH ini dirancang dengan arsitektur hibrida modern yang mendukung penyimpanan ganda: **Cloud Firestore (Online via Firebase)** atau **File Database JSON Localhost (Offline via Express Node.js Server)**.

Dokumen ini menjelaskan bagaimana database lokal berbasis berkas JSON ini bekerja, strukturnya, dan cara menjalankannya di lingkungan lokal komputer Anda (`localhost`).

---

## 🚀 Cara Menjalankan Database JSON di Localhost

Bila dijalankan di komputer lokal Anda, aplikasi ini secara otomatis akan mendeteksi Express API Server di port `3000`. Jika server aktif, aplikasi akan mengalihkan penyimpanan dari browser (`localStorage`) langsung ke dalam berkas fisik **`kbih_data.json`** yang terletak di folder utama proyek Anda.

### Langkah-langkah Memulai di Komputer Lokal:

1. **Prasyarat**: Pastikan Anda telah menginstal [Node.js](https://nodejs.org) (versi 18 ke atas disarankan).
2. **Instalasi Dependensi**: Buka terminal di folder aplikasi lalu ketik perintah berikut:
   ```bash
   npm install
   ```
3. **Menjalankan Server**: Mulai server backend lokal dengan perintah:
   ```bash
   npm run dev
   ```
   **Keterangan**: Perintah ini menjalankan perintah `tsx server.ts` yang akan memulai server Express di port `3000` sekaligus mengaktifkan Vite untuk menyajikan frontend React secara real-time.

4. **Akses Aplikasi**: Buka browser Anda dan akses alamat:
   ```
   http://localhost:3000
   ```
   *Ketika Anda membuka alamat ini, indikator di bagian pojok kanan atas aplikasi akan menampilkan status berwarna biru: 🟢 **Server Lokal Aktif (localhost:3000)** dengan mode **Disk Sync**.*

---

## 📁 Berkas Penyimpanan Utama: `kbih_data.json`

Semua data yang Anda tambahkan, ubah, atau hapus lewat aplikasi akan langsung ditulis dan disinkronkan secara real-time ke dalam berkas:
📄 **`[ROOT_FOLDER]/kbih_data.json`**

Jika berkas ini belum ada di komputer lokal Anda saat server dijalankan pertama kali, Express server akan otomatis membuat berkas baru dan mengisinya dengan data contoh awal (*seed data*).

---

## 📊 Struktur Schema Database JSON

Berkas `kbih_data.json` berisikan struktur objek utama sebagai berikut:

```json
{
  "jamaahList": [],
  "periodeList": [],
  "paymentList": [],
  "lembaga": {},
  "accounts": [],
  "departureScheduleList": []
}
```

### Penjelasan Setiap Koleksi / Atribut:

#### 1. `jamaahList` (Daftar Jamaah)
Berisi seluruh data profil pendaftaran jamaah haji.
* **`id`** *(string)*: Kode unik identitas jamaah (Format: `HJ-[Tahun Pendaftaran]-[Nomor Urut]`).
* **`namaLengkap`** *(string)*: Nama lengkap jamaah sesuai KTP/Paspor.
* **`noPorsi`** *(string)*: 10-digit Nomor Porsi Haji dari Kementerian Agama.
* **`nik`** *(string)*: Nomor Induk Kependudukan (KTP) jamaah.
* **`jenisKelamin`** *(string)*: `'Laki-Laki'` atau `'Perempuan'`.
* **`noHp`** *(string)*: Nomor telepon handphone aktif yang dapat dihubungi.
* **`statusAdministrasi`** *(string)*: Progres kelengkapan dokumen (`'Lengkap'` atau `'Belum Lengkap'`).
* **`statusAktif`** *(string)*: Keaktifan pendaftaran (`'Aktif'` atau `'Tidak Aktif'`).
* **`periodeTahun`** *(string)*: Tahun keberangkatan haji yang direncanakan (Contoh: `"2026"`).

#### 2. `periodeList` (Kuota & Periode Haji)
Berisi kuota maksimal per tahun keberangkatan.
* **`id`** *(string)*: ID identifikasi tahun kuota.
* **`tahun`** *(string)*: Tahun Hijriah/Masehi keberangkatan (Contoh: `"2026"`).
* **`kuota`** *(number)*: Batas maksimal kuota jamaah KBIH untuk tahun tersebut.
* **`status`** *(string)*: Status pendaftaran di KBIH (`'buka'` atau `'tutup'`).

#### 3. `paymentList` (Manajemen Pembayaran / Keuangan)
Berisi catatan transaksi keuangan, setoran awal, angsuran, maupun pelunasan administrasi KBIH.
* **`id`** *(string)*: ID Transaksi kuitansi unik (Format: `TX-[Nomor Urut]`).
* **`jamaahId`** *(string)*: ID Jamaah yang melakukan pembayaran (Relasi ke `jamaahList.id`).
* **`jenisSetoran`** *(string)*: Kategori setoran (`'Setoran Awal'`, `'Cicilan'`, atau `'Pelunasan'`).
* **`nominal`** *(number)*: Jumlah uang rupiah yang disetorkan.
* **`tanggalTransaksi`** *(string)*: Tanggal pembayaran dilakukan (Format: `YYYY-MM-DD`).
* **`status`** *(string)*: `'Berhasil'`, `'Pending'`, atau `'Batal'`.

#### 4. `lembaga` (Profil KBIH)
Konfigurasi informasi instansi yang tercantum pada kop surat, laporan, kuitansi, dan berkas cetak.
* **`namaLembaga`** *(string)*: Nama resmi KBIH / Yayasan Anda.
* **`namaPengelola`** *(string)*: Nama Pemimpin / Ketua KBIH.
* **`noHp`** *(string)*: Nomor telepon instansi.
* **`alamat`** *(string)*: Alamat lengkap kantor pusat KBIH.
* **`logo`** *(string)*: Data gambar logo dalam format string Base64.

#### 5. `accounts` (Operator Sistem)
Daftar akun pejabat/petugas pendaftaran yang berwenang.
* **`id`** *(string)*: Kode unik internal operator.
* **`username`** *(string)*: Akun akses.
* **`nama`** *(string)*: Nama lengkap petugas operator.
* **`peran`** *(string)*: `'Admin'` atau `'Pengelola'`.

#### 6. `departureScheduleList` (Jadwal Keberangkatan)
Daftar jadwal detail rencana kelompok terbang (kloter), titik kumpul, dan status keberangkatan.
* **`id`** *(string)*: ID Rencana penerbangan keberangkatan (Format: `DS-[Nomor]`).
* **`tanggal`** *(string)*: Tanggal keberangkatan dari embarkasi.
* **`kloter`** *(string)*: Nomor Kelompok Terbang (Contoh: `"Kloter 12 - SUB"`).
* **`pesawat`** *(string)*: Nama maskapai (Contoh: `"Saudi Arabian Airlines"`).
* **`status`** *(string)*: Status jadwal keberangkatan (`'Belum Berangkat'` atau `'Sudah Berangkat'`).

---

## 🛠️ API Endpoints yang Berjalan di Localhost

Server lokal menggunakan Express API yang sangat ringan. Anda juga dapat berinteraksi dengan database ini melalui aplikasi pihak ketiga seperti Postman, script Python, atau utilitas curl pada endpoint berikut:

### 1. Mendapatkan Seluruh Data (GET)
* **URL**: `http://localhost:3000/api/data`
* **Metode**: `GET`
* **Deskripsi**: Mengambil seluruh struktur database JSON terkini.
* **Respon**: Objek JSON lengkap yang bersumber dari `kbih_data.json`.

### 2. Memperbarui Seluruh Data (POST)
* **URL**: `http://localhost:3000/api/data`
* **Metode**: `POST`
* **Header**: `Content-Type: application/json`
* **Body**: Objek JSON penuh yang berisi struktur database baru.
* **Deskripsi**: Menggantikan isi `kbih_data.json` dengan data yang dikirim dan menyimpannya ke disk secara aman.

### 3. Mengunggah Berkas Cetak / Lampiran Dokumen (POST)
* **URL**: `http://localhost:3000/api/upload`
* **Metode**: `POST`
* **Body**: `{ "fileName": "nama_file.jpg", "base64": "data:image/jpeg;base64,..." }`
* **Deskripsi**: Mengubah lampiran PDF/Gambar menjadi file fisik di folder `/uploads` pada komputer lokal dan menghasilkan tautan statis untuk diakses aplikasi.

---

## 💾 Ekspor, Impor, dan Pencadangan Manual

Meskipun aplikasi melakukan sinkronisasi otomatis ke file `kbih_data.json` di localhost, Anda tetap bisa melakukan pencadangan manual dari UI aplikasi:
1. Buka halaman **Pengaturan Sistem (Administratif)**.
2. Geser ke bagian **C. Kendali Utilitas Database (Offline Persistence)**.
3. Klik tombol **Ekspor Database (.JSON)** untuk langsung mengunduh salinan database ke folder *Downloads* browser Anda. 
4. Anda dapat menggunakan tombol **Impor Database** untuk mengunggah berkas JSON yang sudah diekspor sebelumnya guna memulihkan atau memindahkan data ke komputer operator lainnya.
