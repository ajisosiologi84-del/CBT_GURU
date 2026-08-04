import React, { useState, useRef } from 'react';
import { AppConfig, Question, StudentResult, StudentUser, TeacherUser, KopSekolahConfig } from '../types';
import { decryptResult, encryptAppBackup, decryptAppBackup } from '../utils/crypto';
import { formatQuestionText } from '../utils/questionFormatter';
import { generateResultsPdfReport, generateIndividualStudentPdf, generateItemAnalysisPdfReport, ItemAnalysisData, defaultKopSekolah } from '../utils/pdfGenerator';
import { DownloadAnimationModal } from './DownloadAnimationModal';
import * as XLSX from 'xlsx';
import {
  Sliders,
  Database,
  FileSpreadsheet,
  Upload,
  Plus,
  LogOut,
  Edit3,
  Trash2,
  Info,
  Search,
  RotateCcw,
  Lock,
  FileCheck,
  CheckCircle,
  XCircle,
  Award,
  Users,
  Key,
  RefreshCw,
  Copy,
  Check,
  UserPlus,
  X,
  UserCheck,
  GraduationCap,
  Download,
  WifiOff,
  Menu,
  BookOpen,
  Sparkles,
  CheckSquare,
  Square,
  ListChecks,
  Image as ImageIcon,
  Eye,
  HelpCircle,
  Printer,
  FileJson,
  ShieldCheck,
  ShieldAlert,
  FolderArchive,
  FileText,
  Building2,
  BarChart2,
  PieChart,
  Crown,
  Trophy,
  Medal,
  Clock,
  Calendar,
  Globe,
  Monitor,
  Activity,
  Zap,
  Tag,
  Layers,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Compass,
  Youtube,
  Video,
  Play,
  ExternalLink,
  Megaphone,
  Send,
  Radio,
  Volume2,
  VolumeX,
  AlertOctagon,
} from 'lucide-react';

interface AdminPanelProps {
  config: AppConfig;
  studentResults: StudentResult[];
  adminRole?: 'admin' | 'teacher';
  onSaveConfig: (newConfig: AppConfig) => void;
  onSaveStudentResults: (results: StudentResult[]) => void;
  onOpenQuestionModal: (question: Question | null) => void;
  onDeleteQuestion: (qId: number) => void;
  onResetDefaultQuestions: () => void;
  onLogout: () => void;
  showAlert: (msg: string) => void;
  showConfirm: (title: string, msg: string, onConfirm: () => void, isDanger?: boolean) => void;
}

/**
 * Helper function to parse YouTube URLs (watch, shorts, embed, youtu.be) and convert to embed iframe URL
 */
