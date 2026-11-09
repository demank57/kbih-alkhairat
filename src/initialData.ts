import { SystemState } from './types';

export const INITIAL_STATE: SystemState = {
  jamaahList: [
    {
      id: "HJ-2026-0001",
      tglPendaftaran: "2026-01-15",
      noPorsi: "1300089712",
      namaLengkap: "Ahmad Subarjo",
      binBinti: "Kusnadi (Bin)",
      nik: "3273012304850001",
      jenisKelamin: "Laki-Laki",
      tempatLahir: "Pamekasan",
      tanggalLahir: "1985-04-23",
      noHp: "081234567890",
      alamatDomisili: "Jl. Merdeka No. 45, Kecamatan Sumur Pamekasan, Kota Pamekasan, Jawa Barat",
      noPaspor: "B9871234",
      kantorImigrasi: "Kantor Imigrasi Kelas I Pamekasan",
      tglTerbitPaspor: "2024-05-10",
      tglHabisPaspor: "2034-05-10",
      tinggiBadan: 172,
      beratBadan: 68,
      riwayatPenyakit: "Hipertensi ringan",
      namaMahram: "Siti Aminah",
      hubunganMahram: "Suami/Istri",
      nikMahram: "3273016409870002",
      noHpMahram: "081298765432",
      alamatMahram: "Jl. Merdeka No. 45, Kota Pamekasan",
      dokumenKK: "kk_subarjo.pdf",
      dokumenKTP: "ktp_subarjo.jpg",
      dokumenFoto: "foto_subarjo_4x6.jpg",
      statusAdministrasi: "Lengkap",
      periodeTahun: "2026"
    },
    {
      id: "HJ-2026-0002",
      tglPendaftaran: "2026-02-12",
      noPorsi: "1300089855",
      namaLengkap: "Siti Aminah",
      binBinti: "Mansyur (Binti)",
      nik: "3273016409870002",
      jenisKelamin: "Perempuan",
      tempatLahir: "Sumedang",
      tanggalLahir: "1987-09-24",
      noHp: "081298765432",
      alamatDomisili: "Jl. Merdeka No. 45, Kecamatan Sumur Pamekasan, Kota Pamekasan, Jawa Barat",
      noPaspor: "B9871235",
      kantorImigrasi: "Kantor Imigrasi Kelas I Pamekasan",
      tglTerbitPaspor: "2024-05-10",
      tglHabisPaspor: "2034-05-10",
      tinggiBadan: 158,
      beratBadan: 54,
      riwayatPenyakit: "Tidak Ada",
      namaMahram: "Ahmad Subarjo",
      hubunganMahram: "Suami/Istri",
      nikMahram: "3273012304850001",
      noHpMahram: "081234567890",
      alamatMahram: "Jl. Merdeka No. 45, Kota Pamekasan",
      dokumenKK: "kk_subarjo.pdf",
      dokumenKTP: "ktp_siti.jpg",
      dokumenFoto: "foto_siti_4x6.jpg",
      statusAdministrasi: "Lengkap",
      periodeTahun: "2026"
    },
    {
      id: "HJ-2026-0003",
      tglPendaftaran: "2026-03-01",
      noPorsi: "1300090214",
      namaLengkap: "Budi Satria Utama",
      binBinti: "Wibowo (Bin)",
      nik: "3174091211790003",
      jenisKelamin: "Laki-Laki",
      tempatLahir: "Jakarta",
      tanggalLahir: "1979-11-12",
      noHp: "085677889900",
      alamatDomisili: "Jl. Kemang Raya No. 12B, Mampang Prapatan, Jakarta Selatan",
      noPaspor: "A1122334",
      kantorImigrasi: "Kantor Imigrasi Kelas I Jakarta Selatan",
      tglTerbitPaspor: "2025-01-20",
      tglHabisPaspor: "2035-01-20",
      tinggiBadan: 178,
      beratBadan: 82,
      riwayatPenyakit: "Diabetes Mellitus Tipe 2 (Terkontrol)",
      namaMahram: "",
      hubunganMahram: "",
      nikMahram: "",
      noHpMahram: "",
      alamatMahram: "",
      dokumenKK: null,
      dokumenKTP: "ktp_budi.jpg",
      dokumenFoto: "foto_budi.jpg",
      statusAdministrasi: "Belum Lengkap",
      periodeTahun: "2026"
    },
    {
      id: "HJ-2027-0001",
      tglPendaftaran: "2026-04-18",
      noPorsi: "1300091410",
      namaLengkap: "Rina Kusuma Astuti",
      binBinti: "Haryono (Binti)",
      nik: "3578054410920005",
      jenisKelamin: "Perempuan",
      tempatLahir: "Surabaya",
      tanggalLahir: "1992-10-04",
      noHp: "087755443322",
      alamatDomisili: "Dharmahusada Permai Blok C-10, Mulyorejo, Surabaya, Jawa Timur",
      noPaspor: "",
      kantorImigrasi: "",
      tglTerbitPaspor: "",
      tglHabisPaspor: "",
      tinggiBadan: 162,
      beratBadan: 58,
      riwayatPenyakit: "Asma (Ringan)",
      namaMahram: "Haryono",
      hubunganMahram: "Orang Tua",
      nikMahram: "3578051203550001",
      noHpMahram: "081122334455",
      alamatMahram: "Dharmahusada Permai Blok C-10, Surabaya",
      dokumenKK: "kk_haryono.pdf",
      dokumenKTP: "ktp_rina.png",
      dokumenFoto: null,
      statusAdministrasi: "Belum Lengkap",
      periodeTahun: "2027"
    }
  ],
  periodeList: [
    {
      id: "P-01",
      tahun: "2026",
      kuota: 250,
      status: "buka"
    },
    {
      id: "P-02",
      tahun: "2027",
      kuota: 300,
      status: "buka"
    },
    {
      id: "P-03",
      tahun: "2028",
      kuota: 350,
      status: "tutup"
    }
  ],
  paymentList: [
    {
      id: "TX-260101",
      jamaahId: "HJ-2026-0001",
      jenisSetoran: "Setoran Awal",
      nominal: 25000000,
      tanggalTransaksi: "2026-01-15",
      status: "Berhasil",
      keterangan: "Pembayaran setoran awal untuk pendaftaran porsi haji murni"
    },
    {
      id: "TX-260102",
      jamaahId: "HJ-2026-0002",
      jenisSetoran: "Setoran Awal",
      nominal: 25000000,
      tanggalTransaksi: "2026-02-12",
      status: "Berhasil",
      keterangan: "Setoran awal porsi haji"
    },
    {
      id: "TX-260103",
      jamaahId: "HJ-2026-0001",
      jenisSetoran: "Cicilan",
      nominal: 10000000,
      tanggalTransaksi: "2026-03-10",
      status: "Berhasil",
      keterangan: "Angsuran biaya perlengkapan & akomodasi KBIH"
    },
    {
      id: "TX-260104",
      jamaahId: "HJ-2026-0002",
      jenisSetoran: "Cicilan",
      nominal: 10000000,
      tanggalTransaksi: "2026-03-10",
      status: "Berhasil",
      keterangan: "Angsuran biaya perlengkapan & akomodasi KBIH"
    },
    {
      id: "TX-260105",
      jamaahId: "HJ-2026-0003",
      jenisSetoran: "Setoran Awal",
      nominal: 25000000,
      tanggalTransaksi: "2026-03-01",
      status: "Berhasil",
      keterangan: "Setoran awal via Bank Penerima Setoran (BPS) BPIH"
    },
    {
      id: "TX-260106",
      jamaahId: "HJ-2026-0001",
      jenisSetoran: "Pelunasan",
      nominal: 12500000,
      tanggalTransaksi: "2026-05-20",
      status: "Berhasil",
      keterangan: "Pelunasan sisa BPIH tahun berjalan"
    },
    {
      id: "TX-260107",
      jamaahId: "HJ-2027-0001",
      jenisSetoran: "Setoran Awal",
      nominal: 25000000,
      tanggalTransaksi: "2026-04-20",
      status: "Pending",
      keterangan: "Setoran awal porsi haji (Verifikasi Bank)"
    }
  ],
  lembaga: {
    namaLembaga: "KBIH Al-Mabrur Mandiri",
    namaPengelola: "H. Mustofa Kamal, M.Ag",
    noHp: "081122339900",
    alamat: "Jl. Masjid Agung No. 10, Kel. Citarum, Kec. Pamekasan Wetan, Kota Pamekasan, Jawa Barat",
    logo: ""
  },
  accounts: [
    {
      id: "ACC-01",
      username: "admin",
      nama: "Suleman Al-Farisi",
      peran: "Admin"
    },
    {
      id: "ACC-02",
      username: "pengelola_kbih",
      nama: "Hj. Sarah Ramadani",
      peran: "Pengelola"
    }
  ],
  departureScheduleList: []
};
