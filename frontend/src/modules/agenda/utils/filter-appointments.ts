import type { AppointmentDto, AppointmentStatus } from '../api/appointments';

/** Filtros da Agenda; string vazia = "Todos". */
export interface AgendaFilters {
  professionalId: string;
  status: AppointmentStatus | '';
  /** O agendamento não traz o id do serviço: o filtro compara pelo nome. */
  serviceName: string;
}

export const EMPTY_FILTERS: AgendaFilters = { professionalId: '', status: '', serviceName: '' };

export function hasActiveFilters(filters: AgendaFilters): boolean {
  return filters.professionalId !== '' || filters.status !== '' || filters.serviceName !== '';
}

export function filterAppointments(appointments: AppointmentDto[], filters: AgendaFilters): AppointmentDto[] {
  return appointments.filter((a) =>
    (!filters.professionalId || a.professionalId === filters.professionalId)
    && (!filters.status || a.status === filters.status)
    && (!filters.serviceName || a.serviceName === filters.serviceName));
}
