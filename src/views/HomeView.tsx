import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Brain,
  Sparkles,
  ArrowRight,
  Zap,
  Activity,
  Lightbulb,
  PhoneCall,
  Clock,
  Moon
} from 'lucide-react';
import { DanoninoAvatar } from '../components/DanoninoAvatar';
import { AgentStatus } from '../types';

interface HomeViewProps {
  status: AgentStatus | null;
  onRefresh: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ status, onRefresh }) => {
  const navigate = useNavigate();
  const [avatarClicks, setAvatarClicks] = useState(0);

  const getGreeting = () => {
    const momento = status?.tiempo?.momentoDia || 'noche';
    if (momento === 'madrugada') return 'Buenas madrugadas. La calma de la noche es ideal para reflexionar.';
    if (momento === 'mañana') return 'Buen día. Todo sincronizado para una nueva jornada.';
    if (momento === 'tarde') return 'Buenas tardes. Actividades y procesos en curso.';
    return 'Buenas noches. Conversaciones activas y memoria lista.';
  };

  const avatarModes = ['idle', 'curious', 'speaking', 'thinking'] as const;
  const currentMode =
    avatarClicks > 0
      ? avatarModes[avatarClicks % avatarModes.length]
      : status?.mode === 'thinking'
      ? 'thinking'
      : status?.mode === 'dreaming'
      ? 'sleeping'
      : 'idle';

  return (
    <div className="pb-24 px-4 pt-4 max-w-md mx-auto space-y-5 animate-fade-in">
      {/* 1. Tarjeta Principal — Danonino Companion */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden text-center border border-danonino-border/80">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-danonino-cyan via-danonino-lavender to-danonino-violet" />

        <div className="flex flex-col items-center justify-center my-2">
          <DanoninoAvatar
            size="xl"
            mode={currentMode}
            onClick={() => setAvatarClicks((prev) => prev + 1)}
          />

          <h2 className="text-xl font-bold mt-4 tracking-tight text-slate-100">Danonino</h2>
          <p className="text-xs text-danonino-cyan font-mono mt-0.5">
            {status?.tiempo?.fechaTexto || 'Sincronizado • America/Lima'}
          </p>

          <p className="text-xs text-slate-300 mt-3 px-2 italic font-normal leading-relaxed">
            «{getGreeting()}»
          </p>
        </div>

        {/* Botones de Acción Primarios */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <button
            onClick={() => navigate('/live')}
            className="col-span-2 flex items-center justify-center gap-2 bg-gradient-to-r from-danonino-cyan via-danonino-lavender to-danonino-violet text-danonino-bg font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-danonino-cyan/20 transition-all active:scale-95 text-xs"
          >
            <PhoneCall className="w-4 h-4 text-danonino-bg" />
            <span>Hablar con Danonino (Live)</span>
          </button>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-danonino-violet to-danonino-blue hover:opacity-90 text-white font-medium py-2.5 px-3 rounded-xl shadow-lg shadow-danonino-violet/20 transition-all active:scale-95 text-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Abrir Chat</span>
          </button>

          <button
            onClick={() => navigate('/memory')}
            className="flex items-center justify-center gap-2 bg-danonino-card hover:bg-danonino-cardHover text-slate-200 border border-danonino-border font-medium py-2.5 px-3 rounded-xl transition-all active:scale-95 text-xs"
          >
            <Brain className="w-4 h-4 text-danonino-cyan" />
            <span>Ver Recuerdos</span>
          </button>
        </div>
      </div>

      {/* 2. Estadísticas Simplificadas y Comprensibles */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="glass-panel p-3 rounded-2xl text-center border border-danonino-border/70">
          <MessageSquare className="w-4 h-4 text-danonino-cyan mx-auto mb-1" />
          <div className="text-base font-bold font-mono text-slate-100">
            {status?.usuarioActual?.mensajesPrivados ?? (status?.sesion?.mensajesSesion ?? 0)}
          </div>
          <div className="text-[10px] text-slate-400">Conversaciones</div>
        </div>

        <div className="glass-panel p-3 rounded-2xl text-center border border-danonino-border/70">
          <Brain className="w-4 h-4 text-danonino-lavender mx-auto mb-1" />
          <div className="text-base font-bold font-mono text-slate-100">
            {status?.usuarioActual?.recuerdosSemanticos ?? (status?.metricasCognitivas?.memoriasTotales ?? 0)}
          </div>
          <div className="text-[10px] text-slate-400">Recuerdos</div>
        </div>

        <div className="glass-panel p-3 rounded-2xl text-center border border-danonino-border/70">
          <Activity className="w-4 h-4 text-danonino-success mx-auto mb-1" />
          <div className="text-base font-bold font-mono text-slate-100">
            {status?.usuarioActual?.ciclosSueno ?? (status?.metricasCognitivas?.ciclosSueno ?? 0)}
          </div>
          <div className="text-[10px] text-slate-400">Reflexiones</div>
        </div>
      </div>

      {/* 3. Actividad Reciente */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase px-1">
          Actividad y Memoria
        </h3>

        <div
          onClick={() => navigate('/memory')}
          className="glass-panel p-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-danonino-cyan/40 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-danonino-cyan/15 text-danonino-cyan">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Memoria Personal</div>
              <div className="text-[10px] text-slate-400">Recuerdos aislados con búsqueda instantánea</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </div>

        <div
          onClick={() => navigate('/activity')}
          className="glass-panel p-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-danonino-violet/40 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-danonino-violet/15 text-danonino-violet">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Línea de Actividad y Reflexiones</div>
              <div className="text-[10px] text-slate-400">Hechos, inferencias y ciclos autónomos</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </div>

        <div
          onClick={() => navigate('/oneiros')}
          className="glass-panel p-3.5 rounded-2xl flex items-center justify-between cursor-pointer border border-danonino-lavender/30 hover:border-danonino-lavender transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-danonino-lavender/20 text-danonino-lavender">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Proyecto ONEIROS</div>
              <div className="text-[10px] text-slate-400">Sueños lúcidos, reglas alterables y diario narrativo</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-danonino-lavender" />
        </div>
      </div>
    </div>
  );
};
