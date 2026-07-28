import React, { useState, useRef } from 'react';
import { AppConfig, Question, StudentResult, StudentUser, TeacherUser, KopSekolahConfig } from '../types';
import { decryptResult, encryptAppBackup, decryptAppBackup } from '../utils/crypto';
import { formatQuestionText } from '../utils/questionFormatter';
import { exportOfflineAppHtml } from '../utils/offlineExport';
import { generateResultsPdfReport, generateIndividualStudentPdf, defaultKopSekolah } from '../utils/pdfGenerator';
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
  const [activeTab, setActiveTab] = useState<'bank' | 'rekap' | 'students' | 'token' | 'mapel' | 'backup'>('bank');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
  const [mapelTitleInput, setMapelTitleInput] = useState<string>(
    config.mapelTitle || 'Assessment TKA Sosiologi SMA'
  );
  const [subTitleInput, setSubTitleInput] = useState<string>(
    config.subTitle || 'Perubahan Sosial & Globalisasi'
  );
  const [mapelList, setMapelList] = useState<string[]>(
    config.mapelList && config.mapelList.length > 0 ? config.mapelList : defaultMapelList
  );
  const [customMapelToAdd, setCustomMapelToAdd] = useState('');

  // Question Selection & Batch State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [selectedBankMapel, setSelectedBankMapel] = useState<string>('ALL');

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

  // --- BACKUP & RESTORE APP DATA HANDLERS ---
  const handleBackupAppData = () => {
    try {
      const backupPayload = {
        appName: 'CBT_GURUAI',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        config,
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

      const packagePayload = {
        appName: 'CBT_GURUAI',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        config: {
          ...config,
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
      link.download = `PAKET_SOAL_${mapelClean}_${config.examToken || 'TOKEN'}_${dateStr}_${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showAlert(`Paket Soal Aktif "${activeMapel}" (${activeQuestions.length} Soal - Token: "${config.examToken || '-'}") berhasil dieksport sebagai file JSON backup terenkripsi!`);
    } catch (e) {
      console.error(e);
      showAlert('Gagal membuat paket soal aktif!');
    }
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

        showConfirm(
          'Memulihkan Seluruh Data Backup Terenkripsi?',
          'Apakah Anda yakin ingin memulihkan (restore) seluruh data aplikasi dari file backup terenkripsi ini? Seluruh bank soal, data user, dan rekap nilai akan diperbarui.',
          () => {
            onSaveConfig(restoredConfig);
            if (Array.isArray(parsed.studentResults)) {
              onSaveStudentResults(parsed.studentResults);
            }
            showAlert('Sukses! Seluruh data aplikasi CBT GURUAI berhasil dipulihkan dari file backup terenkripsi.');
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

  // General Settings Handler
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
      mapelList: updatedList,
    });
    showAlert(`Pengaturan Mata Pelajaran "${trimmedMapel}" berhasil disimpan!`);
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
      ['Pertanyaan', 'Opsi_A', 'Opsi_B', 'Opsi_C', 'Opsi_D', 'Opsi_E', 'Kunci_Jawaban', 'Pembahasan', 'Mapel'],
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
      ['NIS', 'Nama', 'Kelas'],
      ['1001', 'Ahmad Fauzi', 'XII IPS 1'],
      ['1002', 'Siti Rahmawati', 'XII IPS 1'],
      ['1003', 'Budi Santoso', 'XII IPS 2'],
      ['1004', 'Dewi Anjani', 'XII IPS 2'],
      ['1005', 'Rian Hidayat', 'XII IPS 3'],
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
    };

    const updated = [...studentsList, newStudent];
    onSaveConfig({ ...config, students: updated });

    setNewNis('');
    setNewNama('');
    setNewKelas('');
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
      ['NIP', 'Nama', 'Mata_Pelajaran'],
      ['198501152010011002', 'Drs. Aji Sosiologi, M.Pd', 'Sosiologi'],
      ['198803202012022005', 'Siti Rahmawati, S.Pd', 'Sosiologi'],
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
    };

    const updated = [...teachersList, newTeacher];
    onSaveConfig({ ...config, teachers: updated });

    setNewNip('');
    setNewTeacherNama('');
    setNewTeacherMapel('');
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
  const filteredQuestions = config.questions.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMapel =
      selectedBankMapel === 'ALL' ||
      !q.mapel ||
      q.mapel === selectedBankMapel;
    return matchesSearch && matchesMapel;
  });

  const filteredStudentResults = studentResults.filter(
    (r) =>
      r.studentInfo.name.toLowerCase().includes(rekapSearch.toLowerCase()) ||
      r.studentInfo.noPeserta.toLowerCase().includes(rekapSearch.toLowerCase())
  );

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

    return matchesSearch && matchesClass && matchesStatus;
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

  return (
    <div className="flex-1 flex h-screen bg-slate-100 absolute inset-0 z-50 overflow-hidden">
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
                  onClick={handleExportActivePaketJson}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800/90 text-sky-400 hover:bg-sky-600 hover:text-white transition-all border border-slate-700/60 shadow-xs cursor-pointer"
                  title="Unduh file Paket Soal Aktif (.json)"
                >
                  <FileJson className="w-4 h-4 shrink-0" />
                  <span>Paket Soal (.json)</span>
                </button>

                <button
                  onClick={() => {
                    exportOfflineAppHtml(config);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800/90 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all border border-slate-700/60 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>App Offline (.html)</span>
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
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-semibold text-slate-300">CBT Standalone Server</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Assessment TKA Sosiologi SMA</p>
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
                {activeTab === 'mapel' && <BookOpen className="w-4.5 h-4.5 text-sky-600 shrink-0" />}
                {activeTab === 'bank' && <Database className="w-4.5 h-4.5 text-blue-600 shrink-0" />}
                {activeTab === 'students' && <Users className="w-4.5 h-4.5 text-indigo-600 shrink-0" />}
                {activeTab === 'token' && <Key className="w-4.5 h-4.5 text-amber-500 shrink-0" />}
                {activeTab === 'rekap' && <FileCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />}
                <span>
                  {activeTab === 'mapel' && 'Pengaturan Mata Pelajaran & Header Ujian'}
                  {activeTab === 'bank' && 'Bank Soal & Pengaturan Umum Ujian'}
                  {activeTab === 'students' && 'Manajemen User & Data Siswa'}
                  {activeTab === 'token' && 'Manajemen Token Ujian'}
                  {activeTab === 'rekap' && 'Rekapitulasi & Dekripsi (.CBT)'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                Sistem CBT Assessment TKA Sosiologi SMA — Panel Guru
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
              onClick={() => exportOfflineAppHtml(config)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs shadow-xs active:scale-95 cursor-pointer"
              title="Unduh file aplikasi standalone offline (.html)"
            >
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">App Offline (.html)</span>
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="font-bold text-lg mb-4 border-b border-gray-100 pb-3 text-gray-800 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" /> Pengaturan Umum Ujian
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Durasi Ujian (Menit)
                  </label>
                  <input
                    type="number"
                    value={durationInput}
                    onChange={(e) => setDurationInput(parseInt(e.target.value) || 0)}
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-blue-500 focus:outline-none text-sm font-semibold"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    KKM (Nilai Lulus Minimal 0-100)
                  </label>
                  <input
                    type="number"
                    value={kkmInput}
                    onChange={(e) => setKkmInput(parseInt(e.target.value) || 0)}
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-blue-500 focus:outline-none text-sm font-semibold"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Jumlah Soal Dikeluarkan Per Siswa
                  </label>
                  <input
                    type="number"
                    value={maxQuestionsInput}
                    onChange={(e) => setMaxQuestionsInput(parseInt(e.target.value) || 0)}
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-blue-500 focus:outline-none text-sm font-semibold"
                    min="0"
                    placeholder="0 = Gunakan Semua Soal Aktif"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Isi <b>0</b> jika ingin mengeluarkan <b>seluruh soal aktif</b>. Jika diset misalnya <b>20</b>, maka sistem akan mengambil 20 soal secara acak dari total bank soal.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Batas Maksimal Percobaan Ujian (Max Attempts)
                  </label>
                  <input
                    type="number"
                    value={maxAttemptsInput}
                    onChange={(e) => setMaxAttemptsInput(parseInt(e.target.value) || 1)}
                    className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-blue-500 focus:outline-none text-sm font-semibold"
                    min="1"
                    max="10"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Berapa kali siswa diizinkan mengerjakan ujian (dimulai dari angka 1).
                  </p>
                </div>

                {/* Status Ringkasan Jumlah Soal */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Total Soal di Bank Soal:</span>
                    <span className="font-extrabold text-slate-900">{config.questions.length} Soal</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Soal Berstatus Aktif:</span>
                    <span className="font-extrabold text-emerald-700">
                      {config.questions.filter((q) => q.isActive !== false).length} Soal
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-800 font-bold pt-1 border-t border-slate-200">
                    <span>Jumlah Soal Tampil di Ujian:</span>
                    <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md font-extrabold text-xs">
                      {(() => {
                        const activeCount = config.questions.filter((q) => q.isActive !== false).length;
                        if (maxQuestionsInput <= 0 || maxQuestionsInput >= activeCount) {
                          return `${activeCount} Soal (Semua)`;
                        }
                        return `${maxQuestionsInput} Soal (Diacak dari ${activeCount})`;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Toggle Pengacakan Soal & Pilihan */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    Opsi Pengacakan (Randomization)
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={randomizeQuestionsInput}
                      onChange={(e) => setRandomizeQuestionsInput(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Acak Urutan Soal</span>
                      <span className="text-slate-500 text-[11px]">Setiap siswa mendapat urutan nomor soal yang berbeda</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={randomizeOptionsInput}
                      onChange={(e) => setRandomizeOptionsInput(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Acak Pilihan Jawaban (A, B, C, D, E)</span>
                      <span className="text-slate-500 text-[11px]">Posisi opsi A/B/C/D/E diacak untuk setiap nomor soal</span>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleSaveGeneralConfig}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 text-sm cursor-pointer"
                >
                  Simpan Pengaturan
                </button>
              </div>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Upload className="w-4 h-4" /> Upload Excel Soal
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xls,.xlsx"
                  className="hidden"
                />

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

            {/* Filter & Selector Bar for Mata Pelajaran */}
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="font-bold text-slate-700 whitespace-nowrap">Filter Mapel Bank Soal:</span>
                <select
                  value={selectedBankMapel}
                  onChange={(e) => setSelectedBankMapel(e.target.value)}
                  className="flex-1 sm:flex-none bg-white border border-slate-300 text-slate-800 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Mata Pelajaran ({config.questions.length} Total Soal)</option>
                  {mapelList.map((m) => {
                    const count = config.questions.filter(
                      (q) => q.mapel === m || (!q.mapel && m === (config.mapel || 'Sosiologi'))
                    ).length;
                    return (
                      <option key={m} value={m}>
                        {m} ({count} Soal)
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedBankMapel !== 'ALL' && selectedBankMapel !== config.mapel && (
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
                  className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 active:scale-95 shrink-0 cursor-pointer shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Set "{selectedBankMapel}" Sebagai Mapel Ujian
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan kata kunci pertanyaan..."
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
                  Belum ada soal. Silakan klik Tambah Soal atau Upload Excel.
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
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-md">
                              Soal #{idx + 1}
                            </span>
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-sky-200/80">
                              {q.mapel || mapelInput || 'Sosiologi'}
                            </span>
                            {q.image && (
                              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-purple-200/80 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 text-purple-600" /> Ada Gambar/Tabel
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
                    <input
                      type="file"
                      ref={studentFileInputRef}
                      onChange={handleStudentExcelUpload}
                      accept=".xls,.xlsx"
                      className="hidden"
                    />

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
                        <th className="p-3 text-center">Status Ujian</th>
                        {adminRole !== 'teacher' && <th className="p-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={adminRole !== 'teacher' ? 7 : 6} className="p-8 text-center text-gray-400 font-medium">
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
                    Kelola daftar guru pengampu. Guru dapat login menggunakan <b>NIP</b> sebagai username & password.
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
                    <input
                      type="file"
                      ref={teacherFileInputRef}
                      onChange={handleTeacherExcelUpload}
                      accept=".xls,.xlsx"
                      className="hidden"
                    />

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
                      placeholder="Cari NIP / Nama / Mapel..."
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="p-3">No</th>
                        <th className="p-3">NIP (Nomor Induk Pegawai)</th>
                        <th className="p-3">Nama Lengkap Guru</th>
                        <th className="p-3">Mata Pelajaran</th>
                        {adminRole !== 'teacher' && <th className="p-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredTeachers.length === 0 ? (
                        <tr>
                          <td colSpan={adminRole !== 'teacher' ? 5 : 4} className="p-8 text-center text-gray-400 font-medium">
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
                  onClick={handleBackupAppData}
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
                <input
                  type="file"
                  ref={backupFileInputRef}
                  onChange={handleRestoreAppData}
                  accept=".json"
                  className="hidden"
                />
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
                      mapelTitle: config.mapelTitle || 'Assessment TKA Sosiologi SMA',
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
              <input
                type="file"
                ref={cbtFileInputRef}
                onChange={handleCbtFileUpload}
                accept=".cbt,.json,.txt,*"
                multiple
                className="hidden"
              />
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
                {/* Search Bar */}
                <div className="relative w-full sm:w-56">
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
                      <td colSpan={9} className="p-8 text-center text-gray-400 font-medium">
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
                            {r.warnings > 0 ? (
                              <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {r.warnings}x Peringatan
                              </span>
                            ) : (
                              <span className="text-gray-400">0 (Bersih)</span>
                            )}
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
                  NIP (Nomor Induk Pegawai) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  placeholder="Contoh: 198501152010011002"
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
        </div>
      </div>
    </div>
  );
};
