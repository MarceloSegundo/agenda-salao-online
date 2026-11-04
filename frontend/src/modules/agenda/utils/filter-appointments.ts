import type { AppointmentDto, AppointmentStatus } from '../api/appointments';

/** Filtros da Agenda; string vazia = "Todos". */
export interface AgendaFilters {
  professionalId: string;
  status: AppointmentStatus | '';
  /** O agendamento não traz o id do serviço: o filtro compara pelo nome. */
  serviceName: string;
}

export const EMPTY_FILTERS: AgendaFilters = { professionalId: '', status: '', serviceName: '' };

/** Quantos filtros estão em uso: vai no selo do botão de filtros. */
export function countActiveFilters(filters: AgendaFilters): number {
  return [filters.professionalId, filters.status, filters.serviceName].filter((value) => value !== '').length;
}

export function hasActiveFilters(filters: AgendaFilters): boolean {
  return countActiveFilters(filters) > 0;
}

export function filterAppointments(appointments: AppointmentDto[], filters: AgendaFilters): AppointmentDto[] {
  return appointments.filter((a) =>
    (!filters.professionalId || a.professionalId === filters.professionalId)
    && (!filters.status || a.status === filters.status)
    && (!filters.serviceName || a.serviceName === filters.serviceName));
}
