import type { ServiceData } from '../../../settings/api/services';

interface ServiceStepProps {
  services: ServiceData[];
  selected: ServiceData | null;
  onSelect: (service: ServiceData) => void;
}

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ServiceStep({ services, selected, onSelect }: ServiceStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Qual o serviço?</h3>
      <div className="grid gap-3">
        {services.length === 0 && <p className="text-sm text-slate-500">Nenhum serviço ativo cadastrado.</p>}
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            className={`text-left px-4 py-3 rounded-xl border transition-colors ${
              selected?.id === service.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-slate-200 hover:border-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700">{service.name}</span>
              <span className="text-xs text-slate-500">{service.durationMinutes} min</span>
            </div>
            <div className="text-sm text-slate-500 mt-1">{formatPrice(service.price)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
