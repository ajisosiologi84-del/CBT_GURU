import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppConfig, Question, Option, ViewState, StudentInfo, StudentResult, CheatingLog, BroadcastAlert } from './types';
import { defaultQuestions } from './data/defaultQuestions';
import { defaultStudents } from './data/defaultStudents';
import { encryptResult } from './utils/crypto';
import { LoginView } from './components/LoginView';
import { AdminPanel } from './components/AdminPanel';
import { QuestionEditorModal } from './components/QuestionEditorModal';
import { PreTestView } from './components/PreTestView';
import { TestView } from './components/TestView';
import { ResultView } from './components/ResultView';
import { ReviewView } from './components/ReviewView';
import { WarningModal, ConfirmModal, AlertModal } from './components/Modals';
import {
  saveConfigToFirebase,
  loadConfigFromFirebase,
  subscribeConfigFromFirebase,
  saveStudentResultToFirebase,
  loadStudentResultsFromFirebase,
  subscribeStudentResultsFromFirebase,
  loadStudentsFromFirebase,
  loadTeachersFromFirebase,
  saveAllStudentsToFirebase,
  saveAllTeachersToFirebase,
} from './lib/firebase';

const STORAGE_KEY = 'cbt_sosiologi_config_v2';
const RESULTS_KEY = 'cbt_sosiologi_student_results_v1';

