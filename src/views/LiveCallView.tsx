// danonino-app/src/views/LiveCallView.tsx
// Danonino Live: Voz, Visión y Captura de Pantalla sin interferencias acústicas

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
  Layers,
  Clock,
  Eye,
  Send,
  Radio,
  X
} from 'lucide-react';
import { DanoninoAvatar } from '../components/DanoninoAvatar';
import { LiveAudioSession, NativeAudioPlayer } from '../services/liveAudio';
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
  const [screenShotBase64, setScreenShotBase64] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Modo de habla manual (Push-to-talk)
  const [isManualRecording, setIsManualRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

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
  const audioSessionRef = useRef<LiveAudioSession | null>(null);
  const audioPlayerRef = useRef<NativeAudioPlayer | null>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);
  const screenManagerRef = useRef<ScreenShareManager | null>(null);
  const screenFileInputRef = useRef<HTMLInputElement | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const canvasWaveformRef = useRef<HTMLCanvasElement | null>(null);
  const sessionIdRef = useRef<string>('live_' + Date.now());
  const isInteractingRef = useRef<boolean>(false);
  const callStateRef = useRef<CallState>('connecting');

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Inicializar sesión y hardware
  useEffect(() => {
    startLiveSession();

    return () => {
      endLiveSession(false);
    };
  }, []);

  // Dibujado continuo del visualizador de audio
  useEffect(() => {
    let animId: number;
    const canvas = canvasWaveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderWave = () => {
      const buffer = audioSessionRef.current?.getWaveformData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!buffer) {
        animId = requestAnimationFrame(renderWave);
        return;
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle =
        callStateRef.current === 'speaking'
          ? '#a855f7'
          : callStateRef.current === 'listening'
          ? '#06b6d4'
          : '#3b82f6';

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

      audioPlayerRef.current = new NativeAudioPlayer();
      cameraManagerRef.current = new CameraManager({ maxFps: 0.5, quality: 0.65 });
      screenManagerRef.current = new ScreenShareManager({ quality: 0.65 });

      audioSessionRef.current = new LiveAudioSession({
        onAudioLevel: (level) => {
          setTelemetry((prev) => ({ ...prev, micLevel: level }));
        },
        onSpeechStart: () => {
          if (callStateRef.current !== 'speaking' && callStateRef.current !== 'processing') {
            setCallState('listening');
          }
        },
        onSpeechEnd: (audioBase64) => {
          if (!isInteractingRef.current && audioBase64) {
            handleUserTurn('', audioBase64);
          }
        }
      });

      await audioSessionRef.current.start();
      setCallState('listening');

      // Saludo inicial de Danonino con voz neuronal real
      const saludoTexto = 'Te escucho. Puedes hablarme o pulsar el micrófono cuando desees.';
      setAgentReply(saludoTexto);

      try {
        const audioB64 = await api.getTTSAudio(saludoTexto);
        if (audioB64) {
          playAgentAudio(audioB64);
        }
      } catch (_) {}
    } catch (err: any) {
      console.error('Error iniciando sesión en vivo:', err);
      setCallState('idle');
    }
  };

  const playAgentAudio = async (audioBase64: string) => {
    if (!audioPlayerRef.current) return;
    setCallState('speaking');
    audioSessionRef.current?.setAgentSpeaking(true);

    try {
      await audioPlayerRef.current.playBase64(
        audioBase64,
        () => setCallState('speaking'),
        () => {
          setCallState('listening');
          audioSessionRef.current?.setAgentSpeaking(false);
        },
        () => {
          setCallState('listening');
          audioSessionRef.current?.setAgentSpeaking(false);
        }
      );
    } catch (_) {
      setCallState('listening');
      audioSessionRef.current?.setAgentSpeaking(false);
    }
  };

  // Barge-in manual: interrupción inmediata
  const handleBargeIn = async () => {
    if (callStateRef.current === 'speaking' || isInteractingRef.current) {
      audioPlayerRef.current?.stop();
      audioSessionRef.current?.setAgentSpeaking(false);
      setCallState('interrupted');

      try {
        await api.cancelLiveTask(sessionIdRef.current);
      } catch (_) {}

      setTimeout(() => {
        setCallState('listening');
        isInteractingRef.current = false;
      }, 200);
    }
  };

  // Procesar turno de habla (audio real grabado y/o mensaje de texto + fotograma)
  const handleUserTurn = async (messageText?: string, audioBase64?: string) => {
    if (isInteractingRef.current) return;
    isInteractingRef.current = true;
    setLiveTranscript(messageText || (audioBase64 ? 'Procesando tu voz...' : ''));
    setCallState('processing');

    let imageBase64: string | undefined = undefined;
    let mode: StreamMode = 'voice_only';

    if (cameraActive && cameraManagerRef.current) {
      const frame = cameraManagerRef.current.captureCompressedFrame(true);
      if (frame) {
        imageBase64 = frame;
        mode = 'camera';
      }
    } else if (screenShotBase64) {
      imageBase64 = screenShotBase64;
      mode = 'screen';
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
        messageText || '',
        imageBase64,
        mode,
        sessionIdRef.current,
        audioBase64
      );

      const latency = Date.now() - startTime;
      setTelemetry((prev) => ({
        ...prev,
        latencyMs: res.latencyMs || latency,
        tokensEst: res.tokensEst || Math.round((res.reply || '').length / 4),
        fps: cameraManagerRef.current?.getCurrentFps() || 0
      }));

      // Si el backend identificó la transcripción de lo que dijo el usuario, mostrarla en pantalla
      if (res.userTranscript) {
        setLiveTranscript(res.userTranscript);
      }

      if (res.ok && res.reply && !res.interrupted) {
        setAgentReply(res.reply);
        if (res.audioBase64) {
          await playAgentAudio(res.audioBase64);
        } else {
          setCallState('listening');
        }
      } else {
        setCallState('listening');
      }
    } catch (err: any) {
      console.error('Error interactuando con Danonino Live:', err);
      setAgentReply('Interrupción en la conexión. Puedes repetir.');
      setCallState('listening');
    } finally {
      isInteractingRef.current = false;
    }
  };

  // Botón Push-to-Talk (Pulsar para hablar)
  const handleToggleManualRecord = async () => {
    if (isManualRecording) {
      setIsManualRecording(false);
      const audioB64 = await audioSessionRef.current?.stopSegmentRecording();
      if (audioB64) {
        handleUserTurn('', audioB64);
      }
    } else {
      handleBargeIn();
      setIsManualRecording(true);
      audioSessionRef.current?.startSegmentRecording();
    }
  };

  // Enviar mensaje de texto auxiliar en llamada
  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    const txt = textInput.trim();
    if (!txt) return;
    setTextInput('');
    setShowTextInput(false);
    handleUserTurn(txt);
  };

  // Toggle Cámara
  const toggleCamera = async () => {
    if (cameraActive) {
      cameraManagerRef.current?.stop();
      setCameraActive(false);
      if (!screenActive && !screenShotBase64) setStreamMode('voice_only');
    } else {
      try {
        if (screenActive) {
          screenManagerRef.current?.stop();
          setScreenActive(false);
        }
        setScreenShotBase64(null);
        await cameraManagerRef.current?.start(videoPreviewRef.current || undefined, facingMode);
        setCameraActive(true);
        setStreamMode('camera');
      } catch (err) {
        alert('No se pudo acceder a la cámara. Revisa los permisos.');
      }
    }
  };

  // Alternar frontal / trasera
  const switchFacing = async () => {
    if (!cameraActive || !cameraManagerRef.current) return;
    const nextFacing = await cameraManagerRef.current.switchFacingMode();
    setFacingMode(nextFacing);
  };

  // Selector de Captura de Pantalla para Android
  const toggleScreenShare = async () => {
    if (screenActive || screenShotBase64) {
      screenManagerRef.current?.stop();
      setScreenActive(false);
      setScreenShotBase64(null);
      setStreamMode('voice_only');
      return;
    }

    if (cameraActive) {
      cameraManagerRef.current?.stop();
      setCameraActive(false);
    }

    // Intentar getDisplayMedia primero si el navegador lo admite
    if (navigator.mediaDevices && typeof (navigator.mediaDevices as any).getDisplayMedia === 'function') {
      try {
        await screenManagerRef.current?.start(() => {
          setScreenActive(false);
          setStreamMode('voice_only');
        });
        setScreenActive(true);
        setStreamMode('screen');
        return;
      } catch (_) {}
    }

    // Si Android WebView no soporta getDisplayMedia, abrir selector de capturas de pantalla de Android
    screenFileInputRef.current?.click();
  };

  const handleScreenFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      if (b64) {
        setScreenShotBase64(b64);
        setScreenActive(true);
        setStreamMode('screen');
        // Analizar la captura inmediatamente con Danonino
        handleUserTurn('He compartido esta captura de mi pantalla. ¿Qué observas y cómo me ayudas?', undefined);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Silenciar Micrófono con hardware mute real
  const toggleMic = () => {
    const nextMuted = !isMicMuted;
    setIsMicMuted(nextMuted);
    audioSessionRef.current?.setMuted(nextMuted);
    if (nextMuted) {
      setTelemetry((prev) => ({ ...prev, micLevel: 0 }));
    }
  };

  // Finalizar llamada
  const endLiveSession = (shouldNavigate = true) => {
    audioPlayerRef.current?.stop();
    audioSessionRef.current?.stop();
    cameraManagerRef.current?.stop();
    screenManagerRef.current?.stop();
    api.cancelLiveTask(sessionIdRef.current).catch(() => {});
    setCallState('ended');
    if (shouldNavigate) {
      navigate('/chat');
    }
  };

  const getAvatarMode = () => {
    if (callState === 'speaking') return 'speaking';
    if (callState === 'processing') return 'thinking';
    return 'idle';
  };

  return (
    <div className="flex flex-col h-screen bg-danonino-bg text-slate-100 overflow-hidden select-none">
      {/* Input de archivo de captura de pantalla oculto */}
      <input
        ref={screenFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleScreenFileSelected}
      />

      {/* Barra superior de telemetría y estado */}
      <div className="flex items-center justify-between px-4 py-3 bg-danonino-surface/80 border-b border-danonino-border/80 z-20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-danonino-cyan animate-pulse" />
          <span className="font-semibold text-xs tracking-wider uppercase text-danonino-cyan">Danonino Live</span>
        </div>

        {/* Telemetría en vivo */}
        <div className="flex items-center gap-2.5 text-[10px] font-mono text-slate-400 bg-danonino-card/70 px-2.5 py-1 rounded-full border border-danonino-border/60">
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
        {/* Previsualización de Cámara o Captura de Pantalla (PiP) */}
        <div
          className={`transition-all duration-300 rounded-2xl overflow-hidden border border-danonino-border/80 shadow-2xl bg-black ${
            cameraActive || screenActive || screenShotBase64 ? 'w-full max-w-xs h-52 mb-3 relative' : 'hidden'
          }`}
        >
          {cameraActive ? (
            <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : screenShotBase64 ? (
            <img src={screenShotBase64} alt="Pantalla" className="w-full h-full object-contain bg-slate-900" />
          ) : (
            <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          )}

          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-danonino-cyan flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>
              {cameraActive
                ? facingMode === 'user'
                  ? 'Cámara Frontal'
                  : 'Cámara Trasera'
                : 'Captura de Pantalla'}
            </span>
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

          {screenShotBase64 && (
            <button
              onClick={() => {
                setScreenShotBase64(null);
                setScreenActive(false);
                setStreamMode('voice_only');
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-red-400 transition-colors"
              title="Quitar captura"
            >
              <X className="w-4 h-4" />
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
          <div className="mt-3 px-3 py-1 rounded-full text-xs font-mono font-medium border border-danonino-border/80 bg-danonino-card/90 shadow-sm flex items-center gap-2">
            {callState === 'speaking' && (
              <>
                <span className="w-2 h-2 rounded-full bg-danonino-lavender animate-ping" />
                <span className="text-danonino-lavender font-bold">Danonino Hablando</span>
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
                <span className="text-yellow-400">Procesando respuesta...</span>
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

          {/* Indicador de Nivel de Micrófono en Tiempo Real */}
          <div className="w-40 mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danonino-card/60 border border-danonino-border/50">
            <Radio
              className={`w-3 h-3 ${
                isMicMuted ? 'text-red-400' : telemetry.micLevel > 20 ? 'text-danonino-cyan animate-pulse' : 'text-slate-500'
              }`}
            />
            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  isMicMuted ? 'bg-red-500' : 'bg-gradient-to-r from-danonino-cyan to-danonino-lavender'
                }`}
                style={{ width: isMicMuted ? '100%' : `${Math.min(100, telemetry.micLevel * 1.8)}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-slate-400 w-12 text-right">
              {isMicMuted ? 'MUTE' : `${telemetry.micLevel}%`}
            </span>
          </div>
        </div>

        {/* Subtítulos y Transcripción en Vivo */}
        <div className="w-full max-w-sm mt-4 min-h-[56px] px-4 py-2 rounded-xl bg-danonino-card/60 border border-danonino-border/40 text-center">
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
              Habla o pulsa el micrófono para hablar...
            </p>
          )}
        </div>

        {/* Visualizador de Forma de Onda */}
        <div className="w-full max-w-xs mt-2 h-8 flex items-center justify-center">
          <canvas ref={canvasWaveformRef} width={280} height={32} className="w-full h-full opacity-80" />
        </div>

        {/* Botón Central Destacado: Pulsar para hablar / Enviar texto */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleToggleManualRecord}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium text-xs shadow-lg transition-all active:scale-95 border ${
              isManualRecording
                ? 'bg-red-500 text-white border-red-400 animate-pulse'
                : 'bg-danonino-cyan/20 border-danonino-cyan text-danonino-cyan hover:bg-danonino-cyan/30'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isManualRecording ? 'Soltar para enviar audio' : 'Pulsar para hablar'}</span>
          </button>

          <button
            onClick={() => setShowTextInput((p) => !p)}
            className="p-2.5 rounded-2xl bg-danonino-card border border-danonino-border text-slate-300 hover:text-white"
            title="Escribir mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Input de texto auxiliar flotante */}
        {showTextInput && (
          <form onSubmit={handleSendText} className="w-full max-w-xs mt-2 flex items-center gap-1.5 animate-fade-in">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Escribe algo a Danonino..."
              className="flex-1 bg-danonino-card text-xs text-slate-100 px-3 py-2 rounded-xl border border-danonino-border focus:border-danonino-cyan outline-none"
            />
            <button
              type="submit"
              className="p-2 bg-danonino-cyan text-danonino-bg font-bold rounded-xl text-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
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

        {/* Compartir Pantalla / Subir Captura */}
        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl transition-all border ${
            screenActive || screenShotBase64
              ? 'bg-purple-500/20 border-purple-500 text-purple-400'
              : 'bg-danonino-card border-danonino-border hover:border-purple-400 text-slate-200'
          }`}
          title={screenActive || screenShotBase64 ? 'Cerrar pantalla compartida' : 'Compartir pantalla / captura'}
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
