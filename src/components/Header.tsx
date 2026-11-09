import React from 'react';
import { Settings } from 'lucide-react';
import { AgentStatus, UserProfile } from '../types';
import { miAvatarLocal } from '../services/api';

interface HeaderProps {
  status: AgentStatus | null;
  user?: UserProfile | null;
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, user, onOpenSettings, onOpenProfile }) => {
  const hora = status?.tiempo?.horaOficial ?? '';
  const pensando = status?.mode === 'thinking';
  const sonando = status?.mode === 'dreaming';
  const avatar = miAvatarLocal();

  return (
    <header className="sticky top-0 z-40 safe-top bg-danonino-bg/85 backdrop-blur-md border-b border-danonino-border/50">
      <div className="max-w-md mx-auto flex items-center justify-between px-5 h-14">
        <div className="flex items-baseline gap-2">
          <span className="font-display italic text-[24px] leading-none tracking-tight text-slate-100" style={{ fontVariationSettings: "'SOFT' 100, 'WONK' 1" }}>Danonino</span>
          <span className={`w-1.5 h-1.5 rounded-full translate-y-[-3px] ${sonando ? 'bg-danonino-menta' : 'bg-danonino-tomate'} ${pensando ? 'animate-ping' : 'animate-respirar'}`} />
          {sonando && <span className="kicker !text-danonino-menta">soñando</span>}
        </div>

        <div className="flex items-center gap-2.5">
          {hora && <span className="font-mono text-[10.5px] text-slate-400 tabular-nums">{hora}</span>}
          {user && (
            <button onClick={onOpenProfile} className="w-8 h-8 rounded-full overflow-hidden border border-danonino-border bg-danonino-card flex items-center justify-center active:scale-95 transition-transform" title="Mi perfil">
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                : <span className="font-display text-[14px] text-danonino-tomate">{user.displayName.charAt(0).toUpperCase()}</span>}
            </button>
          )}
          <button onClick={onOpenSettings} className="p-1.5 text-slate-500 active:text-danonino-tomate transition-colors" title="Conexión">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
