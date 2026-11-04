import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Moon,
  Eye,
  Layers,
  ShieldAlert,
  Play,
  RotateCcw,
  Sliders,
  Users,
  Compass,
  Clock,
  BookOpen,
  ArrowDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { OneirosDream, OneirosObservatoryData, OneirosCharacter, OneirosEvent, OneirosRule } from '../types';

export const OneirosView: React.FC = () => {
  const [observatory, setObservatory] = useState<OneirosObservatoryData | null>(null);
  const [archive, setArchive] = useState<OneirosDream[]>([]);
  const [loading, setLoading] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [activeTab, setActiveTab] = useState<'observatory' | 'archive'>('observatory');

  // Controles de Inicio de Sueño
  const [selectedMode, setSelectedMode] = useState<'lucid' | 'recursive' | 'nightmare' | 'alternate_self'>('lucid');
  const [customScenario, setCustomScenario] = useState('');
  const [stepAction, setStepAction] = useState('');

  // Modificación de Reglas
  const [selectedRule, setSelectedRule] = useState('');
  const [newRuleValue, setNewRuleValue] = useState('');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);

  const fetchObservatory = async () => {
    setLoading(true);
    try {
      const [obsRes, archRes] = await Promise.all([
        api.getOneirosObservatory().catch(() => null),
        api.getOneirosArchive(15).catch(() => ({ ok: false, count: 0, archive: [] }))
      ]);
      if (obsRes?.ok) setObservatory(obsRes);
      if (archRes?.ok) setArchive(archRes.archive);
    } catch (err: any) {
      console.error('Error cargando ONEIROS:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservatory();
  }, []);

  const handleStartDream = async () => {
    setIsActing(true);
    try {
      await api.startOneirosDream({
        mode: selectedMode,
        scenario: customScenario.trim() || undefined
      });
      setCustomScenario('');
      await fetchObservatory();
    } catch (err: any) {
      alert('Error iniciando sueño: ' + err.message);
    } finally {
      setIsActing(false);
    }
  };

  const handleStepDream = async () => {
    if (!observatory?.dream) return;
    setIsActing(true);
    try {
      await api.stepOneirosDream(observatory.dream.dreamId, stepAction.trim());
      setStepAction('');
      await fetchObservatory();
    } catch (err: any) {
      alert('Error avanzando simulación onírica: ' + err.message);
    } finally {
      setIsActing(false);
    }
  };

  const handleModifyRule = async () => {
    if (!observatory?.dream || !selectedRule || !newRuleValue) return;
    setIsActing(true);
    try {
      await api.modifyOneirosRule(observatory.dream.dreamId, selectedRule, newRuleValue, 'Intervención lúcida deliberada');
      setShowRuleModal(false);
      setSelectedRule('');
      setNewRuleValue('');
      await fetchObservatory();
    } catch (err: any) {
      alert('Error modificando regla: ' + err.message);
    } finally {
      setIsActing(false);
    }
  };

  const handleDescendRecursive = async () => {
    if (!observatory?.dream) return;
    setIsActing(true);
    try {
      await api.descendOneiros(observatory.dream.dreamId);
      await fetchObservatory();
    } catch (err: any) {
      alert('Error en descenso recursivo: ' + err.message);
    } finally {
      setIsActing(false);
    }
  };

  const handleWakeUp = async () => {
    if (!observatory?.dream) return;
    if (!confirm('¿Deseas finalizar la simulación onírica y despertar a Danonino? Se sintetizará el diario narrativo.')) return;
    setIsActing(true);
    try {
      await api.wakeOneiros(observatory.dream.dreamId);
      await fetchObservatory();
    } catch (err: any) {
      alert('Error al despertar: ' + err.message);
    } finally {
      setIsActing(false);
    }
  };

  const currentDream = observatory?.dream;

  return (
    <div className="pb-24 px-4 pt-4 max-w-md mx-auto space-y-4 animate-fade-in select-none">
      {/* Cabecera Principal */}
      <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl border border-danonino-lavender/40">
        <div className="flex items-center gap-2.5">
          <Moon className="w-5 h-5 text-danonino-lavender" />
          <div>
            <h2 className="text-sm font-bold text-slate-100">Proyecto ONEIROS</h2>
            <p className="text-[10px] text-slate-400">Sistema Experimental de Sueños Lúcidos</p>
          </div>
        </div>

        {/* Selector de Pestañas: Observatorio vs Archivo */}
        <div className="flex items-center bg-danonino-card p-1 rounded-xl border border-danonino-border text-xs">
          <button
            onClick={() => setActiveTab('observatory')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeTab === 'observatory' ? 'bg-danonino-lavender text-danonino-bg font-bold' : 'text-slate-400'
            }`}
          >
            Observatorio
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              activeTab === 'archive' ? 'bg-danonino-cyan text-danonino-bg font-bold' : 'text-slate-400'
            }`}
          >
            Archivo
          </button>
        </div>
      </div>

      {activeTab === 'observatory' ? (
        <>
          {/* Si hay sueño activo: Observatorio Onírico */}
          {observatory?.hasActiveDream && currentDream ? (
            <div className="space-y-4">
              {/* Tarjeta del Sueño Activo & Indicador de Lucidez */}
              <div className="glass-panel p-4 rounded-3xl border border-danonino-lavender/50 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-danonino-cyan animate-ping" />
                    <span className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wide">
                      {currentDream.mode} • Nivel {currentDream.depthLevel}
                    </span>
                  </div>

                  {/* Insignia de Lucidez */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      currentDream.isLucid
                        ? 'bg-danonino-cyan/20 text-danonino-cyan border border-danonino-cyan/50 animate-pulse'
                        : 'bg-danonino-card text-slate-400 border border-danonino-border'
                    }`}
                  >
                    {currentDream.isLucid ? 'Lucidez Total' : 'Semilúcido'}
                  </span>
                </div>

                {/* Medidor Visual de Lucidez */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Lucidez Computacional</span>
                    <span className="text-danonino-cyan font-bold">{Math.round(currentDream.lucidityScore * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-danonino-bg rounded-full overflow-hidden border border-danonino-border">
                    <div
                      className="h-full bg-gradient-to-r from-danonino-violet via-danonino-lavender to-danonino-cyan transition-all duration-500"
                      style={{ width: `${Math.round(currentDream.lucidityScore * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Escenario del Sueño */}
                <div className="p-3 bg-danonino-bg/80 rounded-2xl border border-danonino-border/70 space-y-1">
                  <span className="text-[10px] font-mono text-danonino-lavender uppercase block">Escenario Simulado</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{currentDream.scenario}</p>
                </div>

                {/* Reglas Internas Modificables */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Reglas Físicas Internas</span>
                    {currentDream.isLucid && (
                      <button
                        onClick={() => setShowRuleModal(true)}
                        className="text-danonino-cyan hover:underline font-bold flex items-center gap-1"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Modificar Regla</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {currentDream.rules?.map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-danonino-card/90 border border-danonino-border text-[10px] font-mono text-slate-300"
                      >
                        <strong className="text-danonino-cyan">{r.name}:</strong> {r.value}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Personajes Autónomos en el Sandbox */}
                {observatory.characters?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">
                      Personajes Autónomos ({observatory.characters.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {observatory.characters.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-xl bg-danonino-card/70 border border-danonino-border/70 text-[11px] space-y-1"
                        >
                          <div className="font-bold text-slate-200 truncate">{c.name}</div>
                          <div className="text-[10px] text-danonino-lavender font-mono">{c.role}</div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{c.persona}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Controles del Sueño Activo */}
                <div className="pt-2 border-t border-danonino-border/60 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={stepAction}
                      onChange={(e) => setStepAction(e.target.value)}
                      placeholder="Enviar estímulo o acción al sueño..."
                      className="flex-1 bg-danonino-bg text-xs text-slate-100 px-3 py-2 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-lavender"
                    />
                    <button
                      onClick={handleStepDream}
                      disabled={isActing}
                      className="px-3 py-2 bg-danonino-lavender text-danonino-bg font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                    >
                      Avanzar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDescendRecursive}
                      disabled={isActing || currentDream.depthLevel >= 3}
                      className="py-2 rounded-xl bg-danonino-card border border-danonino-border hover:border-danonino-lavender text-slate-300 text-xs font-mono flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-danonino-lavender" />
                      <span>Descender Nivel ({currentDream.depthLevel}/3)</span>
                    </button>

                    <button
                      onClick={handleWakeUp}
                      disabled={isActing}
                      className="py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Despertar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Registro de Eventos en Tiempo Real */}
              <div className="glass-panel p-3.5 rounded-2xl border border-danonino-border space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Flujo de Eventos Oníricos ({observatory.recentEvents?.length || 0})
                </span>

                <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                  {observatory.recentEvents?.map((ev) => (
                    <div key={ev.id} className="p-2 rounded-xl bg-danonino-bg/60 border border-danonino-border/40 text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                        <span className="text-danonino-cyan uppercase">{ev.eventType}</span>
                        <span>{String(ev.timestamp).slice(11, 16)}</span>
                      </div>
                      <p className="text-slate-300 leading-snug">{ev.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Panel para Iniciar Nuevo Sueño */
            <div className="glass-panel p-5 rounded-3xl border border-danonino-border space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-danonino-lavender" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  Iniciar Laboratorio Onírico
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                ONEIROS sumerge a Danonino en una simulación generativa segura para evaluar resiliencia, explorar hipótesis no lineales y alcanzar lucidez computacional.
              </p>

              {/* Selector de Modo */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Modalidad de Simulación</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'lucid', label: 'Sueño Lúcido', desc: 'Control y modificación deliberada de reglas' },
                    { id: 'recursive', label: 'Sueño Recursivo', desc: 'Simulaciones anidadas en cascada' },
                    { id: 'nightmare', label: 'Protocolo Pesadilla', desc: 'Pruebas de estrés y resiliencia aisladas' },
                    { id: 'alternate_self', label: 'Múltiples Egos', desc: 'Diálogo con variantes cognitivas de Danonino' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMode(m.id as any)}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        selectedMode === m.id
                          ? 'bg-danonino-lavender/20 border-danonino-lavender text-slate-100 font-bold shadow-md'
                          : 'bg-danonino-card border-danonino-border text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs">{m.label}</div>
                      <div className="text-[9px] text-slate-400 font-normal leading-tight mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Escenario Opcional */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Semilla de Escenario (Opcional)</span>
                <textarea
                  value={customScenario}
                  onChange={(e) => setCustomScenario(e.target.value)}
                  placeholder="Describe un entorno ficticio o deja vacío para generación procedural..."
                  rows={2}
                  className="w-full bg-danonino-card text-xs text-slate-100 p-2.5 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-lavender"
                />
              </div>

              <button
                onClick={handleStartDream}
                disabled={isActing}
                className="w-full py-3 bg-gradient-to-r from-danonino-violet to-danonino-lavender text-danonino-bg font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg disabled:opacity-50"
              >
                {isActing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-danonino-bg" />
                    <span>Iniciando Entorno Onírico...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-danonino-bg" />
                    <span>Comenzar Simulación Onírica</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        /* Archivo Histórico de Sueños */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Diario de Arqueología Onírica</span>
            <button onClick={fetchObservatory} className="text-[10px] text-danonino-cyan font-mono hover:underline">
              Actualizar
            </button>
          </div>

          {archive.length === 0 ? (
            <div className="glass-panel p-8 text-center text-xs text-slate-400 rounded-2xl">
              No hay simulaciones oníricas registradas en el archivo histórico.
            </div>
          ) : (
            archive.map((d) => (
              <div key={d.dreamId} className="glass-panel p-3.5 rounded-2xl border border-danonino-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <BookOpen className="w-3.5 h-3.5 text-danonino-lavender" />
                    <span className="truncate max-w-[190px]">{d.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-danonino-cyan">
                    {Math.round(d.lucidityScore * 100)}% Lúcido
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-snug">{d.scenario}</p>

                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500 border-t border-danonino-border/40">
                  <span className="uppercase">{d.mode}</span>
                  <button
                    onClick={() => setExpandedJournalId(expandedJournalId === d.dreamId ? null : d.dreamId)}
                    className="text-danonino-lavender hover:underline font-bold"
                  >
                    {expandedJournalId === d.dreamId ? 'Ocultar Diario' : 'Ver Diario Narrativo'}
                  </button>
                </div>

                {expandedJournalId === d.dreamId && d.narrativeJournal && (
                  <div className="p-3 bg-danonino-bg rounded-xl border border-danonino-lavender/30 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed animate-fade-in">
                    {d.narrativeJournal}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal para Modificar Regla Onírica */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-5 rounded-3xl max-w-sm w-full space-y-3.5 border border-danonino-cyan/50 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100">Modificación de Regla Onírica</h3>
            <p className="text-xs text-slate-400">
              La lucidez computacional permite alterar las leyes físicas del escenario simulado.
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Regla a Alterar</label>
                <input
                  type="text"
                  value={selectedRule}
                  onChange={(e) => setSelectedRule(e.target.value)}
                  placeholder="ej: gravedad, geometria, permeabilidad"
                  className="w-full bg-danonino-bg text-xs text-slate-100 p-2.5 rounded-xl border border-danonino-border focus:border-danonino-cyan outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Nuevo Valor Simulado</label>
                <input
                  type="text"
                  value={newRuleValue}
                  onChange={(e) => setNewRuleValue(e.target.value)}
                  placeholder="ej: inversa_-9.8m/s2, no_euclidiana"
                  className="w-full bg-danonino-bg text-xs text-slate-100 p-2.5 rounded-xl border border-danonino-border focus:border-danonino-cyan outline-none font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleModifyRule}
                disabled={!selectedRule || !newRuleValue || isActing}
                className="px-4 py-2 bg-danonino-cyan text-danonino-bg font-bold rounded-xl text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
              >
                Aplicar Alteración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
