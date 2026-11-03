import { Link } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import type { AppointmentStatus } from '../../agenda/api/appointments';
import type { DashboardAppointment, Pending } from '../api/dashboard';
import { formatDayLabel, fromApiDate } from '../../../shared/utils/date';

interface PendingListProps {
  pending: Pending;
  onStatusChange: (appointment: DashboardAppointment, status: AppointmentStatus) => void;
  onOpen: (appointment: DashboardAppointment) => void;
}

type Action = { label: string; status: AppointmentStatus; className: string };

const CONFIRM: Action = { label: 'Confirmar', status: 'CONFIRMED', className: 'text-blue-600 bg-blue-50 hover:bg-blue-100' };
const COMPLETE: Action = { label: 'Concluir', status: 'COMPLETED', className: 'text-green-600 bg-green-50 hover:bg-green-100' };
const CANCEL: Action = { label: 'Cancelar', status: 'CANCELED', className: 'text-red-600 bg-red-50 hover:bg-red-100' };

export function PendingList({ pending, onStatusChange, onOpen }: PendingListProps) {
  const isEmpty = pending.toConfirmTotal === 0 && pending.overdueTotal === 0;

  return (
    <section>
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Pendências</h2>
      {isEmpty ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-semibold">Tudo em dia ✓</span>
        </div>
      ) : (
        <div className="space-y-4">
          <PendingSection
            title="A confirmar"
            items={pending.toConfirm}
            total={pending.toConfirmTotal}
            actions={[CONFIRM]}
            onStatusChange={onStatusChange}
            onOpen={onOpen}
          />
          <PendingSection
            title="Atrasados"
            items={pending.overdue}
            total={pending.overdueTotal}
            actions={[COMPLETE, CANCEL]}
            onStatusChange={onStatusChange}
            onOpen={onOpen}
          />
        </div>
      )}
    </section>
  );
}

interface PendingSectionProps {
  title: string;
  items: DashboardAppointment[];
  total: number;
  actions: Action[];
  onStatusChange: PendingListProps['onStatusChange'];
  onOpen: PendingListProps['onOpen'];
}

function PendingSection({ title, items, total, actions, onStatusChange, onOpen }: PendingSectionProps) {
  if (total === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-1.5">{title} ({total})</p>
      <ul className="bg-white border border-slate-100 rounded-2xl shadow-sm divide-y divide-slate-100">
        {items.map((item) => {
          const day = fromApiDate(item.startTime.slice(0, 10));
          return (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <button type="button" onClick={() => onOpen(item)} className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-slate-500">
                  {day ? formatDayLabel(day) : ''} · {item.startTime.slice(11, 16)}
                </p>
                <p className="text-sm font-medium text-slate-800 truncate">{item.customerName}</p>
                <p className="text-xs text-slate-500 truncate">{item.serviceName}</p>
              </button>
              <div className="flex gap-1.5 flex-shrink-0">
                {actions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    onClick={() => onStatusChange(item, action.status)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg active:scale-95 ${action.className}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      {total > items.length && (
        <Link to="/app/agenda" className="mt-1.5 inline-block text-xs font-semibold text-indigo-600 hover:underline">
          e mais {total - items.length}
        </Link>
      )}
    </div>
  );
}
