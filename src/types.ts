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
  isActive?: boolean; // Default true, toggle to enable/disable for exam
  mapel?: string; // Mata pelajaran (e.g. 'Sosiologi', 'Geografi', etc.)
}

export interface StudentUser {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
}

export interface AppConfig {
  duration: number; // in minutes
  kkm: number; // 0 - 100
  questions: Question[];
  examToken: string; // Token Ujian saat ini
  students: StudentUser[]; // Daftar user/siswa terdaftar
  mapel?: string; // e.g. 'Sosiologi'
  mapelTitle?: string; // e.g. 'Assessment TKA Sosiologi SMA'
  subTitle?: string; // e.g. 'Perubahan Sosial & Globalisasi'
  mapelList?: string[]; // Pilihan daftar mata pelajaran
}

export type ViewState = 'login' | 'admin' | 'pre-test' | 'test' | 'result' | 'review';

export interface StudentInfo {
  name: string;
  noPeserta: string;
  mapel: string;
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
