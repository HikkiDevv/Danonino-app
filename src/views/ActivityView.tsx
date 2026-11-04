import React, { useState, useEffect } from 'react';
import { Moon, Play, Pause, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { api } from '../services/api';
import { AutonomyData } from '../types';

export const ActivityView: React.FC = () => {
  const [data, setData] = useState<AutonomyData | null>(null);
  const [isDreamingNow, setIsDreamingNow] = useState(false);
  const [dreamMessage, setDreamMessage] = useState<string | null>(null);
  const [autonomyActive, setAutonomyActive] = useState(true);

  const loadData = async () => {
    try {
      const res = await api.getAutonomous();
      if (res.ok) setData(res);
    } catch (err: any) {
      console.error('Error cargando actividad:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerDream = async () => {
    setIsDreamingNow(true);
    setDreamMessage('Ejecutando consolidación recursiva de recuerdos (DreamCycle 2.0)...');
    try {
      const res = await api.triggerDreamCycle();
      if (res.ok && res.dreamResult) {
        setDreamMessage(`DreamCycle exitoso: ${res.dreamResult.dream_id || 'Completado'}. Recuerdos procesados: ${res.dreamResult.memories_processed ?? 0}`);
        loadData();
      }
    } catch (err: any) {
      setDreamMessage('Error ejecutando ciclo: ' + err.message);
    } finally {
      setIsDreamingNow(false);
    }
  };

  return (
    <div className="pb-24 px-4 pt-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-danonino-lavender" />
          <div>
            <h2 className="text-sm font-bold text-slate-100">Actividad Autónoma</h2>
            <p className="text-[10px] text-slate-400">DreamCycle y consolidación cognitiva</p>
          </div>
        </div>

        <button
          onClick={() => setAutonomyActive(!autonomyActive)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition-colors ${
            autonomyActive
              ? 'bg-danonino-success/15 text-danonino-success border border-danonino-success/30'
              : 'bg-slate-700/50 text-slate-400 border border-slate-600'
          }`}
        >
          {autonomyActive ? (
            <>
              <Play className="w-3 h-3" />
              <span>Activo</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3" />
              <span>Pausado</span>
            </>
          )}
        </button>
      </div>

      {/* Disparador Manual de DreamCycle */}
      <div className="glass-panel p-4 rounded-3xl border border-danonino-lavender/40 relative overflow-hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-danonino-lavender" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              DreamCycle 2.0 en Demanda
            </h3>
          </div>
          <span className="text-[10px] font-mono text-danonino-lavender bg-danonino-lavender/10 px-2 py-0.5 rounded-full">
            Cada 2h automático
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Consolida recuerdos episódicos recientes en SQLite, genera hipótesis inductivas y resuelve contradicciones semánticas.
        </p>

        <button
          onClick={handleTriggerDream}
          disabled={isDreamingNow}
          className="w-full py-2.5 bg-gradient-to-r from-danonino-violet to-danonino-blue hover:opacity-90 disabled:opacity-50 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-danonino-violet/20 active:scale-95 transition-all"
        >
          {isDreamingNow ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-danonino-cyan" />
              <span>Consolidando memoria...</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              <span>Iniciar DreamCycle Ahora</span>
            </>
          )}
        </button>

        {dreamMessage && (
          <div className="p-2.5 rounded-xl bg-danonino-card/80 border border-danonino-border text-[11px] text-danonino-cyan leading-tight font-mono">
            {dreamMessage}
          </div>
        )}
      </div>

      {/* Historial de Ciclos de Sueño (Dream Journal) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-slate-400 uppercase">
            Registro de Sueños Recientes
          </h3>
          <button
            onClick={loadData}
            className="text-[10px] text-danonino-cyan font-mono hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Actualizar</span>
          </button>
        </div>

        {data?.suenosRecientes && data.suenosRecientes.length > 0 ? (
          data.suenosRecientes.map((d, i) => (
            <div
              key={d.dream_id || i}
              className="glass-panel p-3.5 rounded-2xl border border-danonino-border/70 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-danonino-success" />
                  <span className="font-mono font-bold text-slate-200 truncate max-w-[170px]">
                    {d.dream_id}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {d.started_at ? String(d.started_at).slice(11, 16) : 'Completado'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-400">
                <div className="bg-danonino-card/60 p-1.5 rounded-lg text-center">
                  <span className="block text-slate-200 font-bold">{d.memories_processed ?? 0}</span>
                  <span className="text-[9px]">Recuerdos</span>
                </div>
                <div className="bg-danonino-card/60 p-1.5 rounded-lg text-center">
                  <span className="block text-danonino-cyan font-bold">{d.associations_created ?? 0}</span>
                  <span className="text-[9px]">Asociaciones</span>
                </div>
                <div className="bg-danonino-card/60 p-1.5 rounded-lg text-center">
                  <span className="block text-danonino-lavender font-bold">{d.hypotheses_generated ?? 0}</span>
                  <span className="text-[9px]">Hipótesis</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 glass-panel rounded-2xl text-xs text-slate-400">
            No hay registros de ciclos de sueño recientes.
          </div>
        )}
      </div>
    </div>
  );
};
