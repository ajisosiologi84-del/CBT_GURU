import React, { useState } from 'react';
import { AppConfig, StudentInfo, StudentUser } from '../types';
import { User, Key, LogIn, Settings, AlertCircle, KeyRound, Users, GraduationCap, BookOpen, UserCheck, FileUp, HelpCircle, CheckCircle2, Download, Sparkles, Building2 } from 'lucide-react';
import { CbtLogo } from './CbtLogo';
import { decryptAppBackup } from '../utils/crypto';

interface LoginViewProps {
  config: AppConfig;
  onStudentLoginSuccess: (studentInfo: StudentInfo) => void;
  onAdminLoginSuccess: (role: 'admin' | 'teacher') => void;
  onSaveConfig?: (newConfig: AppConfig) => void;
  showAlert?: (msg: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  config,
  onStudentLoginSuccess,
  onAdminLoginSuccess,
  onSaveConfig,
  showAlert,
}) => {
  const [activeMode, setActiveMode] = useState<'student' | 'admin'>('student');
  
  // Student Login Fields
  const [nis, setNis] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  // Self-Registration Fallback for unlisted NIS
  const [unlistedNis, setUnlistedNis] = useState<string | null>(null);
  const [customNama, setCustomNama] = useState('');
  const [customKelas, setCustomKelas] = useState('');

  // Admin Login Fields
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // Guidance / Help Modal
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleImportConfigJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = decryptAppBackup(content);

        const restoredConfig = parsed.config || (parsed.questions ? parsed : null);
        if (!restoredConfig || !Array.isArray(restoredConfig.questions)) {
          triggerError('File backup JSON tidak memiliki struktur data Bank Soal yang valid!');
          return;
        }

        if (onSaveConfig) {
          onSaveConfig(restoredConfig);
          setErrorMsg('');
          setSuccessMsg(
            `Paket Ujian "${restoredConfig.mapel || 'CBT'}" Berhasil Dimuat! Token Aktif: "${restoredConfig.examToken || 'SOS2026'}" (${restoredConfig.questions.length} Soal)`
          );
        }
      } catch (err: any) {
        console.error(err);
        triggerError(err.message || 'Gagal membaca/mendekripsi file JSON! Pastikan file adalah backup terenkripsi resmi CBT.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

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
      triggerError(`TOKEN Ujian "${trimmedToken}" Salah atau Tidak Valid! Minta Token resmi kepada Guru (Token Aktif: ${activeExamToken}).`);
      return;
    }

    // Token is valid! Find registered student
    const foundStudent = config.students.find(
      (s) => s.nis.toLowerCase() === trimmedNis.toLowerCase()
    );

    if (!foundStudent) {
      // NIS not listed, prompt student self-registration fallback
      setUnlistedNis(trimmedNis);
      return;
    }

    if (foundStudent.isActive === false) {
      triggerError(`Siswa ${foundStudent.nama} (${foundStudent.nis}) statusnya NONAKTIF UJIAN. Harap hubungi Guru pengampu untuk mengaktifkan status ujian Anda.`);
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

  const handleSelfRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNama.trim()) {
      triggerError('Harap masukkan Nama Lengkap Anda!');
      return;
    }

    const newStudent: StudentUser = {
      id: 'st_self_' + Date.now(),
      nis: unlistedNis || '1001',
      nama: customNama.trim(),
      kelas: customKelas.trim() || 'Umum/Mandiri',
      isActive: true,
    };

    // Save to config if possible
    if (onSaveConfig) {
      onSaveConfig({
        ...config,
        students: [...config.students, newStudent],
      });
    }

    const currentMapelStr = `${config.mapel || 'Sosiologi'} (${config.mapelTitle || 'Assessment TKA 2026'})`;

    const studentInfo: StudentInfo = {
      name: newStudent.nama,
      noPeserta: `${newStudent.nis} (${newStudent.kelas})`,
      mapel: currentMapelStr,
      role: 'student',
    };

    onStudentLoginSuccess(studentInfo);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const u = adminUser.trim();
    const p = adminPass.trim();
    const uLower = u.toLowerCase();

    if (!u || !p) {
      triggerError('Harap isi Username/NIP dan Password!');
      return;
    }

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
      (t) => t.nip.trim() === u && (t.nip.trim() === p || p === 'guru' || p === 'admin')
    );

    if (foundTeacher) {
      onAdminLoginSuccess('teacher');
      return;
    }

    triggerError('Otentikasi Gagal! Username/NIP atau Password yang Anda masukkan tidak sesuai.');
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 fixed inset-0 z-50 p-3 sm:p-6 overflow-y-auto custom-scrollbar">
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-md my-auto overflow-hidden transition-transform duration-300 shrink-0 border border-slate-100 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 text-center text-white relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
          <CbtLogo className="w-20 h-20 mb-2 drop-shadow-md" />
          <h1 className="text-xl font-black tracking-tight">Portal CBT Mandiri</h1>
          <p className="text-blue-200 text-xs mt-0.5 font-medium">
            {config.mapel || 'Sosiologi'} - {config.mapelTitle || 'Assessment TKA SMA 2026'}
          </p>

          {/* Import JSON Quick Bar */}
          <div className="mt-3 inline-flex items-center gap-1.5 bg-indigo-950/70 border border-indigo-700/60 rounded-full px-3 py-1 text-[11px]">
            <span className="text-indigo-200 font-medium">Token Aktif:</span>
            <span className="font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
              {config.examToken || 'SOS2026'}
            </span>
          </div>
        </div>

        {/* Mode Selector Switcher */}
        <div className="p-1.5 bg-slate-100 mx-4 sm:mx-6 mt-4 rounded-2xl flex border border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveMode('student');
              setErrorMsg('');
              setSuccessMsg('');
              setUnlistedNis(null);
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'student'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Peserta Ujian (Siswa)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('admin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'admin'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Panel Pengelola Ujian
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* FALLBACK FORM FOR UNLISTED NIS */}
          {unlistedNis ? (
            <form onSubmit={handleSelfRegisterSubmit} className="space-y-3 bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-900 animate-fade-in">
              <div className="text-xs font-bold flex items-center gap-1.5 text-amber-900 border-b border-amber-200 pb-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Registrasi Siswa Mandiri (NIS: {unlistedNis})
              </div>
              <p className="text-[11px] text-amber-800">
                NIS <b>{unlistedNis}</b> belum ada di daftar. Masukkan Nama Lengkap Anda untuk langsung mengikuti ujian:
              </p>

              <div>
                <label className="block text-gray-700 text-[11px] font-bold uppercase mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={customNama}
                  onChange={(e) => setCustomNama(e.target.value)}
                  placeholder="Contoh: Muhammad Budi"
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-[11px] font-bold uppercase mb-1">Kelas (Opsional)</label>
                <input
                  type="text"
                  value={customKelas}
                  onChange={(e) => setCustomKelas(e.target.value)}
                  placeholder="Contoh: XII IPS 2"
                  className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUnlistedNis(null)}
                  className="flex-1 bg-white border border-amber-300 text-amber-900 font-bold py-2 rounded-xl text-xs hover:bg-amber-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  Masuk Ujian
                </button>
              </div>
            </form>
          ) : activeMode === 'student' ? (
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
                    placeholder={`Masukkan TOKEN (misal: ${config.examToken || 'SOS2026'})`}
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
            /* Panel Kelola Ujian Form */
            <form onSubmit={handleAdminSubmit} className="space-y-3.5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-600">
                <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-indigo-600" /> Otentikasi Pengelola Ujian:
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Panel khusus untuk Pengelola Ujian dan Tenaga Pendidik / Guru. Seluruh data terhubung secara terenkripsi ke database Firebase.
                </p>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1" htmlFor="adminUser">
                  Username / NIP Guru
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
                    placeholder="Masukkan Username / NIP Guru"
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
                <LogIn className="w-4 h-4" /> Masuk Panel Pengelola
              </button>
            </form>
          )}

          {/* Quick Import JSON Exam Package Bar */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl p-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition active:scale-98">
              <FileUp className="w-4 h-4 text-indigo-600" />
              <span>Impor Paket Ujian / File Konfigurasi (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportConfigJson}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1 py-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Panduan Sync Soal & Token di HP/Laptop Lain</span>
            </button>
          </div>

          <p className="text-center text-[11px] text-gray-400 pt-1">
            <a href="https://lynk.id/ajisosiologi" target="_blank" rel="noopener noreferrer" className="hover:underline font-bold text-blue-600">
              @ajisosiologi
            </a>{' '}
            - Secure CBT System
          </p>
        </div>
      </div>

      {/* HELP / VERCEL MULTI-DEVICE GUIDANCE MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                Panduan Sinkronisasi Ujian di Berbagai Perangkat
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                <p className="font-bold text-blue-900 mb-1">💡 Mengapa Token / Soal Terbaru Belum Muncul di Perangkat Siswa?</p>
                <p>
                  Aplikasi CBT ini adalah <b>Aplikasi CBT Standalone Berbasis Browser</b>. Seluruh data disimpan dengan aman di peramban (browser) lokal masing-masing perangkat.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-900">Cara Menghubungkan Perangkat Siswa / HP Pengawas:</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
                  <li>
                    <b>Langkah 1 (Guru):</b> Buka <b>Panel Guru</b> → Klik tombol <b>"Backup Data (.json)"</b> di menu Pengaturan.
                  </li>
                  <li>
                    <b>Langkah 2 (Siswa/Pengawas):</b> Pada HP/Laptop yang akan digunakan ujian, klik tombol <b>"Impor Paket Ujian / File Konfigurasi (.json)"</b> di halaman Login ini, lalu pilih file backup JSON tadi.
                  </li>
                  <li>
                    <b>Atau Gunakan File HTML Standalone:</b> Di Panel Guru, klik <b>"Ekspor Aplikasi CBT Offline (Single HTML)"</b>. File HTML ini bisa dibagikan langsung lewat WhatsApp / USB drive ke siswa dan bisa dibuka secara offline tanpa perlu server internet!
                  </li>
                </ol>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 font-medium">
                ✅ <b>Fitur Auto-Registrasi Siswa:</b> Jika Token Ujian sudah benar, siswa yang NIS-nya belum sempat didaftarkan Guru tetap dapat masuk secara otomatis dengan mengisi Nama Lengkap.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

