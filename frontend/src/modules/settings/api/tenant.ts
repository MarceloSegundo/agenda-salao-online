import { apiClient } from '../../../shared/api-client';

export interface BusinessHour {
  dayOfWeek: number; // 1 = Segunda, 7 = Domingo
  openingTime: string;
  closingTime: string;
  isClosed: boolean;
}

export interface TenantSettings {
  id: number;
  name: string;
  domain: string;
  businessHours: BusinessHour[];
}

export interface TenantSettingsRequest {
  salonName?: string;
  businessHours?: BusinessHour[];
}

export const tenantApi = {
  getSettings: async (): Promise<TenantSettings> => {
    const { data } = await apiClient.get<TenantSettings>('/tenants/me');
    return data;
  },

  updateSettings: async (settings: TenantSettingsRequest): Promise<TenantSettings> => {
    const { data } = await apiClient.patch<TenantSettings>('/tenants/settings', settings);
    return data;
  }
};
