import type { AppointmentDto, AppointmentStatus } from '../api/appointments';
import { AppointmentCard } from './AppointmentCard';
import { CalendarX2, FilterX } from 'lucide-react';

interface AgendaListProps {
  appointments: AppointmentDto[];
  isLoading: boolean;
  onStatusChange: (id: string, newStatus: AppointmentStatus) => void;
  /** O dia tem agendamentos, mas os filtros esconderam todos: não é "Agenda Livre". */
  hiddenByFilters?: boolean;
  onClearFilters?: () => void;
}

export function AgendaList({ appointments, isLoading, onStatusChange, hiddenByFilters, onClearFilters }: AgendaListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-100 animate-pulse h-32 rounded-2xl w-full"></div>
        ))}
      </div>
    );
  }

  if (appointments.length === 0 && hiddenByFilters) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-64">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <FilterX className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">Nenhum agendamento com esses filtros</h3>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-3 text-sm font-semibold text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 active:scale-95"
        >
          Limpar filtros
        </button>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-64">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <CalendarX2 className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">Agenda Livre</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-[200px]">
          Não há agendamentos para este dia.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-1">
        {appointments.map((apt) => (
          <AppointmentCard 
            key={apt.id} 
            appointment={apt} 
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
