export interface Jamaah {
  id: string; // HJ-YYYY-XXXX (ID Pendaftaran)
  tglPendaftaran: string;
  noPorsi: string;
  namaLengkap: string;
  binBinti: string;
  nik: string;
  jenisKelamin: 'Laki-Laki' | 'Perempuan';
  tempatLahir: string;
  tanggalLahir: string;
  noHp: string;
  alamatDomisili: string;
  
  // Data Paspor
  noPaspor: string;
  kantorImigrasi: string;
  tglTerbitPaspor: string;
  tglHabisPaspor: string;
  
  // Kesehatan
  tinggiBadan: number; // cm
  beratBadan: number; // kg
  riwayatPenyakit: string;
  
  // Mahram
  namaMahram: string;
  hubunganMahram: 'Suami/Istri' | 'Orang Tua' | 'Anak Kandung' | 'Saudara' | 'Lainnya' | '';
  nikMahram: string;
  noHpMahram: string;
  alamatMahram: string;
  
  // Dokumen (will store mock metadata / base64 or indicators)
  dokumenKK: string | null;  // nama file KK / base64
  dokumenKTP: string | null; // nama file KTP / base64
  dokumenFoto: string | null; // nama file Foto / base64
  
  // Status Administrasi
  statusAdministrasi: 'Lengkap' | 'Belum Lengkap';
  periodeTahun: string; // Hubungan ke Manajemen Periode (misal: "2026")
  statusAktif?: 'Aktif' | 'Tidak Aktif';
}

export interface DepartureSchedule {
  id: string; // DS-XXXXXX
  jamaahId: string; // Link to Jamaah
  tanggalKeberangkatan: string;
  tahunKeberangkatan: string;
  status: 'Draft' | 'Diberangkatkan';
  keterangan?: string;
}

export interface HajiPeriod {
  id: string;
  tahun: string;
  kuota: number;
  status: 'buka' | 'tutup';
}

export interface Payment {
  id: string; // TX-XXXXXX
  jamaahId: string; // Link to Jamaah
  jenisSetoran: 'Setoran Awal' | 'Cicilan' | 'Pelunasan';
  nominal: number;
  tanggalTransaksi: string;
  status: 'Berhasil' | 'Pending' | 'Gagal';
  keterangan?: string;
}

export interface LembagaConfig {
  namaLembaga: string;
  namaPengelola: string;
  noHp: string;
  alamat: string;
  logo?: string; // Base64 data URI of the logo
}

export interface UserAccount {
  id: string;
  username: string;
  nama: string;
  peran: 'Admin' | 'Pengelola';
}

export interface SystemState {
  jamaahList: Jamaah[];
  periodeList: HajiPeriod[];
  paymentList: Payment[];
  lembaga: LembagaConfig;
  accounts: UserAccount[];
  departureScheduleList?: DepartureSchedule[];
}
