import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sparkles,
  MessageSquare,
  Compass,
  Brain,
  Zap,
  Moon,
  PhoneCall
} from 'lucide-react';

export const NavigationBar: React.FC = () => {
  const location = useLocation();

  // En la vista de llamada /live, no mostramos la barra para mantener experiencia inmersiva
  if (location.pathname === '/live') {
    return null;
  }

  const tabs = [
    { to: '/', label: 'Inicio', icon: Sparkles },
    { to: '/chat', label: 'Chat', icon: MessageSquare },
    { to: '/live', label: 'Live', icon: PhoneCall, isLive: true },
    { to: '/habitat', label: 'Habitat', icon: Compass },
    { to: '/memory', label: 'Memoria', icon: Brain },
    { to: '/evolution', label: 'Evolución', icon: Zap },
    { to: '/activity', label: 'Actividad', icon: Moon }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-danonino-border/70 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? tab.isLive
                      ? 'text-danonino-lavender scale-105 font-bold'
                      : 'text-danonino-cyan scale-105 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1.5 rounded-xl transition-colors ${
                      isActive
                        ? tab.isLive
                          ? 'bg-danonino-lavender/20 glow-violet'
                          : 'bg-danonino-cyan/15 glow-cyan'
                        : tab.isLive
                        ? 'bg-danonino-lavender/10 text-danonino-lavender'
                        : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] mt-0.5 tracking-tight font-mono">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
