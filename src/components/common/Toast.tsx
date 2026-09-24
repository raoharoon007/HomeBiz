import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgStyles = {
    success: 'bg-[#003527] text-white border-[#005a43] shadow-emerald-950/20',
    error: 'bg-[#ba1a1a] text-white border-[#93000a] shadow-red-950/20',
    warning: 'bg-[#735c00] text-white border-[#584500] shadow-amber-950/20',
    info: 'bg-[#1a1c1c] text-white border-[#3d4543] shadow-slate-950/20',
  }[type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
  }[type];

  return (
    <div className="fixed top-6 right-6 z-[9999] max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl backdrop-blur-md ${bgStyles}`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <p className="text-xs sm:text-sm font-semibold tracking-wide flex-1">{message}</p>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white/80 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
