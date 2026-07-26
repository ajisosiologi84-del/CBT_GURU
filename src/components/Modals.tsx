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

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl transform scale-100 transition-transform border border-red-100">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4 text-4xl shadow-inner">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Peringatan Pelanggaran!</h2>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {customMsg || "Sistem mendeteksi Anda meninggalkan layar ujian atau mencoba melakukan kecurangan. Ini adalah pelanggaran tata tertib."}
        </p>
        <div className="bg-red-50 text-red-800 p-3 rounded-xl font-bold mb-6 border border-red-200 flex items-center justify-center gap-2">
          <span>Peringatan ke-<span className="text-xl font-black text-red-600">{warningCount}</span> dari {maxWarnings}</span>
        </div>
        <p className="text-xs text-gray-500 mb-6 italic">
          Jika mencapai {maxWarnings} kali pelanggaran, ujian akan dihentikan secara otomatis.
        </p>
        <button
          onClick={onUnderstand}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          Saya Mengerti, Kembali ke Ujian
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