export default function App() {
  // App Configuration State
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return {
            ...parsed,
            kodeGuru: parsed.kodeGuru || 'GURU01',
            examToken: parsed.examToken || 'SOS2026',
            students: Array.isArray(parsed.students) ? parsed.students : defaultStudents,
            maxQuestionsToDisplay: typeof parsed.maxQuestionsToDisplay === 'number' ? parsed.maxQuestionsToDisplay : 0,
            maxAttempts: typeof parsed.maxAttempts === 'number' && parsed.maxAttempts > 0 ? parsed.maxAttempts : 1,
            randomizeQuestions: parsed.randomizeQuestions !== false,
            randomizeOptions: parsed.randomizeOptions !== false,
            adminUsername: parsed.adminUsername || 'admincbt',
            adminPassword: parsed.adminPassword || 'JuniorCBT2026',
          };
        }
      }
    } catch (e) {
      console.error('Failed to load local storage config:', e);
    }
    return {
      duration: 60,
      kkm: 75,
      questions: defaultQuestions,
      examToken: 'SOS2026',
      kodeGuru: 'GURU01',
      students: defaultStudents,
      teachers: [
        { id: 't1', nip: '198501152010011002', nama: 'Drs. Aji Sosiologi, M.Pd', mapel: 'Sosiologi', kodeGuru: 'GURU01' },
        { id: 't2', nip: '198803202012022005', nama: 'Siti Rahmawati, S.Pd', mapel: 'Sosiologi', kodeGuru: 'GURU02' },
      ],
      maxQuestionsToDisplay: 0,
      maxAttempts: 1,
      randomizeQuestions: true,
      randomizeOptions: true,
      adminUsername: 'admincbt',
      adminPassword: 'JuniorCBT2026',
    };
  });

  // Student Results Rekap State (for Teacher Admin Panel)
  const [studentResults, setStudentResults] = useState<StudentResult[]>(() => {
    try {
      const saved = localStorage.getItem(RESULTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load student results:', e);
    }
    return [];
  });

  // Save config to LocalStorage & Firebase on updates
  const saveConfig = useCallback((newConfig: AppConfig) => {
    const activeToken = newConfig.examToken?.trim() || 'SOS2026';
    const updatedConfig = {
      ...newConfig,
      examToken: activeToken,
      updatedAt: new Date().toISOString(),
    };
    setConfig(updatedConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
      saveConfigToFirebase(updatedConfig);
      if (updatedConfig.students && updatedConfig.students.length > 0) {
        saveAllStudentsToFirebase(updatedConfig.students);
      }
      if (updatedConfig.teachers && updatedConfig.teachers.length > 0) {
        saveAllTeachersToFirebase(updatedConfig.teachers);
      }
    } catch (e) {
      console.error('Failed to save to local storage or Firebase:', e);
    }
  }, []);

  const saveStudentResults = useCallback((results: StudentResult[]) => {
    setStudentResults(results);
    try {
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
    } catch (e) {
      console.error('Failed to save student results:', e);
    }
  }, []);

  // Helper to merge remote config without losing locally updated token
  const mergeRemoteConfigWithLocalToken = (remoteConfig: AppConfig): AppConfig => {
    let activeToken = remoteConfig.examToken;
    try {
      const localSaved = localStorage.getItem(STORAGE_KEY);
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (parsed && parsed.examToken) {
          const localTime = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 1;
          const remoteTime = remoteConfig.updatedAt ? new Date(remoteConfig.updatedAt).getTime() : 0;

          // Preserve local token if local config is newer or equal, or if remote token is missing or default
          if (localTime >= remoteTime || !remoteConfig.examToken || remoteConfig.examToken === 'SOS2026') {
            activeToken = parsed.examToken;
          }
        }
      }
    } catch (e) {}
    return {
      ...remoteConfig,
      examToken: activeToken || remoteConfig.examToken || 'SOS2026',
    };
  };

  // Firebase Synchronization Effect
  useEffect(() => {
    // Initial fetch from Firebase
    loadConfigFromFirebase().then(async (remoteConfig) => {
      let currentConfig = remoteConfig;
      if (currentConfig && Array.isArray(currentConfig.questions) && currentConfig.questions.length > 0) {
        let merged = mergeRemoteConfigWithLocalToken(currentConfig);

        // Sync remote standalone students & teachers collections if available
        try {
          const [remoteStudents, remoteTeachers] = await Promise.all([
            loadStudentsFromFirebase(),
            loadTeachersFromFirebase(),
          ]);
          if (remoteStudents.length > 0) {
            merged = { ...merged, students: remoteStudents };
          }
          if (remoteTeachers.length > 0) {
            merged = { ...merged, teachers: remoteTeachers };
          }
        } catch (e) {}

        setConfig(merged);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch (e) {}
      }
    }).catch(() => {});

    loadStudentResultsFromFirebase().then((remoteResults) => {
      if (Array.isArray(remoteResults) && remoteResults.length > 0) {
        setStudentResults(remoteResults);
        try {
          localStorage.setItem(RESULTS_KEY, JSON.stringify(remoteResults));
        } catch (e) {}
      }
    }).catch(() => {});

    // Realtime subscribers
    const unsubConfig = subscribeConfigFromFirebase((remoteConfig) => {
      if (remoteConfig && Array.isArray(remoteConfig.questions) && remoteConfig.questions.length > 0) {
        const merged = mergeRemoteConfigWithLocalToken(remoteConfig);
        setConfig((prev) => ({
          ...merged,
          // Preserve students and teachers if already loaded locally and newer
          students: (merged.students && merged.students.length > 0) ? merged.students : prev.students,
          teachers: (merged.teachers && merged.teachers.length > 0) ? merged.teachers : prev.teachers,
        }));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch (e) {}
      }
    });

    const unsubResults = subscribeStudentResultsFromFirebase((remoteResults) => {
      if (Array.isArray(remoteResults)) {
        setStudentResults(remoteResults);
        try {
          localStorage.setItem(RESULTS_KEY, JSON.stringify(remoteResults));
        } catch (e) {}
      }
    });

    return () => {
      unsubConfig();
      unsubResults();
    };
  }, []);

  // View State & Admin Role
  const [viewState, setViewState] = useState<ViewState>('login');
  const [adminRole, setAdminRole] = useState<'admin' | 'teacher'>('admin');

  // Student Session State
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    name: 'Ahmad Fauzi',
    noPeserta: '1001 (XII IPS 1)',
    mapel: 'Sosiologi (Assessment TKA 2026)',
  });

  // Active Test Session State
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [raguList, setRaguList] = useState<boolean[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
  const [warnings, setWarnings] = useState<number>(0);
  const maxWarnings = config.examSchedule?.maxCheatingAllowed || 3;
  const [cheatingLogs, setCheatingLogs] = useState<CheatingLog[]>([]);
  const [ipAddress, setIpAddress] = useState<string>('180.252.12.11');
  const [deviceInfo, setDeviceInfo] = useState<string>('Browser Client (Desktop)');

  // Auto detect IP and Device Info
  useEffect(() => {
    try {
      const ua = navigator.userAgent;
      let platform = 'PC / Desktop';
      if (/Android/i.test(ua)) platform = 'Android Mobile';
      else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'iOS Mobile';
      else if (/Mac/i.test(ua)) platform = 'MacOS';
      else if (/Linux/i.test(ua)) platform = 'Linux';
      
      const res = `${window.screen.width}x${window.screen.height}`;
      setDeviceInfo(`${platform} (${res})`);

      fetch('https://api.ipify.org?format=json')
        .then((res) => res.json())
        .then((data) => {
          if (data?.ip) setIpAddress(data.ip);
        })
        .catch(() => setIpAddress('180.252.12.11 (Local)'));
    } catch (e) {}
  }, []);

  // Modals & Popups State
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [activeBroadcastAlert, setActiveBroadcastAlert] = useState<BroadcastAlert | null>(null);
  const lastBroadcastAlertIdRef = useRef<string | null>(null);

  // Admin Question Modal State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Score Results
  const [finalScore, setFinalScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [lastStudentResult, setLastStudentResult] = useState<StudentResult | null>(null);

  // Helper Alert / Confirm
  const showAlert = (msg: string) => {
    setAlertMsg(msg);
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger = false
  ) => {
    setConfirmData({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmData((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      isDanger,
    });
  };

  // Fisher-Yates Shuffle
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Start CBT Test Initialization
  const handleStartTest = () => {
    const maxAttempts = config.maxAttempts || 1;
    const studentAttemptsCount = studentResults.filter(
      (r) => r.studentInfo.noPeserta.toLowerCase() === studentInfo.noPeserta.toLowerCase() ||
             r.studentInfo.name.toLowerCase() === studentInfo.name.toLowerCase()
    ).length;

    if (studentAttemptsCount >= maxAttempts) {
      showConfirm(
        'Batas Maksimal Ujian Tercapai',
        `Anda telah menyelesaikan ujian ini sebanyak ${studentAttemptsCount} kali (Batas maksimal: ${maxAttempts}x). Anda tidak dapat mengerjakan ujian ini lagi. Ingin kembali ke menu portal?`,
        () => {
          setViewState('login');
        },
        false
      );
      return;
    }

    // Filter only active questions
    const activePool = config.questions.filter((q) => q.isActive !== false);
    if (activePool.length === 0) {
      showAlert('Tidak ada soal yang aktif/dipilih di Bank Soal! Silakan aktifkan soal terlebih dahulu di Panel Pengaturan.');
      return;
    }

    // Attempt Fullscreen
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {
        console.warn('Fullscreen request fell through, proceeding with CBT.');
      });
    }

    // 1. Prepare active questions pool
    let pool = [...activePool];

    // 2. Randomize questions order if enabled (default true)
    if (config.randomizeQuestions !== false) {
      pool = shuffleArray<Question>(pool);
    }

    // 3. Limit total questions displayed if maxQuestionsToDisplay > 0
    const maxQ = Number(config.maxQuestionsToDisplay || 0);
    if (maxQ > 0 && maxQ < pool.length) {
      pool = pool.slice(0, maxQ);
    }

    // 4. Randomize options for each question if enabled (default true)
    const preparedQuestions: Question[] = pool.map((q: Question) => {
      let opts = [...q.options];
      if (config.randomizeOptions !== false) {
        opts = shuffleArray<Option>(opts);
      }
      const labels = ['A', 'B', 'C', 'D', 'E'];
      const mappedOpts: Option[] = opts.map((opt: Option, i: number) => ({
        id: labels[i],
        text: opt.text,
        isCorrect: opt.isCorrect,
      }));
      return {
        ...q,
        options: mappedOpts,
      };
    });

    setActiveQuestions(preparedQuestions);
    setUserAnswers(new Array(preparedQuestions.length).fill(null));
    setRaguList(new Array(preparedQuestions.length).fill(false));
    setCurrentIndex(0);
    setTimeRemaining(config.duration * 60);
    setWarnings(0);
    setCheatingLogs([]);
    setViewState('test');
  };

  // Timer Countdown Effect & Schedule End Time Check (Point 1 - Opsi C)
  useEffect(() => {
    if (viewState !== 'test') return;

    const timer = setInterval(() => {
      // Check if schedule end time is reached
      if (config.examSchedule?.endTime) {
        const endTimeMs = new Date(config.examSchedule.endTime).getTime();
        if (!isNaN(endTimeMs) && Date.now() >= endTimeMs) {
          clearInterval(timer);
          triggerAutoSubmit('⏰ Jam Jadwal Selesai Ujian telah berakhir (Sesuai Batas Waktu Ujian). Seluruh jawaban Anda otomatis dikirim.');
          return;
        }
      }

      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerAutoSubmit('⏰ Waktu Pengerjaan Ujian telah habis! Seluruh jawaban Anda otomatis tersimpan.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [viewState, config.examSchedule?.endTime]);

  // Real-time Exam Session Control (Point 1 - Opsi A) & Broadcast Warning Listener (Point 2)
  useEffect(() => {
    if (viewState !== 'test') return;

    // 1. Force Stop Check: Check if sessionStatus is CLOSED or FORCE_STOPPED by Proktor
    const status = config.examSchedule?.sessionStatus;
    if (status === 'CLOSED' || status === 'FORCE_STOPPED') {
      triggerAutoSubmit('🚨 UJIAN TELAH DIHENTIKAN OLEH PROKTOR / ADMIN! Seluruh jawaban Anda telah tersimpan secara otomatis.');
      return;
    }

    // 2. Individual Student Deactivation Check
    if (studentInfo?.noPeserta && Array.isArray(config.students)) {
      const studentRec = config.students.find(
        (s) => s.nis.toLowerCase() === studentInfo.noPeserta.toLowerCase() || s.id === studentInfo.noPeserta
      );
      if (studentRec && studentRec.isActive === false) {
        triggerAutoSubmit('🚨 Akses Ujian Anda telah dinonaktifkan/diberhentikan oleh Pengawas Ujian.');
        return;
      }
    }

    // 3. Broadcast Proktor Alert Message Listener (Point 2)
    if (config.broadcastAlert && config.broadcastAlert.id !== lastBroadcastAlertIdRef.current) {
      const alertData = config.broadcastAlert;
      const targetNis = alertData.targetStudentNis?.trim();

      const isApplicable =
        !targetNis ||
        targetNis === 'ALL' ||
        targetNis.toLowerCase() === studentInfo.noPeserta.toLowerCase();

      if (isApplicable) {
        lastBroadcastAlertIdRef.current = alertData.id;
        playWarningSound();
        setActiveBroadcastAlert(alertData);
      }
    }
  }, [config, viewState, studentInfo.noPeserta]);

  // Security & Anti-Cheat Handlers (Mobile & Desktop Compatible)
  const playWarningSound = useCallback(() => {
    if (config.enableWarningAudio === false) return;

    try {
      // 1. Play MP3 Warning Alarm Sound
      const mp3Url = config.customWarningAudioUrl || '/warning-alarm.mp3';
      const audio = new Audio(mp3Url);
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('MP3 warning audio autoplay failed or restricted:', err);
        });
      }

      // 2. Dual-Tone Siren Sound Wave (800Hz & 500Hz alternating sweeps)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const now = audioCtx.currentTime;

        const playSirenPulse = (freq1: number, freq2: number, startTime: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq1, startTime);
          osc.frequency.exponentialRampToValueAtTime(freq2, startTime + duration * 0.8);
          gain.gain.setValueAtTime(0.6, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        playSirenPulse(850, 450, now, 0.25);
        playSirenPulse(950, 500, now + 0.25, 0.25);
        playSirenPulse(850, 400, now + 0.50, 0.35);
      }

      // 3. Voice Warning Announcement via Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Peringatan! Pelanggaran kecurangan ujian terdeteksi! Dilarang berpindah layar atau membuka aplikasi lain!');
        utterance.lang = 'id-ID';
        utterance.rate = 1.1;
        utterance.pitch = 1.2;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Audio warning sound not supported or blocked', e);
    }
  }, [config.enableWarningAudio, config.customWarningAudioUrl]);

  const handleTriggerWarning = useCallback(
    (customMsg?: string) => {
      if (viewState !== 'test' || isWarningModalOpen) return;

      playWarningSound();

      const logMsg = customMsg || 'Sistem mendeteksi Anda meninggalkan layar ujian atau mencoba berpindah aplikasi.';

      setCheatingLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString('id-ID'),
          type: logMsg,
          details: logMsg,
        },
      ]);

      setWarnings((prev) => {
        const nextWarnings = prev + 1;
        if (nextWarnings >= maxWarnings) {
          triggerAutoSubmit(
            `Anda telah melanggar batas maksimal peringatan keamanan (${maxWarnings} kali). Ujian dihentikan paksa dan jawaban otomatis terkirim.`
          );
          return nextWarnings;
        }

        setWarningMsg(logMsg);
        setIsWarningModalOpen(true);
        return nextWarnings;
      });
    },
    [viewState, isWarningModalOpen, maxWarnings, playWarningSound]
  );

  const triggerAutoSubmit = (msg: string) => {
    setIsWarningModalOpen(false);
    showAlert(msg);
    setTimeout(() => {
      setAlertMsg(null);
      processSubmission();
    }, 2500);
  };

  useEffect(() => {
    if (viewState !== 'test') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTriggerWarning('Sistem mendeteksi Anda berpindah aplikasi atau mengecilkan browser!');
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (!document.hasFocus() && viewState === 'test') {
          handleTriggerWarning('Layar ujian kehilangan fokus!');
        }
      }, 300);
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'i', 'j'].includes(e.key)) ||
        (e.ctrlKey && ['U', 'u', 'C', 'c', 'V', 'v'].includes(e.key)) ||
        e.key === 'PrintScreen' ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
        playWarningSound();
        showAlert('🚨 Peringatan Keamanan: Penggunaan Shortcut Keyboard dilarang!');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && viewState === 'test') {
        handleTriggerWarning('Anda keluar dari mode layar penuh (Fullscreen)!');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [viewState, handleTriggerWarning]);

  // Handle Question Answer Selection
  const handleAnswerOption = (optId: string) => {
    setUserAnswers((prev) => {
      const updated = [...prev];
      updated[currentIndex] = optId;
      return updated;
    });
  };

  const handleToggleRagu = (isRagu: boolean) => {
    setRaguList((prev) => {
      const updated = [...prev];
      updated[currentIndex] = isRagu;
      return updated;
    });
  };

  const handleScreenRecordDetected = (reason: string) => {
    setIsWarningModalOpen(false);
    playWarningSound();
    setAlertMsg(
      `PERINGATAN PEREKAMAN LAYAR TERDETEKSI!\nSistem mendeteksi percobaan Perekaman Layar / Screen Capture ("${reason}").\n\nUntuk menjaga kerahasiaan soal, ujian dihentikan dan SELURUH JAWABAN ANDA TELAH TERSIMPAN AMAN.\nFile tanda bukti (.cbt) berhasil diunduh secara otomatis!`
    );
    processSubmission(true, reason);
  };

  // Submit Exam & Save Encrypted Student Result
  const handleFinishExamRequest = () => {
    processSubmission();
  };

  const processSubmission = (autoDownload = false, customReason = '') => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    let correct = 0;
    activeQuestions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      if (userAns) {
        const foundOpt = q.options.find((o) => o.id === userAns);
        if (foundOpt && foundOpt.isCorrect) {
          correct++;
        }
      }
    });

    const total = activeQuestions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const incorrect = total - correct;
    const isPassed = score >= config.kkm;
    const timeSpent = (config.duration * 60) - timeRemaining;
    const durationMins = Math.max(1, Math.round(timeSpent / 60));

    let updatedLogs = [...cheatingLogs];
    if (customReason) {
      updatedLogs.push({
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type: `AUTO-SUBMIT (Perekaman Layar): ${customReason}`,
        details: customReason,
      });
    }

    const resultObj: StudentResult = {
      id: `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentInfo,
      score,
      correctCount: correct,
      incorrectCount: incorrect,
      totalQuestions: total,
      kkm: config.kkm,
      isPassed,
      answers: userAnswers,
      warnings: warnings + (customReason ? 1 : 0),
      submittedAt: new Date().toLocaleString('id-ID'),
      durationSpentMinutes: durationMins,
      timeSpentSeconds: timeSpent,
      questionSnapshots: activeQuestions,
      cheatingLogs: updatedLogs,
      ipAddress,
      deviceInfo,
    };

    setFinalScore(score);
    setCorrectCount(correct);
    setIncorrectCount(incorrect);
    setLastStudentResult(resultObj);

    // Save to local & Firebase student results rekap list
    const updatedResults = [resultObj, ...studentResults.filter((r) => r.studentInfo.noPeserta !== studentInfo.noPeserta)];
    saveStudentResults(updatedResults);
    saveStudentResultToFirebase(resultObj);

    setViewState('result');

    if (autoDownload) {
      setTimeout(() => {
        try {
          const encryptedData = encryptResult(resultObj);
          const blob = new Blob([encryptedData], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const cleanName = studentInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
          link.href = url;
          link.download = `HASIL_CBT_${studentInfo.noPeserta}_${cleanName}.cbt`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error(e);
        }
      }, 300);
    }
  };

  // Download Encrypted .cbt File
  const handleDownloadEncryptedResult = () => {
    if (!lastStudentResult) {
      showAlert('Gagal mengunduh! Hasil ujian tidak ditemukan.');
      return;
    }

    try {
      const encryptedData = encryptResult(lastStudentResult);
      const blob = new Blob([encryptedData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanName = studentInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
      link.href = url;
      link.download = `HASIL_CBT_${studentInfo.noPeserta}_${cleanName}.cbt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showAlert('File jawaban terenkripsi (.cbt) berhasil diunduh! Silakan kirimkan file ini ke Guru.');
    } catch (e) {
      console.error(e);
      showAlert('Gagal mengenkripsi hasil jawaban.');
    }
  };

  // Question Editor Handlers (Admin)
  const handleSaveQuestion = (qData: {
    question: string;
    options: Option[];
    explanation: string;
    image?: string;
    mapel?: string;
    subTopik?: string;
    kodeGuru?: string;
    id?: number;
  }) => {
    let updatedQuestions = [...config.questions];

    if (qData.id) {
      // Edit existing
      const idx = updatedQuestions.findIndex((q) => q.id === qData.id);
      if (idx !== -1) {
        updatedQuestions[idx] = {
          ...updatedQuestions[idx],
          question: qData.question,
          options: qData.options,
          explanation: qData.explanation,
          image: qData.image,
          mapel: qData.mapel || updatedQuestions[idx].mapel || config.mapel || 'Sosiologi',
          subTopik: qData.subTopik,
          kodeGuru: qData.kodeGuru || updatedQuestions[idx].kodeGuru || config.kodeGuru || 'GURU01',
        };
      }
    } else {
      // Create new
      const maxId = updatedQuestions.reduce((max, q) => Math.max(max, q.id), 0);
      updatedQuestions.push({
        id: maxId + 1,
        question: qData.question,
        options: qData.options,
        explanation: qData.explanation,
        image: qData.image,
        mapel: qData.mapel || config.mapel || 'Sosiologi',
        subTopik: qData.subTopik,
        kodeGuru: qData.kodeGuru || config.kodeGuru || 'GURU01',
      });
    }

    saveConfig({ ...config, questions: updatedQuestions });
    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
    showAlert('Soal berhasil disimpan!');
  };

  const handleDeleteQuestion = (qId: number) => {
    if (config.questions.length <= 1) {
      showAlert('Minimal harus ada 1 soal di Bank Soal!');
      return;
    }
    const updated = config.questions.filter((q) => q.id !== qId);
    saveConfig({ ...config, questions: updated });
    showAlert('Soal berhasil dihapus.');
  };

  const handleResetDefaultQuestions = () => {
    saveConfig({ ...config, questions: defaultQuestions });
    showAlert('Bank soal berhasil direset ke 20 Soal HOTS Default.');
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-gray-800 select-none">
      {/* View Switcher */}
      {viewState === 'login' && (
        <LoginView
          config={config}
          studentResults={studentResults}
          onSaveConfig={saveConfig}
          showAlert={showAlert}
          onStudentLoginSuccess={(info) => {
            setStudentInfo(info);
            setViewState('pre-test');
          }}
          onAdminLoginSuccess={(role) => {
            setAdminRole(role);
            setViewState('admin');
          }}
        />
      )}

      {viewState === 'admin' && (
        <AdminPanel
          config={config}
          studentResults={studentResults}
          adminRole={adminRole}
          onSaveConfig={saveConfig}
          onSaveStudentResults={saveStudentResults}
          onOpenQuestionModal={(q) => {
            setEditingQuestion(q);
            setIsQuestionModalOpen(true);
          }}
          onDeleteQuestion={handleDeleteQuestion}
          onResetDefaultQuestions={handleResetDefaultQuestions}
          onLogout={() => setViewState('login')}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      )}

      {viewState === 'pre-test' && (
        <PreTestView
          config={config}
          studentInfo={studentInfo}
          studentAttemptsCount={studentResults.filter(
            (r) => r.studentInfo.noPeserta.toLowerCase() === studentInfo.noPeserta.toLowerCase() ||
                   r.studentInfo.name.toLowerCase() === studentInfo.name.toLowerCase()
          ).length}
          maxAttempts={config.maxAttempts || 1}
          onStartTest={handleStartTest}
          onBackToPortal={() => setViewState('login')}
        />
      )}

      {viewState === 'test' && (
        <TestView
          questions={activeQuestions}
          currentIndex={currentIndex}
          answers={userAnswers}
          raguList={raguList}
          timeRemaining={timeRemaining}
          mapel={config.mapel}
          mapelTitle={config.mapelTitle}
          subTitle={config.subTitle}
          studentName={studentInfo.name}
          noPeserta={studentInfo.noPeserta}
          warnings={warnings}
          maxWarnings={maxWarnings}
          broadcastAlert={activeBroadcastAlert}
          onDismissBroadcastAlert={() => setActiveBroadcastAlert(null)}
          onAnswer={handleAnswerOption}
          onToggleRagu={handleToggleRagu}
          onSelectQuestion={(idx) => setCurrentIndex(idx)}
          onPrev={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setCurrentIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
          onFinish={handleFinishExamRequest}
          onScreenRecordDetected={handleScreenRecordDetected}
          onBackToPortal={() => setViewState('login')}
        />
      )}

      {viewState === 'result' && (
        <ResultView
          score={finalScore}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          kkm={config.kkm}
          studentName={studentInfo.name}
          noPeserta={studentInfo.noPeserta}
          driveUploadUrl={config.driveUploadUrl}
          onDownloadEncryptedResult={handleDownloadEncryptedResult}
          onViewDiscussion={() => setViewState('review')}
          onRestart={() => setViewState('login')}
        />
      )}

      {viewState === 'review' && (
        <ReviewView
          questions={activeQuestions}
          answers={userAnswers}
          onExit={() => setViewState('login')}
        />
      )}

      {/* Global Modals */}
      <WarningModal
        isOpen={isWarningModalOpen}
        warningCount={warnings}
        maxWarnings={maxWarnings}
        customMsg={warningMsg}
        onUnderstand={() => {
          setIsWarningModalOpen(false);
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        }}
      />

      <ConfirmModal
        isOpen={confirmData.isOpen}
        title={confirmData.title}
        message={confirmData.message}
        isDanger={confirmData.isDanger}
        onConfirm={confirmData.onConfirm}
        onCancel={() => setConfirmData((prev) => ({ ...prev, isOpen: false }))}
      />

      <AlertModal
        isOpen={alertMsg !== null}
        message={alertMsg || ''}
        onClose={() => setAlertMsg(null)}
      />

      <QuestionEditorModal
        isOpen={isQuestionModalOpen}
        editingQuestion={editingQuestion}
        mapelList={config.mapelList}
        defaultMapel={config.mapel}
        defaultKodeGuru={config.kodeGuru || 'GURU01'}
        onSave={handleSaveQuestion}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        showAlert={showAlert}
      />
    </div>
  );
}
