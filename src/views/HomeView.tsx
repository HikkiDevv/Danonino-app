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
  PhoneCall
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

  const avatarModes = ['idle', 'curious', 'speaking', 'thinking', 'happy'] as const;
  const currentMode = avatarClicks > 0
    ? avatarModes[avatarClicks % avatarModes.length]
    : (status?.mode === 'thinking' ? 'thinking' : status?.mode === 'dreaming' ? 'dreaming' : 'idle');

  return (
    <div className="pb-24 px-4 pt-4 max-w-md mx-auto space-y-5 animate-fade-in">
      {/* 1. Tarjeta Principal — Danonino Alive */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden text-center border border-danonino-border/80">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-danonino-cyan via-danonino-lavender to-danonino-violet" />

        <div className="flex flex-col items-center justify-center my-2">
          <DanoninoAvatar
            size="xl"
            mode={currentMode}
            onClick={() => setAvatarClicks((prev) => prev + 1)}
          />

          <h2 className="text-xl font-bold mt-4 tracking-tight">Danonino</h2>
          <p className="text-xs text-danonino-cyan font-mono mt-0.5">
            {status?.tiempo?.fechaTexto || 'Sincronizado • America/Lima'}
          </p>

          <p className="text-sm text-slate-300 mt-3 px-2 italic font-normal leading-relaxed">
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
            <span>Llamada Multimodal en Vivo (Live)</span>
          </button>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-danonino-violet to-danonino-blue hover:opacity-90 text-white font-medium py-2.5 px-3 rounded-xl shadow-lg shadow-danonino-violet/20 transition-all active:scale-95 text-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Abrir Chat Privado</span>
          </button>

          <button
            onClick={() => navigate('/memory')}
            className="flex items-center justify-center gap-2 bg-danonino-card hover:bg-danonino-cardHover text-slate-200 border border-danonino-border font-medium py-2.5 px-3 rounded-xl transition-all active:scale-95 text-xs"
          >
            <Brain className="w-4 h-4 text-danonino-cyan" />
            <span>Ver Memorias</span>
          </button>
        </div>
      </div>

      {/* 2. Métricas y Estado Cognitivo Rápido */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="glass-panel p-3 rounded-2xl text-center">
          <Brain className="w-4 h-4 text-danonino-lavender mx-auto mb-1" />
          <div className="text-base font-bold font-mono">
            {status?.usuarioActual?.mensajesPrivados ?? (status?.metricasCognitivas?.memoriasTotales ?? 0)}
          </div>
          <div className="text-[10px] text-slate-400">Mensajes Privados</div>
        </div>

        <div className="glass-panel p-3 rounded-2xl text-center">
          <Zap className="w-4 h-4 text-danonino-cyan mx-auto mb-1" />
          <div className="text-base font-bold font-mono">
            {status?.usuarioActual?.recuerdosSemanticos ?? (status?.metricasCognitivas?.episodiosConsolidados ?? 0)}
          </div>
          <div className="text-[10px] text-slate-400">Recuerdos Sem0</div>
        </div>

        <div className="glass-panel p-3 rounded-2xl text-center">
          <Activity className="w-4 h-4 text-danonino-success mx-auto mb-1" />
          <div className="text-base font-bold font-mono">
            {status?.usuarioActual?.ciclosSueno ?? (status?.metricasCognitivas?.ciclosSueno ?? 0)}
          </div>
          <div className="text-[10px] text-slate-400">DreamCycles</div>
        </div>
      </div>

      {/* 3. Pensamiento Autónomo del Agente */}
      <div className="glass-panel rounded-2xl p-4 border border-danonino-border">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-danonino-warning" />
            <h3 className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
              Pensamiento Autónomo
            </h3>
          </div>
          <span className="text-[10px] text-danonino-cyan font-mono">Aislado</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-danonino-card/60 p-3 rounded-xl border border-danonino-border/60">
          «El espacio conversacional y la memoria episódica están particionados de forma independiente para cada usuario registrado.»
        </p>
      </div>

      {/* 4. Dimensiones Cognitivas Disponibles */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase px-1">
          Espacios Cognitivos
        </h3>

        <div
          onClick={() => navigate('/memory')}
          className="glass-panel p-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-danonino-violet/60 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-danonino-violet/15 text-danonino-violet">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Memoria Viva y Semántica</div>
              <div className="text-[10px] text-slate-400">Recuerdos personales y búsqueda en tiempo real</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </div>

        <div
          onClick={() => navigate('/activity')}
          className="glass-panel p-3.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-danonino-lavender/60 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-danonino-lavender/15 text-danonino-lavender">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Consolidación & DreamCycle</div>
              <div className="text-[10px] text-slate-400">Sueño sintético y diario de hipótesis</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </div>
  );
};
