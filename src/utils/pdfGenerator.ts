import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentResult, KopSekolahConfig, Question } from '../types';

export const defaultKopSekolah: KopSekolahConfig = {
  namaSekolah: 'SMA NEGERI 1 JAKARTA',
  dinas: 'DINAS PENDIDIKAN PROVINSI DKI JAKARTA',
  alamat: 'Jl. Budi Utomo No. 7, Pasar Baru, Jakarta Pusat',
  teleponWeb: 'Telp: (021) 3865001 | Email: cbt@sman1jakarta.sch.id',
  kotaTanggal: 'Jakarta, 26 Juli 2026',
  namaGuru: 'Drs. Aji Sosiologi, M.Pd',
  nipGuru: '198501152010011002',
  jabatanGuru: 'Guru Mata Pelajaran Sosiologi',
  namaKepalaSekolah: 'Dr. H. Ahmad Sanusi, M.Si',
  nipKepalaSekolah: '197203101998021001',
};

export function generateResultsPdfReport(
  results: StudentResult[],
  kop: KopSekolahConfig,
  examInfo: {
    mapel: string;
    mapelTitle: string;
    kkm: number;
    totalQuestions: number;
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 12;

  // 1. KOP SEKOLAH
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text((kop.dinas || defaultKopSekolah.dinas).toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text((kop.namaSekolah || defaultKopSekolah.namaSekolah).toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(kop.alamat || defaultKopSekolah.alamat, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  if (kop.teleponWeb) {
    doc.setFontSize(8);
    doc.text(kop.teleponWeb, pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
  }

  // Double Line Divider
  currentY += 2;
  doc.setLineWidth(0.8);
  doc.setDrawColor(15, 23, 42);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 1.2;
  doc.setLineWidth(0.2);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // 2. JUDUL LAPORAN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN DAFTAR HASIL JAWABAN & NILAI UJIAN CBT GURUAI', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`${examInfo.mapelTitle || 'Assessment TKA 2026'} - Mata Pelajaran: ${examInfo.mapel || 'Sosiologi'}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;

  // Metadata Table Info
  const totalSiswa = results.length;
  const passedCount = results.filter((r) => r.isPassed).length;
  const avgScore = totalSiswa > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / totalSiswa) : 0;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Standar KKM: ${examInfo.kkm} | Total Peserta: ${totalSiswa} Siswa | Tuntas: ${passedCount} | Rata-Rata: ${avgScore}`, 14, currentY);
  currentY += 5;

  // 3. TABLE HASIL JAWABAN
  const tableHead = [['No', 'NIS / No. Peserta', 'Nama Lengkap Siswa', 'Benar', 'Salah', 'Total', 'Nilai', 'Status']];
  const tableBody = results.map((r, idx) => [
    idx + 1,
    r.studentInfo.noPeserta,
    r.studentInfo.name,
    r.correctCount,
    r.incorrectCount,
    r.totalQuestions,
    r.score,
    r.isPassed ? 'LULUS' : 'REMIDI',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 35 },
      2: { halign: 'left' },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'center', cellWidth: 15 },
      6: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      7: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'LULUS') {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald 600
        } else {
          data.cell.styles.textColor = [239, 68, 68]; // Red 500
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Get Y position after table
  let finalY = (doc as any).lastAutoTable.finalY + 12;

  // If table is close to page bottom, add a new page for signature block
  if (finalY > 230) {
    doc.addPage();
    finalY = 25;
  }

  // 4. SIGNATURE BLOCK (TANDA TANGAN GURU & KEPALA SEKOLAH)
  const leftX = 25;
  const rightX = pageWidth - 65;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  // Left Signature: Kepala Sekolah
  doc.text('Mengetahui,', leftX, finalY);
  doc.text('Kepala Sekolah', leftX, finalY + 4.5);

  // Right Signature: Guru Mata Pelajaran
  const tglStr = kop.kotaTanggal || defaultKopSekolah.kotaTanggal;
  doc.text(tglStr, rightX, finalY);
  doc.text(kop.jabatanGuru || defaultKopSekolah.jabatanGuru, rightX, finalY + 4.5);

  const sigGap = 22; // gap for signature line
  const nameY = finalY + 4.5 + sigGap;

  // Nama & NIP Kepala Sekolah
  doc.setFont('helvetica', 'bold');
  const ksNama = kop.namaKepalaSekolah || defaultKopSekolah.namaKepalaSekolah || 'Dr. H. Ahmad Sanusi, M.Si';
  doc.text(ksNama, leftX, nameY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP. ${kop.nipKepalaSekolah || defaultKopSekolah.nipKepalaSekolah || '197203101998021001'}`, leftX, nameY + 4);

  // Nama & NIP Guru
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const guruNama = kop.namaGuru || defaultKopSekolah.namaGuru;
  doc.text(guruNama, rightX, nameY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP. ${kop.nipGuru || defaultKopSekolah.nipGuru}`, rightX, nameY + 4);

  // Save PDF
  const cleanMapel = (examInfo.mapel || 'Sosiologi').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`LAPORAN_REKAP_HASIL_CBT_${cleanMapel}_${Date.now()}.pdf`);
}

export function generateIndividualStudentPdf(
  result: StudentResult,
  kop: KopSekolahConfig,
  questions: Question[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 12;

  // 1. KOP SEKOLAH
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text((kop.dinas || defaultKopSekolah.dinas).toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text((kop.namaSekolah || defaultKopSekolah.namaSekolah).toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(kop.alamat || defaultKopSekolah.alamat, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  // Line Divider
  doc.setLineWidth(0.6);
  doc.setDrawColor(15, 23, 42);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  // 2. TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LEMBAR HASIL JAWABAN SISWA (CBT GURUAI)', pageWidth / 2, currentY, { align: 'center' });
  currentY += 7;

  // Determine source questions array
  let sourceQuestions: Question[] = [];
  if (result.questionSnapshots && Array.isArray(result.questionSnapshots) && result.questionSnapshots.length > 0) {
    sourceQuestions = result.questionSnapshots;
  } else if (Array.isArray(questions) && questions.length > 0) {
    const active = questions.filter((q) => q.isActive !== false);
    sourceQuestions = active.length > 0 ? active : questions;
  }

  const totalExamQuestions = result.totalQuestions || sourceQuestions.length;
  const userAnswers = result.answers || [];

  const answeredItems: { question: Question; originalIndex: number; userAns: string }[] = [];
  let computedCorrect = 0;

  sourceQuestions.forEach((q, idx) => {
    const userAns = userAnswers[idx];
    const isAnswered = userAns !== null && userAns !== undefined && String(userAns).trim() !== '';

    const correctOpt = q.options.find((o) => o.isCorrect);
    const userOpt = isAnswered
      ? q.options.find((o) => o.id === userAns || o.text === userAns)
      : undefined;

    const isCorrect = userOpt ? userOpt.isCorrect === true : false;
    if (isCorrect) {
      computedCorrect++;
    }

    if (isAnswered) {
      answeredItems.push({
        question: q,
        originalIndex: idx + 1,
        userAns: String(userAns).trim(),
      });
    }
  });

  const totalAnsweredCount = answeredItems.length;
  const computedIncorrect = totalExamQuestions - computedCorrect;
  const displayScore = result.score !== undefined ? result.score : (totalExamQuestions > 0 ? Math.round((computedCorrect / totalExamQuestions) * 100) : 0);
  const isPassed = result.isPassed !== undefined ? result.isPassed : displayScore >= (result.kkm || 75);

  const cleanText = (str: string | null | undefined): string => {
    if (!str) return '';
    return String(str)
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // 3. STUDENT & EXAM DETAILS CARD
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');

  doc.text(`Nama Siswa         : ${result.studentInfo.name}`, 14, currentY);
  doc.text(`Nilai Akhir : ${displayScore}`, pageWidth - 70, currentY);
  currentY += 4.5;

  doc.text(`NIS / No. Peserta   : ${result.studentInfo.noPeserta}`, 14, currentY);
  doc.text(`Status      : ${isPassed ? 'LULUS (TUNTAS)' : 'BELUM TUNTAS (REMIDI)'}`, pageWidth - 70, currentY);
  currentY += 4.5;

  doc.text(`Mata Pelajaran      : ${result.studentInfo.mapel}`, 14, currentY);
  doc.text(`Hasil Jawaban: ${computedCorrect} Benar / ${computedIncorrect} Salah (${totalAnsweredCount}/${totalExamQuestions} Dikerjakan)`, pageWidth - 70, currentY);
  currentY += 4.5;

  doc.text(`Waktu Submit        : ${result.submittedAt || new Date().toLocaleString('id-ID')}`, 14, currentY);
  currentY += 7;

  // 4. DETAILED ANSWERS BREAKDOWN TABLE (HANYA SOAL YANG DIKERJAKAN)
  const tableHead = [['No', 'Soal Dikerjakan', 'Jawaban Siswa', 'Kunci Jawaban', 'Status']];

  let tableBody: (string | number)[][] = [];

  if (answeredItems.length === 0) {
    tableBody = [['-', 'Siswa tidak mengerjakan / menjawab soal sama sekali', '-', '-', 'KOSONG']];
  } else {
    tableBody = answeredItems.map((item, rowIdx) => {
      const q = item.question;
      const userAns = item.userAns;
      const correctOpt = q.options.find((o) => o.isCorrect);
      const userOpt = q.options.find((o) => o.id === userAns || o.text === userAns);

      const isCorrect = userOpt ? userOpt.isCorrect === true : false;

      const userOptText = userOpt ? cleanText(userOpt.text) : '';
      const userAnsText = `${userAns}. ${userOptText}`;

      const correctAnsText = correctOpt ? `${correctOpt.id}. ${cleanText(correctOpt.text)}` : '-';

      const rawQText = cleanText(q.question);
      const shortQ = rawQText.length > 120 ? rawQText.substring(0, 120) + '...' : rawQText;

      return [
        rowIdx + 1,
        shortQ,
        userAnsText,
        correctAnsText,
        isCorrect ? 'BENAR' : 'SALAH',
      ];
    });
  }

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 30, 30],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left' },
      2: { halign: 'left', cellWidth: 38 },
      3: { halign: 'left', cellWidth: 38 },
      4: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 4) {
        if (data.cell.raw === 'BENAR') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (data.cell.raw === 'SALAH') {
          data.cell.styles.textColor = [239, 68, 68];
        } else {
          data.cell.styles.textColor = [156, 163, 175];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 12;

  if (finalY > 230) {
    doc.addPage();
    finalY = 25;
  }

  // 5. SIGNATURE BLOCK
  const rightX = pageWidth - 65;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  const tglStr = kop.kotaTanggal || defaultKopSekolah.kotaTanggal;
  doc.text(tglStr, rightX, finalY);
  doc.text(kop.jabatanGuru || defaultKopSekolah.jabatanGuru, rightX, finalY + 4);

  const nameY = finalY + 4 + 20;
  doc.setFont('helvetica', 'bold');
  doc.text(kop.namaGuru || defaultKopSekolah.namaGuru, rightX, nameY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NIP. ${kop.nipGuru || defaultKopSekolah.nipGuru}`, rightX, nameY + 3.5);

  const cleanStudent = result.studentInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`LEMBAR_JAWABAN_${cleanStudent}_${Date.now()}.pdf`);
}
