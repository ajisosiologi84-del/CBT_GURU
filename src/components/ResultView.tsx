import React from 'react';
import { Check, X, Lightbulb, RotateCcw, Download, Lock, ShieldCheck } from 'lucide-react';

interface ResultViewProps {
  score: number;
  correctCount: number;
  incorrectCount: number;
  kkm: number;
  studentName: string;
  noPeserta: string;
  onDownloadEncryptedResult: () => void;
  onViewDiscussion: () => void;
  onRestart: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  score,
  correctCount,
  incorrectCount,
  kkm,
  studentName,
  noPeserta,
  onDownloadEncryptedResult,
  onViewDiscussion,
  onRestart,
}) => {
  const isPassed = score >= kkm;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 fixed inset-0 z-40 overflow-y-auto p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in p-6 sm:p-10 text-center relative border border-gray-100 my-auto">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-blue-50 rounded-br-full -z-10 opacity-70"></div>
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-indigo-50 rounded-tl-full -z-10 opacity-70"></div>

        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3.5 py-1 rounded-full text-xs font-bold mb-3 border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Mode Offline & Jawaban Terenkripsi Aman
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-1">Ujian Selesai!</h1>
        <p className="text-gray-500 text-xs sm:text-sm mb-6">
          Terima kasih <span className="font-bold text-gray-700">{studentName}</span> ({noPeserta}) - Assessment TKA Sosiologi 2026
        </p>

        {/* Score & Counters Grid */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-6">
          <div className="bg-slate-50 rounded-3xl p-5 border-2 border-slate-100 w-44 shadow-xs">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Skor Akhir</div>
            <div className={`text-5xl font-black ${isPassed ? 'text-blue-600' : 'text-red-500'}`}>
              {score}
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 text-left bg-emerald-50/60 px-4 py-2.5 rounded-2xl border border-emerald-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <div className="text-xs text-emerald-800 font-bold">Jawaban Benar</div>
                <div className="font-black text-lg text-emerald-900">{correctCount} Soal</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-left bg-red-50/60 px-4 py-2.5 rounded-2xl border border-red-100">
              <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-xs">
                <X className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <div className="text-xs text-red-800 font-bold">Jawaban Salah</div>
                <div className="font-black text-lg text-red-900">{incorrectCount} Soal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pass Status Banner */}
        <div
          className={`inline-block px-6 py-2 rounded-full font-bold text-xs sm:text-sm mb-6 shadow-xs border ${
            isPassed
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-red-100 text-red-800 border-red-300'
          }`}
        >
          {isPassed ? `LULUS (Melampaui KKM ${kkm})` : `TIDAK LULUS (Di bawah KKM ${kkm})`}
        </div>

        {/* Encrypted Download Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-5 rounded-2xl mb-6 shadow-lg text-left relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30 text-blue-300 shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-white">Unduh File Jawaban Terenkripsi (.cbt)</h3>
              <p className="text-xs text-blue-100/80 mt-1 leading-relaxed">
                Unduh file jawaban ini untuk dikirimkan kepada <b>Guru/Pengawas</b>. File ini terenkripsi rapat sehingga tidak dapat diubah dan aman dari kecurangan.
              </p>
              <button
                onClick={onDownloadEncryptedResult}
                className="mt-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md flex items-center gap-2 text-xs active:scale-95"
              >
                <Download className="w-4 h-4" /> Unduh File Jawaban (.cbt)
              </button>
            </div>
          </div>
        </div>

        {/* Other Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={onViewDiscussion}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 text-xs"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" /> Lihat Pembahasan Ilmiah (HOTS)
          </button>

          <button
            onClick={onRestart}
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-gray-300"
          >
            <RotateCcw className="w-4 h-4" /> Keluar
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mt-6">© 2026 @AJISOSIOLOGI - Offline Secure Assessment System</p>
      </div>
    </div>
  );
};
