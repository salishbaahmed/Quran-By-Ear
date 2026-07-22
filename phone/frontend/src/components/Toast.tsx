import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
              isError
                ? 'bg-red-950/90 border-red-800 text-red-100'
                : isSuccess
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-100'
                : 'bg-slate-800/95 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isError && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {!isError && !isSuccess && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
              <span className="text-xs sm:text-sm font-medium leading-snug truncate">
                {toast.text}
              </span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 active:scale-95 text-slate-400 hover:text-white shrink-0"
              aria-label="Close message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
