'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastMessage } from '@/components/dashboard/types';

const iconMap: Record<ToastMessage['type'], React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  info: <Info className="w-4 h-4 text-blue-400" />,
};

const borderMap: Record<ToastMessage['type'], string> = {
  success: 'border-emerald-500/40',
  error: 'border-red-500/40',
  warning: 'border-amber-500/40',
  info: 'border-blue-500/40',
};

const bgMap: Record<ToastMessage['type'], string> = {
  success: 'bg-emerald-950/80',
  error: 'bg-red-950/80',
  warning: 'bg-amber-950/80',
  info: 'bg-blue-950/80',
};

/** Toast notification with auto-dismiss and slide-in animation */
export function Toast({ message, onClose }: { message: ToastMessage; onClose: () => void }) {
  useEffect(() => {
    const ms = message.duration ?? 4000;
    const timer = setTimeout(onClose, ms);
    return () => clearTimeout(timer);
  }, [message.duration, onClose]);

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${borderMap[message.type]} ${bgMap[message.type]}
      backdrop-blur-sm shadow-lg animate-[slideInRight_0.3s_ease-out] min-w-[280px] max-w-[400px]`}>
      <div className="mt-0.5 shrink-0">{iconMap[message.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-100">{message.title}</p>
        {message.message && <p className="text-xs text-gray-400 mt-0.5">{message.message}</p>}
      </div>
      <button onClick={onClose} className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/** Toast container that stacks toasts in top-right corner */
export function ToastContainer({ messages, onDismiss }: { messages: ToastMessage[]; onDismiss: (id: string) => void }) {
  if (messages.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {messages.map((m) => (
        <Toast key={m.id} message={m} onClose={() => onDismiss(m.id)} />
      ))}
    </div>
  );
}
