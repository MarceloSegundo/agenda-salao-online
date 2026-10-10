import { apiClient } from '../../../shared/api-client';
import type { BusinessHour } from './tenant';

export interface ProfessionalData {
  id: string;
  name: string;
  specialization: string;
  active: boolean;
  businessHours?: BusinessHour[];
}

export interface ProfessionalRequest {
  name: string;
  specialization: string;
  active?: boolean;
  businessHours?: BusinessHour[] | null;
}

export const professionalsApi = {
  getProfessionals: async (): Promise<ProfessionalData[]> => {
    const { data } = await apiClient.get<ProfessionalData[]>('/professionals');
    return data;
  },

  createProfessional: async (professional: ProfessionalRequest): Promise<ProfessionalData> => {
    const { data } = await apiClient.post<ProfessionalData>('/professionals', professional);
    return data;
  },

  updateProfessional: async ({ id, data: professionalData }: { id: string; data: ProfessionalRequest }): Promise<ProfessionalData> => {
    const { data } = await apiClient.put<ProfessionalData>(`/professionals/${id}`, professionalData);
    return data;
  },

  deleteProfessional: async (id: string): Promise<void> => {
    await apiClient.delete(`/professionals/${id}`);
  }
};
