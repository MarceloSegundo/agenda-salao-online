import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../button/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  isDestructive = true
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-sm bg-white rounded-2xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="p-6 text-center space-y-4">
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <Dialog.Title className="text-xl font-bold text-slate-800">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-slate-500">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between gap-3">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" className="flex-1 bg-white">
                {cancelText}
              </Button>
            </Dialog.Close>

            <Button 
              type="button" 
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className={`flex-1 text-white ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {confirmText}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
