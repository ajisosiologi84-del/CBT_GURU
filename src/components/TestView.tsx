import React, { useState, useEffect } from 'react';
import { Question, BroadcastAlert } from '../types';
import { formatQuestionText } from '../utils/questionFormatter';
import { BookOpen, Clock, Flag, ChevronLeft, ChevronRight, Brain, Grid, X, CheckCircle2, ShieldAlert, Lock, Megaphone, Bell, AlertTriangle } from 'lucide-react';

interface TestViewProps {
  questions: Question[];
  currentIndex: number;
  answers: (string | null)[];
  raguList: boolean[];
  timeRemaining: number; // in seconds
  mapelTitle?: string;
  subTitle?: string;
  mapel?: string;
  studentName?: string;
  noPeserta?: string;
  warnings?: number;
  maxWarnings?: number;
  broadcastAlert?: BroadcastAlert | null;
  onDismissBroadcastAlert?: () => void;
  onAnswer: (optId: string) => void;
  onToggleRagu: (isRagu: boolean) => void;
  onSelectQuestion: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  onScreenRecordDetected?: (reason: string) => void;
}

export const TestView: React.FC<TestViewProps> = ({
  questions,
  currentIndex,
  answers,
  raguList,
  timeRemaining,
  mapelTitle,
  subTitle,
  mapel,
  studentName,
  noPeserta,
  warnings = 0,
  maxWarnings = 3,
  broadcastAlert,
  onDismissBroadcastAlert,
  onAnswer,
  onToggleRagu,
  onSelectQuestion,
  onPrev,
  onNext,
  onFinish,
  onScreenRecordDetected,
}) => {
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showFinalFinishConfirm, setShowFinalFinishConfirm] = useState(false);
  const [isConfirmedChecked, setIsConfirmedChecked] = useState(false);
  const [isBlackedOut, setIsBlackedOut] = useState(false);
  const [blackoutReason, setBlackoutReason] = useState<string>('');

  // Intercept Screen Capture & Screenshot Attempts
  useEffect(() => {
    const clearClipboard = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('').catch(() => {});
      }
    };

    const triggerBlackout = (reason: string) => {
      clearClipboard();
      setBlackoutReason(reason);
      setIsBlackedOut(true);
      if (onScreenRecordDetected) {
        onScreenRecordDetected(reason);
      }
    };

    // Override Web Screen Recording API
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const origDisplay = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getDisplayMedia = async function(...args) {
        triggerBlackout('Perekaman Layar HP/Desktop (Screen Capture API) terdeteksi!');
        throw new Error('Screen capture is blocked by CBT System.');
      };
      return () => {
        navigator.mediaDevices.getDisplayMedia = origDisplay;
      };
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.key.toLowerCase() === 'p') ||
        (e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ['s', 'i', 'j'].includes(e.key.toLowerCase())) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        triggerBlackout('Tangkapan Layar (Screenshot) / Shortcut Perekaman Dilarang!');
      }
    };

    const handleKeyup = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        clearClipboard();
        triggerBlackout('Tombol PrintScreen ditekan! Papan Klip Dibersihkan.');
      }
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('keyup', handleKeyup);
    };
  }, [onScreenRecordDetected]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const isRagu = raguList[currentIndex];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isTimeCritical = timeRemaining < 300; // less than 5 minutes
  const answeredCount = answers.filter((a) => a !== null).length;
  const unansweredCount = questions.length - answeredCount;
  const raguCount = raguList.filter(Boolean).length;

  const handleConfirmFinish = () => {
    setShowFinalFinishConfirm(false);
    setShowFinishModal(false);
    setIsConfirmedChecked(false);
    onFinish();
  };

  const renderNavGrid = () => (
    <div className="grid grid-cols-5 sm:grid-cols-5 gap-2.5">
      {questions.map((_, i) => {
        const isAns = answers[i] !== null;
        const isRag = raguList[i];
        const isActive = i === currentIndex;

        let bgStyles = 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100';
        if (isRag) {
          bgStyles = 'bg-amber-400 border-amber-500 text-white font-black shadow-xs';
        } else if (isAns) {
          bgStyles = 'bg-emerald-500 border-emerald-600 text-white font-black shadow-xs';
        }

        const ringStyles = isActive ? 'ring-2 ring-blue-600 ring-offset-2 font-black scale-105' : '';

        return (
          <button
            key={i}
            onClick={() => {
              onSelectQuestion(i);
              setShowMobileNav(false);
            }}
            className={`w-full aspect-square border-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${bgStyles} ${ringStyles}`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center shrink-0 z-20">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <div className="bg-blue-600 text-white w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl font-bold shadow-md shadow-blue-200 shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-xs sm:text-base leading-tight text-gray-800 truncate">
              {mapelTitle || `CBT ${mapel || 'Siswa'} Assessment TKA SMA`}
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate hidden sm:block">
              {subTitle || 'Perubahan Sosial & Globalisasi'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Mobile Grid Drawer Toggle */}
          <button
            onClick={() => setShowMobileNav(true)}
            className="lg:hidden bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
            title="Buka Navigasi Soal"
          >
            <Grid className="w-4 h-4 text-blue-600" />
            <span className="hidden xs:inline">Daftar</span> ({answeredCount}/{questions.length})
          </button>

          {/* Status Peringatan Pelanggaran Badge */}
          <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
            warnings > 0
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <ShieldAlert className={`w-3.5 h-3.5 ${warnings > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
            <span className="hidden md:inline">Pelanggaran:</span>
            <span>{warnings}/{maxWarnings}</span>
          </div>

          {/* Timer Display */}
          <div className="bg-slate-100 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-slate-200 flex items-center gap-2 sm:gap-3">
            <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isTimeCritical ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 leading-none hidden sm:block">
                Sisa Waktu
              </p>
              <p className={`font-mono font-bold text-xs sm:text-lg ${isTimeCritical ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                {formatTime(timeRemaining)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFinishModal(true)}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Selesaikan Ujian</span><span className="sm:hidden">Selesai</span>
          </button>
        </div>
      </header>

      {/* Main Examination Canvas */}
      <main className="flex-1 flex overflow-hidden relative no-capture">
        {/* Dynamic Anti-Leak Watermark Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex flex-wrap justify-around items-center select-none opacity-15 rotate-[-22deg] p-4 font-mono text-[11px] font-black text-slate-800 leading-loose tracking-widest">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="m-8 whitespace-nowrap">
              {studentName || 'PESERTA UJIAN'} • NIS: {noPeserta || 'CBT-2026'} • DILARANG MEREKAM / SCREENSHOT
            </div>
          ))}
        </div>
        {/* Left Area: Current Question */}
        <div className="flex-1 flex flex-col p-3 sm:p-6 overflow-y-auto custom-scrollbar">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-8 max-w-4xl w-full mx-auto flex-1 flex flex-col my-auto sm:my-0">
            {/* Question Badge Header */}
            <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-gray-100 pb-3 sm:pb-4 shrink-0">
              <span className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full">
                Soal No. {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-gray-400 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" /> Penalaran HOTS
              </span>
            </div>

            {/* Question Image / Diagram / Table if present */}
            {currentQuestion?.image && (
              <div className="mb-5 flex justify-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <img
                  src={currentQuestion.image}
                  alt="Lampiran Soal"
                  className="max-h-72 sm:max-h-96 w-auto object-contain rounded-xl border border-slate-100"
                />
              </div>
            )}

            {/* Question Text */}
            <div
              className="text-sm sm:text-base md:text-lg text-gray-800 mb-6 leading-relaxed font-medium overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: formatQuestionText(currentQuestion?.question) }}
            />

            {/* Answer Options */}
            <div className="space-y-2.5 sm:space-y-3 mb-6 flex-1">
              {currentQuestion?.options.map((opt) => {
                const isSelected = currentAnswer === opt.id;
                return (
                  <label
                    key={opt.id}
                    className="relative block cursor-pointer group"
                    onClick={() => onAnswer(opt.id)}
                  >
                    <div
                      className={`p-3 sm:p-4 border-2 rounded-2xl transition-all flex gap-3 sm:gap-4 items-start ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 text-gray-500 group-hover:border-blue-400'
                        }`}
                      >
                        {opt.id}
                      </div>
                      <div className="text-gray-800 text-xs sm:text-base font-medium leading-relaxed pt-0.5">
                        {opt.text}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Navigation Footer Controls */}
            <div className="mt-auto border-t border-gray-100 pt-4 sm:pt-6 flex justify-between items-center shrink-0 gap-2 flex-wrap">
              <button
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> <span className="hidden xs:inline">Sebelumnya</span>
              </button>

              <label className="flex items-center gap-2 cursor-pointer group px-3 py-1.5 sm:py-2 rounded-xl border-2 border-amber-200 hover:bg-amber-50 transition-colors">
                <input
                  type="checkbox"
                  checked={isRagu}
                  onChange={(e) => onToggleRagu(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <span className="font-bold text-xs sm:text-sm text-amber-800 group-hover:text-amber-900 transition-colors">
                  Ragu-ragu
                </span>
              </label>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={onNext}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <span>Selanjutnya</span> <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowFinishModal(true)}
                    className="px-5 sm:px-6 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 active:scale-95 cursor-pointer"
                    title="Selesaikan Ujian"
                  >
                    <Flag className="w-4 h-4" /> <span>Selesai Ujian</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Right Sidebar: Navigation Grid */}
        <div className="hidden lg:flex w-72 lg:w-80 bg-white border-l border-gray-200 flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-5 border-b border-gray-200 bg-slate-50 sticky top-0 z-10">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Grid className="w-4 h-4 text-blue-600" /> Navigasi Soal ({answeredCount}/{questions.length})
            </h3>
            <div className="flex gap-3 mt-3 text-xs text-gray-600 font-semibold flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-md bg-emerald-500"></div> Dijawab
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-md bg-amber-400"></div> Ragu
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-md border-2 border-gray-300 bg-white"></div> Belum
              </div>
            </div>
          </div>

          <div className="p-5">{renderNavGrid()}</div>
        </div>

        {/* Mobile Navigation Drawer Modal Overlay */}
        {showMobileNav && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-t-3xl p-5 max-h-[80vh] flex flex-col shadow-2xl border-t border-slate-200 animate-slide-up">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-base">Navigasi Soal Ujian</h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {answeredCount}/{questions.length} Dijawab
                  </span>
                </div>
                <button
                  onClick={() => setShowMobileNav(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-3 mb-4 text-xs text-slate-600 font-semibold justify-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-md bg-emerald-500"></div> Dijawab
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-md bg-amber-400"></div> Ragu
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-md border-2 border-gray-300 bg-white"></div> Belum
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">{renderNavGrid()}</div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL KONFIRMASI SELESAI UJIAN */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 relative overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
                  <Flag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 leading-tight">
                    Konfirmasi Selesaikan Ujian
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Cek kembali rangkuman pengerjaan Anda
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFinishModal(false);
                  setIsConfirmedChecked(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rangkuman Jawaban Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Dijawab</div>
                <div className="text-2xl font-black text-emerald-900 font-mono mt-0.5">{answeredCount}</div>
                <div className="text-[10px] text-emerald-600 font-semibold">dari {questions.length} soal</div>
              </div>

              <div className={`p-3 rounded-2xl text-center border ${unansweredCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-[10px] uppercase font-bold ${unansweredCount > 0 ? 'text-red-700' : 'text-slate-500'}`}>Belum Dijawab</div>
                <div className={`text-2xl font-black font-mono mt-0.5 ${unansweredCount > 0 ? 'text-red-900' : 'text-slate-700'}`}>{unansweredCount}</div>
                <div className="text-[10px] text-slate-500 font-semibold">soal kosong</div>
              </div>

              <div className={`p-3 rounded-2xl text-center border ${raguCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-[10px] uppercase font-bold ${raguCount > 0 ? 'text-amber-800' : 'text-slate-500'}`}>Ragu-Ragu</div>
                <div className={`text-2xl font-black font-mono mt-0.5 ${raguCount > 0 ? 'text-amber-950' : 'text-slate-700'}`}>{raguCount}</div>
                <div className="text-[10px] text-slate-500 font-semibold">soal ragu</div>
              </div>
            </div>

            {/* Warning Alert if incomplete */}
            {(unansweredCount > 0 || raguCount > 0) && (
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl mb-5 flex items-start gap-3 text-amber-950">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed font-semibold">
                  {unansweredCount > 0 && raguCount > 0 ? (
                    <span>
                      <b>Perhatian!</b> Masih terdapat <b>{unansweredCount} soal belum dijawab</b> dan <b>{raguCount} soal bertanda ragu-ragu</b>.
                    </span>
                  ) : unansweredCount > 0 ? (
                    <span>
                      <b>Perhatian!</b> Masih terdapat <b>{unansweredCount} soal belum dijawab</b>. Soal yang kosong bernilai 0.
                    </span>
                  ) : (
                    <span>
                      <b>Perhatian!</b> Terdapat <b>{raguCount} soal</b> yang masih bertanda ragu-ragu.
                    </span>
                  )}
                  <p className="text-[11px] text-amber-800 font-normal mt-0.5">
                    Sebaiknya periksa kembali navigasi soal sebelum mengirimkan jawaban akhir.
                  </p>
                </div>
              </div>
            )}

            {/* Checkbox Confirmation */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={isConfirmedChecked}
                onChange={(e) => setIsConfirmedChecked(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-0.5 shrink-0"
              />
              <div className="text-xs text-slate-800 font-medium leading-snug">
                Saya telah memeriksa seluruh jawaban dan <b>yakin ingin menyelesaikan</b> ujian ini sekarang.
              </div>
            </label>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowFinishModal(false);
                  setIsConfirmedChecked(false);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Batal & Periksa
              </button>
              <button
                type="button"
                onClick={() => setShowFinalFinishConfirm(true)}
                disabled={!isConfirmedChecked}
                className={`px-5 py-2.5 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md ${
                  isConfirmedChecked
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 cursor-pointer active:scale-95'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Ya, Selesaikan Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI AKHIR 100% YAKIN SELESAI */}
      {showFinalFinishConfirm && (
        <div className="fixed inset-0 z-[10001] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-4 border-emerald-500 space-y-5 text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-300">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="bg-emerald-100 text-emerald-900 font-mono font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                🔒 KONFIRMASI ULANG AKHIR
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Apakah Anda YAKIN 100% Sudah Selesai?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Setelah Anda menekan tombol <b>"BISMILLAH, KIRIM JAWABAN AKHIR"</b>, seluruh hasil pekerjaan Anda akan langsung dikunci dan dikirim ke server. <b>Jawaban TIDAK DAPAT diubah kembali!</b>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs text-slate-700 font-semibold space-y-1 text-left">
              <div className="flex justify-between">
                <span>Total Soal Terjawab:</span>
                <span className="font-bold text-emerald-700">{answeredCount} dari {questions.length}</span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Soal Belum Dijawab (Kosong):</span>
                  <span className="font-bold">{unansweredCount} soal</span>
                </div>
              )}
              {raguCount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Soal Bertanda Ragu:</span>
                  <span className="font-bold">{raguCount} soal</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowFinalFinishConfirm(false)}
                className="w-full sm:w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-3 rounded-2xl text-xs transition cursor-pointer"
              >
                Cek Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmFinish}
                className="w-full sm:w-1/2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black px-4 py-3 rounded-2xl text-xs transition shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> YAKIN, KIRIM!
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Broadcast Alert Modal from Proktor (Point 2) */}
      {broadcastAlert && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-amber-400 space-y-5 relative overflow-hidden text-slate-800">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 shrink-0 animate-bounce">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <span className="bg-amber-100 text-amber-900 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-amber-300 uppercase tracking-wider block w-max">
                  📢 PESAN & PERINGATAN RESMI PROKTOR
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-1">
                  Pengawas Ujian (Proktor)
                </h3>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              <p className="whitespace-pre-wrap">{broadcastAlert.message}</p>
              <div className="mt-3 pt-2 border-t border-amber-200/60 flex justify-between items-center text-[11px] text-amber-900/70 font-semibold">
                <span>Pengirim: {broadcastAlert.sender || 'Proktor Ujian'}</span>
                <span>{broadcastAlert.createdAt}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onDismissBroadcastAlert}
                className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Saya Mengerti & Mengikuti Arahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blackout Anti-Recording & Screenshot Shield Overlay */}
      {isBlackedOut && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center text-white select-none animate-fade-in">
          <div className="w-20 h-20 bg-red-600/20 rounded-3xl flex items-center justify-center border-4 border-red-500 mb-5 animate-pulse shadow-2xl shadow-red-900/50">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-red-500 mb-2 tracking-wide">
            LAYAR TERKUNCI: PROTEKSI PEREKAMAN / TANGKAPAN LAYAR
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mb-6 leading-relaxed font-medium bg-red-950/40 border border-red-900/50 p-4 rounded-2xl">
            {blackoutReason || 'Sistem mendeteksi percobaan perekaman layar, tombol PrintScreen, atau pengalihan aplikasi.'}
            <br />
            <span className="text-amber-400 font-bold block mt-1">
              Papan klip (Clipboard) telah dibersihkan demi keamanan soal ujian.
            </span>
          </p>
          <button
            onClick={() => setIsBlackedOut(false)}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold px-8 py-3.5 rounded-2xl text-sm shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <ShieldAlert className="w-5 h-5" /> Buka Kembali Layar Ujian
          </button>
        </div>
      )}
    </div>
  );
};

