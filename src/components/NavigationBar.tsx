import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  MessageSquare,
  Compass,
  Brain,
  Zap,
  Moon
} from 'lucide-react';

export const NavigationBar: React.FC = () => {
  const tabs = [
    { to: '/', label: 'Inicio', icon: Sparkles },
    { to: '/chat', label: 'Chat', icon: MessageSquare },
    { to: '/habitat', label: 'Habitat', icon: Compass },
    { to: '/memory', label: 'Memoria', icon: Brain },
    { to: '/evolution', label: 'Evolución', icon: Zap },
    { to: '/activity', label: 'Actividad', icon: Moon }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-danonino-border/70 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-danonino-cyan scale-105 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-danonino-card/40'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-danonino-cyan/15 glow-cyan' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
