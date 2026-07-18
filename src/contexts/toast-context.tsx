'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { XIcon } from '@/components/icons';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm font-medium shadow-xl animate-fade-in-up ${
              t.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 backdrop-blur-md' :
              t.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/20 backdrop-blur-md' :
              'bg-[#12121a] text-white border border-white/[0.08]'
            }`}
          >
            <span>{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="opacity-50 hover:opacity-100 transition-opacity"
            >
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
