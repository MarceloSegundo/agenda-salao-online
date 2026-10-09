import { create } from 'zustand';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

type ToastVariant = 'success' | 'error';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  show: (variant: ToastVariant, message: string) => void;
  dismiss: (id: number) => void;
}

const DURATION_MS = 3500;
let nextId = 1;

const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  show: (variant, message) => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, variant, message }] });
    setTimeout(() => get().dismiss(id), DURATION_MS);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Avisos curtos e não bloqueantes. Use no lugar de window.alert. */
export const toast = {
  success: (message: string) => useToastStore.getState().show('success', message),
  error: (message: string) => useToastStore.getState().show('error', message),
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.variant === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto w-full max-w-sm flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-in fade-in slide-in-from-top-4',
            t.variant === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          {t.variant === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <p className="flex-1 text-sm font-medium">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Fechar aviso"
            className="text-current opacity-60 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
