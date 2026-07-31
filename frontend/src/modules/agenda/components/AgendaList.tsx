import type { Appointment } from './AppointmentCard';
import { AppointmentCard } from './AppointmentCard';
import { CalendarX2 } from 'lucide-react';

interface AgendaListProps {
  appointments: Appointment[];
  isLoading: boolean;
  onStatusChange: (id: string, newStatus: Appointment['status']) => void;
  onEdit: (id: string) => void;
}

export function AgendaList({ appointments, isLoading, onStatusChange, onEdit }: AgendaListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-100 animate-pulse h-32 rounded-2xl w-full"></div>
        ))}
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
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
