import React, { useState } from 'react';
import { Question } from '../types';
import { formatQuestionText } from '../utils/questionFormatter';
import { BookOpen, Clock, Flag, ChevronLeft, ChevronRight, Brain, Grid, X } from 'lucide-react';

interface TestViewProps {
  questions: Question[];
  currentIndex: number;
  answers: (string | null)[];
  raguList: boolean[];
  timeRemaining: number; // in seconds
  mapelTitle?: string;
  subTitle?: string;
  mapel?: string;
  onAnswer: (optId: string) => void;
  onToggleRagu: (isRagu: boolean) => void;
  onSelectQuestion: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
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
  onAnswer,
  onToggleRagu,
  onSelectQuestion,
  onPrev,
  onNext,
  onFinish,
}) => {
  const [showMobileNav, setShowMobileNav] = useState(false);

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
              {mapelTitle || `CBT ${mapel || 'Sosiologi'} Assessment TKA`}
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
            onClick={onFinish}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95 shrink-0"
          >
            <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Selesaikan Ujian</span><span className="sm:hidden">Selesai</span>
          </button>
        </div>
      </header>

      {/* Main Examination Canvas */}
      <main className="flex-1 flex overflow-hidden relative">
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
                <button
                  onClick={onNext}
                  disabled={currentIndex === questions.length - 1}
                  className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <span className="hidden xs:inline">Selanjutnya</span> <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onFinish}
                  className="px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Selesaikan Ujian"
                >
                  <Flag className="w-4 h-4" /> Selesai
                </button>
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
    </div>
  );
};

