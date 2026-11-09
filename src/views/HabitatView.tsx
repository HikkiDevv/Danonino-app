import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Sun,
  Moon,
  BookOpen,
  FlaskConical,
  Laptop,
  Sparkles,
  BedDouble,
  Lightbulb
} from 'lucide-react';
import { HabitatState, AgentStatus } from '../types';
import { DanoninoAvatar } from '../components/DanoninoAvatar';

interface HabitatViewProps {
  habitat: HabitatState | null;
  status: AgentStatus | null;
}

export const HabitatView: React.FC<HabitatViewProps> = ({ habitat, status }) => {
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const horaOficial = habitat?.horaOficial || status?.tiempo.horaOficial || '00:00';
  const ambiente = habitat?.ambiente || 'noche';
  const actividad = habitat?.actividad || 'escritorio';

  const isNight = ambiente === 'noche' || ambiente === 'madrugada';

  const zones = [
    {
      id: 'escritorio',
      title: 'Escritorio de Pensamiento',
      desc: 'Procesamiento de diálogo y decisiones en tiempo real con Qwen.',
      icon: Laptop,
      color: 'text-danonino-cyan',
      action: () => navigate('/chat')
    },
    {
      id: 'biblioteca',
      title: 'Biblioteca de Recuerdos',
      desc: 'Almacén persistente de grafos de conocimiento y relaciones.',
      icon: BookOpen,
      color: 'text-danonino-violet',
      action: () => navigate('/memory')
    },
    {
      id: 'laboratorio',
      title: 'Laboratorio de Hipótesis',
      desc: 'Simulaciones contrafactuales y consolidación recursiva DreamCycle.',
      icon: FlaskConical,
      color: 'text-danonino-lavender',
      action: () => navigate('/activity')
    },
    {
      id: 'descanso',
      title: 'Pod de Regeneración',
      desc: 'Ciclo bi-temporal de descanso e inferencia activa.',
      icon: BedDouble,
      color: 'text-emerald-400',
      action: () => {}
    }
  ];

  return (
    <div className="pb-24 px-4 pt-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Encabezado del Habitat */}
      <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-danonino-cyan" />
          <div>
            <h2 className="text-sm font-bold text-slate-100">Habitat Virtual</h2>
            <p className="text-[10px] text-slate-400">Espacio 2D interactivo de Danonino</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-danonino-card px-2.5 py-1 rounded-full border border-danonino-border text-xs font-mono">
          {isNight ? (
            <Moon className="w-3.5 h-3.5 text-danonino-lavender animate-pulse" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
          )}
          <span>{horaOficial}</span>
        </div>
      </div>

      {/* Escena 2D de la Habitación Virtual */}
      <div
        className={`relative w-full h-72 rounded-3xl overflow-hidden border border-danonino-border/80 shadow-2xl transition-colors duration-1000 ${
          isNight
            ? 'bg-gradient-to-b from-[#060a16] via-[#0d162a] to-[#0a0f1d]'
            : 'bg-gradient-to-b from-[#111c38] via-[#1a2b54] to-[#0f172a]'
        }`}
      >
        {/* Ventana con cielo según el ciclo solar */}
        <div className="absolute top-4 right-4 w-24 h-24 rounded-2xl border-2 border-danonino-border/60 overflow-hidden bg-gradient-to-b from-danonino-ciruela to-slate-900 p-2 shadow-inner">
          <div className="relative w-full h-full">
            {isNight ? (
              <>
                <div className="w-4 h-4 rounded-full bg-danonino-lavender/80 shadow-[0_0_12px_#8fe0c4] absolute top-1 right-2" />
                <div className="w-1 h-1 bg-white rounded-full absolute top-6 left-3 animate-ping" />
                <div className="w-1 h-1 bg-white rounded-full absolute bottom-3 right-5 opacity-70" />
                <div className="w-1 h-1 bg-white rounded-full absolute top-2 left-6 opacity-60" />
              </>
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-400 shadow-[0_0_15px_#f59e0b] absolute top-2 right-2" />
            )}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-slate-800/80 rounded-t-sm" />
          </div>
        </div>

        {/* Zona 1: Biblioteca (Izquierda Superior) */}
        <div
          onClick={() => setSelectedZone('biblioteca')}
          className="absolute top-6 left-6 cursor-pointer p-2 rounded-2xl bg-danonino-card/60 border border-danonino-border/60 hover:border-danonino-violet transition-all active:scale-95 text-center group"
        >
          <BookOpen className="w-6 h-6 text-danonino-violet mx-auto group-hover:scale-110 transition-transform" />
          <span className="text-[9px] text-slate-300 block mt-1">Biblioteca</span>
        </div>

        {/* Zona 2: Laboratorio (Derecha Inferior) */}
        <div
          onClick={() => setSelectedZone('laboratorio')}
          className="absolute bottom-6 right-6 cursor-pointer p-2 rounded-2xl bg-danonino-card/60 border border-danonino-border/60 hover:border-danonino-lavender transition-all active:scale-95 text-center group"
        >
          <FlaskConical className="w-6 h-6 text-danonino-lavender mx-auto group-hover:scale-110 transition-transform" />
          <span className="text-[9px] text-slate-300 block mt-1">Laboratorio</span>
        </div>

        {/* Zona 3: Pod de Regeneración (Izquierda Inferior) */}
        <div
          onClick={() => setSelectedZone('descanso')}
          className="absolute bottom-6 left-6 cursor-pointer p-2 rounded-2xl bg-danonino-card/60 border border-danonino-border/60 hover:border-emerald-400 transition-all active:scale-95 text-center group"
        >
          <BedDouble className="w-6 h-6 text-emerald-400 mx-auto group-hover:scale-110 transition-transform" />
          <span className="text-[9px] text-slate-300 block mt-1">Regeneración</span>
        </div>

        {/* Zona 4: Escritorio y Avatar Central */}
        <div
          onClick={() => setSelectedZone('escritorio')}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center group"
        >
          <div className="relative">
            <DanoninoAvatar
              size="lg"
              mode={actividad === 'descanso' ? 'dreaming' : actividad === 'laboratorio' ? 'thinking' : 'idle'}
            />
          </div>
          <div className="mt-2 px-2.5 py-0.5 rounded-full bg-danonino-card/90 border border-danonino-cyan/50 text-[10px] text-danonino-cyan font-mono shadow-md">
            {actividad.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Modal / Tarjeta Informativa de la Zona Seleccionada */}
      {selectedZone && (
        <div className="glass-panel p-4 rounded-2xl border border-danonino-cyan/40 animate-fade-in">
          {(() => {
            const z = zones.find((item) => item.id === selectedZone);
            if (!z) return null;
            const Icon = z.icon;
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${z.color}`} />
                    <h3 className="text-xs font-bold text-slate-100">{z.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedZone(null)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cerrar
                  </button>
                </div>
                <p className="text-xs text-slate-300">{z.desc}</p>
                <button
                  onClick={z.action}
                  className="w-full mt-2 py-2 bg-danonino-cyan/20 border border-danonino-cyan/50 rounded-xl text-xs font-semibold text-danonino-cyan hover:bg-danonino-cyan/30 transition-all"
                >
                  Interactuar con esta área
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Lista de Áreas del Habitat */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase px-1">
          Espacios y Actividades
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {zones.map((z) => {
            const Icon = z.icon;
            const isActive = actividad === z.id;
            return (
              <div
                key={z.id}
                onClick={z.action}
                className={`glass-panel p-3 rounded-2xl cursor-pointer border transition-all active:scale-95 ${
                  isActive ? 'border-danonino-cyan glow-cyan' : 'border-danonino-border/70 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${z.color}`} />
                  <span className="text-xs font-semibold text-slate-200 truncate">{z.title}</span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{z.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
