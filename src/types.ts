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
  subTopik?: string; // Sub Topik / Materi Ujian (e.g. 'Perubahan Sosial', 'Globalisasi', dll)
  kodeGuru?: string; // Kode Guru Pengampu (e.g. 'GURU01', 'GR-AJI')
}

export interface StudentUser {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  isActive?: boolean; // Status aktif mengikuti ujian (default true)
  kodeGuru?: string; // Kode Guru Pengampu / Penanda Guru (e.g. 'GURU01')
}

export interface TeacherUser {
  id: string;
  nip: string;
  nama: string;
  mapel: string;
  kodeGuru?: string; // Kode unik Guru Pengampu
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
  kodeGuru?: string; // e.g. "GURU01"
  namaKepalaSekolah?: string; // e.g. "Dr. H. Ahmad Sanusi, M.Si"
  nipKepalaSekolah?: string; // e.g. "197203101998021001"
}

export interface CheatingLog {
  timestamp: string; // e.g. "10:15:22"
  type: string; // e.g. "Pindah Tab / Keluar Layar", "Mengecilkan Window", "Shortcut Terlarang"
  details?: string;
}

export interface BroadcastAlert {
  id: string;
  message: string;
  targetStudentNis?: string; // empty / 'ALL' = broadcast to all students
  targetStudentName?: string;
  sender?: string;
  createdAt: string;
  type?: 'warning' | 'info' | 'urgent';
}

export interface ExamScheduleConfig {
  startTime?: string; // e.g. "2026-07-29T08:00"
  endTime?: string; // e.g. "2026-07-29T12:00"
  sessionStatus?: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'FORCE_STOPPED';
  lateToleranceMinutes?: number;
  allowReviewAfterFinish?: boolean;
  showScoreImmediately?: boolean;
  strictAntiCheating?: boolean;
  maxCheatingAllowed?: number;
}

export interface AppConfig {
  duration: number; // in minutes
  kkm: number; // 0 - 100
  questions: Question[];
  examToken: string; // Token Ujian saat ini
  updatedAt?: string; // Timestamp ISO update konfigurasi
  students: StudentUser[]; // Daftar user/siswa terdaftar
  teachers?: TeacherUser[]; // Daftar user/guru terdaftar
  mapel?: string; // e.g. 'Sosiologi'
  kodeGuru?: string; // e.g. 'GURU01' / 'G01' - Kode unik Guru Pengampu
  mapelTitle?: string; // e.g. 'Assessment TKA SMA'
  subTitle?: string; // e.g. 'Perubahan Sosial & Globalisasi'
  mapelList?: string[]; // Pilihan daftar mata pelajaran
  maxQuestionsToDisplay?: number; // Jumlah soal yang dikeluarkan/ditampilkan untuk ujian (0 = semua)
  maxAttempts?: number; // Batas maksimal percobaan ujian (default 1)
  randomizeQuestions?: boolean; // Acak urutan soal (default true)
  randomizeOptions?: boolean; // Acak urutan pilihan A, B, C, D, E (default true)
  kopSekolah?: KopSekolahConfig; // Pengaturan Kop Sekolah & Tanda Tangan Guru
  adminUsername?: string; // Username Admin Utama (default: 'admincbt')
  adminPassword?: string; // Password Admin Utama (default: 'JuniorCBT2026')
  driveUploadUrl?: string; // Link Google Drive untuk Upload Hasil Jawaban Siswa
  youtubeGuideUrl?: string; // Link Video YouTube Panduan Guru (dikeloa Admin)
  examSchedule?: ExamScheduleConfig; // Detail Pengaturan Jadwal & Ketentuan Ujian
  broadcastAlert?: BroadcastAlert | null; // Pesan Peringatan Broadcast Proktor Real-time
}

export type ViewState = 'login' | 'admin' | 'pre-test' | 'test' | 'result' | 'review';

export interface StudentInfo {
  name: string;
  noPeserta: string;
  mapel: string;
  kodeGuru?: string;
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
  durationSpentMinutes?: number;
  timeSpentSeconds?: number;
  questionSnapshots?: Question[];
  cheatingLogs?: CheatingLog[];
  ipAddress?: string;
  locationInfo?: string;
  deviceInfo?: string;
  userAgent?: string;
}

export interface EncryptedResultPayload {
  version: string;
  data: StudentResult;
  hash: string;
}
