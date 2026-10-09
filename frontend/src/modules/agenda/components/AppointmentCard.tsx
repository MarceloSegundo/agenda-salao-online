import { useState } from 'react';
import { Check, X, MoreHorizontal, Clock, User, Scissors, Pencil } from 'lucide-react';

export interface Appointment {
  id: string;
  time: string;
  customerName: string;
  serviceName: string;
  professionalName: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
  durationMinutes: number;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange: (id: string, newStatus: Appointment['status']) => void;
  onEdit: (id: string) => void;
}

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELED: 'bg-red-100 text-red-700',
};

const statusLabels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
};

export function AppointmentCard({ appointment, onStatusChange, onEdit }: AppointmentCardProps) {
  const [showActions, setShowActions] = useState(false);

  const toggleActions = () => setShowActions(!showActions);

  return (
    <div className="relative mb-3 group">
      <div 
        className={`bg-white border rounded-2xl p-4 shadow-sm transition-all duration-200 ${
          showActions ? 'border-indigo-300 shadow-md transform -translate-x-2' : 'border-slate-100'
        }`}
        onClick={toggleActions}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-800">{appointment.time}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors[appointment.status]}`}>
              {statusLabels[appointment.status]}
            </span>
          </div>
          <button 
            className="text-slate-400 hover:text-slate-600 p-1"
            onClick={(e) => { e.stopPropagation(); toggleActions(); }}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-700">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-sm">{appointment.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Scissors className="w-4 h-4 text-slate-400" />
            <span className="text-sm">{appointment.serviceName}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500">com {appointment.professionalName}</span>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>Duração: {appointment.durationMinutes} min</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        {showActions && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 justify-end">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(appointment.id); setShowActions(false); }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 mr-auto"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
            
            {appointment.status !== 'CANCELED' && appointment.status !== 'COMPLETED' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onStatusChange(appointment.id, 'CANCELED'); setShowActions(false); }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            )}
            
            {appointment.status === 'PENDING' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onStatusChange(appointment.id, 'CONFIRMED'); setShowActions(false); }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <Check className="w-3.5 h-3.5" />
                Confirmar
              </button>
            )}

            {(appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
              <button 
                onClick={(e) => { e.stopPropagation(); onStatusChange(appointment.id, 'COMPLETED'); setShowActions(false); }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
              >
                <Check className="w-3.5 h-3.5" />
                Concluir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
