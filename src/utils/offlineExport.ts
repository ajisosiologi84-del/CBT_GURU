import { AppConfig } from '../types';

export function exportOfflineAppHtml(config: AppConfig): void {
  const mapelName = config.mapel || 'Sosiologi';
  const mapelTitle = config.mapelTitle || `Assessment TKA ${mapelName} SMA`;
  const subTitle = config.subTitle || 'Perubahan Sosial & Globalisasi';
  
  // Only export active questions
  const activeQuestions = config.questions.filter((q) => q.isActive !== false);
  const activeConfig = {
    ...config,
    questions: activeQuestions,
  };
  const configJson = JSON.stringify(activeConfig);

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aplikasi CBT ${mapelName} Offline Mandiri</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .animate-shake { animation: shake 0.4s ease-in-out; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  </style>
</head>
<body class="bg-slate-900 text-slate-800 font-sans min-h-screen flex flex-col justify-between antialiased">

  <!-- Header -->
  <header class="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-3 text-white flex justify-between items-center">
    <div class="flex items-center gap-2 sm:gap-3">
      <div class="bg-blue-600 text-white font-black px-2.5 sm:px-3 py-1 rounded-xl text-xs sm:text-sm tracking-wider">CBT OFFLINE</div>
      <div>
        <h1 class="font-bold text-xs sm:text-base leading-tight">${mapelTitle}</h1>
        <p class="text-[10px] sm:text-xs text-slate-400">Mode Tanpa Internet (Standalone Offline App)</p>
      </div>
    </div>
    <div class="text-right text-[10px] sm:text-xs text-slate-400">
      <span class="text-emerald-400 font-bold">● Offline Siap</span>
    </div>
  </header>

  <!-- Main Container -->
  <main id="app-root" class="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
    <div id="login-screen" class="bg-white rounded-3xl shadow-2xl w-full max-w-md my-auto overflow-hidden">
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 sm:p-6 text-center text-white">
        <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2 text-2xl">💻</div>
        <h2 class="text-xl font-black">Ujian CBT Offline</h2>
        <p class="text-blue-100 text-xs mt-0.5">${mapelName} - ${subTitle}</p>
      </div>

      <div class="p-4 sm:p-6 space-y-4">
        <div id="error-alert" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-semibold"></div>

        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 flex justify-between items-center text-xs text-blue-900">
          <span class="font-medium">🔑 Token Ujian Aktif:</span>
          <span id="active-token-badge" class="font-mono font-black bg-blue-600 text-white px-2.5 py-1 rounded-lg text-sm"></span>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase text-slate-600 mb-1">NIS / No. Peserta</label>
          <input type="text" id="input-nis" placeholder="Masukkan NIS (contoh: 1001)" class="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-semibold focus:border-blue-500 outline-none">
        </div>

        <div>
          <label class="block text-xs font-bold uppercase text-slate-600 mb-1">TOKEN Ujian Dari Guru</label>
          <input type="text" id="input-token" placeholder="Masukkan TOKEN" class="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-bold font-mono uppercase tracking-widest text-blue-900 focus:border-blue-500 outline-none">
        </div>

        <button id="btn-login" class="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 rounded-xl text-sm transition shadow-md">
          Mulai Ujian Offline
        </button>

        <p class="text-center text-[11px] text-slate-400">© 2026 Standalone Offline CBT Sosiologi</p>
      </div>
    </div>

    <!-- Exam Screen -->
    <div id="test-screen" class="hidden bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-auto overflow-hidden flex flex-col min-h-[500px]">
      <div class="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center border-b border-slate-800 gap-2">
        <div>
          <span id="student-display-name" class="font-bold text-xs sm:text-sm text-blue-300 truncate block"></span>
          <p id="student-display-nis" class="text-[10px] sm:text-xs text-slate-400 truncate"></p>
        </div>
        <div class="bg-slate-800 border border-slate-700 text-amber-400 font-mono font-black text-xs sm:text-base px-3 sm:px-4 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0">
          <span>⏱️</span>
          <span id="timer-display">00:00</span>
        </div>
      </div>

      <div class="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-4 sm:space-y-6">
        <div>
          <div class="flex justify-between items-center mb-3">
            <span id="q-number-badge" class="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-lg"></span>
            <span id="q-total-badge" class="text-xs text-slate-400 font-medium"></span>
          </div>

          <div id="question-text" class="text-sm sm:text-base text-slate-900 font-semibold leading-relaxed mb-4 sm:mb-6"></div>

          <div id="options-container" class="space-y-2.5 sm:space-y-3"></div>
        </div>

        <!-- Controls -->
        <div class="flex justify-between items-center pt-3 sm:pt-4 border-t border-slate-100 gap-2 flex-wrap">
          <button id="btn-prev" class="px-3.5 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition">
            ← Sebelum
          </button>
          
          <button id="btn-finish" class="px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition">
            Selesaikan & Unduh Hasil (.cbt)
          </button>

          <button id="btn-next" class="px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition">
            Lanjut →
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Finish Modal -->
    <div id="confirm-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
        <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">❓</div>
        <div>
          <h3 class="text-lg font-extrabold text-slate-800">Selesaikan Ujian?</h3>
          <p class="text-xs text-slate-500 mt-1">Apakah Anda yakin ingin mengakhiri ujian dan mengunduh file hasil (.cbt)?</p>
        </div>
        <div class="flex gap-2">
          <button id="btn-cancel-finish" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition">
            Batal
          </button>
          <button id="btn-confirm-finish" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md">
            Ya, Selesaikan
          </button>
        </div>
      </div>
    </div>

    <!-- Result Screen -->
    <div id="result-screen" class="hidden bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center space-y-6">
      <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black">✓</div>
      <div>
        <h2 class="text-2xl font-black text-slate-900">Ujian Selesai!</h2>
        <p class="text-xs text-slate-500 mt-1">Jawaban Anda berhasil disimpan dan terenkripsi secara aman.</p>
      </div>

      <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-2">
        <p class="text-xs text-slate-500 font-bold uppercase">SKOR PEROLEHAN ANDA</p>
        <div id="final-score-text" class="text-5xl font-black text-blue-600">0</div>
        <p id="final-status-text" class="text-xs font-bold text-slate-600"></p>
      </div>

      <div class="space-y-3">
        <button id="btn-download-cbt" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2">
          📥 Unduh File Jawaban Terenkripsi (.cbt)
        </button>
        <p class="text-[11px] text-slate-400">Kirimkan file <b>.cbt</b> yang diunduh ini kepada Guru Anda untuk direkap.</p>
      </div>
    </div>
  </main>

  <!-- Offline Script Engine -->
  <script>
    const CONFIG = ${configJson};
    let currentStudent = null;
    let activeQuestionIndex = 0;
    let userAnswers = Array(CONFIG.questions.length).fill(null);
    let warningsCount = 0;
    let timeLeftSeconds = (CONFIG.duration || 60) * 60;
    let timerInterval = null;
    let lastResultObj = null;

    const SECRET_KEY = 'CBT_SOSIOLOGI_2026_KEY_GURU_SEKOLAH_SECURE_AUTH';

    function calculateHash(str) {
      let hash1 = 5381;
      let hash2 = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash1 = (hash1 * 33) ^ char;
        hash2 = (hash2 << 5) - hash2 + char;
        hash1 |= 0;
        hash2 |= 0;
      }
      return Math.abs(hash1).toString(36) + Math.abs(hash2).toString(36);
    }

    function encryptResult(resultObj) {
      const jsonStr = JSON.stringify(resultObj);
      const hash = calculateHash(jsonStr);

      const encoder = new TextEncoder();
      const jsonBytes = encoder.encode(jsonStr);
      const keyBytes = encoder.encode(SECRET_KEY);

      const cipherBytes = new Uint8Array(jsonBytes.length);
      for (let i = 0; i < jsonBytes.length; i++) {
        cipherBytes[i] = jsonBytes[i] ^ keyBytes[i % keyBytes.length];
      }

      let binary = '';
      for (let i = 0; i < cipherBytes.length; i++) {
        binary += String.fromCharCode(cipherBytes[i]);
      }
      const base64Cipher = btoa(binary);

      return JSON.stringify({
        cbtHeader: 'CBT_SOSIOLOGI_2026_ENCRYPTED_FILE',
        version: '2.0',
        hash: hash,
        payload: base64Cipher,
        studentName: resultObj.studentInfo ? resultObj.studentInfo.name : 'Siswa',
        noPeserta: resultObj.studentInfo ? resultObj.studentInfo.noPeserta : '',
        score: resultObj.score,
        timestamp: new Date().toISOString()
      }, null, 2);
    }

    let isExamFinished = false;
    let isModalOpen = false;

    // DOM Elements
    const activeTokenBadge = document.getElementById('active-token-badge');
    const inputNis = document.getElementById('input-nis');
    const inputToken = document.getElementById('input-token');
    const btnLogin = document.getElementById('btn-login');
    const errorAlert = document.getElementById('error-alert');

    const loginScreen = document.getElementById('login-screen');
    const testScreen = document.getElementById('test-screen');
    const resultScreen = document.getElementById('result-screen');
    const confirmModal = document.getElementById('confirm-modal');

    const studentDisplayName = document.getElementById('student-display-name');
    const studentDisplayNis = document.getElementById('student-display-nis');
    const timerDisplay = document.getElementById('timer-display');

    const qNumberBadge = document.getElementById('q-number-badge');
    const qTotalBadge = document.getElementById('q-total-badge');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');

    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnFinish = document.getElementById('btn-finish');
    const btnCancelFinish = document.getElementById('btn-cancel-finish');
    const btnConfirmFinish = document.getElementById('btn-confirm-finish');

    const finalScoreText = document.getElementById('final-score-text');
    const finalStatusText = document.getElementById('final-status-text');
    const btnDownloadCbt = document.getElementById('btn-download-cbt');

    // Initialize
    activeTokenBadge.textContent = CONFIG.examToken || 'SOS2026';

    function showError(msg) {
      errorAlert.textContent = msg;
      errorAlert.classList.remove('hidden');
    }

    btnLogin.addEventListener('click', () => {
      errorAlert.classList.add('hidden');
      const nis = inputNis.value.trim();
      const token = inputToken.value.trim().toUpperCase();
      const validToken = (CONFIG.examToken || 'SOS2026').toUpperCase();

      if (!nis) return showError('Harap masukkan NIS!');
      if (!token) return showError('Harap masukkan TOKEN Ujian!');
      if (token !== validToken) return showError('TOKEN Ujian Salah atau Tidak Valid!');

      const students = CONFIG.students || [];
      const found = students.find(s => s.nis.toLowerCase() === nis.toLowerCase());

      if (found) {
        currentStudent = { name: found.nama, noPeserta: found.nis + ' (' + found.kelas + ')', mapel: 'Sosiologi TKA 2026' };
      } else {
        currentStudent = { name: 'Siswa NIS: ' + nis, noPeserta: 'NIS-' + nis, mapel: 'Sosiologi TKA 2026' };
      }

      startExam();
    });

    function startExam() {
      loginScreen.classList.add('hidden');
      testScreen.classList.remove('hidden');

      studentDisplayName.textContent = currentStudent.name;
      studentDisplayNis.textContent = currentStudent.noPeserta;

      renderQuestion();
      startTimer();

      window.addEventListener('blur', () => {
        if (isExamFinished || isModalOpen) return;
        warningsCount++;
        alert('⚠️ PERINGATAN KECURANGAN (' + warningsCount + 'x): Anda dideteksi berpindah window/aplikasi!');
      });
    }

    function renderQuestion() {
      const q = CONFIG.questions[activeQuestionIndex];
      qNumberBadge.textContent = 'Soal ' + (activeQuestionIndex + 1);
      qTotalBadge.textContent = 'Total ' + CONFIG.questions.length + ' Soal';
      questionText.innerHTML = q.question;

      optionsContainer.innerHTML = '';
      q.options.forEach((opt) => {
        const selected = userAnswers[activeQuestionIndex] === opt.id;
        const btn = document.createElement('button');
        btn.className = 'w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 text-sm font-semibold ' +
          (selected ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-800');
        
        btn.innerHTML = '<span class="w-7 h-7 rounded-lg font-bold flex items-center justify-center shrink-0 ' +
          (selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600') + '">' + opt.id + '</span>' +
          '<span>' + opt.text + '</span>';

        btn.addEventListener('click', () => {
          userAnswers[activeQuestionIndex] = opt.id;
          renderQuestion();
        });

        optionsContainer.appendChild(btn);
      });

      btnPrev.disabled = activeQuestionIndex === 0;
      btnNext.disabled = activeQuestionIndex === CONFIG.questions.length - 1;
    }

    btnPrev.addEventListener('click', () => {
      if (activeQuestionIndex > 0) {
        activeQuestionIndex--;
        renderQuestion();
      }
    });

    btnNext.addEventListener('click', () => {
      if (activeQuestionIndex < CONFIG.questions.length - 1) {
        activeQuestionIndex++;
        renderQuestion();
      }
    });

    btnFinish.addEventListener('click', () => {
      isModalOpen = true;
      confirmModal.classList.remove('hidden');
    });

    btnCancelFinish.addEventListener('click', () => {
      confirmModal.classList.add('hidden');
      isModalOpen = false;
    });

    btnConfirmFinish.addEventListener('click', () => {
      confirmModal.classList.add('hidden');
      isModalOpen = false;
      finishExam();
    });

    function startTimer() {
      timerInterval = setInterval(() => {
        timeLeftSeconds--;
        if (timeLeftSeconds <= 0) {
          clearInterval(timerInterval);
          alert('Waktu ujian telah habis! Jawaban Anda akan disubmit secara otomatis.');
          finishExam();
        } else {
          const m = Math.floor(timeLeftSeconds / 60);
          const s = timeLeftSeconds % 60;
          timerDisplay.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        }
      }, 1000);
    }

    function finishExam() {
      isExamFinished = true;
      clearInterval(timerInterval);
      let correct = 0;
      CONFIG.questions.forEach((q, idx) => {
        const userOpt = userAnswers[idx];
        const correctOpt = q.options.find(o => o.isCorrect);
        if (userOpt && correctOpt && userOpt === correctOpt.id) correct++;
      });

      const total = CONFIG.questions.length;
      const score = Math.round((correct / total) * 100);
      const isPassed = score >= (CONFIG.kkm || 75);

      lastResultObj = {
        id: 'RES-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        studentInfo: currentStudent,
        score: score,
        correctCount: correct,
        incorrectCount: total - correct,
        totalQuestions: total,
        kkm: CONFIG.kkm || 75,
        isPassed: isPassed,
        answers: userAnswers,
        warnings: warningsCount,
        submittedAt: new Date().toLocaleString('id-ID')
      };

      testScreen.classList.add('hidden');
      resultScreen.classList.remove('hidden');

      finalScoreText.textContent = score;
      finalStatusText.textContent = isPassed ? 'STATUS: LULUS (≥ KKM ' + CONFIG.kkm + ')' : 'STATUS: TIDAK LULUS (< KKM ' + CONFIG.kkm + ')';
    }

    btnDownloadCbt.addEventListener('click', () => {
      if (!lastResultObj) return alert('Data jawaban tidak ditemukan!');
      const encrypted = encryptResult(lastResultObj);
      const blob = new Blob([encrypted], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanName = currentStudent.name.replace(/[^a-zA-Z0-9]/g, '_');
      link.href = url;
      link.download = 'HASIL_OFFLINE_CBT_' + currentStudent.noPeserta + '_' + cleanName + '.cbt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('File hasil jawaban terenkripsi (.cbt) berhasil diunduh!');
    });
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Aplikasi_CBT_Sosiologi_Offline_2026.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
