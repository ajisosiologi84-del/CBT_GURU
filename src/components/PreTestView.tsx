import React from 'react';
import { AppConfig, StudentInfo } from '../types';
import { BookOpen, Clock, ShieldAlert, PlayCircle, CheckCircle2, Award } from 'lucide-react';

interface PreTestViewProps {
  config: AppConfig;
  studentInfo: StudentInfo;
  onStartTest: () => void;
}

export const PreTestView: React.FC<PreTestViewProps> = ({ config, studentInfo, onStartTest }) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-100 fixed inset-0 z-40 p-3 sm:p-6 overflow-y-auto custom-scrollbar">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl my-auto overflow-hidden border border-gray-100 animate-fade-in flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="border-b border-gray-100 p-4 sm:p-6 bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-800">Konfirmasi Data Peserta</h2>
              <p className="text-[10px] sm:text-xs text-gray-500">Sistem CBT Assessment TKA Sosiologi 2026</p>
            </div>
          </div>
          <span className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> Terverifikasi
          </span>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Nama Siswa</p>
                <p className="font-bold text-base sm:text-lg text-gray-800 mt-0.5">{studentInfo.name}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Nomor Peserta</p>
                <p className="font-mono font-bold text-slate-700 text-sm sm:text-base mt-0.5">{studentInfo.noPeserta}</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Mata Pelajaran</p>
                <p className="font-bold text-blue-600 text-sm sm:text-base mt-0.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 shrink-0" /> {studentInfo.mapel}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Durasi & Jumlah Soal</p>
                <p className="font-bold text-gray-800 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-500 shrink-0" /> {config.duration} Menit | {config.questions.length} Butir Soal HOTS
                </p>
              </div>
            </div>
          </div>

          {/* Security & Rules Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
            <h3 className="font-bold text-amber-900 mb-2 sm:mb-2.5 flex items-center gap-2 text-xs sm:text-sm">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" /> Tata Tertib & Keamanan Ujian CBT
            </h3>
            <ul className="text-xs text-amber-900 space-y-1.5 sm:space-y-2 list-disc pl-4 sm:pl-5 leading-relaxed">
              <li>Ujian memerlukan akses <b>Layar Penuh (Fullscreen)</b> secara otomatis.</li>
              <li>Sistem mendeteksi jika Anda berpindah tab, mengecilkan layar, atau membuka aplikasi lain.</li>
              <li>Pelanggaran berturut-turut dikendalikan sistem (<b>maksimal 3 kali peringatan</b>). Pelanggaran ke-4 akan mengumpulkan jawaban secara otomatis!</li>
              <li>Dilarang menyalin (Copy-Paste) atau menggunakan tombol pintas keyboard (F12, Ctrl+C/V/U, PrintScreen).</li>
            </ul>
          </div>

          <button
            onClick={onStartTest}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 sm:py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg active:scale-[0.98]"
          >
            <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7" /> Mulai Mengerjakan Ujian
          </button>
        </div>
      </div>
    </div>
  );
};
