// danonino-app/src/views/LiveCallView.tsx
// DANONINO LIVE 2.0: Llamada Multimodal Inmersiva con Avatar Expresivo, Ondas Reales y Chat en Vivo

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
  MessageSquare,
  Sparkles,
  ChevronDown,
  Send,
  Radio,
  X,
  Volume2,
  StopCircle,
  AlertCircle
} from 'lucide-react';
import { DanoninoAvatar, AvatarState } from '../components/DanoninoAvatar';
import { LiveAudioSession, NativeAudioPlayer } from '../services/liveAudio';
import { CameraManager, ScreenShareManager } from '../services/liveVision';
import { api, getCurrentUser } from '../services/api';
import { ChatMessage } from '../types';

export const LiveCallView: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // Estados de llamada
  const [callStatus, setCallStatus] = useState<'connecting' | 'listening' | 'thinking' | 'speaking' | 'muted'>('connecting');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Niveles de audio reactivos (0.0 a 1.0)
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [ttsAudioLevel, setTtsAudioLevel] = useState(0);

  // Subtítulos y transcripción en vivo
  const [userSubtitle, setUserSubtitle] = useState<string>('');
  const [botSubtitle, setBotSubtitle] = useState<string>('');

  // Panel deslizable de chat durante la llamada
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [inCallMessages, setInCallMessages] = useState<ChatMessage[]>([]);
  const [inCallInput, setInCallInput] = useState('');
  const [isSendingInCallChat, setIsSendingInCallChat] = useState(false);

  // Referencias a servicios
  const audioSessionRef = useRef<LiveAudioSession | null>(null);
  const audioPlayerRef = useRef<NativeAudioPlayer | null>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);
  const screenManagerRef = useRef<ScreenShareManager | null>(null);

  // El micrófono guarda el callback del primer render: sin refs, vería la cámara siempre apagada
  const cameraActiveRef = useRef(false);
  const screenActiveRef = useRef(false);
  const isMicMutedRef = useRef(false);
  useEffect(() => { cameraActiveRef.current = cameraActive; }, [cameraActive]);
  useEffect(() => { screenActiveRef.current = screenActive; }, [screenActive]);
  useEffect(() => { isMicMutedRef.current = isMicMuted; }, [isMicMuted]);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const canvasWaveformRef = useRef<HTMLCanvasElement | null>(null);
  const sessionIdRef = useRef<string>('live_' + Date.now());
  const isInteractingRef = useRef<boolean>(false);
  const inCallChatEndRef = useRef<HTMLDivElement | null>(null);

  // Inicializar sesión y hardware
  useEffect(() => {
    startLiveSession();

    return () => {
      endLiveSession(false);
    };
  }, []);

  // Sincronizar autoscroll en el chat en llamada
  useEffect(() => {
    if (showInCallChat) {
      inCallChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [inCallMessages, showInCallChat]);

  // Dibujado continuo del visualizador de audio en tiempo real
  useEffect(() => {
    let animId: number;
    const canvas = canvasWaveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Si Danonino está hablando, mostramos las ondas del TTS
      // Si el usuario está hablando o escuchando, mostramos las ondas del micrófono
      const isSpeaking = callStatus === 'speaking';
      const buffer = isSpeaking
        ? audioPlayerRef.current?.getWaveformData()
        : (!isMicMuted ? audioSessionRef.current?.getWaveformData() : null);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isSpeaking
        ? '#06b6d4' // Cian bioluminiscente al responder
        : callStatus === 'thinking'
        ? '#8b5cf6' // Violeta al procesar
        : callStatus === 'muted'
        ? '#64748b' // Gris si está silenciado
        : '#3b82f6'; // Azul mientras escucha

      ctx.beginPath();

      if (!buffer || buffer.length === 0 || callStatus === 'muted' || callStatus === 'connecting') {
        // Línea sutil de reposo plana
        const centerY = canvas.height / 2;
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();
        animId = requestAnimationFrame(renderWave);
        return;
      }

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

      ctx.stroke();
      animId = requestAnimationFrame(renderWave);
    };

    animId = requestAnimationFrame(renderWave);
    return () => cancelAnimationFrame(animId);
  }, [callStatus, isMicMuted]);

  // Iniciar sesión Live
  const startLiveSession = async () => {
    sessionIdRef.current = 'live_' + (currentUser?.id || 'usr') + '_' + Date.now();
    setCallStatus('connecting');

    try {
      // 1. Inicializar reproductor de audio con análisis de amplitud
      audioPlayerRef.current = new NativeAudioPlayer((level) => {
        setTtsAudioLevel(level / 100);
      });

      // 2. Inicializar sesión de micrófono con captura PCM
      const session = new LiveAudioSession({
        onAudioLevel: (level) => {
          setMicAudioLevel(level / 100);
        },
        onSpeechStart: () => {
          if (callStatus !== 'speaking') {
            setCallStatus('listening');
          }
        },
        onSpeechEnd: async (audioBase64) => {
          handleIncomingVoiceSegment(audioBase64);
        }
      });

      audioSessionRef.current = session;
      await session.start();

      // 3. Inicializar managers de visión
      cameraManagerRef.current = new CameraManager();
      screenManagerRef.current = new ScreenShareManager();

      setCallStatus('listening');

      // 4. Saludo inicial breve
      setBotSubtitle('Conectado. Te escucho con atención.');
    } catch (err: any) {
      console.error('Error iniciando Danonino Live:', err);
      setCallStatus('muted');
      setBotSubtitle('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  };

  // Procesar segmento de voz recibido del micrófono
  const handleIncomingVoiceSegment = async (audioBase64: string) => {
    if (isInteractingRef.current || isMicMutedRef.current) return;
    isInteractingRef.current = true;
    setCallStatus('thinking');

    try {
      let imageBase64: string | undefined = undefined;
      let streamType = 'voice_only';

      if (cameraActiveRef.current && cameraManagerRef.current) {
        imageBase64 = cameraManagerRef.current.captureCompressedFrame(true) || undefined;
        streamType = 'camera';
      } else if (screenActiveRef.current && screenManagerRef.current) {
        imageBase64 = (await screenManagerRef.current.captureFrameAsync()) || undefined;
        streamType = 'screen';
      }

      const res = await api.sendLiveInteraction(
        '',
        imageBase64,
        streamType,
        sessionIdRef.current,
        audioBase64
      );

      if (res.ok && !res.interrupted) {
        if (res.userTranscript) {
          setUserSubtitle(res.userTranscript);
          // Sincronizar en el chat en llamada
          setInCallMessages((prev) => [
            ...prev,
            {
              id: 'live_user_' + Date.now(),
              sender: currentUser?.displayName || 'Tú',
              text: res.userTranscript || '',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fromMe: true
            }
          ]);
        }

        if (res.reply) {
          setBotSubtitle(res.reply);
          setInCallMessages((prev) => [
            ...prev,
            {
              id: 'live_bot_' + Date.now(),
              sender: 'Danonino',
              text: res.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              fromMe: false
            }
          ]);
        }

        // Reproducir audio neuronal con sincronización del avatar
        if (res.audioBase64 && audioPlayerRef.current) {
          setCallStatus('speaking');
          audioSessionRef.current?.setAgentSpeaking(true);

          await audioPlayerRef.current.playBase64(
            res.audioBase64,
            () => setCallStatus('speaking'),
            () => {
              setCallStatus('listening');
              audioSessionRef.current?.setAgentSpeaking(false);
            },
            () => {
              setCallStatus('listening');
              audioSessionRef.current?.setAgentSpeaking(false);
            }
          );
        } else {
          setCallStatus('listening');
        }
      } else {
        setCallStatus('listening');
      }
    } catch (err: any) {
      console.error('Error en interacción en vivo:', err);
      setCallStatus('listening');
    } finally {
      isInteractingRef.current = false;
    }
  };

  // Interrupción Natural (Barge-in)
  const handleInterrupt = async () => {
    if (callStatus === 'speaking' || isInteractingRef.current) {
      audioPlayerRef.current?.stop();
      audioSessionRef.current?.setAgentSpeaking(false);
      setCallStatus('listening');
      isInteractingRef.current = false;
      try {
        await api.cancelLiveTask(sessionIdRef.current);
      } catch (_) {}
    }
  };

  // Toggle de Micrófono
  const toggleMute = () => {
    if (!audioSessionRef.current) return;
    const next = !isMicMuted;
    setIsMicMuted(next);
    audioSessionRef.current.setMuted(next);
    setCallStatus(next ? 'muted' : 'listening');
  };

  // Toggle de Cámara
  const toggleCamera = async () => {
    if (screenActive) {
      await toggleScreenShare();
    }

    if (cameraActive) {
      cameraManagerRef.current?.stop();
      setCameraActive(false);
    } else {
      if (!cameraManagerRef.current) return;
      try {
        const stream = await cameraManagerRef.current.start(videoPreviewRef.current || undefined, facingMode);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        console.error('Error activando cámara:', err);
      }
    }
  };

  // Cambiar entre cámara frontal y trasera
  const flipCamera = async () => {
    if (!cameraActive || !cameraManagerRef.current) return;
    try {
      const nextFacing = await cameraManagerRef.current.switchFacingMode();
      setFacingMode(nextFacing);
    } catch (err) {
      console.error('Error cambiando cámara:', err);
    }
  };

  // Toggle de Pantalla Compartida
  const toggleScreenShare = async () => {
    if (cameraActive) {
      cameraManagerRef.current?.stop();
      setCameraActive(false);
    }

    if (screenActive) {
      await screenManagerRef.current?.stop();
      setScreenActive(false);
    } else {
      if (!screenManagerRef.current) return;
      try {
        const started = await screenManagerRef.current.start();
        if (started) {
          setScreenActive(true);
        }
      } catch (err) {
        console.error('Error compartiendo pantalla:', err);
      }
    }
  };

  // Enviar mensaje en el chat durante la llamada
  const handleSendInCallChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const texto = inCallInput.trim();
    if (!texto || isSendingInCallChat) return;

    setInCallInput('');
    setIsSendingInCallChat(true);

    const userMsg: ChatMessage = {
      id: 'incall_' + Date.now(),
      sender: currentUser?.displayName || 'Tú',
      text: texto,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fromMe: true
    };
    setInCallMessages((prev) => [...prev, userMsg]);
    setUserSubtitle(texto);
    setCallStatus('thinking');

    try {
      const res = await api.sendLiveInteraction(
        texto,
        undefined,
        'voice_only',
        sessionIdRef.current
      );

      if (res.ok && res.reply) {
        setBotSubtitle(res.reply);
        setInCallMessages((prev) => [
          ...prev,
          {
            id: 'incall_bot_' + Date.now(),
            sender: 'Danonino',
            text: res.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fromMe: false
          }
        ]);

        if (res.audioBase64 && audioPlayerRef.current) {
          setCallStatus('speaking');
          audioSessionRef.current?.setAgentSpeaking(true);
          await audioPlayerRef.current.playBase64(
            res.audioBase64,
            () => setCallStatus('speaking'),
            () => {
              setCallStatus('listening');
              audioSessionRef.current?.setAgentSpeaking(false);
            },
            () => {
              setCallStatus('listening');
              audioSessionRef.current?.setAgentSpeaking(false);
            }
          );
        } else {
          setCallStatus('listening');
        }
      } else {
        setCallStatus('listening');
      }
    } catch (err) {
      console.error('Error enviando chat en vivo:', err);
      setCallStatus('listening');
    } finally {
      setIsSendingInCallChat(false);
    }
  };

  // Finalizar llamada
  const endLiveSession = (navigateBack = true) => {
    audioPlayerRef.current?.stop();
    audioSessionRef.current?.stop();
    cameraManagerRef.current?.stop();
    screenManagerRef.current?.stop();
    if (navigateBack) {
      navigate(-1);
    }
  };

  // Modo del Avatar según estado de la llamada
  const avatarMode: AvatarState = (() => {
    switch (callStatus) {
      case 'speaking':
        return 'speaking';
      case 'thinking':
        return 'thinking';
      case 'listening':
        return 'listening';
      case 'muted':
        return 'sleeping';
      default:
        return 'idle';
    }
  })();

  const currentAudioLevel = callStatus === 'speaking' ? ttsAudioLevel : micAudioLevel;

  return (
    <div className="relative min-h-[100dvh] bg-danonino-bg flex flex-col justify-between overflow-hidden select-none safe-top safe-bottom">
      {/* 1. Barra Superior Discreta de Estado */}
      <div className="p-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-danonino-card/80 border border-danonino-border/80 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                callStatus === 'speaking'
                  ? 'bg-danonino-cyan animate-pulse'
                  : callStatus === 'thinking'
                  ? 'bg-danonino-violet animate-ping'
                  : callStatus === 'muted'
                  ? 'bg-slate-500'
                  : 'bg-danonino-success animate-pulse'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-200">
              {callStatus === 'speaking'
                ? 'Respondiendo'
                : callStatus === 'thinking'
                ? 'Procesando'
                : callStatus === 'muted'
                ? 'Micrófono Desactivado'
                : 'Escuchando'}
            </span>
          </div>

          {screenActive && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-danonino-cyan/15 border border-danonino-cyan/40 text-[10px] text-danonino-cyan font-bold animate-pulse">
              <Monitor className="w-3 h-3" />
              <span>Pantalla en Vivo</span>
            </div>
          )}

          {cameraActive && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-danonino-violet/15 border border-danonino-violet/40 text-[10px] text-danonino-lavender font-bold">
              <Video className="w-3 h-3" />
              <span>Cámara Activa</span>
            </div>
          )}
        </div>

        <button
          onClick={() => endLiveSession(true)}
          className="p-2 rounded-full bg-danonino-card/80 border border-danonino-border text-slate-400 hover:text-white transition-colors"
          title="Minimizar llamada"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Centro Visual: Avatar Hero y Ondas de Voz Reales */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 z-10">
        {/* Vista previa miniatura de la cámara cuando está activa */}
        {cameraActive && (
          <div className="absolute top-2 right-4 w-28 h-36 rounded-2xl overflow-hidden border-2 border-danonino-cyan/60 shadow-2xl z-20 bg-black">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <button
              onClick={flipCamera}
              className="absolute bottom-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:text-danonino-cyan transition-colors"
              title="Cambiar cámara"
            >
              <SwitchCamera className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Avatar Expresivo Hero */}
        <div className="relative mb-6">
          <DanoninoAvatar
            mode={avatarMode}
            size="hero"
            audioLevel={currentAudioLevel}
            onClick={callStatus === 'speaking' ? handleInterrupt : undefined}
          />

          {/* Botón táctil de interrupción si Danonino está hablando */}
          {callStatus === 'speaking' && (
            <button
              onClick={handleInterrupt}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold animate-pulse hover:bg-rose-500/30 transition-all shadow-md"
            >
              <StopCircle className="w-3 h-3" />
              <span>Interrumpir</span>
            </button>
          )}
        </div>

        {/* Visualizador de Ondas de Frecuencia de Audio Reales */}
        <div className="w-full max-w-xs h-10 px-4">
          <canvas
            ref={canvasWaveformRef}
            width={320}
            height={40}
            className="w-full h-full opacity-80"
          />
        </div>
      </div>

      {/* 3. Subtítulos en Tiempo Real */}
      <div className="px-5 mb-4 z-20">
        <div className="glass-panel p-3.5 rounded-2xl border border-danonino-border/70 space-y-2 min-h-[72px] flex flex-col justify-center">
          {botSubtitle ? (
            <div className="flex items-start gap-2 animate-fade-in">
              <span className="text-[10px] uppercase font-bold text-danonino-cyan bg-danonino-cyan/10 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                Danonino
              </span>
              <p className="text-xs text-slate-100 leading-relaxed font-medium">
                {botSubtitle}
              </p>
            </div>
          ) : userSubtitle ? (
            <div className="flex items-start gap-2 animate-fade-in">
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                Tú
              </span>
              <p className="text-xs text-slate-300 italic">
                «{userSubtitle}»
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center italic">
              Habla libremente. Danonino te escucha en tiempo real.
            </p>
          )}
        </div>
      </div>

      {/* 4. Barra Ergonómica de Controles */}
      <div className="p-4 z-20">
        <div className="glass-panel p-3 rounded-3xl border border-danonino-border/80 flex items-center justify-around max-w-sm mx-auto shadow-2xl">
          {/* Silenciar Micrófono */}
          <button
            onClick={toggleMute}
            className={`p-3 rounded-2xl transition-all active:scale-95 ${
              isMicMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-danonino-card text-slate-200 border border-danonino-border hover:text-danonino-cyan'
            }`}
            title={isMicMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Activar/Desactivar Cámara */}
          <button
            onClick={toggleCamera}
            className={`p-3 rounded-2xl transition-all active:scale-95 ${
              cameraActive
                ? 'bg-danonino-cyan/20 text-danonino-cyan border border-danonino-cyan/50 shadow-neon'
                : 'bg-danonino-card text-slate-200 border border-danonino-border hover:text-danonino-cyan'
            }`}
            title="Cámara"
          >
            {cameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Compartir Pantalla */}
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-2xl transition-all active:scale-95 ${
              screenActive
                ? 'bg-danonino-violet/20 text-danonino-lavender border border-danonino-violet/50 shadow-neon'
                : 'bg-danonino-card text-slate-200 border border-danonino-border hover:text-danonino-cyan'
            }`}
            title="Compartir pantalla"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Chat durante la llamada */}
          <button
            onClick={() => setShowInCallChat(true)}
            className="p-3 rounded-2xl bg-danonino-card text-slate-200 border border-danonino-border hover:text-danonino-cyan transition-all active:scale-95 relative"
            title="Abrir chat en llamada"
          >
            <MessageSquare className="w-5 h-5" />
            {inCallMessages.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danonino-cyan" />
            )}
          </button>

          {/* Colgar llamada */}
          <button
            onClick={() => endLiveSession(true)}
            className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95"
            title="Finalizar llamada"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 5. Panel Deslizable de Chat durante la Llamada (Drawer) */}
      {showInCallChat && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col justify-end animate-fade-in">
          <div className="glass-panel h-[70vh] rounded-t-3xl border-t border-danonino-border/80 flex flex-col p-4 shadow-2xl">
            {/* Cabecera del Drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-danonino-border/60">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-danonino-cyan" />
                <h3 className="text-sm font-bold text-slate-100">Chat en Vivo</h3>
                <span className="text-[10px] text-danonino-cyan font-mono bg-danonino-cyan/10 px-2 py-0.5 rounded-full">
                  Llamada Activa
                </span>
              </div>
              <button
                onClick={() => setShowInCallChat(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mensajes en la llamada */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 no-scrollbar">
              {inCallMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-xs text-slate-500 italic">
                  Las transcripciones de la llamada y tus mensajes de texto aparecerán aquí.
                </div>
              ) : (
                inCallMessages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        msg.fromMe
                          ? 'bg-danonino-blue text-white rounded-tr-xs'
                          : 'bg-danonino-card border border-danonino-border text-slate-100 rounded-tl-xs'
                      }`}
                    >
                      <span className="text-[9px] font-bold block mb-0.5 opacity-70">
                        {msg.sender}
                      </span>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={inCallChatEndRef} />
            </div>

            {/* Formulario de texto rápido durante la llamada */}
            <form onSubmit={handleSendInCallChat} className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={inCallInput}
                onChange={(e) => setInCallInput(e.target.value)}
                placeholder="Escribe a Danonino..."
                className="flex-1 bg-danonino-card text-xs text-slate-100 px-3.5 py-2.5 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-cyan"
              />
              <button
                type="submit"
                disabled={!inCallInput.trim() || isSendingInCallChat}
                className="p-2.5 bg-danonino-cyan text-danonino-bg rounded-xl font-bold hover:opacity-90 active:scale-95 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
