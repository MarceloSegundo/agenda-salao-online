import { Link } from 'react-router';
import { Users, Scissors, Clock, Store } from 'lucide-react';

const SETTINGS_MENU = [
  {
    id: 'team',
    title: 'Equipe e Atendentes',
    description: 'Gerencie os profissionais que atendem no salão.',
    icon: Users,
    href: '/app/configuracoes/equipe',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'services',
    title: 'Serviços',
    description: 'Cadastre e edite os serviços prestados e seus preços.',
    icon: Scissors,
    href: '/app/configuracoes/servicos',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
  {
    id: 'hours',
    title: 'Horários de Funcionamento',
    description: 'Defina o horário de abertura e fechamento da sua loja.',
    icon: Clock,
    href: '/app/configuracoes/horarios',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  {
    id: 'store',
    title: 'Meus Dados',
    description: 'Informações da conta e do salão.',
    icon: Store,
    href: '/app/configuracoes/loja',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
];

export function SettingsPage() {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-4 py-6 bg-white border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">Ajustes</h1>
        <p className="text-sm text-slate-500 mt-1">Configure as opções do seu salão</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3 max-w-2xl mx-auto">
          {SETTINGS_MENU.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.href}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all active:scale-[0.98]"
              >
                <div className={`p-3 rounded-xl flex-shrink-0 ${item.bgColor} ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-base">{item.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-2 leading-snug mt-0.5">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
