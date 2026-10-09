import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Store, Save } from 'lucide-react';
import { Link } from 'react-router';
import { tenantApi } from '../api/tenant';
import { Button, Input, Label, toast } from '../../../shared/components';
import { getApiErrorMessage } from '../../../shared/api-client/errors';

export function StoreSettingsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: tenantApi.getSettings
  });

  useEffect(() => {
    if (tenant) {
      if (tenant.name) setName(tenant.name);
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: tenantApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      toast.success('Dados do salão atualizados.');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar os dados do salão.'));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      salonName: name
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-200 z-10">
        <div className="flex items-center gap-3">
          <Link to="/app/configuracoes" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Meus Dados</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6 text-emerald-600">
                <Store className="w-6 h-6" />
                <h2 className="font-bold text-slate-800 text-lg">Informações do Salão</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Loja/Salão</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link de Agendamento</Label>
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 text-sm">
                    https://agendasalao.com.br/agendar/{tenant?.domain}
                  </div>
                  <p className="text-xs text-slate-400">O seu link de agendamento não pode ser alterado.</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      'Salvando...'
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
