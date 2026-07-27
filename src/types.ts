export interface Option {
  id: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  question: string;
  options: Option[];
  explanation: string;
  image?: string; // Base64 data URL or image URL for question image / table / diagram
  isActive?: boolean; // Default true, toggle to enable/disable for exam
  mapel?: string; // Mata pelajaran (e.g. 'Sosiologi', 'Geografi', etc.)
}

export interface StudentUser {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  isActive?: boolean; // Status aktif mengikuti ujian (default true)
}

export interface TeacherUser {
  id: string;
  nip: string;
  nama: string;
  mapel: string;
}

export interface KopSekolahConfig {
  namaSekolah: string; // e.g. "SMA NEGERI 1 JAKARTA"
  dinas: string; // e.g. "DINAS PENDIDIKAN PROVINSI DKI JAKARTA"
  alamat: string; // e.g. "Jl. Budi Utomo No. 7, Jakarta Pusat"
  teleponWeb: string; // e.g. "Telp: (021) 3865001 | Website: www.sman1jakarta.sch.id"
  kotaTanggal: string; // e.g. "Jakarta, 26 Juli 2026"
  namaGuru: string; // e.g. "Drs. Aji Sosiologi, M.Pd"
  nipGuru: string; // e.g. "198501152010011002"
  jabatanGuru: string; // e.g. "Guru Mata Pelajaran Sosiologi"
  namaKepalaSekolah?: string; // e.g. "Dr. H. Ahmad Sanusi, M.Si"
  nipKepalaSekolah?: string; // e.g. "197203101998021001"
}

export interface AppConfig {
  duration: number; // in minutes
  kkm: number; // 0 - 100
  questions: Question[];
  examToken: string; // Token Ujian saat ini
  students: StudentUser[]; // Daftar user/siswa terdaftar
  teachers?: TeacherUser[]; // Daftar user/guru terdaftar
  mapel?: string; // e.g. 'Sosiologi'
  mapelTitle?: string; // e.g. 'Assessment TKA Sosiologi SMA'
  subTitle?: string; // e.g. 'Perubahan Sosial & Globalisasi'
  mapelList?: string[]; // Pilihan daftar mata pelajaran
  maxQuestionsToDisplay?: number; // Jumlah soal yang dikeluarkan/ditampilkan untuk ujian (0 = semua)
  maxAttempts?: number; // Batas maksimal percobaan ujian (default 1)
  randomizeQuestions?: boolean; // Acak urutan soal (default true)
  randomizeOptions?: boolean; // Acak urutan pilihan A, B, C, D, E (default true)
  kopSekolah?: KopSekolahConfig; // Pengaturan Kop Sekolah & Tanda Tangan Guru
}

export type ViewState = 'login' | 'admin' | 'pre-test' | 'test' | 'result' | 'review';

export interface StudentInfo {
  name: string;
  noPeserta: string;
  mapel: string;
  role?: 'student' | 'teacher';
}

export interface StudentResult {
  id: string;
  studentInfo: StudentInfo;
  score: number;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  kkm: number;
  isPassed: boolean;
  answers: (string | null)[];
  warnings: number;
  submittedAt: string;
}

export interface EncryptedResultPayload {
  version: string;
  data: StudentResult;
  hash: string;
}
