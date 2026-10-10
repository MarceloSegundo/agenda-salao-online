import { apiClient } from '../../../shared/api-client';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

export interface CustomerRequest {
  name: string;
  phone: string;
  email?: string;
}

export const customersApi = {
  /** Até 50 clientes por nome; o termo casa trecho do nome ou do telefone. */
  search: async (term: string): Promise<Customer[]> => {
    const params = term.trim() ? { search: term.trim() } : undefined;
    const { data } = await apiClient.get<Customer[]>('/customers', { params });
    return data;
  },

  create: async (request: CustomerRequest): Promise<Customer> => {
    const { data } = await apiClient.post<Customer>('/customers', request);
    return data;
  },

  update: async (id: string, request: CustomerRequest): Promise<Customer> => {
    const { data } = await apiClient.put<Customer>(`/customers/${id}`, request);
    return data;
  },
};

/** Cliente que já usa o telefone, quando a API responde 409 ao cadastrar ou editar. */
export function getDuplicateCustomer(error: unknown): { id: string; name: string } | null {
  const response = (error as { response?: { status?: number; data?: { details?: Record<string, string> | null } } })
    ?.response;
  const details = response?.data?.details;
  if (response?.status !== 409 || !details?.existingCustomerId) {
    return null;
  }
  return { id: details.existingCustomerId, name: details.existingCustomerName };
}
