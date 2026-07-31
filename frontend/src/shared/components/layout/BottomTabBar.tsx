import { NavLink } from 'react-router';
import { Home, Calendar, Users, Settings } from 'lucide-react';

export function BottomTabBar() {
  const navItems = [
    { to: '/app', icon: Home, label: 'Início', end: true },
    { to: '/app/agenda', icon: Calendar, label: 'Agenda' },
    { to: '/app/clientes', icon: Users, label: 'Clientes' },
    { to: '/app/configuracoes', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-50">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-6 h-6 ${isActive ? 'fill-indigo-50' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
