// danonino-app/src/views/LiveCallView.tsx
// Danonino Live: Voz bidireccional, cámara, pantalla compartida, VAD y Barge-in

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  SwitchCamera,
  Square,
  Sparkles,
  Activity,
  Layers,
  Clock,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { DanoninoAvatar } from '../components/DanoninoAvatar';
import { AudioSessionManager, SpeechSynthesisTTS } from '../services/liveAudio';
import { CameraManager, ScreenShareManager } from '../services/liveVision';
import { api } from '../services/api';
import { CallState, StreamMode, CallTelemetry } from '../types/live';

export const LiveCallView: React.FC = () => {
  const navigate = useNavigate();

  // Estados de llamada
  const [callState, setCallState] = useState<CallState>('connecting');
  const [streamMode, setStreamMode] = useState<StreamMode>('voice_only');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Subtítulos y transcripción en vivo
  const [liveTranscript, setLiveTranscript] = useState('');
  const [agentReply, setAgentReply] = useState('');
  const [telemetry, setTelemetry] = useState<CallTelemetry>({
    fps: 0,
    latencyMs: 0,
    tokensEst: 0,
    micLevel: 0,
    audioOutputLevel: 0
  });

  // Referencias a servicios
  const audioManagerRef = useRef<AudioSessionManager | null>(null);
  const ttsRef = useRef<SpeechSynthesisTTS | null>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);
  const screenManagerRef = useRef<ScreenShareManager | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const canvasWaveformRef = useRef<HTMLCanvasElement | null>(null);
  const sessionIdRef = useRef<string>('live_' + Date.now());
  const isInteractingRef = useRef<boolean>(false);
  const callStateRef = useRef<CallState>('connecting');

  // Mantener ref actualizado para callbacks
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Inicializar llamada y hardware
  useEffect(() => {
    startLiveSession();

    return () => {
      endLiveSession(false);
    };
  }, []);

  // Dibujar visualizador de audio continuo
  useEffect(() => {
    let animId: number;
    const canvas = canvasWaveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderWave = () => {
      const buffer = audioManagerRef.current?.getWaveformData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!buffer) {
        animId = requestAnimationFrame(renderWave);
        return;
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = callStateRef.current === 'speaking'
        ? '#a855f7' // Violeta si habla Danonino
        : callStateRef.current === 'listening'
        ? '#06b6d4' // Cian si escucha al usuario
        : '#3b82f6'; // Azul idle

      ctx.beginPath();
      const sliceWidth = (canvas.width * 1.0) / buffer.length;
      let x = 0;

      for (let i = 0; i < buffer.length; i++) {
        const v = buffer[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animId = requestAnimationFrame(renderWave);
    };

    animId = requestAnimationFrame(renderWave);
    return () => cancelAnimationFrame(animId);
  }, []);

  const startLiveSession = async () => {
    try {
      setCallState('connecting');

      ttsRef.current = new SpeechSynthesisTTS();
      cameraManagerRef.current = new CameraManager({ maxFps: 0.5, quality: 0.65 });
      screenManagerRef.current = new ScreenShareManager({ quality: 0.65 });

      audioManagerRef.current = new AudioSessionManager({
        onAudioLevel: (level) => {
          setTelemetry((prev) => ({ ...prev, micLevel: level }));
        },
        onSpeechStart: () => {
          if (callStateRef.current !== 'speaking' && callStateRef.current !== 'processing') {
            setCallState('listening');
          }
        },
        onSpeechEnd: (transcript) => {
          if (transcript.trim().length > 0 && !isInteractingRef.current) {
            handleUserUtterance(transcript);
          }
        },
        onBargeIn: () => {
          handleBargeIn();
        }
      });

      await audioManagerRef.current.startMicrophone();
      setCallState('listening');

      // Saludo inicial de Danonino
      const bienvenida = 'Te escucho. Puedes hablarme o activar tu cámara y pantalla cuando desees.';
      setAgentReply(bienvenida);
      playAgentAudio(bienvenida);
    } catch (err: any) {
      console.error('Error iniciando sesión en vivo:', err);
      setCallState('idle');
    }
  };

  const playAgentAudio = async (text: string) => {
    if (!ttsRef.current) return;
    setCallState('speaking');
    audioManagerRef.current?.setAgentSpeaking(true);

    try {
      await ttsRef.current.speak(
        text,
        () => setCallState('speaking'),
        () => {
          setCallState('listening');
          audioManagerRef.current?.setAgentSpeaking(false);
        },
        () => {
          setCallState('listening');
          audioManagerRef.current?.setAgentSpeaking(false);
        }
      );
    } catch (_) {
      setCallState('listening');
      audioManagerRef.current?.setAgentSpeaking(false);
    }
  };

  // Barge-in: interrupción inmediata
  const handleBargeIn = async () => {
    if (callStateRef.current === 'speaking' || isInteractingRef.current) {
      ttsRef.current?.cancel();
      audioManagerRef.current?.setAgentSpeaking(false);
      setCallState('interrupted');

      // Abortar tarea en el backend
      try {
        await api.cancelLiveTask(sessionIdRef.current);
      } catch (_) {}

      setTimeout(() => {
        setCallState('listening');
        isInteractingRef.current = false;
      }, 200);
    }
  };

  // Procesar turno de habla del usuario + fotograma si hay cámara/pantalla activa
  const handleUserUtterance = async (transcript: string) => {
    if (isInteractingRef.current) return;
    isInteractingRef.current = true;
    setLiveTranscript(transcript);
    setCallState('processing');

    let imageBase64: string | undefined = undefined;
    let mode: StreamMode = 'voice_only';

    if (cameraActive && cameraManagerRef.current) {
      const frame = cameraManagerRef.current.captureCompressedFrame(true);
      if (frame) {
        imageBase64 = frame;
        mode = 'camera';
      }
    } else if (screenActive && screenManagerRef.current) {
      const frame = screenManagerRef.current.captureFrame();
      if (frame) {
        imageBase64 = frame;
        mode = 'screen';
      }
    }

    setStreamMode(mode);

    try {
      const startTime = Date.now();
      const res = await api.sendLiveInteraction(
        transcript,
        imageBase64,
        mode,
        sessionIdRef.current
      );

      const latency = Date.now() - startTime;
      setTelemetry((prev) => ({
        ...prev,
        latencyMs: res.latencyMs || latency,
        tokensEst: res.tokensEst || Math.round(res.reply.length / 4),
        fps: cameraManagerRef.current?.getCurrentFps() || 0
      }));

      if (res.ok && res.reply && !res.interrupted) {
        setAgentReply(res.reply);
        await playAgentAudio(res.reply);
      } else {
        setCallState('listening');
      }
    } catch (err: any) {
      console.error('Error interactuando con Danonino Live:', err);
      setAgentReply('Interrupción en la respuesta. Puedes repetir.');
      setCallState('listening');
    } finally {
      isInteractingRef.current = false;
    }
  };

  // Toggle Cámara
  const toggleCamera = async () => {
    if (cameraActive) {
      cameraManagerRef.current?.stop();
      setCameraActive(false);
      if (!screenActive) setStreamMode('voice_only');
    } else {
      try {
        if (screenActive) {
          screenManagerRef.current?.stop();
          setScreenActive(false);
        }
        await cameraManagerRef.current?.start(videoPreviewRef.current || undefined, facingMode);
        setCameraActive(true);
        setStreamMode('camera');
      } catch (err) {
        alert('No se pudo acceder a la cámara. Verifica los permisos.');
      }
    }
  };

  // Cambiar frontal/trasera
  const switchFacing = async () => {
    if (!cameraActive || !cameraManagerRef.current) return;
    const nextFacing = await cameraManagerRef.current.switchFacingMode();
    setFacingMode(nextFacing);
  };

  // Toggle Pantalla Compartida
  const toggleScreenShare = async () => {
    if (screenActive) {
      screenManagerRef.current?.stop();
      setScreenActive(false);
      setStreamMode('voice_only');
    } else {
      try {
        if (cameraActive) {
          cameraManagerRef.current?.stop();
          setCameraActive(false);
        }
        await screenManagerRef.current?.start(() => {
          setScreenActive(false);
          setStreamMode('voice_only');
        });
        setScreenActive(true);
        setStreamMode('screen');
      } catch (err) {
        alert('No se pudo iniciar la captura de pantalla o fue cancelada por el sistema.');
      }
    }
  };

  // Silenciar Micrófono
  const toggleMic = () => {
    setIsMicMuted((prev) => !prev);
  };

  // Finalizar llamada
  const endLiveSession = (shouldNavigate = true) => {
    ttsRef.current?.cancel();
    audioManagerRef.current?.stop();
    cameraManagerRef.current?.stop();
    screenManagerRef.current?.stop();
    api.cancelLiveTask(sessionIdRef.current).catch(() => {});
    setCallState('ended');
    if (shouldNavigate) {
      navigate('/chat');
    }
  };

  // Estado visual del avatar
  const getAvatarMode = () => {
    if (callState === 'speaking') return 'speaking';
    if (callState === 'processing') return 'thinking';
    return 'idle';
  };

  return (
    <div className="flex flex-col h-screen bg-danonino-bg text-slate-100 overflow-hidden select-none">
      {/* Barra superior de telemetría y estado */}
      <div className="flex items-center justify-between px-4 py-3 bg-danonino-surface/80 border-b border-danonino-border/80 z-20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-danonino-cyan animate-pulse" />
          <span className="font-semibold text-xs tracking-wider uppercase text-danonino-cyan">Danonino Live</span>
        </div>

        {/* Telemetría en vivo */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 bg-danonino-card/70 px-2.5 py-1 rounded-full border border-danonino-border/60">
          <div className="flex items-center gap-1" title="Latencia">
            <Clock className="w-3 h-3 text-danonino-lavender" />
            <span>{telemetry.latencyMs}ms</span>
          </div>
          <div className="flex items-center gap-1" title="Tokens estimados">
            <Layers className="w-3 h-3 text-danonino-cyan" />
            <span>{telemetry.tokensEst} tok</span>
          </div>
          {streamMode !== 'voice_only' && (
            <div className="flex items-center gap-1 text-emerald-400" title="FPS de visión">
              <Eye className="w-3 h-3" />
              <span>{telemetry.fps} fps</span>
            </div>
          )}
        </div>
      </div>

      {/* Área central interactiva */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        {/* Previsualización de Cámara o Pantalla (PiP) */}
        <div
          className={`transition-all duration-300 rounded-2xl overflow-hidden border border-danonino-border/80 shadow-2xl bg-black ${
            cameraActive || screenActive
              ? 'w-full max-w-xs h-56 mb-4 relative'
              : 'hidden'
          }`}
        >
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-danonino-cyan flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{cameraActive ? (facingMode === 'user' ? 'Cámara Frontal' : 'Cámara Trasera') : 'Pantalla'}</span>
          </div>

          {cameraActive && (
            <button
              onClick={switchFacing}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-danonino-cyan transition-colors"
              title="Cambiar cámara"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Avatar Central Reactivo */}
        <div className="relative flex flex-col items-center">
          <div
            className={`transition-transform duration-200 ${
              callState === 'speaking' ? 'scale-110' : callState === 'listening' ? 'scale-105' : 'scale-100'
            }`}
          >
            <DanoninoAvatar size="xl" mode={getAvatarMode()} showStatusBadge={false} />
          </div>

          {/* Estado de la llamada badge */}
          <div className="mt-4 px-3 py-1 rounded-full text-xs font-mono font-medium border border-danonino-border/80 bg-danonino-card/90 shadow-sm flex items-center gap-2">
            {callState === 'speaking' && (
              <>
                <span className="w-2 h-2 rounded-full bg-danonino-lavender animate-ping" />
                <span className="text-danonino-lavender font-bold">Hablando</span>
              </>
            )}
            {callState === 'listening' && (
              <>
                <span className="w-2 h-2 rounded-full bg-danonino-cyan animate-pulse" />
                <span className="text-danonino-cyan">Escuchando...</span>
              </>
            )}
            {callState === 'processing' && (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-spin" />
                <span className="text-yellow-400">Analizando contexto...</span>
              </>
            )}
            {callState === 'interrupted' && (
              <>
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-red-400 font-bold">Interrumpido</span>
              </>
            )}
            {callState === 'connecting' && (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                <span className="text-slate-400">Conectando...</span>
              </>
            )}
          </div>
        </div>

        {/* Subtítulos y transcripción en vivo */}
        <div className="w-full max-w-sm mt-5 min-h-[64px] px-4 py-2.5 rounded-xl bg-danonino-card/60 border border-danonino-border/40 text-center">
          {callState === 'speaking' ? (
            <p className="text-xs text-danonino-lavender font-medium line-clamp-3 leading-relaxed">
              {agentReply}
            </p>
          ) : liveTranscript ? (
            <p className="text-xs text-slate-300 italic line-clamp-2">
              "{liveTranscript}"
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 font-mono">
              Habla o muestra algo para iniciar...
            </p>
          )}
        </div>

        {/* Visualizador de Forma de Onda */}
        <div className="w-full max-w-xs mt-3 h-10 flex items-center justify-center">
          <canvas
            ref={canvasWaveformRef}
            width={300}
            height={40}
            className="w-full h-full opacity-80"
          />
        </div>
      </div>

      {/* Barra de Controles Inferior */}
      <div className="p-4 bg-danonino-surface/95 border-t border-danonino-border/80 flex items-center justify-around max-w-md mx-auto w-full z-20">
        {/* Silenciar micrófono */}
        <button
          onClick={toggleMic}
          className={`p-3.5 rounded-2xl transition-all border ${
            isMicMuted
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : 'bg-danonino-card border-danonino-border hover:border-danonino-cyan text-slate-200'
          }`}
          title={isMicMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
        >
          {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Activar Cámara */}
        <button
          onClick={toggleCamera}
          className={`p-3.5 rounded-2xl transition-all border ${
            cameraActive
              ? 'bg-danonino-cyan/20 border-danonino-cyan text-danonino-cyan'
              : 'bg-danonino-card border-danonino-border hover:border-danonino-cyan text-slate-200'
          }`}
          title={cameraActive ? 'Apagar cámara' : 'Encender cámara'}
        >
          {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Compartir Pantalla */}
        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl transition-all border ${
            screenActive
              ? 'bg-purple-500/20 border-purple-500 text-purple-400'
              : 'bg-danonino-card border-danonino-border hover:border-purple-400 text-slate-200'
          }`}
          title={screenActive ? 'Detener compartir pantalla' : 'Compartir pantalla'}
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Botón de Interrupción Manual (Barge-In) */}
        {callState === 'speaking' && (
          <button
            onClick={handleBargeIn}
            className="p-3.5 rounded-2xl transition-all bg-amber-500/20 border border-amber-500 text-amber-400 hover:bg-amber-500/30 animate-pulse"
            title="Interrumpir"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>
        )}

        {/* Colgar / Finalizar llamada */}
        <button
          onClick={() => endLiveSession(true)}
          className="p-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg active:scale-95"
          title="Finalizar llamada"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
