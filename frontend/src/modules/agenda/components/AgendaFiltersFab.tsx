import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { ProfessionalData } from '../../settings/api/professionals';
import type { ServiceData } from '../../settings/api/services';
import type { AppointmentStatus } from '../api/appointments';
import type { AgendaFilters } from '../utils/filter-appointments';
import { countActiveFilters, EMPTY_FILTERS } from '../utils/filter-appointments';
import { cn } from '../../../shared/utils/cn';

interface AgendaFiltersFabProps {
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

const selectClass = (active: boolean) => cn(
  'w-full text-sm rounded-xl border px-3 py-2.5 bg-white',
  active ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-700',
);

/**
 * Botão redondo acima do "+" da Agenda que abre, a partir dele, um cartão com os filtros.
 * Os filtros valem na hora; fecha tocando fora, no X ou com Esc.
 */
export function AgendaFiltersFab({ filters, onChange, professionals, services, shownCount, totalCount }: AgendaFiltersFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = countActiveFilters(filters);
  const activeProfessionals = professionals.filter((p) => p.active).sort(byName);
  const serviceNames = [...new Set(services.filter((s) => s.active).sort(byName).map((s) => s.name))];

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Toque fora fecha o cartão */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/10" aria-hidden="true" onClick={() => setIsOpen(false)} />
      )}

      <div
        id="agenda-filters"
        role="dialog"
        aria-label="Filtros da agenda"
        inert={!isOpen}
        className={cn(
          'fixed right-4 bottom-[204px] z-50 w-[calc(100vw-2rem)] max-w-sm origin-bottom-right',
          'bg-white rounded-3xl shadow-2xl shadow-slate-900/15 border border-slate-100 p-4 space-y-4',
          'transition-all duration-200 ease-out',
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-3 pointer-events-none',
        )}
      >
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => {
              const selected = filters.status === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ ...filters, status: selected ? '' : option.value })}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors active:scale-95',
                    selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block">
          <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Profissional</span>
          <select
            value={filters.professionalId}
            onChange={(e) => onChange({ ...filters, professionalId: e.target.value })}
            className={selectClass(filters.professionalId !== '')}
          >
            <option value="">Todos</option>
            {activeProfessionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Serviço</span>
          <select
            value={filters.serviceName}
            onChange={(e) => onChange({ ...filters, serviceName: e.target.value })}
            className={selectClass(filters.serviceName !== '')}
          >
            <option value="">Todos</option>
            {serviceNames.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>

        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500 pt-3">{shownCount} de {totalCount} agendamentos</span>
          <button
            type="button"
            disabled={activeCount === 0}
            onClick={() => onChange(EMPTY_FILTERS)}
            className="mt-3 text-sm font-semibold text-indigo-600 px-3 py-1.5 -mr-3 rounded-lg hover:bg-indigo-50 active:scale-95 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            Limpar
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Fechar filtros' : 'Filtrar agenda'}
        aria-expanded={isOpen}
        aria-controls="agenda-filters"
        className={cn(
          'fixed right-[22px] bottom-[148px] z-50 w-11 h-11 rounded-full flex items-center justify-center',
          'shadow-lg transition-all duration-200 active:scale-90',
          isOpen ? 'bg-slate-800 text-white shadow-slate-900/30' : 'bg-white text-indigo-600 shadow-slate-900/15 border border-slate-100 hover:scale-105',
        )}
      >
        {isOpen ? <X className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
        {!isOpen && activeCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
            {activeCount}
          </span>
        )}
      </button>
    </>
  );
}
