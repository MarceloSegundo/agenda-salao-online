import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { AgendaDayCarousel } from '../components/AgendaDayCarousel';
import { AgendaList } from '../components/AgendaList';
import { AgendaFiltersBar } from '../components/AgendaFiltersBar';
import { EMPTY_FILTERS, filterAppointments } from '../utils/filter-appointments';
import type { AgendaFilters } from '../utils/filter-appointments';
import { professionalsApi } from '../../settings/api/professionals';
import { servicesApi } from '../../settings/api/services';
import { NewAppointmentSheet } from '../components/new-appointment/NewAppointmentSheet';
import { appointmentsApi, STATUS_MESSAGES } from '../api/appointments';
import type { AppointmentStatus } from '../api/appointments';
import { LoadError, toast } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/api-client/errors';
import { fromApiDate, toApiDate } from '../../../shared/utils/date';

export function AgendaPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  // ?data=aaaa-mm-dd abre a agenda naquele dia (links do Dashboard); sem ou inválido, hoje
  const [selectedDate, setSelectedDate] = useState<Date>(() => fromApiDate(searchParams.get('data')) ?? new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // Os filtros continuam valendo ao trocar de dia
  const [filters, setFilters] = useState<AgendaFilters>(EMPTY_FILTERS);
  const day = toApiDate(selectedDate);

  const { data: appointments = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['appointments', day],
    queryFn: () => appointmentsApi.listByDay(day),
  });
  // Opções dos filtros: cadastros do salão (mesmas chaves do painel de novo agendamento)
  const { data: professionals = [] } = useQuery({ queryKey: ['professionals'], queryFn: professionalsApi.getProfessionals });
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: servicesApi.getServices });
  const visibleAppointments = filterAppointments(appointments, filters);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => appointmentsApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', day] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(STATUS_MESSAGES[status]);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o agendamento.'));
    },
  });

  /** Depois de criar: leva a agenda para o dia do agendamento, já atualizada. */
  const handleCreated = (date: Date) => {
    queryClient.invalidateQueries({ queryKey: ['appointments', toApiDate(date)] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    setSelectedDate(date);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="bg-white px-4 pt-4 pb-2 border-b border-slate-100 flex-shrink-0">
        <h1 className="text-xl font-bold text-slate-800">Agenda</h1>
      </div>

      <AgendaDayCarousel selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <AgendaFiltersBar
        filters={filters}
        onChange={setFilters}
        professionals={professionals}
        services={services}
        shownCount={visibleAppointments.length}
        totalCount={appointments.length}
      />

      <div className="flex-1 overflow-y-auto pb-24">
        {isError ? (
          <LoadError message="Não foi possível carregar a agenda." onRetry={() => refetch()} />
        ) : (
          <AgendaList
            appointments={visibleAppointments}
            isLoading={isLoading}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
            hiddenByFilters={appointments.length > 0}
            onClearFilters={() => setFilters(EMPTY_FILTERS)}
          />
        )}
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
        initialDate={selectedDate}
        onCreated={handleCreated}
      />
    </div>
  );
}
