import { AlertCircle, RotateCw } from 'lucide-react';

interface LoadErrorProps {
  message: string;
  onRetry: () => void;
}

/** Falha ao carregar dados: não pode parecer lista vazia ("Agenda Livre"). */
export function LoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center text-center p-8 gap-3">
      <div className="bg-red-50 p-4 rounded-full">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-50"
      >
        <RotateCw className="w-4 h-4" />
        Tentar de novo
      </button>
    </div>
  );
}
