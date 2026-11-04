import React from 'react';
import { BatteryCharging, Battery, Clock, Settings, User } from 'lucide-react';
import { AgentStatus, UserProfile } from '../types';

interface HeaderProps {
  status: AgentStatus | null;
  user?: UserProfile | null;
  onRefresh?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  user,
  onRefresh,
  onOpenSettings,
  onOpenProfile
}) => {
  const bat = status?.telemetria.bateria ?? 85;
  const charging = status?.telemetria.cargando ?? false;
  const hora = status?.tiempo.horaOficial ?? '00:00';

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-danonino-border/70 px-4 py-2.5 safe-top">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Marca y Estado del Agente */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-danonino-cyan animate-pulse" />
            <span className="absolute w-4 h-4 rounded-full bg-danonino-cyan/40 animate-ping" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-danonino-cyan via-danonino-lavender to-danonino-violet bg-clip-text text-transparent">
              Danonino
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight -mt-0.5">
              Cognitive Core • {status?.mode ? status.mode.toUpperCase() : 'ONLINE'}
            </p>
          </div>
        </div>

        {/* Telemetría y Perfil de Usuario */}
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-1 bg-danonino-card/80 px-2 py-1 rounded-full border border-danonino-border">
            <Clock className="w-3 h-3 text-danonino-cyan" />
            <span className="font-mono text-[11px]">{hora}</span>
          </div>

          <div className="flex items-center gap-1 bg-danonino-card/80 px-2 py-1 rounded-full border border-danonino-border">
            {charging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-danonino-success animate-pulse" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-slate-300" />
            )}
            <span className="font-mono text-[11px]">{bat}%</span>
          </div>

          {/* Botón de Perfil */}
          {user && (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 bg-danonino-card/90 px-2.5 py-1 rounded-full border border-danonino-cyan/40 text-slate-200 hover:text-danonino-cyan hover:border-danonino-cyan transition-all"
              title="Mi Perfil"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-danonino-cyan text-danonino-bg flex items-center justify-center font-bold text-[9px]">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-[11px] font-semibold max-w-[70px] truncate">
                {user.displayName}
              </span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-1 rounded-lg text-slate-400 hover:text-danonino-cyan transition-colors"
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
