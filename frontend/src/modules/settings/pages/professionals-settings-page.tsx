import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { professionalsApi } from '../api/professionals';
import type { ProfessionalData, ProfessionalRequest } from '../api/professionals';
import { ProfessionalFormSheet } from '../components/ProfessionalFormSheet';
import { ConfirmDialog, toast } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/api-client/errors';

export function ProfessionalsSettingsPage() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalData | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id?: string }>({ isOpen: false });

  const { data: professionals, isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: professionalsApi.getProfessionals
  });

  const createMutation = useMutation({
    mutationFn: professionalsApi.createProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setIsSheetOpen(false);
      toast.success('Profissional cadastrado com sucesso!');
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, 'Ocorreu um erro ao cadastrar.'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: professionalsApi.updateProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setIsSheetOpen(false);
      toast.success('Profissional atualizado com sucesso!');
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error, 'Ocorreu um erro ao atualizar.'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: professionalsApi.deleteProfessional,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Profissional desativado com sucesso!');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível desativar.'));
    }
  });

  const handleOpenCreate = () => {
    setFormError(null);
    setSelectedProfessional(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (professional: ProfessionalData) => {
    setFormError(null);
    setSelectedProfessional(professional);
    setIsSheetOpen(true);
  };

  const handleSubmit = (data: ProfessionalRequest) => {
    setFormError(null);
    if (selectedProfessional) {
      updateMutation.mutate({ id: selectedProfessional.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmState({ isOpen: true, id });
  };

  const handleConfirmDelete = () => {
    if (confirmState.id) {
      deleteMutation.mutate(confirmState.id);
    }
  };

  const activeProfessionals = professionals?.filter(p => p.active) || [];
  const inactiveProfessionals = professionals?.filter(p => !p.active) || [];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-200 z-10">
        <div className="flex items-center gap-3">
          <Link to="/app/configuracoes" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Equipe</h1>
          </div>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-semibold text-slate-700">Atendentes Ativos</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showInactive"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <label htmlFor="showInactive" className="text-sm text-slate-600 cursor-pointer">
                    Exibir inativos
                  </label>
                </div>
              </div>
              {activeProfessionals.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Nenhum profissional ativo cadastrado.</p>
                </div>
              ) : (
                activeProfessionals.map(professional => (
                  <div key={professional.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg shrink-0">
                      {professional.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{professional.name}</h3>
                      <p className="text-sm text-slate-500 truncate">{professional.specialization}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => handleOpenEdit(professional)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(professional.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {showInactive && inactiveProfessionals.length > 0 && (
              <div className="space-y-3 pt-6">
                <h2 className="font-semibold text-slate-400 px-1">Atendentes Desativados</h2>
                
                {showInactive && inactiveProfessionals.map(professional => (
                  <div key={professional.id} className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4 opacity-75">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-lg shrink-0">
                      {professional.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-600 truncate line-through">{professional.name}</h3>
                      <p className="text-sm text-slate-400 truncate">{professional.specialization}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => handleOpenEdit(professional)}
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

      <ProfessionalFormSheet
        isOpen={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setFormError(null);
        }}
        initialData={selectedProfessional}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        error={formError}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onOpenChange={(open) => setConfirmState({ ...confirmState, isOpen: open })}
        title="Desativar Profissional"
        description="Tem certeza que deseja desativar este profissional? Ele não aparecerá mais para novos agendamentos."
        confirmText="Desativar"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
