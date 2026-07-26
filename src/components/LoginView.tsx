import React, { useState } from 'react';
import { AppConfig, StudentInfo } from '../types';
import { User, Key, LogIn, Settings, AlertCircle, KeyRound, Users, GraduationCap, BookOpen, UserCheck } from 'lucide-react';
import { CbtLogo } from './CbtLogo';

interface LoginViewProps {
  config: AppConfig;
  onStudentLoginSuccess: (studentInfo: StudentInfo) => void;
  onAdminLoginSuccess: (role: 'admin' | 'teacher') => void;
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

    // Token is valid! Find registered student
    const foundStudent = config.students.find(
      (s) => s.nis.toLowerCase() === trimmedNis.toLowerCase()
    );

    if (!foundStudent) {
      triggerError(`NIS "${trimmedNis}" tidak terdaftar di Data Siswa. Harap hubungi Guru pengampu.`);
      return;
    }

    const currentMapelStr = `${config.mapel || 'Sosiologi'} (${config.mapelTitle || 'Assessment TKA 2026'})`;

    const studentInfo: StudentInfo = {
      name: foundStudent.nama,
      noPeserta: `${foundStudent.nis} (${foundStudent.kelas})`,
      mapel: currentMapelStr,
      role: 'student',
    };

    onStudentLoginSuccess(studentInfo);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const u = adminUser.trim();
    const p = adminPass.trim();
    const uLower = u.toLowerCase();

    if (uLower === 'admin' && p === 'admin') {
      onAdminLoginSuccess('admin');
      return;
    }

    if (uLower === 'guru' && p === 'guru') {
      onAdminLoginSuccess('teacher');
      return;
    }

    // Check if u and p match any teacher's NIP in config.teachers
    const foundTeacher = (config.teachers || []).find(
      (t) => t.nip.trim() === u && t.nip.trim() === p
    );

    if (foundTeacher) {
      onAdminLoginSuccess('teacher');
      return;
    }

    triggerError('Kredensial tidak valid! (Admin: admin/admin | Guru: NIP / NIP)');
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 fixed inset-0 z-50 p-3 sm:p-6 overflow-y-auto custom-scrollbar">
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-md my-auto overflow-hidden transition-transform duration-300 shrink-0 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 text-center text-white relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
          <CbtLogo className="w-24 h-24 mb-2 drop-shadow-md" />
          <h1 className="text-xl font-black tracking-tight">Portal CBT Mandiri</h1>
          <p className="text-blue-200 text-xs mt-0.5 font-medium">Sosiologi - Assessment TKA SMA 2026</p>
        </div>

        {/* Mode Selector Switcher */}
        <div className="p-1.5 bg-slate-100 mx-4 sm:mx-6 mt-5 rounded-2xl flex border border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveMode('student');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'student'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> User Siswa
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('admin');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'admin'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Panel Guru
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {activeMode === 'student' ? (
            /* Student Form with NIS & TOKEN */
            <form onSubmit={handleStudentSubmit} className="space-y-3.5">
              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1" htmlFor="nis">
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
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1" htmlFor="token">
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
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] text-sm mt-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Masuk Ujian CBT (Siswa)
              </button>
            </form>
          ) : (
            /* Admin / Guru Panel Form */
            <form onSubmit={handleAdminSubmit} className="space-y-3.5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600">
                <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-600" /> Akses Panel CBT:
                </p>
                <div className="flex justify-between items-center text-[11px] mt-1 bg-white p-2 rounded-xl border border-slate-100">
                  <span>🔑 Admin System: <strong className="font-mono text-indigo-700">admin / admin</strong></span>
                </div>
                <div className="flex justify-between items-center text-[11px] mt-1 bg-white p-2 rounded-xl border border-slate-100">
                  <span>🎓 User Guru: <strong className="font-mono text-indigo-700">NIP / NIP</strong> (atau guru / guru)</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1" htmlFor="adminUser">
                  Username
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
                    placeholder="Masukkan Username (admin / guru)"
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1" htmlFor="adminPass">
                  Password
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
                    placeholder="Masukkan Password"
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-sm font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] text-sm mt-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Masuk Panel CBT
              </button>
            </form>
          )}

          <p className="text-center text-[11px] text-gray-400 border-t border-gray-100 pt-3">
            <a href="https://lynk.id/ajisosiologi" target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-blue-600">
              @ajisosiologi
            </a>{' '}
            - Secure CBT System
          </p>
        </div>
      </div>
    </div>
  );
};
