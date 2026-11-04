import type { ProfessionalData } from '../../settings/api/professionals';
import type { ServiceData } from '../../settings/api/services';
import type { AppointmentStatus } from '../api/appointments';
import type { AgendaFilters } from '../utils/filter-appointments';
import { EMPTY_FILTERS, hasActiveFilters } from '../utils/filter-appointments';
import { cn } from '../../../shared/utils/cn';

interface AgendaFiltersBarProps {
  filters: AgendaFilters;
  onChange: (filters: AgendaFilters) => void;
  professionals: ProfessionalData[];
  services: ServiceData[];
  shownCount: number;
  totalCount: number;
}

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELED', label: 'Cancelado' },
];

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'pt-BR');

/** Profissional, status e serviço; o rótulo da opção vazia ("Profissional"...) faz as vezes de "Todos". */
export function AgendaFiltersBar({ filters, onChange, professionals, services, shownCount, totalCount }: AgendaFiltersBarProps) {
  const activeProfessionals = professionals.filter((p) => p.active).sort(byName);
  const serviceNames = [...new Set(services.filter((s) => s.active).sort(byName).map((s) => s.name))];
  const selectClass = (active: boolean) => cn(
    'w-full min-w-0 text-xs font-medium rounded-lg border px-2 py-2 bg-white truncate',
    active ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600',
  );

  return (
    <div className="bg-white px-4 pb-3 border-b border-slate-100 flex-shrink-0">
      <div className="grid grid-cols-3 gap-2">
        <select
          aria-label="Filtrar por profissional"
          value={filters.professionalId}
          onChange={(e) => onChange({ ...filters, professionalId: e.target.value })}
          className={selectClass(filters.professionalId !== '')}
        >
          <option value="">Profissional</option>
          {activeProfessionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          aria-label="Filtrar por status"
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as AgendaFilters['status'] })}
          className={selectClass(filters.status !== '')}
        >
          <option value="">Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          aria-label="Filtrar por serviço"
          value={filters.serviceName}
          onChange={(e) => onChange({ ...filters, serviceName: e.target.value })}
          className={selectClass(filters.serviceName !== '')}
        >
          <option value="">Serviço</option>
          {serviceNames.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      {hasActiveFilters(filters) && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-500">{shownCount} de {totalCount} agendamentos</span>
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="font-semibold text-indigo-600 px-2 py-1 -mr-2 rounded-lg hover:bg-indigo-50 active:scale-95"
          >
            Limpar
          </button>
        </div>
      )}
    </div>
  );
}
