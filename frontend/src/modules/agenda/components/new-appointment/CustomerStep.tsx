import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Input, LoadError } from '../../../../shared/components';
import { getApiErrorMessage } from '../../../../shared/api-client/errors';
import { useDebouncedValue } from '../../../../shared/hooks/useDebouncedValue';
import { formatPhone } from '../../../../shared/utils/phone';
import { customersApi, getDuplicateCustomer } from '../../../customers/api/customers';
import type { Customer, CustomerRequest } from '../../../customers/api/customers';
import { CustomerForm } from '../../../customers/components/CustomerForm';

interface CustomerStepProps {
  selected: Customer | null;
  onSelect: (customer: Customer | null) => void;
}

export function CustomerStep({ selected, onSelect }: CustomerStepProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ id: string; name: string } | null>(null);

  const { data: results = [], isFetching, isError, refetch } = useQuery({
    queryKey: ['customers', term],
    queryFn: () => customersApi.search(term),
    enabled: !selected && term.trim().length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (request: CustomerRequest) => customersApi.create(request),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setCreating(false);
      onSelect(customer);
    },
    onError: (err) => {
      const existing = getDuplicateCustomer(err);
      setDuplicate(existing);
      setError(existing ? `Já existe: ${existing.name}` : getApiErrorMessage(err, 'Não foi possível cadastrar o cliente.'));
    },
  });

  if (selected) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Quem é o cliente?</h3>
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-indigo-600 bg-indigo-50">
          <div className="flex items-center gap-3 min-w-0">
            <Check className="w-5 h-5 text-indigo-600 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-800 truncate">{selected.name}</p>
              {selected.phone && <p className="text-sm text-slate-500">{formatPhone(selected.phone)}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 shrink-0"
          >
            Trocar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Quem é o cliente?</h3>

      {!creating && (
        <>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              aria-label="Buscar cliente"
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {term.trim() && isError && (
            <LoadError message="Não foi possível buscar clientes." onRetry={() => refetch()} />
          )}

          {term.trim() && !isError && (
            <div className="grid gap-2">
              {!isFetching && results.length === 0 && (
                <p className="text-sm text-slate-500">Nenhum cliente encontrado.</p>
              )}
              {results.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => onSelect(customer)}
                  className="text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <p className="font-medium text-slate-700">{customer.name}</p>
                  <p className="text-sm text-slate-500">{formatPhone(customer.phone)}</p>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-600 font-medium hover:border-indigo-600 hover:text-indigo-600 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Cadastrar novo cliente
          </button>
        </>
      )}

      {creating && (
        <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-700">Novo cliente</p>
            <button
              type="button"
              onClick={() => { setCreating(false); setError(null); setDuplicate(null); }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Voltar para a busca
            </button>
          </div>
          <CustomerForm
            variant="short"
            formId="quick-customer-form"
            onSubmit={(request) => { setError(null); setDuplicate(null); createMutation.mutate(request); }}
            submitting={createMutation.isPending}
            error={error}
          />
          {duplicate && (
            <button
              type="button"
              onClick={() => onSelect({ id: duplicate.id, name: duplicate.name, phone: '', email: null })}
              className="w-full px-4 py-2 rounded-lg bg-white border border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50"
            >
              Usar este cliente
            </button>
          )}
        </div>
      )}
    </div>
  );
}
