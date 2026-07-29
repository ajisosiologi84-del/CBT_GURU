import React, { useState, useEffect } from 'react';
import { Question, Option } from '../types';
import { formatQuestionText } from '../utils/questionFormatter';
import { Edit3, PlusCircle, CheckCircle2, Save, X, Image as ImageIcon, Upload, Trash2, Table, Link as LinkIcon, FileImage, Eye, Sparkles, Tag } from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  editingQuestion: Question | null;
  mapelList?: string[];
  defaultMapel?: string;
  defaultKodeGuru?: string;
  onSave: (questionData: {
    question: string;
    options: Option[];
    explanation: string;
    image?: string;
    mapel?: string;
    subTopik?: string;
    kodeGuru?: string;
    id?: number;
  }) => void;
  onClose: () => void;
  showAlert: (msg: string) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  editingQuestion,
  mapelList = ['Sosiologi', 'Geografi', 'Ekonomi', 'Sejarah', 'Bahasa Indonesia', 'Bahasa Inggris', 'Matematika'],
  defaultMapel = 'Sosiologi',
  defaultKodeGuru = 'GURU01',
  onSave,
  onClose,
  showAlert,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [selectedMapel, setSelectedMapel] = useState<string>(defaultMapel);
  const [subTopikText, setSubTopikText] = useState<string>('');
  const [kodeGuruText, setKodeGuruText] = useState<string>(defaultKodeGuru);
  const [imageString, setImageString] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [optionsText, setOptionsText] = useState<string[]>(['', '', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const labels = ['A', 'B', 'C', 'D', 'E'];

  useEffect(() => {
    setActiveTab('editor');
    if (editingQuestion) {
      setQuestionText(editingQuestion.question);
      setExplanationText(editingQuestion.explanation || '');
      setSelectedMapel(editingQuestion.mapel || defaultMapel);
      setSubTopikText(editingQuestion.subTopik || '');
      setKodeGuruText(editingQuestion.kodeGuru || defaultKodeGuru || 'GURU01');
      setImageString(editingQuestion.image || '');
      setImageUrlInput(editingQuestion.image && !editingQuestion.image.startsWith('data:') ? editingQuestion.image : '');
      const optTexts = labels.map((label, idx) => {
        const found = editingQuestion.options.find(o => o.id === label) || editingQuestion.options[idx];
        return found ? found.text : '';
      });
      setOptionsText(optTexts);

      const correctIdx = editingQuestion.options.findIndex(o => o.isCorrect);
      setCorrectIndex(correctIdx >= 0 ? correctIdx : 0);
    } else {
      setQuestionText('');
      setExplanationText('');
      setSelectedMapel(defaultMapel);
      setSubTopikText('');
      setKodeGuruText(defaultKodeGuru || 'GURU01');
      setImageString('');
      setImageUrlInput('');
      setOptionsText(['', '', '', '', '']);
      setCorrectIndex(0);
    }
  }, [editingQuestion, isOpen, defaultMapel, defaultKodeGuru]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('Format file harus berupa gambar (JPG, PNG, GIF, WEBP)!');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showAlert('Ukuran file gambar terlalu besar (Maksimal 8 MB)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;
      if (rawResult) {
        // Compress and resize image using HTML5 canvas
        const img = new Image();
        img.onload = () => {
          const maxDim = 900;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            setImageString(compressed);
          } else {
            setImageString(rawResult);
          }
          showAlert('Gambar/tabel berhasil diunggah!');
        };
        img.onerror = () => {
          setImageString(rawResult);
          showAlert('Gambar/tabel berhasil diunggah!');
        };
        img.src = rawResult;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInsertTableTemplate = () => {
    const tableHtml = `
<table class="w-full border-collapse border border-slate-300 my-3 text-xs sm:text-sm">
  <thead>
    <tr class="bg-slate-100 font-bold text-slate-800">
      <th class="border border-slate-300 p-2 text-center">No</th>
      <th class="border border-slate-300 p-2 text-left">Faktor / Kategori</th>
      <th class="border border-slate-300 p-2 text-left">Keterangan</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-slate-300 p-2 text-center">1</td>
      <td class="border border-slate-300 p-2">Faktor Internal</td>
      <td class="border border-slate-300 p-2">Penemuan baru, konflik sosial</td>
    </tr>
    <tr>
      <td class="border border-slate-300 p-2 text-center">2</td>
      <td class="border border-slate-300 p-2">Faktor Eksternal</td>
      <td class="border border-slate-300 p-2">Pengaruh budaya asing, bencana alam</td>
    </tr>
  </tbody>
</table>
`.trim();

    setQuestionText((prev) => prev ? `${prev}\n\n${tableHtml}` : tableHtml);
    showAlert('Format Tabel HTML berhasil disisipkan ke dalam teks pertanyaan!');
  };

  const handleApplyUrl = () => {
    if (!imageUrlInput.trim()) {
      showAlert('Masukkan URL gambar yang valid!');
      return;
    }
    setImageString(imageUrlInput.trim());
    setShowUrlInput(false);
    showAlert('URL gambar diterapkan!');
  };

  const handleSave = () => {
    const trimmedQuestion = questionText.trim();
    if (!trimmedQuestion) {
      showAlert('Teks pertanyaan tidak boleh kosong!');
      return;
    }

    for (let i = 0; i < 5; i++) {
      if (!optionsText[i].trim()) {
        showAlert(`Pilihan ${labels[i]} tidak boleh kosong!`);
        return;
      }
    }

    const options: Option[] = labels.map((label, i) => ({
      id: label,
      text: optionsText[i].trim(),
      isCorrect: i === correctIndex,
    }));

    onSave({
      id: editingQuestion?.id,
      question: formatQuestionText(trimmedQuestion),
      options,
      explanation: explanationText.trim() || 'Tidak ada pembahasan.',
      image: imageString.trim() || undefined,
      mapel: selectedMapel,
      subTopik: subTopikText.trim() || undefined,
      kodeGuru: kodeGuruText.trim().toUpperCase() || defaultKodeGuru || 'GURU01',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-slate-900 text-white p-4 sm:p-5 font-bold text-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
          <span className="flex items-center gap-2">
            {editingQuestion ? <Edit3 className="w-5 h-5 text-sky-400" /> : <PlusCircle className="w-5 h-5 text-sky-400" />}
            {editingQuestion ? 'Edit Soal' : 'Tambah Soal Baru'}
          </span>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Form Input
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview Live
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {activeTab === 'editor' ? (
          <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-gray-800 mb-1.5 text-sm">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedMapel}
                  onChange={(e) => setSelectedMapel(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-blue-500 focus:outline-none text-sm font-bold bg-white cursor-pointer"
                >
                  {mapelList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1.5 text-sm flex items-center justify-between">
                  <span>Kode Guru</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-black">Penanda Unik</span>
                </label>
                <input
                  type="text"
                  value={kodeGuruText}
                  onChange={(e) => setKodeGuruText(e.target.value.toUpperCase())}
                  placeholder="Contoh: GURU01"
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-blue-500 focus:outline-none text-sm font-bold bg-white uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1.5 text-sm flex items-center justify-between">
                  <span>Sub Topik / Materi</span>
                  <span className="text-xs font-normal text-gray-400">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={subTopikText}
                  onChange={(e) => setSubTopikText(e.target.value)}
                  placeholder="Contoh: Perubahan Sosial"
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-blue-500 focus:outline-none text-sm font-medium bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-bold text-gray-800 text-sm">
                  Teks Pertanyaan <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleInsertTableTemplate}
                  className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Sisipkan struktur tabel HTML ke teks pertanyaan"
                >
                  <Table className="w-3.5 h-3.5 text-sky-600" /> Sisipkan Tabel HTML
                </button>
              </div>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-3 h-28 focus:border-blue-500 focus:outline-none resize-none text-sm transition-colors"
                placeholder="Masukkan teks pertanyaan lengkap..."
              />
            </div>

            {/* MENU TAMBAH GAMBAR / TABEL (JPG/PNG) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-600" /> Lampiran Gambar / Tabel / Diagram Soal (JPG / PNG)
                </label>
                {imageString && (
                  <button
                    type="button"
                    onClick={() => setImageString('')}
                    className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-red-200 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Gambar
                  </button>
                )}
              </div>

              {imageString ? (
                <div className="relative group bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center">
                  <img
                    src={imageString}
                    alt="Lampiran Soal"
                    className="max-h-56 w-auto object-contain rounded-lg border border-slate-100 shadow-xs mb-2"
                  />
                  <span className="text-[11px] text-slate-500 font-semibold">
                    ✓ Gambar terlampir dan akan ditampilkan pada soal
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-white hover:bg-sky-50/50 transition-all rounded-xl p-4 text-center cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-600">
                      <div className="p-2.5 bg-sky-100 text-sky-600 rounded-full">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-xs text-slate-800">
                        Klik atau Drag & Drop Gambar / Tabel di sini
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Mendukung format <b>JPG, PNG, WEBP, GIF</b> (Maksimal 8 MB)
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> {showUrlInput ? 'Sembunyikan Input URL' : 'Atau gunakan URL Link Gambar'}
                    </button>
                  </div>

                  {showUrlInput && (
                    <div className="flex gap-2 pt-1 animate-fade-in">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/gambar-soal.png"
                        className="flex-1 border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Terapkan
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                Pilihan Jawaban (Tandai <CheckCircle2 className="w-4 h-4 text-emerald-500" /> pada jawaban yang benar)
              </label>

              <div className="space-y-3">
                {labels.map((label, idx) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="mt-2.5 flex items-center">
                      <input
                        type="radio"
                        name="q-edit-correct"
                        checked={correctIndex === idx}
                        onChange={() => setCorrectIndex(idx)}
                        className="w-5 h-5 cursor-pointer text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <div className="absolute left-3 top-2.5 font-bold text-gray-400 text-sm">
                        {label}.
                      </div>
                      <input
                        type="text"
                        value={optionsText[idx]}
                        onChange={(e) => {
                          const newOpts = [...optionsText];
                          newOpts[idx] = e.target.value;
                          setOptionsText(newOpts);
                        }}
                        className="w-full border-2 border-gray-200 rounded-lg py-2 pl-9 pr-3 focus:border-blue-500 focus:outline-none text-sm bg-white"
                        placeholder={`Masukkan pilihan ${label}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-2 text-sm">
                Pembahasan Ilmiah (Analisis HOTS)
              </label>
              <textarea
                value={explanationText}
                onChange={(e) => setExplanationText(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-3 h-24 focus:border-blue-500 focus:outline-none resize-none text-sm transition-colors"
                placeholder="Masukkan penjelasan mengapa jawaban tersebut benar..."
              />
            </div>
          </div>
        ) : (
          /* TAB PREVIEW LIVE */
          <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar bg-slate-100/60">
            <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl text-xs text-sky-900 font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Berikut adalah simulasi tampilan soal yang akan dilihat siswa saat ujian:</span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-sky-100 text-sky-800 text-xs font-extrabold px-3 py-1 rounded-lg border border-sky-200">
                Mata Pelajaran: {selectedMapel}
              </span>
              {subTopikText.trim() && (
                <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-lg border border-amber-300 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-600" /> Sub Topik / Materi: {subTopikText.trim()}
                </span>
              )}
            </div>

            {/* Lampiran Gambar jika ada */}
            {imageString && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-center shadow-xs">
                <img
                  src={imageString}
                  alt="Lampiran Soal"
                  className="max-h-72 w-auto object-contain rounded-xl border border-slate-200"
                />
              </div>
            )}

            {/* Teks Pertanyaan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                Pertanyaan
              </p>
              <div
                className="text-base text-slate-900 font-semibold leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: formatQuestionText(questionText) || '<i class="text-slate-400">(Teks pertanyaan belum diisi)</i>' }}
              />
            </div>

            {/* Pilihan Jawaban */}
            <div className="space-y-2.5">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Pilihan Jawaban
              </p>
              {labels.map((label, idx) => {
                const isCorrect = idx === correctIndex;
                const text = optionsText[idx] || `(Pilihan ${label} belum diisi)`;
                return (
                  <div
                    key={label}
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {label}
                    </span>
                    <div className="flex-1 pt-1 text-sm">{text}</div>
                    {isCorrect && (
                      <span className="bg-emerald-200 text-emerald-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" /> KUNCI JAWABAN
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pembahasan */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1">
              <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Pembahasan Soal
              </p>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                {explanationText || 'Tidak ada pembahasan.'}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2 text-sm active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Simpan Soal
          </button>
        </div>
      </div>
    </div>
  );
};

