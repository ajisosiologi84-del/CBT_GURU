import React from 'react';
import { Download, ShieldCheck, CheckCircle2, LogOut } from 'lucide-react';

interface ResultViewProps {
  score: number;
  correctCount: number;
  incorrectCount: number;
  kkm: number;
  studentName: string;
  noPeserta: string;
  onDownloadEncryptedResult: () => void;
  onViewDiscussion?: () => void;
  onRestart: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  studentName,
  noPeserta,
  onDownloadEncryptedResult,
  onRestart,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 fixed inset-0 z-40 overflow-y-auto p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in p-6 sm:p-10 text-center relative border border-gray-100 my-auto space-y-6">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-emerald-50 rounded-br-full -z-10 opacity-70"></div>
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-sky-50 rounded-tl-full -z-10 opacity-70"></div>

        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1 rounded-full text-xs font-bold mb-3 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Mode Offline & Jawaban Terenkripsi Aman
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Ujian Telah Selesai!</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Terima kasih <span className="font-bold text-slate-800">{studentName}</span> ({noPeserta})
          </p>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Status Pengiriman Jawaban
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Jawaban Anda telah tersimpan secara otomatis dan terenkripsi. Silakan unduh file <b>.cbt</b> di bawah ini dan serahkan kepada Guru atau Pengawas Ujian Anda untuk direkap.
          </p>
        </div>

        {/* Encrypted Download Banner */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md text-left space-y-3">
          <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">File Hasil Ujian Terenkripsi (.cbt)</p>
          <p className="text-xs text-slate-300 leading-relaxed">
            File ini berisi rekaman jawaban Anda yang telah diamankan secara digital agar tidak dapat diubah oleh pihak mana pun.
          </p>
          <button
            onClick={onDownloadEncryptedResult}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3 px-5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Unduh File Jawaban (.cbt)
          </button>
        </div>

        {/* Exit Action */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onRestart}
            className="w-full bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold py-3.5 px-5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4" /> Keluar dari Aplikasi (Kembali ke Halaman Utama)
          </button>
        </div>

        <p className="text-[11px] text-gray-400 pt-2">
          <a href="https://lynk.id/ajisosiologi" target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-blue-600">
            @ajisosiologi
          </a>{' '}
          - Offline Secure Assessment System
        </p>
      </div>
    </div>
  );
};
