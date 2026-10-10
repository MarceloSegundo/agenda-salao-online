import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Plus, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { Input, LoadError } from '../../../shared/components';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { formatPhone } from '../../../shared/utils/phone';
import { customersApi } from '../api/customers';
import type { Customer } from '../api/customers';
import { CustomerFormSheet } from '../components/CustomerFormSheet';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search);
  const [sheet, setSheet] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });

  const { data: customers, isLoading, isError, refetch } = useQuery({
    queryKey: ['customers', term],
    queryFn: () => customersApi.search(term),
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white px-4 pt-4 pb-3 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Clientes</h1>
          <button
            type="button"
            onClick={() => setSheet({ open: true, customer: null })}
            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-50"
          >
            <Plus className="w-4 h-4" />
            Novo cliente
          </button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            aria-label="Buscar cliente"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isError ? (
          <LoadError message="Não foi possível carregar os clientes." onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-100 animate-pulse h-16 rounded-xl" />
            ))}
          </div>
        ) : customers && customers.length > 0 ? (
          <ul className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {customers.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => setSheet({ open: true, customer })}
                  className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{customer.name}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {formatPhone(customer.phone)}
                      {customer.email && ` · ${customer.email}`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="bg-white p-4 rounded-full mb-4 border border-slate-100">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">
              {term.trim() ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-[240px]">
              {term.trim()
                ? 'Confira o nome ou o telefone digitado.'
                : 'Cadastre aqui ou direto ao criar um agendamento.'}
            </p>
          </div>
        )}
      </div>

      <CustomerFormSheet
        isOpen={sheet.open}
        onOpenChange={(open) => setSheet((current) => ({ ...current, open }))}
        customer={sheet.customer}
      />
    </div>
  );
}
