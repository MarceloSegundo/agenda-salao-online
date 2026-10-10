import * as Dialog from '@radix-ui/react-dialog';
import { X, CalendarPlus } from 'lucide-react';
import { Button, Input, Label } from '../../../shared/components';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '../../settings/api/services';
import { professionalsApi } from '../../settings/api/professionals';
import { tenantApi } from '../../settings/api/tenant';

interface NewAppointmentSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  onCreated?: (date: Date) => void;
}

export function NewAppointmentSheet({ isOpen, onOpenChange, date }: NewAppointmentSheetProps) {
  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getServices,
    enabled: isOpen
  });

  const { data: professionals } = useQuery({
    queryKey: ['professionals'],
    queryFn: professionalsApi.getProfessionals,
    enabled: isOpen
  });

  const { data: tenantSettings } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: tenantApi.getSettings,
    enabled: isOpen
  });

  const activeServices = services?.filter(s => s.active) || [];
  const activeProfessionals = professionals?.filter(p => p.active) || [];

  const timeSlots = useMemo(() => {
    // Mesma regra do backend: vale o horário do profissional no dia; sem ele, o do salão.
    // getDay() conta domingo como 0; a API usa 1 (segunda) a 7 (domingo).
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
    const professional = activeProfessionals.find(p => p.id === selectedProfessionalId);
    const hours =
      professional?.businessHours?.find(bh => bh.dayOfWeek === dayOfWeek) ??
      tenantSettings?.businessHours?.find(bh => bh.dayOfWeek === dayOfWeek);
    if (!hours || hours.isClosed) return [];

    const slots = [];
    const [openHour, openMin] = hours.openingTime.split(':').map(Number);
    const [closeHour, closeMin] = hours.closingTime.split(':').map(Number);

    const startMinutes = openHour * 60 + openMin;
    const endMinutes = closeHour * 60 + closeMin;
    const selectedService = activeServices.find(s => s.id === selectedServiceId);
    const duration = selectedService?.durationMinutes || 30;

    for (let time = startMinutes; time + duration <= endMinutes; time += 30) {
      const h = Math.floor(time / 60).toString().padStart(2, '0');
      const m = (time % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
    return slots;
  }, [date, tenantSettings, selectedServiceId, selectedProfessionalId, activeServices, activeProfessionals]);


  const handleNext = () => {
    if (step === 2 && !selectedServiceId) {
      alert('Selecione um serviço primeiro.');
      return;
    }
    if (step === 3 && !selectedProfessionalId) {
      alert('Selecione um profissional primeiro.');
      return;
    }
    setStep(s => Math.min(s + 1, 4));
  };
  
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  
  const handleFinish = () => {
    if (!selectedTime) {
      alert('Selecione um horário.');
      return;
    }
    // Submit data logic here...
    alert(`Agendado! Serviço: ${selectedServiceId}, Profissional: ${selectedProfessionalId}, Horário: ${selectedTime}`);
    onOpenChange(false);
    // Reset after close
    setTimeout(() => {
      setStep(1);
      setSelectedServiceId(null);
      setSelectedProfessionalId(null);
      setSelectedTime(null);
    }, 300);
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
                    {activeServices.length === 0 && (
                      <p className="text-sm text-slate-500">Nenhum serviço cadastrado.</p>
                    )}
                    {activeServices.map((s) => (
                      <button 
                        key={s.id} 
                        onClick={() => setSelectedServiceId(s.id)}
                        className={`text-left px-4 py-3 rounded-xl border transition-colors ${selectedServiceId === s.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-600 hover:bg-indigo-50'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-700">{s.name}</span>
                          <span className="text-xs text-slate-500">{s.durationMinutes} min</span>
                        </div>
                        <div className="text-sm text-slate-500 mt-1">R$ {s.price.toFixed(2)}</div>
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
                    {activeProfessionals.length === 0 && (
                      <p className="text-sm text-slate-500">Nenhum profissional cadastrado.</p>
                    )}
                    {activeProfessionals.map((p) => (
                      <button 
                        key={p.id} 
                        onClick={() => setSelectedProfessionalId(p.id)}
                        className={`text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3 ${selectedProfessionalId === p.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-600 hover:bg-indigo-50'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{p.name}</span>
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
                    {timeSlots.length === 0 && (
                      <p className="text-sm text-slate-500 col-span-3">Nenhum horário disponível para a duração do serviço selecionado nos horários de funcionamento do salão.</p>
                    )}
                    {timeSlots.map((t, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedTime(t)}
                        className={`px-2 py-3 rounded-xl border transition-colors text-center ${selectedTime === t ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 text-slate-700'}`}
                      >
                        <span className="font-bold">{t}</span>
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
