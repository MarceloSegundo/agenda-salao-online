import * as Dialog from '@radix-ui/react-dialog';
import { X, Scissors } from 'lucide-react';
import { Button, Input, Label } from '../../../shared/components';
import { useState, useEffect } from 'react';
import type { ServiceData, ServiceRequest } from '../api/services';

interface ServiceFormSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ServiceData | null;
  onSubmit: (data: ServiceRequest) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ServiceFormSheet({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
  error
}: ServiceFormSheetProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [requiresOnlinePayment, setRequiresOnlinePayment] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setPrice(initialData.price.toFixed(2).replace('.', ','));
        setDurationMinutes(initialData.durationMinutes.toString());
        setRequiresOnlinePayment(initialData.requiresOnlinePayment);
        setActive(initialData.active);
      } else {
        setName('');
        setPrice('');
        setDurationMinutes('');
        setRequiresOnlinePayment(false);
        setActive(true);
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      price: parseFloat(price.replace('.', '').replace(',', '.')),
      durationMinutes: parseInt(durationMinutes, 10),
      requiresOnlinePayment,
      active
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-0 right-0 bottom-0 z-[70] mt-24 h-[85vh] flex flex-col bg-white rounded-t-3xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
          <div className="flex-1 overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100 z-10">
              <Dialog.Title className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-rose-600" />
                {initialData ? 'Editar Serviço' : 'Novo Serviço'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <form id="service-form" onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Serviço</Label>
                <Input
                  id="name"
                  placeholder="Ex: Corte Masculino"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 45,00"
                  value={price}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    if (rawValue) {
                      const numberValue = parseInt(rawValue, 10) / 100;
                      setPrice(numberValue.toFixed(2).replace('.', ','));
                    } else {
                      setPrice('');
                    }
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração Média (Minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="Ex: 30"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="requiresOnlinePayment"
                  checked={requiresOnlinePayment}
                  onChange={(e) => setRequiresOnlinePayment(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <Label htmlFor="requiresOnlinePayment" className="text-slate-600 cursor-pointer">
                  Exige pagamento online antecipado
                </Label>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {initialData && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <Label htmlFor="active" className="text-slate-600 cursor-pointer">
                    Serviço Ativo
                  </Label>
                </div>
              )}
            </form>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex justify-between gap-3 pb-safe">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" className="flex-1">Cancelar</Button>
            </Dialog.Close>

            <Button type="submit" form="service-form" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Serviço'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
