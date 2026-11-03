import { apiClient } from '../../../shared/api-client';
import type { AppointmentStatus } from '../../agenda/api/appointments';

export interface DashboardAppointment {
  id: string;
  customerName: string;
  /** só dígitos, com o 55 do país */
  customerPhone: string;
  serviceName: string;
  professionalName: string;
  /** aaaa-mm-ddTHH:mm:ss, horário local do salão */
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  inProgress: boolean;
}

export interface DaySummary {
  total: number;
  completed: number;
  toConfirm: number;
  canceled: number;
  expectedRevenue: number;
  realizedRevenue: number;
}

export interface Pending {
  /** no máximo 20; o total real vem em toConfirmTotal */
  toConfirm: DashboardAppointment[];
  toConfirmTotal: number;
  overdue: DashboardAppointment[];
  overdueTotal: number;
}

export type TeamMemberState = 'BUSY' | 'FREE' | 'OFF';

export interface TeamMember {
  professionalId: string;
  name: string;
  appointmentsToday: number;
  state: TeamMemberState;
  /** HH:mm, só quando BUSY */
  currentUntil: string | null;
  /** HH:mm do próximo atendimento de hoje */
  nextAt: string | null;
}

export interface DashboardDto {
  /** aaaa-mm-dd, "hoje" no fuso do salão */
  date: string;
  salonName: string;
  summary: DaySummary;
  next: DashboardAppointment | null;
  pending: Pending;
  team: TeamMember[];
}

export const dashboardApi = {
  today: async (): Promise<DashboardDto> => {
    const { data } = await apiClient.get<DashboardDto>('/dashboard/today');
    return data;
  },
};
