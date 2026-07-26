import React, { useState, useRef } from 'react';
import { AppConfig, Question, StudentResult, StudentUser } from '../types';
import { decryptResult } from '../utils/crypto';
import { exportOfflineAppHtml } from '../utils/offlineExport';
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
  Download,
  WifiOff,
  Menu,
  BookOpen,
  Sparkles,
  CheckSquare,
  Square,
  ListChecks,
} from 'lucide-react';

interface AdminPanelProps {
  config: AppConfig;
  studentResults: StudentResult[];
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
  onSaveConfig,
  onSaveStudentResults,
  onOpenQuestionModal,
  onDeleteQuestion,
  onResetDefaultQuestions,
  onLogout,
  showAlert,
  showConfirm,
}) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'rekap' | 'students' | 'token' | 'mapel'>('bank');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // General Config State
  const [durationInput, setDurationInput] = useState<number>(config.duration);
  const [kkmInput, setKkmInput] = useState<number>(config.kkm);
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

  // Token Management State
  const [currentToken, setCurrentToken] = useState<string>(config.examToken || 'SOS2026');
  const [isCopiedToken, setIsCopiedToken] = useState(false);

  // Student Management State
  const [studentSearch, setStudentSearch] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newNis, setNewNis] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelas, setNewKelas] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cbtFileInputRef = useRef<HTMLInputElement>(null);
  const studentFileInputRef = useRef<HTMLInputElement>(null);

  const studentsList: StudentUser[] = config.students || [];

  // General Settings Handler
  const handleSaveGeneralConfig = () => {
    if (durationInput > 0 && kkmInput >= 0 && kkmInput <= 100) {
      onSaveConfig({
        ...config,
        duration: durationInput,
        kkm: kkmInput,
      });
      showAlert('Pengaturan umum berhasil disimpan!');
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
    const ws_data = [
      ['Pertanyaan', 'Opsi_A', 'Opsi_B', 'Opsi_C', 'Opsi_D', 'Opsi_E', 'Kunci_Jawaban', 'Pembahasan'],
      [
        'Bentuk perubahan sosial yang berlangsung cepat dan mengubah dasar-dasar kehidupan masyarakat disebut...',
        'Evolusi',
        'Revolusi',
        'Regresi',
        'Progres',
        'Asimilasi',
        'B',
        'Revolusi adalah perubahan yang berlangsung secara cepat dan menyangkut dasar atau pokok-pokok kehidupan masyarakat.',
      ],
      [
        'Masuknya budaya asing yang diterima tanpa menghilangkan budaya asli disebut...',
        'Asimilasi',
        'Akulturasi',
        'Difusi',
        'Amalgamasi',
        'Inovasi',
        'B',
        'Akulturasi adalah percampuran dua budaya di mana unsur budaya asli masih terlihat (tidak hilang).',
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Soal');
    XLSX.writeFile(wb, 'TEMPLATE_SOAL_CBT_SOSIOLOGI.xlsx');
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

        data.forEach((row, idx) => {
          const qText = row['Pertanyaan'] || row['pertanyaan'];
          const optA = row['Opsi_A'] || row['opsi_a'] || row['Opsi A'];
          const optB = row['Opsi_B'] || row['opsi_b'] || row['Opsi B'];
          const optC = row['Opsi_C'] || row['opsi_c'] || row['Opsi C'];
          const optD = row['Opsi_D'] || row['opsi_d'] || row['Opsi D'];
          const optE = row['Opsi_E'] || row['opsi_e'] || row['Opsi E'];
          const key = (row['Kunci_Jawaban'] || row['kunci_jawaban'] || row['Kunci'] || '').toString().trim().toUpperCase();
          const exp = row['Pembahasan'] || row['pembahasan'] || 'Tidak ada pembahasan.';

          if (qText && optA && optB && optC && key) {
            const rowMapel = row['Mapel'] || row['Mata_Pelajaran'] || row['mapel'];
            const targetMapel = rowMapel
              ? String(rowMapel).trim()
              : selectedBankMapel !== 'ALL'
              ? selectedBankMapel
              : mapelInput || config.mapel || 'Sosiologi';

            newQuestions.push({
              id: startId + idx,
              question: qText,
              explanation: exp,
              mapel: targetMapel,
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
          showConfirm(
            'Konfirmasi Upload Excel',
            `Ditemukan ${newQuestions.length} soal valid dari Excel. Tambahkan ke Bank Soal saat ini?`,
            () => {
              const updated = [...config.questions, ...newQuestions];
              onSaveConfig({ ...config, questions: updated });
              showAlert(`Sukses! ${newQuestions.length} soal baru telah ditambahkan ke Bank Soal.`);
            }
          );
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

    const rows = studentResults.map((r, i) => ({
      No: i + 1,
      'No. Peserta': r.studentInfo.noPeserta,
      'Nama Siswa': r.studentInfo.name,
      Mata_Pelajaran: r.studentInfo.mapel,
      Nilai_Skor: r.score,
      Status_Lulus: r.isPassed ? 'LULUS' : 'TIDAK LULUS',
      Jawaban_Benar: r.correctCount,
      Jawaban_Salah: r.incorrectCount,
      Total_Soal: r.totalQuestions,
      Jumlah_Pelanggaran: r.warnings,
      Waktu_Selesai: r.submittedAt,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Nilai_CBT');
    XLSX.writeFile(wb, `REKAP_NILAI_CBT_SOSIOLOGI_2026.xlsx`);
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

  const filteredStudents = studentsList.filter(
    (s) =>
      s.nama.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.nis.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.kelas.toLowerCase().includes(studentSearch.toLowerCase())
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
                <h1 className="font-extrabold text-sm text-white tracking-wide leading-tight">
                  CBT GURU
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
                    <span>User Siswa</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'students' ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {studentsList.length}
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
                    <span>Rekap Jawaban</span>
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
              </nav>
            </div>

            <div>
              <p className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tindakan System
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    exportOfflineAppHtml(config);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800/90 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all border border-slate-700/60 shadow-xs"
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
              onClick={() => exportOfflineAppHtml(config)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs shadow-xs active:scale-95"
              title="Unduh file aplikasi standalone offline"
            >
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">App Offline</span>
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

                <button
                  onClick={handleSaveGeneralConfig}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 text-sm"
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
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pl-8 sm:pl-0">
                        <button
                          onClick={() => onOpenQuestionModal(q)}
                          className="flex-1 sm:flex-none bg-amber-400 hover:bg-amber-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 active:scale-95"
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
                          className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 active:scale-95"
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

      {/* TAB 2: MANAJEMEN USER SISWA */}
      {activeTab === 'students' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
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

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleDownloadStudentTemplate}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" /> Template Excel Siswa
              </button>

              <button
                onClick={() => studentFileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
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
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                <UserPlus className="w-4 h-4" /> Tambah Siswa Manual
              </button>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-gray-800">Daftar Siswa Terdaftar</h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Cari NIS / Nama / Kelas..."
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3">No</th>
                    <th className="p-3">NIS / No. Peserta</th>
                    <th className="p-3">Nama Lengkap Siswa</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">
                        Belum ada data siswa terdaftar. Klik button <b>Tambah Siswa Manual</b> atau <b>Upload Excel Siswa</b>.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
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
                            onClick={() => handleDeleteStudent(s.id, s.nama)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
                  className="mt-4 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs transition-all border border-slate-700"
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
                      className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-bold px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                      title="Generate 6 Karakter Acak"
                    >
                      <RefreshCw className="w-4 h-4" /> Acak Token
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveToken}
                  className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-md active:scale-95 text-sm"
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

      {/* TAB 4: REKAP JAWABAN (.CBT) */}
      {activeTab === 'rekap' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {/* Action Header & Upload Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" /> Rekapitulasi & Dekripsi File Jawaban Siswa (.cbt)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Upload file jawaban terenkripsi (.cbt) yang dikirim oleh siswa untuk merekap nilai secara otomatis.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => cbtFileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <Upload className="w-4 h-4" /> Upload File .CBT Siswa
              </button>
              <input
                type="file"
                ref={cbtFileInputRef}
                onChange={handleCbtFileUpload}
                accept=".cbt,.json,.txt,*"
                multiple
                className="hidden"
              />

              <button
                onClick={handleExportRekapToExcel}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Rekap ke Excel (.xlsx)
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

          {/* Student Results Table */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-gray-800">Daftar Hasil Jawaban Siswa</h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={rekapSearch}
                  onChange={(e) => setRekapSearch(e.target.value)}
                  placeholder="Cari Nama / No Peserta..."
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
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
                      <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                        Belum ada file jawaban siswa (.cbt) yang didekripsi. Klik button <b>Upload File .CBT Siswa</b> di atas untuk merekap jawaban.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentResults.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
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
                          <button
                            onClick={() => handleDeleteStudentResult(r.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Rekap"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
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
                className="text-slate-400 hover:text-white transition-colors"
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
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md"
                >
                  Simpan Data Siswa
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
