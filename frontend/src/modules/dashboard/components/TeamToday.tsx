import type { TeamMember, TeamMemberState } from '../api/dashboard';

interface TeamTodayProps {
  team: TeamMember[];
}

const DOT: Record<TeamMemberState, string> = {
  FREE: 'bg-green-500',
  BUSY: 'bg-amber-500',
  OFF: 'bg-slate-300',
};

function statusText(member: TeamMember): string {
  if (member.state === 'BUSY') return `Atendendo até ${member.currentUntil}`;
  if (member.state === 'OFF') return 'Fora do expediente';
  return member.nextAt ? `Livre · próximo às ${member.nextAt}` : 'Livre';
}

export function TeamToday({ team }: TeamTodayProps) {
  return (
    <section>
      <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Equipe hoje</h2>
      {team.length === 0 ? (
        <p className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-sm text-slate-500">
          Nenhum profissional ativo.
        </p>
      ) : (
        <ul className="bg-white border border-slate-100 rounded-2xl shadow-sm divide-y divide-slate-100">
          {team.map((member) => (
            <li key={member.professionalId} className="flex items-center gap-3 p-3">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT[member.state]}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
                <p className="text-xs text-slate-500">{statusText(member)}</p>
              </div>
              <span className="text-xs font-semibold text-slate-500 flex-shrink-0">{member.appointmentsToday} hoje</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
