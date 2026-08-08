import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const iconMap = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
} as const;

const colorMap = {
  success: {
    container: 'bg-white border-emerald-200 shadow-emerald-100/50',
    iconBg: 'bg-emerald-50 text-emerald-600',
    title: 'text-emerald-900',
    desc: 'text-emerald-700',
  },
  error: {
    container: 'bg-white border-red-200 shadow-red-100/50',
    iconBg: 'bg-red-50 text-red-600',
    title: 'text-red-900',
    desc: 'text-red-700',
  },
  warning: {
    container: 'bg-white border-amber-200 shadow-amber-100/50',
    iconBg: 'bg-amber-50 text-amber-600',
    title: 'text-amber-900',
    desc: 'text-amber-700',
  },
  info: {
    container: 'bg-white border-indigo-200 shadow-indigo-100/50',
    iconBg: 'bg-indigo-50 text-indigo-600',
    title: 'text-indigo-900',
    desc: 'text-indigo-700',
  },
} as const;

const defaultTitles = {
  success: 'Berhasil',
  error: 'Terjadi Kesalahan',
  warning: 'Perhatian',
  info: 'Informasi',
} as const;

export function ToastNotification({
  toast,
  onDismiss,
}: ToastNotificationProps) {
  const Icon = iconMap[toast.type];
  const colors = colorMap[toast.type];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95, filter: 'blur(4px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 80, scale: 0.95, filter: 'blur(4px)' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative w-[calc(100%-1rem)] sm:w-96 rounded-2xl shadow-xl border px-4 py-3.5 flex items-start gap-3 overflow-hidden',
        colors.container,
      )}
      role='alert'
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          delay: 0.08,
          type: 'spring',
          stiffness: 260,
          damping: 22,
        }}
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          colors.iconBg,
        )}
      >
        <Icon className='w-5 h-5' />
      </motion.div>
      <div className='flex-1 min-w-0'>
        <p className={cn('text-sm font-bold', colors.title)}>
          {toast.title ?? defaultTitles[toast.type]}
        </p>
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className={cn('text-xs mt-0.5 leading-relaxed', colors.desc)}
        >
          {toast.message}
        </motion.p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className='flex-shrink-0 p-1 -m-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors'
      >
        <X className='w-4 h-4' />
      </button>
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{
          duration: (toast.duration ?? 4000) / 1000,
          ease: 'linear',
        }}
        style={{
          transformOrigin: 'left',
          background:
            toast.type === 'success'
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : toast.type === 'error'
                ? 'linear-gradient(90deg, #ef4444, #f87171)'
                : toast.type === 'warning'
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                  : 'linear-gradient(90deg, #6366f1, #818cf8)',
        }}
        className='absolute left-0 bottom-0 h-0.5 w-full opacity-70'
      />
    </motion.li>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className='fixed top-[calc(max(env(safe-area-inset-top),0.5rem)+0.5rem)] sm:top-4 right-4 z-[100] w-[calc(100%-1rem)] sm:w-auto pointer-events-none'>
      <ul className='flex flex-col gap-2.5 pointer-events-auto items-end'>
        <AnimatePresence mode='popLayout'>
          {toasts.map((toast) => (
            <ToastNotification
              key={toast.id}
              toast={toast}
              onDismiss={onDismiss}
            />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export function useToastSystem() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const show = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const duration = toast.duration ?? 4000;
    setToasts((prev) => [...prev, { ...toast, id, duration }]);
    window.setTimeout(() => dismiss(id), duration);
  };

  return { toasts, show, dismiss };
}
