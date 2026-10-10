import { Users } from 'lucide-react';
import type { ProfessionalData } from '../../../settings/api/professionals';

/** Valor de seleção para o modo "qualquer profissional". */
export const ANY_PROFESSIONAL = 'ANY';

interface ProfessionalStepProps {
  professionals: ProfessionalData[];
  selected: string | null;
  onSelect: (professionalId: string) => void;
}

const optionClass = (isSelected: boolean) =>
  `text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3 ${
    isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-600 hover:bg-indigo-50'
  }`;

export function ProfessionalStep({ professionals, selected, onSelect }: ProfessionalStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800">Com qual profissional?</h3>
      <div className="grid gap-3">
        {professionals.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum profissional ativo cadastrado.</p>
        ) : (
          <button type="button" onClick={() => onSelect(ANY_PROFESSIONAL)} className={optionClass(selected === ANY_PROFESSIONAL)}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="font-medium text-slate-700">Qualquer profissional</span>
              <p className="text-xs text-slate-500">Mostra os horários de toda a equipe</p>
            </div>
          </button>
        )}
        {professionals.map((professional) => (
          <button
            key={professional.id}
            type="button"
            onClick={() => onSelect(professional.id)}
            className={optionClass(selected === professional.id)}
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
              {professional.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="font-medium text-slate-700">{professional.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
