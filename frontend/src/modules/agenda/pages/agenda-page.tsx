import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { AgendaDayCarousel } from '../components/AgendaDayCarousel';
import { AgendaList } from '../components/AgendaList';
import { NewAppointmentSheet } from '../components/NewAppointmentSheet';
import { appointmentsApi } from '../api/appointments';
import type { AppointmentStatus } from '../api/appointments';
import { toast } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/api-client/errors';
import { toApiDate } from '../../../shared/utils/date';

const STATUS_MESSAGES: Record<AppointmentStatus, string> = {
  PENDING: 'Agendamento atualizado.',
  CONFIRMED: 'Agendamento confirmado.',
  COMPLETED: 'Agendamento concluído.',
  CANCELED: 'Agendamento cancelado.',
};

export function AgendaPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const day = toApiDate(selectedDate);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', day],
    queryFn: () => appointmentsApi.listByDay(day),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => appointmentsApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', day] });
      toast.success(STATUS_MESSAGES[status]);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o agendamento.'));
    },
  });

  /** Depois de criar: leva a agenda para o dia do agendamento, já atualizada. */
  const handleCreated = (date: Date) => {
    queryClient.invalidateQueries({ queryKey: ['appointments', toApiDate(date)] });
    setSelectedDate(date);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="bg-white px-4 pt-4 pb-2 border-b border-slate-100 flex-shrink-0">
        <h1 className="text-xl font-bold text-slate-800">Agenda</h1>
      </div>

      <AgendaDayCarousel selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="flex-1 overflow-y-auto pb-24">
        <AgendaList
          appointments={appointments}
          isLoading={isLoading}
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
        />
      </div>

      <button
        onClick={() => setIsSheetOpen(true)}
        aria-label="Novo agendamento"
        className="fixed bottom-20 right-4 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 transition-all z-40 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>

      <NewAppointmentSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        date={selectedDate}
        onCreated={handleCreated}
      />
    </div>
  );
}
