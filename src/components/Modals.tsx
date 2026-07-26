import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

interface WarningModalProps {
  isOpen: boolean;
  warningCount: number;
  maxWarnings: number;
  customMsg?: string | null;
  onUnderstand: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  warningCount,
  maxWarnings,
  customMsg,
  onUnderstand,
}) => {
  if (!isOpen) return null;

  const getWarningBadgeColor = (count: number) => {
    if (count === 1) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (count === 2) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl transform scale-100 transition-transform border-2 border-red-200 animate-bounce-subtle">
        <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-4 shadow-inner animate-pulse">
          <AlertTriangle className="w-10 h-10 text-red-600 animate-spin-slow" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 bg-red-600 text-white shadow-sm animate-pulse">
          Deteksi Kecurangan
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Peringatan #{warningCount}</h2>
        <p className="text-gray-600 mb-5 text-sm leading-relaxed font-medium">
          {customMsg || "Sistem mendeteksi Anda meninggalkan layar ujian, berpindah tab, atau mencoba membuka aplikasi lain. Tindakan ini dicatat sebagai kecurangan."}
        </p>
        <div className={`p-3.5 rounded-2xl font-bold mb-5 border-2 flex items-center justify-center gap-2 ${getWarningBadgeColor(warningCount)}`}>
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Status Peringatan: <strong className="text-lg font-black">{warningCount}</strong> dari {maxWarnings} kali</span>
        </div>
        <p className="text-xs text-slate-500 mb-6 font-semibold italic">
          {warningCount >= 2 
            ? '⚠️ PERINGATAN KERAS! Pelanggaran berikutnya akan otomatis menghentikan ujian.'
            : `Harap tetap fokus pada halaman ujian sampai selesai.`}
        </p>
        <button
          onClick={onUnderstand}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] cursor-pointer text-sm tracking-wide"
        >
          Saya Mengerti, Kembali ke Ujian ({maxWarnings - warningCount} kesempatan tersisa)
        </button>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Ya, Selesai",
  cancelText = "Batal",
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } font-bold rounded-xl transition-all shadow-md text-sm active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center border border-gray-100">
        <div className="text-amber-500 mb-3 flex justify-center">
          <Info className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Informasi</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};
