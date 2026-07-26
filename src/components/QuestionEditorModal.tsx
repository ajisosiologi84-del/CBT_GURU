import React, { useState, useEffect } from 'react';
import { Question, Option } from '../types';
import { Edit3, PlusCircle, CheckCircle2, Save, X } from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  editingQuestion: Question | null;
  mapelList?: string[];
  defaultMapel?: string;
  onSave: (questionData: {
    question: string;
    options: Option[];
    explanation: string;
    mapel?: string;
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
  onSave,
  onClose,
  showAlert,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [selectedMapel, setSelectedMapel] = useState<string>(defaultMapel);
  const [optionsText, setOptionsText] = useState<string[]>(['', '', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);

  const labels = ['A', 'B', 'C', 'D', 'E'];

  useEffect(() => {
    if (editingQuestion) {
      setQuestionText(editingQuestion.question);
      setExplanationText(editingQuestion.explanation || '');
      setSelectedMapel(editingQuestion.mapel || defaultMapel);
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
      setOptionsText(['', '', '', '', '']);
      setCorrectIndex(0);
    }
  }, [editingQuestion, isOpen, defaultMapel]);

  if (!isOpen) return null;

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
      question: trimmedQuestion,
      options,
      explanation: explanationText.trim() || 'Tidak ada pembahasan.',
      mapel: selectedMapel,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-slate-900 text-white p-5 font-bold text-lg flex justify-between items-center shrink-0">
          <span className="flex items-center gap-2">
            {editingQuestion ? <Edit3 className="w-5 h-5 text-blue-400" /> : <PlusCircle className="w-5 h-5 text-blue-400" />}
            {editingQuestion ? 'Edit Soal HOTS' : 'Tambah Soal Baru'}
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
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
            <label className="block font-bold text-gray-800 mb-2 text-sm">
              Teks Pertanyaan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-3 h-28 focus:border-blue-500 focus:outline-none resize-none text-sm transition-colors"
              placeholder="Masukkan teks pertanyaan lengkap..."
            />
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

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2 text-sm active:scale-95"
          >
            <Save className="w-4 h-4" /> Simpan Soal
          </button>
        </div>
      </div>
    </div>
  );
};
