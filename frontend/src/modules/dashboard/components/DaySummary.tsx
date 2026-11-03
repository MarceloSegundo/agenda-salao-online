import type { DaySummary as DaySummaryData } from '../api/dashboard';
import { formatCurrency } from '../../../shared/utils/currency';

interface DaySummaryProps {
  summary: DaySummaryData;
}

export function DaySummary({ summary }: DaySummaryProps) {
  const tiles = [
    { label: 'Atendimentos', value: summary.total, color: 'text-slate-800' },
    { label: 'Concluídos', value: summary.completed, color: 'text-green-600' },
    { label: 'A confirmar', value: summary.toConfirm, color: 'text-amber-600' },
    { label: 'Cancelados', value: summary.canceled, color: 'text-red-600' },
  ];

  return (
    <section>
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Resumo do dia</h2>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <p className={`text-2xl font-bold ${tile.color}`}>{tile.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{tile.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-600">
        Previsto <span className="font-semibold text-slate-800">{formatCurrency(summary.expectedRevenue)}</span>
        {' · '}
        Realizado <span className="font-semibold text-green-700">{formatCurrency(summary.realizedRevenue)}</span>
      </p>
    </section>
  );
}
