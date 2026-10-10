import { apiClient } from '../../../shared/api-client';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';

export interface AppointmentDto {
  id: string;
  customerName: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  /** aaaa-mm-ddTHH:mm:ss, horário local do salão */
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: AppointmentStatus;
}

export interface AvailableSlot {
  /** HH:mm */
  time: string;
  professionalId: string;
  professionalName: string;
}

export interface CreateAppointmentRequest {
  customerId: string;
  serviceId: string;
  professionalId: string;
  /** aaaa-mm-ddTHH:mm:00 */
  startTime: string;
}

export const appointmentsApi = {
  /** Agenda do dia (aaaa-mm-dd), em ordem de horário, incluindo cancelados. */
  listByDay: async (date: string): Promise<AppointmentDto[]> => {
    const { data } = await apiClient.get<AppointmentDto[]>('/appointments', { params: { date } });
    return data;
  },

  updateStatus: async (id: string, status: AppointmentStatus): Promise<AppointmentDto> => {
    const { data } = await apiClient.patch<AppointmentDto>(`/appointments/${id}/status`, { status });
    return data;
  },

  /** Horários livres; sem professionalId, modo "qualquer profissional". */
  availability: async (params: { date: string; serviceId: string; professionalId?: string }): Promise<AvailableSlot[]> => {
    const { data } = await apiClient.get<AvailableSlot[]>('/appointments/availability', { params });
    return data;
  },

  create: async (request: CreateAppointmentRequest): Promise<AppointmentDto> => {
    const { data } = await apiClient.post<AppointmentDto>('/appointments', request);
    return data;
  },
};
