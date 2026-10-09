import * as Dialog from '@radix-ui/react-dialog';
import { X, Users } from 'lucide-react';
import { Button, Input, Label } from '../../../shared/components';
import { useState, useEffect } from 'react';
import type { ProfessionalData, ProfessionalRequest } from '../api/professionals';
import type { BusinessHour } from '../api/tenant';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

const DEFAULT_HOURS: BusinessHour[] = DAYS_OF_WEEK.map(day => ({
  dayOfWeek: day.value,
  openingTime: '08:00',
  closingTime: '18:00',
  isClosed: day.value > 5,
}));

interface ProfessionalFormSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ProfessionalData | null;
  onSubmit: (data: ProfessionalRequest) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ProfessionalFormSheet({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
  error
}: ProfessionalFormSheetProps) {
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [active, setActive] = useState(true);
  const [useCustomHours, setUseCustomHours] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(DEFAULT_HOURS);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setSpecialization(initialData.specialization);
        setActive(initialData.active);
        
        if (initialData.businessHours && initialData.businessHours.length > 0) {
          setUseCustomHours(true);
          setBusinessHours(initialData.businessHours.map(bh => ({
            ...bh,
            openingTime: bh.openingTime.substring(0, 5),
            closingTime: bh.closingTime.substring(0, 5)
          })));
        } else {
          setUseCustomHours(false);
          setBusinessHours(DEFAULT_HOURS);
        }
      } else {
        setName('');
        setSpecialization('');
        setActive(true);
        setUseCustomHours(false);
        setBusinessHours(DEFAULT_HOURS);
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      specialization,
      active,
      businessHours: useCustomHours ? businessHours.map(bh => ({
        ...bh,
        openingTime: `${bh.openingTime}:00`,
        closingTime: `${bh.closingTime}:00`
      })) : null
    });
  };

  const updateDay = (dayOfWeek: number, field: keyof BusinessHour, value: any) => {
    setBusinessHours(prev => 
      prev.map(bh => bh.dayOfWeek === dayOfWeek ? { ...bh, [field]: value } : bh)
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-0 right-0 bottom-0 z-[70] mt-24 h-[85vh] flex flex-col bg-white rounded-t-3xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
          <div className="flex-1 overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100 z-10">
              <Dialog.Title className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {initialData ? 'Editar Profissional' : 'Novo Profissional'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <form id="professional-form" onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Profissional</Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Especialidade</Label>
                <Input
                  id="specialization"
                  placeholder="Ex: Barbeiro, Cabeleireira"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                />
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
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <Label htmlFor="active" className="text-slate-600 cursor-pointer">
                    Atendente Ativo
                  </Label>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-800">Horários Personalizados</h3>
                    <p className="text-xs text-slate-500">Defina horários específicos para este profissional</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={useCustomHours}
                      onChange={(e) => setUseCustomHours(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {useCustomHours && (
                  <div className="space-y-4 pt-2 divide-y divide-slate-100 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    {DAYS_OF_WEEK.map(day => {
                      const bh = businessHours.find(h => h.dayOfWeek === day.value) || {
                        dayOfWeek: day.value,
                        openingTime: '08:00',
                        closingTime: '18:00',
                        isClosed: false
                      };

                      return (
                        <div key={day.value} className="pt-3 first:pt-0 flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`prof-closed-${day.value}`}
                              checked={!bh.isClosed}
                              onChange={(e) => updateDay(day.value, 'isClosed', !e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-600"
                            />
                            <label htmlFor={`prof-closed-${day.value}`} className={`text-sm font-medium ${bh.isClosed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {day.label}
                            </label>
                          </div>
                          
                          {!bh.isClosed && (
                            <div className="flex items-center gap-2 pl-7">
                              <Input
                                type="time"
                                value={bh.openingTime}
                                onChange={(e) => updateDay(day.value, 'openingTime', e.target.value)}
                                className="w-28 text-sm px-2 py-1 h-8"
                                required
                              />
                              <span className="text-slate-400 text-sm">até</span>
                              <Input
                                type="time"
                                value={bh.closingTime}
                                onChange={(e) => updateDay(day.value, 'closingTime', e.target.value)}
                                className="w-28 text-sm px-2 py-1 h-8"
                                required
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex justify-between gap-3 pb-safe">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" className="flex-1">Cancelar</Button>
            </Dialog.Close>

            <Button type="submit" form="professional-form" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
