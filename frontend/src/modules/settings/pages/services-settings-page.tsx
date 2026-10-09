import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Scissors, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { servicesApi } from '../api/services';
import type { ServiceData, ServiceRequest } from '../api/services';
import { ServiceFormSheet } from '../components/ServiceFormSheet';
import { ConfirmDialog, toast } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/api-client/errors';

export function ServicesSettingsPage() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id?: number }>({ isOpen: false });

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getServices
  });

  const createMutation = useMutation({
    mutationFn: servicesApi.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsSheetOpen(false);
      toast.success('Serviço cadastrado com sucesso!');
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, 'Ocorreu um erro ao cadastrar.'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: servicesApi.updateService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsSheetOpen(false);
      toast.success('Serviço atualizado com sucesso!');
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, 'Ocorreu um erro ao atualizar.'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: servicesApi.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Serviço desativado com sucesso!');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível desativar.'));
    }
  });

  const handleOpenCreate = () => {
    setFormError(null);
    setSelectedService(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (service: ServiceData) => {
    setFormError(null);
    setSelectedService(service);
    setIsSheetOpen(true);
  };

  const handleSubmit = (data: ServiceRequest) => {
    setFormError(null);
    if (selectedService) {
      updateMutation.mutate({ id: selectedService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    setConfirmState({ isOpen: true, id });
  };

  const handleConfirmDelete = () => {
    if (confirmState.id) {
      deleteMutation.mutate(confirmState.id);
    }
  };

  const activeServices = services?.filter(s => s.active) || [];
  const inactiveServices = services?.filter(s => !s.active) || [];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-200 z-10">
        <div className="flex items-center gap-3">
          <Link to="/app/configuracoes" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Serviços</h1>
          </div>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="p-2 bg-rose-100 text-rose-700 rounded-full hover:bg-rose-200 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-semibold text-slate-700">Serviços Ativos</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showInactive"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <label htmlFor="showInactive" className="text-sm text-slate-600 cursor-pointer">
                    Exibir inativos
                  </label>
                </div>
              </div>
              {activeServices.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Scissors className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Nenhum serviço ativo cadastrado.</p>
                </div>
              ) : (
                activeServices.map(service => (
                  <div key={service.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{service.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span>R$ {service.price.toFixed(2)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{service.durationMinutes} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenEdit(service)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(service.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {showInactive && inactiveServices.length > 0 && (
              <div className="space-y-3 pt-6">
                <h2 className="font-semibold text-slate-400 px-1">Serviços Desativados</h2>
                {inactiveServices.map(service => (
                  <div key={service.id} className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4 opacity-75">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-600 truncate line-through">{service.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                        <span>R$ {service.price.toFixed(2)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{service.durationMinutes} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenEdit(service)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ServiceFormSheet
        isOpen={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setFormError(null);
        }}
        initialData={selectedService}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onOpenChange={(open) => setConfirmState({ ...confirmState, isOpen: open })}
        title="Desativar Serviço"
        description="Tem certeza que deseja desativar este serviço? Ele não aparecerá mais para novos agendamentos."
        confirmText="Desativar"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
