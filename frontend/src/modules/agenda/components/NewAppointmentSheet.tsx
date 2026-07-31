import * as Dialog from '@radix-ui/react-dialog';
import { X, CalendarPlus } from 'lucide-react';
import { Button, Input, Label } from '../../../shared/components';
import { useState } from 'react';

interface NewAppointmentSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAppointmentSheet({ isOpen, onOpenChange }: NewAppointmentSheetProps) {
  const [step, setStep] = useState(1);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  const handleFinish = () => {
    // Submit data
    onOpenChange(false);
    // Reset after close
    setTimeout(() => setStep(1), 300);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-0 right-0 bottom-0 z-[70] mt-24 h-[85vh] flex flex-col bg-white rounded-t-3xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
          <div className="flex-1 overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100 z-10">
              <Dialog.Title className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-indigo-600" />
                Novo Agendamento
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="p-6">
              {/* Stepper Progress */}
              <div className="flex items-center justify-between mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex-1 flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step >= i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {i}
                    </div>
                    {i < 4 && (
                      <div className={`h-1 flex-1 mx-2 rounded-full transition-colors ${
                        step > i ? 'bg-indigo-600' : 'bg-slate-100'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Cliente */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Quem é o cliente?</h3>
                  <div className="space-y-2">
                    <Label>Buscar Cliente</Label>
                    <Input placeholder="Nome ou telefone..." />
                  </div>
                  <div className="relative flex py-4 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">ou</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>
                  <Button variant="outline" className="w-full">Cadastrar Novo Cliente</Button>
                </div>
              )}

              {/* Step 2: Serviço */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Qual o serviço?</h3>
                  <div className="grid gap-3">
                    {/* Mock Services */}
                    {['Corte Masculino (30min)', 'Barba (20min)', 'Corte + Barba (50min)'].map((s, idx) => (
                      <button key={idx} className="text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-colors">
                        <span className="font-medium text-slate-700">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Profissional */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Com qual profissional?</h3>
                  <div className="grid gap-3">
                    {/* Mock Professionals */}
                    {['João Silva', 'Maria Souza', 'Qualquer profissional'].map((p, idx) => (
                      <button key={idx} className="text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {p.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Data e Hora */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Quando?</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Mock Times */}
                    {['09:00', '09:30', '10:00', '14:00', '14:30', '15:00'].map((t, idx) => (
                      <button key={idx} className="px-2 py-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-colors text-center">
                        <span className="font-bold text-slate-700">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex justify-between gap-3 pb-safe">
            {step > 1 ? (
              <Button variant="outline" onClick={handlePrev} className="flex-1">Voltar</Button>
            ) : (
              <Dialog.Close asChild>
                <Button variant="outline" className="flex-1">Cancelar</Button>
              </Dialog.Close>
            )}

            {step < 4 ? (
              <Button onClick={handleNext} className="flex-1">Próximo</Button>
            ) : (
              <Button onClick={handleFinish} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Confirmar Agendamento</Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
