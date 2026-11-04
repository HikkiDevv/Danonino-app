import React, { useState, useEffect } from 'react';
import { Moon, RefreshCw, CheckCircle2, AlertTriangle, Layers, Clock, Brain, Filter, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { ActivityEvent } from '../types';

export const ActivityView: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('todos');
  const [isDreaming, setIsDreaming] = useState(false);
  const [dreamMessage, setDreamMessage] = useState<string | null>(null);

  const filters = [
    { id: 'todos', label: 'Todos' },
    { id: 'reflection', label: 'Reflexiones' },
    { id: 'fact', label: 'Hechos' },
    { id: 'inference', label: 'Inferencias' },
    { id: 'action', label: 'Acciones' },
    { id: 'error', label: 'Incidentes' }
  ];

  const loadActivity = async () => {
    setLoading(true);
    try {
      const res = await api.getActivity(40);
      if (res.ok && res.events) {
        setEvents(res.events);
      }
    } catch (err: any) {
      console.error('Error cargando actividad:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  const handleTriggerDream = async () => {
    setIsDreaming(true);
    setDreamMessage('Consolidando recuerdos recientes y generando síntesis cognitiva...');
    try {
      const res = await api.triggerDreamCycle();
      if (res.ok && res.dreamResult) {
        setDreamMessage(
          `Reflexión completada (${res.dreamResult.dream_id || 'OK'}). Recuerdos procesados: ${
            res.dreamResult.memories_processed ?? 0
          }`
        );
        loadActivity();
      }
    } catch (err: any) {
      setDreamMessage('Interrupción en ciclo: ' + err.message);
    } finally {
      setIsDreaming(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (selectedFilter === 'todos') return true;
    return e.type === selectedFilter;
  });

  const getEventStyle = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'reflection':
        return {
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          dot: 'bg-indigo-400 shadow-indigo-500/50',
          label: 'Reflexión',
          icon: Moon
        };
      case 'fact':
        return {
          badge: 'bg-cyan-500/20 text-danonino-cyan border-cyan-500/30',
          dot: 'bg-danonino-cyan shadow-cyan-500/50',
          label: 'Hecho observado',
          icon: Brain
        };
      case 'inference':
        return {
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400 shadow-purple-500/50',
          label: 'Inferencia',
          icon: Layers
        };
      case 'action':
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400 shadow-emerald-500/50',
          label: 'Acción temporal',
          icon: Clock
        };
      case 'error':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400 shadow-amber-500/50',
          label: 'Incidente',
          icon: AlertTriangle
        };
      default:
        return {
          badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
          dot: 'bg-slate-400 shadow-slate-500/50',
          label: 'Evento',
          icon: CheckCircle2
        };
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Registro reciente';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;
      return date.toLocaleDateString([], {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="pb-24 px-4 pt-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <Moon className="w-5 h-5 text-danonino-cyan" />
          <div>
            <h2 className="text-sm font-bold text-slate-100">Actividad Cognitiva</h2>
            <p className="text-[10px] text-slate-400">Línea temporal de eventos y reflexiones</p>
          </div>
        </div>

        <button
          onClick={loadActivity}
          disabled={loading}
          className="p-2 rounded-xl bg-danonino-card border border-danonino-border hover:border-danonino-cyan text-slate-300 transition-colors"
          title="Actualizar actividad"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-danonino-cyan' : ''}`} />
        </button>
      </div>

      {/* Disparador de Reflexión Manual */}
      <div className="glass-panel p-4 rounded-3xl border border-danonino-border/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-danonino-cyan" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              Reflexión Autónoma (DreamCycle)
            </h3>
          </div>
          <span className="text-[9px] font-mono text-slate-400 bg-danonino-card px-2 py-0.5 rounded-md border border-danonino-border">
            Cada 2h automático
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Sintetiza interacciones recientes, genera hipótesis inductivas y consolida la memoria a largo plazo.
        </p>

        <button
          onClick={handleTriggerDream}
          disabled={isDreaming}
          className="w-full py-2.5 bg-danonino-card border border-danonino-cyan/40 hover:border-danonino-cyan text-danonino-cyan font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm disabled:opacity-50"
        >
          {isDreaming ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-danonino-cyan" />
              <span>Ejecutando reflexión...</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5" />
              <span>Iniciar Reflexión Ahora</span>
            </>
          )}
        </button>

        {dreamMessage && (
          <div className="p-2.5 rounded-xl bg-danonino-bg border border-danonino-border text-[11px] text-danonino-cyan font-mono animate-fade-in">
            {dreamMessage}
          </div>
        )}
      </div>

      {/* Filtros de la Línea Temporal */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition-all ${
              selectedFilter === f.id
                ? 'bg-danonino-cyan text-danonino-bg font-bold shadow-md shadow-danonino-cyan/20'
                : 'bg-danonino-card text-slate-400 border border-danonino-border hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Línea Temporal Vertical */}
      <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-danonino-border/60">
        {loading && events.length === 0 ? (
          <div className="glass-panel p-8 text-center text-xs text-slate-400 space-y-2 rounded-2xl ml-7">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-danonino-cyan" />
            <p>Consultando eventos cognitivos...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="glass-panel p-8 text-center text-xs text-slate-400 space-y-2 rounded-2xl ml-7">
            <Clock className="w-6 h-6 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-300">Sin eventos en esta categoría</p>
            <p className="text-[11px] text-slate-500">
              Las nuevas observaciones y reflexiones se registrarán aquí en tiempo real.
            </p>
          </div>
        ) : (
          filteredEvents.map((e) => {
            const style = getEventStyle(e.type);
            const Icon = style.icon;

            return (
              <div key={e.id} className="relative pl-7 animate-fade-in">
                {/* Punto luminoso conector */}
                <div
                  className={`absolute left-2.5 top-3.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full ring-4 ring-danonino-bg ${style.dot} shadow-sm`}
                />

                <div className="glass-panel p-3.5 rounded-2xl border border-danonino-border/80 hover:border-danonino-border space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md border font-mono font-medium flex items-center gap-1 ${style.badge}`}>
                        <Icon className="w-2.5 h-2.5" />
                        <span>{style.label}</span>
                      </span>
                      {e.confidence !== undefined && (
                        <span className="text-slate-400 font-mono text-[9px]">
                          Confianza: {Math.round(e.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    <span className="text-slate-400 font-mono">{formatDate(e.timestamp)}</span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200">{e.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed break-words">{e.description}</p>

                  {e.status && (
                    <div className="text-[9px] font-mono text-slate-500 pt-1 border-t border-danonino-border/40">
                      Estado: <span className="text-slate-300">{e.status}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
