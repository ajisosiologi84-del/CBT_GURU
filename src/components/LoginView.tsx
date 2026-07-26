import React, { useState } from 'react';
import { AppConfig, StudentInfo } from '../types';
import { exportOfflineAppHtml } from '../utils/offlineExport';
import { Laptop, User, Key, LogIn, Settings, AlertCircle, Sparkles, KeyRound, Users, Download, WifiOff } from 'lucide-react';

interface LoginViewProps {
  config: AppConfig;
  onStudentLoginSuccess: (studentInfo: StudentInfo) => void;
  onAdminLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  config,
  onStudentLoginSuccess,
  onAdminLoginSuccess,
}) => {
  const [activeMode, setActiveMode] = useState<'student' | 'admin'>('student');
  
  // Student Login Fields
  const [nis, setNis] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  // Admin Login Fields
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedNis = nis.trim();
    const trimmedToken = tokenInput.trim().toUpperCase();
    const activeExamToken = config.examToken ? config.examToken.trim().toUpperCase() : 'SOS2026';

    if (!trimmedNis) {
      triggerError('Harap masukkan NIS / No. Peserta!');
      return;
    }

    if (!trimmedToken) {
      triggerError('Harap masukkan TOKEN Ujian yang diberikan Guru!');
      return;
    }

    if (trimmedToken !== activeExamToken) {
      triggerError(`TOKEN Ujian "${trimmedToken}" Salah atau Tidak Valid! Minta Token resmi kepada Guru.`);
      return;
    }

    // Token is valid! Find registered student or build guest info
    const foundStudent = config.students.find(
      (s) => s.nis.toLowerCase() === trimmedNis.toLowerCase()
    );

    const currentMapelStr = `${config.mapel || 'Sosiologi'} (${config.mapelTitle || 'Assessment TKA 2026'})`;

    let studentInfo: StudentInfo;
    if (foundStudent) {
      studentInfo = {
        name: foundStudent.nama,
        noPeserta: `${foundStudent.nis} (${foundStudent.kelas})`,
        mapel: currentMapelStr,
      };
    } else {
      // If student not found in pre-registered DB, treat as guest with entered NIS
      studentInfo = {
        name: `Siswa NIS: ${trimmedNis}`,
        noPeserta: `NIS-${trimmedNis}`,
        mapel: currentMapelStr,
      };
    }

    onStudentLoginSuccess(studentInfo);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (adminUser.trim() === 'admin' && adminPass.trim() === 'admin') {
      onAdminLoginSuccess();
    } else {
      triggerError('Kredensial Admin/Guru tidak valid!');
    }
  };

  const handleQuickDemoStudent = (demoNis: string) => {
    setNis(demoNis);
    setTokenInput(config.examToken || 'SOS2026');
    setErrorMsg('');
  };

  const handleQuickDemoAdmin = () => {
    setActiveMode('admin');
    setAdminUser('admin');
    setAdminPass('admin');
    setErrorMsg('');
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 fixed inset-0 z-50 p-3 sm:p-6 overflow-y-auto custom-scrollbar">
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-md my-auto overflow-hidden transition-transform duration-300 shrink-0 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-7 text-center text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md shadow-inner">
            <Laptop className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Portal CBT Mandiri</h1>
          <p className="text-blue-100 text-xs mt-1 font-medium">Sosiologi - Assessment TKA SMA 2026</p>
        </div>

        {/* Mode Selector Switcher */}
        <div className="p-2 bg-slate-100 mx-6 mt-6 rounded-2xl flex border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveMode('student');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              activeMode === 'student'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Masuk Siswa (TOKEN)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('admin');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              activeMode === 'admin'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" /> Panel Guru
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {activeMode === 'student' ? (
            /* Student Form with NIS & TOKEN */
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              {/* Active Token Badge Helper */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-blue-800 font-medium">
                  <KeyRound className="w-4 h-4 text-blue-600" /> Token Ujian Aktif:
                </div>
                <span className="bg-blue-600 text-white font-mono font-black text-sm px-3 py-1 rounded-xl tracking-wider shadow-xs">
                  {config.examToken || 'SOS2026'}
                </span>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1.5" htmlFor="nis">
                  NIS / No. Peserta Siswa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="nis"
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="Contoh: 1001"
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1.5" htmlFor="token">
                  TOKEN Ujian Dari Guru
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    id="token"
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                    placeholder="Masukkan TOKEN (misal: SOS2026)"
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-sm font-mono font-bold tracking-widest text-blue-900 uppercase"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] text-sm mt-2"
              >
                <LogIn className="w-4 h-4" /> Masuk Ujian CBT
              </button>
            </form>
          ) : (
            /* Admin Form */
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1.5" htmlFor="adminUser">
                  Username Guru / Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="adminUser"
                    type="text"
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    placeholder="Username Admin"
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1.5" htmlFor="adminPass">
                  Password Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    id="adminPass"
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="Password Admin"
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-sm font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] text-sm mt-2"
              >
                <LogIn className="w-4 h-4" /> Masuk Panel Guru
              </button>
            </form>
          )}

          {/* Quick Autofill Helper Buttons */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <p className="text-center text-[11px] text-gray-400 font-medium">Uji Coba Cepat (Autofill Akun Demo):</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('student');
                  const firstNis = config.students.length > 0 ? config.students[0].nis : '1001';
                  handleQuickDemoStudent(firstNis);
                }}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 border border-blue-200"
              >
                <Sparkles className="w-3.5 h-3.5" /> Siswa (NIS {config.students.length > 0 ? config.students[0].nis : '1001'})
              </button>
              <button
                type="button"
                onClick={handleQuickDemoAdmin}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 border border-slate-300"
              >
                <Settings className="w-3.5 h-3.5" /> Panel Guru
              </button>
            </div>
          </div>

          {/* Download Aplikasi CBT Offline Banner */}
          <div className="pt-3 border-t border-slate-100">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-3.5 shadow-md border border-slate-700">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-black text-xs text-white">Butuh Ujian Tanpa Kuota / Offline?</p>
                    <p className="text-[10px] text-slate-300">Unduh file aplikasi standalone untuk siswa</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => exportOfflineAppHtml(config)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-black py-2 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Aplikasi Offline (.html)
              </button>
            </div>
          </div>

          <p className="text-center text-[11px] text-gray-400">© 2026 @AJISOSIOLOGI - Secure CBT System</p>
        </div>
      </div>
    </div>
  );
};
