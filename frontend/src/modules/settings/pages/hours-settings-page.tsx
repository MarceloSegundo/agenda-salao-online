import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Clock, Save, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';
import { tenantApi, type BusinessHour } from '../api/tenant';
import { Button, Input } from '../../../shared/components';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

const DEFAULT_HOURS: BusinessHour[] = DAYS_OF_WEEK.map(day => ({
  dayOfWeek: day.value,
  openingTime: '08:00',
  closingTime: '18:00',
  isClosed: day.value > 5, // Fechado no fim de semana por padrão
}));

export function HoursSettingsPage() {
  const queryClient = useQueryClient();
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(DEFAULT_HOURS);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: tenantApi.getSettings
  });

  useEffect(() => {
    if (tenant && tenant.businessHours && tenant.businessHours.length > 0) {
      setBusinessHours(
        tenant.businessHours.map(bh => ({
          ...bh,
          openingTime: bh.openingTime.substring(0, 5),
          closingTime: bh.closingTime.substring(0, 5)
        }))
      );
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: tenantApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      setSuccessMessage('Horários atualizados com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: () => {
      alert('Erro ao atualizar horários.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      businessHours: businessHours.map(bh => ({
        ...bh,
        openingTime: `${bh.openingTime}:00`,
        closingTime: `${bh.closingTime}:00`
      }))
    });
  };

  const updateDay = (dayOfWeek: number, field: keyof BusinessHour, value: any) => {
    setBusinessHours(prev => 
      prev.map(bh => bh.dayOfWeek === dayOfWeek ? { ...bh, [field]: value } : bh)
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-200 z-10">
        <div className="flex items-center gap-3">
          <Link to="/app/configuracoes" className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Horários de Funcionamento</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-amber-600">
                <Clock className="w-6 h-6" />
                <h2 className="font-bold text-slate-800 text-lg">Definir Horários da Semana</h2>
              </div>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Configure os horários de abertura e fechamento para cada dia da semana. Marque os dias em que o salão estará fechado.
              </p>
              
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl flex items-start gap-3 mb-6 border border-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong>Atenção:</strong> Profissionais podem ter horários próprios. Se um profissional tiver horários configurados, a disponibilidade final dele será a <strong>interseção</strong> entre o horário do profissional e o horário do salão.
                </div>
              </div>

              {successMessage && (
                <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  {successMessage}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4 divide-y divide-slate-100">
                  {DAYS_OF_WEEK.map(day => {
                    const bh = businessHours.find(h => h.dayOfWeek === day.value) || {
                      dayOfWeek: day.value,
                      openingTime: '08:00',
                      closingTime: '18:00',
                      isClosed: false
                    };

                    return (
                      <div key={day.value} className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                        <div className="flex items-center gap-3 w-40">
                          <input
                            type="checkbox"
                            id={`closed-${day.value}`}
                            checked={!bh.isClosed}
                            onChange={(e) => updateDay(day.value, 'isClosed', !e.target.checked)}
                            className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-600"
                          />
                          <label htmlFor={`closed-${day.value}`} className={`font-medium ${bh.isClosed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {day.label}
                          </label>
                        </div>
                        
                        {!bh.isClosed ? (
                          <div className="flex items-center gap-3">
                            <Input
                              type="time"
                              value={bh.openingTime}
                              onChange={(e) => updateDay(day.value, 'openingTime', e.target.value)}
                              className="w-32"
                              required
                            />
                            <span className="text-slate-400">até</span>
                            <Input
                              type="time"
                              value={bh.closingTime}
                              onChange={(e) => updateDay(day.value, 'closingTime', e.target.value)}
                              className="w-32"
                              required
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400 italic px-4 py-2 bg-slate-50 rounded-lg w-full sm:w-auto text-center sm:text-left">
                            Fechado neste dia
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white min-w-[200px]" 
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      'Salvando...'
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Horários
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
