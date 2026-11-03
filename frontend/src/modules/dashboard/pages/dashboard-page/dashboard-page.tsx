import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { appointmentsApi, STATUS_MESSAGES } from '../../../agenda/api/appointments';
import type { AppointmentStatus } from '../../../agenda/api/appointments';
import { dashboardApi } from '../../api/dashboard';
import type { DashboardAppointment } from '../../api/dashboard';
import { NextAppointmentCard } from '../../components/NextAppointmentCard';
import { DaySummary } from '../../components/DaySummary';
import { PendingList } from '../../components/PendingList';
import { TeamToday } from '../../components/TeamToday';
import { ConfirmDialog, LoadError, toast } from '../../../../shared/components';
import { getApiErrorMessage } from '../../../../shared/api-client/errors';
import { formatWeekdayLong, fromApiDate } from '../../../../shared/utils/date';

function greeting(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [toCancel, setToCancel] = useState<DashboardAppointment | null>(null);

  // Recarrega sozinho: "próximo" e "atendendo agora" acompanham o relógio
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.today,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const statusMutation = useMutation({
    mutationFn: ({ appointment, status }: { appointment: DashboardAppointment; status: AppointmentStatus }) =>
      appointmentsApi.updateStatus(appointment.id, status),
    onSuccess: (_, { appointment, status }) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', appointment.startTime.slice(0, 10)] });
      toast.success(STATUS_MESSAGES[status]);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o agendamento.'));
    },
  });

  // Cancelar pede confirmação; confirmar e concluir são diretos, como na Agenda
  const handleStatusChange = (appointment: DashboardAppointment, status: AppointmentStatus) => {
    if (status === 'CANCELED') {
      setToCancel(appointment);
    } else {
      statusMutation.mutate({ appointment, status });
    }
  };

  const openInAgenda = (appointment: DashboardAppointment) => {
    navigate(`/app/agenda?data=${appointment.startTime.slice(0, 10)}`);
  };

  if (isError) {
    return <LoadError message="Não foi possível carregar o painel." onRetry={() => refetch()} />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-full">
      {isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <header>
            <h1 className="text-2xl font-bold text-slate-800">
              {greeting(new Date().getHours())}, {data.salonName}
            </h1>
            <p className="text-sm text-slate-500 first-letter:uppercase">{formatWeekdayLong(fromApiDate(data.date) ?? new Date())}</p>
          </header>

          <NextAppointmentCard appointment={data.next} onStatusChange={handleStatusChange} onOpen={openInAgenda} />
          <DaySummary summary={data.summary} />
          <PendingList pending={data.pending} onStatusChange={handleStatusChange} onOpen={openInAgenda} />
          <TeamToday team={data.team} />
        </>
      )}

      <ConfirmDialog
        isOpen={toCancel !== null}
        onOpenChange={(open) => { if (!open) setToCancel(null); }}
        title="Cancelar agendamento?"
        description={toCancel ? `${toCancel.customerName} · ${toCancel.serviceName} às ${toCancel.startTime.slice(11, 16)}` : ''}
        confirmText="Cancelar agendamento"
        cancelText="Voltar"
        onConfirm={() => {
          if (toCancel) statusMutation.mutate({ appointment: toCancel, status: 'CANCELED' });
          setToCancel(null);
        }}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Carregando painel">
      <div className="space-y-2">
        <div className="h-7 w-2/3 bg-slate-200 rounded-lg" />
        <div className="h-4 w-1/3 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-44 bg-slate-200 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="h-32 bg-slate-200 rounded-2xl" />
    </div>
  );
}