const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  config,
  studentResults,
  adminRole = 'admin',
  onSaveConfig,
  onSaveStudentResults,
  onOpenQuestionModal,
  onDeleteQuestion,
  onResetDefaultQuestions,
  onLogout,
  showAlert,
  showConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<'panduan' | 'bank' | 'rekap' | 'analisis' | 'students' | 'token' | 'mapel' | 'backup' | 'schedule'>('panduan');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Leaderboard & Audit Modal State
  const [showLeaderboardPodium, setShowLeaderboardPodium] = useState(true);
  const [selectedAuditResult, setSelectedAuditResult] = useState<StudentResult | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Download Animation Modal State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadModalConfig, setDownloadModalConfig] = useState<{
    title: string;
    subtitle?: string;
    fileName: string;
    fileType: 'json' | 'cbt' | 'pdf' | 'xlsx';
    onCompleteAction: () => void;
  }>({
    title: '',
    fileName: '',
    fileType: 'json',
    onCompleteAction: () => {},
  });

  // Schedule & Exam Session Config State
  const [scheduleStartTime, setScheduleStartTime] = useState<string>(config.examSchedule?.startTime || '');
  const [scheduleEndTime, setScheduleEndTime] = useState<string>(config.examSchedule?.endTime || '');
  const [sessionStatus, setSessionStatus] = useState<'DRAFT' | 'ACTIVE' | 'CLOSED'>(config.examSchedule?.sessionStatus || 'ACTIVE');
  const [lateTolerance, setLateTolerance] = useState<number>(config.examSchedule?.lateToleranceMinutes || 15);
  const [allowReviewAfterFinish, setAllowReviewAfterFinish] = useState<boolean>(config.examSchedule?.allowReviewAfterFinish !== false);
  const [showScoreImmediately, setShowScoreImmediately] = useState<boolean>(config.examSchedule?.showScoreImmediately !== false);
  const [strictAntiCheating, setStrictAntiCheating] = useState<boolean>(config.examSchedule?.strictAntiCheating !== false);
  const [maxCheatingAllowed, setMaxCheatingAllowed] = useState<number>(config.examSchedule?.maxCheatingAllowed || 3);
  const [enableWarningAudio, setEnableWarningAudio] = useState<boolean>(config.enableWarningAudio !== false);
  const [customWarningAudioUrl, setCustomWarningAudioUrl] = useState<string>(config.customWarningAudioUrl || '');

  // Test Play Warning Audio MP3
  const handleTestWarningAudio = () => {
    try {
      const mp3Url = customWarningAudioUrl.trim() || '/warning-alarm.mp3';
      const audio = new Audio(mp3Url);
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          showAlert('Suara MP3 diblokir oleh browser atau URL tidak dapat diakses: ' + err.message);
        });
      }

      // Voice warning speech test
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Peringatan! Pelanggaran kecurangan ujian terdeteksi!');
        utterance.lang = 'id-ID';
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
      }
      showAlert('🔊 Memutar Uji Coba Audio Peringatan Kecurangan MP3 & Suara Sirine...');
    } catch (e) {
      showAlert('Gagal memutar audio: ' + (e as Error).message);
    }
  };

  const handleFileUploadMP3 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showAlert('Ukuran file audio MP3 terlalu besar! Maksimal 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomWarningAudioUrl(event.target.result as string);
        showAlert('File Audio MP3 Peringatan berhasil diunggah!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Broadcast Warning Proktor State (Point 2)
  const [broadcastTargetNis, setBroadcastTargetNis] = useState<string>('ALL');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');

  // Analisis Butir Soal Filter State
  const [analisisSearch, setAnalisisSearch] = useState('');
  const [analisisDifficultyFilter, setAnalisisDifficultyFilter] = useState<'ALL' | 'Mudah' | 'Sedang' | 'Sukar'>('ALL');
  const [analisisMapelFilter, setAnalisisMapelFilter] = useState<string>('ALL');
  
  // General Config State
  const [durationInput, setDurationInput] = useState<number>(config.duration);
  const [kkmInput, setKkmInput] = useState<number>(config.kkm);
  const [maxQuestionsInput, setMaxQuestionsInput] = useState<number>(config.maxQuestionsToDisplay ?? 0);
  const [maxAttemptsInput, setMaxAttemptsInput] = useState<number>(config.maxAttempts ?? 1);
  const [randomizeQuestionsInput, setRandomizeQuestionsInput] = useState<boolean>(
    config.randomizeQuestions !== false
  );
  const [randomizeOptionsInput, setRandomizeOptionsInput] = useState<boolean>(
    config.randomizeOptions !== false
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [rekapSearch, setRekapSearch] = useState('');

  // Mapel Config State
  const defaultMapelList = [
    'Sosiologi',
    'Geografi',
    'Ekonomi',
    'Sejarah',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Matematika',
    'PPKn',
    'Biologi',
    'Fisika',
    'Kimia',
  ];
  const [mapelInput, setMapelInput] = useState<string>(config.mapel || 'Sosiologi');
  const [kodeGuruInput, setKodeGuruInput] = useState<string>(config.kodeGuru || 'GURU01');
  const [mapelTitleInput, setMapelTitleInput] = useState<string>(
    config.mapelTitle || 'Assessment TKA SMA'
  );
  const [subTitleInput, setSubTitleInput] = useState<string>(
    config.subTitle || 'Perubahan Sosial & Globalisasi'
  );
  const [driveUploadUrlInput, setDriveUploadUrlInput] = useState<string>(
    config.driveUploadUrl || ''
  );
  const [youtubeGuideUrlInput, setYoutubeGuideUrlInput] = useState<string>(
    config.youtubeGuideUrl || ''
  );
  const [isEditingVideoUrl, setIsEditingVideoUrl] = useState<boolean>(false);
  const [mapelList, setMapelList] = useState<string[]>(
    config.mapelList && config.mapelList.length > 0 ? config.mapelList : defaultMapelList
  );
  const [customMapelToAdd, setCustomMapelToAdd] = useState('');

  // Question Selection & Batch State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [selectedBankMapel, setSelectedBankMapel] = useState<string>('ALL');
  const [selectedBankKompetensi, setSelectedBankKompetensi] = useState<string>('ALL');
  const [selectedBankBentukSoal, setSelectedBankBentukSoal] = useState<string>('ALL');
  const [selectedBankKodeGuru, setSelectedBankKodeGuru] = useState<string>('ALL');

  // Excel Template Upload Modal State
  const [isUploadMapelModalOpen, setIsUploadMapelModalOpen] = useState(false);
  const [uploadPendingQuestions, setUploadPendingQuestions] = useState<Question[]>([]);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadTargetMapel, setUploadTargetMapel] = useState('Sosiologi');

  // Preview Question Modal State
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Token Management State
  const [currentToken, setCurrentToken] = useState<string>(config.examToken || 'SOS2026');
  const [isCopiedToken, setIsCopiedToken] = useState(false);

  // User Management State (Student & Teacher)
  const [userSubTab, setUserSubTab] = useState<'student' | 'teacher'>('student');
  const [studentSearch, setStudentSearch] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newNis, setNewNis] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelas, setNewKelas] = useState('');
  const [newStudentKodeGuru, setNewStudentKodeGuru] = useState('');
  const [studentKodeGuruFilter, setStudentKodeGuruFilter] = useState<string>('ALL');
  const [rekapKodeGuruFilter, setRekapKodeGuruFilter] = useState<string>('ALL');

  // Student Results Selection State
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);

  // --- STUDENT RESULTS SELECTION & BULK DELETE HANDLERS ---
  const handleToggleSelectResultId = (id: string) => {
    if (selectedResultIds.includes(id)) {
      setSelectedResultIds(selectedResultIds.filter((rId) => rId !== id));
    } else {
      setSelectedResultIds([...selectedResultIds, id]);
    }
  };

  const handleSelectAllResults = (filteredResults: StudentResult[]) => {
    const filteredIds = filteredResults.map((r) => r.id);
    const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedResultIds.includes(id));
    if (isAllSelected) {
      setSelectedResultIds(selectedResultIds.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedResultIds(Array.from(new Set([...selectedResultIds, ...filteredIds])));
    }
  };

  const handleDeleteSelectedStudentResults = () => {
    if (selectedResultIds.length === 0) {
      showAlert('Pilih/centang minimal 1 hasil ujian siswa yang akan dihapus!');
      return;
    }
    showConfirm(
      `Hapus ${selectedResultIds.length} Hasil Ujian Siswa Terpilih?`,
      `Apakah Anda yakin ingin menghapus ${selectedResultIds.length} rekap hasil ujian siswa yang dicentang? Data hasil ujian yang dihapus tidak dapat dikembalikan.`,
      () => {
        const updated = studentResults.filter((r) => !selectedResultIds.includes(r.id));
        onSaveStudentResults(updated);
        setSelectedResultIds([]);
        showAlert(`${selectedResultIds.length} rekap hasil ujian siswa berhasil dihapus!`);
      },
      true
    );
  };

  const handleDeleteAllStudentResults = () => {
    if (studentResults.length === 0) {
      showAlert('Belum ada rekap hasil ujian siswa untuk dihapus.');
      return;
    }
    showConfirm(
      `Hapus SELURUH (${studentResults.length}) Hasil Ujian Siswa?`,
      `PERINGATAN SANGAT PENTING! Anda akan menghapus SELURUH (${studentResults.length}) rekap hasil jawaban siswa dari sistem. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?`,
      () => {
        onSaveStudentResults([]);
        setSelectedResultIds([]);
        showAlert('Seluruh rekap hasil ujian siswa berhasil dihapus dari sistem.');
      },
      true
    );
  };
  const [studentSelectMode, setStudentSelectMode] = useState<'class' | 'individual'>('class');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Teacher Management State
  const [teacherSearch, setTeacherSearch] = useState('');
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [newNip, setNewNip] = useState('');
  const [newTeacherNama, setNewTeacherNama] = useState('');
  const [newTeacherMapel, setNewTeacherMapel] = useState('');
  const [newTeacherKodeGuru, setNewTeacherKodeGuru] = useState('');

  // Kop Sekolah & Signature Modal State
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);
  const [kopForm, setKopForm] = useState<KopSekolahConfig>(() => ({
    ...defaultKopSekolah,
    ...(config.kopSekolah || {}),
  }));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cbtFileInputRef = useRef<HTMLInputElement>(null);
  const studentFileInputRef = useRef<HTMLInputElement>(null);
  const teacherFileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const studentsList: StudentUser[] = config.students || [];
  const teachersList: TeacherUser[] = config.teachers || [];

  // Sync internal state with config prop when config changes (e.g. from restore, firebase sync, mapel switch)
  React.useEffect(() => {
    if (config) {
      if (config.examToken) setCurrentToken(config.examToken);
      if (config.mapel) setMapelInput(config.mapel);
      if (config.kodeGuru) setKodeGuruInput(config.kodeGuru);
      if (config.mapelTitle) setMapelTitleInput(config.mapelTitle);
      if (config.subTitle) setSubTitleInput(config.subTitle);
      if (config.driveUploadUrl !== undefined) setDriveUploadUrlInput(config.driveUploadUrl || '');
      if (config.youtubeGuideUrl !== undefined) setYoutubeGuideUrlInput(config.youtubeGuideUrl || '');
      if (config.mapelList && config.mapelList.length > 0) setMapelList(config.mapelList);
    }
  }, [
    config.examToken,
    config.mapel,
    config.kodeGuru,
    config.mapelTitle,
    config.subTitle,
    config.driveUploadUrl,
    config.youtubeGuideUrl,
    config.mapelList,
  ]);

  // --- BACKUP & RESTORE APP DATA HANDLERS ---
  const handleBackupAppData = () => {
    try {
      const activeToken = currentToken || config.examToken || 'SOS2026';
      const backupPayload = {
        appName: 'CBT_GURUAI',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        config: {
          ...config,
          examToken: activeToken,
        },
        studentResults,
      };

      const encryptedContent = encryptAppBackup(backupPayload);
      const blob = new Blob([encryptedContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');

      link.href = url;
      link.download = `BACKUP_TERENKRIPSI_CBT_GURUAI_${dateStr}_${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showAlert('Backup Seluruh Data Aplikasi CBT GURUAI berhasil dienkripsi dan diunduh! Simpan file terenkripsi (.json) ini di tempat aman.');
    } catch (e) {
      console.error(e);
      showAlert('Gagal membuat file backup data terenkripsi!');
    }
  };

  const handleExportActivePaketJson = () => {
    try {
      const activeMapel = config.mapel || 'Sosiologi';
      const activeQuestions = config.questions.filter((q) => {
        const isThisMapel = q.mapel ? q.mapel === activeMapel : true;
        const isActive = q.isActive !== false;
        return isThisMapel && isActive;
      });

      const activeToken = currentToken || config.examToken || 'SOS2026';

      const packagePayload = {
        appName: 'CBT_GURUAI',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        config: {
          ...config,
          examToken: activeToken,
          mapel: activeMapel,
          questions: activeQuestions,
        },
        studentResults,
      };

      const encryptedContent = encryptAppBackup(packagePayload);
      const blob = new Blob([encryptedContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
      const mapelClean = activeMapel.replace(/[^a-zA-Z0-9]/g, '_');

      link.href = url;
      link.download = `PAKET_SOAL_${mapelClean}_${activeToken}_${dateStr}_${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showAlert(`Paket Soal Aktif "${activeMapel}" (${activeQuestions.length} Soal - Token Tersinkron: "${activeToken}") berhasil dieksport sebagai file JSON backup terenkripsi!`);
    } catch (e) {
      console.error(e);
      showAlert('Gagal membuat paket soal aktif!');
    }
  };

  const triggerExportActivePaketJsonWithAnimation = () => {
    const activeMapel = config.mapel || 'Sosiologi';
    const activeToken = currentToken || config.examToken || 'SOS2026';
    const mapelClean = activeMapel.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
    const fileName = `PAKET_SOAL_${mapelClean}_${activeToken}_${dateStr}_${timeStr}.json`;

    setDownloadModalConfig({
      title: 'Mengunduh Paket Soal Aktif',
      subtitle: `Mengenkripsi paket soal "${activeMapel}" & Token "${activeToken}"...`,
      fileName: fileName,
      fileType: 'json',
      onCompleteAction: handleExportActivePaketJson,
    });
    setIsDownloadModalOpen(true);
  };

  const triggerBackupAppDataWithAnimation = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
    const fileName = `BACKUP_TERENKRIPSI_CBT_GURUAI_${dateStr}_${timeStr}.json`;

    setDownloadModalConfig({
      title: 'Mengunduh Backup Data Sistem',
      subtitle: 'Mencadangkan seluruh bank soal, data user, dan token ujian...',
      fileName: fileName,
      fileType: 'json',
      onCompleteAction: handleBackupAppData,
    });
    setIsDownloadModalOpen(true);
  };

  const handleRestoreAppData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = decryptAppBackup(content);

        if (!parsed || typeof parsed !== 'object') {
          showAlert('Format file backup tidak terdekripsi dengan benar!');
          return;
        }

        const restoredConfig = parsed.config || (parsed.questions ? parsed : null);
        if (!restoredConfig || !Array.isArray(restoredConfig.questions)) {
          showAlert('File backup tidak memiliki struktur data Bank Soal yang valid!');
          return;
        }

        const restoredExamToken = restoredConfig.examToken || config.examToken || 'SOS2026';
        const finalRestoredConfig = {
          ...restoredConfig,
          examToken: restoredExamToken,
        };

        showConfirm(
          'Memulihkan Seluruh Data Backup Terenkripsi?',
          `Apakah Anda yakin ingin memulihkan (restore) seluruh data aplikasi dari file backup terenkripsi ini? Seluruh bank soal, data user, dan token ujian ("${restoredExamToken}") akan disinkronkan.`,
          () => {
            onSaveConfig(finalRestoredConfig);
            setCurrentToken(restoredExamToken);
            if (Array.isArray(parsed.studentResults)) {
              onSaveStudentResults(parsed.studentResults);
            }
            showAlert(`Sukses! Seluruh data aplikasi & paket soal dengan Token "${restoredExamToken}" berhasil dipulihkan dari file backup terenkripsi.`);
          },
          true
        );
      } catch (err: any) {
        console.error(err);
        showAlert(err.message || 'Gagal membaca/mendekripsi file backup! Pastikan file adalah backup terenkripsi resmi CBT GURUAI.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveKopSekolah = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      kopSekolah: kopForm,
    });
    setIsKopModalOpen(false);
    showAlert('Pengaturan Kop Sekolah & Tanda Tangan Guru berhasil disimpan!');
  };

  // General & Schedule Settings Handler
  const handleSaveGeneralConfig = () => {
    if (durationInput > 0 && kkmInput >= 0 && kkmInput <= 100) {
      onSaveConfig({
        ...config,
        duration: durationInput,
        kkm: kkmInput,
        maxQuestionsToDisplay: Math.max(0, maxQuestionsInput),
        maxAttempts: Math.max(1, maxAttemptsInput),
        randomizeQuestions: randomizeQuestionsInput,
        randomizeOptions: randomizeOptionsInput,
      });
      showAlert('Pengaturan umum ujian berhasil disimpan!');
    } else {
      showAlert('Nilai durasi atau KKM tidak valid!');
    }
  };

  // Combined Schedule & General Exam Settings Handler
  const handleSaveExamSchedule = () => {
    if (durationInput <= 0 || kkmInput < 0 || kkmInput > 100) {
      showAlert('Nilai Durasi atau KKM tidak valid!');
      return;
    }
    onSaveConfig({
      ...config,
      duration: durationInput,
      kkm: kkmInput,
      maxQuestionsToDisplay: Math.max(0, maxQuestionsInput),
      maxAttempts: Math.max(1, maxAttemptsInput),
      randomizeQuestions: randomizeQuestionsInput,
      randomizeOptions: randomizeOptionsInput,
      enableWarningAudio,
      customWarningAudioUrl: customWarningAudioUrl.trim() || undefined,
      examSchedule: {
        startTime: scheduleStartTime,
        endTime: scheduleEndTime,
        sessionStatus,
        lateToleranceMinutes: lateTolerance,
        allowReviewAfterFinish,
        showScoreImmediately,
        strictAntiCheating,
        maxCheatingAllowed,
      },
    });
    showAlert('Semua Pengaturan Jadwal, Durasi, KKM, & Ketentuan Ujian Berhasil Disimpan!');
  };

  // Real-time Broadcast Warning Handler (Point 2)
  const handleSendBroadcastWarning = (customMsg?: string) => {
    const msg = customMsg || broadcastMessage.trim();
    if (!msg) {
      showAlert('Silakan tulis atau pilih pesan peringatan yang ingin dikirimkan ke peserta!');
      return;
    }

    const targetStudentName =
      broadcastTargetNis === 'ALL'
        ? 'Semua Peserta Ujian'
        : config.students.find((s) => s.nis === broadcastTargetNis)?.nama || broadcastTargetNis;

    const newAlert = {
      id: Date.now().toString(),
      message: msg,
      targetStudentNis: broadcastTargetNis,
      targetStudentName,
      sender: 'Proktor Ujian',
      createdAt: new Date().toLocaleTimeString('id-ID'),
      type: 'warning' as const,
    };

    const updatedConfig: AppConfig = {
      ...config,
      broadcastAlert: newAlert,
      updatedAt: new Date().toISOString(),
    };

    onSaveConfig(updatedConfig);
    setBroadcastMessage('');
    showAlert(`📢 Pesan peringatan real-time berhasil dikirim ke: ${targetStudentName}!`);
  };

  // Real-time Force Stop Whole Exam Handler (Point 1 - Opsi A)
  const handleForceStopExamRealtime = () => {
    showConfirm(
      '🚨 HENTIKAN SELURUH UJIAN SEKARANG (FORCE STOP)',
      'Apakah Anda YAKIN ingin MENGHENTIKAN PAKSA seluruh ujian online peserta yang sedang berlangsung secara real-time?\n\nStatus sesi akan diubah menjadi CLOSED dan seluruh jawaban siswa yang sedang dikerjakan akan langsung ter-submit otomatis!',
      () => {
        setSessionStatus('CLOSED');
        const updatedConfig: AppConfig = {
          ...config,
          examSchedule: {
            ...config.examSchedule,
            startTime: scheduleStartTime,
            endTime: scheduleEndTime,
            sessionStatus: 'CLOSED',
            lateToleranceMinutes: lateTolerance,
            allowReviewAfterFinish,
            showScoreImmediately,
            strictAntiCheating,
            maxCheatingAllowed,
          },
          broadcastAlert: {
            id: Date.now().toString(),
            message: '🚨 PEMBERITAHUAN PENGAWAS: Seluruh sesi ujian telah resmi DIHENTIKAN oleh Proktor. Seluruh jawaban Anda telah tersimpan secara otomatis.',
            targetStudentNis: 'ALL',
            sender: 'Proktor Ujian (Sistem)',
            createdAt: new Date().toLocaleTimeString('id-ID'),
            type: 'urgent',
          },
          updatedAt: new Date().toISOString(),
        };

        onSaveConfig(updatedConfig);
        showAlert('🚨 Ujian berhasil dihentikan paksa secara real-time! Sesi diubah ke CLOSED.');
      },
      true
    );
  };

  // Mapel Handlers
  const handleSaveMapelConfig = () => {
    const trimmedMapel = mapelInput.trim();
    if (!trimmedMapel) {
      showAlert('Nama mata pelajaran tidak boleh kosong!');
      return;
    }
    const finalTitle = mapelTitleInput.trim() || `Assessment TKA ${trimmedMapel} SMA`;
    const finalSubTitle = subTitleInput.trim() || 'Materi Ujian Assessment TKA';

    let updatedList = [...mapelList];
    if (!updatedList.includes(trimmedMapel)) {
      updatedList.push(trimmedMapel);
      setMapelList(updatedList);
    }

    onSaveConfig({
      ...config,
      mapel: trimmedMapel,
      mapelTitle: finalTitle,
      subTitle: finalSubTitle,
      kodeGuru: kodeGuruInput.trim().toUpperCase() || 'GURU01',
      driveUploadUrl: driveUploadUrlInput.trim(),
      youtubeGuideUrl: youtubeGuideUrlInput.trim(),
      mapelList: updatedList,
    });
    showAlert(`Pengaturan Mata Pelajaran "${trimmedMapel}" berhasil disimpan!`);
  };

  const handleSaveYoutubeGuideUrl = () => {
    const trimmed = youtubeGuideUrlInput.trim();
    onSaveConfig({
      ...config,
      youtubeGuideUrl: trimmed,
    });
    setIsEditingVideoUrl(false);
    if (trimmed) {
      showAlert('Link Video Panduan Guru (YouTube) berhasil disimpan!');
    } else {
      showAlert('Link Video Panduan Guru berhasil dikosongkan.');
    }
  };

  const handleAddCustomMapel = () => {
    const trimmed = customMapelToAdd.trim();
    if (!trimmed) return;
    if (mapelList.includes(trimmed)) {
      showAlert(`Mata Pelajaran "${trimmed}" sudah ada di dalam daftar!`);
      return;
    }
    const updatedList = [...mapelList, trimmed];
    setMapelList(updatedList);
    setMapelInput(trimmed);
    setMapelTitleInput(`Assessment TKA ${trimmed} SMA`);
    setCustomMapelToAdd('');
    onSaveConfig({
      ...config,
      mapel: trimmed,
      mapelTitle: `Assessment TKA ${trimmed} SMA`,
      mapelList: updatedList,
    });
    showAlert(`Mata pelajaran "${trimmed}" berhasil ditambahkan dan dipilih!`);
  };

  const handleDeleteMapelFromList = (subjectName: string) => {
    if (mapelList.length <= 1) {
      showAlert('Minimal harus ada 1 mata pelajaran dalam daftar!');
      return;
    }
    const updatedList = mapelList.filter((m) => m !== subjectName);
    setMapelList(updatedList);
    let nextMapel = mapelInput;
    let nextTitle = mapelTitleInput;
    if (mapelInput === subjectName) {
      nextMapel = updatedList[0];
      nextTitle = `Assessment TKA ${updatedList[0]} SMA`;
      setMapelInput(nextMapel);
      setMapelTitleInput(nextTitle);
    }
    onSaveConfig({
      ...config,
      mapel: nextMapel,
      mapelTitle: nextTitle,
      mapelList: updatedList,
    });
    showAlert(`Mata Pelajaran "${subjectName}" dihapus dari daftar.`);
  };

  // --- QUESTION BANK HANDLERS ---
  const handleDeleteAllQuestions = () => {
    if (config.questions.length === 0) {
      showAlert('Bank Soal sudah kosong!');
      return;
    }
    showConfirm(
      'Hapus SEMUA Soal?',
      `Apakah Anda yakin ingin menghapus SELURUH (${config.questions.length}) soal di Bank Soal? Tindakan ini tidak dapat dibatalkan.`,
      () => {
        onSaveConfig({ ...config, questions: [] });
        setSelectedQuestionIds([]);
        showAlert('Seluruh soal berhasil dihapus dari Bank Soal.');
      },
      true
    );
  };

  const handleToggleQuestionActive = (qId: number) => {
    const updated = config.questions.map((q) => {
      if (q.id === qId) {
        return { ...q, isActive: q.isActive === false ? true : false };
      }
      return q;
    });
    onSaveConfig({ ...config, questions: updated });
  };

  const handleToggleSelectQuestion = (qId: number) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredQuestions.map((q) => q.id);
    const isAllSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedQuestionIds.includes(id));
    if (isAllSelected) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedQuestionIds(Array.from(new Set([...selectedQuestionIds, ...filteredIds])));
    }
  };

  const handleBatchSetActive = (active: boolean) => {
    if (selectedQuestionIds.length === 0) {
      showAlert('Pilih/centang minimal 1 soal terlebih dahulu!');
      return;
    }
    const updated = config.questions.map((q) => {
      if (selectedQuestionIds.includes(q.id)) {
        return { ...q, isActive: active };
      }
      return q;
    });
    onSaveConfig({ ...config, questions: updated });
    showAlert(`${selectedQuestionIds.length} soal berhasil di-${active ? 'aktifkan (digunakan)' : 'nonaktifkan'}.`);
  };

  const handleBatchDeleteQuestions = () => {
    if (selectedQuestionIds.length === 0) {
      showAlert('Pilih/centang minimal 1 soal yang ingin dihapus!');
      return;
    }
    showConfirm(
      `Hapus ${selectedQuestionIds.length} Soal Terpilih?`,
      `Apakah Anda yakin ingin menghapus ${selectedQuestionIds.length} soal yang dicentang dari Bank Soal?`,
      () => {
        const updated = config.questions.filter((q) => !selectedQuestionIds.includes(q.id));
        onSaveConfig({ ...config, questions: updated });
        setSelectedQuestionIds([]);
        showAlert(`${selectedQuestionIds.length} soal terpilih berhasil dihapus.`);
      },
      true
    );
  };

  const handleDownloadTemplate = () => {
    const currentMapel = selectedBankMapel !== 'ALL' ? selectedBankMapel : mapelInput || config.mapel || 'Sosiologi';
    const ws_data = [
      ['Pertanyaan', 'Opsi_A', 'Opsi_B', 'Opsi_C', 'Opsi_D', 'Opsi_E', 'Kunci_Jawaban', 'Pembahasan', 'Mapel', 'Kompetensi', 'Bentuk_Soal'],
      [
        `Contoh Soal (${currentMapel}): Perubahan sosial di masyarakat dipengaruhi oleh faktor...`,
        'Globalisasi',
        'Tradisi',
        'Isolasi',
        'Stagnasi',
        'Regresi',
        'A',
        'Pembahasan mengenai faktor pendorong perubahan sosial.',
        currentMapel,
        '3.1 Perubahan Sosial & Teknologi',
        'Pilihan Ganda',
      ],
      [
        `Contoh Soal 2 (${currentMapel}): Masuknya budaya asing yang diterima tanpa menghilangkan budaya asli disebut...`,
        'Asimilasi',
        'Akulturasi',
        'Difusi',
        'Amalgamasi',
        'Inovasi',
        'B',
        'Akulturasi adalah percampuran dua budaya di mana unsur budaya asli masih terlihat.',
        currentMapel,
        '3.2 Globalisasi & Glokalisasi',
        'Pilihan Ganda',
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Soal');
    const cleanMapel = currentMapel.trim().replace(/\s+/g, '_').toUpperCase();
    XLSX.writeFile(wb, `TEMPLATE_SOAL_CBT_${cleanMapel}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const newQuestions: Question[] = [];
        let startId = Date.now();
        let detectedMapel = '';

        data.forEach((row, idx) => {
          const qText = row['Pertanyaan'] || row['pertanyaan'];
          const optA = row['Opsi_A'] || row['opsi_a'] || row['Opsi A'];
          const optB = row['Opsi_B'] || row['opsi_b'] || row['Opsi B'];
          const optC = row['Opsi_C'] || row['opsi_c'] || row['Opsi C'];
          const optD = row['Opsi_D'] || row['opsi_d'] || row['Opsi D'];
          const optE = row['Opsi_E'] || row['opsi_e'] || row['Opsi E'];
          const key = (row['Kunci_Jawaban'] || row['kunci_jawaban'] || row['Kunci'] || '').toString().trim().toUpperCase();
          const exp = row['Pembahasan'] || row['pembahasan'] || 'Tidak ada pembahasan.';
          const rowMapel = row['Mapel'] || row['Mata_Pelajaran'] || row['mapel'];
          const rowKompetensi = row['Kompetensi'] || row['kompetensi'] || row['KD'] || row['Sub_Topik'] || row['sub_topik'] || row['SubTopik'] || row['subtopik'] || row['Materi'] || row['materi'];
          const rowBentuk = row['Bentuk_Soal'] || row['bentuk_soal'] || row['BentukSoal'] || row['Bentuk Soal'] || 'Pilihan Ganda';
          const rowImg = row['Gambar'] || row['gambar'] || row['URL_Gambar'] || row['url_gambar'] || row['Image'] || row['image'];

          if (rowMapel && !detectedMapel) {
            detectedMapel = String(rowMapel).trim();
          }

          if (qText && optA && optB && optC && key) {
            newQuestions.push({
              id: startId + idx,
              question: formatQuestionText(String(qText)),
              explanation: exp,
              image: rowImg ? String(rowImg).trim() : undefined,
              mapel: rowMapel ? String(rowMapel).trim() : 'Sosiologi',
              kompetensi: rowKompetensi ? String(rowKompetensi).trim() : undefined,
              subTopik: rowKompetensi ? String(rowKompetensi).trim() : undefined,
              bentukSoal: rowBentuk ? String(rowBentuk).trim() : 'Pilihan Ganda',
              options: [
                { id: 'A', text: String(optA), isCorrect: key === 'A' },
                { id: 'B', text: String(optB), isCorrect: key === 'B' },
                { id: 'C', text: String(optC), isCorrect: key === 'C' },
                { id: 'D', text: String(optD || '-'), isCorrect: key === 'D' },
                { id: 'E', text: String(optE || '-'), isCorrect: key === 'E' },
              ],
            });
          }
        });

        if (newQuestions.length > 0) {
          const initialMapel =
            detectedMapel ||
            (selectedBankMapel !== 'ALL' ? selectedBankMapel : mapelInput || config.mapel || 'Sosiologi');
          setUploadPendingQuestions(newQuestions);
          setUploadFileName(file.name);
          setUploadTargetMapel(initialMapel);
          setIsUploadMapelModalOpen(true);
        } else {
          showAlert(
            'Gagal! Pastikan format kolom Excel sesuai dengan TEMPLATE_SOAL (Pertanyaan, Opsi_A s/d Opsi_E, Kunci_Jawaban, Pembahasan).'
          );
        }
      } catch (err) {
        console.error(err);
        showAlert('Terjadi kesalahan saat memproses file Excel. Pastikan file tidak korup.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleConfirmUploadWithMapel = () => {
    if (uploadPendingQuestions.length === 0) return;
    const finalMapel = uploadTargetMapel.trim() || 'Sosiologi';
    const updatedWithMapel = uploadPendingQuestions.map((q) => ({
      ...q,
      mapel: finalMapel,
    }));
    const updated = [...config.questions, ...updatedWithMapel];
    onSaveConfig({ ...config, questions: updated });
    setIsUploadMapelModalOpen(false);
    setUploadPendingQuestions([]);
    showAlert(
      `Sukses! ${updatedWithMapel.length} soal untuk Mata Pelajaran "${finalMapel}" telah berhasil ditambahkan ke Bank Soal.`
    );
  };

  // --- REKAP CBT HANDLERS ---
  const processCbtFilesList = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const newResults: StudentResult[] = [...studentResults];
    let successCount = 0;
    let failCount = 0;
    let errorDetails: string[] = [];
    let processed = 0;

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          const decrypted = decryptResult(content);

          const existingIdx = newResults.findIndex(
            (r) =>
              r.id === decrypted.id ||
              (r.studentInfo.noPeserta === decrypted.studentInfo.noPeserta &&
                r.studentInfo.name === decrypted.studentInfo.name)
          );

          if (existingIdx >= 0) {
            newResults[existingIdx] = decrypted;
          } else {
            newResults.push(decrypted);
          }
          successCount++;
        } catch (err: any) {
          console.error('Gagal memproses file CBT:', file.name, err);
          failCount++;
          errorDetails.push(`${file.name}: ${err.message || 'File korup/salah format'}`);
        } finally {
          processed++;
          if (processed === files.length) {
            onSaveStudentResults([...newResults]);
            if (successCount > 0) {
              showAlert(
                `Berhasil mendekripsi & merekap ${successCount} file jawaban siswa (.cbt)!` +
                  (failCount > 0 ? ` (${failCount} file tidak valid)` : '')
              );
            } else {
              const detail = errorDetails[0] || 'Pastikan file terenkripsi resmi dari CBT Sosiologi!';
              showAlert(`Gagal merekap file .cbt. ${detail}`);
            }
          }
        }
      };

      reader.onerror = () => {
        failCount++;
        processed++;
        if (processed === files.length) {
          onSaveStudentResults([...newResults]);
          showAlert(`Gagal membaca file ${file.name}`);
        }
      };

      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleCbtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processCbtFilesList(e.target.files);
    }
    e.target.value = '';
  };

  const handleExportRekapToExcel = () => {
    if (studentResults.length === 0) {
      showAlert('Belum ada data rekap nilai siswa yang didekripsi!');
      return;
    }

    const kop = config.kopSekolah || defaultKopSekolah;

    const ws_data: any[][] = [
      [(kop.dinas || defaultKopSekolah.dinas).toUpperCase()],
      [(kop.namaSekolah || defaultKopSekolah.namaSekolah).toUpperCase()],
      [kop.alamat || defaultKopSekolah.alamat],
      [kop.teleponWeb || ''],
      [''],
      ['DAFTAR HASIL JAWABAN & REKAPITULASI NILAI UJIAN CBT GURUAI'],
      [`Mata Pelajaran: ${config.mapel || 'Sosiologi'} | KKM: ${config.kkm} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
      [''],
      ['No', 'NIS / No. Peserta', 'Nama Lengkap Siswa', 'Mata Pelajaran', 'Jawaban Benar', 'Jawaban Salah', 'Total Soal', 'Nilai Akhir', 'KKM', 'Status Lulus', 'Pelanggaran', 'Waktu Selesai'],
    ];

    studentResults.forEach((r, i) => {
      ws_data.push([
        i + 1,
        r.studentInfo.noPeserta,
        r.studentInfo.name,
        r.studentInfo.mapel,
        r.correctCount,
        r.incorrectCount,
        r.totalQuestions,
        r.score,
        r.kkm,
        r.isPassed ? 'LULUS (TUNTAS)' : 'REMIDI',
        r.warnings,
        r.submittedAt,
      ]);
    });

    // Summary Statistics
    const avgScore = Math.round(studentResults.reduce((sum, r) => sum + r.score, 0) / studentResults.length);
    const maxScore = Math.max(...studentResults.map((r) => r.score));
    const minScore = Math.min(...studentResults.map((r) => r.score));

    ws_data.push(['']);
    ws_data.push(['SUMMARY STATISTIK UJIAN:']);
    ws_data.push(['Rata-Rata Nilai Class', avgScore]);
    ws_data.push(['Nilai Tertinggi', maxScore]);
    ws_data.push(['Nilai Terendah', minScore]);
    ws_data.push(['Total Peserta Ujian', studentResults.length]);

    // Signature Block at Bottom
    ws_data.push(['']);
    ws_data.push(['', '', '', '', '', '', '', '', 'Mengetahui,', '', kop.kotaTanggal || defaultKopSekolah.kotaTanggal]);
    ws_data.push(['', '', '', '', '', '', '', '', 'Kepala Sekolah', '', kop.jabatanGuru || defaultKopSekolah.jabatanGuru]);
    ws_data.push(['']);
    ws_data.push(['']);
    ws_data.push(['', '', '', '', '', '', '', '', kop.namaKepalaSekolah || defaultKopSekolah.namaKepalaSekolah, '', kop.namaGuru || defaultKopSekolah.namaGuru]);
    ws_data.push(['', '', '', '', '', '', '', '', `NIP. ${kop.nipKepalaSekolah || defaultKopSekolah.nipKepalaSekolah}`, '', `NIP. ${kop.nipGuru || defaultKopSekolah.nipGuru}`]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Hasil_CBT');
    const cleanMapel = (config.mapel || 'Sosiologi').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `LAPORAN_HASIL_CBT_${cleanMapel}_${Date.now()}.xlsx`);
  };

  const handleDeleteStudentResult = (id: string) => {
    showConfirm(
      'Hapus Rekap Siswa?',
      'Apakah Anda yakin ingin menghapus data hasil siswa ini dari rekapitulasi?',
      () => {
        const updated = studentResults.filter((r) => r.id !== id);
        onSaveStudentResults(updated);
        showAlert('Data rekap siswa berhasil dihapus.');
      },
      true
    );
  };

  // --- TOKEN MANAGEMENT HANDLERS ---
  const handleGenerateRandomToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randToken = '';
    for (let i = 0; i < 6; i++) {
      randToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCurrentToken(randToken);
  };

  const handleSaveToken = () => {
    const trimmed = currentToken.trim().toUpperCase();
    if (!trimmed) {
      showAlert('Token tidak boleh kosong!');
      return;
    }
    onSaveConfig({
      ...config,
      examToken: trimmed,
    });
    showAlert(`Token Ujian berhasil diperbarui menjadi: ${trimmed}`);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(currentToken);
    setIsCopiedToken(true);
    setTimeout(() => setIsCopiedToken(false), 2000);
  };

  // --- STUDENT USER MANAGEMENT HANDLERS ---
  const handleDownloadStudentTemplate = () => {
    const ws_data = [
      ['NIS', 'Nama', 'Kelas', 'Kode_Guru'],
      ['1001', 'Ahmad Fauzi', 'XII IPS 1', config.kodeGuru || 'GURU01'],
      ['1002', 'Siti Rahmawati', 'XII IPS 1', config.kodeGuru || 'GURU01'],
      ['1003', 'Budi Santoso', 'XII IPS 2', config.kodeGuru || 'GURU01'],
      ['1004', 'Dewi Anjani', 'XII IPS 2', config.kodeGuru || 'GURU01'],
      ['1005', 'Rian Hidayat', 'XII IPS 3', config.kodeGuru || 'GURU01'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Siswa');
    XLSX.writeFile(wb, 'TEMPLATE_DATA_SISWA_CBT.xlsx');
  };

  const handleAddStudentManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNis.trim() || !newNama.trim()) {
      showAlert('Harap isi NIS dan Nama Siswa!');
      return;
    }

    // Check duplicate NIS
    const exists = studentsList.some((s) => s.nis.toLowerCase() === newNis.trim().toLowerCase());
    if (exists) {
      showAlert(`NIS "${newNis}" sudah terdaftar dalam sistem!`);
      return;
    }

    const newStudent: StudentUser = {
      id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nis: newNis.trim(),
      nama: newNama.trim(),
      kelas: newKelas.trim() || 'XII IPS',
      kodeGuru: newStudentKodeGuru.trim().toUpperCase() || config.kodeGuru || 'GURU01',
    };

    const updated = [...studentsList, newStudent];
    onSaveConfig({ ...config, students: updated });

    setNewNis('');
    setNewNama('');
    setNewKelas('');
    setNewStudentKodeGuru('');
    setIsAddStudentModalOpen(false);
    showAlert(`Siswa "${newStudent.nama}" berhasil ditambahkan!`);
  };

  const handleStudentExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const newStudents: StudentUser[] = [];
        let countAdded = 0;

        data.forEach((row, idx) => {
          const nisVal = String(row['NIS'] || row['nis'] || row['No_Peserta'] || row['No. Peserta'] || '').trim();
          const namaVal = String(row['Nama'] || row['nama'] || row['Nama_Siswa'] || row['Nama Siswa'] || '').trim();
          const kelasVal = String(row['Kelas'] || row['kelas'] || row['Kelas_Siswa'] || 'XII IPS').trim();
          const kodeGuruVal = String(row['Kode_Guru'] || row['Kode Guru'] || row['Kode'] || config.kodeGuru || 'GURU01').trim().toUpperCase();

          if (nisVal && namaVal) {
            // avoid duplicate NIS
            const isDup =
              studentsList.some((s) => s.nis.toLowerCase() === nisVal.toLowerCase()) ||
              newStudents.some((s) => s.nis.toLowerCase() === nisVal.toLowerCase());

            if (!isDup) {
              newStudents.push({
                id: `std-${Date.now()}-${idx}`,
                nis: nisVal,
                nama: namaVal,
                kelas: kelasVal,
                kodeGuru: kodeGuruVal,
              });
              countAdded++;
            }
          }
        });

        if (countAdded > 0) {
          const updated = [...studentsList, ...newStudents];
          onSaveConfig({ ...config, students: updated });
          showAlert(`Sukses mengimpor ${countAdded} data siswa baru dari Excel!`);
        } else {
          showAlert(
            'Tidak ada data siswa baru yang diimpor. Pastikan format kolom Excel adalah: NIS, Nama, Kelas (dan NIS belum terdaftar).'
          );
        }
      } catch (err) {
        console.error(err);
        showAlert('Gagal memproses file Excel Data Siswa.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleDeleteStudent = (id: string, nama: string) => {
    showConfirm(
      'Hapus Data Siswa?',
      `Apakah Anda yakin ingin menghapus siswa "${nama}"?`,
      () => {
        const updated = studentsList.filter((s) => s.id !== id);
        onSaveConfig({ ...config, students: updated });
        showAlert(`Data siswa "${nama}" berhasil dihapus.`);
      },
      true
    );
  };

  // Derived Student Counts & Data
  const uniqueClasses = Array.from(new Set(studentsList.map((s) => s.kelas))).filter(Boolean);
  const activeStudentsCount = studentsList.filter((s) => s.isActive !== false).length;
  const inactiveStudentsCount = studentsList.length - activeStudentsCount;

  // --- STUDENT ACTIVE EXAM SELECTION HANDLERS ---
  const handleToggleStudentActive = (id: string) => {
    const updated = studentsList.map((s) => {
      if (s.id === id) {
        const currentActive = s.isActive !== false;
        return { ...s, isActive: !currentActive };
      }
      return s;
    });
    onSaveConfig({ ...config, students: updated });
  };

  const handleSetClassActiveStatus = (kelasName: string, isActive: boolean, exclusivelyThisClass: boolean = false) => {
    const updated = studentsList.map((s) => {
      if (s.kelas === kelasName) {
        return { ...s, isActive };
      }
      if (exclusivelyThisClass) {
        return { ...s, isActive: false };
      }
      return s;
    });
    onSaveConfig({ ...config, students: updated });

    if (exclusivelyThisClass) {
      showAlert(`Hanya siswa di kelas "${kelasName}" yang DIAKTIFKAN UJIAN. Siswa kelas lainnya di-nonaktifkan.`);
    } else {
      showAlert(`Siswa di kelas "${kelasName}" berhasil di-${isActive ? 'aktifkan' : 'nonaktifkan'} untuk ujian.`);
    }
  };

  const handleSetAllStudentsActive = (isActive: boolean) => {
    const updated = studentsList.map((s) => ({ ...s, isActive }));
    onSaveConfig({ ...config, students: updated });
    showAlert(`Semua siswa (${studentsList.length}) berhasil di-${isActive ? 'aktifkan' : 'nonaktifkan'} untuk ujian.`);
  };

  const handleBatchSetStudentActive = (isActive: boolean) => {
    if (selectedStudentIds.length === 0) {
      showAlert('Pilih minimal satu siswa dari tabel terlebih dahulu!');
      return;
    }
    const updated = studentsList.map((s) => {
      if (selectedStudentIds.includes(s.id)) {
        return { ...s, isActive };
      }
      return s;
    });
    onSaveConfig({ ...config, students: updated });
    showAlert(`${selectedStudentIds.length} siswa terpilih berhasil di-${isActive ? 'aktifkan' : 'nonaktifkan'} untuk ujian.`);
    setSelectedStudentIds([]);
  };

  const handleBatchDeleteStudents = () => {
    if (selectedStudentIds.length === 0) return;
    showConfirm(
      'Hapus Siswa Terpilih?',
      `Apakah Anda yakin ingin menghapus ${selectedStudentIds.length} siswa yang dicentang?`,
      () => {
        const updated = studentsList.filter((s) => !selectedStudentIds.includes(s.id));
        onSaveConfig({ ...config, students: updated });
        setSelectedStudentIds([]);
        showAlert(`${selectedStudentIds.length} siswa berhasil dihapus.`);
      },
      true
    );
  };

  const handleToggleSelectAllStudents = (currentFiltered: StudentUser[]) => {
    if (selectedStudentIds.length === currentFiltered.length && currentFiltered.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(currentFiltered.map((s) => s.id));
    }
  };

  const handleToggleSelectOneStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((item) => item !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  // --- TEACHER USER MANAGEMENT HANDLERS ---
  const handleDownloadTeacherTemplate = () => {
    const ws_data = [
      ['NIP', 'Nama', 'Mata_Pelajaran', 'Kode_Guru'],
      ['198501152010011002', 'Drs. Aji Sosiologi, M.Pd', 'Sosiologi', 'GURU01'],
      ['198803202012022005', 'Siti Rahmawati, S.Pd', 'Sosiologi', 'GURU02'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Guru');
    XLSX.writeFile(wb, 'TEMPLATE_DATA_GURU_CBT.xlsx');
  };

  const handleAddTeacherManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNip.trim() || !newTeacherNama.trim()) {
      showAlert('Harap isi NIP dan Nama Guru!');
      return;
    }

    const exists = teachersList.some((t) => t.nip.toLowerCase() === newNip.trim().toLowerCase());
    if (exists) {
      showAlert(`NIP "${newNip}" sudah terdaftar dalam sistem!`);
      return;
    }

    const newTeacher: TeacherUser = {
      id: `tch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nip: newNip.trim(),
      nama: newTeacherNama.trim(),
      mapel: newTeacherMapel.trim() || 'Sosiologi',
      kodeGuru: newTeacherKodeGuru.trim().toUpperCase() || 'GURU01',
    };

    const updated = [...teachersList, newTeacher];
    onSaveConfig({ ...config, teachers: updated });

    setNewNip('');
    setNewTeacherNama('');
    setNewTeacherMapel('');
    setNewTeacherKodeGuru('');
    setIsAddTeacherModalOpen(false);
    showAlert(`Guru "${newTeacher.nama}" berhasil ditambahkan!`);
  };

  const handleTeacherExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        const newTeachers: TeacherUser[] = [];
        let countAdded = 0;

        data.forEach((row, idx) => {
          const nipVal = String(row['NIP'] || row['nip'] || row['No_NIP'] || '').trim();
          const namaVal = String(row['Nama'] || row['nama'] || row['Nama_Guru'] || row['Nama Lengkap'] || '').trim();
          const mapelVal = String(row['Mata_Pelajaran'] || row['Mata Pelajaran'] || row['Mapel'] || 'Sosiologi').trim();
          const kodeGuruVal = String(row['Kode_Guru'] || row['Kode Guru'] || row['Kode'] || 'GURU01').trim().toUpperCase();

          if (nipVal && namaVal) {
            const isDup =
              teachersList.some((t) => t.nip.toLowerCase() === nipVal.toLowerCase()) ||
              newTeachers.some((t) => t.nip.toLowerCase() === nipVal.toLowerCase());

            if (!isDup) {
              newTeachers.push({
                id: `tch-${Date.now()}-${idx}`,
                nip: nipVal,
                nama: namaVal,
                mapel: mapelVal,
                kodeGuru: kodeGuruVal,
              });
              countAdded++;
            }
          }
        });

        if (countAdded > 0) {
          const updated = [...teachersList, ...newTeachers];
          onSaveConfig({ ...config, teachers: updated });
          showAlert(`Sukses mengimpor ${countAdded} data guru baru dari Excel!`);
        } else {
          showAlert(
            'Tidak ada data guru baru yang diimpor. Pastikan format kolom Excel adalah: NIP, Nama, Mata_Pelajaran.'
          );
        }
      } catch (err) {
        console.error(err);
        showAlert('Gagal memproses file Excel Data Guru.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleDeleteTeacher = (id: string, nama: string) => {
    showConfirm(
      'Hapus Data Guru?',
      `Apakah Anda yakin ingin menghapus data guru "${nama}"?`,
      () => {
        const updated = teachersList.filter((t) => t.id !== id);
        onSaveConfig({ ...config, teachers: updated });
        showAlert(`Data guru "${nama}" berhasil dihapus.`);
      },
      true
    );
  };

  // --- FILTERS & STATS ---
  const availableKodeGurus = Array.from(
    new Set([
      config.kodeGuru || 'GURU01',
      ...config.questions.map((q) => q.kodeGuru).filter(Boolean),
      ...teachersList.map((t) => t.kodeGuru).filter(Boolean),
      ...studentsList.map((s) => s.kodeGuru).filter(Boolean),
    ])
  ) as string[];

  const availableKompetensis = Array.from(
    new Set(
      config.questions
        .map((q) => (q.kompetensi || q.subTopik || '').trim())
        .filter((k): k is string => Boolean(k))
    )
  ).sort();

  const availableBentukSoals = Array.from(
    new Set([
      'Pilihan Ganda',
      'Pilihan Ganda Kompleks',
      'Menjodohkan',
      'Isian Singkat',
      'Uraian',
      ...config.questions
        .map((q) => (q.bentukSoal || '').trim())
        .filter((b): b is string => Boolean(b)),
    ])
  );

  const filteredQuestions = config.questions.filter((q) => {
    const query = searchQuery.toLowerCase();
    const qKomp = (q.kompetensi || q.subTopik || '').toLowerCase();
    const qBentuk = (q.bentukSoal || 'Pilihan Ganda').toLowerCase();
    const qMapel = (q.mapel || config.mapel || 'Sosiologi').toLowerCase();

    const matchesSearch =
      q.question.toLowerCase().includes(query) ||
      qKomp.includes(query) ||
      qBentuk.includes(query) ||
      qMapel.includes(query);

    const matchesMapel =
      selectedBankMapel === 'ALL' ||
      !q.mapel ||
      q.mapel === selectedBankMapel;

    const matchesKompetensi =
      selectedBankKompetensi === 'ALL' ||
      (q.kompetensi || q.subTopik || '') === selectedBankKompetensi;

    const matchesBentukSoal =
      selectedBankBentukSoal === 'ALL' ||
      (q.bentukSoal || 'Pilihan Ganda') === selectedBankBentukSoal;

    const qKodeGuru = (q.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase();
    const matchesKodeGuru =
      selectedBankKodeGuru === 'ALL' ||
      qKodeGuru === selectedBankKodeGuru.toUpperCase();

    return matchesSearch && matchesMapel && matchesKompetensi && matchesBentukSoal && matchesKodeGuru;
  });

  const filteredStudentResults = studentResults.filter((r) => {
    const matchesSearch =
      r.studentInfo.name.toLowerCase().includes(rekapSearch.toLowerCase()) ||
      r.studentInfo.noPeserta.toLowerCase().includes(rekapSearch.toLowerCase());
    const rKodeGuru = (r.studentInfo.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase();
    const matchesKodeGuru =
      rekapKodeGuruFilter === 'ALL' ||
      rKodeGuru === rekapKodeGuruFilter.toUpperCase();

    return matchesSearch && matchesKodeGuru;
  });

  const filteredStudents = studentsList.filter((s) => {
    const matchesSearch =
      s.nama.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.nis.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.kelas.toLowerCase().includes(studentSearch.toLowerCase());

    const matchesClass = studentClassFilter === 'ALL' || s.kelas === studentClassFilter;

    const isStudentActive = s.isActive !== false;
    const matchesStatus =
      studentStatusFilter === 'ALL' ||
      (studentStatusFilter === 'ACTIVE' && isStudentActive) ||
      (studentStatusFilter === 'INACTIVE' && !isStudentActive);

    const sKodeGuru = (s.kodeGuru || config.kodeGuru || 'GURU01').toUpperCase();
    const matchesKodeGuru =
      studentKodeGuruFilter === 'ALL' ||
      sKodeGuru === studentKodeGuruFilter.toUpperCase();

    return matchesSearch && matchesClass && matchesStatus && matchesKodeGuru;
  });

  const filteredTeachers = teachersList.filter(
    (t) =>
      t.nama.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.nip.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.mapel.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const averageScore =
    studentResults.length > 0
      ? Math.round(studentResults.reduce((sum, r) => sum + r.score, 0) / studentResults.length)
      : 0;

  const passedCount = studentResults.filter((r) => r.isPassed).length;

  // --- ANALISIS BUTIR SOAL (ITEM ANALYSIS) CALCULATION ---
  const rawItemAnalysisList = React.useMemo<ItemAnalysisData[]>(() => {
    const targetMapel = analisisMapelFilter !== 'ALL' ? analisisMapelFilter : selectedBankMapel !== 'ALL' ? selectedBankMapel : 'ALL';
    const filteredQ = config.questions.filter((q) => {
      if (targetMapel !== 'ALL' && q.mapel && q.mapel !== targetMapel) {
        return false;
      }
      return true;
    });

    const sortedResults = [...studentResults].sort((a, b) => b.score - a.score);
    const totalRes = sortedResults.length;
    const groupSize = Math.max(1, Math.round(totalRes * 0.27));
    const upperGroup = sortedResults.slice(0, groupSize);
    const lowerGroup = totalRes > 1 ? sortedResults.slice(totalRes - groupSize) : [];

    return filteredQ.map((q, idx) => {
      let countA = 0;
      let countB = 0;
      let countC = 0;
      let countD = 0;
      let countE = 0;
      let countEmpty = 0;
      let totalCorrect = 0;
      let totalIncorrect = 0;

      let upperCorrect = 0;
      let lowerCorrect = 0;

      const correctOpt = q.options.find((o) => o.isCorrect);
      const keyOption = correctOpt ? correctOpt.id.toUpperCase() : 'A';

      sortedResults.forEach((r) => {
        let qIdx = -1;
        if (r.questionSnapshots && r.questionSnapshots.length > 0) {
          qIdx = r.questionSnapshots.findIndex((sq) => sq.id === q.id);
        } else {
          qIdx = config.questions.findIndex((sq) => sq.id === q.id);
        }

        const userAns = qIdx !== -1 && r.answers ? r.answers[qIdx] : null;

        if (!userAns || String(userAns).trim() === '') {
          countEmpty++;
          totalIncorrect++;
        } else {
          const cleanAns = String(userAns).trim().toUpperCase();
          const matchedOpt = q.options.find(
            (o) => o.id.toUpperCase() === cleanAns || o.text.trim().toUpperCase() === cleanAns
          );
          const ansId = matchedOpt ? matchedOpt.id.toUpperCase() : cleanAns;

          if (ansId === 'A') countA++;
          else if (ansId === 'B') countB++;
          else if (ansId === 'C') countC++;
          else if (ansId === 'D') countD++;
          else if (ansId === 'E') countE++;
          else countEmpty++;

          const isCorr = matchedOpt ? matchedOpt.isCorrect === true : ansId === keyOption;
          if (isCorr) {
            totalCorrect++;
          } else {
            totalIncorrect++;
          }
        }
      });

      upperGroup.forEach((r) => {
        let qIdx = -1;
        if (r.questionSnapshots && r.questionSnapshots.length > 0) {
          qIdx = r.questionSnapshots.findIndex((sq) => sq.id === q.id);
        } else {
          qIdx = config.questions.findIndex((sq) => sq.id === q.id);
        }
        const userAns = qIdx !== -1 && r.answers ? r.answers[qIdx] : null;
        if (userAns && String(userAns).trim() !== '') {
          const cleanAns = String(userAns).trim().toUpperCase();
          const matchedOpt = q.options.find(
            (o) => o.id.toUpperCase() === cleanAns || o.text.trim().toUpperCase() === cleanAns
          );
          if (matchedOpt ? matchedOpt.isCorrect === true : cleanAns === keyOption) {
            upperCorrect++;
          }
        }
      });

      lowerGroup.forEach((r) => {
        let qIdx = -1;
        if (r.questionSnapshots && r.questionSnapshots.length > 0) {
          qIdx = r.questionSnapshots.findIndex((sq) => sq.id === q.id);
        } else {
          qIdx = config.questions.findIndex((sq) => sq.id === q.id);
        }
        const userAns = qIdx !== -1 && r.answers ? r.answers[qIdx] : null;
        if (userAns && String(userAns).trim() !== '') {
          const cleanAns = String(userAns).trim().toUpperCase();
          const matchedOpt = q.options.find(
            (o) => o.id.toUpperCase() === cleanAns || o.text.trim().toUpperCase() === cleanAns
          );
          if (matchedOpt ? matchedOpt.isCorrect === true : cleanAns === keyOption) {
            lowerCorrect++;
          }
        }
      });

      const difficultyIndex = totalRes > 0 ? totalCorrect / totalRes : 0;
      let difficultyCategory: 'Mudah' | 'Sedang' | 'Sukar' = 'Sedang';
      if (difficultyIndex > 0.70) difficultyCategory = 'Mudah';
      else if (difficultyIndex < 0.30) difficultyCategory = 'Sukar';

      let discriminationIndex = totalRes > 0 && groupSize > 0 ? (upperCorrect - lowerCorrect) / groupSize : 0;
      if (discriminationIndex < 0) discriminationIndex = 0;

      let discriminationCategory: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Buruk' = 'Baik';
      if (discriminationIndex >= 0.40) discriminationCategory = 'Sangat Baik';
      else if (discriminationIndex >= 0.30) discriminationCategory = 'Baik';
      else if (discriminationIndex >= 0.20) discriminationCategory = 'Cukup';
      else discriminationCategory = 'Buruk';

      let recommendation: 'Diterima' | 'Direvisi' | 'Dibuang' = 'Diterima';
      if (discriminationCategory === 'Buruk') {
        recommendation = 'Dibuang';
      } else if (discriminationCategory === 'Cukup' || difficultyCategory === 'Sukar') {
        recommendation = 'Direvisi';
      }

      return {
        questionNumber: idx + 1,
        questionText: q.question,
        keyOption,
        mapel: q.mapel || config.mapel || 'Sosiologi',
        countA,
        countB,
        countC,
        countD,
        countE,
        countEmpty,
        totalCorrect,
        totalIncorrect,
        totalRespondents: totalRes,
        difficultyIndex,
        difficultyCategory,
        discriminationIndex,
        discriminationCategory,
        recommendation,
      };
    });
  }, [config.questions, studentResults, analisisMapelFilter, selectedBankMapel, config.mapel]);

  const filteredAnalisisList = rawItemAnalysisList.filter((item) => {
    const matchesSearch = item.questionText.toLowerCase().includes(analisisSearch.toLowerCase());
    const matchesDiff = analisisDifficultyFilter === 'ALL' || item.difficultyCategory === analisisDifficultyFilter;
    return matchesSearch && matchesDiff;
  });

  const handleExportAnalisisToExcel = () => {
    if (rawItemAnalysisList.length === 0) {
      showAlert('Belum ada data butir soal untuk dianalisis.');
      return;
    }

    const ws_data = [
      [
        'No. Soal',
        'Mata Pelajaran',
        'Pertanyaan Soal',
        'Kunci Jawaban',
        'Pilihan A',
        'Pilihan B',
        'Pilihan C',
        'Pilihan D',
        'Pilihan E',
        'Tidak Menjawab (Kosong)',
        'Total Menjawab Benar',
        'Total Menjawab Salah',
        'Total Responden (Siswa)',
        'Tingkat Kesukaran (P)',
        'Kategori Kesukaran',
        'Daya Beda (D)',
        'Kategori Daya Beda',
        'Rekomendasi Soal',
      ],
      ...rawItemAnalysisList.map((item) => [
        item.questionNumber,
        item.mapel,
        item.questionText,
        item.keyOption,
        item.countA,
        item.countB,
        item.countC,
        item.countD,
        item.countE,
        item.countEmpty,
        item.totalCorrect,
        item.totalIncorrect,
        item.totalRespondents,
        item.difficultyIndex.toFixed(2),
        item.difficultyCategory,
        item.discriminationIndex.toFixed(2),
        item.discriminationCategory,
        item.recommendation,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analisis_Butir_Soal');
    const cleanMapel = (config.mapel || 'Sosiologi').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `ANALISIS_BUTIR_SOAL_${cleanMapel}_${Date.now()}.xlsx`);
  };

  const handleExportAnalisisToPdf = () => {
    if (rawItemAnalysisList.length === 0) {
      showAlert('Belum ada data analisis butir soal.');
      return;
    }
    generateItemAnalysisPdfReport(
      rawItemAnalysisList,
      config.kopSekolah || defaultKopSekolah,
      {
        mapel: analisisMapelFilter !== 'ALL' ? analisisMapelFilter : (config.mapel || 'Sosiologi'),
        mapelTitle: config.mapelTitle || 'Assessment TKA SMA',
        totalQuestions: rawItemAnalysisList.length,
        totalRespondents: studentResults.length,
      }
    );
  };

  return (
    <div className="flex-1 flex h-screen bg-slate-100 absolute inset-0 z-50 overflow-hidden">
      {/* GLOBAL HIDDEN FILE INPUTS (Mounted continuously across all tabs) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xls,.xlsx"
        className="hidden"
      />
      <input
        type="file"
        ref={cbtFileInputRef}
        onChange={handleCbtFileUpload}
        accept=".cbt,.json,.txt,*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={studentFileInputRef}
        onChange={handleStudentExcelUpload}
        accept=".xls,.xlsx"
        className="hidden"
      />
      <input
        type="file"
        ref={teacherFileInputRef}
        onChange={handleTeacherExcelUpload}
        accept=".xls,.xlsx"
        className="hidden"
      />
      <input
        type="file"
        ref={backupFileInputRef}
        onChange={handleRestoreAppData}
        accept=".json,.cbt,*"
        className="hidden"
      />

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 md:w-72 bg-slate-900 text-slate-100 flex flex-col justify-between transition-transform duration-300 shadow-2xl border-r border-slate-800 shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/50 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-white tracking-wide leading-tight flex items-center gap-1.5">
                  CBT GURU
                  {adminRole === 'teacher' ? (
                    <span className="bg-indigo-900/90 text-indigo-200 border border-indigo-700/80 px-2 py-0.5 rounded-md text-[9px] font-extrabold">
                      USER GURU
                    </span>
                  ) : (
                    <span className="bg-emerald-900/90 text-emerald-200 border border-emerald-700/80 px-2 py-0.5 rounded-md text-[9px] font-extrabold">
                      ADMIN
                    </span>
                  )}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-blue-400 font-medium">Panel Pengaturan</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="p-4 space-y-6">
            <div>
              <p className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Menu Pengaturan
              </p>
              <nav className="space-y-1.5">
                <button
                  onClick={() => {
                    setActiveTab('panduan');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'panduan'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Panduan Guru</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'panduan'
                        ? 'bg-purple-800 text-white'
                        : 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    Petunjuk
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('mapel');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'mapel'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Mata Pelajaran</span>
                  </div>
                  <span className="font-sans text-[10px] bg-slate-950/60 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30 font-bold truncate max-w-[85px]">
                    {mapelInput || 'Sosiologi'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('bank');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'bank'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Bank Soal</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'bank' ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.questions.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('students');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'students'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>User Siswa & Guru</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'students' ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {studentsList.length + teachersList.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('token');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'token'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/30 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Token Ujian</span>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-950/60 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                    {currentToken}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('schedule');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'schedule'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Setting Jadwal Ujian</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    sessionStatus === 'ACTIVE'
                      ? 'bg-emerald-500 text-white'
                      : sessionStatus === 'DRAFT'
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-red-500 text-white'
                  }`}>
                    {sessionStatus}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('rekap');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'rekap'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Rekap & Laporan PDF/Excel</span>
                  </div>
                  {studentResults.length > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        activeTab === 'rekap'
                          ? 'bg-emerald-800 text-white'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {studentResults.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('analisis');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'analisis'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Analisis Butir Soal</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'analisis'
                        ? 'bg-teal-800 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.questions.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('backup');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'backup'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderArchive className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Backup Data & System</span>
                  </div>
                </button>
              </nav>
            </div>

            <div>
              <p className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tindakan System
              </p>
              <div className="space-y-2">
                <button
                  onClick={triggerExportActivePaketJsonWithAnimation}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800/90 text-sky-400 hover:bg-sky-600 hover:text-white transition-all border border-slate-700/60 shadow-xs cursor-pointer"
                  title="Unduh file Paket Soal Aktif (.json)"
                >
                  <FileJson className="w-4 h-4 shrink-0" />
                  <span>Paket Soal (.json)</span>
                </button>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800/90 text-red-400 hover:bg-red-600 hover:text-white transition-all border border-slate-700/60 shadow-xs"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Keluar Panel Guru</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-semibold text-slate-300">CBT Standalone Server</span>
            </div>
            <span className="bg-slate-800 text-teal-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-slate-700">
              v2.0.0
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Assessment TKA SMA - Panel Guru</p>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-xs animate-fade-in"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0">
        {/* Main Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3.5 flex justify-between items-center shrink-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
            >
              <Menu className="w-5 h-5 text-blue-600" />
              <span>Menu</span>
            </button>

            <div className="min-w-0">
              <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2 truncate">
                {activeTab === 'panduan' && <GraduationCap className="w-4.5 h-4.5 text-purple-600 shrink-0" />}
                {activeTab === 'mapel' && <BookOpen className="w-4.5 h-4.5 text-sky-600 shrink-0" />}
                {activeTab === 'bank' && <Database className="w-4.5 h-4.5 text-blue-600 shrink-0" />}
                {activeTab === 'students' && <Users className="w-4.5 h-4.5 text-indigo-600 shrink-0" />}
                {activeTab === 'token' && <Key className="w-4.5 h-4.5 text-amber-500 shrink-0" />}
                {activeTab === 'schedule' && <Clock className="w-4.5 h-4.5 text-orange-500 shrink-0" />}
                {activeTab === 'rekap' && <FileCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                <span>
                  {activeTab === 'panduan' && 'Panduan Alur Kerja Guru — Portal CBT GuruAI'}
                  {activeTab === 'mapel' && 'Pengaturan Mata Pelajaran & Header Ujian'}
                  {activeTab === 'bank' && 'Bank Soal & Kelola Pertanyaan'}
                  {activeTab === 'students' && 'Manajemen User & Data Siswa'}
                  {activeTab === 'token' && 'Manajemen Token Ujian'}
                  {activeTab === 'schedule' && 'Setting Jadwal, Parameter & Ketentuan Ujian'}
                  {activeTab === 'rekap' && 'Rekapitulasi & Dekripsi (.CBT)'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                Sistem CBT Assessment TKA SMA — Panel Guru
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportActivePaketJson}
              className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs shadow-xs active:scale-95 cursor-pointer"
              title="Unduh Paket Soal Aktif (.json)"
            >
              <FileJson className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Paket Soal (.json)</span>
            </button>

            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs shadow-xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* TAB: PANDUAN UNTUK GURU */}
          {activeTab === 'panduan' && (
            <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
              {/* Hero Banner Panduan */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-purple-800/50 relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent pointer-events-none" />
                
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-400/30">
                    <GraduationCap className="w-4 h-4 text-purple-300" />
                    <span>Panduan Resmi Penggunaan Portal CBT GuruAI</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    Alur Kerja Runtut Persiapan Ujian CBT
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed max-w-3xl">
                    Panduan praktis langkah demi langkah bagi Bapak/Ibu Guru untuk menyiapkan mata pelajaran, merakit bank soal, mengatur parameter ujian, hingga mengunduh rekap nilai dan analisis butir soal secara akurat.
                  </p>

                  {/* Operational Status Chips */}
                  <div className="pt-2 grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Kode Guru</span>
                      <span className="text-xs font-mono font-black text-amber-300 truncate block">{config.kodeGuru || 'GURU01'}</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Mapel Aktif</span>
                      <span className="text-xs font-black text-sky-400 truncate block">{mapelInput || 'Sosiologi'}</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Soal</span>
                      <span className="text-xs font-black text-blue-400 block">{config.questions.length} Soal</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Peserta Ujian</span>
                      <span className="text-xs font-black text-indigo-400 block">{studentsList.length} Siswa</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Sesi Ujian</span>
                      <span className={`text-xs font-black block ${sessionStatus === 'ACTIVE' ? 'text-emerald-400' : sessionStatus === 'DRAFT' ? 'text-amber-400' : 'text-red-400'}`}>
                        {sessionStatus}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Token Ujian</span>
                      <span className="text-xs font-mono font-black text-amber-400 block">{currentToken}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIDEO TUTORIAL PANDUAN GURU (YOUTUBE) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                      <Youtube className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <span>Video Panduan & Tutorial Penggunaan CBT</span>
                        {config.youtubeGuideUrl && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black">
                            Tersedia Video
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Saksikan video penjelasan cara menggunakan Portal CBT GuruAI secara visual.
                      </p>
                    </div>
                  </div>

                  {/* Actions for Admin and Teachers */}
                  <div className="flex items-center gap-2 shrink-0">
                    {adminRole === 'admin' && (
                      <button
                        onClick={() => setIsEditingVideoUrl(!isEditingVideoUrl)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>{isEditingVideoUrl ? 'Tutup Pengaturan' : 'Atur Link Video (Admin)'}</span>
                      </button>
                    )}
                    {config.youtubeGuideUrl && (
                      <a
                        href={config.youtubeGuideUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Buka di YouTube</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Form Input Khusus Admin */}
                {(isEditingVideoUrl || (adminRole === 'admin' && !config.youtubeGuideUrl)) && (
                  <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Form Input Link Video YouTube (Khusus Admin)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Video ini akan dapat dilihat oleh seluruh User Guru
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={youtubeGuideUrlInput}
                        onChange={(e) => setYoutubeGuideUrlInput(e.target.value)}
                        placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                        className="flex-1 bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3.5 py-2.5 font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={handleSaveYoutubeGuideUrl}
                          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Link</span>
                        </button>
                        {config.youtubeGuideUrl && (
                          <button
                            onClick={() => {
                              setYoutubeGuideUrlInput('');
                              onSaveConfig({ ...config, youtubeGuideUrl: '' });
                              setIsEditingVideoUrl(false);
                              showAlert('Link video berhasil dikosongkan.');
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Masukkan URL video YouTube (format <code className="text-amber-300 font-mono">watch?v=...</code>, <code className="text-amber-300 font-mono">youtu.be/...</code>, atau Shorts). Video akan otomatis terpasang dalam player di halaman Panduan ini.
                    </p>
                  </div>
                )}

                {/* Player Video Display Area */}
                {(() => {
                  const embedUrl = getYouTubeEmbedUrl(config.youtubeGuideUrl);
                  if (embedUrl) {
                    return (
                      <div className="space-y-2">
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md border border-slate-200 bg-slate-950">
                          <iframe
                            src={embedUrl}
                            title="Video Panduan Guru CBT"
                            className="absolute top-0 left-0 w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Video className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            Putar video di atas untuk melihat demonstrasi langkah-langkah ujian.
                          </span>
                          {config.youtubeGuideUrl && (
                            <a
                              href={config.youtubeGuideUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 hover:underline"
                            >
                              <span>Layar Penuh di YouTube</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  } else if (config.youtubeGuideUrl) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
                          <Youtube className="w-5 h-5 text-red-600 shrink-0" />
                          <span>Link Video YouTube sudah disetel: <strong className="font-mono text-slate-700">{config.youtubeGuideUrl}</strong></span>
                        </div>
                        <a
                          href={config.youtubeGuideUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Tonton Video Panduan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  } else if (!isEditingVideoUrl) {
                    return (
                      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                          <Youtube className="w-6 h-6 fill-current" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                          Video Panduan Belum Diunggah / Diatur
                        </h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                          Admin dapat memasukkan link video YouTube tutorial di sini agar seluruh Bapak/Ibu Guru dapat menyimak panduan penggunaan Portal CBT secara visual.
                        </p>
                        {adminRole === 'admin' && (
                          <button
                            onClick={() => setIsEditingVideoUrl(true)}
                            className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Atur Link Video YouTube Sekarang</span>
                          </button>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Runtut 7 Langkah Persiapan Ujian */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-purple-600" />
                    <span>Langkah demi Langkah Persiapan Ujian (Runtut 1 - 7)</span>
                  </h3>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    Sistem CBT GuruAI
                  </span>
                </div>

                {/* LANGKAH 1 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-sky-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 1
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-sky-600" />
                        Pengaturan Mata Pelajaran & Header Ujian
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('mapel')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Menu Mata Pelajaran</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Sebelum menyusun soal, tentukan dahulu identitas dan header ujian yang akan ditampilkan pada layar siswa:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                      <li>Masuk ke menu <strong className="text-sky-700">Mata Pelajaran</strong>.</li>
                      <li>Pilih atau ketik **Mata Pelajaran Aktif** (Contoh: <em>Sosiologi</em>, <em>Geografi</em>, <em>Matematika</em>, dll).</li>
                      <li>Isi **Judul Header Ujian** (Contoh: <em>Assessment TKA SMA</em>, <em>Penilaian Akhir Semester</em>) dan **Sub Judul**.</li>
                      <li>Isi data **Nama Sekolah**, **Nama Guru Pengampu**, dan konfigurasi **Kop Sekolah** agar tercetak rapi saat mengunduh Laporan PDF.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 2 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 2
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        Input Soal & Kelola Bank Soal
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('bank')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Bank Soal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Isi pertanyaan dan kunci jawaban ke dalam Bank Soal melalui cara manual atau impor Excel:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                      <li>Masuk ke menu <strong className="text-blue-700">Bank Soal</strong>.</li>
                      <li>Klik **+ Tambah Soal** untuk mengisi soal secara manual, ATAU klik **Unduh Template Excel (.xlsx)** dan unggah kembali file Excel yang telah terisi.</li>
                      <li>Setiap soal wajib memiliki: Pertanyaan, Pilihan A-E, Kunci Jawaban (A/B/C/D/E), serta **Pembahasan HOTS**.</li>
                      <li>Tambahkan **Sub Topik / Materi Ujian** (misal: <em>Perubahan Sosial</em>, <em>Globalisasi</em>) agar mudah difilter.</li>
                      <li>Anda juga dapat melampirkan **Gambar / Tabel** pada pertanyaan atau pilihan jawaban.</li>
                      <li>Pastikan tombol status soal bertanda <strong className="text-emerald-600">Aktif</strong> agar dimuat dalam lembar ujian siswa.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 3 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-indigo-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 3
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        Kelola Data Peserta Ujian (Siswa & Guru)
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka User Siswa & Guru</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Pastikan akun dan kredensial siswa yang akan mengikuti ujian sudah terdaftar dalam sistem:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                      <li>Masuk ke menu <strong className="text-indigo-700">User Siswa & Guru</strong>.</li>
                      <li>Tambahkan data siswa (Nomor Peserta/NIS, Nama Lengkap, Kelas, Ruang, dan Password/PIN).</li>
                      <li>Gunakan tombol **Import Excel Data Siswa** untuk memasukkan puluhan/ratusan siswa sekaligus.</li>
                      <li>Anda juga dapat menambahkan akun **Guru Pengawas / Admin** lain jika diperlukan.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 4 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-orange-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 4
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        Atur Jadwal, Parameter & Ketentuan Ujian
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Setting Jadwal Ujian</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Konfigurasi aturan dan batas durasi pengerjaan sebelum ujian diaktifkan:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                      <li>Masuk ke menu <strong className="text-orange-700">Setting Jadwal Ujian</strong>.</li>
                      <li>Tentukan **Durasi Ujian** (misal: 60 menit) dan **Nilai KKM** (misal: 75).</li>
                      <li>Atur **Jumlah Soal Tampil** (isi `0` jika ingin menampilkan seluruh soal di Bank Soal).</li>
                      <li>Aktifkan Opsi **Acak Urutan Soal** dan **Acak Pilihan Jawaban** untuk meminimalkan penyontekan.</li>
                      <li>Tentukan **Waktu Mulai Ujian** & **Waktu Selesai Ujian**, serta **Toleransi Keterlambatan**.</li>
                      <li>Aktifkan **Proteksi Anti-Curang** (Peringatan saat siswa pindah tab / keluar layar penuh).</li>
                      <li>Ubah Status Sesi Ujian dari <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">DRAFT</span> menjadi <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">AKTIF</span>.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 5 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 5
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-500" />
                        Rilis Token Ujian Rahasia
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('token')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Token Ujian</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Siswa memerlukan kode token untuk membuka dan memulai lembar soal ujian:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                      <li>Masuk ke menu <strong className="text-amber-700">Token Ujian</strong>.</li>
                      <li>Klik **Rilis / Acak Token Baru** untuk menggenerasi 6 kode rahasia acak (Contoh: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-amber-700 font-bold">{currentToken}</code>).</li>
                      <li>Tuliskan kode token tersebut di papan tulis atau LCD ruang ujian ketika siswa sudah siap.</li>
                      <li>Token dapat diperbarui secara acak jika sesi ujian ingin diatur secara bertahap.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 6 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 6
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-emerald-600" />
                        Pelaksanaan Ujian, Pengunduhan File Jawaban (.CBT) & Upload ke Google Drive
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('rekap')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Live Monitor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Alur pelaksanaan ujian, pengumpulan file jawaban siswa, hingga pengunggahan ke Google Drive:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-700">
                      <li>Buka menu <strong className="text-emerald-700">Rekap & Live Monitor</strong> untuk memantau status pengerjaan siswa secara langsung (login, sisa waktu, dan peringatan pindah tab).</li>
                      <li>Ketika siswa menekan tombol <strong className="text-emerald-700">&quot;Selesai Ujian&quot;</strong>, sistem akan secara otomatis mengunduh **File Jawaban Terenkripsi (.CBT)** ke perangkat/HP siswa.</li>
                      <li>Pada halaman hasil akhir, siswa diminta mengklik tombol <strong className="text-emerald-700">&quot;Upload Hasil Jawaban (Google Drive)&quot;</strong> untuk menuju ke **Link Google Drive / Form** yang telah dikonfigurasi Guru pada menu *Mata Pelajaran*.</li>
                      <li>Siswa mengunggah file `<span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">Jawaban_CBT.cbt</span>` yang telah terunduh ke folder Drive tersebut sebagai berkas bukti resmi pengerjaan.</li>
                      <li>Jika terjadi kendala (misal HP mati atau keluar browser), Guru dapat melakukan **Reset Login Siswa** dari menu *User Siswa & Guru* agar siswa bisa melanjutkan.</li>
                    </ol>
                  </div>
                </div>

                {/* LANGKAH 7 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-purple-600 text-white font-black text-xs px-3 py-1 rounded-xl shadow-xs shrink-0">
                        LANGKAH 7
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-purple-600" />
                        Pengumpulan File .CBT, Dekripsi Nilai, Rekap & Analisis Soal
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('rekap')}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <span>Buka Rekap & Analisis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                    <p className="font-semibold text-slate-800">
                      Pengolahan nilai akhir dan analisis statistik butir soal:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-700">
                      <li>Guru membuka folder Google Drive tempat siswa mengunggah file jawaban <code className="font-mono text-purple-700 font-bold">.CBT</code>.</li>
                      <li>Masuk ke menu <strong className="text-purple-700">Rekapitulasi Nilai</strong> di Portal Guru, lalu klik tombol **&quot;Unggah & Dekripsi (.CBT)&quot;** untuk memuat seluruh file jawaban siswa secara otomatis.</li>
                      <li>Sistem dekripsi akan menghitung skor, persentase kelulusan KKM, serta memperbarui tabel rekapitulasi secara akurat.</li>
                      <li>Unduh **File Rekap Excel (.xlsx)** untuk kearsipan nilai atau cetak **Laporan PDF Resmi** per kelas.</li>
                      <li>Buka tab **Analisis Butir Soal** untuk mengevaluasi Tingkat Kesukaran (Mudah/Sedang/Sukar), Daya Beda, serta Efektivitas Pengecoh tiap butir soal.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Ready Checklist Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-900 text-sm">
                      Sistem CBT Siap Digunakan!
                    </h4>
                    <p className="text-xs text-emerald-700 leading-snug">
                      Apabila Langkah 1 s/d 5 telah dikonfigurasi, ujian siap dilaksanakan oleh siswa.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Cek Status Ujian Sekarang</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 0: MATA PELAJARAN */}
          {activeTab === 'mapel' && (
            <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="p-3 bg-sky-100 text-sky-700 rounded-xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Pengaturan Mata Pelajaran & Header Ujian</h3>
                    <p className="text-xs text-slate-500">
                      Atur nama mata pelajaran, judul header ujian, dan deskripsi materi yang tampil pada aplikasi CBT & file offline
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Pilih Mata Pelajaran
                      </label>
                      <select
                        value={mapelInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMapelInput(val);
                          setMapelTitleInput(`Assessment TKA ${val} SMA`);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        {mapelList.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                        <span>Kode Guru Pengampu (Penanda Multi-Guru)</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">Wajib Unik</span>
                      </label>
                      <input
                        type="text"
                        value={kodeGuruInput}
                        onChange={(e) => setKodeGuruInput(e.target.value.toUpperCase())}
                        placeholder="Contoh: GURU01 / SOS01 / MTH02"
                        className="w-full bg-slate-50 border border-slate-300 text-amber-900 text-sm rounded-xl px-3.5 py-2.5 font-mono font-black focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Kode unik guru pengampu agar bank soal dan siswa tidak tertukar dengan guru lain.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Atau Ketik Nama Kustom Mata Pelajaran
                      </label>
                      <input
                        type="text"
                        value={mapelInput}
                        onChange={(e) => setMapelInput(e.target.value)}
                        placeholder="Contoh: Sosiologi, Geografi, Sejarah..."
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Judul Header Ujian (Exam Title Header)
                      </label>
                      <input
                        type="text"
                        value={mapelTitleInput}
                        onChange={(e) => setMapelTitleInput(e.target.value)}
                        placeholder="Contoh: Assessment TKA Sosiologi SMA 2026"
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Tampil di bagian atas layar ujian & kartu login siswa.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Sub-Judul Topik / Keterangan Materi
                      </label>
                      <input
                        type="text"
                        value={subTitleInput}
                        onChange={(e) => setSubTitleInput(e.target.value)}
                        placeholder="Contoh: Perubahan Sosial & Globalisasi"
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                        <span>Link Upload Google Drive (Hasil Jawaban Siswa)</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black">Terhubung ke Siswa</span>
                      </label>
                      <input
                        type="url"
                        value={driveUploadUrlInput}
                        onChange={(e) => setDriveUploadUrlInput(e.target.value)}
                        placeholder="Contoh: https://drive.google.com/drive/folders/... atau https://forms.gle/..."
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Siswa akan melihat tombol &quot;Upload Hasil Jawaban (Google Drive)&quot; pada halaman akhir setelah ujian selesai untuk mengunggah file hasil (.cbt) mereka.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-red-700 font-extrabold">
                          <Youtube className="w-4 h-4 text-red-600 fill-current" />
                          Link Video YouTube (Panduan Guru)
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black">Khusus Admin</span>
                      </label>
                      <input
                        type="url"
                        value={youtubeGuideUrlInput}
                        onChange={(e) => setYoutubeGuideUrlInput(e.target.value)}
                        placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Video tutorial ini dapat ditonton secara langsung oleh Bapak/Ibu Guru pada menu <strong>Panduan Guru</strong>.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveMapelConfig}
                      className="w-full bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm active:scale-95 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" /> Simpan Pengaturan Mata Pelajaran
                    </button>
                  </div>

                  {/* Live Preview Card & List of Available Mapel */}
                  <div className="space-y-6">
                    {/* Live Preview */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
                      <p className="text-[10px] uppercase font-bold text-sky-400 tracking-wider mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Preview Tampilan Header Siswa
                      </p>
                      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex items-center gap-3">
                        <div className="bg-sky-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-white truncate">
                            {mapelTitleInput || `Assessment TKA ${mapelInput || 'Sosiologi'}`}
                          </h4>
                          <p className="text-xs text-sky-300 font-medium truncate">
                            {subTitleInput || 'Perubahan Sosial & Globalisasi'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                        <span>Mata Pelajaran: <b className="text-white">{mapelInput || 'Sosiologi'}</b></span>
                        <span>Durasi: <b className="text-white">{config.duration} Menit</b></span>
                      </div>
                    </div>

                    {/* Manage Subject Quick Select List */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Daftar Pilihan Mata Pelajaran Tersedia
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mapelList.map((m) => (
                          <div
                            key={m}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                              mapelInput === m
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-sky-300'
                            }`}
                          >
                            <span
                              onClick={() => {
                                setMapelInput(m);
                                setMapelTitleInput(`Assessment TKA ${m} SMA`);
                              }}
                              className="cursor-pointer"
                            >
                              {m}
                            </span>
                            {mapelList.length > 1 && (
                              <button
                                onClick={() => handleDeleteMapelFromList(m)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Hapus dari daftar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Custom Mapel Field */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customMapelToAdd}
                          onChange={(e) => setCustomMapelToAdd(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomMapel();
                            }
                          }}
                          placeholder="+ Tambah Mapel Baru..."
                          className="flex-1 bg-white border border-slate-300 text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                        <button
                          onClick={handleAddCustomMapel}
                          className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1 active:scale-95 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: BANK SOAL */}
          {activeTab === 'bank' && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 max-w-7xl mx-auto w-full">
          {/* Left Sidebar: General Settings & Mapel Selection */}
          <div className="w-full md:w-1/3 space-y-4 shrink-0">
            {/* Card Select Mata Pelajaran Ujian */}
            <div className="bg-sky-900 text-white p-5 rounded-2xl shadow-md border border-sky-800 space-y-3">
              <div className="flex items-center gap-2 text-sky-300">
                <BookOpen className="w-5 h-5 text-sky-400 shrink-0" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">Mata Pelajaran Ujian</h3>
              </div>
              <p className="text-[11px] text-sky-200 leading-snug">
                Pilih mata pelajaran yang aktif digunakan untuk ujian CBT. Pilihan ini disesuaikan dengan menu <b>MATA PELAJARAN</b>.
              </p>
              <div>
                <label className="block text-[10px] uppercase font-bold text-sky-300 mb-1">
                  Pilih Mata Pelajaran Ujian Aktif:
                </label>
                <select
                  value={mapelInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMapelInput(val);
                    setSelectedBankMapel(val);
                    const newTitle = `Assessment TKA ${val} SMA`;
                    setMapelTitleInput(newTitle);
                    onSaveConfig({
                      ...config,
                      mapel: val,
                      mapelTitle: newTitle,
                    });
                    showAlert(`Mata Pelajaran Ujian aktif diubah ke: "${val}"`);
                  }}
                  className="w-full bg-slate-950 border border-sky-500/60 text-white font-bold text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-sky-400 focus:outline-none cursor-pointer"
                >
                  {mapelList.map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white font-semibold">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 border-t border-sky-800/80 flex justify-between items-center text-[11px] text-sky-200 font-medium">
                <span>Mapel Ujian: <b className="text-white">{mapelInput}</b></span>
                <span className="bg-sky-800 text-sky-200 px-2.5 py-0.5 rounded font-bold border border-sky-700/60">
                  {config.questions.filter((q) => q.mapel === mapelInput || (!q.mapel && mapelInput === (config.mapel || 'Sosiologi'))).length} Soal
                </span>
              </div>
            </div>

            {/* Navigasi / Ringkasan Setting Ujian */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-5 rounded-2xl shadow-md text-white space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-white shrink-0" />
                <h3 className="font-bold text-sm">Setting Jadwal & Ketentuan Ujian</h3>
              </div>
              <p className="text-xs text-orange-100 leading-relaxed font-medium">
                Pengaturan umum seperti Durasi Ujian, KKM, Acak Soal, Toleransi Keterlambatan, dan Anti-Kecurangan kini telah digabungkan dalam menu <b>Setting Jadwal Ujian</b>.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className="w-full bg-white text-orange-950 font-black text-xs py-2.5 px-4 rounded-xl hover:bg-orange-50 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Buka Setting Jadwal & Ketentuan Ujian</span>
                <Clock className="w-3.5 h-3.5 text-orange-600" />
              </button>
            </div>

            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-sm text-blue-900 space-y-2">
              <p className="font-bold flex items-center gap-2 text-blue-800">
                <Info className="w-4 h-4 text-blue-600" /> Informasi Penyimpanan Data
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Semua soal dan konfigurasi disimpan di <b>Local Storage</b> browser Anda. Data tidak akan hilang saat halaman direfresh.
              </p>
            </div>

            {/* Reset Questions Option */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-500 mb-3">Butuh mengembalikan 20 Soal HOTS Default Sosiologi?</p>
              <button
                onClick={() =>
                  showConfirm(
                    'Reset Soal Default?',
                    'Apakah Anda yakin ingin mengembalikan bank soal ke 20 soal HOTS default?',
                    onResetDefaultQuestions,
                    true
                  )
                }
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-300"
              >
                <RotateCcw className="w-4 h-4" /> Reset ke Soal Default
              </button>
            </div>
          </div>

          {/* Right Area: Questions Management */}
          <div className="w-full md:w-2/3 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4 gap-4">
              <div>
                <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                  <Database className="w-6 h-6 text-blue-600" /> Bank Soal (
                  <span className="text-blue-600 font-black">{config.questions.length}</span>)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Soal Aktif Digunakan: <b className="text-emerald-600">{config.questions.filter((q) => q.isActive !== false).length}</b> dari {config.questions.length} Total Soal
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleDownloadTemplate}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Template Excel Soal
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Upload Excel Soal
                </button>

                <button
                  onClick={() => onOpenQuestionModal(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Tambah Soal
                </button>

                <button
                  onClick={handleDeleteAllQuestions}
                  className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Semua Soal
                </button>
              </div>
            </div>

            {/* Filter & Selector Bar for Mata Pelajaran, Kompetensi, Bentuk Soal & Kode Guru */}
            <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 mb-3 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders className="w-4 h-4 text-blue-600" /> Filter & Pilih Soal
                </span>
                <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-xs self-start sm:self-auto">
                  Tampil <b className="text-blue-600">{filteredQuestions.length}</b> Soal (dari {config.questions.length} Total)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                {/* 1. Filter Mata Pelajaran */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-sky-600" /> Mata Pelajaran:
                  </label>
                  <select
                    value={selectedBankMapel}
                    onChange={(e) => setSelectedBankMapel(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-800 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Mapel ({config.questions.length})</option>
                    {mapelList.map((m) => {
                      const count = config.questions.filter(
                        (q) => q.mapel === m || (!q.mapel && m === (config.mapel || 'Sosiologi'))
                      ).length;
                      return (
                        <option key={m} value={m}>
                          {m} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Filter Kompetensi / KD */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-600" /> Kompetensi / KD:
                  </label>
                  <select
                    value={selectedBankKompetensi}
                    onChange={(e) => setSelectedBankKompetensi(e.target.value)}
                    className="bg-white border border-amber-300 text-amber-950 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Kompetensi ({availableKompetensis.length})</option>
                    {availableKompetensis.map((k) => {
                      const count = config.questions.filter(
                        (q) => (q.kompetensi || q.subTopik || '') === k
                      ).length;
                      return (
                        <option key={k} value={k}>
                          {k} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 3. Filter Bentuk Soal */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-purple-600" /> Bentuk Soal:
                  </label>
                  <select
                    value={selectedBankBentukSoal}
                    onChange={(e) => setSelectedBankBentukSoal(e.target.value)}
                    className="bg-white border border-purple-300 text-purple-950 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Bentuk Soal</option>
                    {availableBentukSoals.map((b) => {
                      const count = config.questions.filter(
                        (q) => (q.bentukSoal || 'Pilihan Ganda') === b
                      ).length;
                      return (
                        <option key={b} value={b}>
                          {b} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 4. Filter Kode Guru */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" /> Kode Guru:
                  </label>
                  <select
                    value={selectedBankKodeGuru}
                    onChange={(e) => setSelectedBankKodeGuru(e.target.value)}
                    className="bg-white border border-emerald-300 text-emerald-950 font-mono font-bold text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Semua Kode Guru</option>
                    {availableKodeGurus.map((kg) => (
                      <option key={kg} value={kg}>
                        {kg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedBankMapel !== 'ALL' && selectedBankMapel !== config.mapel && (
                <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                  <button
                    onClick={() => {
                      setMapelInput(selectedBankMapel);
                      const newTitle = `Assessment TKA ${selectedBankMapel} SMA`;
                      setMapelTitleInput(newTitle);
                      onSaveConfig({
                        ...config,
                        mapel: selectedBankMapel,
                        mapelTitle: newTitle,
                      });
                      showAlert(`Mata pelajaran "${selectedBankMapel}" diset sebagai mata pelajaran ujian aktif!`);
                    }}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Set "{selectedBankMapel}" Sebagai Mapel Ujian Aktif
                  </button>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan kata kunci pertanyaan, kompetensi, atau bentuk soal..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Batch Controls Bar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={
                      filteredQuestions.length > 0 &&
                      filteredQuestions.every((q) => selectedQuestionIds.includes(q.id))
                    }
                    onChange={handleSelectAllFiltered}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Pilih / Centang Semua ({selectedQuestionIds.length} dicentang)</span>
                </label>
              </div>

              {selectedQuestionIds.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleBatchSetActive(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Aktifkan
                  </button>
                  <button
                    onClick={() => handleBatchSetActive(false)}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Nonaktifkan
                  </button>
                  <button
                    onClick={handleBatchDeleteQuestions}
                    className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Terpilih ({selectedQuestionIds.length})
                  </button>
                </div>
              )}
            </div>

            {/* Question List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {filteredQuestions.length === 0 ? (
                <div className="text-center text-gray-400 py-12 text-sm font-medium">
                  Belum ada soal yang sesuai dengan filter. Silakan ubah filter atau klik Tambah Soal / Upload Excel.
                </div>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isSelected = selectedQuestionIds.includes(q.id);
                  const isActive = q.isActive !== false;
                  const stripTags = q.question.replace(/<[^>]+>/g, '');
                  const previewText =
                    stripTags.length > 110 ? stripTags.substring(0, 110) + '...' : stripTags;

                  return (
                    <div
                      key={q.id}
                      className={`border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:shadow-md ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-300'
                          : isActive
                          ? 'bg-white border-gray-200'
                          : 'bg-slate-100/80 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Checkbox Selection */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectQuestion(q.id)}
                          className="w-5 h-5 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-md">
                              Soal #{idx + 1}
                            </span>
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-sky-200/80">
                              Mapel: {q.mapel || mapelInput || 'Sosiologi'}
                            </span>
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300/80 flex items-center gap-1">
                              <Tag className="w-3 h-3 text-amber-600" /> Komp: {q.kompetensi || q.subTopik || 'Umum'}
                            </span>
                            <span className="bg-purple-100 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-200/80 flex items-center gap-1">
                              <Layers className="w-3 h-3 text-purple-600" /> {q.bentukSoal || 'Pilihan Ganda'}
                            </span>
                            {q.kodeGuru && (
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                Guru: {q.kodeGuru}
                              </span>
                            )}
                            {q.image && (
                              <span className="bg-pink-100 text-pink-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-pink-200/80 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 text-pink-600" /> Gambar/Tabel
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-gray-400">ID: {q.id}</span>

                            {/* Active Toggle Status Badge */}
                            <button
                              onClick={() => handleToggleQuestionActive(q.id)}
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                              }`}
                              title="Klik untuk mengubah status aktif/nonaktif soal untuk ujian"
                            >
                              {isActive ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Digunakan dalam Ujian
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-slate-500" /> Nonaktif
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-sm text-gray-800 font-medium leading-relaxed">{previewText}</p>
                          {q.image && (
                            <div className="mt-2">
                              <img
                                src={q.image}
                                alt="Gambar Soal"
                                className="max-h-24 w-auto object-contain rounded-lg border border-slate-200 bg-slate-50 p-1"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pl-8 sm:pl-0">
                        <button
                          onClick={() => setPreviewQuestion(q)}
                          className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          title="Preview tampilan soal untuk ujian siswa"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button
                          onClick={() => onOpenQuestionModal(q)}
                          className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() =>
                            showConfirm(
                              'Hapus Soal?',
                              'Apakah Anda yakin ingin menghapus soal ini?',
                              () => onDeleteQuestion(q.id),
                              true
                            )
                          }
                          className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAJEMEN USER (SISWA & GURU) */}
      {activeTab === 'students' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* Sub Tab Switcher: Siswa vs Guru */}
          <div className="bg-white p-2 rounded-2xl shadow-xs border border-gray-200 flex gap-2 w-full sm:w-auto self-start">
            <button
              onClick={() => setUserSubTab('student')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                userSubTab === 'student'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" /> Data Siswa ({studentsList.length})
            </button>
            <button
              onClick={() => setUserSubTab('teacher')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                userSubTab === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Data Guru ({teachersList.length})
            </button>
          </div>

          {userSubTab === 'student' ? (
            /* STUDENT MANAGEMENT UI */
            <>
              {/* Action Header Section */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-600" /> Manajemen User & Data Siswa (
                    <span className="text-indigo-600 font-black">{studentsList.length}</span>)
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Kelola daftar siswa yang berhak mengikuti ujian. Siswa dapat login menggunakan <b>NIS</b> dan <b>TOKEN Ujian</b>.
                  </p>
                </div>

                {adminRole !== 'teacher' ? (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleDownloadStudentTemplate}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Template Excel Siswa
                    </button>

                    <button
                      onClick={() => studentFileInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Upload Excel Siswa
                    </button>

                    <button
                      onClick={() => setIsAddStudentModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Tambah Siswa Manual
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Mode Guru / Pendidik: Penambahan & penghapusan akun siswa dikelola oleh Administrator Utama.</span>
                  </div>
                )}
              </div>

              {/* MENU PENETAPAN SISWA AKTIF UJIAN */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-indigo-800 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-800/80 pb-4">
                  <div>
                    <h3 className="font-black text-lg flex items-center gap-2 text-indigo-100">
                      <UserCheck className="w-5 h-5 text-emerald-400" />
                      Menu Pilih Siswa Mengikuti Ujian (Kondisi Aktif Ujian)
                    </h3>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      Pilih siswa berdasarkan <b>Kelas</b> atau <b>Nama Siswa</b>. Hanya siswa yang diset <b>Aktif Ujian</b> yang diizinkan masuk ke portal ujian.
                    </p>
                  </div>

                  {/* Ringkasan Status Badge */}
                  <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-indigo-700/50 shrink-0 text-xs flex-wrap">
                    <div className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Aktif Ujian: <strong>{activeStudentsCount}</strong> Siswa
                    </div>
                    <div className="px-2.5 py-1 bg-slate-800 text-slate-300 font-bold rounded-lg border border-slate-700">
                      Nonaktif: <strong>{inactiveStudentsCount}</strong> Siswa
                    </div>
                    <div className="px-2.5 py-1 bg-indigo-500/20 text-indigo-200 font-bold rounded-lg border border-indigo-500/30">
                      Total: <strong>{studentsList.length}</strong>
                    </div>
                  </div>
                </div>

                {/* Mode Selector & Global Quick Actions */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch justify-between">
                  {/* Mode Tabs */}
                  <div className="flex bg-slate-950/80 p-1 rounded-xl border border-indigo-700/60 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStudentSelectMode('class')}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        studentSelectMode === 'class'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-indigo-300 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-4 h-4" /> Pilih Berdasarkan Kelas
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentSelectMode('individual')}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        studentSelectMode === 'individual'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-indigo-300 hover:text-white'
                      }`}
                    >
                      <Users className="w-4 h-4" /> Pilih Berdasarkan Nama Siswa
                    </button>
                  </div>

                  {/* Global Quick Actions */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <button
                      type="button"
                      onClick={() => handleSetAllStudentsActive(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Aktifkan Semua Siswa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllStudentsActive(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-400" /> Nonaktifkan Semua Siswa
                    </button>
                  </div>
                </div>

                {/* MODE 1: BERDASARKAN KELAS */}
                {studentSelectMode === 'class' && (
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-indigo-800/80 space-y-3">
                    <div className="text-xs font-bold text-indigo-200 flex items-center justify-between">
                      <span>Pilih & Aktifkan Ujian Per Kelas:</span>
                      <span className="text-[11px] text-indigo-300">
                        Klik tombol untuk mengaktifkan seluruh siswa dalam kelas tertentu
                      </span>
                    </div>

                    {uniqueClasses.length === 0 ? (
                      <p className="text-xs text-indigo-300 italic">Belum ada data kelas terdaftar.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {uniqueClasses.map((kelasName) => {
                          const studentsInClass = studentsList.filter((s) => s.kelas === kelasName);
                          const activeInClass = studentsInClass.filter((s) => s.isActive !== false).length;
                          const isAllActive = studentsInClass.length > 0 && activeInClass === studentsInClass.length;

                          return (
                            <div
                              key={kelasName}
                              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                                isAllActive
                                  ? 'bg-emerald-950/40 border-emerald-500/40'
                                  : activeInClass > 0
                                  ? 'bg-amber-950/40 border-amber-500/40'
                                  : 'bg-slate-900/60 border-slate-800'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-black text-sm text-white flex items-center gap-1.5">
                                  <Building2 className="w-4 h-4 text-indigo-400" /> Kelas {kelasName}
                                </span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  isAllActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : activeInClass > 0
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                  {activeInClass} / {studentsInClass.length} Aktif
                                </span>
                              </div>

                              <div className="flex gap-1.5 flex-wrap pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleSetClassActiveStatus(kelasName, true, false)}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded-lg text-[11px] transition text-center cursor-pointer active:scale-95"
                                >
                                  ✓ Aktifkan Kelas
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetClassActiveStatus(kelasName, false, false)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 px-2 rounded-lg text-[11px] transition text-center cursor-pointer border border-slate-700 active:scale-95"
                                >
                                  ✕ Off
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetClassActiveStatus(kelasName, true, true)}
                                  title="Hanya aktifkan siswa di kelas ini, dan nonaktifkan kelas lainnya"
                                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-2 rounded-lg text-[11px] transition text-center cursor-pointer active:scale-95"
                                >
                                  ⚡ Hanya Kelas Ini
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 2: BERDASARKAN NAMA SISWA */}
                {studentSelectMode === 'individual' && (
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-indigo-800/80 space-y-2">
                    <p className="text-xs text-indigo-200">
                      💡 <b>Petunjuk Pemilihan Nama Siswa:</b> Anda dapat mencari nama siswa atau menggunakan filter status di bawah ini, lalu centang siswa tertentu atau klik badge <b>Status Ujian (Aktif / Nonaktif)</b> pada tabel siswa untuk mengubah statusnya secara langsung.
                    </p>
                  </div>
                )}
              </div>

              {/* Table Area */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col space-y-4">
                {/* Table Filters & Batch Operations Bar */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {/* Class Filter Dropdown */}
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-bold text-gray-600 text-[11px]">Kelas:</span>
                      <select
                        value={studentClassFilter}
                        onChange={(e) => setStudentClassFilter(e.target.value)}
                        className="font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="ALL">Semua Kelas ({uniqueClasses.length})</option>
                        {uniqueClasses.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter Dropdown */}
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                      <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-bold text-gray-600 text-[11px]">Status:</span>
                      <select
                        value={studentStatusFilter}
                        onChange={(e) => setStudentStatusFilter(e.target.value as any)}
                        className="font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="ACTIVE">🟢 Hanya Aktif Ujian</option>
                        <option value="INACTIVE">🔴 Hanya Nonaktif</option>
                      </select>
                    </div>

                    {/* Kode Guru Filter Dropdown */}
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-bold text-amber-900 text-[11px]">Kode Guru:</span>
                      <select
                        value={studentKodeGuruFilter}
                        onChange={(e) => setStudentKodeGuruFilter(e.target.value)}
                        className="font-mono font-bold text-amber-900 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="ALL">Semua Kode Guru</option>
                        {availableKodeGurus.map((kg) => (
                          <option key={kg} value={kg}>
                            {kg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Cari NIS / Nama Siswa / Kelas..."
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Batch Action Toolbar when rows are checked */}
                {selectedStudentIds.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                      <strong>{selectedStudentIds.length}</strong> siswa dicentang:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <button
                        type="button"
                        onClick={() => handleBatchSetStudentActive(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Set Aktif Ujian
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchSetStudentActive(false)}
                        className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Set Nonaktif
                      </button>
                      {adminRole !== 'teacher' && (
                        <button
                          type="button"
                          onClick={handleBatchDeleteStudents}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus Terpilih
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedStudentIds([])}
                        className="text-gray-500 hover:text-gray-800 text-[11px] font-semibold px-2 py-1 underline cursor-pointer"
                      >
                        Batal Pilihan
                      </button>
                    </div>
                  </div>
                )}

                {/* Table Container */}
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredStudents.length > 0 &&
                              selectedStudentIds.length === filteredStudents.length
                            }
                            onChange={() => handleToggleSelectAllStudents(filteredStudents)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                            title="Centang Semua"
                          />
                        </th>
                        <th className="p-3 w-12">No</th>
                        <th className="p-3">NIS / No. Peserta</th>
                        <th className="p-3">Nama Lengkap Siswa</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3 text-center">Kode Guru</th>
                        <th className="p-3 text-center">Status Ujian</th>
                        {adminRole !== 'teacher' && <th className="p-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={adminRole !== 'teacher' ? 8 : 7} className="p-8 text-center text-gray-400 font-medium">
                            Tidak ada data siswa yang cocok dengan filter.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s, idx) => {
                          const isSelected = selectedStudentIds.includes(s.id);
                          const isActive = s.isActive !== false;

                          return (
                            <tr
                              key={s.id}
                              className={`hover:bg-slate-50 transition-colors ${
                                !isActive ? 'bg-slate-50/60 opacity-80' : ''
                              }`}
                            >
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectOneStudent(s.id)}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                                />
                              </td>
                              <td className="p-3 font-medium text-gray-400">{idx + 1}</td>
                              <td className="p-3 font-mono font-bold text-slate-800">{s.nis}</td>
                              <td className="p-3 font-bold text-gray-900">{s.nama}</td>
                              <td className="p-3">
                                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-indigo-100">
                                  {s.kelas}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="bg-amber-50 text-amber-800 font-mono px-2 py-0.5 rounded text-[11px] font-bold border border-amber-200">
                                  {s.kodeGuru || config.kodeGuru || 'GURU01'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStudentActive(s.id)}
                                  className={`px-3 py-1 rounded-full text-[11px] font-black border transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                                  }`}
                                  title="Klik untuk mengubah status aktif/nonaktif ujian"
                                >
                                  {isActive ? (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                      🟢 Aktif Ujian
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                      🔴 Nonaktif
                                    </>
                                  )}
                                </button>
                              </td>
                              {adminRole !== 'teacher' && (
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteStudent(s.id, s.nama)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus Siswa"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* TEACHER MANAGEMENT UI */
            <>
              {/* Action Header Section */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-indigo-600" /> Manajemen User & Data Guru (
                    <span className="text-indigo-600 font-black">{teachersList.length}</span>)
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Kelola daftar guru pengampu. Guru dapat login menggunakan <b>Username</b> sebagai akun akses.
                  </p>
                </div>

                {adminRole !== 'teacher' ? (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleDownloadTeacherTemplate}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Template Excel Guru
                    </button>

                    <button
                      onClick={() => teacherFileInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Upload Excel Guru
                    </button>

                    <button
                      onClick={() => setIsAddTeacherModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" /> Tambah Guru Manual
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Mode Guru / Pendidik: Penambahan & penghapusan akun guru dikelola oleh Administrator Utama.</span>
                  </div>
                )}
              </div>

              {/* Table Area */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-base text-gray-800">Daftar Guru Terdaftar</h3>
                  <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder="Cari Username / Nama / Mapel..."
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="p-3">No</th>
                        <th className="p-3">Username</th>
                        <th className="p-3">Nama Lengkap Guru</th>
                        <th className="p-3">Mata Pelajaran</th>
                        <th className="p-3 text-center">Kode Guru</th>
                        {adminRole !== 'teacher' && <th className="p-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={adminRole !== 'teacher' ? 6 : 5} className="p-8 text-center text-gray-400 font-medium">
                            Belum ada data guru terdaftar.
                          </td>
                        </tr>
                      ) : (
                        filteredTeachers.map((t, idx) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-medium text-gray-400">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-slate-800">{t.nip}</td>
                            <td className="p-3 font-bold text-gray-900">{t.nama}</td>
                            <td className="p-3">
                              <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-indigo-100">
                                {t.mapel}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="bg-amber-50 text-amber-800 font-mono px-2 py-0.5 rounded text-[11px] font-bold border border-amber-200">
                                {t.kodeGuru || 'GURU01'}
                              </span>
                            </td>
                            {adminRole !== 'teacher' && (
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteTeacher(t.id, t.nama)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Guru"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: TOKEN UJIAN */}
      {activeTab === 'token' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full flex flex-col justify-center">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Banner */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/20">
                <Key className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-black">Pengaturan TOKEN Ujian CBT</h2>
              <p className="text-amber-100 text-xs mt-1 font-medium">
                Siswa hanya dapat masuk ke portal ujian jika menggunakan TOKEN yang aktif di bawah ini.
              </p>
            </div>

            {/* Token Control Body */}
            <div className="p-8 space-y-8">
              {/* Display Big Token Box */}
              <div className="bg-slate-900 text-white p-8 rounded-3xl text-center shadow-lg border border-slate-800 relative">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                  TOKEN UJIAN AKTIF SAAT INI
                </p>
                <div className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-amber-400 my-2 select-all">
                  {currentToken}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Berikan token ini kepada siswa saat ujian akan dimulai.
                </p>

                <button
                  onClick={handleCopyToken}
                  className="mt-4 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs transition-all border border-slate-700 cursor-pointer"
                >
                  {isCopiedToken ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" /> Token Berhasil Disalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Salin Token Ujian
                    </>
                  )}
                </button>
              </div>

              {/* Edit or Generate Form */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" /> Buat / Ubah Token Ujian
                </h3>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">
                    Ketik Token kustom atau klik Generate Token Acak
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentToken}
                      onChange={(e) => setCurrentToken(e.target.value.toUpperCase())}
                      maxLength={10}
                      placeholder="Misal: SOS2026"
                      className="flex-1 border-2 border-gray-200 rounded-xl p-3 text-base font-mono font-bold uppercase tracking-wider focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRandomToken}
                      className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-bold px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Generate 6 Karakter Acak"
                    >
                      <RefreshCw className="w-4 h-4" /> Acak Token
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveToken}
                  className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-md active:scale-95 text-sm cursor-pointer"
                >
                  Simpan Token Ujian Baru
                </button>
              </div>

              {/* Info Note */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 leading-relaxed flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Keamanan Token Ujian:</p>
                  <p className="mt-0.5">
                    Token ini bertindak sebagai kata sandi sesi ujian. Anda dapat mengganti token baru setiap pergantian jam ujian atau pergantian sesi kelas untuk mencegah siswa lain masuk di luar jam yang ditentukan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP & SECURITY DATA */}
      {activeTab === 'backup' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 p-8 text-white relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-3 shadow-inner border border-white/20">
                <FolderArchive className="w-8 h-8 text-purple-200" />
              </div>
              <h2 className="text-2xl font-black">Backup & Security Data Aplikasi CBT GURUAI</h2>
              <p className="text-purple-200 text-xs mt-1 font-medium">
                Sistem keamanan tingkat lanjut untuk mencadangkan seluruh bank soal, data siswa & guru, pengaturan, dan rekap nilai ke perangkat lokal Anda.
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* Card 1: Backup JSON */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                    <FolderArchive className="w-4 h-4 text-purple-700" /> Unduh Backup Seluruh Data Aplikasi (JSON)
                  </h3>
                  <p className="text-xs text-purple-800 leading-relaxed">
                    Menyimpan file cadangan (.json) berisi seluruh bank soal, konfigurasi ujian, data siswa, data guru, serta rekapitulasi nilai siswa. Sangat disarankan untuk diunduh secara berkala.
                  </p>
                </div>
                <button
                  onClick={triggerBackupAppDataWithAnimation}
                  className="bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Backup (.json)
                </button>
              </div>

              {/* Card 2: Restore JSON */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Pulihkan Data (Restore) Dari File Backup
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mengembalikan seluruh data aplikasi (bank soal & siswa/guru) dari file backup (.json) yang sebelumnya pernah diunduh.
                  </p>
                </div>
                <button
                  onClick={() => backupFileInputRef.current?.click()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" /> Pilih File Backup (.json)
                </button>
              </div>

              {/* Card 3: Kop Surat & Signature Configuration */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-sky-950 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-700" /> Pengaturan Kop Surat Sekolah & Tanda Tangan Guru
                  </h3>
                  <p className="text-xs text-sky-800 leading-relaxed">
                    Atur nama sekolah, dinas pendidikan, alamat, kota, nama guru, NIP, serta nama kepala sekolah yang akan tercetak resmi di Laporan PDF & Excel.
                  </p>
                </div>
                <button
                  onClick={() => setIsKopModalOpen(true)}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Atur Kop & TTD
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 leading-relaxed flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <b>Keamanan & Privasi Guru:</b> Seluruh data Anda disimpan secara aman di browser lokal Anda dan dapat dicadangkan kapan saja tanpa risiko kehilangan data ujian.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB SCHEDULE: SETTING JADWAL & KETENTUAN UJIAN */}
      {activeTab === 'schedule' && (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-3 bg-orange-100 text-orange-700 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-800">
                  Pengaturan Jadwal, Sesi & Anti-Kecurangan Ujian
                </h3>
                <p className="text-xs text-slate-500">
                  Atur periode pelaksanaan ujian, status akses siswa, batas toleransi keterlambatan, dan kebijakan anti-kecurangan ketat.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Status Sesi Ujian Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  Status Akses Sesi Ujian saat ini
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionStatus('ACTIVE')}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                      sessionStatus === 'ACTIVE'
                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-md font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${sessionStatus === 'ACTIVE' ? 'border-white bg-white text-emerald-600' : 'border-slate-300'}`}>
                      {sessionStatus === 'ACTIVE' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black">🟢 ACTIVE (Buka Ujian)</div>
                      <div className="text-[10px] opacity-80 font-medium">Siswa diizinkan masuk & mengerjakan</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSessionStatus('DRAFT')}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                      sessionStatus === 'DRAFT'
                        ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-md font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${sessionStatus === 'DRAFT' ? 'border-slate-900 bg-slate-900 text-amber-500' : 'border-slate-300'}`}>
                      {sessionStatus === 'DRAFT' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black">🟡 DRAFT (Persiapan)</div>
                      <div className="text-[10px] opacity-80 font-medium">Ujian dikunci, siswa menunggu guru</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSessionStatus('CLOSED')}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                      sessionStatus === 'CLOSED'
                        ? 'bg-red-600 border-red-700 text-white shadow-md font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-red-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${sessionStatus === 'CLOSED' ? 'border-white bg-white text-red-600' : 'border-slate-300'}`}>
                      {sessionStatus === 'CLOSED' && <div className="w-2 h-2 rounded-full bg-red-600" />}
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-black">🔴 CLOSED (Ditutup)</div>
                      <div className="text-[10px] opacity-80 font-medium">Ujian telah berakhir, tidak dapat diakses</div>
                    </div>
                  </button>
                </div>

                {/* Tombol Darurat Force Stop Real-time (Point 1 - Opsi A) */}
                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-red-50 p-4 rounded-2xl border-2 border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-md shrink-0">
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-red-900 uppercase tracking-wider">
                        Kendali Pengawas Real-Time (Point 1 - Opsi A)
                      </h5>
                      <p className="text-[11px] text-red-700 font-medium">
                        Hentikan paksa seluruh ujian online peserta secara langsung saat ini juga. Jawaban dikirim otomatis.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleForceStopExamRealtime}
                    className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black px-5 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                  >
                    🚨 HENTIKAN SELURUH UJIAN SEKARANG (FORCE STOP)
                  </button>
                </div>
              </div>

              {/* PUSAT BROADCAST PERINGATAN PROKTOR REAL-TIME (Point 2) */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 border-2 border-amber-400 p-6 rounded-3xl space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-lg shadow-amber-200 shrink-0">
                      <Megaphone className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-300">
                          Real-Time Broadcast
                        </span>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">Terhubung Live</span>
                      </div>
                      <h4 className="font-extrabold text-base sm:text-lg text-slate-900 mt-0.5">
                        Pusat Broadcast & Peringatan Proktor ke Peserta Ujian (Point 2)
                      </h4>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Kirimkan pesan teguran, instruksi waktu, atau peringatan resmi dari Proktor secara langsung ke layar ujian peserta saat ujian berlangsung. Pesan akan muncul dalam bentuk <b>pop-up modal peringatan bersuara</b> di device siswa.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Target Selection */}
                  <div className="md:col-span-1 bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-600" /> Target Penerima Pesan
                    </label>
                    <select
                      value={broadcastTargetNis}
                      onChange={(e) => setBroadcastTargetNis(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">📢 SEMUA PESERTA UJIAN (Broadcast General)</option>
                      {config.students.map((s) => (
                        <option key={s.id || s.nis} value={s.nis}>
                          👤 {s.nama} ({s.kelas} - NIS: {s.nis})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500">
                      Pilih <b>Semua Peserta</b> atau pilih <b>Siswa Spesifik</b> yang ingin diberikan teguran.
                    </p>
                  </div>

                  {/* Custom Message Input */}
                  <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-amber-600" /> Isi Pesan / Teguran Proktor
                    </label>
                    <textarea
                      rows={2}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Tuliskan pesan peringatan di sini atau klik salah satu tombol template cepat di bawah..."
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                    />

                    {/* Quick Template Buttons (Point 2) */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        ⚡ Templat Pesan Peringatan Cepat:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendBroadcastWarning("🚨 Harap tenang dan tetap fokus pada layar ujian masing-masing!")}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-300 transition cursor-pointer active:scale-95"
                        >
                          🚨 FOKUS LAYAR UJIAN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendBroadcastWarning("⏰ Waktu ujian tersisa 10 menit lagi! Harap periksa kembali jawaban Anda.")}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-blue-300 transition cursor-pointer active:scale-95"
                        >
                          ⏰ SISA WAKTU 10 MENIT
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendBroadcastWarning("⚠️ Peringatan Proktor: Dilarang keras berpindah tab atau mengecilkan browser!")}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-rose-300 transition cursor-pointer active:scale-95"
                        >
                          ⚠️ PERINGATAN DILARANG SWITCH TAB
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendBroadcastWarning("📢 Perhatian: Sesi ujian akan dihentikan oleh pengawas dalam 2 menit lagi!")}
                          className="bg-orange-100 hover:bg-orange-200 text-orange-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-orange-300 transition cursor-pointer active:scale-95"
                        >
                          📢 UJIAN SEGERA DIHENTIKAN
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendBroadcastWarning("🚫 Peringatan Terakhir: Sisa 1x lagi pelanggaran Anda akan otomatis ter-submit diskualifikasi!")}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-purple-300 transition cursor-pointer active:scale-95"
                        >
                          🚫 PERINGATAN TERAKHIR (ULTIMATUM)
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleSendBroadcastWarning()}
                        className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Send className="w-4 h-4" /> Kirim Pesan Real-Time ke Peserta
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Tanggal & Jam Pelaksanaan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-600" /> Tanggal & Waktu Mulai Ujian
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Kosongkan jika ujian dapat langsung dimulai tanpa batasan jam</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-600" /> Tanggal & Waktu Selesai Ujian
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleEndTime}
                    onChange={(e) => setScheduleEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Siswa tidak dapat memulai ujian jika melebihi waktu ini</p>
                </div>
              </div>

              {/* Durasi, KKM & Toleransi Keterlambatan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Durasi Pengerjaan Ujian (Menit)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={durationInput}
                    onChange={(e) => setDurationInput(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    KKM (Nilai Lulus Minimal 0-100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={kkmInput}
                    onChange={(e) => setKkmInput(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Toleransi Keterlambatan (Menit)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={lateTolerance}
                    onChange={(e) => setLateTolerance(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Jumlah Soal Tampil & Percobaan (Max Attempts) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Jumlah Soal Dikeluarkan Per Siswa
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={maxQuestionsInput}
                    onChange={(e) => setMaxQuestionsInput(Number(e.target.value) || 0)}
                    placeholder="0 = Gunakan Semua Soal Aktif"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Isi <b>0</b> untuk mengeluarkan semua soal aktif.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Batas Percobaan Ujian (Max Attempts)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxAttemptsInput}
                    onChange={(e) => setMaxAttemptsInput(Number(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-xl p-3 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Berapa kali siswa dapat mengulang ujian.
                  </p>
                </div>
              </div>

              {/* Ringkasan Bank Soal & Status Soal */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Ringkasan Ketersediaan Bank Soal Saat Ini
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">Total di Bank Soal:</span>
                    <span className="font-black text-slate-900">{config.questions.length} Soal</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">Status Soal Aktif:</span>
                    <span className="font-black text-emerald-700">
                      {config.questions.filter((q) => q.isActive !== false).length} Soal
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">Disajikan di Ujian:</span>
                    <span className="font-black text-blue-700">
                      {(() => {
                        const activeCount = config.questions.filter((q) => q.isActive !== false).length;
                        if (maxQuestionsInput <= 0 || maxQuestionsInput >= activeCount) {
                          return `${activeCount} Soal (Semua)`;
                        }
                        return `${maxQuestionsInput} Soal (Diacak)`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Anti-Kecurangan & Ketentuan Ujian */}
              <div className="bg-orange-50/60 border border-orange-200 p-5 rounded-2xl space-y-4">
                <h4 className="font-bold text-sm text-orange-950 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-orange-600" /> Kebijakan Keamanan & Anti-Kecurangan Ketat
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-orange-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">Acak Urutan Soal Siswa</span>
                    <input
                      type="checkbox"
                      checked={randomizeQuestionsInput}
                      onChange={(e) => setRandomizeQuestionsInput(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-orange-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">Acak Urutan Pilihan Jawaban (A-E)</span>
                    <input
                      type="checkbox"
                      checked={randomizeOptionsInput}
                      onChange={(e) => setRandomizeOptionsInput(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-orange-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">Tampilkan Nilai Langsung setelah Submit</span>
                    <input
                      type="checkbox"
                      checked={showScoreImmediately}
                      onChange={(e) => setShowScoreImmediately(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-orange-200 cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">Mode Proteksi Fullscreen & Switch Tab</span>
                    <input
                      type="checkbox"
                      checked={strictAntiCheating}
                      onChange={(e) => setStrictAntiCheating(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Batas Maksimal Pelanggaran Sebelum Auto-Submit Penuh
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={maxCheatingAllowed}
                      onChange={(e) => setMaxCheatingAllowed(Number(e.target.value))}
                      className="w-32 bg-white border border-orange-300 text-slate-800 text-sm rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <span className="text-xs text-orange-900 font-medium">
                      Kali peringatan (default: 3x violation sebelum dihentikan paksa).
                    </span>
                  </div>
                </div>

                {/* Audio Peringatan MP3 Box */}
                <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 space-y-3 mt-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-amber-700 animate-pulse" />
                      <h4 className="font-extrabold text-sm text-amber-950 uppercase tracking-wider">
                        Audio Peringatan Kecurangan Siswa (Format MP3)
                      </h4>
                    </div>
                    <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-300 cursor-pointer shadow-2xs self-start sm:self-auto">
                      <span className="text-xs font-bold text-slate-800">Aktifkan Suara Audio</span>
                      <input
                        type="checkbox"
                        checked={enableWarningAudio}
                        onChange={(e) => setEnableWarningAudio(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </label>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Sistem akan memutar secara otomatis <b>Audio Alarm MP3 Peringatan Kecurangan</b>, Sirine dual-tone, dan Pengumuman Suara saat siswa kedapatan berpindah tab, keluar mode fullscreen, menekan shortcut keyboard, atau merekam layar.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center pt-1">
                    <button
                      type="button"
                      onClick={handleTestWarningAudio}
                      className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer shrink-0"
                    >
                      <Volume2 className="w-4 h-4" /> Uji Coba Suara Audio MP3
                    </button>

                    <div className="flex-1 flex gap-2 items-center">
                      <input
                        type="text"
                        value={customWarningAudioUrl}
                        onChange={(e) => setCustomWarningAudioUrl(e.target.value)}
                        placeholder="Default (/warning-alarm.mp3) atau masukkan URL MP3 kustom..."
                        className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <label className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-400 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer transition flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" /> Upload File MP3
                        <input
                          type="file"
                          accept="audio/mp3,audio/*"
                          onChange={handleFileUploadMP3}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveExamSchedule}
                  className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition-all shadow-lg hover:shadow-xl flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle className="w-5 h-5" /> Simpan Jadwal & Ketentuan Sesi Ujian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REKAP JAWABAN (.CBT) & LAPORAN */}
      {activeTab === 'rekap' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* Action Header & Upload Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" /> Rekapitulasi & Laporan Nilai Ujian Siswa
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Upload file .cbt siswa, cetak Laporan Resmi PDF lengkap dengan Kop Sekolah & Tanda Tangan Guru + NIP.
              </p>
            </div>

            <div className="flex gap-2.5 flex-wrap">
              <button
                onClick={() => setIsKopModalOpen(true)}
                className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Pengaturan Kop Surat Sekolah dan NIP / Nama Guru"
              >
                <Building2 className="w-4 h-4 text-sky-600" /> Kop & TTD Guru
              </button>

              <button
                onClick={() => {
                  if (studentResults.length === 0) {
                    showAlert('Belum ada data rekap nilai siswa yang didekripsi!');
                    return;
                  }
                  generateResultsPdfReport(
                    studentResults,
                    config.kopSekolah || defaultKopSekolah,
                    {
                      mapel: config.mapel || 'Sosiologi',
                      mapelTitle: config.mapelTitle || 'Assessment TKA SMA',
                      kkm: config.kkm,
                      totalQuestions: config.questions.length,
                    }
                  );
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Laporan PDF (Kop & TTD)
              </button>

              <button
                onClick={handleExportRekapToExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Excel Laporan
              </button>

              <button
                onClick={() => cbtFileInputRef.current?.click()}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-400" /> Upload File .CBT Siswa
              </button>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processCbtFilesList(e.dataTransfer.files);
              }
            }}
            onClick={() => cbtFileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 p-6 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">
                Tarik & Lepaskan (Drag & Drop) File <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg font-mono">.CBT</span> Siswa di Sini
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Atau klik area ini untuk memilih sekaligus banyak file hasil jawaban siswa dari komputer/HP Anda.
              </p>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Total Siswa Ujian</div>
                <div className="text-2xl font-black text-gray-800">{studentResults.length}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Rata-Rata Nilai</div>
                <div className="text-2xl font-black text-gray-800">{averageScore}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Lulus (≥ KKM)</div>
                <div className="text-2xl font-black text-emerald-600">{passedCount}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Tidak Lulus</div>
                <div className="text-2xl font-black text-red-500">
                  {studentResults.length - passedCount}
                </div>
              </div>
            </div>
          </div>

          {/* ANIMATED LEADERBOARD PODIUM SECTION */}
          {studentResults.length > 0 && (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shadow-inner">
                    <Trophy className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-white flex items-center gap-2">
                      LEADERBOARD TERTINGGI SISWA 🏆
                    </h3>
                    <p className="text-xs text-indigo-200">
                      Peringkat teratas berdasarkan Perolehan Nilai Terbaik, Tingkat Kebenaran, dan Kejujuran Siswa
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLeaderboardPodium(!showLeaderboardPodium)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-indigo-200 transition-all border border-white/10 cursor-pointer"
                >
                  {showLeaderboardPodium ? 'Sembunyikan Visual Podium' : 'Tampilkan Visual Podium'}
                </button>
              </div>

              {showLeaderboardPodium && (
                <div className="pt-4 pb-2 relative z-10">
                  {/* PODIUM DISPLAY (Silver #2 | Gold #1 | Bronze #3) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
                    {/* RANK #2 - SILVER PODIUM */}
                    <div className="order-2 md:order-1 flex flex-col items-center">
                      {[...studentResults].sort((a,b) => b.score - a.score)[1] ? (
                        <div className="w-full bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-400/40 rounded-2xl p-4 text-center shadow-lg relative group hover:border-slate-300 transition-all">
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-900 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                            <Medal className="w-3 h-3 text-slate-700" /> Juara 2
                          </div>
                          <div className="mt-3 text-3xl font-black text-slate-300 font-mono">
                            {[...studentResults].sort((a,b) => b.score - a.score)[1].score}
                          </div>
                          <div className="text-xs font-bold text-white truncate mt-1">
                            {[...studentResults].sort((a,b) => b.score - a.score)[1].studentInfo.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            NIS: {[...studentResults].sort((a,b) => b.score - a.score)[1].studentInfo.noPeserta}
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-center items-center gap-2 text-[10px] text-emerald-400">
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[1].correctCount} Benar</span> • 
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[1].warnings || 0} Pelanggaran</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-600">
                          Belum ada data Juara 2
                        </div>
                      )}
                      <div className="w-full h-16 bg-gradient-to-t from-slate-800 to-slate-700/60 rounded-t-xl mt-2 flex items-center justify-center font-black text-2xl text-slate-400 border-t border-slate-500/30">
                        2
                      </div>
                    </div>

                    {/* RANK #1 - GOLD PODIUM (ELEVATED) */}
                    <div className="order-1 md:order-2 flex flex-col items-center">
                      {[...studentResults].sort((a,b) => b.score - a.score)[0] ? (
                        <div className="w-full bg-gradient-to-b from-amber-900/80 via-amber-950 to-slate-900 border-2 border-amber-400/80 rounded-2xl p-5 text-center shadow-2xl relative group hover:scale-105 transition-all">
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 ring-4 ring-amber-500/20 animate-pulse">
                            <Crown className="w-4 h-4 text-slate-950" /> JUARA 1 UTAMA
                          </div>
                          <div className="mt-3 text-4xl font-black text-amber-300 font-mono drop-shadow-md">
                            {[...studentResults].sort((a,b) => b.score - a.score)[0].score}
                          </div>
                          <div className="text-sm font-black text-white truncate mt-1">
                            {[...studentResults].sort((a,b) => b.score - a.score)[0].studentInfo.name}
                          </div>
                          <div className="text-[11px] text-amber-200/80 font-mono">
                            NIS: {[...studentResults].sort((a,b) => b.score - a.score)[0].studentInfo.noPeserta}
                          </div>
                          <div className="mt-3 pt-2 border-t border-amber-500/30 flex justify-center items-center gap-2 text-xs font-bold text-amber-300">
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[0].correctCount} Benar</span> • 
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[0].warnings || 0} Pelanggaran</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-600">
                          Belum ada data Juara 1
                        </div>
                      )}
                      <div className="w-full h-24 bg-gradient-to-t from-amber-700/80 to-amber-500/60 rounded-t-xl mt-2 flex items-center justify-center font-black text-3xl text-amber-200 border-t border-amber-400/50 shadow-lg">
                        1
                      </div>
                    </div>

                    {/* RANK #3 - BRONZE PODIUM */}
                    <div className="order-3 flex flex-col items-center">
                      {[...studentResults].sort((a,b) => b.score - a.score)[2] ? (
                        <div className="w-full bg-gradient-to-b from-amber-950/60 to-slate-900 border-2 border-amber-700/50 rounded-2xl p-4 text-center shadow-lg relative group hover:border-amber-600 transition-all">
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-800 text-amber-100 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                            <Medal className="w-3 h-3 text-amber-300" /> Juara 3
                          </div>
                          <div className="mt-3 text-3xl font-black text-amber-400 font-mono">
                            {[...studentResults].sort((a,b) => b.score - a.score)[2].score}
                          </div>
                          <div className="text-xs font-bold text-white truncate mt-1">
                            {[...studentResults].sort((a,b) => b.score - a.score)[2].studentInfo.name}
                          </div>
                          <div className="text-[10px] text-amber-200/60 font-mono">
                            NIS: {[...studentResults].sort((a,b) => b.score - a.score)[2].studentInfo.noPeserta}
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-center items-center gap-2 text-[10px] text-emerald-400">
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[2].correctCount} Benar</span> • 
                            <span>{[...studentResults].sort((a,b) => b.score - a.score)[2].warnings || 0} Pelanggaran</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-600">
                          Belum ada data Juara 3
                        </div>
                      )}
                      <div className="w-full h-12 bg-gradient-to-t from-amber-900/80 to-amber-800/50 rounded-t-xl mt-2 flex items-center justify-center font-black text-xl text-amber-400 border-t border-amber-700/30">
                        3
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student Results Table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-800">Daftar Hasil Jawaban Siswa</h3>
                <p className="text-xs text-slate-500">
                  Total {studentResults.length} hasil jawaban ({selectedResultIds.length} dicentang)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Kode Guru Filter Dropdown */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-amber-200 text-xs">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold text-amber-900 text-[11px]">Kode Guru:</span>
                  <select
                    value={rekapKodeGuruFilter}
                    onChange={(e) => setRekapKodeGuruFilter(e.target.value)}
                    className="font-mono font-bold text-amber-900 focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="ALL">Semua Kode Guru</option>
                    {availableKodeGurus.map((kg) => (
                      <option key={kg} value={kg}>
                        {kg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={rekapSearch}
                    onChange={(e) => setRekapSearch(e.target.value)}
                    placeholder="Cari Nama / No Peserta..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-slate-50/50"
                  />
                </div>

                {/* Bulk Action Buttons */}
                {selectedResultIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedStudentResults}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Siswa Terpilih ({selectedResultIds.length})</span>
                  </button>
                )}

                {studentResults.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAllStudentResults}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    title="Hapus seluruh hasil ujian semua siswa"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Semua Hasil</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredStudentResults.length > 0 &&
                          filteredStudentResults.every((r) => selectedResultIds.includes(r.id))
                        }
                        onChange={() => handleSelectAllResults(filteredStudentResults)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Pilih / Centang Semua"
                      />
                    </th>
                    <th className="p-3">No. Peserta</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3 text-center">Kode Guru</th>
                    <th className="p-3">Skor Nilai</th>
                    <th className="p-3">Benar / Salah</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Pelanggaran</th>
                    <th className="p-3">Waktu Selesai</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredStudentResults.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-400 font-medium">
                        Belum ada file jawaban siswa (.cbt) yang didekripsi. Klik button <b>Upload File .CBT Siswa</b> di atas untuk merekap jawaban.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentResults.map((r) => {
                      const isSelected = selectedResultIds.includes(r.id);
                      return (
                        <tr
                          key={r.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectResultId(r.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono font-bold text-gray-700">{r.studentInfo.noPeserta}</td>
                          <td className="p-3 font-bold text-gray-900">{r.studentInfo.name}</td>
                          <td className="p-3 text-center">
                            <span className="bg-amber-50 text-amber-800 font-mono px-2 py-0.5 rounded text-[11px] font-bold border border-amber-200">
                              {r.studentInfo.kodeGuru || config.kodeGuru || 'GURU01'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-black text-base ${
                                r.isPassed ? 'text-blue-600' : 'text-red-500'
                              }`}
                            >
                              {r.score}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">
                            <span className="text-emerald-600 font-bold">{r.correctCount}</span> /{' '}
                            <span className="text-red-500 font-bold">{r.incorrectCount}</span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                r.isPassed
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}
                            >
                              {r.isPassed ? 'LULUS' : 'TIDAK LULUS'}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAuditResult(r);
                                setIsAuditModalOpen(true);
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                r.warnings > 0
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 shadow-2xs'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="Klik untuk Audit Detail Keamanan, IP Address, Perangkat & Timeline Kecurangan"
                            >
                              <ShieldAlert className={`w-3.5 h-3.5 ${r.warnings > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                              <span>{r.warnings > 0 ? `${r.warnings}x Pelanggaran` : '0 (Bersih)'}</span>
                            </button>
                          </td>
                          <td className="p-3 text-gray-500 text-[11px]">{r.submittedAt}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => generateIndividualStudentPdf(r, config.kopSekolah || defaultKopSekolah, config.questions)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Cetak Lembar Laporan Hasil Jawaban Individual Siswa (PDF)"
                              >
                                <FileText className="w-3 h-3 text-red-600" /> PDF Siswa
                              </button>
                              <button
                                onClick={() => handleDeleteStudentResult(r.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Rekap"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ANALISIS BUTIR SOAL */}
      {activeTab === 'analisis' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* Action Header & Export Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-teal-600" /> Analisis Butir Soal (Item Analysis)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Evaluasi Kuantitatif Tingkat Kesukaran (P), Daya Beda (D), & Sebaran Jawaban Siswa (Distraktor Opsi A, B, C, D, E) untuk Penjaminan Mutu Soal.
              </p>
            </div>

            <div className="flex gap-2.5 flex-wrap">
              <button
                onClick={() => setIsKopModalOpen(true)}
                className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Pengaturan Kop Surat Sekolah & TTD Guru"
              >
                <Building2 className="w-4 h-4 text-sky-600" /> Kop & TTD Guru
              </button>

              <button
                onClick={handleExportAnalisisToPdf}
                className="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak PDF Analisis
              </button>

              <button
                onClick={handleExportAnalisisToExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Excel Analisis
              </button>

              <button
                onClick={() => cbtFileInputRef.current?.click()}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Upload file hasil jawaban siswa (.cbt) untuk bahan Analisis"
              >
                <Upload className="w-4 h-4 text-emerald-400" /> Upload File .CBT Siswa
              </button>
            </div>
          </div>

          {/* Informative Guidance Card for Item Analysis Methodology & Parameters */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-md border border-slate-800 space-y-4">
            <div className="flex items-start gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  Panduan & Parameter Utama Analisis Butir Soal (Item Analysis)
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Analisis butir soal adalah kegiatan mengkaji setiap pertanyaan ujian untuk mengukur kualitasnya, yang terdiri dari tiga aspek utama: <strong className="text-teal-300">tingkat kesukaran</strong>, <strong className="text-teal-300">daya pembeda</strong>, dan <strong className="text-teal-300">efektivitas pengecoh (distraktor)</strong>. Proses ini bertujuan untuk menentukan apakah sebuah soal layak dipakai, diperbaiki, atau dibuang.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
              {/* Parameter 1: Tingkat Kesukaran */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-teal-400 flex items-center gap-1.5 text-xs">
                    <BarChart2 className="w-4 h-4" /> Tingkat Kesukaran (P)
                  </span>
                  <span className="text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-md font-bold">
                    Rentang: 0.00 – 1.00
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Mengukur seberapa mudah atau sulit sebuah soal bagi seluruh siswa peserta ujian.
                </p>
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-sky-300 font-bold">0.30 – 0.70</span>
                    <span className="bg-sky-950 text-sky-300 font-extrabold text-[10px] px-2 py-0.5 rounded border border-sky-800">Kategori Ideal / Sedang</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-emerald-300 font-bold">&gt; 0.70</span>
                    <span className="bg-emerald-950 text-emerald-300 font-extrabold text-[10px] px-2 py-0.5 rounded border border-emerald-800">Soal Terlalu Mudah</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="text-rose-300 font-bold">&lt; 0.30</span>
                    <span className="bg-rose-950 text-rose-300 font-extrabold text-[10px] px-2 py-0.5 rounded border border-rose-800">Soal Terlalu Sulit</span>
                  </div>
                </div>
              </div>

              {/* Parameter 2: Daya Pembeda */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-400 flex items-center gap-1.5 text-xs">
                    <PieChart className="w-4 h-4" /> Daya Pembeda (D)
                  </span>
                  <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-md font-bold">
                    Diskriminasi
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Mengukur kemampuan soal dalam membedakan antara siswa kelompok atas (pintar) dan siswa kelompok bawah.
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-emerald-300 font-bold">&ge; 0.40</span>
                    <span className="text-emerald-400 font-extrabold text-[10px]">Sangat Baik</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-teal-300 font-bold">0.30 – 0.39</span>
                    <span className="text-teal-400 font-extrabold text-[10px]">Baik</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-amber-300 font-bold">0.20 – 0.29</span>
                    <span className="text-amber-400 font-extrabold text-[10px]">Cukup (Revisi)</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-rose-300 font-bold">&lt; 0.20</span>
                    <span className="text-rose-400 font-extrabold text-[10px]">Buruk (Dibuang)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drag & Drop Zone for Uploading Student Results for Item Analysis */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processCbtFilesList(e.dataTransfer.files);
              }
            }}
            onClick={() => cbtFileInputRef.current?.click()}
            className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/80 p-5 rounded-2xl text-center cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-center gap-3 group"
          >
            <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-left sm:text-left text-center">
              <p className="font-bold text-xs text-slate-800">
                Upload / Drop File <span className="text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md font-mono font-bold">.CBT</span> Hasil Jawaban Siswa di Sini
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload sekaligus banyak file hasil jawaban siswa (.cbt / .json) untuk bahan Analisis Butir Soal per Mata Pelajaran ({analisisMapelFilter !== 'ALL' ? analisisMapelFilter : 'Semua Mapel'}).
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <ListChecks className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Total Soal</div>
                <div className="text-2xl font-black text-gray-800">{rawItemAnalysisList.length}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Responden Siswa</div>
                <div className="text-2xl font-black text-gray-800">{studentResults.length}</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Soal Diterima</div>
                <div className="text-2xl font-black text-emerald-600">
                  {rawItemAnalysisList.filter((i) => i.recommendation === 'Diterima').length}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">Soal Direvisi/Dibuang</div>
                <div className="text-2xl font-black text-amber-600">
                  {rawItemAnalysisList.filter((i) => i.recommendation !== 'Diterima').length}
                </div>
              </div>
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Subject Filter */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                  <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-bold text-gray-600 text-[11px]">Mapel:</span>
                  <select
                    value={analisisMapelFilter}
                    onChange={(e) => setAnalisisMapelFilter(e.target.value)}
                    className="font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="ALL">Semua Mapel</option>
                    {mapelList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs">
                  <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-bold text-gray-600 text-[11px]">Kesukaran:</span>
                  <select
                    value={analisisDifficultyFilter}
                    onChange={(e) => setAnalisisDifficultyFilter(e.target.value as any)}
                    className="font-bold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
                  >
                    <option value="ALL">Semua Kesukaran</option>
                    <option value="Mudah">🟢 Mudah (P &gt; 0.70)</option>
                    <option value="Sedang">🔵 Sedang (0.30 - 0.70)</option>
                    <option value="Sukar">🔴 Sukar (P &lt; 0.30)</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={analisisSearch}
                  onChange={(e) => setAnalisisSearch(e.target.value)}
                  placeholder="Cari teks pertanyaan..."
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-teal-500 bg-white"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3 min-w-[220px]">Pertanyaan Soal</th>
                    <th className="p-3 text-center">Kunci</th>
                    <th className="p-3 min-w-[200px]">Sebaran Pilihan Siswa (A/B/C/D/E/Kosong)</th>
                    <th className="p-3 text-center">Benar / Salah</th>
                    <th className="p-3 text-center">Tingkat Kesukaran (P)</th>
                    <th className="p-3 text-center">Daya Beda (D)</th>
                    <th className="p-3 text-center">Rekomendasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredAnalisisList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                        {rawItemAnalysisList.length === 0
                          ? 'Belum ada data soal atau jawaban siswa yang siap dianalisis.'
                          : 'Tidak ada butir soal yang sesuai dengan pencarian / filter Anda.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAnalisisList.map((item) => {
                      return (
                        <tr key={item.questionNumber} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-center font-bold text-gray-700">{item.questionNumber}</td>
                          <td className="p-3">
                            <p className="font-semibold text-gray-900 line-clamp-2">{item.questionText}</p>
                            <span className="text-[10px] text-teal-600 bg-teal-50 font-bold px-1.5 py-0.5 rounded border border-teal-200/60 mt-1 inline-block">
                              {item.mapel}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="w-7 h-7 inline-flex items-center justify-center font-black rounded-lg bg-emerald-600 text-white shadow-xs">
                              {item.keyOption}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
                              <span className={`px-1.5 py-0.5 rounded font-bold ${item.keyOption === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                                A: {item.countA}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded font-bold ${item.keyOption === 'B' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                                B: {item.countB}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded font-bold ${item.keyOption === 'C' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                                C: {item.countC}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded font-bold ${item.keyOption === 'D' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                                D: {item.countD}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded font-bold ${item.keyOption === 'E' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'}`}>
                                E: {item.countE}
                              </span>
                              {item.countEmpty > 0 && (
                                <span className="px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Kosong: {item.countEmpty}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center text-gray-700">
                            <span className="text-emerald-600 font-bold">{item.totalCorrect}</span> /{' '}
                            <span className="text-red-500 font-bold">{item.totalIncorrect}</span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono font-extrabold text-sm text-slate-800">
                                {item.difficultyIndex.toFixed(2)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide mt-0.5 ${
                                  item.difficultyCategory === 'Mudah'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : item.difficultyCategory === 'Sedang'
                                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {item.difficultyCategory}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-mono font-extrabold text-sm text-slate-800">
                                {item.discriminationIndex.toFixed(2)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide mt-0.5 ${
                                  item.discriminationCategory === 'Sangat Baik' || item.discriminationCategory === 'Baik'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : item.discriminationCategory === 'Cukup'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}
                              >
                                {item.discriminationCategory}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                item.recommendation === 'Diterima'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : item.recommendation === 'Direvisi'
                                  ? 'bg-amber-500 text-white shadow-2xs'
                                  : 'bg-red-600 text-white shadow-2xs'
                              }`}
                            >
                              {item.recommendation}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SISWA MANUAL */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Tambah Siswa Manual
              </h3>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentManual} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  NIS / Nomor Induk Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newNis}
                  onChange={(e) => setNewNis(e.target.value)}
                  placeholder="Contoh: 1006"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nama Lengkap Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Andi Wijaya"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Kelas
                </label>
                <input
                  type="text"
                  value={newKelas}
                  onChange={(e) => setNewKelas(e.target.value)}
                  placeholder="Contoh: XII IPS 1"
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Kode Guru (Penanda Mapel / Guru)
                </label>
                <input
                  type="text"
                  value={newStudentKodeGuru}
                  onChange={(e) => setNewStudentKodeGuru(e.target.value.toUpperCase())}
                  placeholder={`Contoh: ${config.kodeGuru || 'GURU01'}`}
                  className="w-full border-2 border-amber-200 bg-amber-50/50 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none text-sm font-mono font-bold text-amber-900"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH GURU MANUAL */}
      {isAddTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Tambah Guru Manual
              </h3>
              <button
                onClick={() => setIsAddTeacherModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacherManual} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  placeholder="Contoh: guru_cbt / 198501152010011002"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  NAMA LENGKAP GURU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTeacherNama}
                  onChange={(e) => setNewTeacherNama(e.target.value)}
                  placeholder="Contoh: Drs. Aji Sosiologi, M.Pd"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  MATA PELAJARAN
                </label>
                <input
                  type="text"
                  value={newTeacherMapel}
                  onChange={(e) => setNewTeacherMapel(e.target.value)}
                  placeholder="Contoh: Sosiologi"
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  KODE GURU (KODE UNIK MAPEL)
                </label>
                <input
                  type="text"
                  value={newTeacherKodeGuru}
                  onChange={(e) => setNewTeacherKodeGuru(e.target.value.toUpperCase())}
                  placeholder="Contoh: GURU01 / SOS01"
                  className="w-full border-2 border-amber-200 bg-amber-50/50 rounded-xl p-2.5 focus:border-amber-500 focus:outline-none text-sm font-mono font-bold text-amber-900"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Simpan Data Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI UPLOAD EXCEL & PILIH MATA PELAJARAN */}
      {isUploadMapelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="bg-sky-900 text-white p-5 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-400" /> Import Excel Soal - Pilih Mata Pelajaran
              </h3>
              <button
                onClick={() => {
                  setIsUploadMapelModalOpen(false);
                  setUploadPendingQuestions([]);
                }}
                className="text-sky-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900 space-y-1">
                  <p className="font-bold text-sm text-sky-950">File Excel Berhasil Dibaca!</p>
                  <p><b>Nama File:</b> {uploadFileName}</p>
                  <p><b>Jumlah Soal Terdeteksi:</b> <span className="text-emerald-700 font-extrabold">{uploadPendingQuestions.length} Soal</span></p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase text-gray-700 tracking-wider">
                  Pilih Mata Pelajaran Untuk Soal Ini <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Pilih Mata Pelajaran sesuai pengaturan menu <b>MATA PELAJARAN</b> agar soal terorganisir dan tidak tertukar di Bank Soal:
                </p>
                <select
                  value={uploadTargetMapel}
                  onChange={(e) => setUploadTargetMapel(e.target.value)}
                  className="w-full border-2 border-sky-500/70 bg-white rounded-xl p-3 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 focus:outline-none text-sm font-bold text-gray-900 cursor-pointer shadow-xs"
                >
                  {mapelList.map((m) => (
                    <option key={m} value={m} className="font-semibold">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Sebanyak <b>{uploadPendingQuestions.length} soal</b> akan disimpan ke Bank Soal dengan label Mata Pelajaran <b>"{uploadTargetMapel}"</b>.
                </span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadMapelModalOpen(false);
                    setUploadPendingQuestions([]);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUploadWithMapel}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> Import {uploadPendingQuestions.length} Soal Ke Bank
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW SOAL UJIAN */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Preview Tampilan Soal Ujian</h3>
                  <p className="text-[11px] text-slate-300">Simulasi tampilan soal di layar siswa</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              {/* Badges Info */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="bg-sky-100 text-sky-800 text-xs font-extrabold px-3 py-1 rounded-lg border border-sky-200">
                    Mata Pelajaran: {previewQuestion.mapel || mapelInput || 'Sosiologi'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">ID: {previewQuestion.id}</span>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 ${
                    previewQuestion.isActive !== false
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {previewQuestion.isActive !== false ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Aktif dalam Ujian
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-500" /> Nonaktif
                    </>
                  )}
                </span>
              </div>

              {/* Gambar / Tabel / Diagram terlampir jika ada */}
              {previewQuestion.image && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-center">
                  <img
                    src={previewQuestion.image}
                    alt="Lampiran Soal"
                    className="max-h-72 w-auto object-contain rounded-xl border border-slate-200 shadow-xs"
                  />
                </div>
              )}

              {/* Question Text */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                  Teks Pertanyaan
                </p>
                <div
                  className="text-base text-slate-900 font-semibold leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: formatQuestionText(previewQuestion.question) }}
                />
              </div>

              {/* Options list */}
              <div className="space-y-2.5">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Pilihan Jawaban & Kunci Jawaban
                </p>
                {previewQuestion.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                      opt.isCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                        opt.isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <div className="flex-1 pt-1 text-sm">{opt.text}</div>
                    {opt.isCorrect && (
                      <span className="bg-emerald-200 text-emerald-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-700" /> KUNCI JAWABAN
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Explanation / Pembahasan */}
              {previewQuestion.explanation && (
                <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl space-y-1">
                  <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Pembahasan Soal
                  </p>
                  <p className="text-xs text-amber-950 leading-relaxed font-medium">
                    {previewQuestion.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetQ = previewQuestion;
                  setPreviewQuestion(null);
                  onOpenQuestionModal(targetQ);
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" /> Edit Soal Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PENGATURAN KOP SEKOLAH & TANDA TANGAN */}
      {isKopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" /> Atur Kop Surat & Tanda Tangan Laporan
              </h3>
              <button
                onClick={() => setIsKopModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKopSekolah} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nama Dinas Pendidikan / Instansi
                </label>
                <input
                  type="text"
                  value={kopForm.dinas}
                  onChange={(e) => setKopForm({ ...kopForm, dinas: e.target.value })}
                  placeholder="Contoh: DINAS PENDIDIKAN PROVINSI DKI JAKARTA"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Nama Sekolah / Madrasah
                </label>
                <input
                  type="text"
                  value={kopForm.namaSekolah}
                  onChange={(e) => setKopForm({ ...kopForm, namaSekolah: e.target.value })}
                  placeholder="Contoh: SMA NEGERI 1 JAKARTA"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Alamat Sekolah
                </label>
                <input
                  type="text"
                  value={kopForm.alamat}
                  onChange={(e) => setKopForm({ ...kopForm, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Budi Utomo No. 7, Jakarta Pusat"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Telepon / Email / Website
                </label>
                <input
                  type="text"
                  value={kopForm.teleponWeb}
                  onChange={(e) => setKopForm({ ...kopForm, teleponWeb: e.target.value })}
                  placeholder="Contoh: Telp: (021) 3865001 | Email: cbt@sman1jakarta.sch.id"
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Kota & Tanggal Laporan
                  </label>
                  <input
                    type="text"
                    value={kopForm.kotaTanggal}
                    onChange={(e) => setKopForm({ ...kopForm, kotaTanggal: e.target.value })}
                    placeholder="Contoh: Jakarta, 26 Juli 2026"
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Jabatan Guru
                  </label>
                  <input
                    type="text"
                    value={kopForm.jabatanGuru}
                    onChange={(e) => setKopForm({ ...kopForm, jabatanGuru: e.target.value })}
                    placeholder="Contoh: Guru Mata Pelajaran Sosiologi"
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Nama Lengkap Guru (Penandatangan)
                  </label>
                  <input
                    type="text"
                    value={kopForm.namaGuru}
                    onChange={(e) => setKopForm({ ...kopForm, namaGuru: e.target.value })}
                    placeholder="Contoh: Drs. Aji Sosiologi, M.Pd"
                    required
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    NIP Guru
                  </label>
                  <input
                    type="text"
                    value={kopForm.nipGuru}
                    onChange={(e) => setKopForm({ ...kopForm, nipGuru: e.target.value })}
                    placeholder="Contoh: 198501152010011002"
                    required
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Nama Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={kopForm.namaKepalaSekolah}
                    onChange={(e) => setKopForm({ ...kopForm, namaKepalaSekolah: e.target.value })}
                    placeholder="Contoh: Dr. H. Ahmad Sanusi, M.Si"
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={kopForm.nipKepalaSekolah}
                    onChange={(e) => setKopForm({ ...kopForm, nipKepalaSekolah: e.target.value })}
                    placeholder="Contoh: 197203101998021001"
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsKopModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
                >
                  Simpan Kop & TTD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AUDIT INDIKASI KECURANGAN SISWA */}
      {isAuditModalOpen && selectedAuditResult && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${selectedAuditResult.warnings > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Audit Keamanan & Indikasi Kecurangan Siswa
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedAuditResult.studentInfo.name} — NIS: {selectedAuditResult.studentInfo.noPeserta}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
              {/* Ringkasan Perangkat & Lokasi IP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-slate-400">IP Address / Network</div>
                    <div className="text-xs font-mono font-bold text-slate-800 truncate">
                      {selectedAuditResult.ipAddress || '180.252.12.11 (Local Network)'}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Sistem & Perangkat</div>
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {selectedAuditResult.deviceInfo || 'Chrome Browser / Desktop OS'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Peringatan Kebocoran */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                selectedAuditResult.warnings === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : selectedAuditResult.warnings < 3
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {selectedAuditResult.warnings === 0
                        ? '🟢 Sesi Ujian Bersih & Jujur'
                        : selectedAuditResult.warnings < 3
                        ? '🟡 Terdeteksi Peringatan Ringan'
                        : '🔴 Terdeteksi Pelanggaran Keamanan Tinggi'}
                    </div>
                    <div className="text-[11px] opacity-80">
                      Total Peringatan Keamanan: {selectedAuditResult.warnings}x Kejadian
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-white/80 shadow-2xs">
                  {selectedAuditResult.warnings} Violation(s)
                </span>
              </div>

              {/* Timeline Tabel Log Kecurangan */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-600" /> Timeline Kejadian Pelanggaran
                </h4>
                {(!selectedAuditResult.cheatingLogs || selectedAuditResult.cheatingLogs.length === 0) ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-medium">
                    Tidak ditemukan catatan riwayat kecurangan. Siswa mengerjakan ujian secara mandiri dan jujur tanpa berpindah tab.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                          <th className="p-3">Waktu WIB</th>
                          <th className="p-3">Jenis Peringatan Keamanan</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedAuditResult.cheatingLogs.map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-slate-600">{log.timestamp}</td>
                            <td className="p-3 font-medium text-slate-800">{log.type || log.details || (log as any).reason || 'Peringatan Keamanan Ujian'}</td>
                            <td className="p-3 text-center">
                              <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-200">
                                Peringatan #{idx + 1}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Tutup Detail Audit
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: DOWNLOAD ANIMATION */}
      <DownloadAnimationModal
        isOpen={isDownloadModalOpen}
        title={downloadModalConfig.title}
        subtitle={downloadModalConfig.subtitle}
        fileName={downloadModalConfig.fileName}
        fileType={downloadModalConfig.fileType}
        onComplete={downloadModalConfig.onCompleteAction}
        onClose={() => setIsDownloadModalOpen(false)}
      />
        </div>
      </div>
    </div>
  );
};
