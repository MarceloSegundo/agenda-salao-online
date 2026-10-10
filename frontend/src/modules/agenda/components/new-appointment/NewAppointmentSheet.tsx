import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, X } from 'lucide-react';
import { useState } from 'react';
import { Button, toast } from '../../../../shared/components';
import { getApiErrorMessage } from '../../../../shared/api-client/errors';
import { formatDayLabel, toApiDate } from '../../../../shared/utils/date';
import type { Customer } from '../../../customers/api/customers';
import { professionalsApi } from '../../../settings/api/professionals';
import { servicesApi } from '../../../settings/api/services';
import type { ServiceData } from '../../../settings/api/services';
import { appointmentsApi } from '../../api/appointments';
import type { AvailableSlot } from '../../api/appointments';
import { CustomerStep } from './CustomerStep';
import { ANY_PROFESSIONAL, ProfessionalStep } from './ProfessionalStep';
import { ServiceStep } from './ServiceStep';
import { WhenStep } from './WhenStep';

interface NewAppointmentSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate: Date;
  onCreated: (date: Date) => void;
}

const STEPS = 4;

export function NewAppointmentSheet({ isOpen, onOpenChange, initialDate, onCreated }: NewAppointmentSheetProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-0 right-0 bottom-0 z-[70] mt-24 h-[85vh] flex flex-col bg-white rounded-t-3xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
          {/* O conteúdo desmonta ao fechar: cada abertura começa do zero */}
          <SheetBody
            initialDate={initialDate}
            onCreated={(date) => {
              onCreated(date);
              onOpenChange(false);
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SheetBody({ initialDate, onCreated }: { initialDate: Date; onCreated: (date: Date) => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [service, setService] = useState<ServiceData | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(initialDate);
  const [slot, setSlot] = useState<AvailableSlot | null>(null);

  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: servicesApi.getServices });
  const { data: professionals = [] } = useQuery({ queryKey: ['professionals'], queryFn: professionalsApi.getProfessionals });
  const activeServices = services.filter((s) => s.active);
  const activeProfessionals = professionals.filter((p) => p.active);

  const isAny = professionalId === ANY_PROFESSIONAL;
  const day = toApiDate(date);
  const availabilityKey = ['availability', day, service?.id, professionalId];
  const { data: slots = [], isFetching: loadingSlots } = useQuery({
    queryKey: availabilityKey,
    queryFn: () =>
      appointmentsApi.availability({
        date: day,
        serviceId: service!.id,
        professionalId: isAny ? undefined : professionalId!,
      }),
    enabled: step === STEPS && !!service && !!professionalId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      appointmentsApi.create({
        customerId: customer!.id,
        serviceId: service!.id,
        professionalId: slot!.professionalId,
        startTime: `${day}T${slot!.time}:00`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      toast.success('Agendamento criado.');
      onCreated(date);
    },
    onError: (error) => {
      const conflict = (error as { response?: { status?: number } }).response?.status === 409;
      toast.error(getApiErrorMessage(error, 'Não foi possível criar o agendamento.'));
      if (conflict) {
        setSlot(null);
        queryClient.invalidateQueries({ queryKey: availabilityKey });
      }
    },
  });

  const canAdvance = [customer, service, professionalId, slot][step - 1] != null;

  // Trocar serviço, profissional ou dia invalida o horário escolhido
  const chooseService = (value: ServiceData) => { setService(value); setSlot(null); };
  const chooseProfessional = (value: string) => { setProfessionalId(value); setSlot(null); };
  const chooseDate = (value: Date) => { setDate(value); setSlot(null); };

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100 z-10">
          <Dialog.Title className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-indigo-600" />
            Novo Agendamento
          </Dialog.Title>
          <Dialog.Description className="sr-only">Cliente, serviço, profissional, dia e horário</Dialog.Description>
          <Dialog.Close asChild>
            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors" aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
          </Dialog.Close>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-8" aria-label={`Etapa ${step} de ${STEPS}`}>
            {Array.from({ length: STEPS }, (_, i) => i + 1).map((i) => (
              <div key={i} className="flex-1 flex items-center last:flex-none">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i}
                </div>
                {i < STEPS && (
                  <div className={`h-1 flex-1 mx-2 rounded-full transition-colors ${step > i ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && <CustomerStep selected={customer} onSelect={setCustomer} />}
          {step === 2 && <ServiceStep services={activeServices} selected={service} onSelect={chooseService} />}
          {step === 3 && (
            <ProfessionalStep professionals={activeProfessionals} selected={professionalId} onSelect={chooseProfessional} />
          )}
          {step === 4 && (
            <WhenStep
              date={date}
              onDateChange={chooseDate}
              slots={slots}
              isLoading={loadingSlots}
              selectedSlot={slot}
              onSelectSlot={setSlot}
              showProfessional={isAny}
            />
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-white space-y-3 pb-safe">
        {step === STEPS && slot && customer && service && (
          <p className="text-sm text-slate-600 text-center">
            <span className="font-semibold text-slate-800">{customer.name}</span> · {service.name} · {slot.professionalName} ·{' '}
            {formatDayLabel(date)} às {slot.time}
          </p>
        )}
        <div className="flex justify-between gap-3">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">Voltar</Button>
          ) : (
            <Dialog.Close asChild>
              <Button variant="outline" className="flex-1">Cancelar</Button>
            </Dialog.Close>
          )}

          {step < STEPS ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance} className="flex-1">Próximo</Button>
          ) : (
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!slot || createMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {createMutation.isPending ? 'Salvando...' : 'Confirmar Agendamento'}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
