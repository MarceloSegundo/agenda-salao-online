import { Link } from 'react-router';
import { Check, CalendarPlus, MessageCircle, Scissors, User } from 'lucide-react';
import type { AppointmentStatus } from '../../agenda/api/appointments';
import type { DashboardAppointment } from '../api/dashboard';
import { whatsappLink } from '../../../shared/utils/phone';

interface NextAppointmentCardProps {
  appointment: DashboardAppointment | null;
  onStatusChange: (appointment: DashboardAppointment, status: AppointmentStatus) => void;
  onOpen: (appointment: DashboardAppointment) => void;
}

const actionClass = 'flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition-colors active:scale-95';

export function NextAppointmentCard({ appointment, onStatusChange, onOpen }: NextAppointmentCardProps) {
  if (!appointment) {
    return (
      <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-center">
        <p className="text-sm font-semibold text-slate-700">Nenhum atendimento restante hoje</p>
        <Link
          to="/app/agenda"
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 px-3 py-2 rounded-xl hover:bg-indigo-50 active:scale-95"
        >
          <CalendarPlus className="w-4 h-4" />
          Novo agendamento
        </Link>
      </section>
    );
  }

  const whatsapp = whatsappLink(appointment.customerPhone);

  return (
    <section className="bg-indigo-600 text-white rounded-2xl p-5 shadow-lg shadow-indigo-600/20">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(appointment)}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpen(appointment); }}
        className="cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Próximo atendimento</span>
          {appointment.inProgress && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-white/20">
              Em andamento
            </span>
          )}
        </div>
        <p className="mt-2 text-3xl font-bold">
          {appointment.startTime.slice(11, 16)}
          <span className="text-lg font-medium text-indigo-200"> – {appointment.endTime.slice(11, 16)}</span>
        </p>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-200" />
            <span className="font-semibold">{appointment.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-100">
            <Scissors className="w-4 h-4 text-indigo-200" />
            <span className="text-sm">{appointment.serviceName} · com {appointment.professionalName}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {appointment.status === 'PENDING' && (
          <button
            type="button"
            onClick={() => onStatusChange(appointment, 'CONFIRMED')}
            className={`${actionClass} bg-white text-indigo-700 hover:bg-indigo-50`}
          >
            <Check className="w-4 h-4" />
            Confirmar
          </button>
        )}
        <button
          type="button"
          onClick={() => onStatusChange(appointment, 'COMPLETED')}
          className={`${actionClass} bg-white/15 hover:bg-white/25`}
        >
          <Check className="w-4 h-4" />
          Concluir
        </button>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionClass} bg-white/15 hover:bg-white/25`}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        )}
      </div>
    </section>
  );
}
