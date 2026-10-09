import { apiClient } from '../../../shared/api-client';

export interface ServiceData {
  id: number;
  name: string;
  durationMinutes: number;
  price: number;
  requiresOnlinePayment: boolean;
  active: boolean;
}

export interface ServiceRequest {
  name: string;
  durationMinutes: number;
  price: number;
  requiresOnlinePayment: boolean;
  active?: boolean;
}

export const servicesApi = {
  getServices: async (): Promise<ServiceData[]> => {
    const { data } = await apiClient.get<ServiceData[]>('/services');
    return data;
  },

  createService: async (service: ServiceRequest): Promise<ServiceData> => {
    const { data } = await apiClient.post<ServiceData>('/services', service);
    return data;
  },

  updateService: async ({ id, data: serviceData }: { id: number; data: ServiceRequest }): Promise<ServiceData> => {
    const { data } = await apiClient.put<ServiceData>(`/services/${id}`, serviceData);
    return data;
  },

  deleteService: async (id: number): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
  }
};
