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
  AlertTriangle,
  Power,
  Zap,
  BedDouble,
  SunMedium
} from 'lucide-react';
import { api } from '../services/api';
import {
  OneirosDream,
  OneirosObservatoryData,
  OneirosCharacter,
  OneirosEvent,
  OneirosRule,
  SleepCycleState
} from '../types';
import { DanoninoAvatar } from '../components/DanoninoAvatar';

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

  // Configuración de Sueño Autónomo
  const [inactivityThreshold, setInactivityThreshold] = useState<number>(15);

  const fetchObservatory = async () => {
    setLoading(true);
    try {
      const [obsRes, archRes] = await Promise.all([
        api.getOneirosObservatory().catch(() => null),
        api.getOneirosArchive(15).catch(() => ({ ok: false, count: 0, archive: [] }))
      ]);
      if (obsRes?.ok) {
        setObservatory(obsRes);
        if (obsRes.sleepMetrics?.inactivityThresholdMins) {
          setInactivityThreshold(obsRes.sleepMetrics.inactivityThresholdMins);
        }
      }
      if (archRes?.ok) setArchive(archRes.archive);
    } catch (err: any) {
      console.error('Error cargando ONEIROS:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservatory();
    const interval = setInterval(fetchObservatory, 10000);
    return () => clearInterval(interval);
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
    setIsActing(true);
    try {
      await api.wakeOneiros(observatory?.dream?.dreamId, 'intervencion_manual_usuario');
      await fetchObservatory();
    } catch (err: any) {
      alert('Error al despertar: ' + err.message);
    } finally {
      setIsActing(false);
    }
  };

  const handleToggleAutoSleep = async () => {
    if (!observatory) return;
    const nextState = !observatory.sleepMetrics.autoSleepEnabled;
    try {
      await api.toggleAutoSleep(nextState, inactivityThreshold);
      await fetchObservatory();
    } catch (err: any) {
      alert('Error configurando sueño autónomo: ' + err.message);
    }
  };

  const handleForceSleep = async () => {
    setIsActing(true);
    try {
      await api.forceSleepNow(selectedMode);
      await fetchObservatory();
    } catch (err: any) {
      alert('Error forzando sueño: ' + err.message);
    } finally {
      setIsActing(false);
    }
  };

  const handleThresholdChange = async (newVal: number) => {
    setInactivityThreshold(newVal);
    try {
      await api.toggleAutoSleep(observatory?.sleepMetrics.autoSleepEnabled ?? true, newVal);
      await fetchObservatory();
    } catch (_) {}
  };

  // Mapeo del estado del ciclo de sueño hacia el estado visual del Avatar
  const getAvatarMode = (state?: SleepCycleState): string => {
    switch (state) {
      case 'DROWSY':
        return 'drowsy';
      case 'SLEEPING':
        return 'sleeping';
      case 'LUCID_DREAMING':
        return 'lucid_dreaming';
      case 'WAKING':
        return 'waking';
      case 'AWAKE':
      default:
        return 'idle';
    }
  };

  const formatAsleepTime = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const sleepState = observatory?.sleepState || 'AWAKE';
  const isCurrentlySleeping = sleepState === 'SLEEPING' || sleepState === 'LUCID_DREAMING';

  return (
    <div className="flex flex-col min-h-screen bg-danonino-bg text-danonino-text pb-20">
      {/* 1. Encabezado del Observatorio Onírico */}
      <header className="sticky top-0 z-30 bg-danonino-card/90 backdrop-blur-md border-b border-danonino-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-danonino-violet/20 border border-danonino-violet/40 flex items-center justify-center text-danonino-lavender">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
              PROYECTO ONEIROS
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-danonino-violet/25 text-danonino-lavender border border-danonino-violet/30">
                2.0
              </span>
            </h1>
            <p className="text-xs text-danonino-muted">Simulación onírica y ciclo autónomo</p>
          </div>
        </div>

        <button
          onClick={fetchObservatory}
          disabled={loading}
          className="p-2 rounded-lg bg-danonino-border/40 hover:bg-danonino-border/60 text-danonino-muted hover:text-white transition"
          title="Actualizar estado"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* 2. Pestañas de Navegación: Observatorio vs Archivo */}
      <div className="flex border-b border-danonino-border px-4 bg-danonino-card/40">
        <button
          onClick={() => setActiveTab('observatory')}
          className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'observatory'
              ? 'border-danonino-cyan text-danonino-cyan'
              : 'border-transparent text-danonino-muted hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          Observatorio Activo
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'archive'
              ? 'border-danonino-lavender text-danonino-lavender'
              : 'border-transparent text-danonino-muted hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Archivo de Sueños ({archive.length})
        </button>
      </div>

      {/* 3. Panel de Contenido Principal */}
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full space-y-4">
        {activeTab === 'observatory' ? (
          <>
            {/* A. Tarjeta de Estado del Ciclo Autónomo de Sueño */}
            <section className="bg-danonino-card border border-danonino-border rounded-2xl p-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <DanoninoAvatar
                    mode={getAvatarMode(sleepState)}
                    size="md"
                    showStatusBadge={true}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-mono tracking-wider text-danonino-muted">Estado del Ciclo:</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        sleepState === 'LUCID_DREAMING'
                          ? 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-500/50 animate-pulse'
                          : sleepState === 'SLEEPING'
                          ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/50'
                          : sleepState === 'DROWSY'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                          : sleepState === 'WAKING'
                          ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                      }`}>
                        {sleepState}
                      </span>
                    </div>
                    <p className="text-xs text-danonino-muted mt-1">
                      {sleepState === 'LUCID_DREAMING' && 'Danonino es consciente de la simulación y puede reescribir reglas.'}
                      {sleepState === 'SLEEPING' && `Dormido hace ${formatAsleepTime(observatory?.sleepMetrics?.timeAsleepSeconds)}. Explorando simulación.`}
                      {sleepState === 'DROWSY' && `Inactividad detectada (${observatory?.sleepMetrics?.minutesInactive}m). Preparando sueño.`}
                      {sleepState === 'WAKING' && 'Consolidando recuerdos oníricos y despertando...'}
                      {sleepState === 'AWAKE' && `Despierto y listo. Inactivo hace ${observatory?.sleepMetrics?.minutesInactive || 0}m.`}
                    </p>
                  </div>
                </div>

                {/* Botón de acción rápida Dormir / Despertar */}
                <div>
                  {isCurrentlySleeping ? (
                    <button
                      onClick={handleWakeUp}
                      disabled={isActing}
                      className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
                    >
                      <SunMedium className="w-3.5 h-3.5" />
                      Despertar
                    </button>
                  ) : (
                    <button
                      onClick={handleForceSleep}
                      disabled={isActing}
                      className="px-3.5 py-2 rounded-xl bg-danonino-violet/40 hover:bg-danonino-violet/60 border border-danonino-violet/60 text-danonino-lavender text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
                    >
                      <BedDouble className="w-3.5 h-3.5" />
                      Dormir ahora
                    </button>
                  )}
                </div>
              </div>

              {/* Parámetros del Sueño Autónomo */}
              <div className="mt-4 pt-3 border-t border-danonino-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleAutoSleep}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                      observatory?.sleepMetrics?.autoSleepEnabled
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    Sueño Autónomo: {observatory?.sleepMetrics?.autoSleepEnabled ? 'Activado' : 'Desactivado'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-danonino-muted">
                  <span>Dormir tras inactividad:</span>
                  {[5, 15, 30].map(mins => (
                    <button
                      key={mins}
                      onClick={() => handleThresholdChange(mins)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition ${
                        inactivityThreshold === mins
                          ? 'bg-danonino-cyan/20 text-danonino-cyan border-danonino-cyan/50 font-bold'
                          : 'bg-danonino-border/30 text-danonino-muted border-transparent hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* B. Monitor de Lucidez y Estado del Sueño Activo */}
            {observatory?.hasActiveDream && observatory.dream ? (
              <>
                <section className="bg-danonino-card border border-danonino-border rounded-2xl p-4 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-mono tracking-wider text-danonino-muted flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-danonino-cyan" />
                      Profundidad: Nivel {observatory.dream.depthLevel} • Modo {observatory.dream.mode.toUpperCase()}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      observatory.dream.isLucid
                        ? 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-500/50 animate-pulse'
                        : 'bg-danonino-cyan/15 text-danonino-cyan border-danonino-cyan/40'
                    }`}>
                      {observatory.dream.isLucid ? 'Lúcido (Control de Reglas)' : 'Pre-Lúcido'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-white">{observatory.dream.title}</h2>
                    <p className="text-xs text-danonino-muted mt-1 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-danonino-border/40 font-mono">
                      {observatory.dream.scenario}
                    </p>
                  </div>

                  {/* Medidor de Lucidez */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-danonino-muted flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-danonino-lavender" />
                        Lucidez Computacional
                      </span>
                      <span className="font-mono font-bold text-danonino-cyan">
                        {Math.round(observatory.dream.lucidityScore * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-danonino-border overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-danonino-violet via-danonino-blue to-danonino-cyan transition-all duration-500"
                        style={{ width: `${Math.round(observatory.dream.lucidityScore * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Acciones del Sueño */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      onClick={() => setShowRuleModal(true)}
                      disabled={!observatory.dream.isLucid && observatory.dream.lucidityScore < 0.6}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                        observatory.dream.isLucid || observatory.dream.lucidityScore >= 0.6
                          ? 'bg-fuchsia-900/40 hover:bg-fuchsia-900/60 text-fuchsia-200 border border-fuchsia-500/50'
                          : 'bg-danonino-border/30 text-danonino-muted border border-transparent cursor-not-allowed opacity-60'
                      }`}
                      title={!observatory.dream.isLucid ? 'Requiere lucidez >= 60%' : 'Alterar leyes del mundo'}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Alterar Reglas del Mundo
                    </button>

                    <button
                      onClick={handleDescendRecursive}
                      disabled={isActing || observatory.dream.depthLevel >= 3}
                      className="px-3 py-1.5 rounded-xl bg-danonino-border/40 hover:bg-danonino-border/70 border border-danonino-border text-xs font-medium text-white flex items-center gap-1.5 transition"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-danonino-cyan" />
                      Sumergirse (Nivel {observatory.dream.depthLevel + 1})
                    </button>

                    <button
                      onClick={handleWakeUp}
                      disabled={isActing}
                      className="ml-auto px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-200 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <SunMedium className="w-3.5 h-3.5" />
                      Despertar y Consolidar
                    </button>
                  </div>
                </section>

                {/* C. Estimulación Reactiva y Avance Autónomo */}
                <section className="bg-danonino-card border border-danonino-border rounded-2xl p-4 shadow-lg space-y-3">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-danonino-muted flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-danonino-cyan" />
                    Estimulación Reactiva (Qwen / LLM)
                  </h3>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={stepAction}
                      onChange={(e) => setStepAction(e.target.value)}
                      placeholder="Introduce un estímulo (ej. «Cuestiono la gravedad», «Abro la puerta oculta»)..."
                      className="flex-1 bg-black/40 border border-danonino-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-danonino-cyan"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleStepDream();
                      }}
                    />
                    <button
                      onClick={handleStepDream}
                      disabled={isActing}
                      className="px-3.5 py-2 rounded-xl bg-danonino-cyan hover:bg-danonino-cyan/80 text-danonino-bg font-semibold text-xs flex items-center gap-1.5 transition shadow"
                    >
                      {isActing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      {stepAction.trim() ? 'Estimular' : 'Avanzar'}
                    </button>
                  </div>
                  <p className="text-[11px] text-danonino-muted">
                    Presionar «Avanzar» sin texto permite que los personajes actúen con total autonomía dentro y fuera de escena.
                  </p>
                </section>

                {/* D. Personajes Autónomos en la Simulación */}
                <section className="bg-danonino-card border border-danonino-border rounded-2xl p-4 shadow-lg space-y-3">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-danonino-muted flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-danonino-lavender" />
                    Personajes Autónomos ({observatory.characters.length})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {observatory.characters.map((char) => (
                      <div
                        key={char.id}
                        className="bg-black/30 border border-danonino-border/50 rounded-xl p-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{char.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-danonino-border/40 text-danonino-muted font-mono">
                              {char.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-danonino-muted mt-1 leading-snug">{char.persona}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-danonino-border/30 text-[10px] text-danonino-cyan/80 font-mono">
                          Meta: {char.goals[0] || 'Investigación libre'}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* E. Reglas Físicas Activas */}
                <section className="bg-danonino-card border border-danonino-border rounded-2xl p-4 shadow-lg space-y-3">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-danonino-muted flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-danonino-violet" />
                    Leyes y Reglas del Mundo Onírico
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {observatory.dream.rules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="bg-black/30 border border-danonino-border/40 rounded-xl p-2.5 text-xs"
                      >
                        <div className="text-[10px] text-danonino-muted uppercase font-mono">{rule.name}</div>
                        <div className="font-semibold text-white mt-0.5 truncate" title={rule.value}>
                          {rule.value}
                        </div>
                        {rule.reason && (
                          <div className="text-[9px] text-fuchsia-300/80 italic mt-1 truncate">
                            {rule.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* F. Flujo Cronológico de Sucesos y Narrativa */}
                <section className="bg-danonino-card border border-danonino-border rounded-2xl p-4 shadow-lg space-y-3">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-danonino-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-danonino-cyan" />
                    Acontecimientos Observados en Tiempo Real
                  </h3>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {observatory.recentEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="bg-black/25 border border-danonino-border/40 rounded-xl p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-danonino-muted font-mono">
                          <span className="uppercase text-danonino-cyan flex items-center gap-1">
                            • {evt.eventType}
                          </span>
                          <span>
                            {new Date(evt.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-danonino-text leading-relaxed">{evt.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              /* C. Estado Inactivo / Generador de Nuevo Sueño */
              <section className="bg-danonino-card border border-danonino-border rounded-2xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-danonino-violet/20 border border-danonino-violet/40 flex items-center justify-center mx-auto text-danonino-lavender">
                  <Moon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Sin Simulación Onírica Activa</h2>
                  <p className="text-xs text-danonino-muted mt-1 max-w-sm mx-auto">
                    Danonino entrará en sueño espontáneo automáticamente tras {inactivityThreshold} minutos de inactividad, o puedes iniciar una exploración manual.
                  </p>
                </div>

                <div className="max-w-md mx-auto space-y-3 pt-2 text-left">
                  <div>
                    <label className="text-xs text-danonino-muted mb-1 block">Modo de Simulación:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'lucid', label: 'Sueño Lúcido' },
                        { id: 'alternate_self', label: 'Múltiples Egos' },
                        { id: 'recursive', label: 'Recursivo' },
                        { id: 'nightmare', label: 'Pesadilla (Resiliencia)' }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMode(m.id as any)}
                          className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                            selectedMode === m.id
                              ? 'bg-danonino-cyan/20 border-danonino-cyan text-white'
                              : 'bg-black/30 border-danonino-border/40 text-danonino-muted hover:text-white'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-danonino-muted mb-1 block">Escenario Personalizado (Opcional):</label>
                    <input
                      type="text"
                      value={customScenario}
                      onChange={(e) => setCustomScenario(e.target.value)}
                      placeholder="Ej. Una biblioteca de cuarzo donde los libros predicen el futuro..."
                      className="w-full bg-black/40 border border-danonino-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-danonino-cyan"
                    />
                  </div>

                  <button
                    onClick={handleStartDream}
                    disabled={isActing}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-danonino-violet to-danonino-cyan text-white font-semibold text-xs shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    {isActing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Iniciar Simulación Manual
                  </button>
                </div>
              </section>
            )}
          </>
        ) : (
          /* 4. Pestaña de Archivo Histórico de Sueños */
          <div className="space-y-3">
            <h2 className="text-xs uppercase font-mono tracking-wider text-danonino-muted">
              Diarios de Sueño Consolidados en Memoria
            </h2>

            {archive.length === 0 ? (
              <div className="bg-danonino-card border border-danonino-border rounded-2xl p-8 text-center text-xs text-danonino-muted">
                No hay sueños archivados todavía. Los diarios oníricos se generan al despertar de cada sesión.
              </div>
            ) : (
              archive.map((dream) => (
                <div
                  key={dream.dreamId}
                  className="bg-danonino-card border border-danonino-border rounded-2xl p-4 shadow space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{dream.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-danonino-border/40 text-danonino-cyan">
                      Lucidez: {Math.round(dream.lucidityScore * 100)}%
                    </span>
                  </div>

                  <p className="text-xs text-danonino-muted">{dream.scenario}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-danonino-border/40 text-[10px] text-danonino-muted">
                    <span>
                      {new Date(dream.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} • Modo {dream.mode}
                    </span>
                    <button
                      onClick={() => setExpandedJournalId(expandedJournalId === dream.dreamId ? null : dream.dreamId)}
                      className="text-danonino-cyan hover:underline flex items-center gap-1"
                    >
                      {expandedJournalId === dream.dreamId ? 'Ocultar diario' : 'Ver diario de vigilia'}
                    </button>
                  </div>

                  {expandedJournalId === dream.dreamId && dream.narrativeJournal && (
                    <div className="mt-3 p-3 rounded-xl bg-black/40 border border-danonino-border/50 text-xs font-mono whitespace-pre-wrap text-danonino-lavender leading-relaxed">
                      {dream.narrativeJournal}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modal para Modificar Reglas Lúcidas */}
      {showRuleModal && observatory?.dream && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-danonino-card border border-danonino-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-fuchsia-400" />
              Reescribir Regla del Mundo
            </h3>
            <p className="text-xs text-danonino-muted">
              Danonino posee lucidez computacional para alterar leyes del entorno onírico.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-danonino-muted block mb-1">Selecciona la regla:</label>
                <select
                  value={selectedRule}
                  onChange={(e) => setSelectedRule(e.target.value)}
                  className="w-full bg-black/40 border border-danonino-border rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- Elige una regla --</option>
                  {observatory.dream.rules.map((r, i) => (
                    <option key={i} value={r.name}>{r.name} (actual: {r.value})</option>
                  ))}
                  <option value="nueva_regla">+ Añadir nueva ley física/lógica</option>
                </select>
              </div>

              {selectedRule === 'nueva_regla' && (
                <div>
                  <label className="text-danonino-muted block mb-1">Nombre de la nueva regla:</label>
                  <input
                    type="text"
                    onChange={(e) => setSelectedRule(e.target.value)}
                    placeholder="ej. permeabilidad_del_tiempo"
                    className="w-full bg-black/40 border border-danonino-border rounded-xl px-3 py-2 text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-danonino-muted block mb-1">Nuevo valor o estado:</label>
                <input
                  type="text"
                  value={newRuleValue}
                  onChange={(e) => setNewRuleValue(e.target.value)}
                  placeholder="ej. gravedad_invertida_0.5g"
                  className="w-full bg-black/40 border border-danonino-border rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-danonino-border/40 text-xs text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleModifyRule}
                disabled={!selectedRule || !newRuleValue || isActing}
                className="px-3.5 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                {isActing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Aplicar Alteración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
