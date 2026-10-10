import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { Button, toast } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/api-client/errors';
import { customersApi, getDuplicateCustomer } from '../api/customers';
import type { Customer, CustomerRequest } from '../api/customers';
import { CustomerForm } from './CustomerForm';

interface CustomerFormSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = novo cliente. */
  customer: Customer | null;
}

const FORM_ID = 'customer-form';

export function CustomerFormSheet({ isOpen, onOpenChange, customer }: CustomerFormSheetProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (request: CustomerRequest) =>
      customer ? customersApi.update(customer.id, request) : customersApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(customer ? 'Cliente atualizado.' : 'Cliente cadastrado.');
      onOpenChange(false);
    },
    onError: (err) => {
      const duplicate = getDuplicateCustomer(err);
      setError(duplicate ? `Já existe: ${duplicate.name}` : getApiErrorMessage(err, 'Não foi possível salvar o cliente.'));
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) setError(null);
    onOpenChange(open);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-0 right-0 bottom-0 z-[70] mt-24 max-h-[85vh] flex flex-col bg-white rounded-t-3xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
          <div className="flex-1 overflow-y-auto">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100 z-10">
              <Dialog.Title className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserRound className="w-5 h-5 text-indigo-600" />
                {customer ? 'Editar Cliente' : 'Novo Cliente'}
              </Dialog.Title>
              <Dialog.Description className="sr-only">Nome, telefone e e-mail do cliente</Dialog.Description>
              <Dialog.Close asChild>
                <button className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors" aria-label="Fechar">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="p-6">
              {/* key: remonta o formulário com os dados de quem foi aberto */}
              <CustomerForm
                key={customer?.id ?? 'new'}
                variant="full"
                formId={FORM_ID}
                initial={customer}
                onSubmit={(request) => {
                  setError(null);
                  saveMutation.mutate(request);
                }}
                submitting={saveMutation.isPending}
                error={error}
              />
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex justify-between gap-3 pb-safe">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" className="flex-1">Cancelar</Button>
            </Dialog.Close>
            <Button type="submit" form={FORM_ID} className="flex-1" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
